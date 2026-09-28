import sys
from app.core.database import SessionLocal
from app.models import User, Application, ApplicationEvent, Service, Department
from app.core.security import get_password_hash, RoleEnum

db = SessionLocal()

# List of rich, authentic citizens across Indian states
CITIZENS_DATA = [
    # Maharashtra (MH)
    {"email": "rahul.deshmukh@mahaseva.gov.in", "full_name": "Rahul Deshmukh", "state_code": "MH", "phone": "9820010001"},
    {"email": "priya.patil@mahaseva.gov.in", "full_name": "Priya Patil", "state_code": "MH", "phone": "9820010002"},
    {"email": "aditya.kulkarni@mahaseva.gov.in", "full_name": "Aditya Kulkarni", "state_code": "MH", "phone": "9820010003"},
    {"email": "sunita.jadhav@mahaseva.gov.in", "full_name": "Sunita Jadhav", "state_code": "MH", "phone": "9820010004"},
    {"email": "kavita.rane@mahaseva.gov.in", "full_name": "Kavita Rane", "state_code": "MH", "phone": "9820010005"},
    {"email": "sachin.tendulkar@mahaseva.gov.in", "full_name": "Sachin Tendulkar", "state_code": "MH", "phone": "9820010006"},
    {"email": "rajesh.shinde@mahaseva.gov.in", "full_name": "Rajesh Shinde", "state_code": "MH", "phone": "9820010007"},
    {"email": "dipali.more@mahaseva.gov.in", "full_name": "Dipali More", "state_code": "MH", "phone": "9820010008"},
    {"email": "sandeep.gaikwad@mahaseva.gov.in", "full_name": "Sandeep Gaikwad", "state_code": "MH", "phone": "9820010009"},
    {"email": "nilesh.pawar@mahaseva.gov.in", "full_name": "Nilesh Pawar", "state_code": "MH", "phone": "9820010010"},
    {"email": "pooja.bhosale@mahaseva.gov.in", "full_name": "Pooja Bhosale", "state_code": "MH", "phone": "9820010011"},
    {"email": "ganesh.kale@mahaseva.gov.in", "full_name": "Ganesh Kale", "state_code": "MH", "phone": "9820010012"},
    {"email": "anita.joshi@mahaseva.gov.in", "full_name": "Anita Joshi", "state_code": "MH", "phone": "9820010013"},
    {"email": "pramod.wagh@mahaseva.gov.in", "full_name": "Pramod Wagh", "state_code": "MH", "phone": "9820010014"},
    {"email": "manisha.salunke@mahaseva.gov.in", "full_name": "Manisha Salunke", "state_code": "MH", "phone": "9820010015"},
    {"email": "vinod.kamble@mahaseva.gov.in", "full_name": "Vinod Kamble", "state_code": "MH", "phone": "9820010016"},
    {"email": "meera.chavan@mahaseva.gov.in", "full_name": "Meera Chavan", "state_code": "MH", "phone": "9820010017"},
    {"email": "amol.dhumal@mahaseva.gov.in", "full_name": "Amol Dhumal", "state_code": "MH", "phone": "9820010018"},
    {"email": "sneha.bagal@mahaseva.gov.in", "full_name": "Sneha Bagal", "state_code": "MH", "phone": "9820010019"},
    {"email": "aarav.sharma@mahaseva.gov.in", "full_name": "Aarav Sharma", "state_code": "MH", "phone": "9820010020"},
    
    # Karnataka (KA)
    {"email": "k.venkatesh@mahaseva.gov.in", "full_name": "K. Venkatesh", "state_code": "KA", "phone": "9830010001"},
    {"email": "lakshmi.rao@mahaseva.gov.in", "full_name": "Lakshmi Rao", "state_code": "KA", "phone": "9830010002"},
    {"email": "basavaraj.gowda@mahaseva.gov.in", "full_name": "Basavaraj Gowda", "state_code": "KA", "phone": "9830010003"},
    {"email": "deepa.hegde@mahaseva.gov.in", "full_name": "Deepa Hegde", "state_code": "KA", "phone": "9830010004"},
    {"email": "praveen.kumar.ka@mahaseva.gov.in", "full_name": "Praveen Kumar", "state_code": "KA", "phone": "9830010005"},

    # Delhi (DL)
    {"email": "gurpreet.singh@mahaseva.gov.in", "full_name": "Gurpreet Singh", "state_code": "DL", "phone": "9840010001"},
    {"email": "neha.sharma@mahaseva.gov.in", "full_name": "Neha Sharma", "state_code": "DL", "phone": "9840010002"},
    {"email": "rajesh.khanna@mahaseva.gov.in", "full_name": "Rajesh Khanna", "state_code": "DL", "phone": "9840010003"},
    {"email": "manpreet.kaur@mahaseva.gov.in", "full_name": "Manpreet Kaur", "state_code": "DL", "phone": "9840010004"},

    # Uttar Pradesh (UP)
    {"email": "amit.kumar@mahaseva.gov.in", "full_name": "Amit Kumar", "state_code": "UP", "phone": "9850010001"},
    {"email": "pooja.verma@mahaseva.gov.in", "full_name": "Pooja Verma", "state_code": "UP", "phone": "9850010002"},
    {"email": "akhilesh.yadav@mahaseva.gov.in", "full_name": "Akhilesh Yadav", "state_code": "UP", "phone": "9850010003"},
    {"email": "shreya.shukla@mahaseva.gov.in", "full_name": "Shreya Shukla", "state_code": "UP", "phone": "9850010004"},

    # Central Government & CBSE (CENTRAL)
    {"email": "ananya.chatterjee@mahaseva.gov.in", "full_name": "Ananya Chatterjee", "state_code": "CENTRAL", "phone": "9860010001"},
    {"email": "vikram.joshi@mahaseva.gov.in", "full_name": "Vikram Joshi", "state_code": "CENTRAL", "phone": "9860010002"},
    {"email": "rohan.mehra@mahaseva.gov.in", "full_name": "Rohan Mehra", "state_code": "CENTRAL", "phone": "9860010003"},
    {"email": "sneha.sen@mahaseva.gov.in", "full_name": "Sneha Sen", "state_code": "CENTRAL", "phone": "9860010004"},
    {"email": "arjun.kapoor@mahaseva.gov.in", "full_name": "Arjun Kapoor", "state_code": "CENTRAL", "phone": "9860010005"},
    {"email": "tanvi.sharma@mahaseva.gov.in", "full_name": "Tanvi Sharma", "state_code": "CENTRAL", "phone": "9860010006"},

    # Other States
    {"email": "suresh.meena@mahaseva.gov.in", "full_name": "Suresh Meena", "state_code": "RJ", "phone": "9870010001"},
    {"email": "mohammed.altaf@mahaseva.gov.in", "full_name": "Mohammed Altaf", "state_code": "JK", "phone": "9880010001"},
    {"email": "meenakshi.sundaram@mahaseva.gov.in", "full_name": "Meenakshi Sundaram", "state_code": "TN", "phone": "9890010001"}
]

# Ensure users exist
citizens_by_state = {}
for c in CITIZENS_DATA:
    existing = db.query(User).filter(User.email == c["email"]).first()
    if not existing:
        user = User(
            email=c["email"],
            full_name=c["full_name"],
            phone=c["phone"],
            password_hash=get_password_hash("Citizen@2026"),
            role=RoleEnum.CITIZEN,
            state_code=c["state_code"],
            is_active=True
        )
        db.add(user)
        db.flush()
        u_id = user.id
    else:
        existing.full_name = c["full_name"]
        existing.state_code = c["state_code"]
        u_id = existing.id
    
    st = c["state_code"]
    if st not in citizens_by_state:
        citizens_by_state[st] = []
    citizens_by_state[st].append(u_id)

db.commit()
print("All diverse citizens verified and indexed by state.")

# Now redistribute all existing applications across the diverse citizens
all_apps = db.query(Application).order_by(Application.id).all()
print(f"Total applications to diversify: {len(all_apps)}")

state_indices = {st: 0 for st in citizens_by_state}

for app in all_apps:
    # Determine jurisdiction from application number
    prefix = app.application_number.split("-")[0].upper()
    if prefix not in citizens_by_state:
        prefix = "MH"
    
    pool = citizens_by_state[prefix]
    idx = state_indices[prefix] % len(pool)
    assigned_citizen_id = pool[idx]
    state_indices[prefix] += 1
    
    app.citizen_id = assigned_citizen_id
    
    # Update event actor names for SUBMITTED events
    for ev in app.events:
        if ev.new_status == "SUBMITTED":
            cit = db.query(User).filter(User.id == assigned_citizen_id).first()
            if cit:
                ev.actor_id = cit.id
                ev.actor_name = cit.full_name

db.commit()
print("Successfully diversified all applications across distinct individual citizens!")

# Verify results
check = db.query(Application.application_number, User.full_name).join(User, Application.citizen_id == User.id).limit(15).all()
for app_no, name in check:
    print(f"  {app_no} -> {name}")

db.close()

