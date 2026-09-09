"""
Maha-Seva Integrator - Database Seeding Script (All-India National Edition)
Seeds departments, categories, services, dynamic forms, demo users, and sample applications
for ALL 28 States and 8 Union Territories of India (36 administrative divisions).
"""
import sys
import os

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from app.core.database import SessionLocal
from app.core.security import get_password_hash, RoleEnum
from app.models import (
    Role, Department, ServiceCategory, Service, ServiceForm,
    User, Application, ApplicationEvent, Notification, AuditLog
)

def seed():
    print("==================================================")
    print("Maha-Seva Integrator - Seeding All-India (36 States & UTs) Data")
    print("==================================================")
    
    db = SessionLocal()
    try:
        # 1. Seed Roles
        roles_data = [
            {"name": RoleEnum.CITIZEN, "description": "Citizen / Public Portal User"},
            {"name": RoleEnum.OFFICER, "description": "Department Verification & Processing Officer"},
            {"name": RoleEnum.DEPARTMENT_ADMIN, "description": "Departmental Administrative Officer"},
            {"name": RoleEnum.SUPER_ADMIN, "description": "State Platform Governance Super Administrator"},
        ]
        for r in roles_data:
            existing = db.query(Role).filter(Role.name == r["name"]).first()
            if not existing:
                db.add(Role(**r))
        db.commit()
        print("[OK] Roles seeded.")

        # 2. Seed All-India Categories
        cat_data = [
            {
                "name": "Certificates & Licences",
                "name_mr": "प्रमाणपत्रे आणि परवाने",
                "name_hi": "प्रमाण पत्र एवं लाइसेंस",
                "code": "CERT",
                "icon": "FileCheck2",
                "description": "Statutory certificates of identity, caste, domicile, income, and community."
            },
            {
                "name": "Revenue & Land Records",
                "name_mr": "महसूल आणि भूमी अभिलेख",
                "name_hi": "राजस्व एवं भू-अभिलेख",
                "code": "REV_LAND",
                "icon": "Building",
                "description": "Land ownership extracts, 7/12, RoR, mutation records, and title certificates."
            },
            {
                "name": "Civic & Municipal Services",
                "name_mr": "नागरी व महापालिका सेवा",
                "name_hi": "नागरिक एवं नगरपालिका सेवाएं",
                "code": "CIVIC",
                "icon": "Building2",
                "description": "Urban local body water supply, trade permits, birth/death records, and civic clearances."
            },
            {
                "name": "Social Welfare & Schemes",
                "name_mr": "सामाजिक न्याय व कल्याण",
                "name_hi": "सामाजिक न्याय एवं जनकल्याण",
                "code": "WELFARE",
                "icon": "Users",
                "description": "Direct benefit transfers, pensions, senior citizen cards, and disability support."
            },
            {
                "name": "Utilities & Power",
                "name_mr": "ऊर्जा व वीज वितरण",
                "name_hi": "ऊर्जा एवं विद्युत वितरण",
                "code": "POWER",
                "icon": "Zap",
                "description": "Electricity distribution, new meter connections, load sanctioning, and billing."
            },
            {
                "name": "Food & Civil Supplies",
                "name_mr": "अन्न व नागरी पुरवठा",
                "name_hi": "खाद्य एवं नागरिक आपूर्ति",
                "code": "FOOD",
                "icon": "Shield",
                "description": "National Food Security Act (NFSA) ration cards, grain allocations, and Fair Price Shop services."
            },
            {
                "name": "Transport & Mobility",
                "name_mr": "परिवहन व वाहन सेवा",
                "name_hi": "परिवहन एवं वाहन सेवाएं",
                "code": "TRANSPORT",
                "icon": "Clock",
                "description": "Driving licenses, vehicle registrations, NOCs, and road transport clearances."
            },
            {
                "name": "Industry & MSME",
                "name_mr": "उद्योग व एमएसएमई",
                "name_hi": "उद्योग एवं एमएसएमई",
                "code": "INDUSTRY",
                "icon": "Award",
                "description": "Enterprise registrations, single window business clearances, and factory licenses."
            },
            {
                "name": "Education & Examination Boards",
                "name_mr": "शिक्षण आणि परीक्षा मंडळे",
                "name_hi": "शिक्षा एवं परीक्षा बोर्ड",
                "code": "EDUCATION",
                "icon": "GraduationCap",
                "description": "School marksheets, CBSE and State Board certificates, scholarships, and student IDs."
            },
        ]
        cat_map = {}
        for c in cat_data:
            existing = db.query(ServiceCategory).filter(ServiceCategory.code == c["code"]).first()
            if not existing:
                created = ServiceCategory(**c)
                db.add(created)
                db.flush()
                cat_map[c["code"]] = created.id
            else:
                existing.name = c["name"]
                existing.name_mr = c["name_mr"]
                existing.name_hi = c["name_hi"]
                existing.icon = c["icon"]
                existing.description = c["description"]
                cat_map[c["code"]] = existing.id
        db.commit()
        print(f"[OK] {len(cat_map)} Service Categories verified.")

        # 3. Seed All 36 States & UTs Departments
        # Standard department entries across India
        departments_catalog = [
            # --- MAHARASHTRA (MH) ---
            {"code": "MH_REV", "state_code": "MH", "name": "Maharashtra Revenue and Forest Department", "name_mr": "महसूल व वन विभाग (महाराष्ट्र)", "name_hi": "महाराष्ट्र राजस्व एवं वन विभाग", "description": "Land administration and statutory certificates across Maharashtra."},
            {"code": "MH_UDD", "state_code": "MH", "name": "Maharashtra Urban Development & Municipal Admin", "name_mr": "नगर विकास विभाग (महाराष्ट्र)", "name_hi": "महाराष्ट्र नगर विकास एवं नगरपालिका प्रशासन", "description": "Urban local bodies (BMC, PMC, PCMC, NMMC) and civic utilities."},
            {"code": "MH_SOC", "state_code": "MH", "name": "Maharashtra Social Justice & Special Assistance", "name_mr": "सामाजिक न्याय व विशेष सहाय्य विभाग", "name_hi": "महाराष्ट्र सामाजिक न्याय एवं विशेष सहायता विभाग", "description": "Affirmative action, caste validation, and welfare programs."},
            {"code": "MH_LRD", "state_code": "MH", "name": "Maharashtra Land Records & Settlement Office", "name_mr": "भूमी अभिलेख व जमाबंदी विभाग", "name_hi": "महाराष्ट्र भू-अभिलेख एवं जमाबंदी कार्यालय", "description": "Digital Mahabhulekh 7/12 extracts, Property Cards, and mutation."},
            {"code": "MH_PHD", "state_code": "MH", "name": "Maharashtra Public Health Department", "name_mr": "सार्वजनिक आरोग्य विभाग", "name_hi": "महाराष्ट्र सार्वजनिक स्वास्थ्य विभाग", "description": "Vital statistics, civil birth and death registrations."},

            # --- KARNATAKA (KA) ---
            {"code": "KA_REV", "state_code": "KA", "name": "Karnataka Revenue Department (Seva Sindhu)", "name_mr": "कर्नाटक महसूल विभाग (सेवा सिंधू)", "name_hi": "कर्नाटक राजस्व विभाग (सेवा सिंधु)", "description": "Sakala and Seva Sindhu citizen certifications and Bhoomi records."},
            {"code": "KA_BES", "state_code": "KA", "name": "Bangalore Urban & Electricity (BESCOM)", "name_mr": "बंगळुरू नागरी व वीज वितरण (बेस्कॉम)", "name_hi": "बेंगलुरु शहरी एवं विद्युत निगम (बेस्कॉम)", "description": "Bengaluru metropolitan electricity distribution and metering."},

            # --- GUJARAT (GJ) ---
            {"code": "GJ_REV", "state_code": "GJ", "name": "Gujarat Revenue & Land Records (AnyRoR)", "name_mr": "गुजरात महसूल व भूमी अभिलेख (एनीआरओआर)", "name_hi": "गुजरात राजस्व एवं भू-अभिलेख विभाग (AnyRoR)", "description": "Gujarat AnyRoR land mutations, e-Dhara, and district certificates."},
            {"code": "GJ_IND", "state_code": "GJ", "name": "Gujarat Industries Commissionerate", "name_mr": "गुजरात उद्योग आयुक्तालय", "name_hi": "गुजरात उद्योग आयुक्तालय", "description": "Investor facilitation, MSME registration, and industrial clearances."},

            # --- DELHI NCT (DL) ---
            {"code": "DL_FCS", "state_code": "DL", "name": "Delhi Food, Civil Supplies & Consumer Affairs", "name_mr": "दिल्ली अन्न व नागरी पुरवठा", "name_hi": "दिल्ली खाद्य, नागरिक आपूर्ति एवं उपभोक्ता मामले", "description": "e-District Delhi NFSA ration cards and subsidized distribution."},
            {"code": "DL_TPT", "state_code": "DL", "name": "Delhi Transport Department", "name_mr": "दिल्ली परिवहन विभाग", "name_hi": "दिल्ली परिवहन विभाग", "description": "Automated driving test centers, vehicle permits, and RTO NOCs."},

            # --- UTTAR PRADESH (UP) ---
            {"code": "UP_BOR", "state_code": "UP", "name": "UP Revenue Council (Bor.up.nic.in)", "name_mr": "उत्तर प्रदेश महसूल परिषद", "name_hi": "उत्तर प्रदेश राजस्व परिषद (bor.up.nic.in)", "description": "e-District UP caste, income, domicile, and Khatauni certificates."},
            {"code": "UP_WCD", "state_code": "UP", "name": "UP Women and Child Development", "name_mr": "उत्तर प्रदेश महिला व बालकल्याण", "name_hi": "उत्तर प्रदेश महिला एवं बाल विकास विभाग", "description": "Senior citizen welfare, pensioner IDs, and family support."},

            # --- ANDHRA PRADESH (AP) ---
            {"code": "AP_REV", "state_code": "AP", "name": "Andhra Pradesh Revenue Department (MeeSeva)", "name_mr": "आंध्र प्रदेश महसूल विभाग (मीसेवा)", "name_hi": "आंध्र प्रदेश राजस्व विभाग (मीसेवा)", "description": "MeeSeva integrated citizen services and Webland title records."},

            # --- ARUNACHAL PRADESH (AR) ---
            {"code": "AR_GEN", "state_code": "AR", "name": "Arunachal Pradesh Public Service Delivery", "name_mr": "अरुणाचल प्रदेश सार्वजनिक सेवा वितरण", "name_hi": "अरुणाचल प्रदेश लोक सेवा वितरण (ई-सर्विस)", "description": "e-Service Arunachal Pradesh tribal certificates and domicile verification."},

            # --- ASSAM (AS) ---
            {"code": "AS_REV", "state_code": "AS", "name": "Assam Revenue & Disaster Management (Basundhara)", "name_mr": "आसाम महसूल विभाग (मिशन बसुंधरा)", "name_hi": "असम राजस्व एवं आपदा प्रबंधन विभाग (मिशन बसुंधरा)", "description": "Mission Basundhara land records, Jamabandi, and citizen certificates."},

            # --- BIHAR (BR) ---
            {"code": "BR_RTP", "state_code": "BR", "name": "Bihar Right to Public Services (RTPS)", "name_mr": "बिहार लोकसेवा हमी विभाग (आरटीपीएस)", "name_hi": "बिहार लोक सेवाओं का अधिकार (RTPS बिहार)", "description": "RTPS Bihar residential, caste, non-creamy layer, and ration certificates."},

            # --- CHHATTISGARH (CG) ---
            {"code": "CG_REV", "state_code": "CG", "name": "Chhattisgarh Lok Seva & Revenue (Bhuiyan)", "name_mr": "छत्तीसगड लोकसेवा व महसूल (भुईयां)", "name_hi": "छत्तीसगढ़ लोक सेवा केंद्र एवं राजस्व विभाग (भुईयां)", "description": "e-District CG certificates, Bhuiyan Khasra land title verification."},

            # --- GOA (GA) ---
            {"code": "GA_GOA", "state_code": "GA", "name": "Goa Public Services Directorate (GoaOnline)", "name_mr": "गोवा सार्वजनिक सेवा संचालनालय (गोवा ऑनलाइन)", "name_hi": "गोवा लोक सेवा निदेशालय (GoaOnline)", "description": "GoaOnline single window citizen utility and residency certificates."},

            # --- HARYANA (HR) ---
            {"code": "HR_SAR", "state_code": "HR", "name": "Haryana Antyodaya SARAL Portal", "name_mr": "हरियाणा अंत्योदय सरल पोर्टल", "name_hi": "हरियाणा अंत्योदय सरल पोर्टल (राजस्व एवं नगर प्रशासन)", "description": "Parivar Pehchan Patra (PPP) and Antyodaya SARAL government schemes."},

            # --- HIMACHAL PRADESH (HP) ---
            {"code": "HP_REV", "state_code": "HP", "name": "Himachal Pradesh e-District (e-Pariwar)", "name_mr": "हिमाचल प्रदेश ई-जिल्हा (ई-परिवार)", "name_hi": "हिमाचल प्रदेश ई-डिस्ट्रिक्ट एवं राजस्व (ई-परिवार)", "description": "Himgiri land records, bonafide Himachali certificates, and rural development."},

            # --- JHARKHAND (JH) ---
            {"code": "JH_JHA", "state_code": "JH", "name": "Jharkhand JharSewa & Land Revenue", "name_mr": "झारखंड झारसेवा व महसूल", "name_hi": "झारखंड झारसेवा एवं राजस्व विभाग (JharBhoomi)", "description": "JharSewa integrated certificates and Jharbhoomi digital records."},

            # --- KERALA (KL) ---
            {"code": "KL_REV", "state_code": "KL", "name": "Kerala Revenue Department (e-District Kerala)", "name_mr": "केरळ महसूल विभाग (ई-डिस्ट्रिक्ट केरळ)", "name_hi": "केरल राजस्व विभाग (e-District Kerala)", "description": "Sevana civil registration and e-District Kerala community and income certificates."},

            # --- MADHYA PRADESH (MP) ---
            {"code": "MP_LOK", "state_code": "MP", "name": "MP Public Service Guarantee (MP e-District)", "name_mr": "मध्य प्रदेश लोकसेवा हमी (एमपी ई-डिस्ट्रिक्ट)", "name_hi": "मध्य प्रदेश लोक सेवा गारंटी (MP e-District / भूलेख)", "description": "Lok Seva Kendra certificates, MP Bhulekh Khasra copies, and Samagra ID."},

            # --- MANIPUR (MN) ---
            {"code": "MN_GEN", "state_code": "MN", "name": "Manipur e-District Administration", "name_mr": "मणिपूर ई-जिल्हा प्रशासन", "name_hi": "मणिपुर ई-डिस्ट्रिक्ट प्रशासन एवं नागरिक सेवाएं", "description": "Manipur state citizen welfare, domicile, and income credentials."},

            # --- MEGHALAYA (ML) ---
            {"code": "ML_GEN", "state_code": "ML", "name": "Meghalaya Citizen Service Delivery", "name_mr": "मेघालय नागरिक सेवा वितरण", "name_hi": "मेघालय लोक सेवा वितरण पोर्टल", "description": "Meghalaya e-District residential and tribe identification certificates."},

            # --- MIZORAM (MZ) ---
            {"code": "MZ_GEN", "state_code": "MZ", "name": "Mizoram Public Online Gateway", "name_mr": "मिझोराम सार्वजनिक ऑनलाइन पोर्टल", "name_hi": "मिज़ोरम लोक सेवा ऑनलाइन पोर्टल", "description": "Mizoram state citizen certificates and revenue services."},

            # --- NAGALAND (NL) ---
            {"code": "NL_GEN", "state_code": "NL", "name": "Nagaland e-District Services", "name_mr": "नागालँड ई-जिल्हा सेवा", "name_hi": "नागालैंड ई-डिस्ट्रिक्ट नागरिक सेवाएं", "description": "Indigenous inhabitant certificates and citizen welfare schemes."},

            # --- ODISHA (OD) ---
            {"code": "OD_REV", "state_code": "OD", "name": "Odisha Revenue & Disaster Management (Bhulekh)", "name_mr": "ओडिशा महसूल विभाग (भुलेख)", "name_hi": "ओडिशा राजस्व एवं आपदा प्रबंधन (e-District Odisha / भूलेख)", "description": "Odisha e-District certificates and Bhulekh RoR plot records."},

            # --- PUNJAB (PB) ---
            {"code": "PB_SEW", "state_code": "PB", "name": "Punjab Sewa Kendra & Department of Governance", "name_mr": "पंजाब सेवा केंद्र व महसूल", "name_hi": "पंजाब सेवा केंद्र एवं प्रशासनिक सुधार विभाग", "description": "Punjab e-Sewa single window citizen utility and residence certifications."},

            # --- RAJASTHAN (RJ) ---
            {"code": "RJ_DOIT", "state_code": "RJ", "name": "Rajasthan IT & Communication (e-Mitra)", "name_mr": "राजस्थान माहिती तंत्रज्ञान विभाग (ई-मित्र)", "name_hi": "राजस्थान सूचना प्रौद्योगिकी विभाग (ई-मित्र / जन सूचना)", "description": "e-Mitra and Jan Soochna digital citizen service delivery across Rajasthan."},

            # --- SIKKIM (SK) ---
            {"code": "SK_GEN", "state_code": "SK", "name": "Sikkim e-Governance & District Administration", "name_mr": "सिक्कीम ई-प्रशासन विभाग", "name_hi": "सिक्किम ई-डिस्ट्रिक्ट एवं लोक प्रशासन", "description": "Certificate of Identification (COI) and residential certifications in Sikkim."},

            # --- TAMIL NADU (TN) ---
            {"code": "TN_TNG", "state_code": "TN", "name": "Tamil Nadu e-Governance Agency (TNeGA)", "name_mr": "तमिळनाडू ई-प्रशासन संस्था (TNeGA)", "name_hi": "तमिलनाडु ई-गवर्नेंस एजेंसी (TNeGA / ई-सेवा)", "description": "TNeGA e-Sevai citizen certificates, Patta/Chitta land records."},

            # --- TELANGANA (TG) ---
            {"code": "TG_MEE", "state_code": "TG", "name": "Telangana MeeSeva & Revenue (Dharani)", "name_mr": "तेलंगणा मीसेवा व महसूल (धरणी)", "name_hi": "तेलंगाना मीसेवा एवं राजस्व विभाग (धरणी पोर्टल)", "description": "MeeSeva services and Dharani integrated land record management."},

            # --- TRIPURA (TR) ---
            {"code": "TR_GEN", "state_code": "TR", "name": "Tripura e-District & Revenue Portal", "name_mr": "त्रिपुरा ई-जिल्हा व महसूल", "name_hi": "त्रिपुरा ई-डिस्ट्रिक्ट एवं राजस्व प्रशासन", "description": "e-District Tripura citizen certifications and land khatian extracts."},

            # --- UTTARAKHAND (UK) ---
            {"code": "UK_APU", "state_code": "UK", "name": "Uttarakhand Apuni Sarkar (e-District UK)", "name_mr": "उत्तराखंड आपुली सरकार", "name_hi": "उत्तराखंड अपुणी सरकार (e-District UK / भूलेख)", "description": "Apuni Sarkar digital citizen certificates and UK Bhulekh records."},

            # --- WEST BENGAL (WB) ---
            {"code": "WB_BLB", "state_code": "WB", "name": "West Bengal Land Records (Banglarbhumi)", "name_mr": "पश्चिम बंगाल भूमी अभिलेख (बांगलारभूमी)", "name_hi": "पश्चिम बंगाल भू-अभिलेख एवं भूमि सुधार (Banglarbhumi)", "description": "Banglarbhumi Khatian RoR extracts and WB e-District certifications."},

            # --- UNION TERRITORIES (8 UTs) ---
            {"code": "AN_EDIST", "state_code": "AN", "name": "Andaman & Nicobar Administration e-District", "name_mr": "अंदमान व निकोबार प्रशासन ई-जिल्हा", "name_hi": "अंडमान एवं निकोबार प्रशासन ई-डिस्ट्रिक्ट", "description": "Island territory citizen certifications and utility clearances."},
            {"code": "CH_SAMP", "state_code": "CH", "name": "Chandigarh Administration (e-JanSampark)", "name_mr": "चंदिगढ प्रशासन (ई-जनसंपर्क)", "name_hi": "चंडीगढ़ प्रशासन (ई-जनसंपर्क)", "description": "e-JanSampark single window civic and revenue certificates in Chandigarh."},
            {"code": "DN_EDIST", "state_code": "DN", "name": "DNHDD e-District Citizen Services", "name_mr": "दादरा व नगर हवेली प्रशासन", "name_hi": "दादरा एवं नगर हवेली और दमन एवं दीव ई-डिस्ट्रिक्ट", "description": "Integrated citizen certificate delivery across DNH, Daman, and Diu."},
            {"code": "JK_UNNAT", "state_code": "JK", "name": "Jammu & Kashmir e-UNNAT Portal", "name_mr": "जम्मू आणि काश्मीर ई-उन्नत पोर्टल", "name_hi": "जम्मू और कश्मीर ई-उन्नत पोर्टल (e-UNNAT)", "description": "e-UNNAT unified single window portal for all J&K UT citizen services."},
            {"code": "LA_EDIST", "state_code": "LA", "name": "UT Ladakh Administration e-Services", "name_mr": "लडाख केंद्रशासित प्रशासन", "name_hi": "लद्दाख केंद्र शासित प्रदेश प्रशासन ई-सेवाएं", "description": "Resident certificates and public service delivery across Leh and Kargil."},
            {"code": "PY_EDIST", "state_code": "PY", "name": "Puducherry e-District & Local Administration", "name_mr": "पुडुचेरी ई-जिल्हा व स्थानिक प्रशासन", "name_hi": "पुडुचेरी ई-डिस्ट्रिक्ट एवं स्थानीय प्रशासन", "description": "Single window citizen certificate issuance across Puducherry and Karaikal."},

            # --- CENTRAL GOVERNMENT MINISTRIES & NATIONAL BOARDS (CENTRAL) ---
            {"code": "GOI_CBSE", "state_code": "CENTRAL", "name": "Central Board of Secondary Education (CBSE)", "name_mr": "केंद्रीय माध्यमिक शिक्षण मंडळ (CBSE)", "name_hi": "केन्द्रीय माध्यमिक शिक्षा बोर्ड (CBSE)", "description": "National secondary and senior secondary school examination board, marksheet issuance, Pariksha Sangam, and academic records verification."},
            {"code": "GOI_EDU", "state_code": "CENTRAL", "name": "Ministry of Education & National Scholarship Portal", "name_mr": "केंद्रीय शिक्षण मंत्रालय व राष्ट्रीय शिष्यवृत्ती पोर्टल", "name_hi": "शिक्षा मंत्रालय एवं राष्ट्रीय छात्रवृत्ति पोर्टल (NSP)", "description": "Higher education welfare, Central Sector Schemes, pre/post-matric scholarships, and APAAR One Nation One Student ID."},
            {"code": "GOI_HEALTH", "state_code": "CENTRAL", "name": "National Health Authority (Ayushman Bharat)", "name_mr": "राष्ट्रीय आरोग्य प्राधिकरण (आयुष्मान भारत)", "name_hi": "राष्ट्रीय स्वास्थ्य प्राधिकरण (आयुष्मान भारत / ABHA)", "description": "Ayushman Bharat PM-JAY 5 lakh health coverage and 14-digit ABHA digital health accounts."},

            # --- STATE EDUCATION BOARDS ---
            {"code": "MH_BOARD", "state_code": "MH", "name": "Maharashtra State Board of Secondary & Higher Secondary Education (MSBSHSE)", "name_mr": "महाराष्ट्र राज्य माध्यमिक व उच्च माध्यमिक शिक्षण मंडळ (e-MarkSheet)", "name_hi": "महाराष्ट्र राज्य माध्यमिक एवं उच्च माध्यमिक शिक्षा बोर्ड (e-MarkSheet)", "description": "SSC (10th) and HSC (12th) digital marksheet verification, duplicate passing certificate, and migration."},
            {"code": "UP_MSP", "state_code": "UP", "name": "UP Madhyamik Shiksha Parishad (UPMSP Prayagraj)", "name_mr": "उत्तर प्रदेश माध्यमिक शिक्षण परिषद (UPMSP)", "name_hi": "उत्तर प्रदेश माध्यमिक शिक्षा परिषद (UPMSP प्रयागराज)", "description": "High School (10th) and Intermediate (12th) online marksheet verification, duplicate marksheet, and migration certificates."}
        ]

        dept_map = {}
        for d in departments_catalog:
            existing = db.query(Department).filter(Department.code == d["code"]).first()
            if not existing:
                created = Department(**d)
                db.add(created)
                db.flush()
                dept_map[d["code"]] = created.id
            else:
                existing.name = d["name"]
                existing.name_mr = d["name_mr"]
                existing.name_hi = d["name_hi"]
                existing.state_code = d["state_code"]
                existing.description = d["description"]
                dept_map[d["code"]] = existing.id
        db.commit()
        print(f"[OK] {len(dept_map)} Departments verified across all 36 States and UTs.")

        # 4. Seed All-India Public Services Catalog (40+ Services)
        services_catalog = [
            # 1. MH Income Cert
            {
                "code": "MH_INCOME_CERT", "state_code": "MH", "dept_code": "MH_REV", "cat_code": "CERT",
                "name": "Income Certificate", "name_mr": "उत्पन्नाचा दाखला", "name_hi": "आय प्रमाण पत्र (महाराष्ट्र)",
                "description": "Statutory certification of annual family income for educational scholarships, welfare concessions, and government recruitment.",
                "description_mr": "शैक्षणिक शिष्यवृत्ती, सरकारी सवलती आणि योजनांसाठी अधिकृत वार्षिक कौटुंबिक उत्पन्नाचा दाखला.",
                "description_hi": "छात्रवृत्ति, सरकारी शुल्क छूट एवं योजनाओं हेतु तहसीलदार द्वारा प्रमाणित वार्षिक पारिवारिक आय प्रमाण पत्र।",
                "fee": 33.60, "processing_days": 15,
                "required_docs": ["Aadhaar Card", "Ration Card", "Salary Certificate or Talathi Income Report", "Self Declaration"],
                "eligibility": {"min_age": 18, "residency": "Resident of Maharashtra", "income_limit": None},
                "fields": [
                    {"key": "annual_income", "label": "Annual Family Income (INR)", "label_mr": "वार्षिक कौटुंबिक उत्पन्न (रुपये)", "label_hi": "वार्षिक पारिवारिक आय (रुपये)", "type": "NUMBER", "required": True},
                    {"key": "income_source", "label": "Primary Source of Income", "label_mr": "उत्पन्नाचा मुख्य स्त्रोत", "label_hi": "आय का मुख्य स्रोत", "type": "DROPDOWN", "required": True, "options": ["Agriculture", "Business", "Salary / Employment", "Daily Wages", "Other"]},
                    {"key": "purpose", "label": "Purpose of Certificate", "label_mr": "दाखल्याचा उद्देश", "label_hi": "प्रमाण पत्र का उद्देश्य", "type": "DROPDOWN", "required": True, "options": ["Higher Education / Scholarship", "Government Welfare Scheme", "Bank Loan Subsidy", "Legal Purpose"]},
                    {"key": "district", "label": "District", "label_mr": "जिल्हा", "label_hi": "जिला", "type": "TEXT", "required": True},
                    {"key": "taluka", "label": "Taluka / Tehsil", "label_mr": "तालुका", "label_hi": "तहसील", "type": "TEXT", "required": True}
                ]
            },
            # 2. MH Domicile Cert
            {
                "code": "MH_DOMICILE_CERT", "state_code": "MH", "dept_code": "MH_REV", "cat_code": "CERT",
                "name": "Age, Nationality & Domicile Certificate", "name_mr": "वय, अधिवास आणि राष्ट्रीयत्व प्रमाणपत्र", "name_hi": "आयु, मूल निवास एवं राष्ट्रीयता प्रमाण पत्र",
                "description": "Proof of continuous 15-year residency and Indian citizenship required for state quotas, MPSC examinations, and university admissions.",
                "description_mr": "महाराष्ट्र राज्यातील १५ वर्षांच्या वास्तव्याचा आणि भारतीय राष्ट्रीयत्वाचा अधिकृत दाखला.",
                "description_hi": "महाराष्ट्र में 15 वर्षों से निरंतर निवास एवं भारतीय नागरिकता का प्रमाण पत्र (MPSC/शैक्षणिक कोटा हेतु)।",
                "fee": 50.00, "processing_days": 15,
                "required_docs": ["Aadhaar Card", "School Leaving Certificate", "15 Years Residence Proof (Ration Card / Electricity Bills)", "Voter ID"],
                "eligibility": {"min_age": 18, "residency": "Continuous 15 years in Maharashtra"},
                "fields": [
                    {"key": "residence_years", "label": "Years of Continuous Residence in State", "label_mr": "राज्यातील वास्तव्याची वर्षे", "label_hi": "राज्य में निरंतर निवास के वर्ष", "type": "NUMBER", "required": True},
                    {"key": "place_of_birth", "label": "Place of Birth", "label_mr": "जन्मस्थान", "label_hi": "जन्म स्थान", "type": "TEXT", "required": True},
                    {"key": "district", "label": "District", "label_mr": "जिल्हा", "label_hi": "जिला", "type": "TEXT", "required": True}
                ]
            },
            # 3. MH Caste Cert
            {
                "code": "MH_CASTE_CERT", "state_code": "MH", "dept_code": "MH_SOC", "cat_code": "CERT",
                "name": "Caste Certificate", "name_mr": "जातीचे प्रमाणपत्र", "name_hi": "जाति प्रमाण पत्र (महाराष्ट्र)",
                "description": "Official caste verification issued by Sub-Divisional Officer (SDO) for reserved category opportunities.",
                "description_mr": "उपविभागीय अधिकाऱ्यांमार्फत आरक्षित प्रवर्गासाठी दिले जाणारे अधिकृत जात प्रमाणपत्र.",
                "description_hi": "उप-मंडल अधिकारी (SDO) द्वारा अनुसूचित जाति/जनजाति/अन्य पिछड़ा वर्ग हेतु जारी आधिकारिक प्रमाण पत्र।",
                "fee": 35.00, "processing_days": 21,
                "required_docs": ["Aadhaar Card", "Father's School Leaving / Primary School Record", "Caste Proof prior to 1967/1961", "Affidavit"],
                "eligibility": {"residency": "Resident of Maharashtra belonging to notified category"},
                "fields": [
                    {"key": "caste_category", "label": "Caste Category", "label_mr": "जात प्रवर्ग", "label_hi": "जाति वर्ग", "type": "DROPDOWN", "required": True, "options": ["SC", "ST", "VJNT", "OBC", "SBC", "SEBC", "EWS"]},
                    {"key": "sub_caste", "label": "Sub-Caste Name", "label_mr": "पोटजात", "label_hi": "उप-जाति", "type": "TEXT", "required": True},
                    {"key": "district", "label": "District", "label_mr": "जिल्हा", "label_hi": "जिला", "type": "TEXT", "required": True}
                ]
            },
            # 4. MH 7/12 Extract
            {
                "code": "MH_7_12_EXTRACT", "state_code": "MH", "dept_code": "MH_LRD", "cat_code": "REV_LAND",
                "name": "Certified 7/12 Land Record Extract", "name_mr": "डिजिटल स्वाक्षरीत ७/१२ उतारा", "name_hi": "प्रमाणित ७/१२ भू-अभिलेख खसरा नकल",
                "description": "Digitally signed record of agricultural land ownership, cultivation details, crop patterns, and encumbrances.",
                "description_mr": "शेतजमिनीची मालकी, पीक पाहणी आणि बोजा दर्शवणारा अधिकृत डिजिटल स्वाक्षरी असलेला ७/१२ उतारा.",
                "description_hi": "कृषि भूमि के स्वामित्व, फसल विवरण एवं ऋण ब्योरा युक्त डिजिटल हस्ताक्षरित आधिकारिक ७/१२ नकल।",
                "fee": 15.00, "processing_days": 1,
                "required_docs": ["Survey / Gat Number", "Village / District details"],
                "eligibility": {"criteria": "Open to all landholders and legal representatives"},
                "fields": [
                    {"key": "district", "label": "District", "label_mr": "जिल्हा", "label_hi": "जिला", "type": "TEXT", "required": True},
                    {"key": "taluka", "label": "Taluka", "label_mr": "तालुका", "label_hi": "तहसील", "type": "TEXT", "required": True},
                    {"key": "village", "label": "Village Name", "label_mr": "गाव", "label_hi": "ग्राम", "type": "TEXT", "required": True},
                    {"key": "survey_no", "label": "Survey / Gat Number", "label_mr": "सर्व्हे / गट क्रमांक", "label_hi": "सर्वे / गट संख्या", "type": "TEXT", "required": True}
                ]
            },
            # 5. MH Water Conn
            {
                "code": "MH_WATER_CONN", "state_code": "MH", "dept_code": "MH_UDD", "cat_code": "CIVIC",
                "name": "Municipal Water Tap Connection", "name_mr": "महापालिका नवीन नळ जोडणी", "name_hi": "नगर निगम नवीन नल जल कनेक्शन",
                "description": "Application for fresh domestic or commercial metered water pipeline connection from municipal authorities.",
                "description_mr": "घरगुती किंवा व्यावसायिक वापरासाठी महापालिकेकडून अधिकृत नवीन नळ जोडणी मिळवणे.",
                "description_hi": "घरेलू या व्यावसायिक उपयोग हेतु नगर निगम से अधिकृत नवीन पेयजल कनेक्शन प्राप्त करना।",
                "fee": 1500.00, "processing_days": 21,
                "required_docs": ["Property Tax Receipt", "Sanctioned Building Plan", "Plumbing Layout", "Ownership Deed"],
                "eligibility": {"ownership": "Property Owner or Authorized Tenant with NOC"},
                "fields": [
                    {"key": "property_assessment_no", "label": "Property Tax Assessment No.", "label_mr": "मालमत्ता कर क्रमांक", "label_hi": "संपत्ति कर निर्धारण संख्या", "type": "TEXT", "required": True},
                    {"key": "connection_type", "label": "Type of Connection", "label_mr": "जोडणीचा प्रकार", "label_hi": "कनेक्शन का प्रकार", "type": "DROPDOWN", "required": True, "options": ["Domestic (Residential)", "Commercial / Retail", "Industrial", "Institutional"]},
                    {"key": "pipe_diameter", "label": "Required Pipe Size", "label_mr": "पाईप आकार", "label_hi": "पाइप साइज", "type": "DROPDOWN", "required": True, "options": ["15 mm (Half Inch)", "20 mm (3/4th Inch)", "25 mm (1 Inch)"]}
                ]
            },
            # 6. KA BESCOM Electricity
            {
                "code": "KA_BESCOM_POWER", "state_code": "KA", "dept_code": "KA_BES", "cat_code": "POWER",
                "name": "BESCOM Urban Electricity Connection", "name_mr": "बेस्कॉम नवीन वीज मीटर जोडणी", "name_hi": "BESCOM शहरी विद्युत मीटर कनेक्शन",
                "description": "New low-tension (LT) domestic or commercial power meter installation across Bengaluru urban metropolitan area.",
                "description_mr": "बंगळुरू महानगरात नवीन घरगुती किंवा व्यावसायिक वीज मीटर जोडणी.",
                "description_hi": "बेंगलुरु महानगरीय क्षेत्र में नए घरेलू या वाणिज्यिक एलटी बिजली कनेक्शन हेतु आवेदन।",
                "fee": 1200.00, "processing_days": 7,
                "required_docs": ["Khata Certificate (A or B)", "Latest Tax Receipt", "Wiring Completion Report from Licensed Electrical Contractor", "Aadhaar Card"],
                "eligibility": {"residency": "Premises owner/tenant within BESCOM jurisdiction"},
                "fields": [
                    {"key": "khata_number", "label": "Bruhat Bengaluru Mahanagara Palike (BBMP) Khata No.", "label_mr": "खाता क्रमांक", "label_hi": "खाता संख्या", "type": "TEXT", "required": True},
                    {"key": "sanctioned_load_kw", "label": "Sanctioned Load Required (in kW)", "label_mr": "आवश्यक वीज भार (kW)", "label_hi": "स्वीकृत भार (kW)", "type": "NUMBER", "required": True},
                    {"key": "consumer_category", "label": "Category of Power Supply", "label_mr": "वापर प्रकार", "label_hi": "उपभोक्ता श्रेणी", "type": "DROPDOWN", "required": True, "options": ["LT-2(a) Domestic", "LT-3 Commercial", "LT-5 Small Industry"]}
                ]
            },
            # 7. KA Caste Income
            {
                "code": "KA_CASTE_INCOME", "state_code": "KA", "dept_code": "KA_REV", "cat_code": "CERT",
                "name": "Caste & Income Certificate (Seva Sindhu)", "name_mr": "जात व उत्पन्न प्रमाणपत्र (सेवा सिंधू)", "name_hi": "जाति एवं आय प्रमाण पत्र (सेवा सिंधु कर्नाटक)",
                "description": "Unified integrated caste and income certificate issued under Karnataka Sakala Services Act.",
                "description_mr": "कर्नाटक सकाळा सेवा कायद्यांतर्गत एकात्मिक जात आणि उत्पन्न दाखला.",
                "description_hi": "कर्नाटक सकाळा गारंटी अधिनियम के तहत सेवा सिंधु पोर्टल द्वारा जारी एकीकृत जाति एवं आय प्रमाण पत्र।",
                "fee": 40.00, "processing_days": 14,
                "required_docs": ["Aadhaar Card", "Ration Card", "School Transfer Certificate", "Salary / Agriculture Income Proof"],
                "eligibility": {"residency": "Permanent resident of Karnataka"},
                "fields": [
                    {"key": "caste_group", "label": "Category / Group", "label_mr": "प्रवर्ग", "label_hi": "वर्ग", "type": "DROPDOWN", "required": True, "options": ["Category 1", "Category 2A", "Category 2B", "Category 3A", "Category 3B", "SC", "ST"]},
                    {"key": "family_annual_income", "label": "Annual Family Income (INR)", "label_mr": "कौटुंबिक उत्पन्न", "label_hi": "पारिवारिक वार्षिक आय", "type": "NUMBER", "required": True},
                    {"key": "district", "label": "District", "label_mr": "जिल्हा", "label_hi": "जिला", "type": "TEXT", "required": True}
                ]
            },
            # 8. GJ AnyRoR Mutation
            {
                "code": "GJ_LAND_MUTATION", "state_code": "GJ", "dept_code": "GJ_REV", "cat_code": "REV_LAND",
                "name": "AnyRoR Certified Land Mutation Extract", "name_mr": "एनीआरओआर भूमी फेरफार नोंद (हक्क पत्रक)", "name_hi": "AnyRoR प्रमाणित भू-नामांतरण (हक पत्रक) नकल",
                "description": "Certified copy of registered village land mutation entry (VF-6 / VF-7 / VF-8A) under Gujarat Revenue Department.",
                "description_mr": "गुजरात महसूल विभागामार्फत गाव नमुना ६ व ७ मधील अधिकृत फेरफार उतारा.",
                "description_hi": "गुजरात राजस्व विभाग द्वारा प्रमाणित ग्राम नमूना 6 (हक पत्रक) एवं 7/12 भू-अभिलेख नकल।",
                "fee": 20.00, "processing_days": 3,
                "required_docs": ["Registered Sale Deed or Inheritance Order", "District/Taluka/Village Selection"],
                "eligibility": {"criteria": "Titleholder or interested party in Gujarat land parcel"},
                "fields": [
                    {"key": "district", "label": "District", "label_mr": "जिल्हा", "label_hi": "जिला", "type": "TEXT", "required": True},
                    {"key": "taluka", "label": "Taluka", "label_mr": "तालुका", "label_hi": "तालुका", "type": "TEXT", "required": True},
                    {"key": "village", "label": "Village", "label_mr": "गाव", "label_hi": "ग्राम", "type": "TEXT", "required": True},
                    {"key": "mutation_number", "label": "Mutation Entry No.", "label_mr": "नोंद क्रमांक", "label_hi": "नामांतरण प्रविष्टि संख्या", "type": "TEXT", "required": True}
                ]
            },
            # 9. DL Ration Card
            {
                "code": "DL_RATION_CARD", "state_code": "DL", "dept_code": "DL_FCS", "cat_code": "FOOD",
                "name": "e-District National Food Security Ration Card", "name_mr": "दिल्ली राष्ट्रीय अन्न सुरक्षा रेशन कार्ड", "name_hi": "ई-डिस्ट्रिक्ट राष्ट्रीय खाद्य सुरक्षा राशन कार्ड (दिल्ली)",
                "description": "Issuance of new digital ration card under Priority Household (PR) or AAY for food grain entitlement across NCT of Delhi.",
                "description_mr": "दिल्ली राष्ट्रीय राजधानी क्षेत्रातील अन्नधान्य हक्कासाठी नवीन डिजिटल रेशन कार्ड.",
                "description_hi": "दिल्ली राष्ट्रीय राजधानी क्षेत्र में राष्ट्रीय खाद्य सुरक्षा अधिनियम (NFSA) के तहत नया डिजिटल राशन कार्ड।",
                "fee": 0.00, "processing_days": 30,
                "required_docs": ["Aadhaar of all family members", "Proof of Residence in Delhi (Electricity Bill / Rent Agreement)", "Income Affidavit of Head of Family"],
                "eligibility": {"income_limit": 100000, "residency": "Bonafide resident of Delhi with no member having four-wheeler or pacca house exceeding limits"},
                "fields": [
                    {"key": "head_of_family", "label": "Senior Eldest Female Head of Family", "label_mr": "कुटुंबप्रमुख महिला", "label_hi": "परिवार की वरिष्ठ महिला मुखिया का नाम", "type": "TEXT", "required": True},
                    {"key": "total_members", "label": "Total Family Members (Count)", "label_mr": "एकूण सदस्य संख्या", "label_hi": "कुल पारिवारिक सदस्य संख्या", "type": "NUMBER", "required": True},
                    {"key": "delhi_assembly_constituency", "label": "Delhi Assembly Constituency", "label_mr": "विधानसभा मतदारसंघ", "label_hi": "दिल्ली विधानसभा क्षेत्र", "type": "TEXT", "required": True}
                ]
            },
            # 10. DL Driving NOC
            {
                "code": "DL_DRIVING_NOC", "state_code": "DL", "dept_code": "DL_TPT", "cat_code": "TRANSPORT",
                "name": "Transport Department Driving License NOC", "name_mr": "ड्रायव्हिंग लायसन्स एनओसी (दिल्ली आरटीओ)", "name_hi": "परिवहन विभाग ड्राइविंग लाइसेंस अनापत्ति प्रमाण पत्र (NOC)",
                "description": "Official No Objection Certificate (NOC) for inter-state transfer of driving license from Delhi to other states.",
                "description_mr": "दिल्लीतून इतर राज्यांमध्ये चालक परवाना हस्तांतरणासाठी आरटीओ ना-हरकत प्रमाणपत्र.",
                "description_hi": "दिल्ली से अन्य राज्यों में ड्राइविंग लाइसेंस स्थानांतरण हेतु दिल्ली परिवहन विभाग द्वारा जारी अनापत्ति प्रमाण पत्र।",
                "fee": 200.00, "processing_days": 5,
                "required_docs": ["Original Driving License Copy", "Aadhaar Card", "Reason for State Transfer"],
                "eligibility": {"license": "Valid Delhi Driving License holder with no active challans"},
                "fields": [
                    {"key": "dl_number", "label": "Driving License Number (DL-XX-XXXX)", "label_mr": "लायसन्स क्रमांक", "label_hi": "ड्राइविंग लाइसेंस संख्या", "type": "TEXT", "required": True},
                    {"key": "destination_state", "label": "Destination State for Transfer", "label_mr": "हस्तांतरण राज्य", "label_hi": "स्थानांतरण का गंतव्य राज्य", "type": "TEXT", "required": True}
                ]
            },
            # 11. UP Senior Citizen ID
            {
                "code": "UP_SENIOR_CITIZEN", "state_code": "UP", "dept_code": "UP_WCD", "cat_code": "WELFARE",
                "name": "Senior Citizen Pensioner Identity Card", "name_mr": "ज्येष्ठ नागरिक ओळखपत्र (उत्तर प्रदेश)", "name_hi": "उत्तर प्रदेश वरिष्ठ नागरिक पहचान पत्र एवं पेंशन पंजीकरण",
                "description": "Government verification card for residents aged 60 and above granting healthcare discounts, travel concessions, and pension priority.",
                "description_mr": "६० वर्षे व त्यावरील नागरिकांसाठी आरोग्य सवलती आणि निवृत्तीवेतन प्राधान्यासाठी ओळखपत्र.",
                "description_hi": "60 वर्ष अथवा अधिक आयु के उत्तर प्रदेश नागरिकों हेतु स्वास्थ्य सेवा छूट एवं पेंशन योजनाओं का अधिकृत पहचान पत्र।",
                "fee": 0.00, "processing_days": 10,
                "required_docs": ["Age Proof (Voter ID / PAN / Birth Certificate)", "Aadhaar Card", "Two Passport Photos", "Residential Proof"],
                "eligibility": {"min_age": 60, "residency": "Permanent resident of Uttar Pradesh"},
                "fields": [
                    {"key": "citizen_age", "label": "Current Age in Completed Years", "label_mr": "वय", "label_hi": "आयु (पूर्ण वर्षों में)", "type": "NUMBER", "required": True},
                    {"key": "blood_group", "label": "Blood Group", "label_mr": "रक्तगट", "label_hi": "रक्त समूह", "type": "DROPDOWN", "required": True, "options": ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"]},
                    {"key": "district", "label": "District", "label_mr": "जिल्हा", "label_hi": "जिला", "type": "TEXT", "required": True}
                ]
            },
            # 12. RJ Domicile
            {
                "code": "RJ_BONAFIDE_CERT", "state_code": "RJ", "dept_code": "RJ_DOIT", "cat_code": "CERT",
                "name": "Rajasthan Bonafide Resident (Mool Niwas) Certificate", "name_mr": "राजस्थान मूल निवासी दाखला", "name_hi": "राजस्थान मूल निवास प्रमाण पत्र (e-Mitra)",
                "description": "Digital Bonafide Residence certificate issued through e-Mitra and Jan Soochna for Rajasthan state public benefits.",
                "description_mr": "राजस्थान राज्यातील अधिकृत वास्तव्याचा मूल निवास दाखला.",
                "description_hi": "राजस्थान ई-मित्र एवं जन सूचना पोर्टल द्वारा प्रमाणित आधिकारिक मूल निवास प्रमाण पत्र।",
                "fee": 50.00, "processing_days": 7,
                "required_docs": ["Jan Aadhaar Card", "Electricity Bill / Water Bill (10 yrs)", "Voter ID"],
                "eligibility": {"residency": "Continuous 10 years in Rajasthan"},
                "fields": [
                    {"key": "jan_aadhaar_no", "label": "Jan Aadhaar Family ID", "label_mr": "जन आधार क्रमांक", "label_hi": "जन आधार संख्या", "type": "TEXT", "required": True},
                    {"key": "district", "label": "District", "label_mr": "जिल्हा", "label_hi": "जिला", "type": "TEXT", "required": True}
                ]
            },
            # 13. TN Community Certificate
            {
                "code": "TN_COMMUNITY_CERT", "state_code": "TN", "dept_code": "TN_TNG", "cat_code": "CERT",
                "name": "Tamil Nadu Community Certificate (TNeGA)", "name_mr": "तमिळनाडू समुदाय प्रमाणपत्र (TNeGA)", "name_hi": "तमिलनाडु समुदाय/जाति प्रमाण पत्र (TNeGA)",
                "description": "Statutory community certification issued through TNeGA e-Sevai single window portal.",
                "description_mr": "TNeGA ई-सेवई पोर्टलद्वारे अधिकृत समुदाय प्रमाणपत्र.",
                "description_hi": "तमिलनाडु ई-गवर्नेंस एजेंसी (TNeGA) द्वारा जारी आधिकारिक समुदाय प्रमाण पत्र।",
                "fee": 60.00, "processing_days": 15,
                "required_docs": ["Aadhaar Card", "Father / Sibling Community Certificate", "Ration Card"],
                "eligibility": {"residency": "Native resident of Tamil Nadu"},
                "fields": [
                    {"key": "community_class", "label": "Community Classification", "label_mr": "समुदाय वर्ग", "label_hi": "समुदाय श्रेणी", "type": "DROPDOWN", "required": True, "options": ["BC", "BCM", "MBC", "DNC", "SC", "SC(A)", "ST"]},
                    {"key": "district", "label": "District", "label_mr": "जिल्हा", "label_hi": "जिला", "type": "TEXT", "required": True}
                ]
            },
            # 14. WB RoR Khatian
            {
                "code": "WB_ROR_KHATIAN", "state_code": "WB", "dept_code": "WB_BLB", "cat_code": "REV_LAND",
                "name": "Banglarbhumi Certified Khatian Land Record (RoR)", "name_mr": "पश्चिम बंगाल खतियान भूमी अभिलेख (बांगलारभूमी)", "name_hi": "पश्चिम बंगाल खतियान भू-अभिलेख (Banglarbhumi RoR)",
                "description": "Digitally certified copy of Record-of-Rights (RoR) / Khatian from Land & Land Reforms Department, West Bengal.",
                "description_mr": "पश्चिम बंगाल महसूल विभागाकडून खतियान जमिनीचा अधिकृत डिजिटल दाखला.",
                "description_hi": "पश्चिम बंगाल भू-राजस्व विभाग द्वारा प्रमाणित खतियान अधिकार अभिलेख (RoR) नकल।",
                "fee": 20.00, "processing_days": 3,
                "required_docs": ["District/Block/Mouza details", "Khatian Number"],
                "eligibility": {"criteria": "Titleholder or applicant in West Bengal"},
                "fields": [
                    {"key": "district", "label": "District", "label_mr": "जिल्हा", "label_hi": "जिला", "type": "TEXT", "required": True},
                    {"key": "block", "label": "Block", "label_mr": "ब्लॉक", "label_hi": "प्रखंड", "type": "TEXT", "required": True},
                    {"key": "mouza", "label": "Mouza Name with JL Number", "label_mr": "मौजा नाव", "label_hi": "मौजा नाम (JL संख्या सहित)", "type": "TEXT", "required": True},
                    {"key": "khatian_no", "label": "Khatian Number", "label_mr": "खतियान क्रमांक", "label_hi": "खतियान संख्या", "type": "TEXT", "required": True}
                ]
            },
            # 15. AP Meeseva Domicile
            {
                "code": "AP_RESIDENCE_CERT", "state_code": "AP", "dept_code": "AP_REV", "cat_code": "CERT",
                "name": "Andhra Pradesh Residence Certificate (MeeSeva)", "name_mr": "आंध्र प्रदेश रहिवासी प्रमाणपत्र (मीसेवा)", "name_hi": "आंध्र प्रदेश निवास प्रमाण पत्र (मीसेवा)",
                "description": "Statutory proof of residence within Andhra Pradesh issued by Tahsildar through MeeSeva.",
                "description_mr": "आंध्र प्रदेशातील रहिवासी असल्याचे तहसीलदार प्रमाणपत्र.",
                "description_hi": "मीसेवा पोर्टल द्वारा तहसीलदार द्वारा प्रमाणित आंध्र प्रदेश निवास प्रमाण पत्र।",
                "fee": 45.00, "processing_days": 7,
                "required_docs": ["Aadhaar Card", "Ration Card", "Electricity Bill"],
                "eligibility": {"residency": "Resident of Andhra Pradesh"},
                "fields": [
                    {"key": "district", "label": "District", "label_mr": "जिल्हा", "label_hi": "जिला", "type": "TEXT", "required": True},
                    {"key": "mandal", "label": "Mandal", "label_mr": "मंडल", "label_hi": "मंडल", "type": "TEXT", "required": True}
                ]
            },
            # 16. Assam Basundhara
            {
                "code": "AS_JAMABANDI", "state_code": "AS", "dept_code": "AS_REV", "cat_code": "REV_LAND",
                "name": "Mission Basundhara Certified Jamabandi Copy", "name_mr": "आसाम जमाबंदी भूमी प्रत (मिशन बसुंधरा)", "name_hi": "असम मिशन बसुंधरा प्रमाणित जमाबंदी नकल",
                "description": "Certified digital Jamabandi land record extract issued under Assam Mission Basundhara.",
                "description_mr": "आसाम मिशन बसुंधरा अंतर्गत अधिकृत डिजिटल जमाबंदी प्रत.",
                "description_hi": "असम मिशन बसुंधरा के अंतर्गत भूमि स्वामित्व प्रमाणित जमाबंदी नकल।",
                "fee": 20.00, "processing_days": 5,
                "required_docs": ["Dag Number / Patta Number", "Village details"],
                "eligibility": {"criteria": "Pattadar or authorized applicant in Assam"},
                "fields": [
                    {"key": "district", "label": "District", "label_mr": "जिल्हा", "label_hi": "जिला", "type": "TEXT", "required": True},
                    {"key": "circle", "label": "Revenue Circle", "label_mr": "सर्कल", "label_hi": "राजस्व वृत्त", "type": "TEXT", "required": True},
                    {"key": "patta_no", "label": "Patta Number", "label_mr": "पट्टा क्रमांक", "label_hi": "पट्टा संख्या", "type": "TEXT", "required": True}
                ]
            },
            # 17. Bihar RTPS Caste
            {
                "code": "BR_CASTE_CERT", "state_code": "BR", "dept_code": "BR_RTP", "cat_code": "CERT",
                "name": "Bihar RTPS Caste (Jati) Certificate", "name_mr": "बिहार जातीचे प्रमाणपत्र (आरटीपीएस)", "name_hi": "बिहार आरटीपीएस जाति प्रमाण पत्र",
                "description": "Revenue Officer verified caste certificate under Bihar Right to Public Services Act.",
                "description_mr": "बिहार लोकसेवा हमी कायद्यांतर्गत अधिकृत जात प्रमाणपत्र.",
                "description_hi": "बिहार लोक सेवा अधिकार अधिनियम (RTPS) के तहत राजस्व अधिकारी द्वारा प्रमाणित जाति प्रमाण पत्र।",
                "fee": 0.00, "processing_days": 10,
                "required_docs": ["Aadhaar Card", "Self-declaration", "Parent's Caste Evidence"],
                "eligibility": {"residency": "Permanent resident of Bihar belonging to eligible category"},
                "fields": [
                    {"key": "category", "label": "Category", "label_mr": "प्रवर्ग", "label_hi": "वर्ग", "type": "DROPDOWN", "required": True, "options": ["General", "EBC (Schedule 1)", "BC (Schedule 2)", "SC", "ST"]},
                    {"key": "caste_name", "label": "Caste Name", "label_mr": "जात", "label_hi": "जाति का नाम", "type": "TEXT", "required": True},
                    {"key": "district", "label": "District", "label_mr": "जिल्हा", "label_hi": "जिला", "type": "TEXT", "required": True}
                ]
            },
            # 18. Kerala Income
            {
                "code": "KL_INCOME_CERT", "state_code": "KL", "dept_code": "KL_REV", "cat_code": "CERT",
                "name": "Kerala e-District Income Certificate", "name_mr": "केरळ उत्पन्न प्रमाणपत्र (ई-डिस्ट्रिक्ट)", "name_hi": "केरल ई-डिस्ट्रिक्ट आय प्रमाण पत्र",
                "description": "Village Officer verified income certificate issued by Tahsildar through e-District Kerala.",
                "description_mr": "केरळ ई-डिस्ट्रिक्ट द्वारे अधिकृत उत्पन्न प्रमाणपत्र.",
                "description_hi": "ई-डिस्ट्रिक्ट केरल पोर्टल द्वारा ग्राम अधिकारी एवं तहसीलदार सत्यापित आय प्रमाण पत्र।",
                "fee": 28.00, "processing_days": 5,
                "required_docs": ["Aadhaar Card", "Ration Card", "Salary Certificate / Agricultural Land Tax"],
                "eligibility": {"residency": "Resident of Kerala"},
                "fields": [
                    {"key": "annual_income", "label": "Total Family Annual Income (INR)", "label_mr": "वार्षिक उत्पन्न", "label_hi": "कुल वार्षिक आय (रुपये)", "type": "NUMBER", "required": True},
                    {"key": "taluk", "label": "Taluk Name", "label_mr": "तालुका", "label_hi": "तालुक", "type": "TEXT", "required": True}
                ]
            },
            # 19. Punjab Residence
            {
                "code": "PB_RESIDENCE_CERT", "state_code": "PB", "dept_code": "PB_SEW", "cat_code": "CERT",
                "name": "Punjab Sewa Kendra Residence Certificate", "name_mr": "पंजाब रहिवासी दाखला (सेवा केंद्र)", "name_hi": "पंजाब सेवा केंद्र निवास प्रमाण पत्र",
                "description": "Certified proof of residence issued under Punjab Right to Service Act through Sewa Kendras.",
                "description_mr": "पंजाब सेवा केंद्रांमार्फत अधिकृत रहिवासी प्रमाणपत्र.",
                "description_hi": "पंजाब सेवा के अधिकार अधिनियम के अंतर्गत सेवा केंद्र द्वारा जारी निवास प्रमाण पत्र।",
                "fee": 60.00, "processing_days": 7,
                "required_docs": ["Aadhaar Card", "Voter ID / Electricity Bill (5 yrs)", "Passport Photo"],
                "eligibility": {"residency": "Resident of Punjab for 5+ years"},
                "fields": [
                    {"key": "district", "label": "District", "label_mr": "जिल्हा", "label_hi": "जिला", "type": "TEXT", "required": True},
                    {"key": "tehsil", "label": "Tehsil", "label_mr": "तहसील", "label_hi": "तहसील", "type": "TEXT", "required": True}
                ]
            },
            # 20. Jammu & Kashmir Domicile
            {
                "code": "JK_DOMICILE_CERT", "state_code": "JK", "dept_code": "JK_UNNAT", "cat_code": "CERT",
                "name": "J&K e-UNNAT Domicile Certificate", "name_mr": "जम्मू आणि काश्मीर अधिवास प्रमाणपत्र (e-UNNAT)", "name_hi": "जम्मू और कश्मीर ई-उन्नत अधिवास (Domicile) प्रमाण पत्र",
                "description": "Statutory domicile certificate issued by competent authority under J&K Grant of Domicile Certificate Rules.",
                "description_mr": "जम्मू आणि काश्मीर अधिवास नियमावली अंतर्गत अधिकृत प्रमाणपत्र.",
                "description_hi": "जम्मू एवं कश्मीर अधिवास प्रमाण पत्र नियम के तहत ई-उन्नत पोर्टल द्वारा अधिकृत प्रमाण पत्र।",
                "fee": 0.00, "processing_days": 15,
                "required_docs": ["PRC / 15 years residence proof in J&K", "Aadhaar Card", "School Records"],
                "eligibility": {"residency": "Resident in J&K for 15+ years or studied 7 years and appeared in 10th/12th in J&K"},
                "fields": [
                    {"key": "district", "label": "District", "label_mr": "जिल्हा", "label_hi": "जिला", "type": "TEXT", "required": True},
                    {"key": "tehsil", "label": "Tehsil", "label_mr": "तहसील", "label_hi": "तहसील", "type": "TEXT", "required": True}
                ]
            },
            # 21. MP Lok Seva Domicile
            {
                "code": "MP_DOMICILE_CERT", "state_code": "MP", "dept_code": "MP_LOK", "cat_code": "CERT",
                "name": "MP Lok Seva Mool Niwas Certificate", "name_mr": "मध्य प्रदेश मूल निवासी दाखला (लोकसेवा हमी)", "name_hi": "मध्य प्रदेश लोक सेवा मूल निवासी प्रमाण पत्र",
                "description": "Certified bonafide residency certificate issued under MP Public Service Guarantee Act.",
                "description_mr": "मध्य प्रदेश लोकसेवा हमी कायद्यांतर्गत मूल निवासी प्रमाणपत्र.",
                "description_hi": "मध्य प्रदेश लोक सेवा गारंटी अधिनियम के तहत अधिकृत मूल निवासी प्रमाण पत्र।",
                "fee": 40.00, "processing_days": 7,
                "required_docs": ["Samagra ID", "Aadhaar Card", "Proof of continuous residence"],
                "eligibility": {"residency": "Resident of Madhya Pradesh"},
                "fields": [
                    {"key": "samagra_id", "label": "Samagra Family ID (9 Digits)", "label_mr": "समग्र आयडी", "label_hi": "समग्र परिवार आईडी (9 अंक)", "type": "TEXT", "required": True},
                    {"key": "district", "label": "District", "label_mr": "जिल्हा", "label_hi": "जिला", "type": "TEXT", "required": True}
                ]
            },
            # 22. Telangana Dharani Land Record
            {
                "code": "TG_DHARANI_ROR", "state_code": "TG", "dept_code": "TG_MEE", "cat_code": "REV_LAND",
                "name": "Telangana Dharani Integrated Land Record (1B/Pahani)", "name_mr": "तेलंगणा धरणी भूमी नोंद (पाहणी/1B)", "name_hi": "तेलंगाना धरणी एकीकृत भू-अभिलेख (1B / पाहणी नकल)",
                "description": "Digitally certified copy of digital Passbook / Pahani / 1B land ownership extract from Dharani portal.",
                "description_mr": "तेलंगणा धरणी पोर्टलवरून अधिकृत डिजिटल पाहणी व १-बी जमीन नोंद.",
                "description_hi": "तेलंगाना धरणी पोर्टल द्वारा प्रमाणित डिजिटल पट्टा पासबुक एवं पाहणी 1B भू-स्वामित्व नकल।",
                "fee": 35.00, "processing_days": 2,
                "required_docs": ["Pattadar Passbook Number / Survey Number"],
                "eligibility": {"criteria": "Pattadar in Telangana"},
                "fields": [
                    {"key": "district", "label": "District", "label_mr": "जिल्हा", "label_hi": "जिला", "type": "TEXT", "required": True},
                    {"key": "mandal", "label": "Mandal", "label_mr": "मंडल", "label_hi": "मंडल", "type": "TEXT", "required": True},
                    {"key": "village", "label": "Village", "label_mr": "गाव", "label_hi": "ग्राम", "type": "TEXT", "required": True},
                    {"key": "survey_no", "label": "Survey / Sub-Division Number", "label_mr": "सर्व्हे क्रमांक", "label_hi": "सर्वे संख्या", "type": "TEXT", "required": True}
                ]
            },
            # 23. Odisha Bhulekh RoR
            {
                "code": "OD_BHULEKH_ROR", "state_code": "OD", "dept_code": "OD_REV", "cat_code": "REV_LAND",
                "name": "Odisha Bhulekh Certified RoR Land Record", "name_mr": "ओडिशा भुलेख भूमी अभिलेख (RoR)", "name_hi": "ओडिशा भूलेख प्रमाणित अधिकार अभिलेख (RoR)",
                "description": "Certified Record-of-Rights (Khatian / RoR) copy from Revenue & Disaster Management Department, Odisha.",
                "description_mr": "ओडिशा महसूल विभागाकडून खतियान जमिनीचा अधिकृत डिजिटल दाखला.",
                "description_hi": "ओडिशा राजस्व विभाग द्वारा जारी प्रमाणित अधिकार अभिलेख (RoR / खतियान) नकल।",
                "fee": 30.00, "processing_days": 3,
                "required_docs": ["Khatian Number / Tenant Name"],
                "eligibility": {"criteria": "Landholder or legal representative in Odisha"},
                "fields": [
                    {"key": "district", "label": "District", "label_mr": "जिल्हा", "label_hi": "जिला", "type": "TEXT", "required": True},
                    {"key": "tahasil", "label": "Tahasil", "label_mr": "तहसील", "label_hi": "तहसील", "type": "TEXT", "required": True},
                    {"key": "village", "label": "Village", "label_mr": "गाव", "label_hi": "ग्राम", "type": "TEXT", "required": True},
                    {"key": "khatian_no", "label": "Khatian Number", "label_mr": "खतियान क्रमांक", "label_hi": "खतियान संख्या", "type": "TEXT", "required": True}
                ]
            },
            # 24. Goa Trade License
            {
                "code": "GA_TRADE_LICENSE", "state_code": "GA", "dept_code": "GA_GOA", "cat_code": "CIVIC",
                "name": "GoaOnline Village Panchayat / Municipal Trade License", "name_mr": "गोवा पंचायत / महापालिका व्यापार परवाना", "name_hi": "गोवा पंचायत / नगर पालिका व्यापार लाइसेंस (GoaOnline)",
                "description": "Single window business establishment and trade permit under Goa Directorate of Panchayats / DMA.",
                "description_mr": "गोवा पंचायत व महापालिका अंतर्गत नवीन व्यवसाय सुरू करण्याचा अधिकृत परवाना.",
                "description_hi": "GoaOnline एकल खिड़की के माध्यम से पंचायत अथवा नगर पालिका व्यापार संचालन अनुमति प्रमाण पत्र।",
                "fee": 500.00, "processing_days": 14,
                "required_docs": ["Ownership Deed / Lease Agreement", "NOC from Health / Fire (if applicable)", "PAN Card", "Aadhaar Card"],
                "eligibility": {"criteria": "Business operator in Goa"},
                "fields": [
                    {"key": "business_name", "label": "Trade / Business Name", "label_mr": "व्यवसायाचे नाव", "label_hi": "व्यापार / प्रतिष्ठान का नाम", "type": "TEXT", "required": True},
                    {"key": "panchayat_municipality", "label": "Local Panchayat or Municipality", "label_mr": "स्थानिक पंचायत/पालिका", "label_hi": "संबंधित पंचायत अथवा नगर पालिका", "type": "TEXT", "required": True},
                    {"key": "nature_of_trade", "label": "Category of Trade Activity", "label_mr": "व्यवसायाचा प्रकार", "label_hi": "व्यापार की प्रकृति", "type": "DROPDOWN", "required": True, "options": ["Retail Shop", "Food & Restaurant", "Hospitality / Tourism", "IT / Services", "Manufacturing"]}
                ]
            },
            # 25. Haryana SARAL Resident
            {
                "code": "HR_SARAL_RESIDENCE", "state_code": "HR", "dept_code": "HR_SAR", "cat_code": "CERT",
                "name": "Haryana Antyodaya SARAL Resident Certificate", "name_mr": "हरियाणा सरल रहिवासी दाखला (PPP)", "name_hi": "हरियाणा अंत्योदय सरल निवास प्रमाण पत्र (PPP लिंक)",
                "description": "Digitally verified resident certificate linked with Haryana Parivar Pehchan Patra (Family ID).",
                "description_mr": "हरियाणा परिवार पहचान पत्र (PPP) लिंक केलेला अधिकृत रहिवासी दाखला.",
                "description_hi": "हरियाणा परिवार पहचान पत्र (PPP) से सत्यापित अंत्योदय सरल डिजिटल निवास प्रमाण पत्र।",
                "fee": 30.00, "processing_days": 7,
                "required_docs": ["Parivar Pehchan Patra (Family ID)", "Aadhaar Card", "Electricity Bill"],
                "eligibility": {"residency": "Permanent resident of Haryana with active PPP ID"},
                "fields": [
                    {"key": "family_id", "label": "Parivar Pehchan Patra (PPP) Family ID", "label_mr": "कुटुंब ओळखपत्र (PPP)", "label_hi": "परिवार पहचान पत्र (PPP) आईडी", "type": "TEXT", "required": True},
                    {"key": "district", "label": "District", "label_mr": "जिल्हा", "label_hi": "जिला", "type": "TEXT", "required": True}
                ]
            },
            # 26. Chandigarh e-JanSampark Resident
            {
                "code": "CH_RESIDENT_CERT", "state_code": "CH", "dept_code": "CH_SAMP", "cat_code": "CERT",
                "name": "Chandigarh e-JanSampark Residence Certificate", "name_mr": "चंदिगढ ई-जनसंपर्क रहिवासी दाखला", "name_hi": "चंडीगढ़ ई-जनसंपर्क निवास प्रमाण पत्र",
                "description": "Official residence certificate issued by Sub-Divisional Magistrate (SDM) through e-JanSampark in UT Chandigarh.",
                "description_mr": "चंदिगढ केंद्रशासित प्रदेशातील अधिकृत रहिवासी दाखला.",
                "description_hi": "चंडीगढ़ प्रशासन ई-जनसंपर्क केंद्र द्वारा एसडीएम अधिकृत निवास प्रमाण पत्र।",
                "fee": 35.00, "processing_days": 10,
                "required_docs": ["Aadhaar Card", "Proof of Residence (Voter ID / Allotment Letter)", "Passport Photo"],
                "eligibility": {"residency": "Resident of UT Chandigarh for 3+ years"},
                "fields": [
                    {"key": "sector_village", "label": "Sector / Village in Chandigarh", "label_mr": "सेक्टर / गाव", "label_hi": "चंडीगढ़ सेक्टर अथवा ग्राम", "type": "TEXT", "required": True}
                ]
            },
            # 27. Ladakh Resident
            {
                "code": "LA_RESIDENT_CERT", "state_code": "LA", "dept_code": "LA_EDIST", "cat_code": "CERT",
                "name": "UT Ladakh Resident Certificate", "name_mr": "लडाख केंद्रशासित प्रदेश रहिवासी दाखला", "name_hi": "लद्दाख केंद्र शासित प्रदेश निवासी प्रमाण पत्र",
                "description": "Resident certificate issued by Deputy Commissioner / Tehsildar across Leh and Kargil districts.",
                "description_mr": "लेह आणि कारगिल जिल्ह्यांसाठी अधिकृत लडाख रहिवासी प्रमाणपत्र.",
                "description_hi": "लेह एवं कारगिल जिलों हेतु उपायुक्त/तहसीलदार द्वारा जारी आधिकारिक लद्दाख निवासी प्रमाण पत्र।",
                "fee": 0.00, "processing_days": 15,
                "required_docs": ["Aadhaar Card", "Permanent Resident Card (PRC) / Ancestral Land Proof", "Voter ID"],
                "eligibility": {"residency": "Permanent resident of UT Ladakh"},
                "fields": [
                    {"key": "district", "label": "District", "label_mr": "जिल्हा", "label_hi": "जिला", "type": "DROPDOWN", "required": True, "options": ["Leh", "Kargil"]},
                    {"key": "tehsil", "label": "Tehsil", "label_mr": "तहसील", "label_hi": "तहसील", "type": "TEXT", "required": True}
                ]
            },
            # 28. Puducherry Domicile
            {
                "code": "PY_RESIDENCE_CERT", "state_code": "PY", "dept_code": "PY_EDIST", "cat_code": "CERT",
                "name": "Puducherry e-District Residence Certificate", "name_mr": "पुडुचेरी रहिवासी प्रमाणपत्र (ई-डिस्ट्रिक्ट)", "name_hi": "पुडुचेरी ई-डिस्ट्रिक्ट निवास प्रमाण पत्र",
                "description": "Statutory proof of continuous residence across Puducherry, Karaikal, Mahe, and Yanam regions.",
                "description_mr": "पुडुचेरी, कराईकल, माहे व यानम विभागांसाठी अधिकृत रहिवासी दाखला.",
                "description_hi": "पुडुचेरी, कराईकल, माहे एवं यानम क्षेत्रों हेतु 5 वर्ष निरंतर निवास का आधिकारिक प्रमाण पत्र।",
                "fee": 25.00, "processing_days": 7,
                "required_docs": ["Aadhaar Card", "Ration Card", "Electoral Roll Proof (5 years)"],
                "eligibility": {"residency": "Continuous 5 years in UT Puducherry"},
                "fields": [
                    {"key": "region", "label": "Region", "label_mr": "विभाग", "label_hi": "क्षेत्र", "type": "DROPDOWN", "required": True, "options": ["Puducherry", "Karaikal", "Mahe", "Yanam"]},
                    {"key": "taluk", "label": "Taluk", "label_mr": "तालुका", "label_hi": "तालुक", "type": "TEXT", "required": True}
                ]
            },
            # 29. CBSE Digital Marksheet & Duplicate Certificate
            {
                "code": "CBSE_MARKSHEET_VERIFY", "state_code": "CENTRAL", "dept_code": "GOI_CBSE", "cat_code": "EDUCATION",
                "name": "CBSE Digital Marksheet & Migration Certificate (Pariksha Sangam)",
                "name_mr": "सीबीएसई डिजिटल गुणपत्रिका आणि स्थलांतर प्रमाणपत्र (परीक्षा संगम)",
                "name_hi": "सीबीएसई डिजिटल अंकतालिका (Marksheet) एवं प्रव्रजन प्रमाण पत्र (Pariksha Sangam)",
                "description": "Issuance of official digital or duplicate marksheet, passing certificate, and migration certificate for CBSE Class 10th (Secondary) & 12th (Senior School) examinations.",
                "description_mr": "सीबीएसई १० वी व १२ वी बोर्ड परीक्षेसाठी अधिकृत डिजिटल गुणपत्रिका, उत्तीर्ण दाखला आणि स्थलांतर प्रमाणपत्र अर्ज व पडताळणी.",
                "description_hi": "केन्द्रीय माध्यमिक शिक्षा बोर्ड (CBSE) 10वीं एवं 12वीं परीक्षा की डिजिटल अथवा डुप्लीकेट अंकतालिका, उत्तीर्ण प्रमाण पत्र एवं माइग्रेशन प्रमाण पत्र प्राप्ति हेतु ऑनलाइन आवेदन।",
                "fee": 100.00, "processing_days": 5,
                "required_docs": ["Aadhaar Card", "Previous Admit Card or Roll Number details", "School Affiliation / Center details"],
                "eligibility": {"criteria": "Candidates who appeared in CBSE Class X or XII Board Examinations"},
                "fields": [
                    {"key": "class_level", "label": "Class Level", "label_mr": "इयत्ता", "label_hi": "कक्षा स्तर", "type": "DROPDOWN", "required": True, "options": ["Class X (Secondary / 10th)", "Class XII (Senior Secondary / 12th)"]},
                    {"key": "document_type", "label": "Document Required", "label_mr": "आवश्यक दस्तऐवज", "label_hi": "आवश्यक प्रमाण पत्र", "type": "DROPDOWN", "required": True, "options": ["Duplicate Marksheet / Marks Statement", "Passing Certificate", "Migration Certificate", "Verification / Attestation"]},
                    {"key": "exam_year", "label": "Passing / Examination Year (e.g. 2024)", "label_mr": "परीक्षेचे वर्ष", "label_hi": "परीक्षा वर्ष", "type": "NUMBER", "required": True},
                    {"key": "roll_number", "label": "CBSE Roll Number (8 Digits)", "label_mr": "रोल नंबर", "label_hi": "अनुक्रमांक (Roll Number)", "type": "TEXT", "required": True},
                    {"key": "school_code", "label": "5-Digit CBSE School Code", "label_mr": "शाळा संकेतांक", "label_hi": "स्कूल कोड (5 अंक)", "type": "TEXT", "required": True},
                    {"key": "center_no", "label": "CBSE Examination Center Number", "label_mr": "केंद्र क्रमांक", "label_hi": "परीक्षा केंद्र संख्या", "type": "TEXT", "required": False}
                ]
            },
            # 30. National Scholarship Portal (NSP)
            {
                "code": "NSP_SCHOLARSHIP", "state_code": "CENTRAL", "dept_code": "GOI_EDU", "cat_code": "EDUCATION",
                "name": "National Scholarship Portal (NSP) Central Sector Scheme",
                "name_mr": "राष्ट्रीय शिष्यवृत्ती पोर्टल (NSP) केंद्रीय क्षेत्र योजना",
                "name_hi": "राष्ट्रीय छात्रवृत्ति पोर्टल (NSP) केन्द्रीय क्षेत्र छात्रवृत्ति योजना",
                "description": "Central Government direct financial grant for meritorious students pursuing higher studies in colleges and universities.",
                "description_mr": "महाविद्यालयीन आणि विद्यापीठ उच्च शिक्षणासाठी गुणवंत विद्यार्थ्यांसाठी केंद्र सरकारची आर्थिक शिष्यवृत्ती.",
                "description_hi": "महाविद्यालयीन एवं विश्वविद्यालय स्तर पर अध्ययनरत मेधावी विद्यार्थियों हेतु केंद्र सरकार द्वारा प्रत्यक्ष बैंक अंतरण (DBT) छात्रवृत्ति योजना।",
                "fee": 0.00, "processing_days": 30,
                "required_docs": ["Aadhaar Card", "Class 12th Marksheet", "Income Certificate (< 4.5 Lakhs)", "College Fee Receipt", "Bank Passbook"],
                "eligibility": {"criteria": "80th percentile in Class 12th Board Exam and family annual income below Rs 4.5 Lakhs"},
                "fields": [
                    {"key": "board_name", "label": "12th Examination Board", "label_mr": "१२ वी परीक्षा मंडळ", "label_hi": "12वीं परीक्षा बोर्ड", "type": "DROPDOWN", "required": True, "options": ["CBSE", "ICSE / CISCE", "Maharashtra State Board (MSBSHSE)", "UP Board (UPMSP)", "Karnataka KSEAB", "Other State Board"]},
                    {"key": "twelfth_roll_no", "label": "12th Roll Number / Seat No.", "label_mr": "१२ वी रोल नंबर", "label_hi": "12वीं रोल नंबर", "type": "TEXT", "required": True},
                    {"key": "annual_family_income", "label": "Annual Family Income (INR)", "label_mr": "कौटुंबिक वार्षिक उत्पन्न", "label_hi": "पारिवारिक वार्षिक आय", "type": "NUMBER", "required": True},
                    {"key": "college_name", "label": "Current College / University Name", "label_mr": "महाविद्यालयाचे नाव", "label_hi": "महाविद्यालय / विश्वविद्यालय का नाम", "type": "TEXT", "required": True},
                    {"key": "course_name", "label": "Degree / Course Enrolled", "label_mr": "अभ्यासक्रम", "label_hi": "पाठ्यक्रम का नाम", "type": "TEXT", "required": True}
                ]
            },
            # 31. APAAR / Academic Bank of Credits Student ID
            {
                "code": "APAAR_ABC_ID", "state_code": "CENTRAL", "dept_code": "GOI_EDU", "cat_code": "EDUCATION",
                "name": "APAAR One Nation One Student Digital ID (Academic Bank of Credits)",
                "name_mr": "अपार (APAAR) एक देश एक विद्यार्थी डिजिटल आयडी",
                "name_hi": "अपार (APAAR) वन नेशन वन स्टूडेंट डिजिटल पहचान पत्र (एकेडमिक बैंक ऑफ क्रेडिट्स)",
                "description": "Creation of lifelong 12-digit APAAR ID under National Education Policy 2020 seamlessly consolidating school marksheets, college degrees, and credit transfers.",
                "description_mr": "राष्ट्रीय शैक्षणिक धोरण २०२० अंतर्गत सर्व शैक्षणिक गुणपत्रिका व पदव्या डिजिटल स्वरूपात जोडणारा १२ अंकी अपार आयडी.",
                "description_hi": "राष्ट्रीय शिक्षा नीति (NEP 2020) के अंतर्गत स्कूली अंकतालिकाओं, उच्च शिक्षा क्रेडिट एवं डिग्रियों को एकीकृत करने वाला आजीवन 12-अंकीय APAAR डिजिटल छात्र पहचान पत्र।",
                "fee": 0.00, "processing_days": 1,
                "required_docs": ["Aadhaar Card with linked Mobile", "School or College Enrollment / Registration Number"],
                "eligibility": {"criteria": "All students enrolled in recognized Indian schools, colleges, and universities"},
                "fields": [
                    {"key": "student_legal_name", "label": "Student Name (as in Aadhaar)", "label_mr": "विद्यार्थ्याचे नाव", "label_hi": "विद्यार्थी का नाम (आधार अनुसार)", "type": "TEXT", "required": True},
                    {"key": "aadhaar_number", "label": "12-Digit Aadhaar Number", "label_mr": "आधार क्रमांक", "label_hi": "आधार संख्या (12 अंक)", "type": "TEXT", "required": True},
                    {"key": "institution_type", "label": "Institution Category", "label_mr": "संस्थेचा प्रकार", "label_hi": "संस्थान की श्रेणी", "type": "DROPDOWN", "required": True, "options": ["School (CBSE / State Board / ICSE)", "College / University (Undergraduate)", "Postgraduate / Doctorate", "Skill / Technical Institute"]},
                    {"key": "institution_name", "label": "Name of School / College", "label_mr": "शाळा / महाविद्यालयाचे नाव", "label_hi": "स्कूल / कॉलेज का नाम", "type": "TEXT", "required": True}
                ]
            },
            # 32. Maharashtra State Board SSC/HSC Marksheet & Verification
            {
                "code": "MH_BOARD_MARKSHEET", "state_code": "MH", "dept_code": "MH_BOARD", "cat_code": "EDUCATION",
                "name": "Maharashtra State Board SSC/HSC Marksheet & Verification (e-MarkSheet)",
                "name_mr": "महाराष्ट्र राज्य मंडळ १० वी / १२ वी गुणपत्रिका व पडताळणी (e-MarkSheet)",
                "name_hi": "महाराष्ट्र राज्य बोर्ड 10वीं (SSC) / 12वीं (HSC) अंकतालिका एवं सत्यापन",
                "description": "Official digital verification and duplicate marksheet / certificate issuance for Maharashtra State Board 10th (SSC) and 12th (HSC) examinations via MSBSHSE e-MarkSheet.",
                "description_mr": "महाराष्ट्र राज्य माध्यमिक व उच्च माध्यमिक शिक्षण मंडळाची १० वी (SSC) व १२ वी (HSC) अधिकृत डिजिटल गुणपत्रिका व पडताळणी प्रमाणपत्र.",
                "description_hi": "महाराष्ट्र राज्य माध्यमिक एवं उच्च माध्यमिक शिक्षा बोर्ड (MSBSHSE पुणे) द्वारा 10वीं (SSC) एवं 12वीं (HSC) अंकतालिका का ऑनलाइन सत्यापन एवं द्वितीयक प्रमाण पत्र प्राप्ति।",
                "fee": 50.00, "processing_days": 3,
                "required_docs": ["Seat Number / Hall Ticket details", "Passing Year & Month", "Aadhaar Card"],
                "eligibility": {"criteria": "Students who appeared in Maharashtra State Board SSC or HSC examinations from 1990 onwards"},
                "fields": [
                    {"key": "exam_level", "label": "Examination Level", "label_mr": "परीक्षेचा स्तर", "label_hi": "परीक्षा स्तर", "type": "DROPDOWN", "required": True, "options": ["SSC (10th Standard)", "HSC (12th Standard)"]},
                    {"key": "exam_session", "label": "Exam Session / Month", "label_mr": "परीक्षेचा महिना", "label_hi": "परीक्षा सत्र / माह", "type": "DROPDOWN", "required": True, "options": ["March / April (Annual)", "October / November (Supplementary)", "July (Supplementary)"]},
                    {"key": "exam_year", "label": "Examination Year (e.g. 2023)", "label_mr": "परीक्षेचे वर्ष", "label_hi": "परीक्षा वर्ष", "type": "NUMBER", "required": True},
                    {"key": "seat_number", "label": "Board Seat Number (e.g. A123456)", "label_mr": "आसन क्रमांक (Seat No)", "label_hi": "सीट नंबर (Seat Number)", "type": "TEXT", "required": True},
                    {"key": "total_marks", "label": "Total Marks Obtained (Optional)", "label_mr": "मिळालेले एकूण गुण", "label_hi": "प्राप्त कुल अंक", "type": "NUMBER", "required": False}
                ]
            },
            # 33. UP Board High School / Intermediate Marksheet Verification
            {
                "code": "UP_BOARD_MARKSHEET", "state_code": "UP", "dept_code": "UP_MSP", "cat_code": "EDUCATION",
                "name": "UPMSP High School & Intermediate Marksheet Verification",
                "name_mr": "उत्तर प्रदेश माध्यमिक शिक्षण मंडळ १० वी व १२ वी गुणपत्रिका पडताळणी",
                "name_hi": "यूपी बोर्ड हाईस्कूल (10वीं) एवं इंटरमीडिएट (12वीं) अंकतालिका सत्यापन एवं द्वितीयक प्रमाण पत्र",
                "description": "Online verification and certified duplicate copy of High School (10th) and Intermediate (12th) board certificates issued by UPMSP Prayagraj.",
                "description_mr": "उत्तर प्रदेश माध्यमिक शिक्षण परिषद प्रयागराज मार्फत १० वी व १२ वी अधिकृत गुणपत्रिका पडताळणी.",
                "description_hi": "उत्तर प्रदेश माध्यमिक शिक्षा परिषद (UPMSP प्रयागराज) द्वारा हाईस्कूल (10वीं) एवं इंटरमीडिएट (12वीं) परीक्षा की अधिकृत डिजिटल अंकतालिका सत्यापन।",
                "fee": 100.00, "processing_days": 7,
                "required_docs": ["Roll Number", "Passing Year", "District Code", "Aadhaar Card"],
                "eligibility": {"criteria": "Candidates appearing in UPMSP High School or Intermediate examinations"},
                "fields": [
                    {"key": "class_name", "label": "Class / Examination", "label_mr": "वर्ग / परीक्षा", "label_hi": "कक्षा / परीक्षा", "type": "DROPDOWN", "required": True, "options": ["High School (Class 10th)", "Intermediate (Class 12th)"]},
                    {"key": "passing_year", "label": "Year of Examination", "label_mr": "उत्तीर्ण वर्ष", "label_hi": "उत्तीर्ण वर्ष", "type": "NUMBER", "required": True},
                    {"key": "roll_no", "label": "7 or 10-Digit UPMSP Roll Number", "label_mr": "रोल क्रमांक", "label_hi": "रोल नंबर", "type": "TEXT", "required": True},
                    {"key": "district", "label": "District of Examination", "label_mr": "जिल्हा", "label_hi": "परीक्षा जिला", "type": "TEXT", "required": True}
                ]
            },
            # 34. Ayushman Bharat ABHA Health Account
            {
                "code": "CENTRAL_ABHA_HEALTH", "state_code": "CENTRAL", "dept_code": "GOI_HEALTH", "cat_code": "WELFARE",
                "name": "Ayushman Bharat Health Account (ABHA Card)",
                "name_mr": "आयुष्मान भारत डिजिटल आरोग्य कार्ड (ABHA ID)",
                "name_hi": "आयुष्मान भारत डिजिटल हेल्थ अकाउंट (ABHA कार्ड)",
                "description": "National digital health identity granting unique 14-digit ABHA ID for hospital OPD/IPD registrations, digital medical records, and PM-JAY health coverage.",
                "description_mr": "१४ अंकी अधिकृत डिजिटल आरोग्य खाते आणि आयुष्मान भारत आरोग्य सेवा सवलती.",
                "description_hi": "राष्ट्रीय स्वास्थ्य प्राधिकरण (NHA) द्वारा प्रत्येक नागरिक हेतु 14-अंकीय डिजिटल हेल्थ कार्ड एवं आयुष्मान भारत मुफ्त स्वास्थ्य सेवा कार्ड।",
                "fee": 0.00, "processing_days": 1,
                "required_docs": ["Aadhaar Card", "Mobile Number linked with Aadhaar"],
                "eligibility": {"criteria": "All citizens of India"},
                "fields": [
                    {"key": "aadhaar_no", "label": "12-Digit Aadhaar Number", "label_mr": "आधार क्रमांक", "label_hi": "आधार संख्या", "type": "TEXT", "required": True},
                    {"key": "mobile_no", "label": "Aadhaar Linked Mobile Number", "label_mr": "मोबाईल क्रमांक", "label_hi": "मोबाइल नंबर", "type": "TEXT", "required": True},
                    {"key": "dob", "label": "Date of Birth (DD/MM/YYYY)", "label_mr": "जन्मतारीख", "label_hi": "जन्म तिथि", "type": "TEXT", "required": True}
                ]
            }
        ]

        services_created = 0
        for s_data in services_catalog:
            dept_id = dept_map.get(s_data["dept_code"])
            cat_id = cat_map.get(s_data["cat_code"])
            if not dept_id or not cat_id:
                continue

            fields = s_data.pop("fields", [])
            req_docs = s_data.pop("required_docs", [])
            elig = s_data.pop("eligibility", "")
            import json
            elig_str = json.dumps(elig, ensure_ascii=False) if isinstance(elig, dict) else str(elig)

            s_data.pop("dept_code")
            s_data.pop("cat_code")

            existing = db.query(Service).filter(Service.code == s_data["code"]).first()
            if not existing:
                s_obj = Service(
                    department_id=dept_id,
                    category_id=cat_id,
                    documents_required=req_docs,
                    eligibility=elig_str,
                    **s_data
                )
                db.add(s_obj)
                db.flush()
                # Create dynamic form schema
                form_schema = {"title": s_data["name"], "fields": fields}
                db.add(ServiceForm(service_id=s_obj.id, form_schema=form_schema))
                services_created += 1
            else:
                existing.department_id = dept_id
                existing.category_id = cat_id
                existing.name = s_data["name"]
                existing.name_mr = s_data["name_mr"]
                existing.name_hi = s_data["name_hi"]
                existing.state_code = s_data["state_code"]
                existing.description = s_data["description"]
                existing.description_mr = s_data["description_mr"]
                existing.description_hi = s_data["description_hi"]
                existing.fee = s_data["fee"]
                existing.processing_days = s_data["processing_days"]
                existing.documents_required = req_docs
                existing.eligibility = elig_str
                # Update form schema
                if existing.form:
                    existing.form.form_schema = {"title": s_data["name"], "fields": fields}
                else:
                    db.add(ServiceForm(service_id=existing.id, form_schema={"title": s_data["name"], "fields": fields}))
                services_created += 1
        db.commit()
        print(f"[OK] {services_created} All-India Services & Dynamic Forms seeded.")

        # 5. Seed Demonstration Users
        demo_users = [
            {
                "email": "citizen@mahaseva.gov.in",
                "phone": "9876543210",
                "full_name": "Aarav Sharma (Citizen)",
                "password_hash": get_password_hash("Citizen@2026"),
                "role": RoleEnum.CITIZEN,
                "department_id": None
            },
            {
                "email": "officer.revenue@mahaseva.gov.in",
                "phone": "9876543211",
                "full_name": "Suresh Deshmukh (Tahsildar)",
                "password_hash": get_password_hash("Officer@2026"),
                "role": RoleEnum.OFFICER,
                "department_id": dept_map.get("MH_REV")
            },
            {
                "email": "officer.municipal@mahaseva.gov.in",
                "phone": "9876543212",
                "full_name": "Sunita Patil (ULB Officer)",
                "password_hash": get_password_hash("Officer@2026"),
                "role": RoleEnum.OFFICER,
                "department_id": dept_map.get("MH_UDD")
            },
            {
                "email": "admin@mahaseva.gov.in",
                "phone": "9876543213",
                "full_name": "Rajesh Kadam (State Super Admin)",
                "password_hash": get_password_hash("Admin@2026"),
                "role": RoleEnum.SUPER_ADMIN,
                "department_id": None
            }
        ]
        user_map = {}
        for u in demo_users:
            existing = db.query(User).filter(User.email == u["email"]).first()
            if not existing:
                u_obj = User(**u)
                db.add(u_obj)
                db.flush()
                user_map[u["email"]] = u_obj.id
            else:
                existing.department_id = u["department_id"]
                user_map[u["email"]] = existing.id
        db.commit()
        print(f"[OK] {len(user_map)} Demo Users verified.")

        # 6. Seed Sample Multi-State Applications
        sample_apps = [
            {
                "application_number": "MH-REV-2026-00101",
                "service_code": "MH_INCOME_CERT",
                "state_code": "MH",
                "citizen_email": "citizen@mahaseva.gov.in",
                "status": "UNDER_REVIEW",
                "form_data": {"annual_income": 120000, "income_source": "Agriculture", "purpose": "Higher Education / Scholarship", "district": "Pune", "taluka": "Haveli"}
            },
            {
                "application_number": "KA-BES-2026-00201",
                "service_code": "KA_BESCOM_POWER",
                "state_code": "KA",
                "citizen_email": "citizen@mahaseva.gov.in",
                "status": "SUBMITTED",
                "form_data": {"khata_number": "BBMP-KH-2026-9812", "sanctioned_load_kw": 5, "consumer_category": "LT-2(a) Domestic"}
            },
            {
                "application_number": "DL-FCS-2026-00301",
                "service_code": "DL_RATION_CARD",
                "state_code": "DL",
                "citizen_email": "citizen@mahaseva.gov.in",
                "status": "PROCESSING",
                "form_data": {"head_of_family": "Geeta Devi", "total_members": 4, "delhi_assembly_constituency": "Chandni Chowk"}
            },
            {
                "application_number": "RJ-DOI-2026-00401",
                "service_code": "RJ_BONAFIDE_CERT",
                "state_code": "RJ",
                "citizen_email": "citizen@mahaseva.gov.in",
                "status": "APPROVED",
                "form_data": {"jan_aadhaar_no": "JA-7821-4451", "district": "Jaipur"}
            },
            {
                "application_number": "JK-UNN-2026-00501",
                "service_code": "JK_DOMICILE_CERT",
                "state_code": "JK",
                "citizen_email": "citizen@mahaseva.gov.in",
                "status": "UNDER_REVIEW",
                "form_data": {"district": "Srinagar", "tehsil": "Eidgah"}
            }
        ]
        for app in sample_apps:
            svc = db.query(Service).filter(Service.code == app["service_code"]).first()
            cit = db.query(User).filter(User.email == app["citizen_email"]).first()
            if svc and cit:
                existing = db.query(Application).filter(Application.application_number == app["application_number"]).first()
                if not existing:
                    app_obj = Application(
                        application_number=app["application_number"],
                        service_id=svc.id,
                        citizen_id=cit.id,
                        department_id=svc.department_id,
                        status=app["status"],
                        form_data=app["form_data"],
                        remarks=f"Application {app['application_number']} submitted online via Maha-Seva Portal."
                    )
                    db.add(app_obj)
                    db.flush()
                    db.add(ApplicationEvent(
                        application_id=app_obj.id,
                        old_status=None,
                        new_status="SUBMITTED",
                        actor_id=cit.id,
                        remarks=f"Application {app['application_number']} submitted online via Maha-Seva Portal."
                    ))
        db.commit()
        print("[OK] Sample Multi-State Applications seeded.")

        print("==================================================")
        print("[SUCCESS] All-India Database seeding complete!")
        print("==================================================")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Seeding failed: {e}")
        import traceback
        traceback.print_exc()
        raise e
    finally:
        db.close()

if __name__ == '__main__':
    seed()
