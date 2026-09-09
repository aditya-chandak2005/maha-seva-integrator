import os
import json
import logging
from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.core.config import settings
from app.models import Service, Department
from app.schemas.assistant import (
    AssistantQueryRequest,
    AssistantQueryResponse,
    SuggestedService,
    AssistantMessage,
    KeyValidationRequest,
    KeyValidationResponse
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/assistant", tags=["Smart Service Assistant"])

# Multilingual keyword dictionary mapping intent terms across English, Marathi, and Hindi
INTENT_KEYWORDS = {
    "income": [
        "income certificate", "income proof", "income", "salary", "scholarship", "fees", "tahsildar", "tahsil", "patwari", "kamai",
        "उत्पन्नाचा दाखला", "उत्पन्न प्रमाणपत्र", "उत्पन्न", "उत्पन्नाचा", "तहसीलदार", "शिष्यवृत्ती",
        "आय प्रमाण पत्र", "आय प्रमाणपत्र", "आय प्रमाण", "आय", "आमदनी", "वेतन"
    ],
    "domicile": [
        "domicile certificate", "residence certificate", "domicile", "residence", "residential", "bonafide", "bonafide resident", "bonafide residence", "15 years", "mpsc", "nationality", "native", "mool niwas",
        "अधिवास प्रमाणपत्र", "राष्ट्रीयत्व प्रमाणपत्र", "अधिवास", "राष्ट्रीयत्व", "रहवासी", "वास्तव्य",
        "निवास प्रमाण पत्र", "मूल निवास प्रमाण पत्र", "मूल निवास", "निवास प्रमाण", "स्थानीय निवासी"
    ],
    "caste": [
        "caste", "social welfare", "sc", "st", "obc", "sebc", "tribal", "reservation",
        "जात", "जाती", "दाखला", "आरक्षण",
        "जाति", "जाति प्रमाण", "वर्ग प्रमाण"
    ],
    "land": [
        "land", "7/12", "satbara", "mutation", "ferfar", "property card", "record of rights", "ror", "khata",
        "जमीन", "सातबारा", "७/१२", "फेरफार", "गाव नमुना",
        "भूमि", "जमीन रिकॉर्ड", "खसरा", "खतौनी", "दाखिल खारिज", "नामांतरण"
    ],
    "birth": [
        "birth", "hospital", "newborn", "child", "discharge", "municipal", "infant",
        "जन्म", "नोंदणी", "बाळ", "रुग्णालय", "महानगरपालिका",
        "जन्म प्रमाण", "बच्चा", "शिशु", "अस्पताल", "नगर निगम"
    ],
    "water": [
        "water", "tap", "nal", "water connection", "plumbing", "pipe", "pipeline",
        "पाणी", "नळ", "नळ जोडणी", "नळपट्टी",
        "पानी", "नल", "जल कनेक्शन", "पेयजल", "जल आपूर्ति", "नल जल"
    ],
    "electricity": [
        "electricity", "power", "meter", "bescom", "light", "energy", "electrical", "electric",
        "वीज", "विद्युत", "मीटर", "विद्युत जोडणी", "वीज जोडणी",
        "बिजली", "विद्युत कनेक्शन", "मीटर कनेक्शन", "बिजली कनेक्शन"
    ],
    "trade": [
        "trade", "license", "shop", "establishment", "gumasta", "business", "commercial",
        "व्यापार", "दुकान", "परवाना", "गुमास्ता",
        "व्यापार लाइसेंस", "दुकान लाइसेंस", "उद्योग"
    ],
    "ration": [
        "ration", "food", "nfsa", "grain", "annapurna", "bpl", "apl", "civil supplies",
        "रेशन", "धान्य", "अन्नपूर्णा", "रेशन कार्ड",
        "राशन", "राशन कार्ड", "खाद्य सुरक्षा", "अन्न"
    ],
    "driving": [
        "driving", "driver", "license", "dl", "noc", "rto", "vehicle", "transport",
        "वाहन", "चालक", "परवाना", "आरटीओ",
        "ड्राइविंग लाइसेंस", "वाहन", "एनओसी", "परिवहन"
    ],
    "senior": [
        "senior", "citizen", "elderly", "aged", "pension", "old age", "vridha",
        "ज्येष्ठ", "नागरिक", "वृद्ध",
        "वरिष्ठ नागरिक", "बुजुर्ग", "वृद्ध पेंशन"
    ]
}

INTENT_DB_PATTERNS = {
    "income": ["income", "उत्पन्न", "आय"],
    "domicile": ["domicile", "residence", "resident", "bonafide", "mool niwas", "अधिवास", "निवास", "रहवासी"],
    "caste": ["caste", "जात", "जाति"],
    "land": ["land", "7/12", "satbara", "mutation", "ror", "khata", "जमीन", "सातबारा", "फेरफार", "भू", "खसरा", "खतियान", "jamabandi"],
    "birth": ["birth", "जन्म"],
    "water": ["water", "पाणी", "पानी", "जल"],
    "electricity": ["electricity", "power", "electric", "विद्युत", "वीज", "बिजली", "bescom"],
    "trade": ["trade", "license", "shop", "vyapar", "व्यापार"],
    "ration": ["ration", "food", "nfsa", "रेशन", "राशन"],
    "driving": ["driving", "driver", "dl", "चालक", "वाहन", "ड्राइविंग"],
    "senior": ["senior", "elderly", "pension", "ज्येष्ठ", "वरिष्ठ", "वृद्ध"]
}

def build_suggested_service(s: Service) -> SuggestedService:
    return SuggestedService(
        id=s.id,
        name=s.name,
        name_mr=s.name_mr,
        name_hi=s.name_hi,
        state_code=s.state_code or "MH",
        department_name=s.department.name if s.department else "Government Department",
        description=s.description,
        fee=s.fee,
        processing_days=s.processing_days
    )

def run_local_fallback(
    query_text: str,
    lang: str,
    state_code: Optional[str],
    db: Session
) -> AssistantQueryResponse:
    is_marathi = lang == "mr"
    is_hindi = lang == "hi"

    matched_services = []
    matched_ids = set()

    # Intent score and rank search
    scored_intents = []
    for intent, terms in INTENT_KEYWORDS.items():
        matches = [t for t in terms if t in query_text]
        if matches:
            scored_intents.append((intent, len(matches), max(len(t) for t in matches)))

    scored_intents.sort(key=lambda x: (x[1], x[2]), reverse=True)

    for intent, _, _ in scored_intents:
        patterns = INTENT_DB_PATTERNS.get(intent, [intent])
        q = db.query(Service).filter(Service.is_active == True)
        if state_code:
            q = q.filter(Service.state_code == state_code.upper())

        conditions = []
        for p in patterns:
            conditions.append(Service.name.ilike(f"%{p}%"))
            conditions.append(Service.description.ilike(f"%{p}%"))
            conditions.append(Service.code.ilike(f"%{p}%"))

        matches = q.filter(or_(*conditions)).all()

        for s in matches:
            if s.id not in matched_ids:
                matched_ids.add(s.id)
                matched_services.append(build_suggested_service(s))

    # General text search if no intent matched
    if not matched_services:
        q = db.query(Service).filter(Service.is_active == True)
        if state_code:
            q = q.filter(Service.state_code == state_code.upper())
        general_matches = q.filter(
            or_(
                Service.name.ilike(f"%{query_text}%"),
                Service.name_mr.ilike(f"%{query_text}%"),
                Service.name_hi.ilike(f"%{query_text}%"),
                Service.description.ilike(f"%{query_text}%")
            )
        ).limit(4).all()

        for s in general_matches:
            matched_services.append(build_suggested_service(s))

    # Rank matched services by query and intent relevance
    if matched_services:
        def compute_service_relevance(s: SuggestedService) -> int:
            score = 0
            search_corpus = f"{s.name} {s.name_mr or ''} {s.name_hi or ''} {s.description or ''}".lower()
            for token in query_text.split():
                if len(token) >= 2 and token in search_corpus:
                    score += 5
            for intent, _, _ in scored_intents:
                for term in INTENT_KEYWORDS.get(intent, []):
                    if term in search_corpus:
                        score += 3
            return score

        matched_services.sort(key=compute_service_relevance, reverse=True)

    # Formulate verified response message
    if matched_services:
        first = matched_services[0]
        if is_marathi:
            title = first.name_mr or first.name
            resp = (
                f"तुमच्या गरजेनुसार '{title}' (राज्य: {first.state_code}) ही अधिकृत शासकीय सेवा उपलब्ध आहे. "
                f"हा अर्ज {first.department_name} अंतर्गत येतो आणि अंदाजे {first.processing_days} दिवसांत पूर्ण होतो. "
                f"अधिक माहिती व अर्जासाठी खालील सेवेवर क्लिक करा."
            )
        elif is_hindi:
            title = first.name_hi or first.name
            resp = (
                f"आपकी आवश्यकता के अनुसार '{title}' (राज्य: {first.state_code}) आधिकारिक सरकारी सेवा उपलब्ध है। "
                f"यह सेवा {first.department_name} द्वारा संचालित है और लगभग {first.processing_days} दिनों में संसाधित होती है। "
                f"पात्रता व आवश्यक दस्तावेजों की जांच कर सीधे नीचे से आवेदन करें।"
            )
        else:
            resp = (
                f"Based on your query, the most suitable official service is '{first.name}' (State: {first.state_code}). "
                f"It is administered by the {first.department_name} with an estimated turnaround time of {first.processing_days} days. "
                f"You can review required documents and apply directly below."
            )
    else:
        if is_marathi:
            resp = (
                "क्षमस्व, तुमच्या शोध निकषांशी जुळणारी नेमकी शासकीय सेवा सापडली नाही. "
                "कृपया 'उत्पन्नाचा दाखला', 'अधिवास', 'जात प्रमाणपत्र', '७/१२ उतारा', 'जन्म नोंदणी' किंवा 'नळ जोडणी' यासारखे शब्द वापरा."
            )
        elif is_hindi:
            resp = (
                "क्षमा करें, आपकी खोज से मेल खाती सटीक सेवा नहीं मिल सकी। "
                "कृपया 'आय प्रमाण पत्र', 'मूल निवास', 'जाति प्रमाण पत्र', 'राशन कार्ड', 'बिजली कनेक्शन' या 'ड्राइविंग लाइसेंस' जैसे शब्दों से खोजें।"
            )
        else:
            resp = (
                "I could not find an exact match in the current public catalog. "
                "Try searching with standard terms like 'Income Certificate', 'Domicile Certificate', 'Caste Certificate', 'Ration Card', or 'Water Connection'."
            )

    return AssistantQueryResponse(
        response=resp,
        suggested_services=matched_services,
        engine="local-catalog-intelligence"
    )

@router.post("/validate-key", response_model=KeyValidationResponse)
def validate_gemini_key(data: KeyValidationRequest):
    key = (data.api_key or "").strip()
    if not key:
        return KeyValidationResponse(valid=False, message="API key cannot be empty.")
    try:
        from google import genai
        from google.genai import types
        client = genai.Client(api_key=key)
        resp = client.models.generate_content(
            model="gemini-2.5-flash",
            contents="Respond with only the single word: OK",
            config=types.GenerateContentConfig(max_output_tokens=5, temperature=0.0)
        )
        return KeyValidationResponse(
            valid=True,
            model="gemini-2.5-flash",
            message="Google Gemini 2.5 Flash connected and verified successfully!"
        )
    except Exception as e:
        err_msg = str(e)
        logger.warning(f"Gemini API key validation failed: {err_msg}")
        if "API_KEY_INVALID" in err_msg or "400" in err_msg or "invalid" in err_msg.lower():
            return KeyValidationResponse(valid=False, message="The provided Gemini API key is invalid or unauthorized.")
        return KeyValidationResponse(valid=False, message=f"Verification failed: {err_msg[:120]}")

@router.post("/chat", response_model=AssistantQueryResponse)
@router.post("/suggest", response_model=AssistantQueryResponse)
def query_assistant(data: AssistantQueryRequest, db: Session = Depends(get_db)):
    query_text = data.query.lower().strip()
    target_lang = (data.language or "en").lower()

    # Detect script if user typed Devanagari without switching language toggle
    has_devanagari = any(ord(c) >= 0x0900 and ord(c) <= 0x097F for c in query_text)
    if has_devanagari and target_lang == "en":
        if any(w in query_text for w in ["आहे", "हवा", "दाखला", "उतारा", "माझे", "कसा"]):
            target_lang = "mr"
        else:
            target_lang = "hi"

    # Determine Gemini API key (Client payload overrides server config / .env)
    effective_api_key = (data.api_key or "").strip() or (settings.GEMINI_API_KEY or "").strip() or os.getenv("GEMINI_API_KEY", "").strip()

    # If an API key is available, execute Gemini 2.5 Flash
    if effective_api_key:
        try:
            from google import genai
            from google.genai import types

            # Query all active services from DB to feed as strict catalog grounding
            services_query = db.query(Service).filter(Service.is_active == True)
            if data.state_code and data.state_code.upper() != "ALL":
                services_query = services_query.filter(Service.state_code == data.state_code.upper())
            all_services = services_query.all()

            catalog_summary = []
            for s in all_services:
                catalog_summary.append({
                    "id": s.id,
                    "code": s.code,
                    "state": s.state_code or "MH",
                    "name": s.name,
                    "name_mr": s.name_mr,
                    "name_hi": s.name_hi,
                    "department": s.department.name if s.department else "Department",
                    "fee": s.fee,
                    "processing_days": s.processing_days,
                    "description": s.description
                })

            system_instruction = (
                "You are the official Smart Citizen Service Assistant for the Maha-Seva Integrator portal "
                "(Smart India Hackathon 2026, PS-129). Your role is to help citizens find and understand "
                "official government public services across all 28 States and 8 Union Territories of India. "
                "CRITICAL RULES:\n"
                "1. Ground your answers ONLY on the provided official government services list. Never hallucinate fake services.\n"
                "2. Respond in the requested language ('en' = English, 'mr' = Marathi, 'hi' = Hindi). Keep tone helpful, official, polite, and conversational.\n"
                "3. In the 'response' field, provide a 2-4 sentence clear, friendly explanation answering the citizen's question or follow-up, covering: the recommended service, responsible state/department, estimated processing time, and government fees.\n"
                "4. In the 'matched_service_ids' array, return the integer IDs of the services that match the citizen's requirement (order by relevance, max 4).\n"
                "5. Always return strictly valid JSON matching the requested schema."
            )

            history_str = ""
            if data.history:
                history_str = "\nPrevious Conversation Context:\n"
                for msg in data.history[-6:]:
                    speaker = "Citizen" if msg.role == "user" else "Assistant"
                    history_str += f"{speaker}: {msg.content}\n"

            user_prompt = f"""{history_str}
Citizen Query: "{data.query}"
Target Language: "{target_lang}" (en=English, mr=Marathi, hi=Hindi)
Available Official Services Catalog:
{json.dumps(catalog_summary, ensure_ascii=False)}

Respond strictly in valid JSON format:
{{
  "response": "<explanation in {target_lang}>",
  "matched_service_ids": [<integer ids of matching services>]
}}"""

            client = genai.Client(api_key=effective_api_key)
            ai_response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=user_prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    response_mime_type="application/json",
                    temperature=0.2
                )
            )

            raw_text = (ai_response.text or "").strip()
            parsed = json.loads(raw_text)

            matched_ids = parsed.get("matched_service_ids", [])
            suggested = []
            if matched_ids:
                service_map = {s.id: s for s in all_services}
                for sid in matched_ids:
                    if sid in service_map:
                        suggested.append(build_suggested_service(service_map[sid]))

            # If Gemini didn't return any matched IDs, fall back to semantic search for suggestions
            if not suggested:
                return run_local_fallback(query_text, target_lang, data.state_code, db)

            return AssistantQueryResponse(
                response=parsed.get("response", ""),
                suggested_services=suggested,
                engine="gemini-2.5-flash"
            )

        except Exception as e:
            logger.warning(f"Gemini AI Assistant generation failed or key invalid: {e}. Falling back to local intelligence.")
            return run_local_fallback(query_text, target_lang, data.state_code, db)

    # If no API key provided, use the zero-crash local catalog intelligence
    return run_local_fallback(query_text, target_lang, data.state_code, db)
