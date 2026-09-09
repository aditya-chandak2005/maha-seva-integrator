import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { ApplicationListItem, ApplicationDetail, AttachedDocument } from "../types";
import { StatusBadge } from "../components/StatusBadge";
import { Timeline } from "../components/Timeline";
import { 
  Building, 
  Search, 
  Filter, 
  FileCheck, 
  Clock, 
  CheckCircle, 
  XCircle, 
  X, 
  ExternalLink,
  AlertCircle,
  FileText,
  User,
  Phone,
  Mail,
  Send
} from "lucide-react";

export const OfficerWorkbenchPage: React.FC = () => {
  const { user } = useAuth();
  const [queue, setQueue] = useState<ApplicationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  // Inspection Modal State
  const [selectedAppId, setSelectedAppId] = useState<number | null>(null);
  const [selectedApp, setSelectedApp] = useState<ApplicationDetail | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Status Update State
  const [newStatus, setNewStatus] = useState("PROCESSING");
  const [remarks, setRemarks] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchQueue();
  }, [statusFilter, search]);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter) params.status_filter = statusFilter;
      if (search.trim()) params.search = search.trim();

      const res = await api.get("/officer/applications", { params });
      setQueue(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInspect = async (appId: number) => {
    setSelectedAppId(appId);
    setModalLoading(true);
    setActionSuccess(null);
    try {
      const res = await api.get(`/officer/applications/${appId}`);
      setSelectedApp(res.data);
      setNewStatus(res.data.status);
      setRemarks("");
    } catch (err) {
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedAppId) return;
    setUpdatingStatus(true);
    setActionSuccess(null);
    try {
      const res = await api.patch(`/officer/applications/${selectedAppId}/status`, {
        new_status: newStatus,
        remarks: remarks || `Status updated to ${newStatus} by officer.`
      });
      setSelectedApp(res.data);
      setActionSuccess(`Application status successfully transitioned to '${newStatus}'. Notification and audit dispatched.`);
      fetchQueue();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.detail || "Status update failed.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleVerifyDocument = async (docId: number, status: "VERIFIED" | "REJECTED") => {
    const reason = status === "REJECTED" ? prompt("Please enter rejection reason for this document:") : null;
    if (status === "REJECTED" && !reason) return;

    try {
      await api.post(`/officer/documents/${docId}/verify`, {
        status,
        remarks: reason || "Document verified against government registry."
      });
      // Refresh inspected application
      if (selectedAppId) {
        handleInspect(selectedAppId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Workbench Header */}
      <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Building className="w-4 h-4" />
            <span>Official Government Verification Workbench</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
            Department Officer Queue
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Logged in as: <strong className="text-white">{user?.full_name}</strong> | Department ID: <span className="text-indigo-300 font-mono font-bold">{user?.department_id || "Cross-Departmental"}</span>
          </p>
        </div>

        <div className="bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 text-center">
          <span className="text-[10px] text-slate-400 block uppercase font-semibold">Active Workload</span>
          <span className="text-xl font-extrabold text-indigo-300">{queue.length} Pending</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search citizen or reference number..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white text-slate-700 focus:ring-2 focus:ring-indigo-500 w-full sm:w-auto"
          >
            <option value="">All Statuses</option>
            <option value="SUBMITTED">SUBMITTED</option>
            <option value="UNDER_REVIEW">UNDER REVIEW</option>
            <option value="DOCUMENT_VERIFICATION">DOCUMENT VERIFICATION</option>
            <option value="PROCESSING">PROCESSING</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </div>
      </div>

      {/* Queue Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-500 text-sm">
            Loading departmental application queue...
          </div>
        ) : queue.length === 0 ? (
          <div className="py-20 text-center space-y-2">
            <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
            <p className="font-bold text-slate-800 text-sm">No pending applications found in queue.</p>
            <p className="text-xs text-slate-500">Your department workload is currently up to date.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">App Reference</th>
                  <th className="py-3 px-4">Citizen Name</th>
                  <th className="py-3 px-4">Service</th>
                  <th className="py-3 px-4">Submitted Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {queue.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-700">
                      {app.application_number}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {app.citizen_name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {app.service_name}
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
                        onClick={() => handleInspect(app.id)}
                        className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition"
                      >
                        Inspect & Action
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspection Modal */}
      {selectedAppId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block">
                  Application Inspection & Verification Desk
                </span>
                <h3 className="font-extrabold text-lg sm:text-xl font-mono text-indigo-200">
                  {selectedApp?.application_number || "Loading..."}
                </h3>
              </div>
              <button
                onClick={() => setSelectedAppId(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {modalLoading ? (
                <div className="py-20 text-center text-slate-500 text-sm">
                  Loading application dossier...
                </div>
              ) : selectedApp ? (
                <>
                  {actionSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl font-medium">
                      ✓ {actionSuccess}
                    </div>
                  )}

                  {/* Citizen & Service Banner */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Applicant Information</span>
                      <div className="font-bold text-slate-900 text-sm flex items-center">
                        <User className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                        {selectedApp.citizen_name}
                      </div>
                      <div className="text-slate-600 flex items-center">
                        <Mail className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                        {selectedApp.citizen_email}
                      </div>
                      <div className="text-slate-600 flex items-center">
                        <Phone className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                        {selectedApp.citizen_phone || "Not provided"}
                      </div>
                    </div>

                    <div className="space-y-1 sm:border-l sm:pl-4 border-slate-200">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Service Applied</span>
                      <div className="font-bold text-slate-900 text-sm">{selectedApp.service_name}</div>
                      <div className="text-slate-600">{selectedApp.department_name}</div>
                      <div className="pt-1">
                        <StatusBadge status={selectedApp.status} />
                      </div>
                    </div>
                  </div>

                  {/* Form Data Snapshot */}
                  {selectedApp.form_data && (
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                        Applicant Form Responses
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                        {Object.entries(selectedApp.form_data).map(([k, v]) => (
                          <div key={k} className="flex flex-col">
                            <span className="text-slate-400 text-[10px] capitalize font-medium">
                              {k.replace(/_/g, " ")}
                            </span>
                            <span className="font-bold text-slate-800">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Attached Documents Verification Desk */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                      Attached Supporting Documents ({selectedApp.documents.length})
                    </h4>
                    {selectedApp.documents.length === 0 ? (
                      <p className="text-slate-500 italic p-3 bg-slate-50 rounded-xl border border-slate-200">
                        No external documents uploaded for this application.
                      </p>
                    ) : (
                      <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
                        {selectedApp.documents.map((doc: AttachedDocument) => (
                          <div key={doc.id} className="p-3 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <div className="font-bold text-slate-900">{doc.document_type}</div>
                              <div className="text-slate-500 text-[11px] font-mono">{doc.original_file_name}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                doc.verification_status === "VERIFIED"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : doc.verification_status === "REJECTED"
                                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}>
                                {doc.verification_status}
                              </span>
                              {doc.verification_status !== "VERIFIED" && (
                                <button
                                  onClick={() => handleVerifyDocument(doc.id, "VERIFIED")}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold text-[11px]"
                                >
                                  Verify
                                </button>
                              )}
                              {doc.verification_status !== "REJECTED" && (
                                <button
                                  onClick={() => handleVerifyDocument(doc.id, "REJECTED")}
                                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-semibold text-[11px]"
                                >
                                  Reject
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Officer Status Transition Controls */}
                  <div className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-200 space-y-3">
                    <h4 className="font-bold text-indigo-950 uppercase tracking-wider text-[11px]">
                      Officer Action & Status Decision
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                          Transition Application Status To:
                        </label>
                        <select
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white text-slate-800 font-semibold focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="UNDER_REVIEW">UNDER REVIEW</option>
                          <option value="DOCUMENT_VERIFICATION">DOCUMENT VERIFICATION</option>
                          <option value="ADDITIONAL_INFORMATION_REQUIRED">ADDITIONAL INFO REQUIRED</option>
                          <option value="PROCESSING">PROCESSING (Field Verification)</option>
                          <option value="APPROVED">APPROVED (Issue Certificate)</option>
                          <option value="REJECTED">REJECTED</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                          Official Remarks / Citizen Notice:
                        </label>
                        <textarea
                          rows={2}
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                          placeholder="Enter reason, verification notes, or instructions for citizen..."
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={handleStatusUpdate}
                        disabled={updatingStatus}
                        className="inline-flex items-center px-4 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-semibold shadow-md transition disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5 mr-1.5" />
                        <span>{updatingStatus ? "Recording Action..." : "Commit Status Decision"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Previous Timeline */}
                  <div className="space-y-2 pt-2">
                    <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                      Complete Action History
                    </h4>
                    <Timeline events={selectedApp.timeline} currentStatus={selectedApp.status} />
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
