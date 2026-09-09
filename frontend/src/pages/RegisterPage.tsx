import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Building2, User, Mail, Phone, Lock, ArrowRight, AlertCircle } from "lucide-react";

interface RegisterPageProps {
  onSuccess: () => void;
  onNavigateLogin: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onSuccess,
  onNavigateLogin,
}) => {
  const { register } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      await register(fullName.trim(), email.trim(), phone.trim(), password);
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || "Registration failed. Please check your information.");
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
          Citizen Portal Registration
        </h1>
        <p className="text-xs text-slate-500">
          Create a unified citizen profile to apply for Maharashtra state government services.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 block">
            Full Name (As per Aadhaar)
          </label>
          <div className="relative flex items-center">
            <User className="w-4 h-4 text-slate-400 absolute left-3.5" />
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Aditya Patil"
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 block">
            Email Address
          </label>
          <div className="relative flex items-center">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="citizen@example.com"
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 block">
            Mobile Number
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

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 block">
            Create Password
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

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition shadow-md flex items-center justify-center space-x-1.5"
        >
          <span>{loading ? "Creating Account..." : "Create Citizen Account"}</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <div className="pt-2 text-center text-xs text-slate-500">
          Already have an account?{" "}
          <button
            type="button"
            onClick={onNavigateLogin}
            className="text-blue-700 font-bold hover:underline"
          >
            Sign in
          </button>
        </div>
      </form>
    </div>
  );
};
