import os
import re
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
    KeyValidationResponse,
    AssistantStatusResponse
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/assistant", tags=["Smart Service Assistant"])

# Multilingual keyword dictionary mapping intent terms across English, Marathi, and Hindi
INTENT_KEYWORDS = {
    "agriculture_scheme": [
        "pm-kusum", "kusum", "solar pump", "solar", "irrigation", "sinchayee", "drip", "sprinkler",
        "pm kisan", "kisan", "krishi", "farmer", "agriculture", "namo shetkari", "crop subsidy", "sheti",
        "सौर पंप", "कुसुम", "सिंचन", "ठिबक", "तुषार", "शेतकरी", "कृषि", "पीएम किसान", "नमो शेतकरी",
        "सोलर पंप", "सिंचाई", "ड्रिप", "स्प्रिंकलर", "किसान सम्मान निधि", "कृषि योजना"
    ],
    "scholarship_scheme": [
        "scholarship", "post matric", "pre matric", "nmmss", "pmsss", "hostel", "panjabrao", "punjabrao",
        "tuition fee", "freereceipt", "education allowance", "merit scholarship", "stipend", "vidyarthi",
        "शिष्यवृत्ती", "विद्यावेतन", "वसतिगृह", "निर्वाह भत्ता", "पंजाबराव", "मॅट्रिकोत्तर", "पोस्ट मॅट्रिक",
        "छात्रवृत्ति", "हॉस्टल भत्ता", "पोस्ट मैट्रिक", "मेरिट", "मेधावी", "वजीफा"
    ],
    "msme_scheme": [
        "mudra", "pmmy", "pm vishwakarma", "vishwakarma", "artisan", "standup india", "stand-up", "pmegp",
        "startup", "business loan", "capital subsidy", "entrepreneur", "toolkit", "shishu", "kishore", "tarun",
        "मुद्रा", "विश्वकर्मा", "उद्योजक", "व्यवसाय कर्ज", "टूलकिट", "पीएमईजीपी", "भांडवली अनुदान",
        "मुद्रा ऋण", "कारीगर", "शिल्पकार", "स्टार्टअप", "व्यवसाय लोन", "सब्सिडी", "स्टैंड अप इंडिया"
    ],
    "social_welfare_scheme": [
        "ladki bahin", "ladki", "bahin", "majhi ladki", "ayushman", "pmjay", "health card", "golden card",
        "pmay", "awas", "pucca house", "sanjay gandhi", "niradhar", "pension", "vridha", "divyang", "widow",
        "लाडकी बहीण", "माझी लाडकी", "आयुष्मान", "गोल्डन कार्ड", "घरकुल", "आवास योजना", "संजय गांधी निराधार", "पेन्शन",
        "लाडली बहना", "आयुष्मान भारत", "आवास", "पक्का मकान", "पेंशन", "निराधार", "वृद्धावस्था"
    ],
    "dbt_banking": [
        "dbt", "direct benefit transfer", "aadhaar link", "aadhaar seeding", "npci", "bank account", "bank link",
        "डीबीटी", "आधार लिंक", "बँक खाते", "एनपीसीआय", "आधार सीडिंग",
        "डीबीटी ट्रांसफर", "आधार बैंक लिंक", "एनपीसीआई मैपिंग", "खाता लिंक"
    ],
    "vault_autofill": [
        "vault", "personal vault", "autofill", "auto fill", "profile documents", "one click", "upload documents",
        "पर्सनल व्हॉल्ट", "ऑटोफिल", "दस्तऐवज", "कागदपत्रे अपलोड",
        "पर्सनल वॉल्ट", "ऑटोफिल", "दस्तावेज़ अपलोड", "प्रोफाइल"
    ],
    "income": [
        "income certificate", "income proof", "income", "salary", "tahsildar", "tahsil", "patwari", "kamai",
        "उत्पन्नाचा दाखला", "उत्पन्न प्रमाणपत्र", "उत्पन्न", "उत्पन्नाचा", "तहसीलदार",
        "आय प्रमाण पत्र", "आय प्रमाणपत्र", "आय प्रमाण", "आय", "आमदनी", "वेतन"
    ],
    "domicile": [
        "domicile certificate", "residence certificate", "domicile", "residence", "residential", "bonafide", "15 years", "nationality", "native", "mool niwas",
        "अधिवास प्रमाणपत्र", "राष्ट्रीयत्व प्रमाणपत्र", "अधिवास", "राष्ट्रीयत्व", "रहवासी", "वास्तव्य",
        "निवास प्रमाण पत्र", "मूल निवास प्रमाण पत्र", "मूल निवास", "निवास प्रमाण", "स्थानीय निवासी"
    ],
    "caste": [
        "caste certificate", "caste validity", "caste", "social welfare", "sc", "st", "obc", "sebc", "tribal", "reservation",
        "जात", "जाती", "दाखला", "जात पडताळणी", "आरक्षण",
        "जाति", "जाति प्रमाण", "वर्ग प्रमाण", "जाति सत्यापन"
    ],
    "land": [
        "land", "7/12", "satbara", "mutation", "ferfar", "property card", "record of rights", "ror", "khata", "khasra",
        "जमीन", "सातबारा", "७/१२", "फेरफार", "गाव नमुना",
        "भूमि", "जमीन रिकॉर्ड", "खसरा", "खतौनी", "दाखिल खारिज", "नामांतरण"
    ],
    "birth": [
        "birth certificate", "birth", "hospital", "newborn", "child", "discharge", "municipal", "infant",
        "जन्म", "नोंदणी", "बाळ", "रुग्णालय", "महानगरपालिका",
        "जन्म प्रमाण", "बच्चा", "शिशु", "अस्पताल", "नगर निगम"
    ],
    "water": [
        "water connection", "tap connection", "water", "nal", "plumbing", "pipeline",
        "पाणी", "नळ", "नळ जोडणी", "नळपट्टी",
        "पानी", "नल", "जल कनेक्शन", "पेयजल", "जल आपूर्ति", "नल जल"
    ],
    "electricity": [
        "electricity connection", "power", "meter", "bescom", "light", "energy", "electrical", "electric",
        "वीज", "विद्युत", "मीटर", "विद्युत जोडणी", "वीज जोडणी",
        "बिजली", "विद्युत कनेक्शन", "मीटर कनेक्शन", "बिजली कनेक्शन"
    ],
    "trade": [
        "trade license", "shop act", "gumasta", "establishment", "business license",
        "व्यापार", "दुकान", "परवाना", "गुमास्ता",
        "व्यापार लाइसेंस", "दुकान लाइसेंस", "उद्योग"
    ],
    "ration": [
        "ration card", "ration", "food security", "nfsa", "grain", "annapurna", "bpl", "apl",
        "रेशन", "धान्य", "अन्नपूर्णा", "रेशन कार्ड",
        "राशन", "राशन कार्ड", "खाद्य सुरक्षा", "अन्न"
    ],
    "driving": [
        "driving license", "driver license", "learner license", "dl", "noc", "rto", "vehicle", "transport",
        "वाहन", "चालक", "परवाना", "आरटीओ",
        "ड्राइविंग लाइसेंस", "वाहन", "एनओसी", "परिवहन"
    ],
    "senior": [
        "senior citizen card", "elderly pension", "aged pension", "vridha pension",
        "ज्येष्ठ नागरिक", "वृद्ध",
        "वरिष्ठ नागरिक", "बुजुर्ग", "वृद्ध पेंशन"
    ],
    "education": [
        "marksheet", "mark sheet", "marks", "marks card", "scorecard", "board", "cbse", "state board",
        "10th", "12th", "ssc", "hsc", "matric", "passing certificate", "migration certificate", "duplicate marksheet",
        "गुणपत्रिका", "मार्कशीट", "१० वी", "१२ वी", "एसएससी", "एचएससी", "शिक्षण मंडळ", "स्थलांतर प्रमाणपत्र",
        "अंकतालिका", "मार्कशीट", "10वीं", "12वीं", "हाईस्कूल", "इंटरमीडिएट", "बोर्ड", "सीबीएसई", "प्रव्रजन प्रमाण पत्र"
    ],
    "voter_election": [
        "voter id", "voter card", "election card", "epic", "voter registration", "form 6", "form 7", "form 8",
        "nvsp", "voter list", "electoral", "booth", "polling", "voter portal",
        "मतदार", "निवडणूक", "मतदार ओळखपत्र", "मतदार यादी", "नाव नोंदणी", "मतदान",
        "मतदाता पहचान पत्र", "वोटर कार्ड", "मतदाता सूची", "वोटर लिस्ट", "चुनाव आयोग", "मतदान कार्ड"
    ],
    "civil_registration": [
        "birth certificate", "death certificate", "marriage certificate", "birth", "death", "marriage",
        "newborn", "delayed registration", "municipal birth",
        "जन्म नोंदणी", "मृत्यू दाखला", "विवाह नोंदणी", "जन्म दाखला", "मृत्यू प्रमाणपत्र", "महानगरपालिका नोंदणी",
        "जन्म प्रमाण पत्र", "मृत्यु प्रमाण पत्र", "विवाह पंजीकरण", "शादी प्रमाण पत्र", "नगर निगम प्रमाण"
    ],
    "rti_grievance": [
        "rti", "right to information", "first appeal", "public information officer", "pio", "information commissioner",
        "grievance", "complaint", "consumer court", "consumer complaint", "mahiti adhikar",
        "माहिती अधिकार", "प्रथम अपील", "तक्रार निवारण", "ग्राहक मंच", "तक्रार",
        "सूचना का अधिकार", "प्रथम अपील", "जन शिकायत", "उपभोक्ता फोरम", "उपभोक्ता शिकायत", "आरटीआई"
    ],
    "cyber_safety": [
        "cyber crime", "cyber fraud", "1930", "digital arrest", "otp fraud", "phishing", "cyber helpline",
        "bank fraud", "scam", "lost phone", "ceir", "online cheat",
        "सायबर गुन्हा", "सायबर फसवणूक", "ऑनलाइन फसवणूक", "सायबर हेल्पलाइन", "डिजिटल फ्रॉड",
        "साइबर अपराध", "डिजिटल अरेस्ट", "ओटीपी फ्रॉड", "साइबर हेल्पलाइन", "ऑनलाइन धोखाधड़ी"
    ]
}

INTENT_DB_PATTERNS = {
    "agriculture_scheme": ["kusum", "sinchayee", "irrigation", "kisan", "krishi", "farmer", "शेती", "किसान", "सोलर"],
    "scholarship_scheme": ["scholarship", "nmmss", "post-matric", "matric", "pmsss", "panjabrao", "hostel", "शिष्यवृत्ती", "छात्रवृत्ति"],
    "msme_scheme": ["mudra", "vishwakarma", "standup", "pmegp", "msme", "artisan", "उद्योग", "मुद्रा", "कारीगर"],
    "social_welfare_scheme": ["ladki bahin", "ayushman", "pmjay", "pmay", "awas", "sanjay gandhi", "niradhar", "लाडकी", "आयुष्मान", "घरकुल"],
    "dbt_banking": ["kisan", "ladki bahin", "scholarship", "niradhar", "mudra"],
    "vault_autofill": ["domicile", "income", "caste", "ration", "marksheet"],
    "income": ["income", "उत्पन्न", "आय"],
    "domicile": ["domicile", "residence", "resident", "bonafide", "mool niwas", "अधिवास", "निवास", "रहवासी"],
    "caste": ["caste", "जात", "जाति"],
    "land": ["land", "7/12", "satbara", "mutation", "ror", "khata", "जमीन", "सातबारा", "फेरफार", "भू", "खसरा"],
    "birth": ["birth", "जन्म"],
    "water": ["water", "पाणी", "पानी", "जल"],
    "electricity": ["electricity", "power", "electric", "विद्युत", "वीज", "बिजली", "bescom"],
    "trade": ["trade", "license", "shop", "vyapar", "व्यापार"],
    "ration": ["ration", "food", "nfsa", "रेशन", "राशन"],
    "driving": ["driving", "driver", "dl", "चालक", "वाहन", "ड्राइविंग"],
    "senior": ["senior", "elderly", "pension", "ज्येष्ठ", "वरिष्ठ", "वृद्ध"],
    "education": ["marksheet", "cbse", "board", "scholarship", "education", "school", "passing", "गुणपत्रिका", "शिक्षण", "अंकतालिका"],
    "voter_election": ["resident", "domicile", "voter", "निवडणूक", "मतदार"],
    "civil_registration": ["birth", "जन्म"],
    "rti_grievance": ["grievance", "service", "public", "सेवा", "तक्रार"],
    "cyber_safety": ["police", "home", "grievance", "सुरक्षा"]
}

def build_suggested_service(s: Service) -> SuggestedService:
    docs = s.documents_required if isinstance(s.documents_required, list) else []
    return SuggestedService(
        id=s.id,
        code=s.code,
        name=s.name,
        name_mr=s.name_mr,
        name_hi=s.name_hi,
        state_code=s.state_code or "MH",
        department_name=s.department.name if s.department else "Government Department",
        description=s.description,
        fee=s.fee,
        processing_days=s.processing_days,
        service_type=s.service_type or "DOCUMENT",
        scheme_type=s.scheme_type,
        benefit_amount=s.benefit_amount,
        documents_required=docs,
        eligibility=s.eligibility
    )

def find_semantic_services(query_text: str, state_code: Optional[str], db: Session) -> List[SuggestedService]:
    """Retrieve and rank the most relevant services or schemes from database."""
    query_text = (query_text or "").lower().strip()
    matched_services = []
    matched_ids = set()

    scored_intents = []
    for intent, terms in INTENT_KEYWORDS.items():
        matches = [t for t in terms if t in query_text]
        if matches:
            scored_intents.append((intent, len(matches), max(len(t) for t in matches)))

    scored_intents.sort(key=lambda x: (x[1], x[2]), reverse=True)

    for intent, _, _ in scored_intents:
        patterns = INTENT_DB_PATTERNS.get(intent, [intent])
        q = db.query(Service).filter(Service.is_active == True)
        if state_code and state_code.upper() != "ALL":
            if state_code.upper() == "CENTRAL":
                q = q.filter(Service.state_code == "CENTRAL")
            else:
                q = q.filter(or_(Service.state_code == state_code.upper(), Service.state_code == "CENTRAL"))

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
        if state_code and state_code.upper() != "ALL":
            if state_code.upper() == "CENTRAL":
                q = q.filter(Service.state_code == "CENTRAL")
            else:
                q = q.filter(or_(Service.state_code == state_code.upper(), Service.state_code == "CENTRAL"))
        general_matches = q.filter(
            or_(
                Service.name.ilike(f"%{query_text}%"),
                Service.name_mr.ilike(f"%{query_text}%"),
                Service.name_hi.ilike(f"%{query_text}%"),
                Service.description.ilike(f"%{query_text}%")
            )
        ).limit(5).all()

        for s in general_matches:
            matched_services.append(build_suggested_service(s))

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
        matched_services = matched_services[:5]

    return matched_services

def generate_rich_local_knowledge(
    query_text: str,
    lang: str,
    matched_services: List[SuggestedService]
) -> str:
    """Generate structured, LLM-grade multi-paragraph markdown response based on user intent."""
    query_text = query_text.lower().strip()
    is_marathi = lang == "mr"
    is_hindi = lang == "hi"

    # Check for specific domain queries
    is_doc_query = any(w in query_text for w in [
        "document", "documents", "papers", "checklist", "proof", "what is required",
        "कागदपत्रे", "कागदपत्र", "दाखले", "काय लागते",
        "दस्तावेज", "दस्तावेज़", "कागजात", "क्या चाहिए", "प्रमाण"
    ])

    # 1. Agriculture / Solar / Irrigation
    if any(w in query_text for w in ["kusum", "solar", "irrigation", "sinchayee", "kisan", "farmer", "agriculture", "शेती", "शेतकरी", "सोलर", "सिंचन", "किसान", "सिंचाई"]):
        if is_marathi:
            return (
                "### 🌾 शेतकरी व कृषी योजनांविषयी सविस्तर मार्गदर्शन\n\n"
                "शासनाने शेतकऱ्यांना सिंचन, वीज व आर्थिक सुरक्षा पुरवण्यासाठी खालील महत्त्वाच्या योजना कार्यान्वित केल्या आहेत:\n\n"
                "| योजना / उपक्रम | आर्थिक लाभ व शासकीय अनुदान | पात्रता निकष | आवश्यक कागदपत्रे सूची |\n"
                "| :--- | :--- | :--- | :--- |\n"
                "| **पीएम-कुसुम सोलर कृषी पंप** | ३ HP, ५ HP व ७.५ HP पंपांवर **६०% थेट शासकीय अनुदान** | शेतजमीन स्वतःच्या नावावर असणारे शेतकरी व खात्रीशीर पाण्याची उपलब्धता | • चालू ७/१२ व ८-अ उतारा<br/>• आधार कार्ड<br/>• आधार लिंक बँक पासबुक (DBT)<br/>• पाण्याचा स्रोत दाखला<br/>• पासपोर्ट फोटो |\n"
                "| **पीएम कृषी सिंचन योजना (PMKSY)** | ठिबक व तुषार सिंचन संचावर **४५% ते ५५% भांडवली अनुदान** | लहान, अल्पभूधारक व इतर शेतकरी | • चालू ७/१२ उतारा<br/>• सिंचन साहित्याचे जीएसटी कोटेशन<br/>• वीज बिल / सोलर बिल<br/>• बँक पासबुक |\n"
                "| **पीएम किसान सन्मान निधी (DBT)** | वार्षिक **₹६,०००/- थेट बँक खात्यात** (दर ४ महिन्यांनी ₹२,००० चे ३ हप्ते) | शेतजमीनधारक शेतकरी कुटुंबे | • आधार संलग्न बँक खाते (NPCI)<br/>• ७/१२ जमीन मालकी पुरावा<br/>• ई-केवायसी (e-KYC) |\n\n"
                "💡 **महत्त्वाची सूचना:** अनुदानाचा लाभ थेट बँक खात्यात जमा होण्यासाठी आपले बँक खाते **आधार-सीडेड (NPCI DBT Active)** असणे बंधनकारक आहे. "
                "आपण महा-सेवा पोर्टलवरून 'पर्सनल व्हॉल्ट'द्वारे आवश्यक कागदपत्रे १-क्लिकमध्ये ऑटोफिल करून त्वरित अर्ज करू शकता."
            )
        elif is_hindi:
            return (
                "### 🌾 कृषि एवं किसान कल्याण योजनाओं की संपूर्ण जानकारी\n\n"
                "केंद्र एवं राज्य सरकारों द्वारा किसानों के लिए सिंचाई, सौर ऊर्जा एवं आर्थिक सुरक्षा हेतु प्रमुख योजनाएं संचालित हैं:\n\n"
                "| योजना / पहल | आर्थिक लाभ एवं सरकारी सब्सिडी | पात्रता मानदंड | आवश्यक दस्तावेज़ सूची |\n"
                "| :--- | :--- | :--- | :--- |\n"
                "| **पीएम-कुसुम सोलर पंप योजना** | 3HP, 5HP और 7.5HP सौर पंप पर **60% तक सरकारी सब्सिडी** | वैध कृषि भूमि (7/12 / खसरा) स्वामित्व व सुनिश्चित जल स्रोत | • 7/12 अथवा भूलेख खसरा/खतौनी<br/>• आधार कार्ड<br/>• बैंक पासबुक (DBT सक्रिय)<br/>• जल स्रोत प्रमाण पत्र<br/>• पासपोर्ट फोटो |\n"
                "| **प्रधानमंत्री कृषि सिंचाई योजना** | ड्रिप एवं स्प्रिंकलर प्रणाली पर **45% से 55% तक अनुदान** | लघु, सीमांत एवं सामान्य श्रेणी के किसान | • भूलेख नकल (7/12)<br/>• उपकरण का अधिकृत जीएसटी कोटेशन<br/>• बैंक पासबुक<br/>• आधार कार्ड |\n"
                "| **पीएम किसान सम्मान निधि** | वार्षिक **₹6,000/- की आर्थिक सहायता** (₹2,000 की 3 किश्तें) | कृषि भूमि धारक पात्र किसान परिवार | • आधार लिंक बैंक खाता (NPCI)<br/>• भूमि स्वामित्व प्रमाण (खसरा/7/12)<br/>• ई-केवाईसी (e-KYC) |\n\n"
                "💡 **विशेष सलाह:** सरकारी सब्सिडी बिना रुकावट पाने के लिए अपना बैंक खाता **आधार एवं NPCI मैपिंग** से लिंक रखें। "
                "महा-सेवा पोर्टल पर 'पर्सनल वॉल्ट' से अपने दस्तावेज ऑटोफिल कर सीधे नीचे से आवेदन करें।"
            )
        else:
            return (
                "### 🌾 Comprehensive Guide to Agricultural & Solar Subsidy Schemes\n\n"
                "The Central and State Governments provide extensive subsidies to empower farmers with clean energy, modern irrigation, and direct income support:\n\n"
                "| Scheme / Initiative | Financial Benefit & Subsidy | Eligibility Criteria | Required Documents Checklist |\n"
                "| :--- | :--- | :--- | :--- |\n"
                "| **PM-KUSUM Solar Agriculture Pump** | **Up to 60% government subsidy** (30% Central + 30% State) on 3HP, 5HP, and 7.5HP off-grid/grid solar pumps | Farmers with agricultural land title in their name and verified water access | • Latest 7/12 & 8A Land Extract (or RoR/Khatauni)<br/>• Aadhaar Card<br/>• Active Bank Passbook with DBT<br/>• Water Source Certificate<br/>• Passport Photo |\n"
                "| **PMKSY Micro-Irrigation (Per Drop More Crop)** | **45% to 55% capital subsidy** on micro-irrigation systems (Drip and Sprinkler installations) | Small, marginal & general category farmers with agricultural land | • Land records (7/12)<br/>• Equipment GST Quotation from authorized dealer<br/>• Bank Passbook<br/>• Aadhaar Card |\n"
                "| **PM-KISAN Samman Nidhi** | **₹6,000/year direct cash transfer** credited into Aadhaar-seeded bank accounts in 3 equal installments | Landholding farmer families with active DBT bank seeding | • Aadhaar-seeded Bank Account<br/>• Land Ownership Proof (7/12 / RoR)<br/>• e-KYC Verification |\n\n"
                "💡 **Pro-Tip:** Ensure your bank account has **NPCI Aadhaar Seeding active** for seamless DBT credit. "
                "Use the **Personal Vault** on Maha-Seva to 1-click auto-fill your documents and apply directly below."
            )

    # 2. Scholarships / Education
    if any(w in query_text for w in ["scholarship", "nmmss", "post matric", "pmsss", "hostel", "panjabrao", "marksheet", "शिष्यवृत्ती", "गुणपत्रिका", "मार्कशीट", "छात्रवृत्ति", "अंकतालिका"]):
        if is_marathi:
            return (
                "### 🎓 शैक्षणिक शिष्यवृत्ती व गुणपत्रिका पडताळणी मार्गदर्शक\n\n"
                "विद्यार्थ्यांसाठी केंद्र व राज्य शासनाचे प्रमुख शिष्यवृत्ती कार्यक्रम खालीलप्रमाणे आहेत:\n\n"
                "| शिष्यवृत्ती योजना | आर्थिक लाभ | पात्रता निकष | आवश्यक कागदपत्रे सूची |\n"
                "| :--- | :--- | :--- | :--- |\n"
                "| **मॅट्रिकोत्तर शिष्यवृत्ती (SC/ST/OBC/EBC)** | शिक्षण शुल्क व परीक्षा शुल्काची **१००% प्रतिपूर्ती** + दरमहा वसतिगृह भत्ता | मान्यताप्राप्त पदवी/डिप्लोमा अभ्यासक्रमात प्रवेशित; कौटुंबिक उत्पन्न मर्यादा: ₹२.५० लाख (SC/ST) किंवा ₹८.०० लाख (OBC) | • १० वी/१२ वी गुणपत्रिका<br/>• कॉलेज बोनाफाईड व फी पावती<br/>• तहसीलदार उत्पन्नाचा दाखला<br/>• जात प्रमाणपत्र व जात पडताळणी<br/>• अधिवास प्रमाणपत्र<br/>• आधार लिंक बँक पासबुक |\n"
                "| **राष्ट्रीय गुणवत्ता शिष्यवृत्ती (NMMSS)** | इयत्ता ९ वी ते १२ वी पर्यंत **वार्षिक ₹१२,०००/- शिष्यवृत्ती** | शासकीय/अनुदानित शाळेतील गुणवंत विद्यार्थी | • मागील इयत्तेची गुणपत्रिका<br/>• शाळा बोनाफाईड प्रमाणपत्र<br/>• कौटुंबिक उत्पन्न दाखला |\n"
                "| **डॉ. पंजाबराव देशमुख वसतिगृह भत्ता** | वसतिगृह खर्चासाठी **वार्षिक ₹३०,०००/- पर्यंत भत्ता** | लहान व अल्पभूधारक शेतकरी कुटुंबातील उच्च शिक्षण घेणारे विद्यार्थी | • अल्पभूधारक शेतकरी दाखला<br/>• कॉलेज प्रवेश पावती<br/>• बँक पासबुक |\n"
                "| **डिजिटल गुणपत्रिका व स्थलांतर दाखला** | डिजीलॉकरवर तात्काळ उपलब्ध डिजिटल पडताळणी प्रमाणपत्र | राज्य मंडळ / सीबीएसई चे अधिकृत विद्यार्थी | • परीक्षा रोल नंबर / बैठक क्रमांक<br/>• आधार पडताळणी |\n\n"
                "💡 **महत्त्वाची सूचना:** महा-सेवा पोर्टलवरील 'पर्सनल व्हॉल्ट' मध्ये आपली शैक्षणिक कागदपत्रे जोडून १-क्लिकमध्ये थेट अर्ज करा."
            )
        elif is_hindi:
            return (
                "### 🎓 सरकारी छात्रवृत्ति एवं अंकतालिका सत्यापन मार्गदर्शिका\n\n"
                "विद्यार्थियों हेतु केंद्र एवं राज्य सरकारों की प्रमुख छात्रवृत्ति योजनाएं निम्नानुसार हैं:\n\n"
                "| छात्रवृत्ति योजना | आर्थिक लाभ | पात्रता मानदंड | आवश्यक दस्तावेज़ सूची |\n"
                "| :--- | :--- | :--- | :--- |\n"
                "| **पोस्ट मैट्रिक छात्रवृत्ति (SC/ST/OBC)** | शिक्षण शुल्क एवं परीक्षा शुल्क की **100% प्रतिपूर्ति** + मासिक निर्वाह भत्ता | मान्यताप्राप्त संस्थान में 10वीं के बाद उच्च शिक्षा; पारिवारिक वार्षिक आय सीमा: ₹2.50 लाख (SC/ST) या ₹8.00 लाख (OBC) | • 10वीं/12वीं अंकतालिका<br/>• कॉलेज बोनाफाइड एवं शुल्क रसीद<br/>• तहसीलदार आय प्रमाण पत्र<br/>• जाति प्रमाण पत्र एवं वैधता<br/>• मूल निवास (Domicile) प्रमाण पत्र<br/>• आधार लिंक बैंक खाता |\n"
                "| **नेशनल मीन्स-कम-मेरिट (NMMSS)** | कक्षा 9 से 12 तक प्रतिवर्ष **₹12,000/- की छात्रवृत्ति** | मान्यताप्राप्त विद्यालय के मेधावी छात्र | • पूर्व कक्षा की अंकतालिका<br/>• स्कूल बोनाफाइड प्रमाण पत्र<br/>• परिवार का आय प्रमाण पत्र |\n"
                "| **प्रधानमंत्री विशेष छात्रवृत्ति (PMSSS)** | व्यावसायिक पाठ्यक्रमों हेतु **₹3.00 लाख तक शिक्षण शुल्क** + **₹1.00 लाख वार्षिक छात्रावास भत्ता** | एआईसीटीई मानदंडों के तहत पात्र छात्र | • 12वीं बोर्ड अंकतालिका<br/>• प्रवेश आवंटन पत्र<br/>• निवास एवं श्रेणी प्रमाण पत्र |\n"
                "| **डिजिटल अंकतालिका व माइग्रेशन** | डिजिलॉकर के माध्यम से वैध डिजिटल मार्कशीट तुरंत उपलब्ध | सीबीएसई / स्टेट बोर्ड के पंजीकृत छात्र | • रोल नंबर / छात्र पहचान पत्र<br/>• आधार सत्यापन |\n\n"
                "💡 **विशेष सलाह:** महा-सेवा पोर्टल पर 'पर्सनल वॉल्ट' से अपने दस्तावेज 1-क्लिक ऑटोफिल कर सीधे आवेदन करें।"
            )
        else:
            return (
                "### 🎓 Comprehensive Guide to Educational Scholarships & Marksheet Services\n\n"
                "Government scholarship schemes provide full tuition waivers, examination fee reimbursements, and living stipends for deserving students:\n\n"
                "| Scholarship Scheme | Scholarship Benefit | Eligibility Criteria | Required Documents Checklist |\n"
                "| :--- | :--- | :--- | :--- |\n"
                "| **Central & State Post-Matric Scholarships** | **100% Tuition & Mandatory Fees Reimbursement** + Monthly Maintenance Allowance | Post-matric (10th+) diploma/degree students; Income <= ₹2.50L (SC/ST) or <= ₹8.00L (OBC) | • Previous Year Marksheet (10th/12th)<br/>• College Bonafide & Fee Receipt<br/>• Income Certificate (Tahsildar)<br/>• Caste & Validity Certificate<br/>• Domicile Certificate<br/>• Aadhaar-seeded Bank Passbook |\n"
                "| **National Means-cum-Merit (NMMSS)** | **₹12,000 / year stipend** for students studying in classes 9 to 12 | Meritorious students from recognized government / aided schools | • Previous Grade Scorecard<br/>• School Bonafide Certificate<br/>• Family Income Proof |\n"
                "| **Prime Minister's Special Scholarship (PMSSS)** | Up to **₹3.00 Lakhs academic fees** + **₹1.00 Lakh annual maintenance** | Professional course aspirants meeting AICTE criteria | • 12th Board Scorecard<br/>• AICTE Allotment Letter<br/>• Domicile & Category Certificate |\n"
                "| **Digital Marksheet & Migration Services** | Legally recognized digital certificates via DigiLocker / Board Portal | Any registered board student (State Board / CBSE) | • Roll Number / Student ID<br/>• Aadhaar Verification |\n\n"
                "💡 **Pro-Tip:** Attach your verified caste, income, and educational documents instantly using Maha-Seva's **Personal Vault 1-Click Auto-Fill** below."
            )

    # 3. MSME, Artisans, Loans (Mudra, Vishwakarma, Stand-Up, PMEGP)
    if any(w in query_text for w in ["mudra", "vishwakarma", "standup", "stand-up", "pmegp", "artisan", "business loan", "msme", "मुद्रा", "विश्वकर्मा", "उद्योजक", "कर्ज", "कारीगर", "लोन"]):
        if is_marathi:
            return (
                "### 🏭 उद्योग, कारागीर व व्यवसाय कर्ज योजनांविषयी माहिती\n\n"
                "स्वयंरोजगार आणि सूक्ष्म व मध्यम व्यवसायांच्या वाढीसाठी केंद्र शासनाचे प्रमुख आर्थिक कार्यक्रम खालीलप्रमाणे आहेत:\n\n"
                "| योजना / कर्ज प्रकार | आर्थिक मर्यादा व लाभ | व्याजदर व शासकीय अनुदान | आवश्यक कागदपत्रे सूची |\n"
                "| :--- | :--- | :--- | :--- |\n"
                "| **प्रधानमंत्री मुद्रा योजना (PMMY MUDRA)** | कोणत्याही तारणाशिवाय **₹१० लाखांपर्यंत कर्ज** (शिशु: ₹५० हजार, किशोर: ₹५ लाख, तरुण: ₹१० लाख) | सुलभ व्यावसायिक व्याजदर, शून्य तारण | • आधार कार्ड व पॅन कार्ड<br/>• व्यवसाय पत्ता पुरावा (गुमास्ता)<br/>• मागील ६ महिन्यांचे बँक स्टेटमेंट<br/>• व्यवसाय प्रकल्प अहवाल (DPR) |\n"
                "| **पीएम विश्वकर्मा योजना** | पारंपारिक १८ कारागिरांसाठी **₹१५,००० मोफत टूलकिट व्हाउचर** + प्रशिक्षण (दररोज ₹५०० भत्ता) | केवळ **५% सवलतीच्या व्याजदरात** ₹३ लाखांपर्यंत तारणमुक्त कर्ज | • आधार कार्ड<br/>• कारागीर स्वयंघोषणा (१८ पारंपरिक व्यवसाय)<br/>• बँक पासबुक<br/>• रेशन कार्ड |\n"
                "| **PMEGP भांडवली अनुदान** | उत्पादन व्यवसायासाठी ₹५० लाख व सेवेसाठी ₹२० लाखांपर्यंत प्रकल्प | **१५% ते ३५% थेट भांडवली शासकीय अनुदान** | • EDP प्रशिक्षण प्रमाणपत्र<br/>• प्रकल्प अहवाल (Project Report)<br/>• शैक्षणिक व जात प्रमाणपत्र |\n"
                "| **स्टँड-अप इंडिया** | महिला आणि SC/ST उद्योजकांसाठी **₹१० लाख ते ₹१ कोटी** ग्रीनफिल्ड बँक कर्ज | स्पर्धात्मक बँक व्याजदर | • SC/ST किंवा महिला उद्योजक<br/>• नवीन ग्रीनफिल्ड प्रकल्प प्रस्ताव |\n\n"
                "💡 **महत्त्वाची सूचना:** व्यवसाय नोंदणी आणि बँक कागदपत्रे पर्सनल व्हॉल्टमध्ये सुरक्षित ठेवा आणि जलद मंजुरीसाठी खालील सेवेवरून अर्ज करा."
            )
        elif is_hindi:
            return (
                "### 🏭 एमएसएमई, शिल्पकला एवं व्यवसाय ऋण योजनाओं की जानकारी\n\n"
                "स्वरोजगार एवं व्यवसाय स्थापना हेतु केंद्र सरकार द्वारा संचालित प्रमुख योजनाएं:\n\n"
                "| योजना / ऋण श्रेणी | वित्तीय सीमा एवं लाभ | ब्याज दर एवं सब्सिडी | आवश्यक दस्तावेज़ सूची |\n"
                "| :--- | :--- | :--- | :--- |\n"
                "| **प्रधानमंत्री मुद्रा योजना (PMMY MUDRA)** | बिना किसी बंधक (Collateral-Free) के **₹10 लाख तक का ऋण** (शिशु: ₹50 हजार, किशोर: ₹5 लाख, तरुण: ₹10 लाख) | रियायती वाणिज्यिक दर, शून्य गारंटी | • आधार कार्ड एवं पैन कार्ड<br/>• व्यवसाय स्थल प्रमाण (दुकान लाइसेंस)<br/>• 6 माह का बैंक विवरण<br/>• प्रोजेक्ट रिपोर्ट (DPR) |\n"
                "| **पीएम विश्वकर्मा योजना** | 18 पारंपरिक कारीगरों हेतु **₹15,000 का टूलकिट वाउचर** + निःशुल्क प्रशिक्षण (₹500/दिन वजीफा) | मात्र **5% रियायती ब्याज दर** पर ₹3 लाख तक का ऋण | • आधार कार्ड<br/>• कारीगर स्व-घोषणा पत्र<br/>• बैंक पासबुक<br/>• राशन कार्ड |\n"
                "| **PMEGP पूंजीगत सब्सिडी** | विनिर्माण हेतु ₹50 लाख एवं सेवा हेतु ₹20 लाख तक की परियोजनाएं | **15% से 35% तक प्रत्यक्ष सरकारी सब्सिडी** | • ईडीपी प्रशिक्षण प्रमाण पत्र<br/>• विस्तृत प्रोजेक्ट रिपोर्ट<br/>• शैक्षणिक एवं श्रेणी प्रमाण पत्र |\n"
                "| **स्टैंड-अप इंडिया** | महिला एवं SC/ST उद्यमियों हेतु **₹10 लाख से ₹1 करोड़** तक का बैंक ऋण | बैंक ऋण मानक दरें | • SC/ST अथवा महिला उद्यमी<br/>• ग्रीनफील्ड उद्यम प्रस्ताव |\n\n"
                "💡 **विशेष सलाह:** अपने व्यवसाय दस्तावेज 'पर्सनल वॉल्ट' में सुरक्षित रखें एवं सीधे नीचे दिए गए कार्ड से आवेदन करें।"
            )
        else:
            return (
                "### 🏭 Comprehensive Guide to MSME, Artisan & Business Credit Schemes\n\n"
                "The Government offers collateral-free loans, modern toolkit grants, and capital subsidies to foster self-employment and small businesses:\n\n"
                "| Scheme / Credit Line | Financial Benefit & Loan Bracket | Interest Rate & Subsidy | Key Requirements & Documents |\n"
                "| :--- | :--- | :--- | :--- |\n"
                "| **PMMY MUDRA Loan** | Up to **₹10.00 Lakhs Collateral-Free Credit** (Shishu: up to ₹50k, Kishore: ₹50k-₹5L, Tarun: ₹5L-₹10L) | Attractive commercial rates with zero collateral | • Aadhaar & PAN Card<br/>• Business Address Proof (Gumasta)<br/>• 6 Months Bank Statement<br/>• Detailed Project Report (DPR) |\n"
                "| **PM Vishwakarma Kaushal Samman** | **₹15,000 Digital Toolkit Voucher** + Free Skill Training (₹500/day stipend) | Subsidized **5% Interest Rate** on up to ₹3.00 Lakhs credit | • Aadhaar Card<br/>• Artisan Self-Declaration in 18 Trades<br/>• Bank Passbook<br/>• Ration Card |\n"
                "| **PMEGP Capital Subsidy** | Credit-linked subsidy on projects up to ₹50 Lakhs (Manufacturing) or ₹20 Lakhs (Services) | **15% to 35% Direct Capital Subsidy** | • EDP Training Certificate<br/>• Project Report<br/>• Educational & Category Certificate |\n"
                "| **Stand-Up India** | Greenfield bank loans from **₹10 Lakhs to ₹1.00 Crore** | Competitive bank lending rates | • SC/ST or Woman Entrepreneur<br/>• Greenfield enterprise proposal |\n\n"
                "💡 **Pro-Tip:** Keep your business registration and bank records updated in your Personal Vault for rapid loan appraisal."
            )

    # 4. Social Welfare (Ladki Bahin, Ayushman Bharat, PMAY, Sanjay Gandhi)
    if any(w in query_text for w in ["ladki bahin", "ayushman", "pmjay", "pmay", "awas", "niradhar", "sanjay gandhi", "pension", "health card", "लाडकी", "आयुष्मान", "घरकुल", "निराधार", "पेन्शन", "आवास"]):
        if is_marathi:
            return (
                "### 👩 सामाजिक सुरक्षा, महिला सक्षमीकरण व आरोग्य योजना\n\n"
                "महाराष्ट्र शासन व केंद्र शासनाने वंचित नागरिक, महिला व ज्येष्ठांसाठी खालील कल्याणकारी योजना सुरू केल्या आहेत:\n\n"
                "| कल्याणकारी योजना | आर्थिक व आरोग्य लाभ | लाभार्थी पात्रता निकष | अनिवार्य कागदपत्रे सूची |\n"
                "| :--- | :--- | :--- | :--- |\n"
                "| **मुख्यमंत्री माझी लाडकी बहीण योजना** | दरमहा **₹१,५००/- (वार्षिक ₹१८,०००/-)** थेट महिलांच्या बँक खात्यात डीबीटी | २१ ते ६५ वयोगटातील विवाहित/घटस्फोटित/निराधार महिला; कौटुंबिक वार्षिक उत्पन्न <= ₹२.५० लाख | • आधार कार्ड<br/>• महाराष्ट्र अधिवास दाखला (किंवा १५ वर्षे वास्तव्याचा पुरावा)<br/>• उत्पन्नाचा दाखला / पिवळे-केशरी रेशन कार्ड<br/>• आधार लिंक बँक पासबुक<br/>• हमीपत्र |\n"
                "| **आयुष्मान भारत (PM-JAY गोल्डन कार्ड)** | देशभरातील नोंदणीकृत रुग्णालयांमध्ये **वार्षिक ₹५,००,०००/- पर्यंत मोफत व कॅशलेस उपचार** | सामाजिक-आर्थिक सर्वेक्षण (SECC) पात्र कुटुंबे / रेशन कार्ड धारक | • आधार कार्ड<br/>• शिधापत्रिका (रेशन कार्ड)<br/>• नोंदणीकृत मोबाइल नंबर |\n"
                "| **प्रधानमंत्री आवास योजना - ग्रामीण (PMAY-G)** | पक्के घर बांधण्यासाठी **₹१,२०,०००/- थेट शासकीय अनुदान** + ९० दिवसांची मनरेगा मजुरी + ₹१२,००० शौचालय अनुदान | बेघर व कच्चे घर असणारे ग्रामीण नागरिक | • जागा / प्लॉट मालकी कागदपत्र<br/>• मनरेगा जॉब कार्ड<br/>• बँक पासबुक<br/>• आधार कार्ड |\n"
                "| **संजय गांधी निराधार अनुदान योजना** | निराधार, विधवा व दिव्यांगांना दरमहा **₹१,५००/- निवृत्तीवेतन** | निराधार व्यक्ती, दिव्यांग व कुटुंब आधार नसलेले वृद्ध नागरिक | • वैद्यकीय / दिव्यांग प्रमाणपत्र<br/>• वय व वास्तव्याचा दाखला<br/>• तहसीलदारांचे निराधार प्रमाणपत्र |\n\n"
                "💡 **महत्त्वाची सूचना:** शासकीय अनुदानाचा लाभ अखंड मिळण्यासाठी आपले बँक खाते **आधार-सीडेड (NPCI DBT Active)** असणे आवश्यक आहे."
            )
        elif is_hindi:
            return (
                "### 👩 सामाजिक कल्याण, महिला सशक्तिकरण एवं स्वास्थ्य योजनाएं\n\n"
                "नागरिकों के स्वास्थ्य, आवास एवं सामाजिक सुरक्षा हेतु प्रमुख सरकारी योजनाएं:\n\n"
                "| कल्याणकारी योजना | वित्तीय एवं स्वास्थ्य लाभ | लाभार्थी पात्रता मानदंड | आवश्यक दस्तावेज़ सूची |\n"
                "| :--- | :--- | :--- | :--- |\n"
                "| **मुख्यमंत्री माझी लाडली बहिन योजना** | प्रति माह **₹1,500/- (वार्षिक ₹18,000/-)** सीधे बैंक खाते में DBT | 21 से 65 वर्ष की पात्र महिलाएं; कुल पारिवारिक वार्षिक आय <= ₹2.50 लाख | • आधार कार्ड<br/>• मूल निवास प्रमाण पत्र (या 15 वर्ष का साक्ष्य)<br/>• आय प्रमाण पत्र / राशन कार्ड<br/>• आधार से जुड़ा बैंक खाता<br/>• स्व-घोषणा पत्र |\n"
                "| **आयुष्मान भारत (PM-JAY कार्ड)** | संबद्ध अस्पतालों में प्रति परिवार प्रति वर्ष **₹5,00,000/- तक का मुफ्त कैशलेस इलाज** | पात्र आर्थिक रूप से कमजोर एवं राशन कार्ड धारक परिवार | • आधार कार्ड<br/>• राशन कार्ड / पीएम-जय परिवार पहचान<br/>• पंजीकृत मोबाइल नंबर |\n"
                "| **प्रधानमंत्री आवास योजना (PMAY-Gramin)** | पक्के मकान हेतु **₹1,20,000/- की नकद सहायता** + 90 दिन मनरेगा मजदूरी + ₹12,000 शौचालय सहायता | बेघर अथवा कच्चे मकान वाले ग्रामीण परिवार | • भूमि स्वामित्व दस्तावेज<br/>• मनरेगा जॉब कार्ड<br/>• बैंक पासबुक<br/>• आधार कार्ड |\n"
                "| **संजय गांधी निराधार पेंशन योजना** | निराधार, विधवा एवं दिव्यांगों को प्रति माह **₹1,500/- की सामाजिक पेंशन** | निराधार व्यक्ति, दिव्यांग एवं बिना सहारे के बुजुर्ग | • दिव्यांगता / चिकित्सा प्रमाण पत्र<br/>• आयु एवं निवास प्रमाण<br/>• तहसीलदार निराधार प्रमाण पत्र |\n\n"
                "💡 **विशेष सलाह:** सरकारी सहायता निरंतर प्राप्त करने के लिए अपना बैंक खाता आधार एवं एनपीसीआई से अवश्य लिंक रखें।"
            )
        else:
            return (
                "### 👩 Comprehensive Guide to Social Welfare, Women & Healthcare Schemes\n\n"
                "The Government delivers vital safety nets for women, senior citizens, underprivileged families, and healthcare protection:\n\n"
                "| Welfare Scheme | Financial / Health Benefit | Target Beneficiaries | Mandatory Documents Checklist |\n"
                "| :--- | :--- | :--- | :--- |\n"
                "| **Majhi Ladki Bahin Yojana** | Direct Benefit Transfer (DBT) of **₹1,500 / month (₹18,000 / year)** | Women aged 21 to 65 with family annual income <= ₹2.50 Lakhs | • Aadhaar Card<br/>• Maharashtra Domicile / 15-Yr Proof<br/>• Income Certificate / Yellow-Orange Ration Card<br/>• Aadhaar-seeded Bank Passbook<br/>• Self-Declaration Undertaking |\n"
                "| **Ayushman Bharat PM-JAY** | **₹5,00,000 Free Cashless Hospitalization** per family per year across 27,000+ empaneled hospitals | SECC / ration-card eligible underprivileged households | • Aadhaar Card<br/>• Ration Card / PM-JAY Family ID<br/>• Registered Mobile Number |\n"
                "| **PMAY-G Pucca Housing Grant** | Direct housing grant of **₹1,20,000 to ₹1,30,000** + 90 days MGNREGA wages + ₹12,000 toilet grant | Homeless families or those living in kutcha/dilapidated houses | • Land / Plot Ownership Document<br/>• Job Card (MGNREGA)<br/>• Bank Passbook<br/>• Aadhaar |\n"
                "| **Sanjay Gandhi Niradhar Anudan** | Monthly destitute pension of **₹1,500 / month** | Widows, differently-abled persons, destitute elderly | • Disability / Medical Certificate<br/>• Age & Residence Proof<br/>• Destitute Certificate from Tahsildar |\n\n"
                "💡 **Pro-Tip:** Ensure your bank account has active **NPCI Aadhaar Seeding** so monthly DBT allowances credit automatically."
            )

    # 5. DBT, Aadhaar Bank Linking, and NPCI Mapping
    if any(w in query_text for w in ["dbt", "aadhaar link", "npci", "bank account", "खाते लिंक", "आधार लिंक", "सीडिंग"]):
        if is_marathi:
            return (
                "### 💳 डीबीटी (Direct Benefit Transfer) व आधार बँक खाते लिंक करणे\n\n"
                "शासकीय योजनांचे अनुदान (जसे की लाडकी बहीण, पीएम किसान, शिष्यवृत्ती) विनाअडथळा खात्यात जमा होण्यासाठी **NPCI आधार सीडिंग (Aadhaar Seeding)** आवश्यक आहे.\n\n"
                "| बँकिंग निकष | सामान्य आधार लिंकिंग (KYC) | NPCI आधार सीडिंग (DBT) |\n"
                "| :--- | :--- | :--- |\n"
                "| **उद्देश** | बँक खात्याची ओळख व केवायसी पडताळणी | शासकीय योजनांचे थेट आर्थिक अनुदान (DBT) मिळवणे |\n"
                "| **खात्यांची मर्यादा** | एका व्यक्तीच्या सर्व बँक खात्यांना आधार लिंक असू शकते | एका व्यक्तीचे **केवळ एकच बँक खाते** NPCI पोर्टलवर सीड होऊ शकते |\n"
                "| **सरकारी अनुदान जमा** | अनुदान आपोआप जमा होत नाही | लाडकी बहीण, पीएम किसान, शिष्यवृत्ती थेट याच खात्यात जमा होते |\n\n"
                "#### आधार सीडिंग कसे करावे?\n"
                "1. आपल्या बँक शाखेत जाऊन **'NPCI / Aadhaar Seeding Consent Form'** भरा.\n"
                "2. आधार कार्डची प्रत व बँक पासबुक जोडून बँकेत सबमिट करा.\n"
                "3. बँक अधिकारी २४ ते ४८ तासांत आपले खाते NPCI पोर्टलवर मॅप करतात.\n\n"
                "💡 **स्थिती कशी तपासावी:** UIDAI च्या अधिकृत पोर्टलवर (resident.uidai.gov.in) जाऊन 'Bank Seeding Status' द्वारे आपले खाते सक्रिय आहे का ते तपासा."
            )
        elif is_hindi:
            return (
                "### 💳 डीबीटी (Direct Benefit Transfer) एवं आधार बैंक सीडिंग प्रक्रिया\n\n"
                "सरकारी योजनाओं (जैसे लाडली बहना, पीएम किसान, छात्रवृत्ति) की राशि सीधे बैंक खाते में पाने हेतु **NPCI आधार सीडिंग** अनिवार्य है।\n\n"
                "| बैंकिंग पैरामीटर | सामान्य आधार लिंकिंग (KYC) | NPCI आधार सीडिंग (DBT) |\n"
                "| :--- | :--- | :--- |\n"
                "| **मुख्य उद्देश्य** | बैंक खाते की पहचान एवं ई-केवाईसी सत्यापन | सरकारी सब्सिडी एवं वित्तीय लाभ (DBT) सीधे प्राप्त करना |\n"
                "| **खातों की संख्या** | नागरिक के सभी बैंक खातों में आधार लिंक हो सकता है | एक व्यक्ति का **केवल एक प्राथमिक बैंक खाता** एनपीसीआई पर मैप होता है |\n"
                "| **योजना राशि अंतरण** | सब्सिडी राशि स्वतः प्राप्त नहीं होती | लाडली बहना, पीएम किसान, छात्रवृत्ति सीधे इसी खाते में आती है |\n\n"
                "#### आधार सीडिंग की प्रक्रिया:\n"
                "1. अपनी बैंक शाखा में जाकर **'Aadhaar Seeding / Mandate Form'** जमा करें।\n"
                "2. आधार कार्ड की स्व-हस्ताक्षरित प्रति संलग्न करें।\n"
                "3. बैंक द्वारा 24 से 48 घंटे में एनपीसीआई मैपिंग पूर्ण कर दी जाती है।\n\n"
                "💡 **स्थिति जांचें:** UIDAI पोर्टल (resident.uidai.gov.in) पर जाकर 'Bank Seeding Status' सत्यापित करें।"
            )
        else:
            return (
                "### 💳 Direct Benefit Transfer (DBT) & Aadhaar Bank Seeding Guide\n\n"
                "To receive government financial assistance (such as Ladki Bahin ₹1,500/month, PM-KISAN ₹6,000, or post-matric scholarships), your bank account must have **NPCI Aadhaar Seeding active**.\n\n"
                "| Banking Parameter | Normal Aadhaar Linking (KYC) | NPCI Aadhaar Seeding (DBT) |\n"
                "| :--- | :--- | :--- |\n"
                "| **Primary Purpose** | Bank account identity verification & KYC compliance | Receiving direct cash transfers and welfare subsidies from Governments |\n"
                "| **Permitted Accounts** | Can be linked to all bank accounts held by an individual | **Strictly one primary bank account** can be mapped on NPCI Mapper at a time |\n"
                "| **Government Credit** | Does not automatically enable government subsidy credits | Ladki Bahin, PM-KISAN, and scholarships credit directly to this account |\n\n"
                "#### How to Activate Aadhaar Seeding:\n"
                "1. Visit your bank branch and ask for the **'Aadhaar Seeding / NPCI Mapping Form'**.\n"
                "2. Submit the form along with a self-attested photocopy of your Aadhaar card and bank passbook.\n"
                "3. The bank updates your NPCI status within 24 to 48 hours.\n\n"
                "💡 **How to Check Status:** Visit the UIDAI portal (`resident.uidai.gov.in`) and select 'Bank Seeding Status' to verify active DBT status."
            )

    # 6. Ration Cards & NFSA Food Security
    if any(w in query_text for w in ["ration", "food security", "nfsa", "bpl", "apl", "antyodaya", "annapurna", "रेशन", "शिधापत्रिका", "धान्य", "राशन", "खाद्य सुरक्षा"]):
        if is_marathi:
            return (
                "### 🍚 शिधापत्रिका (Ration Card) व राष्ट्रीय अन्न सुरक्षा योजना\n\n"
                "सार्वजनिक वितरण प्रणाली (PDS) अंतर्गत विविध उत्पन्न गटांनुसार खालील शिधापत्रिका वितरित केल्या जातात:\n\n"
                "| शिधापत्रिका वर्ग (Card Category) | उत्पन्न निकष व कुटुंब मर्यादा | मासिक धान्य वाटप व लाभ | आवश्यक कागदपत्रे सूची |\n"
                "| :--- | :--- | :--- | :--- |\n"
                "| **अंत्योदय अन्न योजना (AAY - पिवळे कार्ड)** | अत्यंत दुर्बल व निराधार कुटुंबे (वार्षिक उत्पन्न <= ₹१५,०००) | दरमहा प्रति कुटुंब **३५ किलो मोफत/सवलतीचे धान्य** (तांदूळ ₹३/किलो, गहू ₹२/किलो) | • सर्व कुटुंब सदस्यांचे आधार कार्ड<br/>• तहसीलदार उत्पन्नाचा दाखला<br/>• वास्तव्याचा दाखला / लाईट बिल<br/>• जुने रेशन कार्ड (असल्यास)<br/>• बँक पासबुक |\n"
                "| **प्राधान्य कुटुंब (PHH / BPL - केशरी कार्ड)** | दारिद्र्यरेषेखालील कुटुंबे (वार्षिक उत्पन्न: ग्रामीण <= ₹४४,०००, शहरी <= ₹५९,०००) | दरमहा **५ किलो धान्य प्रति व्यक्ती** मोफत / सवलतीच्या दरात | • कुटुंब प्रमुखाचा पासपोर्ट फोटो<br/>• आधार कार्ड सर्व सदस्यांचे<br/>• घरपट्टी पावती / वीज बिल<br/>• उत्पन्नाचा दाखला |\n"
                "| **अ-प्राधान्य कुटुंब (NPHH / APL - पांढरे कार्ड)** | वार्षिक उत्पन्न ₹१ लाखापेक्षा जास्त असणारे किंवा चारचाकी वाहन असणारे नागरिक | अधिकृत ओळख व पत्ता पुरावा, सवलतीशिवाय धान्य | • आधार व पॅन कार्ड<br/>• निवासी पुरावा<br/>• एलपीजी गॅस ग्राहक पावती |\n"
                "| **रेशन कार्डमध्ये नाव वाढवणे / कमी करणे** | नवजात बालक किंवा विवाहानंतर नवीन सदस्याची नोंद | रेशन वाटपात तात्काळ नावाचा समावेश | • बालकाचा जन्म दाखला / विवाहाचा दाखला<br/>• मूळ रेशन कार्ड<br/>• सदस्याचे आधार कार्ड |\n\n"
                "💡 **महत्त्वाची सूचना:** महा-सेवा पोर्टलवरून आपण थेट शिधापत्रिकेसाठी अर्ज करू शकता किंवा 'पर्सनल व्हॉल्ट' मधील कागदपत्रे वापरून नाव वाढवण्याचा अर्ज सादर करू शकता."
            )
        elif is_hindi:
            return (
                "### 🍚 राशन कार्ड एवं राष्ट्रीय खाद्य सुरक्षा अधिनियम (NFSA)\n\n"
                "सार्वजनिक वितरण प्रणाली (PDS) के तहत आय वर्ग के आधार पर प्रमुख राशन कार्ड श्रेणियां निम्नानुसार हैं:\n\n"
                "| राशन कार्ड श्रेणी (Card Category) | आय सीमा एवं पात्रता | मासिक खाद्यान्न लाभ | आवश्यक दस्तावेज़ सूची |\n"
                "| :--- | :--- | :--- | :--- |\n"
                "| **अंत्योदय अन्न योजना (AAY - पीला कार्ड)** | सर्वाधिक निर्धन एवं निराधार परिवार (वार्षिक आय <= ₹15,000) | प्रति परिवार **35 किलो निःशुल्क / अत्यधिक रियायती खाद्यान्न** प्रति माह | • परिवार के सभी सदस्यों का आधार कार्ड<br/>• तहसीलदार आय प्रमाण पत्र<br/>• निवास प्रमाण पत्र / बिजली बिल<br/>• पुराना राशन कार्ड (यदि हो)<br/>• बैंक पासबुक |\n"
                "| **प्राथमिकता गृहस्थी (PHH / BPL - गुलाबी/नारंगी)** | गरीबी रेखा से नीचे (ग्रामीण आय <= ₹44,000, शहरी आय <= ₹59,000) | प्रति व्यक्ति **5 किलो खाद्यान्न प्रतिमाह** निःशुल्क या रियायती दर पर | • मुखिया का पासपोर्ट फोटो<br/>• सभी सदस्यों का आधार कार्ड<br/>• निवास साक्ष्य / बिजली बिल<br/>• आय प्रमाण पत्र |\n"
                "| **गैर-प्राथमिकता (APL / सफेद कार्ड)** | वार्षिक आय ₹1 लाख से अधिक अथवा चार पहिया वाहन धारक परिवार | आधिकारिक पहचान एवं निवास प्रमाण पत्र के रूप में मान्य | • आधार एवं पैन कार्ड<br/>• आवासीय प्रमाण<br/>• गैस कनेक्शन रसीद |\n"
                "| **राशन कार्ड में नाम जोड़ना / स्थानांतरण** | नवजात शिशु अथवा विवाह उपरांत नए सदस्य का नाम जोड़ना | राशन कोटा में अतिरिक्त सदस्य का तुरंत जुड़ाव | • बच्चे का जन्म प्रमाण पत्र / विवाह प्रमाण पत्र<br/>• मूल राशन कार्ड प्रति<br/>• नए सदस्य का आधार कार्ड |\n\n"
                "💡 **विशेष सलाह:** महा-सेवा पोर्टल पर 'पर्सनल वॉल्ट' से दस्तावेज़ 1-क्लिक में ऑटोफिल कर सीधे राशन कार्ड सेवा हेतु आवेदन करें।"
            )
        else:
            return (
                "### 🍚 Comprehensive Guide to Ration Cards & Food Security (NFSA)\n\n"
                "The Public Distribution System (PDS) issues categorized ration cards based on verified household economic criteria:\n\n"
                "| Ration Card Category | Income Criteria & Target Group | Monthly Foodgrain Entitlement | Mandatory Documents Checklist |\n"
                "| :--- | :--- | :--- | :--- |\n"
                "| **Antyodaya Anna Yojana (AAY - Yellow Card)** | Poorest of the poor families (annual income <= ₹15,000) and destitute households | **35 kg foodgrain per household per month** (Rice @ ₹3/kg, Wheat @ ₹2/kg or free under PMGKAY) | • Aadhaar Card of all family members<br/>• Tahsildar Income Certificate<br/>• Residence Proof (Electricity Bill / Rent Agreement)<br/>• Old Ration Card / Surrender Certificate<br/>• Bank Passbook |\n"
                "| **Priority Household (PHH / BPL - Orange Card)** | Below Poverty Line (Rural annual income <= ₹44,000; Urban <= ₹59,000) | **5 kg foodgrains per person per month** at subsidized or free rates | • Passport Photo of Head of Household<br/>• Aadhaar Card of all members<br/>• Residence / Domicile Proof<br/>• Valid Income Certificate |\n"
                "| **Non-Priority Household (NPHH / APL - White Card)** | Annual household income > ₹1.00 Lakh or vehicle owners | Serves as official address proof and non-subsidized PDS quotas | • Aadhaar and PAN Card<br/>• Residence Proof<br/>• LPG Gas Subscription Voucher |\n"
                "| **Ration Card Member Addition / Transfer** | Addition of newborn children or newly-wed spouses | Expands subsidized monthly grain quota per head | • Birth Certificate (for newborn) / Marriage Certificate<br/>• Original Ration Card<br/>• Aadhaar of incoming member |\n\n"
                "💡 **Pro-Tip:** Apply for new ration cards or add members directly through Maha-Seva using **1-Click Auto-Fill** from your Personal Vault."
            )

    # 7. Land Records, 7/12 (Saatbara), 8-A, Ferfar (Mutation) & Property Cards
    if any(w in query_text for w in ["7/12", "satbara", "mutation", "ferfar", "property card", "akhiv patrika", "ror", "khata", "khasra", "khatauni", "जमीन", "सातबारा", "फेरफार", "गाव नमुना", "खसरा", "नामांतरण", "दाखिल खारिज"]):
        if is_marathi:
            return (
                "### 🚜 जमीन महसूल अभिलेख (७/१२, ८-अ, फेरफार व मालमत्ता पत्रक)\n\n"
                "शेतजमीन व नागरी मालमत्तेच्या अधिकृत मालकी हक्कांसाठी महसूल विभागाची खालील अभिलेखे अत्यंत आवश्यक असतात:\n\n"
                "| जमीन दस्तऐवज / सेवा | कायदेशीर महत्त्व व उद्देश | सक्षम महसूल अधिकारी व कालावधी | आवश्यक कागदपत्रे सूची |\n"
                "| :--- | :--- | :--- | :--- |\n"
                "| **डिजिटल स्वाक्षरीचा ७/१२ उतारा** | गाव नमुना ७ (मालकी हक्क, क्षेत्र, सर्व्हे नंबर) + गाव नमुना १२ (पिक पाहणी, विहीर/बोरवेल व कर्ज बोजा) | महसूल विभाग / महाभूलेख (तात्काळ / १ दिवस) | • जिल्हा, तालुका, गाव व गट/सर्व्हे नंबर<br/>• आधार पडताळणी |\n"
                "| **गाव नमुना ८-अ (खाते उतारा)** | एकाच गावातील खातेदाराच्या नावावर असणाऱ्या सर्व सर्व्हे नंबरचे एकत्रित क्षेत्र व आकारणी | तलाठी कार्यालय / १ ते ३ कार्यदिवस | • खाते नंबर किंवा ७/१२ गट नंबर<br/>• आधार कार्ड |\n"
                "| **फेरफार नोंद (Mutation Entry)** | खरेदी खत (Sale Deed), वारस नोंद, वाटणीपत्र किंवा बक्षीस पत्रानंतर ७/१२ वरील मालकी हक्कात बदल | मंडळ अधिकारी / १५ दिवसांची जाहीर नोटीस (कलम १४९/१५०) | • नोंदणीकृत खरेदी खत (Registered Sale Deed)<br/>• चालू ७/१२ व ८-अ उतारा<br/>• वारस प्रमाणपत्र / मृत्यू दाखला (वारस नोंदीसाठी)<br/>• संमतीपत्र |\n"
                "| **मालमत्ता पत्रक (Property Card / आखिव पत्रिका)** | नगरपालिका/महानगरपालिका हद्दीतील नागरी मिळकतीचा अधिकृत मालकी हक्क पुरावा | नगर भूमापन अधिकारी (City Survey) / ३ ते ७ दिवस | • सीटीएस नंबर (CTS No.)<br/>• मिळकत खरेदी दस्त<br/>• ओळख पुरावा |\n\n"
                "💡 **महत्त्वाची सूचना:** महा-सेवा पोर्टलवरून प्रमाणित डिजिटल ७/१२ उतारा व फेरफार अर्ज १-क्लिकमध्ये थेट दाखल करता येतो."
            )
        elif is_hindi:
            return (
                "### 🚜 भूलेख अभिलेख (7/12, खसरा-खतौनी, नामांतरण एवं प्रॉपर्टी कार्ड)\n\n"
                "कृषि भूमि एवं आवासीय संपत्ति के स्वामित्व अधिकारों हेतु प्रमुख सरकारी दस्तावेज:\n\n"
                "| भूलेख दस्तावेज़ / सेवा | कानूनी महत्व एवं उद्देश्य | सक्षम राजस्व अधिकारी व समय | आवश्यक दस्तावेज़ सूची |\n"
                "| :--- | :--- | :--- | :--- |\n"
                "| **डिजिटल 7/12 / खसरा-खतौनी (RoR)** | भूमि स्वामित्व, रकबा, खसरा संख्या, फसल विवरण एवं बैंक बंधक की आधिकारिक प्रविष्टि | राजस्व विभाग / भूलेख पोर्टल (1 से 2 कार्यदिवस) | • जिला, तहसील, ग्राम एवं खसरा/गाटा संख्या<br/>• आधार सत्यापन |\n"
                "| **खाता विवरण (8-A नकल)** | एक ही गांव में काश्तकार के कुल स्वामित्व का एकीकृत विवरण | पटवारी/तहसील कार्यालय (1 से 3 कार्यदिवस) | • खाता संख्या अथवा खसरा संख्या<br/>• आधार कार्ड |\n"
                "| **नामांतरण / दाखिल खारिज (Mutation)** | विक्रय पत्र (Sale Deed), वरासत या वसीयत के बाद सरकारी अभिलेख में नाम दर्ज करना | नायब तहसीलदार / 15 दिन की सार्वजनिक आपत्ति अवधि | • पंजीकृत रजिस्ट्री (Registered Sale Deed)<br/>• वर्तमान खतौनी नकल<br/>• मृत्यु प्रमाण पत्र व वारिस प्रमाण पत्र (वरासत हेतु)<br/>• पहचान पत्र |\n"
                "| **प्रॉपर्टी कार्ड (नगर भू-अभिलेख)** | शहरी नगर निगम क्षेत्र में भवन अथवा भूखंड का विधिक स्वामित्व प्रमाण पत्र | नगर सर्वेक्षण अधिकारी (City Survey) / 5 से 7 दिन | • सीटीएस / संपत्ति संख्या<br/>• पंजीकृत बैनामा<br/>• पहचान साक्ष्य |\n\n"
                "💡 **विशेष सलाह:** महा-सेवा पोर्टल से प्रमाणित डिजिटल 7/12 एवं नामांतरण हेतु 'पर्सनल वॉल्ट' से दस्तावेज़ जोड़कर सीधे आवेदन करें।"
            )
        else:
            return (
                "### 🚜 Comprehensive Guide to Land Records (7/12, 8-A, Mutation & Property Card)\n\n"
                "Land and property records provide statutory proof of title, encumbrances, and agrarian rights:\n\n"
                "| Land Document / Service | Legal Significance & Purpose | Competent Authority & SLA | Required Documents Checklist |\n"
                "| :--- | :--- | :--- | :--- |\n"
                "| **Certified 7/12 Land Record (Saatbara)** | Village Form 7 (Title ownership, survey/gut number, area) + Form 12 (crop inspection, irrigation source, crop loans) | Revenue Department / Mahabhulekh (~1 business day) | • District, Taluka, Village, and Survey/Gut Number<br/>• Aadhaar Verification |\n"
                "| **Village Form 8-A (Khate Utarak)** | Aggregates all land parcels held by a single Khatedar across a revenue village with tax assessments | Talathi / Revenue Office (~1 to 3 days) | • Khata Number or Survey Number<br/>• Identity Proof |\n"
                "| **Ferfar / Land Mutation Entry** | Statutorily records change of land ownership upon Registered Sale Deed, Inheritance (Varas), Gift Deed, or Partition | Circle Officer / Tahsildar (Mandatory 15-Day Public Notice Window) | • Registered Sale Deed / Conveyance<br/>• Latest 7/12 & 8-A Extracts<br/>• Death Certificate & Legal Heir Certificate (for inheritance)<br/>• Consent Affidavit |\n"
                "| **Property Card (Akhiv Patrika / CTS)** | Official conclusive title record for urban residential and commercial properties within municipal limits | City Survey Office (~3 to 7 business days) | • City Survey Number (CTS No.)<br/>• Registered Sale Deed / Property Tax Receipt<br/>• Identity Proof |\n\n"
                "💡 **Pro-Tip:** Request certified digitally signed 7/12 extracts or submit online mutation claims directly through Maha-Seva's **Personal Vault Auto-Fill** below."
            )

    # 8. RTO, Driving License & Parivahan Services
    if any(w in query_text for w in ["driving", "driver", "license", "learner", "llr", "dl", "rto", "sarathi", "parivahan", "चालक", "परवाना", "वाहन", "ड्रायव्हिंग", "ड्राइविंग", "लर्निंग"]):
        if is_marathi:
            return (
                "### 🚗 चालक परवाना (Driving License) व आरटीओ सेवा\n\n"
                "परिवहन विभागाच्या (सारथी / आरटीओ) सर्व प्रमुख चालक परवाना सेवा खालीलप्रमाणे आहेत:\n\n"
                "| परवाना प्रकार / सेवा | वय व पात्रता निकष | वैधता कालावधी व परीक्षा | आवश्यक कागदपत्रे सूची |\n"
                "| :--- | :--- | :--- | :--- |\n"
                "| **लर्निंग लायसन्स (Learner's License - LLR)** | वय वर्षे १६+ (गिअर नसलेली ५०cc दुचाकी) किंवा १८+ (LMV चारचाकी/दुचाकी) | **६ महिने वैध**; संगणकीय ऑनलाइन वाहतूक नियम परीक्षा (MCQ Test) | • आधार कार्ड (ऑनलाइन ई-केवायसी)<br/>• वयाचा पुरावा (१० वी मार्कशीट / जन्म दाखला)<br/>• पत्ता पुरावा<br/>• पासपोर्ट फोटो व स्वाक्षरी |\n"
                "| **पक्का चालक परवाना (Permanent Driving License)** | लर्निंग लायसन्स मिळाल्यापासून **किमान ३० दिवसांनंतर** व १८० दिवसांच्या आत | **२० वर्षे किंवा वयाच्या ४० वर्षांपर्यंत**; आरटीओ ट्रॅकवर प्रत्यक्ष वाहन चालवण्याची चाचणी | • वैध लर्निंग लायसन्स (LLR)<br/>• चाचणी स्लॉट बुकिंग पावती<br/>• वाहनाची वैध कागदपत्रे (RC, विमा, PUC) |\n"
                "| **परवाना नूतनीकरण (DL Renewal)** | परवान्याची मुदत संपण्याच्या १ वर्ष आधी किंवा १ वर्षानंतर | वय ४० वर्षांपेक्षा जास्त असल्यास **वैद्यकीय प्रमाणपत्र (Form 1A)** बंधनकारक | • मूळ ड्रायव्हिंग लायसन्स<br/>• डॉक्टरचे फॉर्म १-ए प्रमाणपत्र<br/>• पत्ता पुरावा |\n"
                "| **ड्रायव्हिंग लायसन्स एनओसी (RTO NOC)** | दुसऱ्या राज्यात अथवा जिल्ह्यात वाहन किंवा परवाना स्थलांतरित करण्यासाठी | पोलीस पडताळणी व आरटीओ मंजुरी | • मूळ परवाना / आरसी पुस्तक<br/>• नवीन पत्त्याचा पुरावा<br/>• पोलीस क्लिअरन्स |\n\n"
                "💡 **महत्त्वाची सूचना:** आरटीओ कार्यालयात फेऱ्या न मारता घरबसल्या आधार ई-केवायसीद्वारे लर्निंग लायसन्स तात्काळ मिळवता येते."
            )
        elif is_hindi:
            return (
                "### 🚗 ड्राइविंग लाइसेंस (DL) एवं आरटीओ परिवहन सेवाएं\n\n"
                "सड़क परिवहन एवं राजमार्ग मंत्रालय (सारथी पोर्टल) के अंतर्गत प्रमुख ड्राइविंग सेवाएं:\n\n"
                "| ड्राइविंग सेवा / श्रेणी | आयु एवं पात्रता मानदंड | वैधता अवधि व परीक्षा | आवश्यक दस्तावेज़ सूची |\n"
                "| :--- | :--- | :--- | :--- |\n"
                "| **लर्निंग लाइसेंस (Learner's License - LLR)** | न्यूनतम 16 वर्ष (बिना गियर दोपहिया) अथवा 18 वर्ष (LMV कार/बाइक) | **6 माह वैधता**; ऑनलाइन ट्रैफिक नियम कंप्यूटर टेस्ट (घर बैठे उपलब्ध) | • आधार कार्ड (e-KYC)<br/>• आयु प्रमाण पत्र (10वीं मार्कशीट/जन्म प्रमाण पत्र)<br/>• निवास प्रमाण<br/>• पासपोर्ट फोटो एवं हस्ताक्षर |\n"
                "| **स्थायी ड्राइविंग लाइसेंस (Permanent DL)** | लर्निंग लाइसेंस जारी होने के **कम से कम 30 दिन बाद** और 6 माह के भीतर | **20 वर्ष अथवा 40 वर्ष की आयु तक**; आरटीओ ट्रैक पर प्रायोगिक ड्राइविंग टेस्ट | • वैध लर्निंग लाइसेंस<br/>• ड्राइविंग टेस्ट स्लॉट रसीद<br/>• वाहन के वैध कागजात (RC, बीमा, प्रदूषण) |\n"
                "| **ड्राइविंग लाइसेंस नवीनीकरण (Renewal)** | वैधता समाप्त होने के 1 वर्ष पूर्व से 1 वर्ष बाद तक | 40 वर्ष से अधिक आयु होने पर **मेडिकल फिटनेस (Form 1A)** अनिवार्य | • मूल ड्राइविंग लाइसेंस<br/>• अधिकृत डॉक्टर का मेडिकल फॉर्म 1-A<br/>• निवास प्रमाण |\n"
                "| **ड्राइविंग लाइसेंस एनओसी (RTO NOC)** | अन्य राज्य में वाहन अथवा लाइसेंस ट्रांसफर करने हेतु | पुलिस सत्यापन एवं आरटीओ क्लियरेंस | • मूल डीएल / वाहन आरसी<br/>• नए पते का साक्ष्य<br/>• आरटीओ क्लीयरेंस फॉर्म 28 |\n\n"
                "💡 **विशेष सलाह:** आधार ई-केवाईसी द्वारा घर बैठे लर्निंग लाइसेंस टेस्ट देकर तुरंत डिजिटल लाइसेंस डाउनलोड करें।"
            )
        else:
            return (
                "### 🚗 Comprehensive Guide to Driving Licenses & RTO Parivahan Services\n\n"
                "The Ministry of Road Transport & Highways (MoRTH / Parivahan Sarathi) regulates computerized vehicular licensing:\n\n"
                "| Driving Service / License Stage | Age & Eligibility Criteria | Validity Period & Test Requirement | Required Documents Checklist |\n"
                "| :--- | :--- | :--- | :--- |\n"
                "| **Learner's License (LLR)** | Age 16+ (gearless 50cc) or 18+ (Light Motor Vehicle - Car/Bike) | **Valid for 6 months**; Online computerized traffic regulations test (available from home via Aadhaar) | • Aadhaar Card (instant e-KYC)<br/>• Age Proof (10th Marksheet / Birth Certificate)<br/>• Residence Proof<br/>• Passport Photo & Signature Specimen |\n"
                "| **Permanent Driving License (DL)** | Eligible after **minimum 30 days** of LLR issue and within 180 days | **Valid for 20 years** or up to age 40; In-person driving skill track test at RTO | • Valid Learner's License (LLR)<br/>• Appointment Slot Booking Slip<br/>• Test Vehicle Documents (RC, Insurance, PUC) |\n"
                "| **Driving License Renewal** | Within 1 year prior to or 1 year post expiration date | Medical Fitness Form 1A mandatory if age > 40; biometrics update | • Original Expired DL<br/>• Registered Medical Practitioner Form 1A<br/>• Current Address Proof |\n"
                "| **Driving License NOC / State Transfer** | Transferring driving license or vehicle ownership across state lines | Police verification & statutory clearance | • Original DL / Vehicle RC<br/>• New State Residence Proof<br/>• Form 28 Application |\n\n"
                "💡 **Pro-Tip:** Check out the recommended Driving License NOC service below and use Maha-Seva's **Personal Vault Auto-Fill** to attach your documents instantly."
            )

    # 9. Voter ID & Election Services (ECI / NVSP)
    if any(w in query_text for w in ["voter", "election", "epic", "nvsp", "form 6", "form 7", "form 8", "मतदार", "निवडणूक", "मतदाता", "वोटर"]):
        if is_marathi:
            return (
                "### 🗳️ मतदार ओळखपत्र (Voter ID / EPIC) व निवडणूक आयोग सेवा\n\n"
                "भारतीय निवडणूक आयोगाच्या (ECI) अधिकृत मतदार सेवा खालीलप्रमाणे उपलब्ध आहेत:\n\n"
                "| निवडणूक नमुना (Form) | अर्जाचा उद्देश व पात्रता | अंदाजे कालावधी | आवश्यक कागदपत्रे सूची |\n"
                "| :--- | :--- | :--- | :--- |\n"
                "| **नमुना क्रमांक ६ (Form 6 - नवीन मतदार)** | वयाची १८ वर्षे पूर्ण झालेल्या भारतीय नागरिकाची मतदार यादीत प्रथमच नोंदणी | १५ ते ३० कार्यदिवस | • वयाचा पुरावा (१० वी मार्कशीट / जन्म दाखला / आधार)<br/>• पत्ता पुरावा (लाईट बिल / बँक पासबुक / रेशन कार्ड)<br/>• पासपोर्ट आकाराचा रंगीत फोटो |\n"
                "| **नमुना क्रमांक ८ (Form 8 - दुरुस्ती व स्थलांतर)** | पत्ता बदल (दुसऱ्या मतदारसंघात स्थलांतर), नावात/जन्मतारखेत दुरुस्ती किंवा हरवलेले ओळखपत्र पुन्हा मिळवणे | १५ ते २१ कार्यदिवस | • चालू मतदार ओळखपत्र (EPIC Number)<br/>• दुरुस्तीचा पुरावा (गॅझेट / आधार / विवाह दाखला)<br/>• नवीन पत्त्याचा पुरावा |\n"
                "| **नमुना क्रमांक ७ (Form 7 - नाव वगळणे)** | मृत किंवा कायमस्वरूपी स्थलांतरित मतदाराचे नाव यादीतून वगळण्यासाठी आक्षेप | १५ कार्यदिवस | • संबंधित व्यक्तीचे नाव व मतदार क्रमांक<br/>• मृत्यू दाखला (मयत व्यक्तीसाठी) |\n"
                "| **नमुना क्रमांक ६-ब (Form 6B - आधार लिंकिंग)** | मतदार ओळखपत्राशी आधार क्रमांक स्वेच्छेने संलग्न करणे | तात्काळ ऑनलाइन | • मतदार ओळखपत्र (EPIC)<br/>• आधार क्रमांक व ओटीपी पडताळणी |\n\n"
                "💡 **महत्त्वाची सूचना:** मतदार यादीत नाव नोंदणी पूर्ण झाल्यावर आपण अधिकृत डिजिटल ई-इपिक (e-EPIC) थेट मोबाईलमध्ये डाउनलोड करू शकता."
            )
        elif is_hindi:
            return (
                "### 🗳️ मतदाता पहचान पत्र (Voter ID) एवं निर्वाचन आयोग सेवाएं\n\n"
                "भारत निर्वाचन आयोग (ECI) द्वारा संचालित प्रमुख मतदाता सेवाएं निम्नानुसार हैं:\n\n"
                "| मतदाता फॉर्म (Form Type) | उद्देश्य एवं पात्रता | प्रसंस्करण समय | आवश्यक दस्तावेज़ सूची |\n"
                "| :--- | :--- | :--- | :--- |\n"
                "| **फॉर्म 6 (Form 6 - नया मतदाता)** | 18 वर्ष पूर्ण कर चुके भारतीय नागरिकों का मतदाता सूची में प्रथम पंजीकरण | 15 से 30 कार्यदिवस | • आयु प्रमाण (10वीं अंकतालिका / जन्म प्रमाण पत्र / आधार)<br/>• निवास प्रमाण पत्र (बिजली बिल / बैंक पासबुक)<br/>• पासपोर्ट साइज फोटो |\n"
                "| **फॉर्म 8 (Form 8 - संशोधन व स्थानांतरण)** | पते में परिवर्तन, नाम/जन्मतिथि में सुधार अथवा डुप्लीकेट वोटर आईडी प्राप्त करना | 15 से 21 कार्यदिवस | • वर्तमान वोटर आईडी संख्या (EPIC No.)<br/>• संशोधन हेतु वैध साक्ष्य (आधार/विवाह प्रमाण)<br/>• नए पते का प्रमाण |\n"
                "| **फॉर्म 7 (Form 7 - नाम विलोपन)** | मृत अथवा स्थायी रूप से स्थानांतरित मतदाता का नाम सूची से हटाने की आपत्ति | 15 कार्यदिवस | • मतदाता की पहचान संख्या<br/>• मृत्यु प्रमाण पत्र (मृत्यु की स्थिति में) |\n"
                "| **फॉर्म 6B (Form 6B - आधार लिंक)** | मतदाता पहचान पत्र को स्वैच्छिक रूप से आधार कार्ड से लिंक करना | तुरंत ऑनलाइन | • वोटर कार्ड (EPIC No.)<br/>• आधार संख्या एवं मोबाइल ओटीपी |\n\n"
                "💡 **विशेष सलाह:** आवेदन स्वीकृत होने के बाद आप ई-एपिक (e-EPIC) डिजिटल वोटर कार्ड सीधे डाउनलोड कर सकते हैं।"
            )
        else:
            return (
                "### 🗳️ Comprehensive Guide to Voter ID (EPIC) & Election Commission Services\n\n"
                "The Election Commission of India (ECI / Voter Services Portal) provides standardized forms for electoral roll management:\n\n"
                "| Voter Form / Service | Official Purpose & Eligibility | Processing SLA | Mandatory Documents Checklist |\n"
                "| :--- | :--- | :--- | :--- |\n"
                "| **Form 6 (New Voter Registration)** | First-time registration for Indian citizens attaining 18 years on qualifying dates (Jan 1, Apr 1, Jul 1, Oct 1) | ~15 to 30 business days | • Age Proof (10th Marksheet / Birth Certificate / Aadhaar)<br/>• Residence Proof (Electricity Bill / Bank Passbook / Rent Agreement)<br/>• Recent Color Passport Photograph |\n"
                "| **Form 8 (Correction & Address Shifting)** | Shifting of residence (inter/intra constituency), corrections to name/photo/DOB, or replacement EPIC | ~15 to 21 business days | • Existing Voter ID Number (EPIC No.)<br/>• Supporting proof for correction (Gazette / Aadhaar / Marriage Cert)<br/>• New Address Proof |\n"
                "| **Form 7 (Objection / Deletion of Name)** | Deletion of entry for deceased, permanently shifted, or duplicate voters | ~15 business days | • Voter EPIC details<br/>• Death Certificate (in case of deceased voter) |\n"
                "| **Form 6B (Aadhaar-Voter Authentication)** | Voluntary linking of Aadhaar with Electoral Photo Identity Card | Instant Online | • Voter ID Number (EPIC)<br/>• Aadhaar Number & OTP Verification |\n\n"
                "💡 **Pro-Tip:** Once approved by the Electoral Registration Officer (ERO), you can download your digitally verifiable **e-EPIC** in PDF format instantly."
            )

    # 10. Civil Registration (Birth, Death & Marriage Certificates)
    if any(w in query_text for w in ["birth", "death", "marriage", "newborn", "जन्म", "मृत्यू", "मृत्यु", "विवाह", "शादी"]):
        if is_marathi:
            return (
                "### 📜 नागरी नोंदणी (जन्म, मृत्यू व विवाह नोंदणी प्रमाणपत्र)\n\n"
                "जन्म व मृत्यू नोंदणी कायदा १९६९ आणि विवाह नोंदणी नियमांनुसार नागरी दाखल्यांचे तपशील:\n\n"
                "| नागरी नोंदणी दाखला | नोंदणी कालमर्यादा (Timeline) | नोंदणी कार्यालय | आवश्यक कागदपत्रे सूची |\n"
                "| :--- | :--- | :--- | :--- |\n"
                "| **जन्म प्रमाणपत्र (Birth Certificate)** | जन्मापासून **२१ दिवसांच्या आत नोंदणी मोफत**; २१ ते ३० दिवसांत नाममात्र विलंब शुल्क; १ वर्षानंतर तहसीलदारांचे आदेश आवश्यक | महानगरपालिका / नगरपरिषद / ग्रामपंचायत | • रुग्णालयाचा डिस्चार्ज दाखला व जन्म अहवाल (Form 1)<br/>• आई व वडिलांचे आधार कार्ड<br/>• पत्ता पुरावा |\n"
                "| **मृत्यू प्रमाणपत्र (Death Certificate)** | मृत्यू झाल्यापासून **२१ दिवसांच्या आत** अधिकृत नोंदणी अनिवार्य | स्थानिक नागरी संस्था / ग्रामपंचायत | • डॉक्टरांचे मृत्यू कारण प्रमाणपत्र (MCCD Form 4/4A)<br/>• स्मशानभूमी/दफनभूमी पावती<br/>• मयत व्यक्तीचे व अर्जदाराचे आधार कार्ड |\n"
                "| **विवाह नोंदणी प्रमाणपत्र (Marriage Certificate)** | विवाहाच्या तारखेपासून ९० दिवसांच्या आत नोंदणी करणे सुलभ | निबंधक / विवाह अधिकारी कार्यालय | • वर व वधूचे वयाचा पुरावा (१० वी बोर्ड सर्टिफिकेट/जन्म दाखला)<br/>• पत्ता पुरावा व आधार कार्ड<br/>• लग्नाची पत्रिका व विवाहाचे फोटो<br/>• ३ सज्ञान साक्षीदारांचे आधार व स्वाक्षरी |\n\n"
                "💡 **महत्त्वाची सूचना:** २१ दिवसांनंतर केलेल्या विलंबासाठी प्रतिज्ञापत्र (Affidavit) व सक्षम प्राधिकाऱ्यांची मंजुरी आवश्यक असते."
            )
        elif is_hindi:
            return (
                "### 📜 नागरिक पंजीकरण (जन्म, मृत्यु एवं विवाह प्रमाण पत्र)\n\n"
                "जन्म-मृत्यु पंजीकरण अधिनियम 1969 एवं विवाह पंजीकरण नियमों के तहत आधिकारिक व्यवस्था:\n\n"
                "| नागरिक पंजीकरण प्रमाण पत्र | समय सीमा (Timeline) | पंजीकरण कार्यालय | आवश्यक दस्तावेज़ सूची |\n"
                "| :--- | :--- | :--- | :--- |\n"
                "| **जन्म प्रमाण पत्र (Birth Certificate)** | जन्म के **21 दिनों के भीतर निःशुल्क पंजीकरण**; 21 से 30 दिन में विलंब शुल्क; 1 वर्ष बाद तहसीलदार/एसडीएम आदेश | नगर निगम / नगर पालिका / ग्राम पंचायत | • अस्पताल का डिस्चार्ज कार्ड एवं जन्म पर्ची (Form 1)<br/>• माता-पिता का आधार कार्ड<br/>• निवास प्रमाण |\n"
                "| **मृत्यु प्रमाण पत्र (Death Certificate)** | मृत्यु के **21 दिनों के भीतर** स्थानीय पंजीयक को सूचना देना अनिवार्य | स्थानीय निकाय / ग्राम पंचायत | • अस्पताल का मृत्यु कारण प्रमाण पत्र (MCCD Form 4)<br/>• श्मशान/कब्रिस्तान की रसीद<br/>• मृतक एवं आवेदक का आधार कार्ड |\n"
                "| **विवाह प्रमाण पत्र (Marriage Certificate)** | विवाह संपन्न होने के उपरांत पंजीकरण आवश्यक | विवाह रजिस्ट्रार कार्यालय | • वर-वधू का आयु प्रमाण (10वीं मार्कशीट/जन्म प्रमाण पत्र)<br/>• निवास साक्ष्य एवं आधार कार्ड<br/>• शादी का कार्ड एवं विवाह तस्वीर<br/>• 3 वयस्क गवाहों के आधार व हस्ताक्षर |\n\n"
                "💡 **विशेष सलाह:** 21 दिन के उपरांत विलंबित पंजीकरण हेतु नोटरी हलफनामा एवं उप-जिलाधिकारी (SDM) की अनुमति आवश्यक होती है।"
            )
        else:
            return (
                "### 📜 Comprehensive Guide to Civil Registration (Birth, Death & Marriage)\n\n"
                "Under the Registration of Births and Deaths Act 1969 and Marriage Registration Rules, statutory records are maintained as follows:\n\n"
                "| Civil Registration Certificate | Statutory Reporting Window | Competent Local Authority | Mandatory Documents Checklist |\n"
                "| :--- | :--- | :--- | :--- |\n"
                "| **Birth Certificate** | **Within 21 days is free of charge**; 21 to 30 days incurs nominal late fee; after 1 year requires SDM / Executive Magistrate order | Municipal Corporation / Council / Gram Panchayat | • Hospital Discharge Card & Institutional Birth Slip (Form 1)<br/>• Aadhaar Cards of Mother and Father<br/>• Address Proof |\n"
                "| **Death Certificate** | Mandatory reporting **within 21 days** of occurrence | Municipal Health Department / Gram Panchayat | • Medical Certificate of Cause of Death (MCCD Form 4/4A)<br/>• Crematorium / Burial Ground Receipt<br/>• Aadhaar of deceased and applicant |\n"
                "| **Marriage Certificate** | Recommended within 90 days of solemnization (Hindu Marriage Act / Special Marriage Act) | Sub-Registrar / Municipal Marriage Officer | • Age & ID Proof of Bride and Groom (10th Marksheet / Birth Certificate)<br/>• Aadhaar & Residence Proof<br/>• Marriage Invitation Card & Wedding Photos<br/>• 3 Adult Witnesses with Aadhaar and photographs |\n\n"
                "💡 **Pro-Tip:** Use DigiLocker to access digitally verifiable birth and marriage certificates issued by authorized local bodies."
            )

    # 11. Right to Information (RTI Act 2005) & Grievance Redressal
    if any(re.search(rf"\b{re.escape(w)}\b", query_text) if len(w) <= 4 else w in query_text for w in ["rti", "right to information", "first appeal", "pio", "grievance", "complaint", "consumer court", "consumer forum", "माहिती अधिकार", "तक्रार", "ग्राहक मंच", "सूचना का अधिकार", "जन शिकायत", "उपभोक्ता"]):
        if is_marathi:
            return (
                "### ⚖️ माहितीचा अधिकार (RTI Act 2005) व नागरी तक्रार निवारण\n\n"
                "पारदर्शक प्रशासनासाठी नागरिक माहितीचा अधिकार आणि तक्रार निवारण मंचांचा वापर करू शकतात:\n\n"
                "| वैधानिक निवारण माध्यम | अधिकारक्षेत्र व अधिकारी | शासकीय शुल्क व कालमर्यादा | आवश्यक तपशील सूची |\n"
                "| :--- | :--- | :--- | :--- |\n"
                "| **माहिती अधिकार अर्ज (RTI Application)** | सर्व केंद्र व राज्य शासकीय कार्यालये / जनमाहिती अधिकारी (PIO) | **₹१०/- कोर्ट फी स्टॅम्प** (दारिद्र्यरेषेखालील BPL नागरिकांना मोफत); **३० दिवसांत माहिती देणे बंधनकारक** (जीवित व व्यक्तिगत स्वातंत्र्याबाबत ४८ तास) | • विशिष्ट व मुद्देसूद विचारलेली माहिती<br/>• अर्जदाराचे संपूर्ण नाव व पत्ता<br/>• ₹१० चे शुल्क चालान किंवा BPL रेशन कार्ड प्रत |\n"
                "| **प्रथम अपील (First Appeal)** | प्रथम अपिलीय अधिकारी (FAA - PIO च्या वरिष्ठ अधिकारी) | ३० दिवसांत माहिती न मिळाल्यास किंवा असमाधानकारक उत्तरावर; **३० ते ४५ दिवसांत निकाल** | • मूळ RTI अर्जाची प्रत<br/>• जनमाहिती अधिकाऱ्याचे उत्तर (असल्यास)<br/>• अपिलाचे कायदेशीर कारण |\n"
                "| **आपले सरकार नागरी तक्रार मंच** | महाराष्ट्र शासनाचे सर्व प्रशासकीय विभाग | **विनामूल्य**; तक्रार नोंदवल्यानंतर ३० दिवसांत निवारण | • तक्रारीचा सविस्तर तपशील व संबंधित कार्यालय<br/>• आवश्यक पुराव्यांची कागदपत्रे |\n"
                "| **ग्राहक तक्रार मंच (Consumer Commission)** | सदोष सेवा, भेसळ किंवा ग्राहकांची फसवणूक (e-Daakhil पोर्टल) | तक्रार मूल्यांकनानुसार सुलभ शुल्क | • खरेदी बिल / पावती<br/>• विक्रेत्याला पाठवलेली कायदेशीर नोटीस<br/>• तक्रार अर्ज |\n\n"
                "💡 **महत्त्वाची सूचना:** शासकीय सेवेच्या विलंब किंवा अन्यायाविरुद्ध 'आपले सरकार' व CPGRAMS वर तात्काळ ऑनलाइन तक्रार नोंदवता येते."
            )
        elif is_hindi:
            return (
                "### ⚖️ सूचना का अधिकार (RTI Act 2005) एवं जन शिकायत निवारण\n\n"
                "पारदर्शी प्रशासन एवं जवाबदेही सुनिश्चित करने हेतु वैधानिक माध्यम:\n\n"
                "| वैधानिक निवारण माध्यम | अधिकार क्षेत्र एवं अधिकारी | शुल्क व वैधानिक समय सीमा | आवश्यक जानकारी सूची |\n"
                "| :--- | :--- | :--- | :--- |\n"
                "| **आरटीआई आवेदन (RTI Application)** | सभी केंद्र एवं राज्य सरकारी विभाग / जन सूचना अधिकारी (PIO) | **₹10/- आवेदन शुल्क** (BPL धारकों हेतु निःशुल्क); **30 दिनों के भीतर सूचना अनिवार्य** (जीवन व स्वतंत्रता हेतु 48 घंटे) | • स्पष्ट एवं बिंदुवार मांगी गई सूचना<br/>• आवेदक का पूरा नाम व पता<br/>• ₹10 का पोस्टल ऑर्डर/स्टांप अथवा BPL कार्ड |\n"
                "| **प्रथम अपील (First Appeal)** | प्रथम अपीलीय प्राधिकारी (FAA - वरिष्ठ प्रशासनिक अधिकारी) | सूचना न मिलने पर 30 दिन के भीतर; **30 से 45 दिनों में निस्तारण** | • मूल आरटीआई आवेदन की प्रति<br/>• पीआईओ का जवाब (यदि प्राप्त हुआ हो)<br/>• अपील का ठोस आधार |\n"
                "| **सीपीजीआरएएमएस (CPGRAMS) जन शिकायत** | भारत सरकार एवं राज्य विभागों से संबंधित जन समस्याएं | **निःशुल्क**; 30 दिनों के भीतर प्रशासनिक समाधान | • शिकायत का विस्तृत विवरण व संबंधित कार्यालय<br/>• साक्ष्य दस्तावेज एवं संदर्भ संख्या |\n"
                "| **उपभोक्ता फोरम (e-Daakhil / 1915)** | दोषपूर्ण सेवा, घटिया उत्पाद अथवा उपभोक्ता धोखाधड़ी | दावा राशि के आधार पर नाममात्र शुल्क | • क्रय रसीद / बिल / गारंटी कार्ड<br/>• विक्रेता को प्रेषित नोटिस की प्रति<br/>• शिकायत विवरण पत्र |\n\n"
                "💡 **विशेष सलाह:** सरकारी विभागों से सूचना प्राप्त करने हेतु ऑनलाइन RTI पोर्टल (rtionline.gov.in) का उपयोग करें।"
            )
        else:
            return (
                "### ⚖️ Right to Information (RTI Act 2005) & Citizen Grievance Redressal\n\n"
                "Statutory frameworks designed to uphold administrative transparency and citizen grievance resolution:\n\n"
                "| Citizen Grievance / Legal Mechanism | Competent Authority & Jurisdiction | Statutory Timeline & Fee | Key Requirements Checklist |\n"
                "| :--- | :--- | :--- | :--- |\n"
                "| **RTI Application (Section 6(1))** | Central and State Public Authorities / Public Information Officer (PIO) | **₹10 Application Fee** (Completely Free for BPL cardholders); Strictly **30 Days statutory deadline** (48 hours if life and liberty is concerned) | • Specific, clear, and itemized information queries<br/>• Applicant's full name and postal/email address<br/>• ₹10 court fee stamp/postal order or BPL card copy |\n"
                "| **RTI First Appeal (Section 19(1))** | First Appellate Authority (FAA - senior departmental officer) | Within 30 days of PIO refusal or inaction; disposal within **30 to 45 business days** | • Copy of original RTI Application<br/>• PIO reply/rejection letter (if received)<br/>• Grounds of appeal |\n"
                "| **Central & State Grievance Portals (CPGRAMS / Aaple Sarkar)** | All government ministries and civic departments | **Free of Charge**; Statutory redressal within 30 days with tracking ID | • Factual grievance narrative with department details<br/>• Supporting letters, receipts, or site photos |\n"
                "| **Consumer Protection Commission (e-Daakhil / NCH 1915)** | District, State, and National Consumer Disputes Redressal Commissions | Nominal slab fees based on dispute claim value | • Purchase invoices / receipts / warranty cards<br/>• Written deficiency notice served to merchant<br/>• Statement of claim |\n\n"
                "💡 **Pro-Tip:** Applications can be lodged electronically via `rtionline.gov.in` and tracked directly with real-time status updates."
            )

    # 12. Cyber Crime Emergency (1930) & Digital Financial Safety
    if any(w in query_text for w in ["cyber", "fraud", "1930", "digital arrest", "otp fraud", "phishing", "lost phone", "ceir", "सायबर", "साइबर", "धोखाधड़ी"]):
        if is_marathi:
            return (
                "### 🚨 सायबर फसवणूक आणीबाणी (हेल्पलाइन १९३०) व सुरक्षा मार्गदर्शक\n\n"
                "ऑनलाइन आर्थिक फसवणूक, डिजिटल अरेस्ट किंवा मोबाईल चोरी झाल्यास तात्काळ खालील पावले उचलावीत:\n\n"
                "| आणीबाणी सेवा / पोर्टल | कार्यक्षेत्र व उद्देश | कृतीची वेळ (Window) | तक्रारीसाठी आवश्यक पुरावे |\n"
                "| :--- | :--- | :--- | :--- |\n"
                "| **सायबर आर्थिक हेल्पलाइन '१९३०'** | फसवणूक झालेल्या बँक खात्यातून/यूपीआयमधून पैसे रोखणे (Freeze Transactions) | फसवणूक झाल्यापासून **पहिले २ तास (Golden Hour)** अत्यंत महत्त्वाचे | • बँक खाते क्रमांक व बँक नाव<br/>• यूपीआय ट्रान्झॅक्शन आयडी (UTR/Ref No.)<br/>• फसवणूक झालेली रक्कम व वेळ<br/>• संशयित खात्याचे तपशील |\n"
                "| **राष्ट्रीय सायबर क्राईम रिपोर्टिंग पोर्टल (cybercrime.gov.in)** | सायबर गुन्हे, डिजिटल अरेस्ट, धमकी व ओळख चोरीची अधिकृत ऑनलाइन तक्रार/एफआयआर | २४x७ उपलब्ध | • स्क्रीनशॉट्स व चॅट इतिहास<br/>• कॉलिंग नंबर व एसएमएस नोंदी<br/>• बँक स्टेटमेंट प्रत |\n"
                "| **सीईआयआर (CEIR) पोर्टल (ceir.gov.in)** | हरवलेला किंवा चोरीला गेलेला मोबाईल फोन आयएमईआय (IMEI) वरून तात्काळ ब्लॉक करणे | मोबाईल हरवल्यास तात्काळ | • फोनचा १५ अंकी IMEI क्रमांक<br/>• पोलीस तक्रार पावती (Lost Phone Report)<br/>• खरेदी बिल व पर्यायी मोबाईल नंबर |\n\n"
                "💡 **महत्त्वाची सूचना:** पोलीस, सीबीआय, ट्राय किंवा न्यायालय कधीही 'डिजिटल अरेस्ट' करत नाहीत. असा कॉल आल्यास तात्काळ **१९३०** वर संपर्क साधावा."
            )
        elif is_hindi:
            return (
                "### 🚨 साइबर अपराध आपातकालीन सहायता (हेल्पलाइन 1930) एवं सुरक्षा\n\n"
                "ऑनलाइन वित्तीय धोखाधड़ी, डिजिटल अरेस्ट फ्रॉड अथवा मोबाइल चोरी होने पर तत्काल उठाए जाने वाले कदम:\n\n"
                "| आपातकालीन सेवा / पोर्टल | कार्यक्षेत्र एवं उद्देश्य | त्वरित कार्रवाई समय | शिकायत हेतु आवश्यक साक्ष्य |\n"
                "| :--- | :--- | :--- | :--- |\n"
                "| **साइबर वित्तीय हेल्पलाइन '1930'** | बैंक खाते अथवा यूपीआई से निकले पैसे को तुरंत फ्रीज (हस्तक्षेप) करवाना | धोखाधड़ी के **शुरुआती 2 घंटे (Golden Hour)** में सर्वाधिक प्रभावी | • बैंक खाता संख्या एवं बैंक का नाम<br/>• यूपीआई लेनदेन संदर्भ संख्या (UTR No.)<br/>• हस्तांतरित राशि एवं समय<br/>• धोखाधड़ी वाले खाते/नंबर का विवरण |\n"
                "| **राष्ट्रीय साइबर अपराध रिपोर्टिंग पोर्टल (cybercrime.gov.in)** | डिजिटल अरेस्ट, वित्तीय ठगी, ब्लैकमेलिंग एवं फर्जी एप्स की आधिकारिक एफआईआर दर्ज करना | 24x7 कभी भी उपलब्ध | • लेन-देन संदेश के स्क्रीनशॉट<br/>• संदिग्ध व्हाट्सएप/टेलीग्राम कॉल रिकॉर्ड<br/>• बैंक स्टेटमेंट नकल |\n"
                "| **सीईआईआर (CEIR) पोर्टल (ceir.gov.in)** | चोरी हुए या गुमशुदा मोबाइल फोन को देश भर में आईएमईआई (IMEI) से ब्लॉक व ट्रैक करना | फोन गुम होते ही तुरंत | • मोबाइल का 15 अंकों का IMEI नंबर<br/>• पुलिस गुमशुदगी रिपोर्ट प्रति<br/>• क्रय बिल एवं पहचान पत्र |\n\n"
                "💡 **विशेष सलाह:** कानून में 'डिजिटल अरेस्ट' नाम का कोई प्रावधान नहीं है। किसी भी संदिग्ध वीडियो कॉल पर पैसे ट्रांसफर न करें और सीधे **1930** डायल करें।"
            )
        else:
            return (
                "### 🚨 Comprehensive Guide to Cyber Fraud Emergency (Helpline 1930) & Digital Safety\n\n"
                "In case of cyber financial fraud, unauthorized UPI transfers, or digital arrest scams, immediate institutional remediation is critical:\n\n"
                "| Emergency Helpline / Portal | Operational Scope & Protection | Action Window | Evidence & Checklist |\n"
                "| :--- | :--- | :--- | :--- |\n"
                "| **National Cyber Financial Helpline 1930** | Real-time freezing of fraudulent bank and UPI fund flows across inter-bank gateways | **Within first 2 hours ('Golden Hour')** yields highest fund recovery rates | • Bank Account Number & Bank Name<br/>• UPI Transaction ID (UTR / Reference No.)<br/>• Disputed Amount & Exact Timestamp<br/>• Beneficiary account/handle if visible |\n"
                "| **National Cyber Crime Portal (cybercrime.gov.in)** | Formal online FIR and cyber complaint lodging for cyber extortion, fake apps, or identity theft | 24x7 Available | • Transaction SMS / Payment Gateways Screenshots<br/>• Offending Phone Numbers, Email Headers & WhatsApp Chats<br/>• Bank Statement Copy |\n"
                "| **CEIR Portal (ceir.gov.in)** | Central Equipment Identity Register to instantly block IMEI numbers of lost/stolen handsets nationwide | Immediately upon phone loss | • 15-Digit IMEI Number(s)<br/>• Police Missing Complaint / GD Entry<br/>• Device Purchase Invoice & Alternate Mobile Number |\n\n"
                "💡 **Pro-Tip:** No government agency (Police, CBI, ED, Courts, or TRAI) ever places citizens under 'Digital Arrest' via Skype or video calls. Hang up and report immediately to **1930**."
            )

    # 13. Specific Document Queries (Domicile, Income, Caste, 7/12, Ration, Marksheet)
    if is_doc_query or (matched_services and matched_services[0].service_type == "DOCUMENT"):
        svc = matched_services[0] if matched_services else None
        default_title = "शासकीय दाखला / प्रमाणपत्र" if is_marathi else ("सरकारी प्रमाण पत्र / दस्तावेज़" if is_hindi else "Official Certificate / Document")
        title = (svc.name_mr if is_marathi and svc.name_mr else (svc.name_hi if is_hindi and svc.name_hi else svc.name)) if svc else default_title
        default_dept = "महसूल व वन विभाग" if is_marathi else ("राजस्व एवं सार्वजनिक सेवा विभाग" if is_hindi else "Revenue & Public Services Department")
        dept = svc.department_name if svc else default_dept
        days = svc.processing_days if svc else 7
        fee_str = "मोफत" if (svc and svc.fee == 0) else ("निःशुल्क" if (is_hindi and svc and svc.fee == 0) else (f"₹{svc.fee}" if svc else "₹33.60"))
        if is_marathi:
            default_docs = [
                "आधार कार्ड (Aadhaar Card)",
                "ओळख पुरावा (मतदार ओळखपत्र / पॅन कार्ड)",
                "पत्ता पुरावा (लाईट बिल / शिधापत्रिका / वास्तव्याचा पुरावा)",
                "स्वघोषणापत्र (Self-Declaration Affidavit)",
                "पासपोर्ट आकाराचा फोटो"
            ]
        elif is_hindi:
            default_docs = [
                "आधार कार्ड (Aadhaar Card)",
                "पहचान पत्र (मतदाता पहचान पत्र / पैन कार्ड)",
                "निवास प्रमाण (बिजली बिल / राशन कार्ड / स्थानीय निवास साक्ष्य)",
                "स्व-घोषणा पत्र (Affidavit)",
                "पासपोर्ट साइज फोटो"
            ]
        else:
            default_docs = [
                "Aadhaar Card",
                "Identity Proof (Voter ID / PAN Card)",
                "Address / Residence Proof (Electricity Bill / Ration Card / 15-Yr Proof)",
                "Self-Declaration Affidavit",
                "Passport Size Photograph"
            ]
        docs_list = svc.documents_required if (svc and svc.documents_required) else default_docs


        if is_marathi:
            docs_bullets = "<br/>".join([f"• {d}" for d in docs_list])
            return (
                f"### 📑 '{title}' साठी आवश्यक कागदपत्रे व अर्ज प्रक्रिया\n\n"
                f"| प्रशासकीय माहिती | अधिकृत तपशील |\n"
                f"| :--- | :--- |\n"
                f"| **सक्षम विभाग** | {dept} |\n"
                f"| **प्रशासकीय कालावधी** | अंदाजे {days} कार्यदिवस |\n"
                f"| **शासकीय शुल्क** | {fee_str} |\n"
                f"| **अर्ज पोर्टल** | महा-सेवा डिजिटल पोर्टल (डेस्क पुनरावलोकन + १-क्लिक व्हॉल्ट) |\n\n"
                f"#### अनिवार्य कागदपत्रांची यादी (Documents Checklist):\n"
                f"| आवश्यक कागदपत्रे सूची |\n"
                f"| :--- |\n"
                f"| {docs_bullets} |\n\n"
                f"#### अर्ज कसा करावा?\n"
                f"१. आपण खाली दिलेल्या **'{title}'** सेवेवर क्लिक करा.\n"
                f"२. आपल्या **पर्सनल व्हॉल्ट (Personal Vault)** मधील अपलोड केलेले कागदपत्रे **'ऑटोफिल (Auto-Fill)'** बटणाद्वारे थेट अर्जात भरा.\n"
                f"३. अर्ज सादर केल्यानंतर आपल्याला तात्काळ ट्रॅकिंग आयडी मिळेल, ज्याद्वारे आपण अर्जाची स्थिती पाहू शकता."
            )
        elif is_hindi:
            docs_bullets = "<br/>".join([f"• {d}" for d in docs_list])
            return (
                f"### 📑 '{title}' हेतु आवश्यक दस्तावेज एवं आवेदन प्रक्रिया\n\n"
                f"| प्रशासनिक पैरामीटर | आधिकारिक विवरण |\n"
                f"| :--- | :--- |\n"
                f"| **सक्षम विभाग** | {dept} |\n"
                f"| **प्रसंस्करण समय** | लगभग {days} कार्यदिवस |\n"
                f"| **शासकीय शुल्क** | {fee_str} |\n"
                f"| **आवेदन पोर्टल** | महा-सेवा डिजिटल पोर्टल (डेस्क समीक्षा + 1-क्लिक वॉल्ट) |\n\n"
                f"#### अनिवार्य दस्तावेजों की सूची (Checklist):\n"
                f"| आवश्यक दस्तावेज़ सूची |\n"
                f"| :--- |\n"
                f"| {docs_bullets} |\n\n"
                f"#### आवेदन करने के चरण:\n"
                f"1. नीचे दिए गए **'{title}'** विकल्प पर क्लिक करें।\n"
                f"2. अपने **पर्सनल वॉल्ट (Personal Vault)** से **'ऑटोफिल (Auto-Fill)'** दबाकर विवरण स्वतः भरें।\n"
                f"3. फॉर्म जमा करते ही आपको ट्रैकिंग संख्या प्राप्त होगी जिससे प्रगति देखी जा सकती है।"
            )
        else:
            docs_bullets = "<br/>".join([f"• {d}" for d in docs_list])
            return (
                f"### 📑 Document Checklist & Application Procedure for '{title}'\n\n"
                f"| Administrative Parameter | Official Details |\n"
                f"| :--- | :--- |\n"
                f"| **Issuing Department** | {dept} |\n"
                f"| **Processing Timeline** | ~{days} business days |\n"
                f"| **Government Fee** | {fee_str} |\n"
                f"| **Application Portal** | Maha-Seva Online Integrator (Desk Review + 1-Click Vault) |\n\n"
                f"#### Mandatory Documents Checklist:\n"
                f"| Required Documents Checklist |\n"
                f"| :--- |\n"
                f"| {docs_bullets} |\n\n"
                f"#### How to Apply via Maha-Seva Portal:\n"
                f"1. Click the **'Apply Now'** button on the recommended service card below.\n"
                f"2. Use the **'Auto-Fill from Profile'** feature to automatically populate your verified personal details and attach documents directly from your **Personal Vault**.\n"
                f"3. Submit the application to receive an instant tracking application number with real-time desk review updates."
            )

    # 14. Fallback when matching services exist in catalog
    if matched_services:
        first = matched_services[0]
        title = first.name_mr if is_marathi and first.name_mr else (first.name_hi if is_hindi and first.name_hi else first.name)
        type_str = "कल्याणकारी योजना" if first.service_type == "SCHEME" else "शासकीय सेवा"

        if is_marathi:
            table_rows = []
            for s in matched_services[:4]:
                s_name = s.name_mr or s.name
                s_dept = s.department_name
                s_fee = "मोफत" if s.fee == 0 else f"₹{s.fee}"
                s_days = f"{s.processing_days} दिवस"
                s_jurisdiction = "महाराष्ट्र" if s.state_code == "MH" else ("केंद्र शासन" if s.state_code == "CENTRAL" else s.state_code)
                table_rows.append(f"| **{s_name}** | {s_dept} | {s_jurisdiction} | {s_fee} | {s_days} |")

            table_content = "\n".join(table_rows)
            return (
                f"### 🏛️ '{title}' व संबंधित शासकीय सेवा\n\n"
                f"आपल्या गरजेनुसार पोर्टलवरील उपलब्ध सेवांची माहिती खालीलप्रमाणे आहे:\n\n"
                f"| शासकीय सेवा / योजना | संबंधित विभाग | प्रशासकीय अधिकारक्षेत्र | शासकीय शुल्क | अंदाजे कालावधी |\n"
                f"| :--- | :--- | :--- | :--- | :--- |\n"
                f"{table_content}\n\n"
                f"👉 **पुढील कृती:** खालील सेवा कार्डवरून थेट अर्ज करण्यासाठी **'Apply Now'** वर क्लिक करा. आपल्या **पर्सनल व्हॉल्ट (Personal Vault)** मधील कागदपत्रे **१-क्लिक ऑटोफिल** द्वारे त्वरित जोडून अर्ज पूर्ण करा."
            )
        elif is_hindi:
            table_rows = []
            for s in matched_services[:4]:
                s_name = s.name_hi or s.name
                s_dept = s.department_name
                s_fee = "निःशुल्क" if s.fee == 0 else f"₹{s.fee}"
                s_days = f"{s.processing_days} दिन"
                s_jurisdiction = "महाराष्ट्र" if s.state_code == "MH" else ("केंद्र सरकार" if s.state_code == "CENTRAL" else s.state_code)
                table_rows.append(f"| **{s_name}** | {s_dept} | {s_jurisdiction} | {s_fee} | {s_days} |")

            table_content = "\n".join(table_rows)
            return (
                f"### 🏛️ '{title}' एवं संबंधित सरकारी सेवाएं\n\n"
                f"आपकी खोज के अनुसार महा-सेवा पोर्टल पर उपलब्ध संबंधित आधिकारिक सेवाएं:\n\n"
                f"| सरकारी सेवा / योजना | संबंधित विभाग | प्रशासनिक अधिकार क्षेत्र | शासकीय शुल्क | प्रसंस्करण समय |\n"
                f"| :--- | :--- | :--- | :--- | :--- |\n"
                f"{table_content}\n\n"
                f"👉 **आवेदन प्रक्रिया:** नीचे दिए गए सेवा कार्ड पर क्लिक करके सीधे आवेदन करें। अपने **पर्सनल वॉल्ट (Personal Vault)** से **1-क्लिक ऑटोफिल** का उपयोग कर विवरण तुरंत भरें।"
            )
        else:
            table_rows = []
            for s in matched_services[:4]:
                s_name = s.name
                s_dept = s.department_name
                s_fee = "Free of charge" if s.fee == 0 else f"₹{s.fee}"
                s_days = f"~{s.processing_days} days"
                s_jurisdiction = "Maharashtra" if s.state_code == "MH" else ("Central Gov" if s.state_code == "CENTRAL" else f"{s.state_code} Gov")
                table_rows.append(f"| **{s_name}** | {s_dept} | {s_jurisdiction} | {s_fee} | {s_days} |")

            table_content = "\n".join(table_rows)
            return (
                f"### 🏛️ Official Public Services & Schemes for '{first.name}'\n\n"
                f"Based on your query, the following official services and schemes from the Maha-Seva catalog match your requirements:\n\n"
                f"| Official Service / Scheme | Department | Jurisdiction | Government Fee | Processing Timeline |\n"
                f"| :--- | :--- | :--- | :--- | :--- |\n"
                f"{table_content}\n\n"
                f"👉 **Next Step:** Select the relevant service card below to initiate your application. You can use the **Personal Vault 1-Click Auto-Fill** to attach your verified profile documents without manual typing."
            )

    # 15. Complete Universal Citizen Advisory Framework for Open Queries
    if is_marathi:
        return (
            "### 🏛️ नागरी सेवा व प्रशासकीय मार्गदर्शन प्रणाली\n\n"
            "शासकीय लोकसेवा हक्क कायदा (Right to Public Services Act) आणि डिजिटल प्रशासन नियमांनुसार "
            "नागरिक कोणत्याही शासकीय दाखला किंवा कल्याणकारी योजनेसाठी खालील प्रमाणित प्रशासकीय प्रक्रियेचा वापर करू शकतात:\n\n"
            "| प्रशासकीय पुरावा प्रवर्ग | शासनमान्य कागदपत्रे सूची | सक्षम प्राधिकारी | पडताळणी पद्धत |\n"
            "| :--- | :--- | :--- | :--- |\n"
            "| **ओळख पुरावा (Identity Proof)** | • आधार कार्ड (Aadhaar Card)<br/>• मतदार ओळखपत्र (EPIC Voter ID)<br/>• पॅन कार्ड (PAN Card)<br/>• पासपोर्ट (Passport) | भारत विशिष्ट ओळख प्राधिकरण (UIDAI) / निवडणूक आयोग | बायोमेट्रिक / आधार ओटीपी / क्यूआर कोड |\n"
            "| **निवासी पुरावा (Residence / Domicile)** | • १५ वर्षांचा वास्तव्याचा पुरावा<br/>• अधिवास प्रमाणपत्र (Domicile)<br/>• लाईट बिल / घरपट्टी पावती<br/>• शिधापत्रिका (Ration Card) | महसूल विभाग (तहसीलदार) / स्थानिक स्वराज्य संस्था | क्षेत्रीय स्थळ पाहणी व डिजिटल नोंदणी |\n"
            "| **जन्म / वयाचा पुरावा (Age & Birth)** | • जन्म दाखला (Birth Certificate)<br/>• १० वी बोर्ड गुणपत्रिका / सनद<br/>• शाळा सोडल्याचा दाखला (TC/LC) | स्थानिक नागरी संस्था / शिक्षण मंडळ | डिजीलॉकर / शाळा अधिकृत अभिलेख |\n"
            "| **आर्थिक व सामाजिक पात्रता** | • तहसीलदार उत्पन्नाचा दाखला<br/>• जात प्रमाणपत्र व जात पडताळणी<br/>• अल्पभूधारक / शेतकरी दाखला | उपविभागीय अधिकारी (SDO) / जात पडताळणी समिती | शासकीय बारकोड व डिजिटल स्वाक्षरी |\n\n"
            "#### नागरी अर्जाची ४-टप्प्यांची कार्यपद्धती:\n"
            "१. **पर्सनल व्हॉल्टमध्ये कागदपत्रे ठेवणे:** आपले मूळ दाखले महा-सेवाच्या 'पर्सनल व्हॉल्ट' मध्ये एकदाच सुरक्षित अपलोड करा.\n"
            "२. **डिजिटल अर्ज सादर करणे:** कोणत्याही रांगेत उभे न राहता ऑनलाइन फॉर्म निवडून '१-क्लिक ऑटोफिल' ने माहिती भरा.\n"
            "३. **डेस्क पुनरावलोकन (Administrative Desk Review):** संबंधित शासकीय अधिकारी विहित मुदतीत (७ ते १५ दिवस) कागदपत्रांची पडताळणी करतात.\n"
            "४. **डिजिटल प्रमाणपत्र व डीबीटी लाभ:** अर्ज मंजूर झाल्यावर डिजिटल स्वाक्षरीचे प्रमाणपत्र डाऊनलोड करा किंवा बँक खात्यात थेट अनुदान मिळवा.\n\n"
            "💡 **मार्गदर्शन सूचना:** आपण वरील शोध पट्टीमध्ये विशिष्ट योजना (उदा. 'पीएम किसान', 'लाडकी बहीण', 'मुद्रा लोन', 'सातबारा', 'रेशन कार्ड') शोधू शकता किंवा थेट प्रश्न विचारू शकता."
        )
    elif is_hindi:
        return (
            "### 🏛️ नागरिक सेवाएं एवं प्रशासनिक मार्गदर्शन प्रणाली\n\n"
            "लोक सेवा गारंटी अधिनियम एवं डिजिटल गवर्नेंस के तहत नागरिक किसी भी सरकारी सेवा, प्रमाण पत्र अथवा कल्याणकारी योजना हेतु "
            "निम्नलिखित मानकीकृत प्रशासनिक प्रक्रिया एवं दस्तावेज प्रारूप का उपयोग कर सकते हैं:\n\n"
            "| प्रशासनिक साक्ष्य श्रेणी | शासन द्वारा मान्य दस्तावेज़ सूची | सक्षम प्राधिकारी | सत्यापन विधि |\n"
            "| :--- | :--- | :--- | :--- |\n"
            "| **पहचान प्रमाण (Identity Proof)** | • आधार कार्ड (Aadhaar Card)<br/>• मतदाता पहचान पत्र (Voter ID)<br/>• पैन कार्ड (PAN Card)<br/>• पासपोर्ट (Passport) | यूआईडीएआई (UIDAI) / भारत निर्वाचन आयोग / आयकर विभाग | बायोमेट्रिक / आधार ओटीपी / डिजिटल क्यूआर |\n"
            "| **निवास प्रमाण (Residence / Domicile)** | • मूल निवास प्रमाण पत्र (Domicile)<br/>• बिजली बिल / गृहकर रसीद<br/>• राशन कार्ड (Ration Card)<br/>• निवास अवधि साक्ष्य | राजस्व विभाग (तहसीलदार / उपजिलाधिकारी) | क्षेत्रीय पटवारी जांच व वाटरमार्क नकल |\n"
            "| **जन्म एवं आयु प्रमाण (Age Proof)** | • जन्म प्रमाण पत्र (Birth Certificate)<br/>• 10वीं बोर्ड अंकतालिका<br/>• स्कूल लीविंग सर्टिफिकेट (TC) | नगर निगम / शिक्षा बोर्ड | डिजिलॉकर अधिकृत डिजिटल रिकॉर्ड |\n"
            "| **वित्तीय व श्रेणी पात्रता** | • तहसीलदार आय प्रमाण पत्र<br/>• जाति प्रमाण पत्र एवं वैधता<br/>• कृषि भूमि खसरा/7-12 अभिलेख | उप-विभागीय अधिकारी (SDO) / जाति जांच समिति | बारकोड व डिजिटल हस्ताक्षर द्वारा |\n\n"
            "#### नागरिक आवेदन के 4 प्रमुख चरण:\n"
            "1. **पर्सनल वॉल्ट में दस्तावेज़ संधारण:** अपने आधिकारिक प्रमाण पत्र महा-सेवा पोर्टल के 'पर्सनल वॉल्ट' में एक बार अपलोड करें।\n"
            "2. **डिजिटल आवेदन एवं 1-क्लिक ऑटोफिल:** पोर्टल पर मनचाही सेवा चुनकर 'ऑटोफिल' द्वारा बिना मैनुअल टाइपिंग के विवरण भरें।\n"
            "3. **डेस्क समीक्षा (Administrative Desk Review):** संबंधित विभागीय अधिकारी तय समय सीमा (7 से 15 दिन) में आवेदन की समीक्षा करते हैं।\n"
            "4. **डिजिटल प्रमाण पत्र एवं डीबीटी लाभ:** अनुमोदन के पश्चात डिजिटल हस्ताक्षरित प्रमाण पत्र तुरंत डाउनलोड करें अथवा सीधे बैंक खाते में सब्सिडी प्राप्त करें।\n\n"
            "💡 **विशेष सलाह:** आप विशिष्ट सेवा (जैसे 'पीएम किसान', 'लाडली बहना', 'मुद्रा लोन', '7/12 खसरा', 'राशन कार्ड', 'ड्राइविंग लाइसेंस') लिखकर विस्तृत जानकारी ले सकते हैं।"
        )
    else:
        return (
            "### 🏛️ Comprehensive Citizen Guidance & Administrative Procedural Framework\n\n"
            "Under the statutory Right to Public Services (RTS) framework and national digital governance mandates, "
            "citizens can access public entitlements, certificates, and welfare subsidies following this unified administrative protocol:\n\n"
            "| Governance Proof Category | Standard Accepted Documents Checklist | Statutory Issuing Authority | Verification Mechanism |\n"
            "| :--- | :--- | :--- | :--- |\n"
            "| **Identity Proof (POI)** | • Aadhaar Card (UIDAI)<br/>• Voter Identity Card (EPIC)<br/>• PAN Card (Income Tax)<br/>• Indian Passport | UIDAI / Election Commission / Income Tax / MEA | Online OTP / Biometric / Cryptographic QR Code |\n"
            "| **Residence / Domicile Proof (POR)** | • Domicile & Nationality Certificate<br/>• Latest Electricity Bill / Water Bill<br/>• Valid Ration Card<br/>• Registered Rent Agreement / 15-Yr Proof | Revenue Department (Tahsildar / SDO) / Local Discom | Field Verification & Official Land/Municipal Record |\n"
            "| **Age & Birth Proof (DOB)** | • Official Birth Certificate<br/>• 10th / SSC Board Passing Certificate<br/>• School Leaving Certificate (TC) | Municipal Registrar of Births & Deaths / Education Board | DigiLocker Institutional Verification |\n"
            "| **Financial & Category Eligibility** | • Tahsildar Authorized Income Certificate<br/>• Caste & Validity Certificate<br/>• Landholding Extract (7/12 / Khasra) | Sub-Divisional Officer (SDO) / Caste Scrutiny Committee | Tahsil Barcode Verification & Central Portal Mapping |\n\n"
            "#### Standard 4-Stage Citizen Application Lifecycle:\n"
            "1. **Vault Document Preparation:** Store verified identity and educational credentials securely in your Maha-Seva **Personal Vault**.\n"
            "2. **Online Submission:** Choose any catalog service and apply with **1-Click Auto-Fill** — eliminating physical queues and repetitive paperwork.\n"
            "3. **Administrative Desk Review:** Verification officers review the dossier under statutory Citizens' Charter SLAs (typically 7 to 15 business days).\n"
            "4. **Digital Issuance & DBT Disbursement:** Receive digitally signed, barcoded certificates or direct subsidy disbursement straight into your Aadhaar-seeded bank account.\n\n"
            "💡 **Pro-Tip:** You can ask about any specific public service, welfare scheme (e.g. 'PM-KISAN', 'Ladki Bahin', 'MUDRA Loan', '7/12 Land Record', 'Ration Card', 'Driving License'), or legal procedure directly."
        )

def run_local_fallback(
    query_text: str,
    lang: str,
    state_code: Optional[str],
    db: Session
) -> AssistantQueryResponse:
    matched_services = find_semantic_services(query_text, state_code, db)
    rich_response = generate_rich_local_knowledge(query_text, lang, matched_services)

    return AssistantQueryResponse(
        response=rich_response,
        suggested_services=matched_services,
        engine="local-catalog-intelligence"
    )

CANDIDATE_GEMINI_MODELS = [
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-2.0-flash-lite",
    "gemini-2.5-flash"
]

_ACTIVE_GEMINI_MODEL: Optional[str] = None

def save_key_to_env(api_key: str):
    """Persist verified key to backend/.env and current runtime environment."""
    try:
        env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))
        lines = []
        found = False
        if os.path.exists(env_path):
            with open(env_path, "r", encoding="utf-8") as f:
                lines = f.readlines()
            new_lines = []
            for line in lines:
                if line.strip().startswith("GEMINI_API_KEY="):
                    new_lines.append(f"GEMINI_API_KEY={api_key}\n")
                    found = True
                else:
                    new_lines.append(line)
            lines = new_lines
        if not found:
            if lines and not lines[-1].endswith("\n"):
                lines.append("\n")
            lines.append(f"GEMINI_API_KEY={api_key}\n")
        with open(env_path, "w", encoding="utf-8") as f:
            f.writelines(lines)
        os.environ["GEMINI_API_KEY"] = api_key
        settings.GEMINI_API_KEY = api_key
        logger.info("Successfully persisted GEMINI_API_KEY to backend/.env and runtime settings")
    except Exception as e:
        logger.warning(f"Unable to write GEMINI_API_KEY to backend/.env: {e}")

def resolve_working_gemini_model(client, preferred_model: Optional[str] = None) -> str:
    """Probe candidate models to find one that works for the user's API key.
    Handles 404/NOT_FOUND/unsupported model deprecations gracefully.
    """
    global _ACTIVE_GEMINI_MODEL
    from google.genai import types

    candidates = list(CANDIDATE_GEMINI_MODELS)
    if preferred_model and preferred_model in candidates:
        candidates.remove(preferred_model)
        candidates.insert(0, preferred_model)
    elif _ACTIVE_GEMINI_MODEL and _ACTIVE_GEMINI_MODEL in candidates:
        candidates.remove(_ACTIVE_GEMINI_MODEL)
        candidates.insert(0, _ACTIVE_GEMINI_MODEL)

    last_error = None
    for model_name in candidates:
        try:
            client.models.generate_content(
                model=model_name,
                contents="OK",
                config=types.GenerateContentConfig(max_output_tokens=5, temperature=0.0)
            )
            _ACTIVE_GEMINI_MODEL = model_name
            logger.info(f"Resolved verified active Gemini model: {model_name}")
            return model_name
        except Exception as e:
            last_error = e
            err_str = str(e).lower()
            # If 404, not_found, or model is deprecated / not available, try next candidate
            if (
                "404" in err_str
                or "not_found" in err_str
                or "not available" in err_str
                or "no longer available" in err_str
                or "unsupported" in err_str
                or "not found" in err_str
            ):
                logger.info(f"Gemini model '{model_name}' not available for this key (404 / deprecated). Trying fallback candidate...")
                continue
            # If it is an auth or quota error, stop probing and raise immediately
            raise e

    if last_error:
        raise last_error
    return "gemini-2.0-flash"

def get_effective_server_key() -> str:
    """Dynamically read backend/.env so edits to .env take effect immediately, falling back to runtime settings."""
    try:
        from dotenv import dotenv_values
        env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))
        if os.path.exists(env_path):
            vals = dotenv_values(env_path)
            env_key = (vals.get("GEMINI_API_KEY") or "").strip()
            if env_key:
                settings.GEMINI_API_KEY = env_key
                os.environ["GEMINI_API_KEY"] = env_key
                return env_key
    except Exception as e:
        logger.warning(f"Error reading backend/.env: {e}")

    return (settings.GEMINI_API_KEY or "").strip() or os.getenv("GEMINI_API_KEY", "").strip()

@router.get("/status", response_model=AssistantStatusResponse)
def get_assistant_status():
    server_key = get_effective_server_key()
    if server_key:
        return AssistantStatusResponse(
            has_server_key=True,
            model=_ACTIVE_GEMINI_MODEL or "gemini-2.0-flash",
            is_active=True,
            source="server_env"
        )
    return AssistantStatusResponse(
        has_server_key=False,
        model=None,
        is_active=False,
        source="none"
    )

@router.post("/validate-key", response_model=KeyValidationResponse)
def validate_gemini_key(data: KeyValidationRequest):
    key = (data.api_key or "").strip()
    if not key:
        return KeyValidationResponse(valid=False, message="API key cannot be empty.")
    try:
        from google import genai
        client = genai.Client(api_key=key)
        working_model = resolve_working_gemini_model(client)
        save_key_to_env(key)

        display_name = "Gemini 2.0 Flash" if "2.0" in working_model else ("Gemini 1.5 Flash" if "1.5" in working_model else working_model)
        return KeyValidationResponse(
            valid=True,
            model=working_model,
            message=f"Google {display_name} connected and verified successfully!"
        )
    except Exception as e:
        err_msg = str(e)
        logger.warning(f"Gemini API key validation failed: {err_msg}")
        if "API_KEY_INVALID" in err_msg or "400" in err_msg or "invalid" in err_msg.lower():
            return KeyValidationResponse(valid=False, message="The provided Gemini API key is invalid or unauthorized.")
        if "RESOURCE_EXHAUSTED" in err_msg or "429" in err_msg or "quota" in err_msg.lower():
            return KeyValidationResponse(valid=False, message="Gemini API rate limit or quota exceeded for this key.")
        return KeyValidationResponse(valid=False, message=f"Verification failed: {err_msg[:140]}")

@router.post("/chat", response_model=AssistantQueryResponse)
@router.post("/suggest", response_model=AssistantQueryResponse)
def query_assistant(data: AssistantQueryRequest, db: Session = Depends(get_db)):
    query_text = data.query.lower().strip()
    target_lang = (data.language or "en").lower()

    # Detect script if user typed Devanagari without switching language toggle
    has_devanagari = any(ord(c) >= 0x0900 and ord(c) <= 0x097F for c in query_text)
    if has_devanagari and target_lang == "en":
        if any(w in query_text for w in ["आहे", "हवा", "दाखला", "उतारा", "माझे", "कसा", "योजना", "कागदपत्रे", "कागदपत्र"]):
            target_lang = "mr"
        else:
            target_lang = "hi"

    # Strictly access server env's API key only (no user/client API key accepted)
    effective_api_key = get_effective_server_key()

    # If an API key is available, execute Gemini
    if effective_api_key:
        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=effective_api_key)
            working_model = resolve_working_gemini_model(client)

            # Query all active services from DB to feed as strict catalog grounding
            services_query = db.query(Service).filter(Service.is_active == True)
            if data.state_code and data.state_code.upper() != "ALL":
                if data.state_code.upper() == "CENTRAL":
                    services_query = services_query.filter(Service.state_code == "CENTRAL")
                else:
                    services_query = services_query.filter(
                        or_(
                            Service.state_code == data.state_code.upper(),
                            Service.state_code == "CENTRAL"
                        )
                    )
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
                    "service_type": s.service_type or "DOCUMENT",
                    "scheme_type": s.scheme_type,
                    "benefit_amount": s.benefit_amount,
                    "eligibility": s.eligibility,
                    "documents_required": s.documents_required if isinstance(s.documents_required, list) else [],
                    "fee": s.fee,
                    "processing_days": s.processing_days,
                    "description": s.description
                })

            system_instruction = (
                "You are the official Smart Citizen AI Assistant for the Maha-Seva Integrator portal "
                "(Smart India Hackathon 2026, PS-129). You are an advanced AI assistant designed to provide "
                "deeply informative, authoritative, structured, and helpful guidance on government public services, "
                "welfare schemes, administrative procedures, civic rights, and citizen inquiries across all Indian states, UTs, and Central ministries.\n\n"
                "DUAL CORE MISSION:\n"
                "1. PRIMARY GROUNDING IN PORTAL DATA: You are provided with the complete catalog of official services and welfare schemes on the Maha-Seva portal. "
                "Whenever a citizen asks about public services, welfare schemes, subsidies, government certificates, departments, fees, timelines, or application procedures present in this catalog, "
                "PRIORITIZE and GROUND your response primarily in this catalog data. Accurately cite official service names, departments, exact fees, processing days, eligibility criteria, and required documents. "
                "Always return matching integer service IDs in 'matched_service_ids' so the user sees direct interactive service cards. "
                "Highlight how citizens can apply directly through Maha-Seva using the 'Personal Vault' 1-Click Auto-Fill to attach verified documents without manual re-typing.\n\n"
                "2. UNIVERSAL OPEN-DOMAIN CITIZEN Q&A: Citizens can ask ANY question — including general governance, constitutional rights, RTI Act procedures, RTO driving rules, "
                "passport & visa guidelines, voter registration, property & land mutation disputes, consumer forum complaints, cybercrime emergency (1930), Aadhaar-PAN linking, education boards, "
                "tax procedures, labor welfare, or general life and civic inquiries. "
                "As an advanced AI model, NEVER refuse to answer, NEVER say 'I only know catalog services', and NEVER say 'No matching service found'. "
                "Answer ANY question thoroughly, accurately, and authoritatively using your extensive knowledge base.\n\n"
                "CRITICAL FORMATTING & TABULAR RULES:\n"
                "1. Respond in the requested language ('en' = English, 'mr' = Marathi, 'hi' = Hindi). Keep tone respectful, authoritative, and helpful.\n"
                "2. TABULAR FORMAT FOR COMPARISONS & SCHEMES: Whenever detailing, comparing, or listing multiple schemes, subsidies, services, card categories (e.g. APL vs BPL, Form 6 vs Form 8), "
                "or document requirements, ALWAYS present them in a clean Markdown Table:\n"
                "   - For Welfare Schemes / Subsidies / Services:\n"
                "     | Scheme / Service Name | Financial Benefit & Subsidy | Eligibility Criteria | Required Documents Checklist |\n"
                "   - In the 'Required Documents Checklist' column, separate items using '<br/>• ' (e.g. '• Aadhaar Card<br/>• 7/12 Land Record<br/>• Bank Passbook').\n"
                "   - In the 'Financial Benefit & Subsidy' column, highlight key monetary figures and percentages in bold (e.g. '**Up to 60% Subsidy**', '**₹6,000 / yr**', '**₹1,500 / month**').\n"
                "3. STRUCTURED CIVIC ANSWERS FOR PROCEDURES & OPEN QUESTIONS:\n"
                "   - Start with a clear top-level heading with an appropriate icon (e.g. '### 🌾 ...', '### 🏛️ ...', '### ⚖️ ...', '### 🚗 ...').\n"
                "   - Provide a concise summary explaining the statutory framework or policy.\n"
                "   - Use Step-by-Step Numbered Lists (1., 2., 3.) for application or resolution workflows.\n"
                "   - Use clean bullet points for conditions and rules.\n"
                "   - Conclude with a helpful callout ('💡 **Pro-Tip:** ...') detailing practical advice (e.g., DigiLocker integration, NPCI Aadhaar Seeding, fee exemptions, or applying via Maha-Seva's Personal Vault).\n"
                "4. In the 'matched_service_ids' array, return integer IDs of the most relevant services or schemes from the catalog (order by relevance, up to 5). If the query is purely open-domain with no catalog match, return an empty list [].\n"
                "5. Always return strictly valid JSON matching: {\"response\": \"<markdown>\", \"matched_service_ids\": [<ids>]}."
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
Available Official Services & Schemes Catalog:
{json.dumps(catalog_summary, ensure_ascii=False)}

Respond strictly in valid JSON format:
{{
  "response": "<rich structured markdown response in {target_lang}>",
  "matched_service_ids": [<integer ids of matching services>]
}}"""

            ai_response = None
            try:
                ai_response = client.models.generate_content(
                    model=working_model,
                    contents=user_prompt,
                    config=types.GenerateContentConfig(
                        system_instruction=system_instruction,
                        response_mime_type="application/json",
                        temperature=0.2
                    )
                )
            except Exception as gen_err:
                err_lower = str(gen_err).lower()
                if any(x in err_lower for x in ["404", "not_found", "not available", "no longer available", "unsupported"]):
                    global _ACTIVE_GEMINI_MODEL
                    _ACTIVE_GEMINI_MODEL = None
                    for fallback_model in ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-2.0-flash-lite"]:
                        if fallback_model != working_model:
                            try:
                                ai_response = client.models.generate_content(
                                    model=fallback_model,
                                    contents=user_prompt,
                                    config=types.GenerateContentConfig(
                                        system_instruction=system_instruction,
                                        response_mime_type="application/json",
                                        temperature=0.2
                                    )
                                )
                                working_model = fallback_model
                                _ACTIVE_GEMINI_MODEL = fallback_model
                                break
                            except Exception:
                                continue
                if not ai_response:
                    raise gen_err

            raw_text = (ai_response.text or "").strip()
            clean_text = raw_text
            if clean_text.startswith("```json"):
                clean_text = clean_text[7:]
            elif clean_text.startswith("```"):
                clean_text = clean_text[3:]
            if clean_text.endswith("```"):
                clean_text = clean_text[:-3]
            clean_text = clean_text.strip()

            parsed = json.loads(clean_text)

            matched_ids = parsed.get("matched_service_ids", [])
            suggested = []
            if matched_ids:
                service_map = {s.id: s for s in all_services}
                for sid in matched_ids:
                    if sid in service_map:
                        suggested.append(build_suggested_service(service_map[sid]))

            # If Gemini didn't return any matched IDs, search semantically to accompany the answer
            if not suggested:
                suggested = find_semantic_services(query_text, data.state_code, db)

            ai_text = (parsed.get("response") or "").strip()
            if ai_text:
                return AssistantQueryResponse(
                    response=ai_text,
                    suggested_services=suggested,
                    engine=working_model
                )

        except Exception as e:
            logger.warning(f"Gemini AI Assistant generation failed or key invalid: {e}. Falling back to local intelligence.")
            return run_local_fallback(query_text, target_lang, data.state_code, db)

    # If no API key provided, use the zero-crash local catalog intelligence
    return run_local_fallback(query_text, target_lang, data.state_code, db)

