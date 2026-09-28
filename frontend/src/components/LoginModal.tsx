import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import {
  X,
  Lock,
  Mail,
  Building2,
  AlertCircle,
  Eye,
  EyeOff,
  Zap,
  ArrowRight,
  ShieldCheck,
  User,
  Shield,
  Briefcase
} from "lucide-react";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  notice?: string;
  onNavigateRegister?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  notice,
  onNavigateRegister,
}) => {
  const { t, i18n } = useTranslation();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showQuickLogins, setShowQuickLogins] = useState(true);
  const [quickLoginRole, setQuickLoginRole] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setPassword("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    setErrorMsg(null);
    setLoading(true);

    try {
      await login(username.trim(), password);
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.detail || "Invalid credentials. Please verify your email and password."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (email: string, pass: string, roleKey: string) => {
    setUsername(email);
    setPassword(pass);
    setErrorMsg(null);
    setQuickLoginRole(roleKey);
    setLoading(true);

    try {
      await login(email.trim(), pass);
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || "Quick login failed. Please try again.");
    } finally {
      setLoading(false);
      setQuickLoginRole(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-modal="true"
      role="dialog"
    >
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 transform transition-all animate-in fade-in zoom-in-95 duration-150">
        {/* Header Ribbon with Government Styling */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 px-6 pt-6 pb-5 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-extrabold shadow-md shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                  Government Portal Authentication
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-white/10 text-slate-200">
                  Secure
                </span>
              </div>
              <h2 className="text-lg font-black tracking-tight text-white mt-0.5">
                {i18n.language === "mr"
                  ? "पोर्टल लॉगिन"
                  : i18n.language === "hi"
                  ? "पोर्टल लॉगिन"
                  : "Portal Sign In"}
              </h2>
            </div>
          </div>

          {/* Contextual Notice Banner */}
          {notice && (
            <div className="mt-3.5 p-2.5 rounded-xl bg-amber-100/10 border border-amber-300/30 text-amber-200 text-xs flex items-start space-x-2">
              <ShieldCheck className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
              <span className="font-medium leading-snug">{notice}</span>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 bg-white">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span className="font-medium">{errorMsg}</span>
            </div>
          )}

          {/* Standard Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Official Email / Username
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs text-slate-900 bg-slate-50/50 focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs text-slate-900 bg-slate-50/50 focus:bg-white transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 active:scale-[0.99] text-white text-xs font-bold shadow-md transition flex items-center justify-center space-x-1.5 disabled:opacity-50 cursor-pointer"
            >
              {loading && !quickLoginRole ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>
                    {i18n.language === "mr"
                      ? "लॉगिन करा"
                      : i18n.language === "hi"
                      ? "लॉगिन करें"
                      : "Sign In"}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick 1-Click Demo Evaluation Logins */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center">
                <Zap className="w-3 h-3 text-amber-500 mr-1" />
                ⚡ 1-Click Demo Logins
              </span>
              <button
                type="button"
                onClick={() => setShowQuickLogins(!showQuickLogins)}
                className="text-[10px] text-blue-600 hover:underline font-semibold cursor-pointer"
              >
                {showQuickLogins ? "Hide" : "Show"}
              </button>
            </div>

            {showQuickLogins && (
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() =>
                    handleQuickLogin(
                      "rahul.deshmukh@mahaseva.gov.in",
                      "Citizen@2026",
                      "citizen"
                    )
                  }
                  className="p-2 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-left transition text-[11px] cursor-pointer"
                >
                  <div className="flex items-center space-x-1 text-blue-900 font-bold">
                    <User className="w-3 h-3 text-blue-600" />
                    <span>Citizen</span>
                  </div>
                  <span className="text-[9px] text-slate-500 block truncate">Rahul Deshmukh</span>
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() =>
                    handleQuickLogin(
                      "officer.revenue@mahaseva.gov.in",
                      "Officer@2026",
                      "officer"
                    )
                  }
                  className="p-2 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-left transition text-[11px] cursor-pointer"
                >
                  <div className="flex items-center space-x-1 text-indigo-900 font-bold">
                    <Briefcase className="w-3 h-3 text-indigo-600" />
                    <span>Officer</span>
                  </div>
                  <span className="text-[9px] text-slate-500 block truncate">Revenue Desk</span>
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() =>
                    handleQuickLogin(
                      "admin.maha@gov.in",
                      "Admin@2026",
                      "admin"
                    )
                  }
                  className="p-2 rounded-xl border border-purple-200 bg-purple-50/70 hover:bg-purple-100 text-left transition text-[11px] cursor-pointer"
                >
                  <div className="flex items-center space-x-1 text-purple-900 font-bold">
                    <Shield className="w-3 h-3 text-purple-600" />
                    <span>Admin</span>
                  </div>
                  <span className="text-[9px] text-slate-500 block truncate">State Console</span>
                </button>
              </div>
            )}
          </div>

          {/* Footer Register Prompt */}
          {onNavigateRegister && (
            <div className="pt-2 text-center text-xs text-slate-600">
              <span>New citizen to Maha-Seva? </span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateRegister();
                }}
                className="text-blue-700 font-bold hover:underline cursor-pointer"
              >
                Register Account →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
