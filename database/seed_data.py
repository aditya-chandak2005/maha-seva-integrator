"""
Maha-Seva Integrator - Database Seeding Script
Seeds multi-state departments, categories, services, dynamic forms, demo users, and sample applications.
Supports: Maharashtra (MH), Karnataka (KA), Gujarat (GJ), Delhi (DL), Uttar Pradesh (UP).
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
    print("Maha-Seva Integrator - Seeding Multi-State Demonstration Data")
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

        # 2. Seed Multi-State Departments
        dept_data = [
            # Maharashtra (MH)
            {
                "code": "REV",
                "state_code": "MH",
                "name": "Revenue and Forest Department",
                "name_mr": "महसूल व वन विभाग",
                "name_hi": "राजस्व एवं वन विभाग",
                "description": "Administers land administration, certificates, and revenue collection across Maharashtra.",
                "contact_email": "helpdesk.revenue@mahaseva.gov.in",
                "contact_phone": "022-22025151"
            },
            {
                "code": "UDD",
                "state_code": "MH",
                "name": "Urban Development Department",
                "name_mr": "नगर विकास विभाग",
                "name_hi": "नगर विकास विभाग",
                "description": "Oversees Municipal Corporations, urban local governance, and civic utilities.",
                "contact_email": "helpdesk.urban@mahaseva.gov.in",
                "contact_phone": "022-22027200"
            },
            {
                "code": "RDD",
                "state_code": "MH",
                "name": "Rural Development and Panchayati Raj",
                "name_mr": "ग्रामविकास व पंचायत राज विभाग",
                "name_hi": "ग्रामीण विकास एवं पंचायती राज विभाग",
                "description": "Drives rural empowerment, Gram Panchayat public administration, and rural welfare.",
                "contact_email": "helpdesk.rural@mahaseva.gov.in",
                "contact_phone": "022-22026111"
            },
            {
                "code": "PHD",
                "state_code": "MH",
                "name": "Public Health Department",
                "name_mr": "सार्वजनिक आरोग्य विभाग",
                "name_hi": "लोक स्वास्थ्य विभाग",
                "description": "Coordinates state public healthcare delivery, medical assistance, and vital statistics.",
                "contact_email": "helpdesk.health@mahaseva.gov.in",
                "contact_phone": "022-22026850"
            },
            # Karnataka (KA)
            {
                "code": "KA_REV",
                "state_code": "KA",
                "name": "Karnataka Revenue Department",
                "name_mr": "कर्नाटक महसूल विभाग",
                "name_hi": "कर्नाटक राजस्व विभाग (सेवा सिंधु)",
                "description": "Administers revenue, land title records, and Seva Sindhu citizen certifications in Karnataka.",
                "contact_email": "sevasindhu@karnataka.gov.in",
                "contact_phone": "080-22250011"
            },
            {
                "code": "KA_UDD",
                "state_code": "KA",
                "name": "Bangalore Urban & Electricity (BESCOM)",
                "name_mr": "बंगळुरू नागरी व वीज सुविधा",
                "name_hi": "बेंगलुरु शहरी एवं विद्युत निगम (बेस्कॉम)",
                "description": "Powers urban utility services, water board sanitation, and electricity grid distribution.",
                "contact_email": "helpline@bescom.karnataka.gov.in",
                "contact_phone": "1912"
            },
            # Gujarat (GJ)
            {
                "code": "GJ_REV",
                "state_code": "GJ",
                "name": "Gujarat Revenue Department (AnyRoR)",
                "name_mr": "गुजरात महसूल विभाग",
                "name_hi": "गुजरात राजस्व विभाग (एनी-आरओआर)",
                "description": "Facilitates digital AnyRoR 7/12 land records, mutation certificates, and revenue welfare.",
                "contact_email": "anyror-support@gujarat.gov.in",
                "contact_phone": "079-23250505"
            },
            {
                "code": "GJ_UDD",
                "state_code": "GJ",
                "name": "Gujarat Urban Development Department",
                "name_mr": "गुजरात नगर विकास विभाग",
                "name_hi": "गुजरात शहरी विकास विभाग",
                "description": "Oversees municipal corporations across Ahmedabad, Surat, Vadodara, and Rajkot.",
                "contact_email": "udd-support@gujarat.gov.in",
                "contact_phone": "079-23251212"
            },
            # Delhi (DL)
            {
                "code": "DL_REV",
                "state_code": "DL",
                "name": "Delhi Revenue Department (e-District)",
                "name_mr": "दिल्ली महसूल विभाग",
                "name_hi": "दिल्ली राजस्व विभाग (ई-डिस्ट्रिक्ट)",
                "description": "Unified electronic district administration, transport licenses, and certifications in NCT of Delhi.",
                "contact_email": "edistrict.delhi@nic.in",
                "contact_phone": "011-23935222"
            },
            {
                "code": "DL_FCS",
                "state_code": "DL",
                "name": "Delhi Food, Civil Supplies & Consumer Affairs",
                "name_mr": "दिल्ली अन्न व नागरी पुरवठा",
                "name_hi": "दिल्ली खाद्य एवं नागरिक आपूर्ति विभाग",
                "description": "Manages National Food Security Act (NFSA) ration cards and targeted public distribution in Delhi.",
                "contact_email": "fcs-delhi@nic.in",
                "contact_phone": "1967"
            },
            # Uttar Pradesh (UP)
            {
                "code": "UP_REV",
                "state_code": "UP",
                "name": "Uttar Pradesh Revenue & Social Welfare (eSathi)",
                "name_mr": "उत्तर प्रदेश महसूल व समाजकल्याण",
                "name_hi": "उत्तर प्रदेश राजस्व एवं समाज कल्याण - ई-साथी",
                "description": "eSathi state integration portal delivering citizen certificates, pensions, and land records.",
                "contact_email": "esathi-support@up.gov.in",
                "contact_phone": "0522-2287222"
            }
        ]
        dept_map = {}
        for d in dept_data:
            dept = db.query(Department).filter(Department.code == d["code"]).first()
            if not dept:
                dept = Department(**d)
                db.add(dept)
                db.commit()
                db.refresh(dept)
            else:
                dept.state_code = d["state_code"]
                dept.name_hi = d["name_hi"]
                dept.name_mr = d["name_mr"]
                db.commit()
            dept_map[d["code"]] = dept
        print(f"[OK] {len(dept_map)} Departments seeded across MH, KA, GJ, DL, UP.")

        # 3. Seed Service Categories
        cat_data = [
            {
                "code": "CERT",
                "name": "Certificates & Identification",
                "name_mr": "दाखले आणि ओळख प्रमाणपत्रे",
                "name_hi": "प्रमाण पत्र एवं पहचान दस्तावेज",
                "description": "Essential citizen certificates including Income, Domicile, Caste, and Birth.",
                "icon": "Award"
            },
            {
                "code": "LAND",
                "name": "Revenue & Land Records",
                "name_mr": "जमीन आणि महसूल नोंदी",
                "name_hi": "भूमि एवं राजस्व अभिलेख",
                "description": "7/12 extract verification, mutation entries, and property card services.",
                "icon": "FileText"
            },
            {
                "code": "URBAN",
                "name": "Urban Civic Utilities",
                "name_mr": "नागरी सुविधा आणि पाणी पुरवठा",
                "name_hi": "शहरी नागरिक सुविधाएं एवं जल आपूर्ति",
                "description": "Municipal connections, trade licenses, property tax and utility approvals.",
                "icon": "Building"
            },
            {
                "code": "WELFARE",
                "name": "Social Welfare, Food & Power",
                "name_mr": "सामाजिक कल्याण, अन्न व वीज योजना",
                "name_hi": "समाज कल्याण, खाद्य सुरक्षा एवं विद्युत",
                "description": "Financial assistance, ration cards, power connections, and welfare pensions.",
                "icon": "HeartHandshake"
            }
        ]
        cat_map = {}
        for c in cat_data:
            cat = db.query(ServiceCategory).filter(ServiceCategory.code == c["code"]).first()
            if not cat:
                cat = ServiceCategory(**c)
                db.add(cat)
                db.commit()
                db.refresh(cat)
            else:
                cat.name_hi = c["name_hi"]
                cat.name_mr = c["name_mr"]
                db.commit()
            cat_map[c["code"]] = cat
        print("[OK] Service Categories seeded.")

        # 4. Seed Services & Dynamic Form Schemas
        services_data = [
            # 1. MH: Income Certificate
            {
                "code": "REV_INCOME_CERT",
                "state_code": "MH",
                "name": "Income Certificate",
                "name_mr": "उत्पन्नाचा दाखला",
                "name_hi": "आय प्रमाण पत्र",
                "department_id": dept_map["REV"].id,
                "category_id": cat_map["CERT"].id,
                "description": "Official certificate of annual family income issued by Tahsildar for scholarships, ration subsidies, and governmental assistance.",
                "description_hi": "छात्रवृत्ति, राशन सब्सिडी और सरकारी योजनाओं के लिए तहसीलदार द्वारा जारी वार्षिक पारिवारिक आय प्रमाण पत्र।",
                "eligibility": "Resident of Maharashtra with verified documentary proof of family income.",
                "documents_required": [
                    {"type": "ID_PROOF", "name": "Aadhaar Card / Voter ID", "mandatory": True},
                    {"type": "ADDRESS_PROOF", "name": "Ration Card / Electricity Bill", "mandatory": True},
                    {"type": "INCOME_PROOF", "name": "Salary Slip / Form 16 / Talathi Income Report", "mandatory": True}
                ],
                "fee": 33.60,
                "processing_days": 15,
                "workflow_id": "REVENUE_CERT_WORKFLOW",
                "integration_type": "MOCK_REV",
                "form_schema": [
                    {"key": "applicant_name", "label": "Applicant Full Name", "label_mr": "अर्जदाराचे पूर्ण नाव", "label_hi": "आवेदक का पूरा नाम", "type": "TEXT", "required": True, "placeholder": "As per Aadhaar Card"},
                    {"key": "aadhaar_number", "label": "Aadhaar Number", "label_mr": "आधार क्रमांक", "label_hi": "आधार संख्या", "type": "TEXT", "required": True, "placeholder": "12-digit UID"},
                    {"key": "annual_income", "label": "Annual Family Income (INR)", "label_mr": "वार्षिक कौटुंबिक उत्पन्न (रुपये)", "label_hi": "वार्षिक पारिवारिक आय (रुपये)", "type": "NUMBER", "required": True, "placeholder": "e.g. 120000"},
                    {"key": "income_source", "label": "Primary Income Source", "label_mr": "उत्पन्नाचे मुख्य साधन", "label_hi": "आय का मुख्य स्रोत", "type": "DROPDOWN", "required": True, "options": ["Agriculture (शेती / कृषि)", "Salaried Employment (नोकरी / वेतन)", "Business / Trade (व्यवसाय / व्यापार)", "Daily Wage Labor (मजुरी / मजदूरी)"]},
                    {"key": "certificate_purpose", "label": "Purpose of Certificate", "label_mr": "दाखल्याचे प्रयोजन", "label_hi": "प्रमाण पत्र का प्रयोजन", "type": "DROPDOWN", "required": True, "options": ["Education & Scholarship (शिक्षण व शिष्यवृत्ती / छात्रवृत्ति)", "Government Subsidy / Scheme (सरकारी योजना)", "Bank Loan Application (बँक कर्ज / बैंक ऋण)", "Ration Card Renewal (रेशन कार्ड / राशन कार्ड)"]},
                    {"key": "district", "label": "District", "label_mr": "जिल्हा", "label_hi": "जिला", "type": "DROPDOWN", "required": True, "options": ["Mumbai City", "Mumbai Suburban", "Pune", "Nagpur", "Nashik", "Chhatrapati Sambhajinagar", "Thane", "Solapur"]},
                    {"key": "taluka", "label": "Taluka / Tehsil", "label_mr": "तालुका", "label_hi": "तहसील", "type": "TEXT", "required": True, "placeholder": "e.g. Haveli"},
                    {"key": "village_ward", "label": "Village or Municipal Ward", "label_mr": "गाव / प्रभाग", "label_hi": "गाँव या वार्ड", "type": "TEXT", "required": True, "placeholder": "e.g. Kothrud"}
                ]
            },
            # 2. MH: Domicile Certificate
            {
                "code": "REV_DOMICILE_CERT",
                "state_code": "MH",
                "name": "Age, Nationality and Domicile Certificate",
                "name_mr": "वय, अधिवास आणि राष्ट्रीयत्व प्रमाणपत्र",
                "name_hi": "निवास एवं अधिवास प्रमाण पत्र",
                "department_id": dept_map["REV"].id,
                "category_id": cat_map["CERT"].id,
                "description": "Establishes permanent domicile status in Maharashtra, required for state civil services, college admissions, and competitive quotas.",
                "description_hi": "महाराष्ट्र में स्थायी निवास एवं अधिवास की आधिकारिक पुष्टि, जो राज्य सिविल सेवा और कॉलेज प्रवेश हेतु आवश्यक है।",
                "eligibility": "Continuous residence in Maharashtra for a minimum of 15 years supported by documented residence evidence.",
                "documents_required": [
                    {"type": "ID_PROOF", "name": "Aadhaar Card", "mandatory": True},
                    {"type": "RESIDENCE_PROOF", "name": "Proof of 15 Years Continuous Residence in Maharashtra", "mandatory": True},
                    {"type": "BIRTH_PROOF", "name": "School Leaving Certificate / Birth Certificate", "mandatory": True}
                ],
                "fee": 33.60,
                "processing_days": 15,
                "workflow_id": "REVENUE_CERT_WORKFLOW",
                "integration_type": "MOCK_REV",
                "form_schema": [
                    {"key": "applicant_name", "label": "Applicant Full Name", "label_mr": "अर्जदाराचे पूर्ण नाव", "label_hi": "आवेदक का पूरा नाम", "type": "TEXT", "required": True},
                    {"key": "dob", "label": "Date of Birth", "label_mr": "जन्मतारीख", "label_hi": "जन्म तिथि", "type": "DATE", "required": True},
                    {"key": "birth_place", "label": "Place of Birth", "label_mr": "जन्मस्थान", "label_hi": "जन्म स्थान", "type": "TEXT", "required": True},
                    {"key": "years_in_state", "label": "Years of Continuous Residence in Maharashtra", "label_mr": "महाराष्ट्रात वास्तव्याची वर्षे", "label_hi": "महाराष्ट्र में निरंतर निवास के वर्ष", "type": "NUMBER", "required": True, "placeholder": "Min 15 years"},
                    {"key": "domicile_purpose", "label": "Purpose of Domicile Certificate", "label_mr": "प्रमाणपत्राचे प्रयोजन", "label_hi": "प्रमाण पत्र का प्रयोजन", "type": "DROPDOWN", "required": True, "options": ["MPSC / Government Recruitment (शासकीय नोकरी)", "Higher & Professional Education Admissions (उच्च शिक्षण प्रवेश)", "MHADA / Housing Allotment (म्हाडा घरकुल)"]},
                    {"key": "district", "label": "District", "label_mr": "जिल्हा", "label_hi": "जिला", "type": "DROPDOWN", "required": True, "options": ["Mumbai City", "Mumbai Suburban", "Pune", "Nagpur", "Nashik", "Aurangabad", "Thane", "Kolhapur"]}
                ]
            },
            # 3. MH: Caste Certificate
            {
                "code": "REV_CASTE_CERT",
                "state_code": "MH",
                "name": "Caste Certificate Verification",
                "name_mr": "जात प्रमाणपत्र पडताळणी",
                "name_hi": "जाति प्रमाण पत्र सत्यापन",
                "department_id": dept_map["REV"].id,
                "category_id": cat_map["CERT"].id,
                "description": "Official certification of community, scheduled caste, scheduled tribe, or backward class category issued by Sub-Divisional Officer.",
                "description_hi": "उपमंडल अधिकारी द्वारा जारी अनुसूचित जाति, जनजाति या अन्य पिछड़ा वर्ग हेतु आधिकारिक जाति प्रमाण पत्र।",
                "eligibility": "Native resident of Maharashtra with ancestral caste lineage documentation prior to specified cutoff dates.",
                "documents_required": [
                    {"type": "ID_PROOF", "name": "Aadhaar Card of Applicant", "mandatory": True},
                    {"type": "CASTE_PROOF_FATHER", "name": "Father or Blood Relative Primary School Leaving Certificate stating Caste", "mandatory": True},
                    {"type": "AFFIDAVIT", "name": "Self-Declaration Notarized Caste Affidavit", "mandatory": True}
                ],
                "fee": 45.00,
                "processing_days": 21,
                "workflow_id": "REVENUE_CERT_WORKFLOW",
                "integration_type": "MOCK_REV",
                "form_schema": [
                    {"key": "applicant_name", "label": "Applicant Full Name", "label_mr": "अर्जदाराचे पूर्ण नाव", "label_hi": "आवेदक का पूरा नाम", "type": "TEXT", "required": True},
                    {"key": "aadhaar_number", "label": "Aadhaar Number", "label_mr": "आधार क्रमांक", "label_hi": "आधार संख्या", "type": "TEXT", "required": True},
                    {"key": "caste_category", "label": "Caste Category", "label_mr": "प्रवर्ग", "label_hi": "जाति वर्ग", "type": "DROPDOWN", "required": True, "options": ["Scheduled Caste (SC)", "Scheduled Tribe (ST)", "Other Backward Class (OBC)", "Special Backward Class (SBC)", "VJNT / Nomadic Tribes", "SEBC"]},
                    {"key": "sub_caste", "label": "Sub-Caste (उपजात)", "label_mr": "उपजात", "label_hi": "उप-जाति", "type": "TEXT", "required": True, "placeholder": "e.g. Maratha / Chambhar / Mahar"},
                    {"key": "father_name", "label": "Father Full Name", "label_mr": "वडिलांचे नाव", "label_hi": "पिता का नाम", "type": "TEXT", "required": True},
                    {"key": "district", "label": "District", "label_mr": "जिल्हा", "label_hi": "जिला", "type": "DROPDOWN", "required": True, "options": ["Pune", "Mumbai Suburban", "Nagpur", "Nashik", "Kolhapur", "Amravati"]}
                ]
            },
            # 4. MH: 7/12 Land Record Extract
            {
                "code": "REV_712_EXTRACT",
                "state_code": "MH",
                "name": "Certified 7/12 Land Record Extract",
                "name_mr": "७/१२ डिजिटल स्वाक्षरीत उतारा",
                "name_hi": "७/१२ भू-अभिलेख खसरा नकल",
                "department_id": dept_map["REV"].id,
                "category_id": cat_map["LAND"].id,
                "description": "Digitally signed official Record of Rights (RoR) 7/12 land extract detailing land parcel ownership, survey number, and crop survey.",
                "description_hi": "डिजिटल हस्ताक्षरित भू-अभिलेख खसरा/खतौनी (७/१२ उतारा) जिसमें भूमि स्वामित्व, सर्वे संख्या और कृषि फसल का विवरण होता है।",
                "eligibility": "Available for public land record verification across all rural and urban revenue tehsils.",
                "documents_required": [
                    {"type": "IDENTITY_PROOF", "name": "Aadhaar Card of Requester", "mandatory": True}
                ],
                "fee": 15.00,
                "processing_days": 1,
                "workflow_id": "AUTOMATED_DIGITAL_DELIVERY",
                "integration_type": "MOCK_REV",
                "form_schema": [
                    {"key": "requester_name", "label": "Requester Full Name", "label_mr": "अर्जदाराचे नाव", "label_hi": "आवेदक का नाम", "type": "TEXT", "required": True},
                    {"key": "district", "label": "District", "label_mr": "जिल्हा", "label_hi": "जिला", "type": "DROPDOWN", "required": True, "options": ["Pune", "Satara", "Ahmednagar", "Solapur", "Nashik", "Sangli", "Kolhapur", "Nagpur"]},
                    {"key": "taluka", "label": "Taluka", "label_mr": "तालुका", "label_hi": "तहसील", "type": "TEXT", "required": True, "placeholder": "e.g. Haveli"},
                    {"key": "village", "label": "Village Name", "label_mr": "गाव", "label_hi": "गाँव", "type": "TEXT", "required": True, "placeholder": "e.g. Wagholi"},
                    {"key": "survey_gat_number", "label": "Survey / Gat Number", "label_mr": "सर्व्हे / गट क्रमांक", "label_hi": "सर्वे / गाटा संख्या", "type": "TEXT", "required": True, "placeholder": "e.g. 142/1"}
                ]
            },
            # 5. MH: Birth Certificate
            {
                "code": "UDD_BIRTH_CERT",
                "state_code": "MH",
                "name": "Birth Certificate Registration",
                "name_mr": "जन्म नोंदणी दाखला",
                "name_hi": "जन्म प्रमाण पत्र पंजीकरण",
                "department_id": dept_map["UDD"].id,
                "category_id": cat_map["CERT"].id,
                "description": "Municipal issuance of certified birth records registered within urban local body jurisdiction.",
                "description_hi": "शहरी स्थानीय निकाय क्षेत्राधिकार के अंतर्गत पंजीकृत जन्म अभिलेख का आधिकारिक नगर निगम प्रमाण पत्र।",
                "eligibility": "Birth occurring within participating Municipal Corporation or Municipal Council limits.",
                "documents_required": [
                    {"type": "HOSPITAL_DISCHARGE", "name": "Hospital Discharge Card / Birth Notification Slip", "mandatory": True},
                    {"type": "PARENTS_ID", "name": "Identity Proof of Mother and Father", "mandatory": True}
                ],
                "fee": 20.00,
                "processing_days": 7,
                "workflow_id": "MUNICIPAL_STANDARD_WORKFLOW",
                "integration_type": "MOCK_MUN",
                "form_schema": [
                    {"key": "child_name", "label": "Child Full Name", "label_mr": "बाळाचे नाव", "label_hi": "बच्चे का पूरा नाम", "type": "TEXT", "required": True},
                    {"key": "dob", "label": "Date of Birth", "label_mr": "जन्मतारीख", "label_hi": "जन्म तिथि", "type": "DATE", "required": True},
                    {"key": "gender", "label": "Gender", "label_mr": "लिंग", "label_hi": "लिंग", "type": "RADIO", "required": True, "options": ["Male (मुलगा / पुरुष)", "Female (मुलगी / महिला)", "Other (इतर / अन्य)"]},
                    {"key": "father_name", "label": "Father Full Name", "label_mr": "वडिलांचे नाव", "label_hi": "पिता का नाम", "type": "TEXT", "required": True},
                    {"key": "mother_name", "label": "Mother Full Name", "label_mr": "आईचे नाव", "label_hi": "माता का नाम", "type": "TEXT", "required": True},
                    {"key": "hospital_name", "label": "Hospital or Residence Place of Birth", "label_mr": "रुग्णालय / जन्मस्थान", "label_hi": "अस्पताल / जन्म स्थान", "type": "TEXT", "required": True},
                    {"key": "municipal_body", "label": "Municipal Corporation", "label_mr": "महानगरपालिका", "label_hi": "नगर निगम", "type": "DROPDOWN", "required": True, "options": ["Brihanmumbai Municipal Corporation (BMC)", "Pune Municipal Corporation (PMC)", "Nagpur Municipal Corporation (NMC)", "Thane Municipal Corporation (TMC)", "Nashik Municipal Corporation (NMC)"]}
                ]
            },
            # 6. MH: Water Supply Connection
            {
                "code": "UDD_WATER_CONN",
                "state_code": "MH",
                "name": "New Water Supply Connection",
                "name_mr": "नवीन नळ जोडणी",
                "name_hi": "नवीन नल जल कनेक्शन",
                "department_id": dept_map["UDD"].id,
                "category_id": cat_map["URBAN"].id,
                "description": "Application for sanctioning fresh municipal water line connection for residential or commercial properties.",
                "description_hi": "आवासीय अथवा व्यावसायिक संपत्तियों के लिए नए नगर निगम पेयजल कनेक्शन की स्वीकृति हेतु आवेदन।",
                "eligibility": "Property tax assessed structure within Municipal Corporation water network supply grid.",
                "documents_required": [
                    {"type": "TAX_RECEIPT", "name": "Latest Property Tax Paid Receipt", "mandatory": True},
                    {"type": "OWNERSHIP_PROOF", "name": "Sale Deed / Registered Index-II / Ownership Agreement", "mandatory": True},
                    {"type": "PLUMBING_PLAN", "name": "Approved Internal Plumbing Layout", "mandatory": False}
                ],
                "fee": 150.00,
                "processing_days": 21,
                "workflow_id": "MUNICIPAL_TECHNICAL_WORKFLOW",
                "integration_type": "MOCK_MUN",
                "form_schema": [
                    {"key": "owner_name", "label": "Property Owner Full Name", "label_mr": "मालकाचे पूर्ण नाव", "label_hi": "संपत्ति स्वामी का नाम", "type": "TEXT", "required": True},
                    {"key": "property_assessment_no", "label": "Property Tax Assessment Number", "label_mr": "मालमत्ता कर आकारणी क्रमांक", "label_hi": "संपत्ति कर निर्धारण संख्या", "type": "TEXT", "required": True},
                    {"key": "connection_type", "label": "Connection Category", "label_mr": "जोडणी प्रकार", "label_hi": "कनेक्शन श्रेणी", "type": "DROPDOWN", "required": True, "options": ["Domestic Residential (घरगुती / घरेलू)", "Commercial (व्यावसायिक)", "Industrial (औद्योगिक)"]},
                    {"key": "pipe_size", "label": "Required Pipe Size (Inches)", "label_mr": "पाईप आकार (इंच)", "label_hi": "पाइप का आकार", "type": "DROPDOWN", "required": True, "options": ["0.50 Inch (15 mm)", "0.75 Inch (20 mm)", "1.00 Inch (25 mm)"]},
                    {"key": "property_address", "label": "Complete Property Address", "label_mr": "मालमत्तेचा पत्ता", "label_hi": "संपत्ति का पूरा पता", "type": "TEXTAREA", "required": True}
                ]
            },
            # 7. MH: Trade License
            {
                "code": "UDD_TRADE_LICENSE",
                "state_code": "MH",
                "name": "Municipal Trade and Shop License",
                "name_mr": "महानगरपालिका व्यापार परवाना",
                "name_hi": "नगर निगम व्यापार अनुज्ञप्ति (लाइसेंस)",
                "department_id": dept_map["UDD"].id,
                "category_id": cat_map["URBAN"].id,
                "description": "Statutory municipal authorization to operate a business, shop, or commercial facility under Maharashtra Municipal Corporation Act.",
                "description_hi": "महाराष्ट्र नगर निगम अधिनियम के तहत दुकान, कार्यालय या व्यावसायिक प्रतिष्ठान चलाने हेतु वैधानिक व्यापार लाइसेंस।",
                "eligibility": "Commercial establishment operating within municipal limits with valid premises occupancy rights.",
                "documents_required": [
                    {"type": "PREMISES_PROOF", "name": "Rent Agreement / Property Tax Receipt", "mandatory": True},
                    {"type": "FIRE_NOC", "name": "Fire Safety Compliance Clearance (if applicable)", "mandatory": False},
                    {"type": "ID_PROOF", "name": "PAN Card & Aadhaar of Business Owner", "mandatory": True}
                ],
                "fee": 500.00,
                "processing_days": 14,
                "workflow_id": "MUNICIPAL_TECHNICAL_WORKFLOW",
                "integration_type": "MOCK_MUN",
                "form_schema": [
                    {"key": "business_name", "label": "Commercial Business Title", "label_mr": "व्यवसायाचे नाव", "label_hi": "प्रतिष्ठान / व्यापार का नाम", "type": "TEXT", "required": True},
                    {"key": "owner_name", "label": "Proprietor Full Name", "label_mr": "मालकाचे नाव", "label_hi": "स्वामी का पूरा नाम", "type": "TEXT", "required": True},
                    {"key": "business_category", "label": "Business Category", "label_mr": "व्यवसाय प्रकार", "label_hi": "व्यवसाय श्रेणी", "type": "DROPDOWN", "required": True, "options": ["Retail Grocery & Commodities (किराणा)", "IT & Professional Services (माहिती तंत्रज्ञान)", "Restaurant & Food Establishment (हॉटेल व खाद्य)", "Manufacturing Workshop (उत्पादन कार्यशाळा)"]},
                    {"key": "area_sqft", "label": "Total Carpet Area (Sq. Ft.)", "label_mr": "एकूण क्षेत्रफळ (चौ. फूट)", "label_hi": "कुल क्षेत्रफल (वर्ग फुट)", "type": "NUMBER", "required": True},
                    {"key": "property_address", "label": "Premises Address", "label_mr": "व्यवसायाचा पत्ता", "label_hi": "व्यापारिक स्थल का पता", "type": "TEXTAREA", "required": True}
                ]
            },
            # 8. KA: Seva Sindhu Domicile Certificate
            {
                "code": "KA_DOMICILE_CERT",
                "state_code": "KA",
                "name": "Seva Sindhu Resident Domicile Certificate",
                "name_mr": "सेवा सिंधू अधिवास प्रमाणपत्र",
                "name_hi": "सेवा सिंधु मूल निवास प्रमाण पत्र (कर्नाटक)",
                "department_id": dept_map["KA_REV"].id,
                "category_id": cat_map["CERT"].id,
                "description": "Official Karnataka resident domicile certificate under Seva Sindhu for competitive admissions and Karnataka state jobs.",
                "description_hi": "कर्नाटक सेवा सिंधु पोर्टल के अंतर्गत जारी मूल निवास प्रमाण पत्र, जो राज्य प्रतियोगी परीक्षाओं और उच्च शिक्षा कोटा हेतु मान्य है।",
                "eligibility": "Continuous residence in Karnataka for a minimum of 7 years or completion of schooling in Karnataka.",
                "documents_required": [
                    {"type": "AADHAAR", "name": "Aadhaar Card of Applicant", "mandatory": True},
                    {"type": "STUDY_PROOF", "name": "7 Years Study Certificate / Employment Proof in Karnataka", "mandatory": True}
                ],
                "fee": 40.00,
                "processing_days": 14,
                "workflow_id": "STANDARD",
                "integration_type": "MOCK_REV",
                "form_schema": [
                    {"key": "applicant_name", "label": "Applicant Full Name", "label_mr": "अर्जदाराचे पूर्ण नाव", "label_hi": "आवेदक का पूरा नाम", "type": "TEXT", "required": True},
                    {"key": "aadhaar_number", "label": "Aadhaar Number", "label_mr": "आधार क्रमांक", "label_hi": "आधार संख्या", "type": "TEXT", "required": True},
                    {"key": "resident_district", "label": "Karnataka District", "label_mr": "कर्नाटक जिल्हा", "label_hi": "कर्नाटक जिला", "type": "DROPDOWN", "required": True, "options": ["Bengaluru Urban", "Bengaluru Rural", "Mysuru", "Belagavi", "Dharwad", "Mangaluru (Dakshina Kannada)", "Kalaburagi"]},
                    {"key": "taluk", "label": "Taluk", "label_mr": "तालुका", "label_hi": "तालुका / तहसील", "type": "TEXT", "required": True, "placeholder": "e.g. Bengaluru South"},
                    {"key": "years_in_karnataka", "label": "Years of Residence in Karnataka", "label_mr": "कर्नाटकातील वास्तव्याची वर्षे", "label_hi": "कर्नाटक में निवास के वर्ष", "type": "NUMBER", "required": True, "placeholder": "Min 7"}
                ]
            },
            # 9. KA: BESCOM Electricity Connection
            {
                "code": "KA_ELEC_CONN",
                "state_code": "KA",
                "name": "BESCOM Urban Electricity Connection",
                "name_mr": "बेस्कॉम नवीन वीज जोडणी",
                "name_hi": "बेस्कॉम नया विद्युत मीटर कनेक्शन (बेंगलुरु)",
                "department_id": dept_map["KA_UDD"].id,
                "category_id": cat_map["WELFARE"].id,
                "description": "Low Tension residential or commercial electrical service connection from Bangalore Electricity Supply Company (BESCOM).",
                "description_hi": "बेंगलुरु विद्युत आपूर्ति कंपनी (बेस्कॉम) से घरेलू अथवा वाणिज्यिक नए बिजली मीटर कनेक्शन हेतु आधिकारिक आवेदन।",
                "eligibility": "Property owner or verified lawful tenant within BESCOM distribution circles.",
                "documents_required": [
                    {"type": "PROPERTY_PID", "name": "BBMP Khathe / Property Tax Paid Receipt with PID", "mandatory": True},
                    {"type": "ID_PROOF", "name": "Aadhaar / Voter ID of Consumer", "mandatory": True},
                    {"type": "WIRING_COMPLETION", "name": "Licensed Electrical Contractor Wiring Certificate", "mandatory": True}
                ],
                "fee": 350.00,
                "processing_days": 10,
                "workflow_id": "STANDARD",
                "integration_type": "MOCK_MUN",
                "form_schema": [
                    {"key": "consumer_name", "label": "Consumer / Owner Name", "label_mr": "ग्राहकाचे नाव", "label_hi": "उपभोक्ता / स्वामी का नाम", "type": "TEXT", "required": True},
                    {"key": "property_pid", "label": "BBMP Property ID (PID Number)", "label_mr": "बीबीएमपी मालमत्ता ओळख क्रमांक (PID)", "label_hi": "बीबीएमपी संपत्ति पहचान संख्या (PID)", "type": "TEXT", "required": True, "placeholder": "10-digit PID"},
                    {"key": "sanctioned_load_kw", "label": "Required Sanctioned Load (kW)", "label_mr": "आवश्यक विद्युत भार (kW)", "label_hi": "स्वीकृत भार (किलोवाट)", "type": "NUMBER", "required": True, "placeholder": "e.g. 3 or 5"},
                    {"key": "bangalore_subdivision", "label": "BESCOM Sub-Division", "label_mr": "बेस्कॉम उपविभाग", "label_hi": "बेस्कॉम उप-मंडल", "type": "DROPDOWN", "required": True, "options": ["Indiranagar Sub-Division", "Koramangala Sub-Division", "Whitefield Sub-Division", "Jayanagar Sub-Division", "Malleshwaram Sub-Division"]},
                    {"key": "property_address", "label": "Supply Installation Address", "label_mr": "जोडणीचा पत्ता", "label_hi": "कनेक्शन का पूरा पता", "type": "TEXTAREA", "required": True}
                ]
            },
            # 10. GJ: Digital Gujarat Income Proof
            {
                "code": "GJ_INCOME_CERT",
                "state_code": "GJ",
                "name": "Digital Gujarat Resident Income Proof",
                "name_mr": "डिजिटल गुजरात उत्पन्नाचा दाखला",
                "name_hi": "डिजिटल गुजरात आय प्रमाण पत्र",
                "department_id": dept_map["GJ_REV"].id,
                "category_id": cat_map["CERT"].id,
                "description": "Mamlatdar certified income declaration issued under Digital Gujarat portal for welfare scholarships and healthcare schemes.",
                "description_hi": "डिजिटल गुजरात पोर्टल के अंतर्गत मामलातदार द्वारा प्रमाणित वार्षिक पारिवारिक आय प्रमाण पत्र।",
                "eligibility": "Resident of Gujarat with authentic proofs of agricultural, business, or salaried income.",
                "documents_required": [
                    {"type": "ID_PROOF", "name": "Aadhaar Card of Applicant", "mandatory": True},
                    {"type": "INCOME_EVIDENCE", "name": "Talati / Revenue Officer Income Recommendation", "mandatory": True}
                ],
                "fee": 20.00,
                "processing_days": 10,
                "workflow_id": "STANDARD",
                "integration_type": "MOCK_REV",
                "form_schema": [
                    {"key": "applicant_name", "label": "Applicant Full Name", "label_mr": "अर्जदाराचे पूर्ण नाव", "label_hi": "आवेदक का पूरा नाम", "type": "TEXT", "required": True},
                    {"key": "aadhaar_number", "label": "Aadhaar Number", "label_mr": "आधार क्रमांक", "label_hi": "आधार संख्या", "type": "TEXT", "required": True},
                    {"key": "annual_income", "label": "Annual Family Income (INR)", "label_mr": "वार्षिक कौटुंबिक उत्पन्न (रुपये)", "label_hi": "वार्षिक पारिवारिक आय (रुपये)", "type": "NUMBER", "required": True},
                    {"key": "gujarat_district", "label": "District in Gujarat", "label_mr": "गुजरात जिल्हा", "label_hi": "गुजरात का जिला", "type": "DROPDOWN", "required": True, "options": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Gandhinagar"]},
                    {"key": "taluka", "label": "Taluka", "label_mr": "तालुका", "label_hi": "तालुका", "type": "TEXT", "required": True}
                ]
            },
            # 11. GJ: AnyRoR Land Mutation
            {
                "code": "GJ_LAND_MUTATION",
                "state_code": "GJ",
                "name": "AnyRoR Revenue Land Record Mutation",
                "name_mr": "एनी-आरओआर जमीन फेरफार नोंद",
                "name_hi": "एनी-आरओआर भूमि नामांतरण (दाखिल खारिज)",
                "department_id": dept_map["GJ_REV"].id,
                "category_id": cat_map["LAND"].id,
                "description": "Mutation of agricultural or non-agricultural land title under Gujarat AnyRoR land record system upon registered sale deed or inheritance.",
                "description_hi": "गुजरात एनी-आरओआर भू-अभिलेख प्रणाली के तहत बैनामा या वरासत के आधार पर कृषि अथवा गैर-कृषि भूमि का नामांतरण।",
                "eligibility": "Registered deed holders or legal heirs of agricultural land located within Gujarat.",
                "documents_required": [
                    {"type": "SALE_DEED", "name": "Registered Sub-Registrar Sale Deed / Will / Gift Deed", "mandatory": True},
                    {"type": "ROR_EXTRACT", "name": "Current 7/12 & 8-A Revenue Extract", "mandatory": True}
                ],
                "fee": 100.00,
                "processing_days": 30,
                "workflow_id": "STANDARD",
                "integration_type": "MOCK_REV",
                "form_schema": [
                    {"key": "claimant_name", "label": "Claimant / Buyer Full Name", "label_mr": "खरेदीदाराचे नाव", "label_hi": "क्रेता / आवेदक का पूरा नाम", "type": "TEXT", "required": True},
                    {"key": "document_reg_no", "label": "Sub-Registrar Registered Document No.", "label_mr": "नोंदणीकृत दस्त क्रमांक", "label_hi": "पंजीकृत दस्तावेज संख्या", "type": "TEXT", "required": True},
                    {"key": "mutation_type", "label": "Mutation Nature", "label_mr": "फेरफार प्रकार", "label_hi": "नामांतरण का प्रकार", "type": "DROPDOWN", "required": True, "options": ["Registered Sale Purchase (नोंदणीकृत विक्री / बैनामा)", "Succession / Inheritance (वारसा हक्क / वरासत)", "Family Partition (कौटुंबिक वाटप / पारिवारिक बंटवारा)"]},
                    {"key": "survey_number", "label": "Survey / Khata Number", "label_mr": "सर्व्हे / खाते क्रमांक", "label_hi": "सर्वे / खाता संख्या", "type": "TEXT", "required": True}
                ]
            },
            # 12. DL: Food Security Ration Card
            {
                "code": "DL_RATION_CARD",
                "state_code": "DL",
                "name": "e-District National Food Security Ration Card",
                "name_mr": "ई-डिस्ट्रिक्ट राष्ट्रीय अन्न सुरक्षा रेशन कार्ड",
                "name_hi": "ई-डिस्ट्रिक्ट राष्ट्रीय खाद्य सुरक्षा राशन कार्ड (दिल्ली)",
                "department_id": dept_map["DL_FCS"].id,
                "category_id": cat_map["WELFARE"].id,
                "description": "New issuance of priority household (NFSA) ration entitlement card under Delhi e-District governance.",
                "description_hi": "दिल्ली ई-डिस्ट्रिक्ट पोर्टल के माध्यम से पात्र प्राथमिकता वाले परिवारों हेतु नया राष्ट्रीय खाद्य सुरक्षा (राशन) कार्ड जारी करना।",
                "eligibility": "Permanent residents of NCT of Delhi meeting family income threshold for NFSA priority categorization.",
                "documents_required": [
                    {"type": "FAMILY_AADHAAR", "name": "Aadhaar Cards of All Family Members", "mandatory": True},
                    {"type": "RESIDENCE_DELHI", "name": "Electricity Bill / Water Bill of Delhi Residence", "mandatory": True},
                    {"type": "INCOME_AFFIDAVIT", "name": "Annual Household Income Declaration Affidavit", "mandatory": True}
                ],
                "fee": 0.00,
                "processing_days": 25,
                "workflow_id": "STANDARD",
                "integration_type": "MOCK_REV",
                "form_schema": [
                    {"key": "head_of_family", "label": "Female Head of Family (as per NFSA)", "label_mr": "कुटुंबप्रमुख महिला नाव", "label_hi": "परिवार की महिला मुखिया का नाम", "type": "TEXT", "required": True},
                    {"key": "aadhaar_number", "label": "Aadhaar Number of Head", "label_mr": "आधार क्रमांक", "label_hi": "आधार संख्या", "type": "TEXT", "required": True},
                    {"key": "family_member_count", "label": "Total Number of Family Members", "label_mr": "एकूण कुटुंब सदस्य संख्या", "label_hi": "परिवार के कुल सदस्यों की संख्या", "type": "NUMBER", "required": True, "placeholder": "e.g. 4"},
                    {"key": "annual_household_income", "label": "Total Annual Household Income (INR)", "label_mr": "वार्षिक कौटुंबिक उत्पन्न", "label_hi": "परिवार की कुल वार्षिक आय", "type": "NUMBER", "required": True, "placeholder": "Max 100000 for BPL"},
                    {"key": "delhi_district", "label": "Revenue District of Delhi", "label_mr": "दिल्ली जिल्हा", "label_hi": "दिल्ली राजस्व जिला", "type": "DROPDOWN", "required": True, "options": ["Central Delhi", "New Delhi", "North Delhi", "South Delhi", "East Delhi", "West Delhi", "Dwarka (South West)"]},
                    {"key": "residential_address", "label": "Delhi Residential Address", "label_mr": "निवासी पत्ता", "label_hi": "दिल्ली का आवासीय पता", "type": "TEXTAREA", "required": True}
                ]
            },
            # 13. DL: Driving License NOC
            {
                "code": "DL_DRIVING_NOC",
                "state_code": "DL",
                "name": "Transport Department Driving License NOC",
                "name_mr": "परिवहन विभाग वाहन चालक परवाना एनओसी",
                "name_hi": "परिवहन विभाग ड्राइविंग लाइसेंस अनापत्ति प्रमाण पत्र (NOC)",
                "department_id": dept_map["DL_REV"].id,
                "category_id": cat_map["CERT"].id,
                "description": "No Objection Certificate (NOC) for inter-state transfer or verification of driving licenses in Delhi NCT.",
                "description_hi": "ड्राइविंग लाइसेंस को अन्य राज्य में स्थानांतरित या सत्यापित कराने हेतु दिल्ली परिवहन विभाग द्वारा जारी अनापत्ति प्रमाण पत्र।",
                "eligibility": "Valid Delhi driving license holder relocating to another state or union territory.",
                "documents_required": [
                    {"type": "DL_COPY", "name": "Original Delhi Driving License Smart Card Copy", "mandatory": True},
                    {"type": "ID_PROOF", "name": "Aadhaar Card / Passport Copy", "mandatory": True}
                ],
                "fee": 100.00,
                "processing_days": 7,
                "workflow_id": "STANDARD",
                "integration_type": "MOCK_REV",
                "form_schema": [
                    {"key": "license_holder_name", "label": "License Holder Full Name", "label_mr": "चालक परवाना धारकाचे नाव", "label_hi": "लाइसेंस धारक का पूरा नाम", "type": "TEXT", "required": True},
                    {"key": "dl_number", "label": "Existing Driving License Number", "label_mr": "वाहन चालक परवाना क्रमांक", "label_hi": "ड्राइविंग लाइसेंस संख्या", "type": "TEXT", "required": True, "placeholder": "DL-XXXXXXXXXXXXX"},
                    {"key": "current_rto", "label": "Issuing Delhi RTO / MLO Authority", "label_mr": "दिल्ली प्रादेशिक परिवहन कार्यालय (RTO)", "label_hi": "जारीकर्ता दिल्ली आरटीओ कार्यालय", "type": "DROPDOWN", "required": True, "options": ["MLO Mall Road", "MLO Janakpuri", "MLO Sarai Kale Khan", "MLO Vasant Vihar", "MLO Mayur Vihar"]},
                    {"key": "target_state", "label": "Destination Transfer State", "label_mr": "हस्तांतरित राज्य", "label_hi": "स्थानांतरण हेतु गंतव्य राज्य", "type": "DROPDOWN", "required": True, "options": ["Maharashtra (MH)", "Karnataka (KA)", "Gujarat (GJ)", "Uttar Pradesh (UP)", "Haryana (HR)"]},
                    {"key": "reason_for_noc", "label": "Reason for Inter-State Transfer", "label_mr": "हस्तांतरणाचे कारण", "label_hi": "स्थानांतरण का कारण", "type": "TEXT", "required": True, "placeholder": "e.g. Relocation due to employment"}
                ]
            },
            # 14. UP: Senior Citizen Certificate
            {
                "code": "UP_SENIOR_CITIZEN",
                "state_code": "UP",
                "name": "eSathi Senior Citizen Identity Certificate",
                "name_mr": "ई-साथी ज्येष्ठ नागरिक ओळख प्रमाणपत्र",
                "name_hi": "ई-साथी वरिष्ठ नागरिक पहचान प्रमाण पत्र (उत्तर प्रदेश)",
                "department_id": dept_map["UP_REV"].id,
                "category_id": cat_map["WELFARE"].id,
                "description": "Official identification issued to senior citizens aged 60+ in Uttar Pradesh for travel discounts, healthcare priority, and pensions.",
                "description_hi": "उत्तर प्रदेश ई-साथी पोर्टल के माध्यम से ६० वर्ष या अधिक आयु के वरिष्ठ नागरिकों हेतु रियायत और प्राथमिक स्वास्थ्य सेवाओं के लिए पहचान पत्र।",
                "eligibility": "Resident citizen of Uttar Pradesh who has attained sixty (60) years of age.",
                "documents_required": [
                    {"type": "AGE_PROOF", "name": "Birth Certificate / High School Certificate / Voter ID / Passport", "mandatory": True},
                    {"type": "RESIDENCE_PROOF", "name": "Aadhaar Card / Domicile Certificate of UP", "mandatory": True},
                    {"type": "PASSPORT_PHOTO", "name": "Recent Passport Size Color Photograph", "mandatory": True}
                ],
                "fee": 20.00,
                "processing_days": 10,
                "workflow_id": "STANDARD",
                "integration_type": "MOCK_REV",
                "form_schema": [
                    {"key": "applicant_name", "label": "Senior Citizen Full Name", "label_mr": "ज्येष्ठ नागरिकाचे नाव", "label_hi": "वरिष्ठ नागरिक का पूरा नाम", "type": "TEXT", "required": True},
                    {"key": "dob", "label": "Date of Birth", "label_mr": "जन्मतारीख", "label_hi": "जन्म तिथि", "type": "DATE", "required": True},
                    {"key": "age", "label": "Completed Age in Years", "label_mr": "पूर्ण वय (वर्षे)", "label_hi": "पूर्ण आयु (वर्षों में)", "type": "NUMBER", "required": True, "placeholder": "60 or above"},
                    {"key": "blood_group", "label": "Blood Group", "label_mr": "रक्तगट", "label_hi": "रक्त समूह", "type": "DROPDOWN", "required": False, "options": ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]},
                    {"key": "up_district", "label": "District in Uttar Pradesh", "label_mr": "उत्तर प्रदेश जिल्हा", "label_hi": "उत्तर प्रदेश का जिला", "type": "DROPDOWN", "required": True, "options": ["Lucknow", "Varanasi", "Kanpur Nagar", "Agra", "Prayagraj", "Noida (Gautam Buddha Nagar)", "Ghaziabad"]},
                    {"key": "emergency_contact", "label": "Emergency Contact Person & Phone", "label_mr": "आपत्कालीन संपर्क व्यक्ती व फोन", "label_hi": "आपातकालीन संपर्क व्यक्ति एवं फोन", "type": "TEXT", "required": True, "placeholder": "Name - 10-digit mobile number"},
                    {"key": "permanent_address", "label": "Permanent Residence Address", "label_mr": "कायमचा पत्ता", "label_hi": "स्थायी निवास का पता", "type": "TEXTAREA", "required": True}
                ]
            }
        ]

        service_map = {}
        for s in services_data:
            schema = s.pop("form_schema")
            srv = db.query(Service).filter(Service.code == s["code"]).first()
            if not srv:
                srv = Service(**s)
                db.add(srv)
                db.commit()
                db.refresh(srv)
            else:
                srv.state_code = s["state_code"]
                srv.name_hi = s["name_hi"]
                srv.description_hi = s.get("description_hi")
                db.commit()
            service_map[s["code"]] = srv

            form = db.query(ServiceForm).filter(ServiceForm.service_id == srv.id).first()
            if not form:
                form = ServiceForm(service_id=srv.id, form_schema=schema)
                db.add(form)
                db.commit()
            else:
                form.form_schema = schema
                db.commit()

        print(f"[OK] {len(service_map)} Services & Multilingual Dynamic Form Schemas seeded.")

        # 5. Seed Demonstration Users
        users_data = [
            {
                "email": "citizen@mahaseva.gov.in",
                "phone": "9820011223",
                "full_name": "Aditya Patil (Demo Citizen)",
                "password_hash": get_password_hash("Citizen@2026"),
                "role": RoleEnum.CITIZEN,
                "department_id": None
            },
            {
                "email": "officer.revenue@mahaseva.gov.in",
                "phone": "9820044556",
                "full_name": "Rajesh Deshmukh (Tahsildar Desk Officer)",
                "password_hash": get_password_hash("Officer@2026"),
                "role": RoleEnum.OFFICER,
                "department_id": dept_map["REV"].id
            },
            {
                "email": "officer.municipal@mahaseva.gov.in",
                "phone": "9820077889",
                "full_name": "Sneha Kulkarni (ULB Municipal Officer)",
                "password_hash": get_password_hash("Officer@2026"),
                "role": RoleEnum.OFFICER,
                "department_id": dept_map["UDD"].id
            },
            {
                "email": "admin@mahaseva.gov.in",
                "phone": "9820099001",
                "full_name": "State Governance Super Administrator",
                "password_hash": get_password_hash("Admin@2026"),
                "role": RoleEnum.SUPER_ADMIN,
                "department_id": None
            }
        ]

        user_map = {}
        for u in users_data:
            usr = db.query(User).filter(User.email == u["email"]).first()
            if not usr:
                usr = User(**u)
                db.add(usr)
                db.commit()
                db.refresh(usr)
            else:
                usr.password_hash = u["password_hash"]
                usr.role = u["role"]
                usr.department_id = u["department_id"]
                db.commit()
            user_map[u["email"]] = usr
        print("[OK] Demo User Accounts seeded.")

        # 6. Seed Realistic Demonstration Applications Across Multiple States
        citizen = user_map["citizen@mahaseva.gov.in"]
        revenue_officer = user_map["officer.revenue@mahaseva.gov.in"]

        sample_apps = [
            {
                "application_number": "MH-REV-2026-00101",
                "citizen_id": citizen.id,
                "service_id": service_map["REV_INCOME_CERT"].id,
                "department_id": dept_map["REV"].id,
                "status": "UNDER_REVIEW",
                "form_data": {
                    "applicant_name": "Aditya Patil",
                    "aadhaar_number": "987654321012",
                    "annual_income": 95000,
                    "income_source": "Agriculture (शेती / कृषि)",
                    "certificate_purpose": "Education & Scholarship (शिक्षण व शिष्यवृत्ती / छात्रवृत्ति)",
                    "district": "Pune",
                    "taluka": "Haveli",
                    "village_ward": "Kothrud"
                },
                "tracking_data": {
                    "assigned_desk": "Tahsildar Desk 2",
                    "sla_deadline_days": 15
                },
                "remarks": "Application accepted into revenue verification queue.",
                "events": [
                    {"old_status": None, "new_status": "SUBMITTED", "remarks": "Application submitted online by citizen.", "actor_id": citizen.id, "actor_name": citizen.full_name, "actor_role": RoleEnum.CITIZEN},
                    {"old_status": "SUBMITTED", "new_status": "UNDER_REVIEW", "remarks": "Assigned to Tahsildar Desk Officer for primary review.", "actor_id": revenue_officer.id, "actor_name": revenue_officer.full_name, "actor_role": RoleEnum.OFFICER}
                ]
            },
            {
                "application_number": "MH-UDD-2026-00204",
                "citizen_id": citizen.id,
                "service_id": service_map["UDD_BIRTH_CERT"].id,
                "department_id": dept_map["UDD"].id,
                "status": "DOCUMENT_VERIFICATION",
                "form_data": {
                    "child_name": "Aarav Patil",
                    "dob": "2026-02-14",
                    "gender": "Male (मुलगा / पुरुष)",
                    "father_name": "Aditya Patil",
                    "mother_name": "Pooja Patil",
                    "hospital_name": "Sassoon General Hospital",
                    "municipal_body": "Pune Municipal Corporation (PMC)"
                },
                "tracking_data": {
                    "assigned_desk": "Birth & Death Registrar Ward 4",
                    "sla_deadline_days": 7
                },
                "remarks": "Hospital notification matching in progress.",
                "events": [
                    {"old_status": None, "new_status": "SUBMITTED", "remarks": "Application registered through Maha-Seva gateway.", "actor_id": citizen.id, "actor_name": citizen.full_name, "actor_role": RoleEnum.CITIZEN},
                    {"old_status": "SUBMITTED", "new_status": "DOCUMENT_VERIFICATION", "remarks": "Cross-checking hospital discharge verification report.", "actor_id": user_map["officer.municipal@mahaseva.gov.in"].id, "actor_name": user_map["officer.municipal@mahaseva.gov.in"].full_name, "actor_role": RoleEnum.OFFICER}
                ]
            },
            {
                "application_number": "KA-UDD-2026-00302",
                "citizen_id": citizen.id,
                "service_id": service_map["KA_ELEC_CONN"].id,
                "department_id": dept_map["KA_UDD"].id,
                "status": "SUBMITTED",
                "form_data": {
                    "consumer_name": "Aditya Patil",
                    "property_pid": "089-W0123-45",
                    "sanctioned_load_kw": 3,
                    "bangalore_subdivision": "Whitefield Sub-Division",
                    "property_address": "Flat 402, Green Meadows, Whitefield, Bengaluru - 560066"
                },
                "tracking_data": {
                    "assigned_desk": "BESCOM Whitefield Sub-Division Line Inspector",
                    "sla_deadline_days": 10
                },
                "remarks": "BESCOM LT meter connection request registered successfully.",
                "events": [
                    {"old_status": None, "new_status": "SUBMITTED", "remarks": "Application submitted online via Maha-Seva gateway.", "actor_id": citizen.id, "actor_name": citizen.full_name, "actor_role": RoleEnum.CITIZEN}
                ]
            },
            {
                "application_number": "DL-FCS-2026-00405",
                "citizen_id": citizen.id,
                "service_id": service_map["DL_RATION_CARD"].id,
                "department_id": dept_map["DL_FCS"].id,
                "status": "PROCESSING",
                "form_data": {
                    "head_of_family": "Sunita Patil",
                    "aadhaar_number": "890123456789",
                    "family_member_count": 4,
                    "annual_household_income": 72000,
                    "delhi_district": "South Delhi",
                    "residential_address": "House No 12, Malviya Nagar, New Delhi - 110017"
                },
                "tracking_data": {
                    "assigned_desk": "Food & Civil Supplies Circle 42",
                    "sla_deadline_days": 25
                },
                "remarks": "Food security eligibility audit ongoing.",
                "events": [
                    {"old_status": None, "new_status": "SUBMITTED", "remarks": "Application received for Delhi e-District NFSA Ration Card.", "actor_id": citizen.id, "actor_name": citizen.full_name, "actor_role": RoleEnum.CITIZEN},
                    {"old_status": "SUBMITTED", "new_status": "PROCESSING", "remarks": "Transferred to Circle Food Inspector for field verification.", "actor_id": user_map["officer.revenue@mahaseva.gov.in"].id, "actor_name": "Circle Inspector", "actor_role": RoleEnum.OFFICER}
                ]
            }
        ]

        for sa in sample_apps:
            events = sa.pop("events")
            app = db.query(Application).filter(Application.application_number == sa["application_number"]).first()
            if not app:
                app = Application(**sa)
                db.add(app)
                db.commit()
                db.refresh(app)
                for ev in events:
                    db.add(ApplicationEvent(application_id=app.id, **ev))
                db.commit()

        # Seed initial notification for demo citizen
        notif = db.query(Notification).filter(Notification.user_id == citizen.id).first()
        if not notif:
            db.add(Notification(
                user_id=citizen.id,
                title="Multi-State Platform Enabled",
                message="Welcome to Maha-Seva Integrator. You can now access public services across Maharashtra, Karnataka, Gujarat, Delhi, and Uttar Pradesh in English, Marathi, and Hindi.",
                notification_type="SYSTEM_ANNOUNCEMENT",
                is_read=False
            ))
            db.commit()

        print("[OK] Multi-State Applications & Notifications seeded.")
        print("==================================================")
        print("[SUCCESS] All multi-state demonstration data populated successfully!")
        print("==================================================")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Seeding failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()

if __name__ == '__main__':
    seed()
