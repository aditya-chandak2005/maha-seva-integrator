import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  ExternalLink, 
  Search, 
  Sparkles,
  User
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ApplicationItem } from "../types";
import api from "../services/api";
import { StatusBadge } from "../components/StatusBadge";

interface CitizenDashboardProps {
  onNavigate: (tab: string, param?: any) => void;
  onOpenAssistant?: () => void;
  onOpenProfileVault?: (tab?: "profile" | "uploaded-docs") => void;
}

export const CitizenDashboard: React.FC<CitizenDashboardProps> = ({
  onNavigate,
  onOpenAssistant,
  onOpenProfileVault,
}) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const res = await api.get("/applications/my");
      setApplications(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalApps = applications.length;
  const inProgress = applications.filter((a) => a.status !== "APPROVED" && a.status !== "REJECTED").length;
  const approvedCount = applications.filter((a) => a.status === "APPROVED" || a.status === "COMPLETED").length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
            {i18n.language === "mr"
              ? "नागरिक डॅशबोर्ड"
              : i18n.language === "hi"
              ? "नागरिक डैशबोर्ड"
              : "Citizen Dashboard"}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1 text-white">
            Welcome, {user?.full_name}
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 mt-1 max-w-xl">
            Manage your applications, view verified certificates, and apply for Central & State welfare schemes with zero document re-uploading.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onNavigate("services", { mode: "documents" })}
            className="inline-flex items-center px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-blue-900 text-xs font-bold shadow-md transition cursor-pointer"
          >
            <FileText className="w-4 h-4 mr-1.5 text-blue-700" />
            <span>Apply for Document</span>
          </button>
          <button
            onClick={() => onNavigate("services", { mode: "schemes" })}
            className="inline-flex items-center px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4 mr-1.5" />
            <span>Apply for Scheme</span>
          </button>
          {onOpenProfileVault && (
            <button
              onClick={() => onOpenProfileVault("profile")}
              className="inline-flex items-center px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold shadow-sm transition border border-white/20 cursor-pointer"
            >
              <User className="w-4 h-4 mr-1.5 text-white" />
              <span>Profile</span>
            </button>
          )}
        </div>
      </div>

      {/* DigiLocker Document Vault Highlight Banner */}
      {onOpenProfileVault && (
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200/80 rounded-3xl p-5 sm:p-6 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xl shadow-xs shrink-0">
              📁
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap gap-1">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                  DigiLocker Personal Document Vault
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Zero Re-Upload Active
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  Strictly .PDF (Max 256KB)
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                Your Aadhaar, PAN, 7/12 Land Record, Income Certificate, and Bank DBT credentials are saved securely. Whenever you apply for any government scheme, they are automatically fetched without uploading files again!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onOpenProfileVault("profile")}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs hover:shadow transition whitespace-nowrap flex items-center space-x-1.5 cursor-pointer"
            >
              <User className="w-3.5 h-3.5" />
              <span>Open Profile & Documents →</span>
            </button>
          </div>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-semibold block uppercase">Total Submissions</span>
            <span className="text-2xl font-extrabold text-slate-900">{totalApps}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-semibold block uppercase">In Processing / Review</span>
            <span className="text-2xl font-extrabold text-slate-900">{inProgress}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-semibold block uppercase">Approved Certificates</span>
            <span className="text-2xl font-extrabold text-slate-900">{approvedCount}</span>
          </div>
        </div>
      </div>

      {/* Main Applications Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              My Submitted Applications
            </h2>
            <p className="text-xs text-slate-500">
              Live status and tracking history across all Maharashtra state departments.
            </p>
          </div>
          <button
            onClick={() => onNavigate("track")}
            className="text-xs font-semibold text-blue-700 hover:underline flex items-center cursor-pointer"
          >
            <Search className="w-3.5 h-3.5 mr-1" />
            <span>Search by Reference Number</span>
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-500 text-sm">
            Loading your applications...
          </div>
        ) : applications.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-700 text-sm">You have not submitted any applications yet.</p>
            <button
              onClick={() => onNavigate("services")}
              className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-sm transition cursor-pointer"
            >
              Browse Services Directory
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Application Number</th>
                  <th className="py-3 px-4">Service</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Submitted Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                      {app.application_number}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {app.service_name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {app.department_name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(app.submitted_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      })}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onNavigate("track", { number: app.application_number })}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white text-xs font-semibold transition cursor-pointer"
                      >
                        <span>View Progress</span>
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
