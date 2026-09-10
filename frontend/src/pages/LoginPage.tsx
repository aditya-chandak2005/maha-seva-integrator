import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { 
  Building2, 
  Lock, 
  Mail, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  KeyRound, 
  ChevronDown, 
  ChevronUp,
  Shield,
  Briefcase,
  UserCheck
} from "lucide-react";

interface LoginPageProps {
  onSuccess: () => void;
  onNavigateRegister: () => void;
  initialEmail?: string;
  registrationNotice?: string;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onSuccess,
  onNavigateRegister,
  initialEmail = "",
  registrationNotice = "",
}) => {
  const { login } = useAuth();
  const [username, setUsername] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(registrationNotice || null);
  const [showDemoHelp, setShowDemoHelp] = useState(false);

  useEffect(() => {
    if (initialEmail) {
      setUsername(initialEmail);
    }
    if (registrationNotice) {
      setSuccessNotice(registrationNotice);
    }
  }, [initialEmail, registrationNotice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessNotice(null);
    setLoading(true);

    try {
      await login(username.trim(), password);
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || "Invalid credentials. Please verify your email and password.");
    } finally {
      setLoading(false);
    }
  };

  const handleFillCredentials = (email: string, pass: string) => {
    setUsername(email);
    setPassword(pass);
    setErrorMsg(null);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-blue-700 text-white flex items-center justify-center mx-auto shadow-md">
          <Building2 className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Government Gateway Login
        </h1>
        <p className="text-xs text-slate-500">
          Sign in to access your citizen dashboard, officer workbench, or state administrative console.
        </p>
      </div>

      {/* Registration Success Banner */}
      {successNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2.5 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Main Login Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 block">
            Email or Registered Mobile Number
          </label>
          <div className="relative flex items-center">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5" />
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. citizen@mahaseva.gov.in"
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 block">
            Secure Password
          </label>
          <div className="relative flex items-center">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition shadow-md flex items-center justify-center space-x-1.5"
        >
          <span>{loading ? "Authenticating..." : "Sign In to Portal"}</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <div className="pt-2 text-center text-xs text-slate-500">
          Don't have an account?{" "}
          <button
            type="button"
            onClick={onNavigateRegister}
            className="text-blue-700 font-bold hover:underline"
          >
            Register as Citizen, Officer, or Super Admin
          </button>
        </div>
      </form>

      {/* Collapsible Demo Credentials Reference Guide */}
      <div className="border border-slate-200 rounded-2xl bg-slate-50/80 overflow-hidden text-xs">
        <button
          type="button"
          onClick={() => setShowDemoHelp(!showDemoHelp)}
          className="w-full p-3.5 flex items-center justify-between text-slate-600 hover:text-slate-900 transition font-medium"
        >
          <span className="flex items-center space-x-2">
            <KeyRound className="w-4 h-4 text-slate-500" />
            <span>Pre-configured Demo Credentials (Reference Guide)</span>
          </span>
          {showDemoHelp ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {showDemoHelp && (
          <div className="p-4 pt-0 border-t border-slate-200/60 space-y-3 animate-fadeIn text-[11px]">
            <p className="text-slate-500">
              For testing and hackathon evaluation, the following accounts are pre-seeded in the system:
            </p>

            {/* Super Admins */}
            <div className="space-y-1">
              <span className="font-bold text-purple-900 uppercase tracking-wider block flex items-center space-x-1">
                <Shield className="w-3 h-3 text-purple-700" />
                <span>Super Admins (Password: <code className="bg-purple-100 px-1 py-0.5 rounded font-mono text-purple-900">Admin@2026</code>)</span>
              </span>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1">
                <div className="flex justify-between items-center cursor-pointer hover:bg-purple-50/50 p-1 rounded" onClick={() => handleFillCredentials("admin@mahaseva.gov.in", "Admin@2026")}>
                  <span>🇮🇳 All India Chief Admin:</span>
                  <code className="font-mono text-blue-700 font-bold">admin@mahaseva.gov.in</code>
                </div>
                <div className="flex justify-between items-center cursor-pointer hover:bg-purple-50/50 p-1 rounded" onClick={() => handleFillCredentials("admin.mh@mahaseva.gov.in", "Admin@2026")}>
                  <span>Maharashtra Super Admin:</span>
                  <code className="font-mono text-blue-700 font-bold">admin.mh@mahaseva.gov.in</code>
                </div>
                <div className="flex justify-between items-center cursor-pointer hover:bg-purple-50/50 p-1 rounded" onClick={() => handleFillCredentials("admin.ka@mahaseva.gov.in", "Admin@2026")}>
                  <span>Karnataka Super Admin:</span>
                  <code className="font-mono text-blue-700 font-bold">admin.ka@mahaseva.gov.in</code>
                </div>
                <div className="flex justify-between items-center cursor-pointer hover:bg-purple-50/50 p-1 rounded" onClick={() => handleFillCredentials("admin.central@mahaseva.gov.in", "Admin@2026")}>
                  <span>Central Govt (CBSE/NSP):</span>
                  <code className="font-mono text-blue-700 font-bold">admin.central@mahaseva.gov.in</code>
                </div>
              </div>
            </div>

            {/* Department Admins / Officers */}
            <div className="space-y-1">
              <span className="font-bold text-indigo-900 uppercase tracking-wider block flex items-center space-x-1">
                <Briefcase className="w-3 h-3 text-indigo-700" />
                <span>Department Admins / Officers (Password: <code className="bg-indigo-100 px-1 py-0.5 rounded font-mono text-indigo-900">Officer@2026</code>)</span>
              </span>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1">
                <div className="flex justify-between items-center cursor-pointer hover:bg-indigo-50/50 p-1 rounded" onClick={() => handleFillCredentials("officer.revenue@mahaseva.gov.in", "Officer@2026")}>
                  <span>MH Revenue Officer:</span>
                  <code className="font-mono text-blue-700 font-bold">officer.revenue@mahaseva.gov.in</code>
                </div>
                <div className="flex justify-between items-center cursor-pointer hover:bg-indigo-50/50 p-1 rounded" onClick={() => handleFillCredentials("officer.cbse@mahaseva.gov.in", "Officer@2026")}>
                  <span>CBSE Exam Officer:</span>
                  <code className="font-mono text-blue-700 font-bold">officer.cbse@mahaseva.gov.in</code>
                </div>
                <div className="flex justify-between items-center cursor-pointer hover:bg-indigo-50/50 p-1 rounded" onClick={() => handleFillCredentials("officer.bescom@mahaseva.gov.in", "Officer@2026")}>
                  <span>KA BESCOM Officer:</span>
                  <code className="font-mono text-blue-700 font-bold">officer.bescom@mahaseva.gov.in</code>
                </div>
              </div>
            </div>

            {/* Citizens */}
            <div className="space-y-1">
              <span className="font-bold text-blue-900 uppercase tracking-wider block flex items-center space-x-1">
                <UserCheck className="w-3 h-3 text-blue-700" />
                <span>Citizens (Password: <code className="bg-blue-100 px-1 py-0.5 rounded font-mono text-blue-900">Citizen@2026</code>)</span>
              </span>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1">
                <div className="flex justify-between items-center cursor-pointer hover:bg-blue-50/50 p-1 rounded" onClick={() => handleFillCredentials("citizen@mahaseva.gov.in", "Citizen@2026")}>
                  <span>Demo Citizen:</span>
                  <code className="font-mono text-blue-700 font-bold">citizen@mahaseva.gov.in</code>
                </div>
                <div className="flex justify-between items-center cursor-pointer hover:bg-blue-50/50 p-1 rounded" onClick={() => handleFillCredentials("rahul.deshmukh@mahaseva.gov.in", "Citizen@2026")}>
                  <span>Rahul Deshmukh (MH):</span>
                  <code className="font-mono text-blue-700 font-bold">rahul.deshmukh@mahaseva.gov.in</code>
                </div>
                <div className="flex justify-between items-center cursor-pointer hover:bg-blue-50/50 p-1 rounded" onClick={() => handleFillCredentials("ananya.chatterjee@mahaseva.gov.in", "Citizen@2026")}>
                  <span>Ananya Chatterjee (Student):</span>
                  <code className="font-mono text-blue-700 font-bold">ananya.chatterjee@mahaseva.gov.in</code>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 italic">
              Tip: Clicking any row above automatically fills the email & password into the sign-in form.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
