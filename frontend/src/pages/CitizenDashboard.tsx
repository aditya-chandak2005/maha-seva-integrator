import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { ApplicationDetail, NotificationItem } from "../types";
import { StatusBadge } from "../components/StatusBadge";
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  PlusCircle, 
  Search, 
  Bell, 
  ArrowRight,
  Sparkles,
  ExternalLink
} from "lucide-react";

interface CitizenDashboardProps {
  onNavigate: (tab: string, param?: any) => void;
  onOpenAssistant: () => void;
}

export const CitizenDashboard: React.FC<CitizenDashboardProps> = ({
  onNavigate,
  onOpenAssistant,
}) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [appRes, notifRes] = await Promise.all([
        api.get("/applications/my"),
        api.get("/notifications")
      ]);
      setApplications(appRes.data || []);
      setNotifications(notifRes.data || []);
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
      <div className="bg-gradient-to-r from-blue-800 to-indigo-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-blue-200 uppercase tracking-wider">
            Citizen Dashboard | नागरिक डॅशबोर्ड
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
            Welcome, {user?.full_name}
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 mt-1">
            Manage your government applications, track progress in real-time, and view verified digital certificates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate("services")}
            className="inline-flex items-center px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-blue-900 text-xs font-bold shadow-md transition"
          >
            <PlusCircle className="w-4 h-4 mr-1.5 text-blue-700" />
            <span>Apply for Service</span>
          </button>
          <button
            onClick={onOpenAssistant}
            className="inline-flex items-center px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md transition"
          >
            <Sparkles className="w-4 h-4 mr-1.5" />
            <span>AI Assistant</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-semibold block uppercase">Total Applications</span>
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
            className="text-xs font-semibold text-blue-700 hover:underline flex items-center"
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
              className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-sm transition"
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
                        className="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white text-xs font-semibold transition"
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
