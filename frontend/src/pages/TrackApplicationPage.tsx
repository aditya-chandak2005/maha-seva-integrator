import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import api from "../services/api";
import { ApplicationDetail } from "../types";
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
  FileCheck
} from "lucide-react";

interface TrackApplicationPageProps {
  initialNumber?: string;
}

export const TrackApplicationPage: React.FC<TrackApplicationPageProps> = ({
  initialNumber = "",
}) => {
  const { t, i18n } = useTranslation();
  const [appNumber, setAppNumber] = useState(initialNumber);
  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialNumber.trim()) {
      handleTrack(initialNumber.trim());
    }
  }, [initialNumber]);

  const handleTrack = async (numToTrack?: string) => {
    const num = (numToTrack || appNumber).trim();
    if (!num) return;

    setLoading(true);
    setErrorMsg(null);
    setApplication(null);

    try {
      const res = await api.get(`/applications/track/${num}`);
      setApplication(res.data);
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          {i18n.language === "mr" ? "अर्जाची स्थिती शोधा" : "Track Application Status"}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600">
          Enter your unique application tracking reference number to inspect real-time progress.
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
            placeholder="Enter Application Number (e.g. MH-REV-2026-00101)..."
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
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
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

            {application.remarks && (
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900">
                <span className="font-bold block mb-0.5">Official Processing Remark:</span>
                <p>{application.remarks}</p>
              </div>
            )}
          </div>

          {/* Timeline Section */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center">
              <Clock className="w-4 h-4 mr-2 text-blue-600" />
              <span>Real-Time Status Progression Timeline</span>
            </h2>
            <Timeline events={application.timeline} currentStatus={application.status} />
          </div>

          {/* Form Summary Details */}
          {application.form_data && Object.keys(application.form_data).length > 0 && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Submitted Form Snapshot
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                {Object.entries(application.form_data).map(([k, v]) => (
                  <div key={k} className="flex flex-col">
                    <span className="text-slate-400 text-[10px] capitalize font-medium">
                      {k.replace(/_/g, " ")}
                    </span>
                    <span className="font-semibold text-slate-800 truncate">
                      {String(v)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
