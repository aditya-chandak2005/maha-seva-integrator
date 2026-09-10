import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { ApplicationDetail, ApplicationListItem } from "../types";
import { StatusBadge } from "../components/StatusBadge";
import { Timeline } from "../components/Timeline";
import { 
  Search, 
  Clock, 
  Building, 
  FileText, 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  FileCheck,
  ShieldAlert,
  ArrowRight,
  PlusCircle,
  FolderOpen
} from "lucide-react";

interface TrackApplicationPageProps {
  initialNumber?: string;
  onNavigate?: (tab: string, param?: any) => void;
}

export const TrackApplicationPage: React.FC<TrackApplicationPageProps> = ({
  initialNumber = "",
  onNavigate,
}) => {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const [appNumber, setAppNumber] = useState(initialNumber);
  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // My Applications list for logged-in citizens
  const [myApplications, setMyApplications] = useState<ApplicationListItem[]>([]);
  const [loadingMyApps, setLoadingMyApps] = useState(false);

  useEffect(() => {
    if (initialNumber.trim() && isAuthenticated) {
      handleTrack(initialNumber.trim());
    }
  }, [initialNumber, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && user?.role === "CITIZEN") {
      fetchMyApplications();
    }
  }, [isAuthenticated, user]);

  const fetchMyApplications = async () => {
    setLoadingMyApps(true);
    try {
      const res = await api.get("/applications/my");
      setMyApplications(res.data || []);
    } catch (err) {
      console.error("Failed to fetch user applications:", err);
    } finally {
      setLoadingMyApps(false);
    }
  };

  const handleTrack = async (numToTrack?: string) => {
    const num = (numToTrack || appNumber).trim();
    if (!num) return;

    setLoading(true);
    setErrorMsg(null);
    setApplication(null);

    try {
      const res = await api.get(`/applications/track/${num}`);
      setApplication(res.data);
      setAppNumber(num);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(
        err.response?.data?.detail ||
        `Application '${num}' was not found. Please verify the application reference number.`
      );
    } finally {
      setLoading(false);
    }
  };

  // If user is not authenticated, show secure authentication required gate
  if (!isAuthenticated) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6 animate-fadeIn">
        <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-sm">
          <ShieldAlert className="w-8 h-8 text-amber-700" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Authentication Required to Track Applications
          </h2>
          <p className="text-sm text-slate-600">
            In compliance with government data protection and privacy standards, application status tracking is restricted to registered citizens and authorized administrators.
          </p>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4 text-left">
          <p className="text-xs text-slate-500">
            Please sign in to inspect real-time application progress, officer review remarks, and digitally signed certificates.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => onNavigate && onNavigate("login")}
              className="flex-1 py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm rounded-xl transition shadow-md flex items-center justify-center space-x-2"
            >
              <span>Sign In to Track Application</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate && onNavigate("register")}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition border border-slate-300 flex items-center justify-center space-x-1"
            >
              <span>Register Account</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          {i18n.language === "mr" ? "अर्जाची स्थिती शोधा" : i18n.language === "hi" ? "आवेदन की स्थिति ट्रैक करें" : "Track Application Status"}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600">
          Enter your unique application tracking reference number to inspect real-time verification progress.
        </p>
      </div>

      {/* Tracking Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleTrack();
        }}
        className="bg-white p-3 rounded-2xl border border-slate-200 shadow-lg flex gap-2"
      >
        <div className="relative flex-1 flex items-center">
          <Search className="w-5 h-5 text-slate-400 ml-3" />
          <input
            type="text"
            value={appNumber}
            onChange={(e) => setAppNumber(e.target.value)}
            placeholder="Enter Application Number (e.g. MH-REV-2026-00101, KA-BES-2026-XXXXX)..."
            className="w-full px-3 py-2.5 text-sm font-mono text-slate-800 focus:outline-none placeholder-slate-400 uppercase"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !appNumber.trim()}
          className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm rounded-xl transition shadow-sm"
        >
          {loading ? "Searching..." : "Track"}
        </button>
      </form>

      {/* Error Card */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Result Container */}
      {application && (
        <div className="space-y-6 animate-fadeIn">
          {/* Summary Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[11px] font-bold text-slate-400 block uppercase">
                  Application Reference Number
                </span>
                <span className="text-xl sm:text-2xl font-mono font-extrabold text-blue-700 tracking-wider">
                  {application.application_number}
                </span>
              </div>
              <StatusBadge status={application.status} className="text-sm px-3 py-1.5" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="flex items-start space-x-2 text-slate-600">
                <Building className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-400 block text-[10px]">Department</span>
                  <span className="font-bold text-slate-800">{application.department_name}</span>
                </div>
              </div>

              <div className="flex items-start space-x-2 text-slate-600">
                <FileText className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-400 block text-[10px]">Service Applied</span>
                  <span className="font-bold text-slate-800">{application.service_name}</span>
                </div>
              </div>

              <div className="flex items-start space-x-2 text-slate-600">
                <Calendar className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-400 block text-[10px]">Submission Date</span>
                  <span className="font-bold text-slate-800">
                    {new Date(application.submitted_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric"
                    })}
                  </span>
                </div>
              </div>
            </div>

            {application.citizen_name && (
              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500">
                <span>Applicant: <strong className="text-slate-800">{application.citizen_name}</strong></span>
                {application.remarks && (
                  <span className="italic">Remarks: {application.remarks}</span>
                )}
              </div>
            )}
          </div>

          {/* Timeline and Verification Progress */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Clock className="w-5 h-5 text-blue-700" />
              <span>Workflow Audit Trail & Lifecycle</span>
            </h2>
            <Timeline events={application.timeline || []} currentStatus={application.status} />
          </div>

          {/* Attached / Verified Documents */}
          {application.documents && application.documents.length > 0 && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <FileCheck className="w-5 h-5 text-emerald-600" />
                <span>Attached Supporting Documents</span>
              </h2>
              <div className="divide-y divide-slate-100">
                {application.documents.map((doc: any) => (
                  <div key={doc.id} className="py-2.5 flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-800">{doc.document_type}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {doc.verification_status || "VERIFIED"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Citizen's Active Applications List */}
      {user?.role === "CITIZEN" && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FolderOpen className="w-5 h-5 text-blue-700" />
              <h2 className="text-base font-bold text-slate-900">
                Your Submitted Applications ({myApplications.length})
              </h2>
            </div>
            {onNavigate && (
              <button
                onClick={() => onNavigate("services")}
                className="text-xs text-blue-700 font-bold hover:underline flex items-center space-x-1"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Apply for New Service</span>
              </button>
            )}
          </div>

          {loadingMyApps ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading your applications...</div>
          ) : myApplications.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {myApplications.map((app) => (
                <div key={app.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 p-2 rounded-xl transition">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-sm font-bold text-blue-700">{app.application_number}</span>
                      <StatusBadge status={app.status} className="text-[10px] px-2 py-0.5" />
                    </div>
                    <p className="text-xs font-semibold text-slate-800">{app.service_name}</p>
                    <p className="text-[10px] text-slate-400">{app.department_name} • Submitted {new Date(app.submitted_at).toLocaleDateString("en-IN")}</p>
                  </div>

                  <button
                    onClick={() => handleTrack(app.application_number)}
                    className="self-start sm:self-center px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-xs rounded-lg transition shrink-0"
                  >
                    Inspect Status
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center space-y-2">
              <p className="text-xs text-slate-500">You have not submitted any government service applications yet.</p>
              {onNavigate && (
                <button
                  onClick={() => onNavigate("services")}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-sm inline-flex items-center space-x-1"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Explore Services to Apply</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
