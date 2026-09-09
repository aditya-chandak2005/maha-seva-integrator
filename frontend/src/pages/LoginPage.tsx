import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { Building2, Lock, Mail, ArrowRight, AlertCircle, ShieldCheck, UserCheck } from "lucide-react";

interface LoginPageProps {
  onSuccess: () => void;
  onNavigateRegister: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onSuccess,
  onNavigateRegister,
}) => {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
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

  const handleQuickLogin = async (demoUser: string, demoPass: string) => {
    setUsername(demoUser);
    setPassword(demoPass);
    setErrorMsg(null);
    setLoading(true);
    try {
      await login(demoUser, demoPass);
      onSuccess();
    } catch (err: any) {
      setErrorMsg("Demo login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 space-y-6">
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

      {/* Demo Credentials Box with State Super Admin Selector */}
      <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-4 text-xs space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-amber-900 font-bold">
            <UserCheck className="w-4 h-4 text-amber-600" />
            <span>Demonstration Accounts (1-Click Login):</span>
          </div>
          <span className="text-[10px] text-amber-700 bg-amber-200/60 px-2 py-0.5 rounded-full font-medium">
            Pre-configured
          </span>
        </div>

        {/* State-Specific Super Admin Selector */}
        <div className="bg-white p-3 rounded-xl border border-amber-200/80 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-purple-900">
            <span className="flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
              <span>Select State Super Admin to Login:</span>
            </span>
            <span className="text-[10px] text-purple-600 font-normal">State-scoped telemetry</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => handleQuickLogin("admin.mh@mahaseva.gov.in", "Admin@2026")}
              className="p-2 bg-purple-50 hover:bg-purple-100/80 border border-purple-200 rounded-lg text-left transition text-slate-800"
              title="Maharashtra State Super Admin"
            >
              <span className="block text-[9px] text-purple-700 font-bold uppercase">Maharashtra</span>
              <span className="font-semibold text-xs truncate block">Rajesh Kadam</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin("admin.ka@mahaseva.gov.in", "Admin@2026")}
              className="p-2 bg-purple-50 hover:bg-purple-100/80 border border-purple-200 rounded-lg text-left transition text-slate-800"
              title="Karnataka State Super Admin"
            >
              <span className="block text-[9px] text-purple-700 font-bold uppercase">Karnataka</span>
              <span className="font-semibold text-xs truncate block">Suresh Gowda</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin("admin.dl@mahaseva.gov.in", "Admin@2026")}
              className="p-2 bg-purple-50 hover:bg-purple-100/80 border border-purple-200 rounded-lg text-left transition text-slate-800"
              title="Delhi NCT Super Admin"
            >
              <span className="block text-[9px] text-purple-700 font-bold uppercase">Delhi NCT</span>
              <span className="font-semibold text-xs truncate block">Meenakshi V.</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin("admin.up@mahaseva.gov.in", "Admin@2026")}
              className="p-2 bg-purple-50 hover:bg-purple-100/80 border border-purple-200 rounded-lg text-left transition text-slate-800"
              title="Uttar Pradesh Super Admin"
            >
              <span className="block text-[9px] text-purple-700 font-bold uppercase">Uttar Pradesh</span>
              <span className="font-semibold text-xs truncate block">Akhilesh Tiwari</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin("admin.central@mahaseva.gov.in", "Admin@2026")}
              className="p-2 bg-blue-50 hover:bg-blue-100/80 border border-blue-200 rounded-lg text-left transition text-slate-800"
              title="Central Government Super Admin (CBSE / NSP)"
            >
              <span className="block text-[9px] text-blue-700 font-bold uppercase">Central (CBSE/NSP)</span>
              <span className="font-semibold text-xs truncate block">Dr. A. Saxena</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin("admin@mahaseva.gov.in", "Admin@2026")}
              className="p-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-left transition text-slate-800"
              title="National Chief Super Admin (All India)"
            >
              <span className="block text-[9px] text-slate-700 font-bold uppercase">🇮🇳 All India</span>
              <span className="font-semibold text-xs truncate block">Chief Admin</span>
            </button>
          </div>
        </div>

        {/* Citizens & Officers Quick Login */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider block">Citizens:</span>
            <button
              type="button"
              onClick={() => handleQuickLogin("rahul.deshmukh@mahaseva.gov.in", "Citizen@2026")}
              className="w-full p-2 bg-white hover:bg-blue-50 border border-slate-200 rounded-xl text-left transition font-semibold text-slate-800 block"
            >
              <span className="block text-[9px] text-blue-700 font-bold uppercase">Maharashtra Citizen</span>
              <span className="text-xs">Rahul Deshmukh</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin("ananya.chatterjee@mahaseva.gov.in", "Citizen@2026")}
              className="w-full p-2 bg-white hover:bg-blue-50 border border-slate-200 rounded-xl text-left transition font-semibold text-slate-800 block"
            >
              <span className="block text-[9px] text-blue-700 font-bold uppercase">CBSE / Student</span>
              <span className="text-xs">Ananya Chatterjee</span>
            </button>
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider block">Department Officers:</span>
            <button
              type="button"
              onClick={() => handleQuickLogin("officer.revenue@mahaseva.gov.in", "Officer@2026")}
              className="w-full p-2 bg-white hover:bg-indigo-50 border border-slate-200 rounded-xl text-left transition font-semibold text-slate-800 block"
            >
              <span className="block text-[9px] text-indigo-700 font-bold uppercase">MH Revenue Officer</span>
              <span className="text-xs">Suresh Deshmukh</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin("officer.cbse@mahaseva.gov.in", "Officer@2026")}
              className="w-full p-2 bg-white hover:bg-indigo-50 border border-slate-200 rounded-xl text-left transition font-semibold text-slate-800 block"
            >
              <span className="block text-[9px] text-indigo-700 font-bold uppercase">CBSE Examination</span>
              <span className="text-xs">Rameshwar Prasad</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Login Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
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
          Don't have a citizen account?{" "}
          <button
            type="button"
            onClick={onNavigateRegister}
            className="text-blue-700 font-bold hover:underline"
          >
            Register as a new Citizen
          </button>
        </div>
      </form>
    </div>
  );
};
