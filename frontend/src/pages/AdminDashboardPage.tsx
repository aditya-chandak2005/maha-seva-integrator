import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { AdminAnalytics, AuditLogItem } from "../types";
import { 
  ShieldAlert, 
  BarChart3, 
  Building, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Users, 
  Activity,
  Calendar
} from "lucide-react";

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, logsRes] = await Promise.all([
        api.get("/admin/analytics/overview"),
        api.get("/admin/audit-logs?limit=25")
      ]);
      setAnalytics(analyticsRes.data);
      setAuditLogs(logsRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-purple-300 text-xs font-bold uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4" />
            <span>State Platform Governance Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
            Super Administrator Telemetry
          </h1>
          <p className="text-xs sm:text-sm text-purple-200 mt-1">
            Cross-departmental performance monitoring, SLA compliance, and immutable security audit stream.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-500 text-sm">
          Aggregating state public service metrics...
        </div>
      ) : analytics ? (
        <>
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Applications</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{analytics.total_applications}</div>
              <span className="text-[11px] text-blue-600 font-medium">Across all departments</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Pending Workload</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-600">{analytics.pending_review}</div>
              <span className="text-[11px] text-amber-700 font-medium">Within statutory SLA</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Approved Certificates</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">{analytics.approved}</div>
              <span className="text-[11px] text-emerald-700 font-medium">Dispatched to citizens</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Active Services</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600">{analytics.total_services}</div>
              <span className="text-[11px] text-indigo-700 font-medium">{analytics.total_departments} Departments</span>
            </div>
          </div>

          {/* Department Workload Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Departmental Processing Throughput
              </h2>
              <p className="text-xs text-slate-500">
                Workload distribution and clearance velocity across participating Maharashtra state departments.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-4">Total Submissions</th>
                    <th className="py-3 px-4">Pending</th>
                    <th className="py-3 px-4">Approved</th>
                    <th className="py-3 px-4">Rejected</th>
                    <th className="py-3 px-4 text-right">Clearance Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {analytics.department_workload.map((dw, idx) => {
                    const rate = dw.total_applications > 0
                      ? Math.round(((dw.approved + dw.rejected) / dw.total_applications) * 100)
                      : 100;
                    return (
                      <tr key={idx} className="hover:bg-slate-50/60 transition">
                        <td className="py-3 px-4 font-bold text-slate-900">{dw.department_name}</td>
                        <td className="py-3 px-4 font-mono font-semibold text-indigo-600">{dw.department_code}</td>
                        <td className="py-3 px-4 font-bold">{dw.total_applications}</td>
                        <td className="py-3 px-4 text-amber-600 font-bold">{dw.pending}</td>
                        <td className="py-3 px-4 text-emerald-600 font-bold">{dw.approved}</td>
                        <td className="py-3 px-4 text-rose-600 font-bold">{dw.rejected}</td>
                        <td className="py-3 px-4 text-right font-bold text-slate-700">{rate}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Immutable Audit Log Stream */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center">
                  <Activity className="w-4 h-4 mr-2 text-purple-600" />
                  <span>Immutable Security & Operations Audit Trail</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Real-time tamper-evident log of status decisions, document actions, and administrative operations.
                </p>
              </div>
              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-full uppercase">
                Regulatory Compliant
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Log ID</th>
                    <th className="py-2.5 px-3">Action</th>
                    <th className="py-2.5 px-3">Target Entity</th>
                    <th className="py-2.5 px-3">Actor / Role</th>
                    <th className="py-2.5 px-3 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-2.5 px-3 text-slate-400">#{log.id}</td>
                      <td className="py-2.5 px-3 font-bold text-purple-700">{log.action}</td>
                      <td className="py-2.5 px-3 text-slate-700">{log.entity_type} ({log.entity_id})</td>
                      <td className="py-2.5 px-3 text-slate-800">
                        {log.actor_name || "System"} <span className="text-slate-400">[{log.actor_role}]</span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-500">
                        {new Date(log.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};
