import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { ServiceItem } from "../types";
import { DynamicFormRenderer } from "../components/DynamicFormRenderer";
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  Upload, 
  FileText, 
  Building, 
  Clock, 
  AlertCircle,
  Copy,
  ExternalLink
} from "lucide-react";

interface ApplyServicePageProps {
  serviceId: number;
  onBack: () => void;
  onTrackSubmitted: (applicationNumber: string) => void;
  onGoToDashboard: () => void;
  onRequireLogin: () => void;
}

export const ApplyServicePage: React.FC<ApplyServicePageProps> = ({
  serviceId,
  onBack,
  onTrackSubmitted,
  onGoToDashboard,
  onRequireLogin,
}) => {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, user } = useAuth();

  const [service, setService] = useState<ServiceItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [uploadFiles, setUploadFiles] = useState<Record<string, File>>({});

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [submittedAppNumber, setSubmittedAppNumber] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  useEffect(() => {
    fetchServiceDetail();
  }, [serviceId]);

  const fetchServiceDetail = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/services/${serviceId}`);
      setService(res.data);
      // Pre-fill full name if citizen is logged in
      if (user?.full_name) {
        setFormData({ applicant_name: user.full_name });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (key: string, val: any) => {
    setFormData((prev) => ({ ...prev, [key]: val }));
    if (formErrors[key]) {
      setFormErrors((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    }
  };

  const handleFileUpload = (docType: string, file: File) => {
    setUploadFiles((prev) => ({ ...prev, [docType]: file }));
  };

  const validateStep2 = () => {
    if (!service?.form_schema) return true;
    const errors: Record<string, string> = {};
    for (const f of service.form_schema) {
      if (f.required && (formData[f.key] === undefined || formData[f.key] === "")) {
        errors[f.key] = `${f.label} is mandatory.`;
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitApplication = async () => {
    if (!isAuthenticated) {
      onRequireLogin();
      return;
    }

    setSubmitting(true);
    setSubmissionError(null);

    try {
      // 1. Submit Application
      const appRes = await api.post("/applications", {
        service_id: serviceId,
        form_data: formData,
        status: "SUBMITTED"
      });

      const newApp = appRes.data;
      const appId = newApp.id;
      const appNumber = newApp.application_number;

      // 2. Upload attached documents if any
      for (const [docType, file] of Object.entries(uploadFiles)) {
        const uploadData = new FormData();
        uploadData.append("document_type", docType);
        uploadData.append("application_id", appId.toString());
        uploadData.append("file", file);

        try {
          await api.post("/documents/upload", uploadData, {
            headers: { "Content-Type": "multipart/form-data" }
          });
        } catch (uploadErr) {
          console.warn("Document attachment warning:", uploadErr);
        }
      }

      setSubmittedAppNumber(appNumber);
      setStep(4);
    } catch (err: any) {
      console.error(err);
      setSubmissionError(err.response?.data?.detail || "Application submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-500 text-sm flex items-center justify-center space-x-2">
        <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
        <span>Loading service details...</span>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="py-20 text-center space-y-4">
        <p className="text-slate-700 font-bold">Service not found.</p>
        <button onClick={onBack} className="text-blue-600 underline text-sm">
          Return to directory
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back Link */}
      <button
        onClick={onBack}
        className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5 mr-1" />
        <span>Back to Catalog</span>
      </button>

      {/* Service Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
            {service.department_name}
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
            {i18n.language === "mr" ? service.name_mr || service.name : service.name}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Code: {service.code}</p>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
          <div className="text-right">
            <span className="text-slate-400 block text-[10px]">Processing SLA</span>
            <span className="font-bold text-slate-800">{service.processing_days} Days</span>
          </div>
          <div className="text-right border-l pl-4 border-slate-200">
            <span className="text-slate-400 block text-[10px]">Govt Fee</span>
            <span className="font-bold text-emerald-600">
              {service.fee === 0 ? "Free" : `₹${service.fee}`}
            </span>
          </div>
        </div>
      </div>

      {/* Step Stepper */}
      {step < 4 && (
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className={`flex items-center space-x-2 ${step >= 1 ? "text-blue-700 font-bold" : "text-slate-400"}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 1 ? "bg-blue-700 text-white" : "bg-slate-200"}`}>1</span>
            <span className="text-xs hidden sm:inline">Eligibility & Docs</span>
          </div>
          <div className="w-12 h-0.5 bg-slate-200" />
          <div className={`flex items-center space-x-2 ${step >= 2 ? "text-blue-700 font-bold" : "text-slate-400"}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 2 ? "bg-blue-700 text-white" : "bg-slate-200"}`}>2</span>
            <span className="text-xs hidden sm:inline">Application Form</span>
          </div>
          <div className="w-12 h-0.5 bg-slate-200" />
          <div className={`flex items-center space-x-2 ${step >= 3 ? "text-blue-700 font-bold" : "text-slate-400"}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 3 ? "bg-blue-700 text-white" : "bg-slate-200"}`}>3</span>
            <span className="text-xs hidden sm:inline">Upload Proofs</span>
          </div>
        </div>
      )}

      {/* Step 1: Eligibility & Document Checklist */}
      {step === 1 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">
              1. Eligibility Criteria
            </h2>
            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
              {service.eligibility || "Standard citizen eligibility applicable under Maharashtra RTS guidelines."}
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-base font-bold text-slate-900">
              2. Mandatory Supporting Documents
            </h2>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {service.documents_required?.map((doc, idx) => (
                <div key={idx} className="p-3.5 flex items-center justify-between text-xs bg-white">
                  <div className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold text-slate-800">{doc.name}</span>
                  </div>
                  {doc.mandatory ? (
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      Mandatory
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      Optional
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  onRequireLogin();
                } else {
                  setStep(2);
                }
              }}
              className="inline-flex items-center px-6 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold shadow-md transition"
            >
              <span>{isAuthenticated ? "Proceed to Form" : "Login to Apply"}</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Dynamic Form */}
      {step === 2 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Application Details Form
            </h2>
            <p className="text-xs text-slate-500">
              Please provide accurate information as documented in official government proofs.
            </p>
          </div>

          <DynamicFormRenderer
            fields={service.form_schema || []}
            values={formData}
            onChange={handleFieldChange}
            errors={formErrors}
          />

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Back
            </button>
            <button
              onClick={() => {
                if (validateStep2()) {
                  setStep(3);
                }
              }}
              className="inline-flex items-center px-6 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold shadow-md transition"
            >
              <span>Continue to Documents</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Document Attachments & Final Submit */}
      {step === 3 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Attach Supporting Proofs
            </h2>
            <p className="text-xs text-slate-500">
              Supported formats: PDF, JPG, PNG (Max 5MB per document). Files are verified with SHA-256 hashes.
            </p>
          </div>

          <div className="space-y-4">
            {service.documents_required?.map((doc, idx) => {
              const file = uploadFiles[doc.type];
              return (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">
                      {doc.name} {doc.mandatory && <span className="text-rose-500">*</span>}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      Type ID: {doc.type}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <label className="cursor-pointer px-3.5 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition flex items-center shadow-sm">
                      <Upload className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                      <span>{file ? "Change File" : "Choose File"}</span>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileUpload(doc.type, e.target.files[0]);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                    {file && (
                      <span className="text-xs font-semibold text-emerald-600 truncate max-w-[150px]">
                        ✓ {file.name}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {submissionError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{submissionError}</span>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Back
            </button>
            <button
              onClick={handleSubmitApplication}
              disabled={submitting}
              className="inline-flex items-center px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md transition disabled:opacity-50"
            >
              {submitting ? "Submitting Application..." : "Submit Application"}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Success Acknowledgment */}
      {step === 4 && submittedAppNumber && (
        <div className="bg-white p-8 rounded-2xl border border-emerald-200 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="text-2xl font-extrabold text-slate-900">
              Application Submitted Successfully!
            </h2>
            <p className="text-xs text-slate-600">
              Your application has been registered with the Maha-Seva gateway and forwarded to the {service.department_name} verification desk.
            </p>
          </div>

          {/* Application Number Box */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl inline-block">
            <span className="text-[11px] text-slate-500 font-semibold block uppercase">
              Application Reference Number
            </span>
            <span className="text-lg sm:text-2xl font-mono font-extrabold text-blue-700 tracking-wider">
              {submittedAppNumber}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onTrackSubmitted(submittedAppNumber)}
              className="inline-flex items-center px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold shadow-md transition"
            >
              <span>Track Application Timeline</span>
              <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
            </button>
            <button
              onClick={onGoToDashboard}
              className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
            >
              Go to Citizen Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
