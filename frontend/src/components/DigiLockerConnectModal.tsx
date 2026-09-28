import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  X,
  ShieldCheck,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Building,
  CreditCard,
  LandPlot,
  GraduationCap,
  FileText,
  Eye,
  Sparkles,
  ExternalLink,
  Lock
} from "lucide-react";
import api from "../services/api";
import { DigiLockerDocument, VaultDocument } from "../types";
import { DocumentPreviewModal, PreviewableDocument } from "./DocumentPreviewModal";

interface DigiLockerConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSynced: (newDocs: VaultDocument[]) => void;
}

const getCategoryIcon = (docType: string) => {
  switch (docType) {
    case "AADHAAR":
    case "PAN":
      return CreditCard;
    case "LAND_RECORD":
      return LandPlot;
    case "MARKSHEET":
      return GraduationCap;
    case "BANK_PASSBOOK":
    case "DOMICILE_CERT":
      return Building;
    default:
      return FileText;
  }
};

export const DigiLockerConnectModal: React.FC<DigiLockerConnectModalProps> = ({
  isOpen,
  onClose,
  onSynced
}) => {
  const { i18n } = useTranslation();
  const [documents, setDocuments] = useState<DigiLockerDocument[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [pulling, setPulling] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Preview state
  const [previewDoc, setPreviewDoc] = useState<PreviewableDocument | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchDigiLockerDocs();
      setStatusMsg(null);
    }
  }, [isOpen]);

  const fetchDigiLockerDocs = async () => {
    setLoading(true);
    try {
      const res = await api.get<DigiLockerDocument[]>("/citizen/digilocker/available");
      setDocuments(res.data);
      // Preselect documents that are not yet in vault
      const unsynced = res.data.filter((d) => !d.is_in_vault).map((d) => d.document_type);
      setSelectedTypes(unsynced);
    } catch (err: any) {
      setStatusMsg({
        type: "error",
        text: err?.response?.data?.detail || "Failed to connect to DigiLocker gateway. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (docType: string) => {
    if (selectedTypes.includes(docType)) {
      setSelectedTypes(selectedTypes.filter((t) => t !== docType));
    } else {
      setSelectedTypes([...selectedTypes, docType]);
    }
  };

  const toggleSelectAll = () => {
    const unsynced = documents.filter((d) => !d.is_in_vault).map((d) => d.document_type);
    if (selectedTypes.length === unsynced.length) {
      setSelectedTypes([]);
    } else {
      setSelectedTypes(unsynced);
    }
  };

  const handlePullDocuments = async () => {
    if (selectedTypes.length === 0) return;
    setPulling(true);
    setStatusMsg(null);
    try {
      const res = await api.post("/citizen/digilocker/pull", {
        document_types: selectedTypes
      });

      if (res.data.success) {
        setStatusMsg({
          type: "success",
          text: res.data.message || `Successfully synchronized ${res.data.pulled_count} documents from DigiLocker.`
        });
        onSynced(res.data.documents || []);
        // Refresh local view
        await fetchDigiLockerDocs();
      }
    } catch (err: any) {
      setStatusMsg({
        type: "error",
        text: err?.response?.data?.detail || "Failed to pull selected certificates. Please try again."
      });
    } finally {
      setPulling(false);
    }
  };

  const handlePreview = (doc: DigiLockerDocument) => {
    if (doc.vault_document_id) {
      setPreviewDoc({
        id: doc.vault_document_id,
        document_type: doc.document_type,
        original_file_name: `${doc.name}_DigiLocker.pdf`,
        verification_status: "DIGILOCKER_VERIFIED",
        confidence_score: 98,
        issuer: doc.issuer
      });
    }
  };

  if (!isOpen) return null;

  const unsyncedCount = documents.filter((d) => !d.is_in_vault).length;
  const currentLang = i18n.language || "en";

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-3 sm:p-5 animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
          {/* Header Banner - DigiLocker Brand Aesthetic */}
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-sky-900 text-white p-5 border-b border-blue-950 flex items-start justify-between relative overflow-hidden">
            {/* Background geometric accents */}
            <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-white p-2 flex items-center justify-center shadow-lg shrink-0">
                <div className="w-full h-full rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black text-xl">
                  <Lock className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    DigiLocker National Gateway
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-400/20 text-sky-200 border border-sky-300/30">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    MeitY Rule 9A Certified
                  </span>
                </div>
                <p className="text-xs text-blue-100 mt-1 max-w-xl leading-relaxed">
                  Directly fetch tamper-proof government issued certificates from your Aadhaar-linked DigiLocker drive into your MahaSeva Vault with 100% automated authenticity verification.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="relative z-10 p-1.5 text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Action & Status Bar */}
          <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-slate-700">
                Available Certificates: <span className="text-blue-700 font-bold">{documents.length}</span>
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600">
                Ready to Sync: <span className="text-emerald-700 font-bold">{unsyncedCount}</span>
              </span>
            </div>

            {unsyncedCount > 0 && (
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-blue-700 hover:text-blue-800 font-semibold hover:underline"
              >
                {selectedTypes.length === unsyncedCount ? "Deselect All" : "Select All Unsynced"}
              </button>
            )}
          </div>

          {/* Alert Message Banner */}
          {statusMsg && (
            <div
              className={`px-6 py-3 text-xs flex items-center gap-2 ${
                statusMsg.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border-b border-emerald-200"
                  : "bg-rose-50 text-rose-800 border-b border-rose-200"
              }`}
            >
              {statusMsg.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span className="font-medium">{statusMsg.text}</span>
            </div>
          )}

          {/* Document Cards List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-slate-50/50">
            {loading ? (
              <div className="py-16 text-center text-slate-500">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-3" />
                <p className="font-medium text-sm">Connecting to DigiLocker Repository...</p>
                <p className="text-xs text-slate-400 mt-1">Fetching digital certificate signatures</p>
              </div>
            ) : documents.length === 0 ? (
              <div className="py-16 text-center text-slate-500">
                <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold">No certificates retrieved from DigiLocker.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {documents.map((doc) => {
                  const Icon = getCategoryIcon(doc.document_type);
                  const isSelected = selectedTypes.includes(doc.document_type);
                  const isSynced = doc.is_in_vault;

                  const displayName =
                    currentLang === "mr" ? doc.name_mr : currentLang === "hi" ? doc.name_hi : doc.name;

                  return (
                    <div
                      key={doc.document_type}
                      className={`relative rounded-xl border p-4 transition-all duration-200 flex flex-col justify-between ${
                        isSynced
                          ? "bg-emerald-50/40 border-emerald-200"
                          : isSelected
                          ? "bg-blue-50/70 border-blue-400 shadow-sm"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                                isSynced
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-slate-900 text-sm truncate leading-tight">
                                {displayName}
                              </h4>
                              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                {doc.issuer}
                              </p>
                            </div>
                          </div>

                          {/* Checkbox / Synced Status indicator */}
                          {isSynced ? (
                            <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Synced
                            </span>
                          ) : (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(doc.document_type)}
                              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 shrink-0 cursor-pointer mt-1"
                            />
                          )}
                        </div>

                        {/* Certificate metadata */}
                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                          <span>Cert ID: <code className="font-mono text-slate-700">{doc.certificate_id}</code></span>
                          <span>Issued: {doc.issue_date}</span>
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="mt-3 pt-2 flex items-center justify-between gap-2">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">
                          Digital India Certified
                        </span>

                        <div className="flex items-center gap-2">
                          {isSynced && doc.vault_document_id && (
                            <button
                              type="button"
                              onClick={() => handlePreview(doc)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-700 hover:text-blue-800 hover:bg-blue-100/60 rounded-md transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Preview
                            </button>
                          )}

                          {!isSynced && (
                            <button
                              type="button"
                              onClick={() => toggleSelect(doc.document_type)}
                              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                                isSelected
                                  ? "bg-blue-600 text-white hover:bg-blue-700"
                                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                              }`}
                            >
                              {isSelected ? "Selected" : "Select"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Direct cryptographic verification via Government Sub-CA</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
              >
                Close
              </button>

              <button
                type="button"
                disabled={selectedTypes.length === 0 || pulling}
                onClick={handlePullDocuments}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {pulling ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Synchronizing...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Pull {selectedTypes.length} Document(s) to Vault
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Embedded Document Preview Modal */}
      {previewDoc && (
        <DocumentPreviewModal
          isOpen={!!previewDoc}
          onClose={() => setPreviewDoc(null)}
          document={previewDoc}
        />
      )}
    </>
  );
};
