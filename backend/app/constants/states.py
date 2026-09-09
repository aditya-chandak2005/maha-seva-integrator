from typing import Dict, List, Optional

STATES_AND_UTS: List[Dict[str, str]] = [
    # 28 STATES
    {"code": "AP", "name": "Andhra Pradesh", "hi": "आंध्र प्रदेश", "mr": "आंध्र प्रदेश", "type": "STATE"},
    {"code": "AR", "name": "Arunachal Pradesh", "hi": "अरुणाचल प्रदेश", "mr": "अरुणाचल प्रदेश", "type": "STATE"},
    {"code": "AS", "name": "Assam", "hi": "असम", "mr": "आसाम", "type": "STATE"},
    {"code": "BR", "name": "Bihar", "hi": "बिहार", "mr": "बिहार", "type": "STATE"},
    {"code": "CG", "name": "Chhattisgarh", "hi": "छत्तीसगढ़", "mr": "छत्तीसगड", "type": "STATE"},
    {"code": "GA", "name": "Goa", "hi": "गोवा", "mr": "गोवा", "type": "STATE"},
    {"code": "GJ", "name": "Gujarat", "hi": "गुजरात", "mr": "गुजरात", "type": "STATE"},
    {"code": "HR", "name": "Haryana", "hi": "हरियाणा", "mr": "हरियाणा", "type": "STATE"},
    {"code": "HP", "name": "Himachal Pradesh", "hi": "हिमाचल प्रदेश", "mr": "हिमाचल प्रदेश", "type": "STATE"},
    {"code": "JH", "name": "Jharkhand", "hi": "झारखंड", "mr": "झारखंड", "type": "STATE"},
    {"code": "KA", "name": "Karnataka", "hi": "कर्नाटक", "mr": "कर्नाटक", "type": "STATE"},
    {"code": "KL", "name": "Kerala", "hi": "केरल", "mr": "केरळ", "type": "STATE"},
    {"code": "MP", "name": "Madhya Pradesh", "hi": "मध्य प्रदेश", "mr": "मध्य प्रदेश", "type": "STATE"},
    {"code": "MH", "name": "Maharashtra", "hi": "महाराष्ट्र", "mr": "महाराष्ट्र", "type": "STATE"},
    {"code": "MN", "name": "Manipur", "hi": "मणिपुर", "mr": "मणिपूर", "type": "STATE"},
    {"code": "ML", "name": "Meghalaya", "hi": "मेघालय", "mr": "मेघालय", "type": "STATE"},
    {"code": "MZ", "name": "Mizoram", "hi": "मिज़ोरम", "mr": "मिझोराम", "type": "STATE"},
    {"code": "NL", "name": "Nagaland", "hi": "नागालैंड", "mr": "नागालँड", "type": "STATE"},
    {"code": "OD", "name": "Odisha", "hi": "ओडिशा", "mr": "ओडिशा", "type": "STATE"},
    {"code": "PB", "name": "Punjab", "hi": "पंजाब", "mr": "पंजाब", "type": "STATE"},
    {"code": "RJ", "name": "Rajasthan", "hi": "राजस्थान", "mr": "राजस्थान", "type": "STATE"},
    {"code": "SK", "name": "Sikkim", "hi": "सिक्किम", "mr": "सिक्कीम", "type": "STATE"},
    {"code": "TN", "name": "Tamil Nadu", "hi": "तमिलनाडु", "mr": "तमिळनाडू", "type": "STATE"},
    {"code": "TG", "name": "Telangana", "hi": "तेलंगाना", "mr": "तेलंगणा", "type": "STATE"},
    {"code": "TR", "name": "Tripura", "hi": "त्रिपुरा", "mr": "त्रिपुरा", "type": "STATE"},
    {"code": "UP", "name": "Uttar Pradesh", "hi": "उत्तर प्रदेश", "mr": "उत्तर प्रदेश", "type": "STATE"},
    {"code": "UK", "name": "Uttarakhand", "hi": "उत्तराखंड", "mr": "उत्तराखंड", "type": "STATE"},
    {"code": "WB", "name": "West Bengal", "hi": "पश्चिम बंगाल", "mr": "पश्चिम बंगाल", "type": "STATE"},

    # 8 UNION TERRITORIES
    {"code": "AN", "name": "Andaman and Nicobar Islands", "hi": "अंडमान और निकोबार द्वीप समूह", "mr": "अंदमान आणि निकोबार बेटे", "type": "UT"},
    {"code": "CH", "name": "Chandigarh", "hi": "चंडीगढ़", "mr": "चंदिगढ", "type": "UT"},
    {"code": "DN", "name": "Dadra & Nagar Haveli and Daman & Diu", "hi": "दादरा और नगर हवेली एवं दमन और दीव", "mr": "दादरा आणि नगर हवेली आणि दमण आणि दीव", "type": "UT"},
    {"code": "DL", "name": "Delhi NCT", "hi": "दिल्ली राष्ट्रीय राजधानी क्षेत्र", "mr": "दिल्ली राष्ट्रीय राजधानी क्षेत्र", "type": "UT"},
    {"code": "JK", "name": "Jammu and Kashmir", "hi": "जम्मू और कश्मीर", "mr": "जम्मू आणि काश्मीर", "type": "UT"},
    {"code": "LA", "name": "Ladakh", "hi": "लद्दाख", "mr": "लडाख", "type": "UT"},
    {"code": "LD", "name": "Lakshadweep", "hi": "लक्षद्वीप", "mr": "लक्षद्वीप", "type": "UT"},
    {"code": "PY", "name": "Puducherry", "hi": "पुडुचेरी", "mr": "पुडुचेरी", "type": "UT"},

    # CENTRAL GOVERNMENT
    {"code": "CENTRAL", "name": "Central Government (Govt of India)", "hi": "भारत सरकार (केन्द्र सरकार)", "mr": "भारत सरकार (केंद्र सरकार)", "type": "CENTRAL"}
]

STATE_CODE_MAP = {s["code"]: s for s in STATES_AND_UTS}

def is_valid_state_code(code: str) -> bool:
    if not code:
        return False
    return code.upper() in STATE_CODE_MAP or code.upper() in ("ALL", "IN", "GOI")

def get_state_info(code: str) -> Optional[Dict[str, str]]:
    if not code:
        return None
    return STATE_CODE_MAP.get(code.upper())
