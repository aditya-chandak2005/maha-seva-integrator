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
  KeyRound
} from "lucide-react";
import { ALL_INDIA_STATES_AND_UTS, CENTRAL_OPTION } from "../constants/states";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
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
      ? "Super Administrator" 
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
              Your official <strong className="text-slate-900">{roleLabel}</strong> account ({stateCode}) has been created for <span className="font-mono text-blue-700">{email}</span>.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Full Name:</span>
              <span className="font-bold text-slate-800">{fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Registered Email:</span>
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
          Create a verified profile to apply for public services, manage department SLA queues, or govern state administration.
        </p>
      </div>

      {/* Role Selector Tabs */}
      <div className="bg-slate-200/80 p-1.5 rounded-2xl grid grid-cols-3 gap-1 shadow-inner">
        <button
          type="button"
          onClick={() => {
            setRole("CITIZEN");
            setErrorMsg(null);
          }}
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
          onClick={() => {
            setRole("OFFICER");
            setErrorMsg(null);
          }}
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
          onClick={() => {
            setRole("SUPER_ADMIN");
            setErrorMsg(null);
          }}
          className={`py-2.5 px-2 rounded-xl text-xs font-bold transition flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
            role === "SUPER_ADMIN"
              ? "bg-white text-purple-800 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
          <span>Super Admin</span>
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
              <span className="text-[11px] text-indigo-700">Access Officer Workbench, review citizen applications, verify attached documents, and enforce service SLAs.</span>
            </div>
          </>
        )}
        {role === "SUPER_ADMIN" && (
          <>
            <ShieldCheck className="w-5 h-5 text-purple-600 shrink-0" />
            <div>
              <span className="font-bold block">Super Administrator (मुख्य प्रशासक)</span>
              <span className="text-[11px] text-purple-700">Oversee state-wide or national governance telemetry, department workloads, SLA analytics, and security audit logs.</span>
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
              onChange={(e) => setFullName(e.target.value)}
              placeholder={role === "CITIZEN" ? "e.g. Rameshwar Patil" : "e.g. Dr. Rajesh Kadam"}
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 block">
            {role === "CITIZEN" ? "Email Address" : "Official / Government Email Address"}
          </label>
          <div className="relative flex items-center">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={role === "CITIZEN" ? "citizen@example.com" : "officer@mahaseva.gov.in"}
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Phone */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 block">
            Mobile Number (For OTP & SMS Alerts)
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

        {/* Jurisdiction / State Selector */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 block">
            {role === "SUPER_ADMIN" 
              ? "Administrative Jurisdiction Scope" 
              : role === "OFFICER" 
              ? "Department State Jurisdiction" 
              : "State / UT of Residence"}
          </label>
          <select
            value={stateCode}
            onChange={(e) => setStateCode(e.target.value)}
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
              onChange={(e) => setDepartmentId(e.target.value ? Number(e.target.value) : "")}
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
              Default authorized passcode for hackathon evaluation: <code className="font-mono text-purple-700 font-bold">ADMIN2026</code>
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
              ? "Registering Account..." 
              : `Register as ${role === "CITIZEN" ? "Citizen" : role === "OFFICER" ? "Department Officer" : "Super Admin"}`}
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
