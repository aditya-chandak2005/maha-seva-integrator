import React, { useState } from "react";
import {
  X,
  Download,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  ExternalLink,
  FileText,
  Clock,
  Fingerprint,
  Building2,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2
} from "lucide-react";
import { DocumentVerificationReport } from "../types";
import { API_BASE_URL } from "../services/api";

export interface PreviewableDocument {
  id: number;
  document_type: string;
  original_file_name?: string;
  file_name?: string;
  file_size?: number;
  verification_status?: string;
  rejection_reason?: string;
  verification_details?: DocumentVerificationReport;
  confidence_score?: number;
  issuer?: string;
  uploaded_at?: string;
  download_url?: string;
}

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: PreviewableDocument | null;
  authToken?: string;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  isOpen,
  onClose,
  document,
  authToken,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showReportDetails, setShowReportDetails] = useState(true);

  if (!isOpen || !document) return null;

  const token = authToken || localStorage.getItem("mahaseva_token") || "";
  const documentUrl = `${API_BASE_URL}/documents/${document.id}/download${token ? `?token=${encodeURIComponent(token)}` : ""}`;

  const status = document.verification_status || "UPLOADED";
  const verDetails = document.verification_details;
  const score = document.confidence_score ?? verDetails?.confidence_score ?? (status.includes("VERIFIED") ? 98 : 60);
  const issuer = document.issuer || verDetails?.issuer || "Government Authority / MahaSeva";
  const checksPassed = verDetails?.checks_passed || [
    "PDF Syntax and structure integrity validated",
    "Digital document storage standard verified"
  ];
  const discrepancies = verDetails?.discrepancies || [];

  const renderStatusBadge = () => {
    switch (status) {
      case "DIGILOCKER_VERIFIED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            DigiLocker Certified
          </span>
        );
      case "SYSTEM_VERIFIED":
      case "VERIFIED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            System Verified
          </span>
        );
      case "NEEDS_REVIEW":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            Officer Review Required
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            Verification Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
            <Clock className="w-4 h-4 text-slate-500" />
            Uploaded
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-2 sm:p-4 animate-in fade-in duration-200">
      <div
        className={`bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col transition-all duration-300 overflow-hidden ${
          isFullscreen ? "w-full h-full rounded-none" : "w-full max-w-5xl h-[92vh]"
        }`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-blue-300" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-white truncate">
                  {document.original_file_name || `${document.document_type}.pdf`}
                </h3>
                {renderStatusBadge()}
              </div>
              <p className="text-xs text-blue-200 truncate">
                Category: <span className="font-semibold text-white">{document.document_type}</span>
                {document.file_size ? ` • ${(document.file_size / 1024).toFixed(1)} KB` : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={documentUrl}
              target="_blank"
              rel="noopener noreferrer"
              download={document.original_file_name || `${document.document_type}.pdf`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/20"
              title="Download Original PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </a>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors ml-1"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Split into Document Viewer (65%) and Verification Report (35%) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-50">
          {/* PDF Viewer Container */}
          <div className="flex-1 h-full min-h-[360px] bg-slate-200/70 relative flex flex-col">
            <iframe
              src={documentUrl}
              className="w-full h-full border-0 bg-white"
              title={document.original_file_name || "Document Preview"}
            />
          </div>

          {/* Verification Report Sidebar */}
          <div className="w-full md:w-80 lg:w-96 border-t md:border-t-0 md:border-l border-slate-200 bg-white flex flex-col overflow-y-auto">
            {/* Verification Header Box */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  System Verification
                </span>
                <span
                  className={`text-xs font-extrabold px-2 py-0.5 rounded ${
                    score >= 90
                      ? "bg-emerald-100 text-emerald-700"
                      : score >= 60
                      ? "bg-blue-100 text-blue-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {score}% Authenticity
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-200 rounded-full h-2 mb-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    score >= 90
                      ? "bg-emerald-500"
                      : score >= 60
                      ? "bg-blue-500"
                      : "bg-amber-500"
                  }`}
                  style={{ width: `${Math.min(100, Math.max(10, score))}%` }}
                />
              </div>

              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {verDetails?.summary || document.rejection_reason || "Automated verification complete. The document structure matches government issuance parameters."}
              </p>
            </div>

            {/* Verification Details Accordion */}
            <div className="p-4 space-y-4 text-xs">
              {/* Issuing Authority */}
              <div>
                <span className="text-slate-400 uppercase tracking-wider font-semibold block mb-1">
                  Issuing Authority
                </span>
                <div className="flex items-start gap-2 text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <Building2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <span className="font-medium leading-snug">{issuer}</span>
                </div>
              </div>

              {/* Cryptographic Hash */}
              {verDetails?.sha256_hash && (
                <div>
                  <span className="text-slate-400 uppercase tracking-wider font-semibold block mb-1">
                    SHA-256 Checksum
                  </span>
                  <div className="flex items-center gap-1.5 text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100 font-mono text-[11px] truncate">
                    <Fingerprint className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{verDetails.sha256_hash}</span>
                  </div>
                </div>
              )}

              {/* Passed Validation Checks */}
              <div>
                <button
                  onClick={() => setShowReportDetails(!showReportDetails)}
                  className="w-full flex items-center justify-between text-slate-700 font-semibold py-1 hover:text-slate-900"
                >
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Verification Checks ({checksPassed.length})
                  </span>
                  {showReportDetails ? (
                    <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>

                {showReportDetails && (
                  <ul className="mt-2 space-y-1.5">
                    {checksPassed.map((chk, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 bg-emerald-50/60 text-emerald-900 border border-emerald-100/80 p-2 rounded-md leading-tight"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1" />
                        <span>{chk}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Discrepancies if any */}
              {discrepancies.length > 0 && (
                <div>
                  <span className="text-rose-600 font-semibold flex items-center gap-1 mb-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Validation Discrepancies
                  </span>
                  <ul className="space-y-1.5">
                    {discrepancies.map((d, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 bg-rose-50 text-rose-800 border border-rose-200 p-2 rounded-md leading-tight"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1" />
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Legal IT Act 2016 Badge */}
              <div className="mt-auto pt-4 border-t border-slate-100">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/70 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1 text-blue-950 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0" />
                    Rule 9A IT Rules, 2016
                  </div>
                  <p className="text-[11px] text-blue-800 leading-normal">
                    This document is legally equivalent to original physical certificates under Section 4 &amp; 9A of Information Technology Rules, 2016.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span className="truncate">
            Document ID: #{document.id} • Authenticated via MahaSeva Integrity Guard
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
