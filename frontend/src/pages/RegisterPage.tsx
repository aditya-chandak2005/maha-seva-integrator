import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import api from "../services/api";
import { 
  Building2, 
  User, 
  Mail, 
  Phone, 
  Lock, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck, 
  Briefcase, 
  KeyRound,
  Sparkles,
  Check,
  Info
} from "lucide-react";
import { ALL_INDIA_STATES_AND_UTS, CENTRAL_OPTION } from "../constants/states";

const PRE_CONFIGURED_ACCOUNTS: Record<string, { role: string; name: string; passwordHint: string }> = {
  "admin@mahaseva.gov.in": { role: "National Chief Administrator", name: "National Admin", passwordHint: "Admin@2026" },
  "admin.mh@mahaseva.gov.in": { role: "Maharashtra State Admin", name: "Rajesh Kadam", passwordHint: "Admin@2026" },
  "admin.ka@mahaseva.gov.in": { role: "Karnataka State Admin", name: "Suresh Gowda", passwordHint: "Admin@2026" },
  "admin.dl@mahaseva.gov.in": { role: "Delhi NCT State Admin", name: "Meenakshi Verma", passwordHint: "Admin@2026" },
  "admin.up@mahaseva.gov.in": { role: "UP State Admin", name: "Akhilesh Tiwari", passwordHint: "Admin@2026" },
  "admin.central@mahaseva.gov.in": { role: "Central Government Admin", name: "Dr. Arvind Saxena", passwordHint: "Admin@2026" },
  "officer.revenue@mahaseva.gov.in": { role: "Revenue Department Officer", name: "Suresh Deshmukh", passwordHint: "Officer@2026" },
  "officer.municipal@mahaseva.gov.in": { role: "Municipal Administration Officer", name: "Sunita Patil", passwordHint: "Officer@2026" },
  "officer.bescom@mahaseva.gov.in": { role: "BESCOM Engineer", name: "R. Chandrasekhar", passwordHint: "Officer@2026" },
  "officer.delhi@mahaseva.gov.in": { role: "Delhi Civil Supplies Officer", name: "Harish Mehra", passwordHint: "Officer@2026" },
  "officer.cbse@mahaseva.gov.in": { role: "CBSE Regional Officer", name: "Rameshwar Prasad", passwordHint: "Officer@2026" },
  "citizen@mahaseva.gov.in": { role: "Citizen Account", name: "Aarav Sharma", passwordHint: "Citizen@2026" },
};

interface RegisterPageProps {
  onSuccess: () => void;
  onNavigateLogin: (prefillEmail?: string, notice?: string) => void;
}

type RoleType = "CITIZEN" | "OFFICER" | "SUPER_ADMIN";

interface DeptItem {
  id: number;
  name: string;
  code: string;
  state_code: string;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onSuccess,
  onNavigateLogin,
}) => {
  const { t, i18n } = useTranslation();
  const [role, setRole] = useState<RoleType>("CITIZEN");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [stateCode, setStateCode] = useState("MH");
  const [departmentId, setDepartmentId] = useState<number | "">("");
  const [designation, setDesignation] = useState("");
  const [adminPasscode, setAdminPasscode] = useState("");

  const [departments, setDepartments] = useState<DeptItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [registeredSuccess, setRegisteredSuccess] = useState(false);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await api.get("/departments");
      setDepartments(res.data || []);
      if (res.data && res.data.length > 0) {
        setDepartmentId(res.data[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch departments:", err);
    }
  };

  // Filter departments for selected state or central
  const availableDepts = departments.filter((d) => 
    stateCode === "ALL" ? true : d.state_code === stateCode
  );

  const selectedDept = departments.find((d) => d.id === Number(departmentId));
  const cleanDeptTag = selectedDept
    ? selectedDept.code.toLowerCase().replace(/^(goi_|mh_|ka_|dl_|up_|gj_|ap_|tn_)/, "")
    : "dept";

  // Compute suggested email formats based on role and user name
  const getSuggestedEmail = (customName?: string) => {
    const targetName = customName !== undefined ? customName : fullName;
    const rawName = targetName.toLowerCase().trim().replace(/[^a-z0-9]/g, ".");
    
    if (role === "SUPER_ADMIN") {
      const stateInitials = stateCode.toLowerCase();
      // If full name is entered, use personalized official format
      if (rawName) {
        return `${rawName}.${stateInitials}@mahaseva.gov.in`;
      }
      // If empty, suggest a unique pattern to avoid colliding with pre-seeded accounts
      return `admin.${stateInitials}.new@mahaseva.gov.in`;
    }
    if (role === "OFFICER") {
      if (rawName) {
        return `${rawName}.${cleanDeptTag}@mahaseva.gov.in`;
      }
      return `officer.${cleanDeptTag}.new@mahaseva.gov.in`;
    }
    return email || (rawName ? `${rawName}@gmail.com` : "");
  };

  const handleFullNameChange = (val: string) => {
    setFullName(val);
    const rawName = val.toLowerCase().trim().replace(/[^a-z0-9]/g, ".");
    
    // Auto-update email if empty or if it was auto-generated
    const isAutoOrPre = 
      !email || 
      email.startsWith("admin.") || 
      email.startsWith("officer.") || 
      Object.keys(PRE_CONFIGURED_ACCOUNTS).includes(email.toLowerCase().trim());

    if (isAutoOrPre && rawName && role !== "CITIZEN") {
      if (role === "SUPER_ADMIN") {
        const stateInitials = stateCode.toLowerCase();
        setEmail(`${rawName}.${stateInitials}@mahaseva.gov.in`);
      } else if (role === "OFFICER") {
        setEmail(`${rawName}.${cleanDeptTag}@mahaseva.gov.in`);
      }
    }
  };

  // Check email validity per role
  const isEmailFormatValid = () => {
    if (!email) return false;
    const lower = email.toLowerCase();
    if (role === "SUPER_ADMIN") {
      return stateCode === "ALL" || lower.includes(stateCode.toLowerCase());
    }
    if (role === "OFFICER") {
      return (
        lower.includes("officer") ||
        lower.includes(cleanDeptTag) ||
        lower.includes("dept") ||
        lower.includes("revenue") ||
        lower.includes("cbse") ||
        lower.includes("municipal") ||
        lower.includes("bescom")
      );
    }
    return lower.includes("@") && lower.includes(".");
  };

  const applySuggestedEmail = () => {
    const suggested = getSuggestedEmail();
    if (suggested) {
      setEmail(suggested);
      setErrorMsg(null);
    }
  };

  // When role or state changes, auto-suggest official email format if empty or default
  const handleRoleChange = (newRole: RoleType) => {
    setRole(newRole);
    setErrorMsg(null);
    const rawName = fullName.toLowerCase().trim().replace(/[^a-z0-9]/g, ".");
    if (newRole === "SUPER_ADMIN") {
      const stateInitials = stateCode.toLowerCase();
      setEmail(rawName ? `${rawName}.${stateInitials}@mahaseva.gov.in` : "");
    } else if (newRole === "OFFICER") {
      setEmail(rawName ? `${rawName}.${cleanDeptTag}@mahaseva.gov.in` : "");
    } else {
      if (email.endsWith("@mahaseva.gov.in")) {
        setEmail(rawName ? `${rawName}@gmail.com` : "");
      }
    }
  };

  const handleStateChange = (newState: string) => {
    setStateCode(newState);
    if (role === "SUPER_ADMIN") {
      const rawName = fullName.toLowerCase().trim().replace(/[^a-z0-9]/g, ".");
      if (rawName) {
        setEmail(`${rawName}.${newState.toLowerCase()}@mahaseva.gov.in`);
      }
    }
  };

  const handleDeptChange = (newDeptId: number) => {
    setDepartmentId(newDeptId);
    const dept = departments.find((d) => d.id === newDeptId);
    if (dept && role === "OFFICER") {
      const tag = dept.code.toLowerCase().replace(/^(goi_|mh_|ka_|dl_|up_|gj_|ap_|tn_)/, "");
      const rawName = fullName.toLowerCase().trim().replace(/[^a-z0-9]/g, ".");
      if (rawName) {
        setEmail(`${rawName}.${tag}@mahaseva.gov.in`);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Client-side format checks
    if (role === "SUPER_ADMIN" && stateCode !== "ALL" && !email.toLowerCase().includes(stateCode.toLowerCase())) {
      setErrorMsg(`State Administrator email must contain state initials '${stateCode.toLowerCase()}' (e.g. admin.${stateCode.toLowerCase()}@mahaseva.gov.in or <name>.${stateCode.toLowerCase()}@mahaseva.gov.in).`);
      return;
    }

    if (role === "OFFICER" && !isEmailFormatValid()) {
      setErrorMsg(`Departmental login email must include department identifier '${cleanDeptTag}' or 'officer' (e.g. officer.${cleanDeptTag}@mahaseva.gov.in or <name>.${cleanDeptTag}@mahaseva.gov.in).`);
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/register", {
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
        role,
        state_code: stateCode,
        department_id: role === "OFFICER" && departmentId ? Number(departmentId) : null,
      });

      setRegisteredSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || "Registration failed. Please check your information.");
    } finally {
      setLoading(false);
    }
  };

  if (registeredSuccess) {
    const roleLabel = role === "SUPER_ADMIN" 
      ? "State Administrator" 
      : role === "OFFICER" 
      ? "Department Administrator / Officer" 
      : "Citizen";

    return (
      <div className="max-w-md mx-auto px-4 py-16 space-y-6 animate-fadeIn">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Registration Successful!
            </h2>
            <p className="text-xs text-slate-600">
              Your official <strong className="text-slate-900">{roleLabel}</strong> account ({stateCode}) has been created with mandatory format login ID:
            </p>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl font-mono text-sm font-bold text-blue-800 break-all">
              {email}
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Full Name:</span>
              <span className="font-bold text-slate-800">{fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Official Login ID:</span>
              <span className="font-bold font-mono text-slate-800">{email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Role Assigned:</span>
              <span className="font-bold text-purple-700">{roleLabel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Jurisdiction:</span>
              <span className="font-bold text-slate-800">{stateCode}</span>
            </div>
          </div>

          <button
            onClick={() => onNavigateLogin(email, `Registration successful as ${roleLabel}! Please sign in with your password.`)}
            className="w-full py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm rounded-xl transition shadow-md flex items-center justify-center space-x-2"
          >
            <span>Proceed to Sign In</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-blue-700 text-white flex items-center justify-center mx-auto shadow-md">
          <Building2 className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Government Unified Registration
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Create a verified dynamic profile to apply for public services, manage department SLA queues, or govern state administration.
        </p>
      </div>

      {/* Role Selector Tabs */}
      <div className="bg-slate-200/80 p-1.5 rounded-2xl grid grid-cols-3 gap-1 shadow-inner">
        <button
          type="button"
          onClick={() => handleRoleChange("CITIZEN")}
          className={`py-2.5 px-2 rounded-xl text-xs font-bold transition flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
            role === "CITIZEN"
              ? "bg-white text-blue-800 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <User className="w-4 h-4 text-blue-600 shrink-0" />
          <span>Citizen</span>
        </button>

        <button
          type="button"
          onClick={() => handleRoleChange("OFFICER")}
          className={`py-2.5 px-2 rounded-xl text-xs font-bold transition flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
            role === "OFFICER"
              ? "bg-white text-indigo-800 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Briefcase className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>Dept. Admin</span>
        </button>

        <button
          type="button"
          onClick={() => handleRoleChange("SUPER_ADMIN")}
          className={`py-2.5 px-2 rounded-xl text-xs font-bold transition flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
            role === "SUPER_ADMIN"
              ? "bg-white text-purple-800 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
          <span>State Admin</span>
        </button>
      </div>

      {/* Role Description Banner */}
      <div className={`p-3.5 rounded-2xl border text-xs flex items-center space-x-3 ${
        role === "CITIZEN"
          ? "bg-blue-50/80 border-blue-200 text-blue-900"
          : role === "OFFICER"
          ? "bg-indigo-50/80 border-indigo-200 text-indigo-900"
          : "bg-purple-50/80 border-purple-200 text-purple-900"
      }`}>
        {role === "CITIZEN" && (
          <>
            <User className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <span className="font-bold block">Citizen Profile (नागरिक)</span>
              <span className="text-[11px] text-blue-700">Apply for state & central public certificates, scholarships, utility permits, and track real-time status.</span>
            </div>
          </>
        )}
        {role === "OFFICER" && (
          <>
            <Briefcase className="w-5 h-5 text-indigo-600 shrink-0" />
            <div>
              <span className="font-bold block">Department Officer / Admin (विभागीय अधिकारी)</span>
              <span className="text-[11px] text-indigo-700">Mandatory departmental format login (e.g. <code>officer.{cleanDeptTag}@mahaseva.gov.in</code>) to inspect department applications and SLAs.</span>
            </div>
          </>
        )}
        {role === "SUPER_ADMIN" && (
          <>
            <ShieldCheck className="w-5 h-5 text-purple-600 shrink-0" />
            <div>
              <span className="font-bold block">State Administrator (राज्य मुख्य प्रशासक)</span>
              <span className="text-[11px] text-purple-700">Mandatory state initials login (e.g. <code>admin.{stateCode.toLowerCase()}@mahaseva.gov.in</code>) to govern state telemetry and workloads.</span>
            </div>
          </>
        )}
      </div>

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Full Name */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 block">
            {role === "CITIZEN" ? "Full Name (As per Aadhaar / Official ID)" : "Officer / Administrator Full Name"}
          </label>
          <div className="relative flex items-center">
            <User className="w-4 h-4 text-slate-400 absolute left-3.5" />
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => handleFullNameChange(e.target.value)}
              placeholder={role === "CITIZEN" ? "e.g. Rameshwar Patil" : role === "OFFICER" ? "e.g. Suresh Deshmukh" : "e.g. Dr. Rajesh Kadam"}
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Jurisdiction / State Selector */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 block">
            {role === "SUPER_ADMIN" 
              ? "State Administrator Jurisdiction Scope" 
              : role === "OFFICER" 
              ? "Department State Jurisdiction" 
              : "State / UT of Residence"}
          </label>
          <select
            value={stateCode}
            onChange={(e) => handleStateChange(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-slate-800 font-medium"
          >
            {role === "SUPER_ADMIN" && (
              <option value="ALL">🇮🇳 All India (Chief National Administrator)</option>
            )}
            <option value={CENTRAL_OPTION.code}>{CENTRAL_OPTION.name}</option>
            <optgroup label="States (28)">
              {ALL_INDIA_STATES_AND_UTS.filter(s => s.type === "STATE").map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name} ({s.code})
                </option>
              ))}
            </optgroup>
            <optgroup label="Union Territories (8)">
              {ALL_INDIA_STATES_AND_UTS.filter(s => s.type === "UT").map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name} ({s.code})
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Department Selection for Officers */}
        {role === "OFFICER" && (
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">
              Assigned Government Department
            </label>
            <select
              required
              value={departmentId}
              onChange={(e) => handleDeptChange(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-slate-800"
            >
              {availableDepts.length > 0 ? (
                availableDepts.map((d) => (
                  <option key={d.id} value={d.id}>
                    [{d.state_code}] {d.name} ({d.code})
                  </option>
                ))
              ) : (
                departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    [{d.state_code}] {d.name} ({d.code})
                  </option>
                ))
              )}
            </select>
          </div>
        )}

        {/* Email Address with Mandatory Format Helper */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 block">
              {role === "CITIZEN" 
                ? "Citizen Email Address" 
                : role === "OFFICER" 
                ? "Departmental Format Login Email (Mandatory)" 
                : "State Administrator Email (Mandatory State Initials)"}
            </label>
            {(role === "OFFICER" || role === "SUPER_ADMIN") && (
              <button
                type="button"
                onClick={applySuggestedEmail}
                className="text-[10px] text-blue-700 hover:text-blue-800 font-bold flex items-center space-x-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>Auto-Generate Format</span>
              </button>
            )}
          </div>

          <div className="relative flex items-center">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={
                role === "CITIZEN" 
                  ? "citizen@example.com" 
                  : role === "OFFICER" 
                  ? `officer.${cleanDeptTag}@mahaseva.gov.in` 
                  : `admin.${stateCode.toLowerCase()}@mahaseva.gov.in`
              }
              className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm focus:outline-none ${
                role !== "CITIZEN" && isEmailFormatValid()
                  ? "border-emerald-400 bg-emerald-50/20 focus:ring-2 focus:ring-emerald-500 font-mono text-emerald-900"
                  : "border-slate-300 focus:ring-2 focus:ring-blue-500"
              }`}
            />
          </div>

          {/* Real-time Format Feedback */}
          {role === "OFFICER" && (
            <div className="flex items-center justify-between text-[11px] px-1">
              <span className="text-slate-500">
                Departmental tag required: <code className="font-bold text-indigo-700">{cleanDeptTag}</code> or <code className="font-bold text-indigo-700">officer</code>
              </span>
              {isEmailFormatValid() ? (
                <span className="text-emerald-700 font-bold flex items-center space-x-1">
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span>Valid Format</span>
                </span>
              ) : (
                <span className="text-amber-600 font-medium">Include .{cleanDeptTag}@...</span>
              )}
            </div>
          )}

          {role === "SUPER_ADMIN" && (
            <div className="flex items-center justify-between text-[11px] px-1">
              <span className="text-slate-500">
                Mandatory state initials: <code className="font-bold text-purple-700">.{stateCode.toLowerCase()}@</code>
              </span>
              {isEmailFormatValid() ? (
                <span className="text-emerald-700 font-bold flex items-center space-x-1">
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span>Valid State Initials</span>
                </span>
              ) : (
                <span className="text-amber-600 font-medium">Include .{stateCode.toLowerCase()}@...</span>
              )}
            </div>
          )}

          {/* Pre-configured Account Warning Banner */}
          {PRE_CONFIGURED_ACCOUNTS[email.toLowerCase().trim()] && (
            <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl text-amber-900 text-xs flex items-start space-x-2.5 animate-fadeIn mt-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <div>
                  <strong>Pre-Configured Official Account:</strong> The email <code className="font-mono font-bold bg-amber-100 text-amber-950 px-1 py-0.5 rounded">{email}</code> is already registered in the system for <em>{PRE_CONFIGURED_ACCOUNTS[email.toLowerCase().trim()].name}</em>.
                </div>
                <div>
                  👉 <button
                    type="button"
                    onClick={() => onNavigateLogin && onNavigateLogin(email)}
                    className="text-blue-700 underline font-bold hover:text-blue-900 cursor-pointer"
                  >
                    Click here to Sign In directly (Default Password: {PRE_CONFIGURED_ACCOUNTS[email.toLowerCase().trim()].passwordHint})
                  </button>
                </div>
                <div className="text-[11px] text-amber-800 leading-relaxed">
                  To register a <strong>new</strong> account, please use your own name in the email (e.g. <code>{fullName ? fullName.toLowerCase().trim().replace(/[^a-z0-9]/g, '.') : 'yourname'}.{stateCode.toLowerCase()}@mahaseva.gov.in</code>).
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Number */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 block">
            Mobile Number (For Alerts)
          </label>
          <div className="relative flex items-center">
            <Phone className="w-4 h-4 text-slate-400 absolute left-3.5" />
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="10-digit Mobile Number"
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Designation for Officers */}
        {role === "OFFICER" && (
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">
              Official Designation / Desk Role
            </label>
            <input
              type="text"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              placeholder="e.g. Tahsildar / Verification Desk Officer"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        )}

        {/* Super Admin Passcode */}
        {role === "SUPER_ADMIN" && (
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">
              Admin Authorization Code
            </label>
            <div className="relative flex items-center">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5" />
              <input
                type="password"
                value={adminPasscode}
                onChange={(e) => setAdminPasscode(e.target.value)}
                placeholder="Admin verification passcode (Default: ADMIN2026)"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
            <span className="text-[10px] text-slate-400 block">
              Default authorized passcode: <code className="font-mono text-purple-700 font-bold">ADMIN2026</code>
            </span>
          </div>
        )}

        {/* Password */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 block">
            Create Secure Password
          </label>
          <div className="relative flex items-center">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 text-white font-bold text-sm rounded-xl transition shadow-md flex items-center justify-center space-x-1.5 disabled:opacity-50 ${
            role === "CITIZEN"
              ? "bg-blue-700 hover:bg-blue-800"
              : role === "OFFICER"
              ? "bg-indigo-700 hover:bg-indigo-800"
              : "bg-purple-700 hover:bg-purple-800"
          }`}
        >
          <span>
            {loading 
              ? "Creating Dynamic Account..." 
              : `Register as ${role === "CITIZEN" ? "Citizen" : role === "OFFICER" ? "Department Officer" : "State Administrator"}`}
          </span>
          <ArrowRight className="w-4 h-4" />
        </button>

        {/* Bottom Link to Sign In */}
        <div className="pt-2 text-center text-xs text-slate-500">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => onNavigateLogin()}
            className="text-blue-700 font-bold hover:underline"
          >
            Sign in to Portal
          </button>
        </div>
      </form>
    </div>
  );
};
