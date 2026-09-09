"""
Maha-Seva Integrator - Database Seeding Script
Seeds departments, categories, services, dynamic forms, demo users, and sample applications.
"""
import sys
import os

if sys.stdout.encoding != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.core.database import SessionLocal
from app.core.security import get_password_hash, RoleEnum
from app.models import (
    Role, Department, ServiceCategory, Service, ServiceForm,
    User, Application, ApplicationEvent, Notification, AuditLog
)

def seed():
    print("==================================================")
    print("Maha-Seva Integrator - Seeding Demonstration Data")
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

        # 2. Seed Departments
        dept_data = [
            {
                "code": "REV",
                "name": "Revenue and Forest Department",
                "name_mr": "महसूल व वन विभाग",
                "description": "Administers land administration, certificates, and revenue collection across Maharashtra.",
                "contact_email": "helpdesk.revenue@mahaseva.gov.in",
                "contact_phone": "022-22025151"
            },
            {
                "code": "UDD",
                "name": "Urban Development Department",
                "name_mr": "नगर विकास विभाग",
                "description": "Oversees Municipal Corporations, urban local governance, and civic utilities.",
                "contact_email": "helpdesk.urban@mahaseva.gov.in",
                "contact_phone": "022-22027200"
            },
            {
                "code": "RDD",
                "name": "Rural Development and Panchayati Raj",
                "name_mr": "ग्रामविकास व पंचायत राज विभाग",
                "description": "Drives rural empowerment, Gram Panchayat public administration, and rural welfare.",
                "contact_email": "helpdesk.rural@mahaseva.gov.in",
                "contact_phone": "022-22026111"
            },
            {
                "code": "PHD",
                "name": "Public Health Department",
                "name_mr": "सार्वजनिक आरोग्य विभाग",
                "description": "Coordinates state public healthcare delivery, medical assistance, and vital statistics.",
                "contact_email": "helpdesk.health@mahaseva.gov.in",
                "contact_phone": "022-22026850"
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
            dept_map[d["code"]] = dept
        print("[OK] Departments seeded.")

        # 3. Seed Service Categories
        cat_data = [
            {
                "code": "CERT",
                "name": "Certificates & Identification",
                "name_mr": "दाखले आणि ओळख प्रमाणपत्रे",
                "description": "Essential citizen certificates including Income, Domicile, Caste, and Birth.",
                "icon": "Award"
            },
            {
                "code": "LAND",
                "name": "Revenue & Land Records",
                "name_mr": "जमीन आणि महसूल नोंदी",
                "description": "7/12 extract verification, mutation entries, and property card services.",
                "icon": "FileText"
            },
            {
                "code": "URBAN",
                "name": "Urban Civic Utilities",
                "name_mr": "नागरी सुविधा आणि पाणी पुरवठा",
                "description": "Municipal connections, trade licenses, property tax and utility approvals.",
                "icon": "Building"
            },
            {
                "code": "WELFARE",
                "name": "Social Welfare & Pensions",
                "name_mr": "सामाजिक कल्याण आणि योजना",
                "description": "Financial assistance, pension schemes, and educational scholarships.",
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
            cat_map[c["code"]] = cat
        print("[OK] Service Categories seeded.")

        # 4. Seed Services & Dynamic Form Schemas
        services_data = [
            {
                "code": "REV_INCOME_CERT",
                "name": "Income Certificate",
                "name_mr": "उत्पन्नाचा दाखला",
                "department_id": dept_map["REV"].id,
                "category_id": cat_map["CERT"].id,
                "description": "Official certificate of annual family income issued by Tahsildar for scholarships, ration subsidies, and governmental assistance.",
                "eligibility": "Resident of Maharashtra with verified documentary proof of family income from employment, business, or agriculture.",
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
                    {"key": "applicant_name", "label": "Applicant Full Name", "label_mr": "अर्जदाराचे पूर्ण नाव", "type": "TEXT", "required": True, "placeholder": "As per Aadhaar Card"},
                    {"key": "aadhaar_number", "label": "Aadhaar Number", "label_mr": "आधार क्रमांक", "type": "TEXT", "required": True, "placeholder": "12-digit UID"},
                    {"key": "annual_income", "label": "Annual Family Income (INR)", "label_mr": "वार्षिक कौटुंबिक उत्पन्न (रुपये)", "type": "NUMBER", "required": True, "placeholder": "e.g. 120000"},
                    {"key": "income_source", "label": "Primary Income Source", "label_mr": "उत्पन्नाचे मुख्य साधन", "type": "DROPDOWN", "required": True, "options": ["Agriculture (शेती)", "Salaried Employment (नोकरी)", "Business / Trade (व्यवसाय)", "Daily Wage Labor (मजुरी)"]},
                    {"key": "certificate_purpose", "label": "Purpose of Certificate", "label_mr": "दाखल्याचे प्रयोजन", "type": "DROPDOWN", "required": True, "options": ["Education & Scholarship (शिक्षण व शिष्यवृत्ती)", "Government Subsidy / Scheme (सरकारी योजना)", "Bank Loan Application (बँक कर्ज)", "Ration Card Renewal (रेशन कार्ड)"]},
                    {"key": "district", "label": "District", "label_mr": "जिल्हा", "type": "DROPDOWN", "required": True, "options": ["Mumbai City", "Mumbai Suburban", "Pune", "Nagpur", "Nashik", "Aurangabad (Chhatrapati Sambhajinagar)", "Thane", "Solapur"]},
                    {"key": "taluka", "label": "Taluka / Tehsil", "label_mr": "तालुका", "type": "TEXT", "required": True, "placeholder": "e.g. Haveli"},
                    {"key": "village_ward", "label": "Village or Municipal Ward", "label_mr": "गाव / प्रभाग", "type": "TEXT", "required": True, "placeholder": "e.g. Kothrud"}
                ]
            },
            {
                "code": "REV_DOMICILE_CERT",
                "name": "Age, Nationality and Domicile Certificate",
                "name_mr": "वय, अधिवास आणि राष्ट्रीयत्व प्रमाणपत्र",
                "department_id": dept_map["REV"].id,
                "category_id": cat_map["CERT"].id,
                "description": "Establishes permanent domicile status in Maharashtra, required for state civil services, college admissions, and competitive quotas.",
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
                    {"key": "applicant_name", "label": "Applicant Full Name", "label_mr": "अर्जदाराचे पूर्ण नाव", "type": "TEXT", "required": True},
                    {"key": "dob", "label": "Date of Birth", "label_mr": "जन्मतारीख", "type": "DATE", "required": True},
                    {"key": "birth_place", "label": "Place of Birth", "label_mr": "जन्मस्थान", "type": "TEXT", "required": True},
                    {"key": "years_in_state", "label": "Years of Continuous Residence in Maharashtra", "label_mr": "महाराष्ट्रात वास्तव्याची वर्षे", "type": "NUMBER", "required": True, "placeholder": "Min 15 years"},
                    {"key": "domicile_purpose", "label": "Purpose of Domicile Certificate", "label_mr": "प्रमाणपत्राचे प्रयोजन", "type": "DROPDOWN", "required": True, "options": ["MPSC / Government Recruitment (शासकीय नोकरी)", "Higher & Professional Education Admissions (उच्च शिक्षण प्रवेश)", "MHADA / Housing Allotment (म्हाडा घरकुल)"]},
                    {"key": "district", "label": "District", "label_mr": "जिल्हा", "type": "DROPDOWN", "required": True, "options": ["Mumbai City", "Mumbai Suburban", "Pune", "Nagpur", "Nashik", "Aurangabad", "Thane", "Kolhapur"]}
                ]
            },
            {
                "code": "UDD_BIRTH_CERT",
                "name": "Birth Certificate Registration",
                "name_mr": "जन्म नोंदणी दाखला",
                "department_id": dept_map["UDD"].id,
                "category_id": cat_map["CERT"].id,
                "description": "Municipal issuance of certified birth records registered within urban local body jurisdiction.",
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
                    {"key": "child_name", "label": "Child Full Name", "label_mr": "बाळाचे नाव", "type": "TEXT", "required": True},
                    {"key": "dob", "label": "Date of Birth", "label_mr": "जन्मतारीख", "type": "DATE", "required": True},
                    {"key": "gender", "label": "Gender", "label_mr": "लिंग", "type": "RADIO", "required": True, "options": ["Male (मुलगा)", "Female (मुलगी)", "Other (इतर)"]},
                    {"key": "father_name", "label": "Father Full Name", "label_mr": "वडिलांचे नाव", "type": "TEXT", "required": True},
                    {"key": "mother_name", "label": "Mother Full Name", "label_mr": "आईचे नाव", "type": "TEXT", "required": True},
                    {"key": "hospital_name", "label": "Hospital or Residence Place of Birth", "label_mr": "रुग्णालय / जन्मस्थान", "type": "TEXT", "required": True},
                    {"key": "municipal_body", "label": "Municipal Corporation", "label_mr": "महानगरपालिका", "type": "DROPDOWN", "required": True, "options": ["Brihanmumbai Municipal Corporation (BMC)", "Pune Municipal Corporation (PMC)", "Nagpur Municipal Corporation (NMC)", "Thane Municipal Corporation (TMC)", "Nashik Municipal Corporation (NMC)"]}
                ]
            },
            {
                "code": "UDD_WATER_CONN",
                "name": "New Water Supply Connection",
                "name_mr": "नवीन नळ जोडणी",
                "department_id": dept_map["UDD"].id,
                "category_id": cat_map["URBAN"].id,
                "description": "Application for sanctioning fresh municipal water line connection for residential or commercial properties.",
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
                    {"key": "owner_name", "label": "Property Owner Full Name", "label_mr": "मालकाचे पूर्ण नाव", "type": "TEXT", "required": True},
                    {"key": "property_assessment_no", "label": "Property Tax Assessment Number", "label_mr": "मालमत्ता कर आकारणी क्रमांक", "type": "TEXT", "required": True},
                    {"key": "connection_type", "label": "Connection Category", "label_mr": "जोडणी प्रकार", "type": "DROPDOWN", "required": True, "options": ["Domestic Residential (घरगुती)", "Commercial (व्यावसायिक)", "Industrial (औद्योगिक)"]},
                    {"key": "pipe_size", "label": "Required Pipe Size (Inches)", "label_mr": "पाईप आकार (इंच)", "type": "DROPDOWN", "required": True, "options": ["0.50 Inch (15 mm)", "0.75 Inch (20 mm)", "1.00 Inch (25 mm)"]},
                    {"key": "property_address", "label": "Complete Property Address", "label_mr": "मालमत्तेचा पत्ता", "type": "TEXTAREA", "required": True}
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
            service_map[s["code"]] = srv

            form = db.query(ServiceForm).filter(ServiceForm.service_id == srv.id).first()
            if not form:
                form = ServiceForm(service_id=srv.id, form_schema=schema)
                db.add(form)
                db.commit()

        print("[OK] Services & Dynamic Form Schemas seeded.")

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

        # 6. Seed Realistic Demonstration Applications
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
                    "income_source": "Agriculture (शेती)",
                    "certificate_purpose": "Education & Scholarship (शिक्षण व शिष्यवृत्ती)",
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
                    "gender": "Male (मुलगा)",
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
                title="Application Under Review",
                message="Your Income Certificate application MH-REV-2026-00101 has been moved to Under Review.",
                notification_type="STATUS_UPDATE",
                is_read=False
            ))
            db.commit()

        # Seed initial audit log
        audit = db.query(AuditLog).first()
        if not audit:
            db.add(AuditLog(
                actor_id=user_map["admin@mahaseva.gov.in"].id,
                actor_name="State Governance Super Administrator",
                actor_role=RoleEnum.SUPER_ADMIN,
                action="PLATFORM_INITIALIZATION",
                entity_type="SYSTEM",
                entity_id="GLOBAL",
                ip_address="127.0.0.1",
                details={"status": "Maha-Seva platform demonstration baseline provisioned."}
            ))
            db.commit()

        print("[OK] Demonstration Applications & Notifications seeded.")
        print("==================================================")
        print("[SUCCESS] All baseline demonstration data populated!")
        print("==================================================")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Seeding failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    seed()
