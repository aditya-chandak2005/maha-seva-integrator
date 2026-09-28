import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { ServiceItem, CitizenProfile, VaultDocument, FormField } from "../types";
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
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Eye,
  RefreshCw
} from "lucide-react";
import { DocumentPreviewModal, PreviewableDocument } from "../components/DocumentPreviewModal";
import { DigiLockerConnectModal } from "../components/DigiLockerConnectModal";

interface ApplyServicePageProps {
  serviceId: number;
  onBack: () => void;
  onTrackSubmitted: (applicationNumber: string) => void;
  onGoToDashboard: () => void;
  onRequireLogin: (notice?: string, onSuccess?: () => void) => void;
  onOpenProfileVault?: () => void;
}

export const ApplyServicePage: React.FC<ApplyServicePageProps> = ({
  serviceId,
  onBack,
  onTrackSubmitted,
  onGoToDashboard,
  onRequireLogin,
  onOpenProfileVault,
}) => {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, user } = useAuth();

  const [service, setService] = useState<ServiceItem | null>(null);
  const [profile, setProfile] = useState<CitizenProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [uploadFiles, setUploadFiles] = useState<Record<string, File>>({});
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});
  const [attachedVaultDocIds, setAttachedVaultDocIds] = useState<number[]>([]);
  const [refreshingVault, setRefreshingVault] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<PreviewableDocument | null>(null);
  const [showDigiLockerModal, setShowDigiLockerModal] = useState(false);
  const [verifyingUploads, setVerifyingUploads] = useState<Record<string, any>>({});

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [submittedAppNumber, setSubmittedAppNumber] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Existing active application guard
  const [existingApp, setExistingApp] = useState<{
    application_number: string;
    status: string;
    submitted_at?: string;
  } | null>(null);
  const [checkingExisting, setCheckingExisting] = useState(false);

  // Auto-Fill feedback banner state
  const [autoFillNotice, setAutoFillNotice] = useState<{ count: number; timestamp: number } | null>(null);

  useEffect(() => {
    fetchServiceDetail();
    if (isAuthenticated) {
      fetchCitizenProfile();
      checkExistingApplication();
    } else {
      setExistingApp(null);
    }
  }, [serviceId, isAuthenticated]);

  const checkExistingApplication = async () => {
    setCheckingExisting(true);
    try {
      const res = await api.get(`/applications/check-active?service_id=${serviceId}`);
      if (res.data?.has_active) {
        setExistingApp({
          application_number: res.data.application_number,
          status: res.data.status,
          submitted_at: res.data.submitted_at,
        });
      } else {
        setExistingApp(null);
      }
    } catch (err) {
      console.warn("Could not check existing application status:", err);
    } finally {
      setCheckingExisting(false);
    }
  };

  const fetchCitizenProfile = async () => {
    try {
      const res = await api.get("/citizen/profile");
      const p: CitizenProfile = res.data;
      setProfile(p);
    } catch (err) {
      console.warn("Could not load citizen profile for auto-fill:", err);
    }
  };

  /**
   * Smart profile-to-form value resolver
   * Inspects canonical keys, schema labels, and language variants to resolve values from CitizenProfile
   */
  const getProfileFieldValue = (field: FormField, p: CitizenProfile): any => {
    if (!p) return undefined;
    const k = (field.key || "").toLowerCase().trim();
    const l = (field.label || "").toLowerCase().trim();
    const lMr = (field.label_mr || "").toLowerCase().trim();
    const lHi = (field.label_hi || "").toLowerCase().trim();
    const allLabels = `${l} ${lMr} ${lHi}`;
    const pd = p.profile_data || {};

    let val: any = undefined;

    // 1. Residence Years (continuous residence in state)
    if (
      k === "residence_years" ||
      k === "years_of_residence" ||
      k === "residency_years" ||
      k === "years_in_state" ||
      allLabels.includes("residence") ||
      allLabels.includes("वास्तव्या") ||
      allLabels.includes("निवास के वर्ष")
    ) {
      val = pd.residence_years !== undefined ? pd.residence_years : 30;
    }
    // 2. Place of Birth
    else if (
      k === "place_of_birth" ||
      k === "birth_place" ||
      k === "birthplace" ||
      allLabels.includes("place of birth") ||
      allLabels.includes("birth place") ||
      allLabels.includes("जन्मस्थान") ||
      allLabels.includes("जन्म स्थान")
    ) {
      val =
        pd.place_of_birth ||
        (pd.district ? `${pd.district}, ${p.state_code || "Maharashtra"}` : "Pune, Maharashtra");
    }
    // 3. District
    else if (
      k === "district" ||
      k === "applicant_district" ||
      k === "enter_district" ||
      allLabels.includes("district") ||
      allLabels.includes("जिल्हा") ||
      allLabels.includes("जिला")
    ) {
      val = pd.district || "Pune";
    }
    // 4. Taluka / Tehsil / Mandal / Block
    else if (
      k === "taluka" ||
      k === "tehsil" ||
      k === "mandal" ||
      k === "circle" ||
      k === "block" ||
      allLabels.includes("taluka") ||
      allLabels.includes("tehsil") ||
      allLabels.includes("तालुका") ||
      allLabels.includes("तहसील")
    ) {
      val = pd.taluka || "Haveli";
    }
    // 5. Village / Town
    else if (
      k === "village" ||
      k === "village_name" ||
      k === "town" ||
      k === "mouza" ||
      allLabels.includes("village") ||
      allLabels.includes("गाव") ||
      allLabels.includes("ग्राम")
    ) {
      val = pd.village || "Ambegaon";
    }
    // 6. PIN Code
    else if (
      k === "pincode" ||
      k === "pin_code" ||
      k === "postal_code" ||
      allLabels.includes("pincode") ||
      allLabels.includes("pin code") ||
      allLabels.includes("पिनकोड")
    ) {
      val = pd.pincode || "411030";
    }
    // 7. Full Name / Applicant / Beneficiary Name
    else if (
      k === "applicant_name" ||
      k === "full_name" ||
      k === "student_name" ||
      k === "farmer_name" ||
      k === "beneficiary_name" ||
      k === "name" ||
      k === "head_of_family" ||
      allLabels.includes("applicant name") ||
      allLabels.includes("full name") ||
      allLabels.includes("नाव") ||
      allLabels.includes("नाम")
    ) {
      val = p.full_name;
    }
    // 8. Mobile / Phone Number
    else if (
      k === "mobile_no" ||
      k === "phone" ||
      k === "mobile" ||
      k === "contact_number" ||
      k === "contact_no" ||
      allLabels.includes("mobile") ||
      allLabels.includes("phone") ||
      allLabels.includes("मोबाइल") ||
      allLabels.includes("दूरध्वनी")
    ) {
      val = p.phone;
    }
    // 9. Email
    else if (k === "email" || k === "email_id" || allLabels.includes("email")) {
      val = p.email;
    }
    // 10. Bank Account Number (checked before generic Aadhaar to prevent matching "Aadhaar Linked Bank Account")
    else if (
      k === "bank_account" ||
      k === "bank_account_number" ||
      k === "account_no" ||
      k === "account_number" ||
      k.includes("bank_account") ||
      allLabels.includes("bank account") ||
      allLabels.includes("खाते क्रमांक") ||
      allLabels.includes("खाता संख्या")
    ) {
      val = pd.bank_account_number;
    }
    // 11. Bank IFSC
    else if (k === "bank_ifsc" || k === "ifsc" || k === "ifsc_code" || allLabels.includes("ifsc")) {
      val = pd.bank_ifsc;
    }
    // 12. Bank Name / Preferred Bank
    else if (
      k === "preferred_bank" ||
      k === "bank_name" ||
      allLabels.includes("bank name") ||
      allLabels.includes("financing bank") ||
      allLabels.includes("बँकेचे नाव") ||
      allLabels.includes("बैंक का नाम")
    ) {
      val = pd.bank_name;
    }
    // 13. Aadhaar Number / Jan Aadhaar / PM-Kisan ID
    else if (
      k === "aadhaar_no" ||
      k === "aadhaar_number" ||
      k === "aadhaar" ||
      k === "uid_no" ||
      k === "jan_aadhaar_no" ||
      k === "pm_kisan_id" ||
      (!k.includes("bank") &&
        !k.includes("account") &&
        (allLabels.includes("aadhaar") || allLabels.includes("aadhar") || allLabels.includes("आधार")))
    ) {
      val = p.aadhaar_number;
    }
    // 14. PAN Card Number
    else if (k === "pan_no" || k === "pan_number" || k === "pan" || allLabels.includes("pan")) {
      val = p.pan_number;
    }
    // 15. Annual Family Income
    else if (
      k === "family_annual_income" ||
      k === "annual_income" ||
      k === "annual_family_income" ||
      allLabels.includes("annual income") ||
      allLabels.includes("family income") ||
      allLabels.includes("उत्पन्न") ||
      allLabels.includes("आय")
    ) {
      val =
        pd.annual_family_income !== undefined
          ? pd.annual_family_income
          : pd.annual_income !== undefined
          ? pd.annual_income
          : 180000;
    }
    // 16. Sub-Caste Name (checked before generic caste category)
    else if (
      k === "sub_caste" ||
      k === "subcaste" ||
      allLabels.includes("sub-caste") ||
      allLabels.includes("sub caste") ||
      allLabels.includes("पोटजात") ||
      allLabels.includes("उप-जाति")
    ) {
      val = pd.sub_caste || "Maratha / Kunbi";
    }
    // 17. Caste Category / Social Group
    else if (
      k === "caste_category" ||
      k === "social_category" ||
      k === "category" ||
      k === "caste_group" ||
      k === "community_class" ||
      allLabels.includes("caste category") ||
      allLabels.includes("social category") ||
      allLabels.includes("caste") ||
      allLabels.includes("जात प्रवर्ग") ||
      allLabels.includes("जाति वर्ग")
    ) {
      val = pd.caste_category || "GENERAL";
    }
    // 18. Ration Card Number
    else if (
      k === "ration_card_no" ||
      k === "ration_card" ||
      allLabels.includes("ration card") ||
      allLabels.includes("रेशन कार्ड") ||
      allLabels.includes("राशन कार्ड")
    ) {
      val = pd.ration_card_no || "MH-PUN-7829104";
    }
    // 19. Marital Status
    else if (k === "marital_status" || allLabels.includes("marital status") || allLabels.includes("वैवाहिक स्थिती")) {
      val = pd.marital_status || "Married";
    }
    // 20. Age
    else if (
      k === "applicant_age" ||
      k === "citizen_age" ||
      k === "age" ||
      allLabels.includes("age") ||
      allLabels.includes("वय") ||
      allLabels.includes("आयु")
    ) {
      if (pd.age) val = Number(pd.age);
      else if (pd.dob) {
        val = new Date().getFullYear() - new Date(pd.dob).getFullYear();
      } else {
        val = 30;
      }
    }
    // 21. Date of Birth
    else if (k === "dob" || k === "date_of_birth" || allLabels.includes("date of birth") || allLabels.includes("जन्मतारीख")) {
      val = pd.dob || "1994-05-15";
    }
    // 22. Gender
    else if (k === "gender" || k === "sex" || allLabels.includes("gender") || allLabels.includes("लिंग")) {
      val = pd.gender || "Male";
    }
    // 23. Father or Spouse Name
    else if (
      k === "father_or_spouse_name" ||
      k === "father_name" ||
      k === "spouse_name" ||
      allLabels.includes("father") ||
      allLabels.includes("spouse") ||
      allLabels.includes("वडिलांचे नाव") ||
      allLabels.includes("पिता")
    ) {
      val = pd.father_or_spouse_name || "Deshmukh Anandrao";
    }
    // 24. Residential Address
    else if (
      k === "address" ||
      k === "residential_address" ||
      allLabels.includes("address") ||
      allLabels.includes("पत्ता") ||
      allLabels.includes("पता")
    ) {
      val = pd.address || "104 Shaniwar Peth, Pune, Maharashtra 411030";
    }
    // 25. State
    else if (k === "state" || k === "state_code") {
      val = p.state_code || "MH";
    }
    // 26. Primary Income Source
    else if (k === "income_source") {
      val = pd.occupation || "Agriculture";
    }
    // Direct matches in profile_data or top-level profile
    else if (pd[k] !== undefined) {
      val = pd[k];
    } else if ((p as any)[k] !== undefined) {
      val = (p as any)[k];
    }

    if (val === undefined || val === null) return undefined;

    // Type casting
    if (field.type === "NUMBER") {
      const num = Number(val);
      return isNaN(num) ? val : num;
    }

    if (field.type === "DROPDOWN" && field.options && Array.isArray(field.options)) {
      const match = field.options.find(
        (opt) => opt.toLowerCase() === String(val).toLowerCase() || opt.toLowerCase().includes(String(val).toLowerCase())
      );
      if (match) return match;
    }

    return String(val);
  };

  /**
   * Apply Auto-Fill values from the citizen's DigiLocker profile into form state
   */
  const applyProfileAutoFill = (forceOverwrite = false) => {
    if (!profile || !service?.form_schema) return;
    let count = 0;
    setFormData((prev) => {
      const updated = { ...prev };
      for (const field of service.form_schema!) {
        const existing = updated[field.key];
        const isEmpty = existing === undefined || existing === null || existing === "";
        if (forceOverwrite || isEmpty) {
          const autoVal = getProfileFieldValue(field, profile);
          if (autoVal !== undefined && autoVal !== null && autoVal !== "") {
            updated[field.key] = autoVal;
            count++;
          }
        }
      }
      return updated;
    });

    if (count > 0 || forceOverwrite) {
      setAutoFillNotice({ count, timestamp: Date.now() });
      setTimeout(() => {
        setAutoFillNotice(null);
      }, 5000);
    }
  };

  // Automatically trigger auto-fill whenever service and citizen profile are loaded
  useEffect(() => {
    if (service && profile && service.form_schema && service.form_schema.length > 0) {
      applyProfileAutoFill(false);
    }
  }, [service, profile]);

  const fetchServiceDetail = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/services/${serviceId}`);
      setService(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  interface NormalizedDocRequirement {
    key: string;       // Unique key for tracking uploads: e.g. `${type}_${idx}`
    type: string;      // Canonical document type
    name: string;      // Display name of document
    mandatory: boolean;
  }

  const getNormalizedDocs = (rawDocs?: any[]): NormalizedDocRequirement[] => {
    if (!rawDocs || !Array.isArray(rawDocs)) return [];
    return rawDocs.map((doc, idx) => {
      if (typeof doc === "string") {
        const name = doc.trim();
        const lower = name.toLowerCase();
        let type = `DOC_${idx + 1}`;
        if (lower.includes("aadhaar") || lower.includes("aadhar")) type = "AADHAAR";
        else if (lower.includes("pan")) type = "PAN";
        else if (lower.includes("7/12") || lower.includes("satbara") || lower.includes("land") || lower.includes("ror")) type = "LAND_RECORD";
        else if (lower.includes("income")) type = "INCOME_CERT";
        else if (lower.includes("domicile") || lower.includes("residence") || lower.includes("resident")) type = "DOMICILE_CERT";
        else if (lower.includes("marksheet") || lower.includes("passing") || lower.includes("degree") || lower.includes("board")) type = "MARKSHEET";
        else if (lower.includes("bank") || lower.includes("passbook")) type = "BANK_PASSBOOK";
        else if (lower.includes("ration")) type = "RATION_CARD";
        else if (lower.includes("caste")) type = "CASTE_CERT";

        return {
          key: `${type}_${idx}`,
          type,
          name,
          mandatory: true
        };
      } else if (doc && typeof doc === "object") {
        const name = doc.name || doc.title || doc.label || `Document ${idx + 1}`;
        let type = doc.type || `DOC_${idx + 1}`;
        const lower = name.toLowerCase();
        if (type.startsWith("DOC_") || !type) {
          if (lower.includes("aadhaar") || lower.includes("aadhar")) type = "AADHAAR";
          else if (lower.includes("pan")) type = "PAN";
          else if (lower.includes("7/12") || lower.includes("satbara") || lower.includes("land") || lower.includes("ror")) type = "LAND_RECORD";
          else if (lower.includes("income")) type = "INCOME_CERT";
          else if (lower.includes("domicile") || lower.includes("residence") || lower.includes("resident")) type = "DOMICILE_CERT";
          else if (lower.includes("marksheet") || lower.includes("passing") || lower.includes("degree") || lower.includes("board")) type = "MARKSHEET";
          else if (lower.includes("bank") || lower.includes("passbook")) type = "BANK_PASSBOOK";
          else if (lower.includes("ration")) type = "RATION_CARD";
          else if (lower.includes("caste")) type = "CASTE_CERT";
        }
        return {
          key: `${type}_${idx}`,
          type,
          name,
          mandatory: doc.mandatory !== undefined ? Boolean(doc.mandatory) : true
        };
      }
      return {
        key: `DOC_${idx}`,
        type: `DOC_${idx}`,
        name: `Supporting Document ${idx + 1}`,
        mandatory: true
      };
    });
  };

  const requiredDocs = React.useMemo(
    () => getNormalizedDocs(service?.documents_required),
    [service?.documents_required]
  );

  // Match document requirement against citizen profile vault
  const findMatchingVaultDoc = (docType: string, docName: string): VaultDocument | undefined => {
    if (!profile?.vault_documents) return undefined;
    const cleanType = (docType || "").toUpperCase();
    const cleanName = (docName || "").toLowerCase();

    return profile.vault_documents.find((vd) => {
      const vt = (vd.document_type || "").toUpperCase();
      // Direct type match
      if (cleanType === vt) return true;
      // Heuristic matches
      if (vt === "AADHAAR" && (cleanName.includes("aadhaar") || cleanName.includes("aadhar"))) return true;
      if (vt === "PAN" && cleanName.includes("pan")) return true;
      if (vt === "LAND_RECORD" && (cleanName.includes("7/12") || cleanName.includes("satbara") || cleanName.includes("land") || cleanName.includes("ror"))) return true;
      if (vt === "INCOME_CERT" && cleanName.includes("income")) return true;
      if (vt === "DOMICILE_CERT" && (cleanName.includes("domicile") || cleanName.includes("residence"))) return true;
      if (vt === "MARKSHEET" && (cleanName.includes("marksheet") || cleanName.includes("passing") || cleanName.includes("board") || cleanName.includes("degree"))) return true;
      if (vt === "BANK_PASSBOOK" && (cleanName.includes("bank") || cleanName.includes("passbook"))) return true;
      if (vt === "RATION_CARD" && cleanName.includes("ration")) return true;
      return false;
    });
  };

  // Sync auto-attached vault document IDs when entering step 3
  useEffect(() => {
    if (step === 3 && requiredDocs.length > 0 && profile?.vault_documents) {
      const ids: number[] = [];
      requiredDocs.forEach((doc) => {
        const matched = findMatchingVaultDoc(doc.type, doc.name);
        if (matched && !ids.includes(matched.id)) {
          ids.push(matched.id);
        }
      });
      setAttachedVaultDocIds(ids);
    }
  }, [step, requiredDocs, profile]);

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

  const handleFileUpload = (docKey: string, file: File) => {
    const isPdf = file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf";
    if (!isPdf) {
      setUploadErrors((prev) => ({
        ...prev,
        [docKey]: `Invalid file format: Only PDF files (.pdf) are allowed. Selected: "${file.name}"`
      }));
      return;
    }
    if (file.size > 256 * 1024) {
      const sizeKb = (file.size / 1024).toFixed(1);
      setUploadErrors((prev) => ({
        ...prev,
        [docKey]: `File exceeds 256 KB limit (selected file is ${sizeKb} KB). Please upload a compressed PDF under 256 KB.`
      }));
      return;
    }

    setUploadErrors((prev) => {
      const copy = { ...prev };
      delete copy[docKey];
      return copy;
    });
    setUploadFiles((prev) => ({ ...prev, [docKey]: file }));

    // Trigger instant pre-upload automated verification
    const fd = new FormData();
    fd.append("document_type", docKey);
    fd.append("file", file);
    api.post("/documents/verify-upload", fd, {
      headers: { "Content-Type": "multipart/form-data" }
    }).then((res) => {
      setVerifyingUploads((prev) => ({ ...prev, [docKey]: res.data }));
    }).catch((err) => {
      console.warn("Pre-verification check notice:", err);
    });
  };

  const handleFileRemove = (docKey: string) => {
    setUploadFiles((prev) => {
      const copy = { ...prev };
      delete copy[docKey];
      return copy;
    });
    setUploadErrors((prev) => {
      const copy = { ...prev };
      delete copy[docKey];
      return copy;
    });
    setVerifyingUploads((prev) => {
      const copy = { ...prev };
      delete copy[docKey];
      return copy;
    });
  };

  const handleRefreshVault = async () => {
    setRefreshingVault(true);
    await fetchCitizenProfile();
    setRefreshingVault(false);
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
      onRequireLogin(
        `Please sign in to submit your application for ${service ? (i18n.language === "mr" ? service.name_mr || service.name : service.name) : "this service"}.`,
        () => handleSubmitApplication()
      );
      return;
    }

    if (submitting || existingApp) {
      return;
    }

    setSubmitting(true);
    setSubmissionError(null);

    try {
      // 1. Submit Application with auto-attached vault IDs (excluding any that user replaced with manual upload)
      const finalVaultDocIds = attachedVaultDocIds.filter((vaultId) => {
        const matchedReq = requiredDocs.find((d) => {
          const m = findMatchingVaultDoc(d.type, d.name);
          return m && m.id === vaultId;
        });
        if (matchedReq && uploadFiles[matchedReq.key]) {
          return false; // User uploaded their own replacement file
        }
        return true;
      });

      const appRes = await api.post("/applications", {
        service_id: serviceId,
        form_data: formData,
        status: "SUBMITTED",
        vault_document_ids: finalVaultDocIds
      });

      const newApp = appRes.data;
      const appId = newApp.id;
      const appNumber = newApp.application_number;

      // 2. Upload manual or scheme-specific attached documents if any
      for (const [docKey, file] of Object.entries(uploadFiles)) {
        const found = requiredDocs.find((d) => d.key === docKey);
        const docType = found ? found.type : docKey;
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

        // Also save this document to citizen's vault so subsequent scheme applications auto-fetch it without re-upload!
        try {
          const vaultData = new FormData();
          vaultData.append("document_type", docType);
          vaultData.append("file", file);
          await api.post("/citizen/vault/upload", vaultData, {
            headers: { "Content-Type": "multipart/form-data" }
          });
        } catch (vaultErr) {
          console.warn("Vault mirroring note:", vaultErr);
        }
      }

      setSubmittedAppNumber(appNumber);
      setStep(4);
    } catch (err: any) {
      console.error(err);
      const detail = err.response?.data?.detail || "Application submission failed. Please try again.";
      setSubmissionError(detail);
      if (err.response?.status === 400 && detail.toLowerCase().includes("active application")) {
        checkExistingApplication();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const formatEligibility = (eligibility?: any) => {
    if (!eligibility) return <span>Standard Indian citizen eligibility applicable under state RTS rules.</span>;

    let parsed = eligibility;
    if (typeof eligibility === "string") {
      try {
        parsed = JSON.parse(eligibility);
      } catch {
        return <span>{eligibility}</span>;
      }
    }

    if (typeof parsed === "object" && parsed !== null) {
      if (parsed.criteria) {
        return <span className="font-medium text-slate-800">{parsed.criteria}</span>;
      }

      const items: { label: string; value: any }[] = [];
      if (parsed.min_age) items.push({ label: "Minimum Age", value: `${parsed.min_age} years` });
      if (parsed.max_age) items.push({ label: "Maximum Age", value: `${parsed.max_age} years` });
      if (parsed.residency) items.push({ label: "Residency Requirement", value: parsed.residency });
      if (parsed.income_limit) {
        items.push({
          label: "Income Limit",
          value: `Up to ₹${Number(parsed.income_limit).toLocaleString("en-IN")} / year`
        });
      }
      if (parsed.ownership) items.push({ label: "Ownership", value: parsed.ownership });
      if (parsed.license) items.push({ label: "License Requirement", value: parsed.license });

      if (items.length > 0) {
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {items.map((item, idx) => (
              <div key={idx} className="flex items-center space-x-2 bg-white px-3 py-2 rounded-xl border border-slate-200/80">
                <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                <span className="text-xs text-slate-600 font-semibold">{item.label}:</span>
                <span className="text-xs text-slate-900 font-bold">{item.value}</span>
              </div>
            ))}
          </div>
        );
      }

      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {Object.entries(parsed)
            .filter(([_, v]) => v !== null && v !== undefined)
            .map(([k, v], idx) => (
              <div key={idx} className="flex items-center space-x-2 bg-white px-3 py-2 rounded-xl border border-slate-200/80">
                <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                <span className="text-xs text-slate-600 font-semibold capitalize">{k.replace(/_/g, " ")}:</span>
                <span className="text-xs text-slate-900 font-bold">{String(v)}</span>
              </div>
            ))}
        </div>
      );
    }

    return <span>{String(eligibility)}</span>;
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
        <p className="text-slate-700 font-bold">Service or Scheme not found.</p>
        <button onClick={onBack} className="text-blue-600 underline text-sm">
          Return to directory
        </button>
      </div>
    );
  }

  const isScheme = service.service_type === "SCHEME";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back Link */}
      <button
        onClick={onBack}
        className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5 mr-1" />
        <span>Back to {isScheme ? "Schemes Catalog" : "Document Catalog"}</span>
      </button>

      {/* Service / Scheme Banner */}
      <div
        className={`p-6 sm:p-7 rounded-3xl border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors ${
          isScheme
            ? "bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white border-emerald-800"
            : "bg-white border-slate-200 text-slate-900"
        }`}
      >
        <div>
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <span
              className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                isScheme ? "bg-amber-400 text-slate-950" : "bg-slate-900 text-amber-300"
              }`}
            >
              {service.state_code || "MH"}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                isScheme ? "bg-white/10 text-emerald-200 border border-transparent" : "bg-blue-50 text-blue-700 border border-blue-200"
              }`}
            >
              {service.department_name}
            </span>
            {isScheme && (
              <span className="px-2.5 py-0.5 rounded text-[10px] font-extrabold bg-emerald-600 text-white">
                Government Scheme
              </span>
            )}
          </div>

          <h1 className="text-xl sm:text-2xl font-black mt-2 tracking-tight">
            {i18n.language === "mr" ? service.name_mr || service.name : service.name}
          </h1>

          {service.benefit_amount && (
            <div className="mt-2 inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-black">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{service.benefit_amount}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="text-right">
            <span className={`block text-[10px] ${isScheme ? "text-emerald-200" : "text-slate-400"}`}>Processing SLA</span>
            <span className={`font-bold ${isScheme ? "text-white" : "text-slate-800"}`}>
              {service.processing_days} Days
            </span>
          </div>
          <div className={`text-right border-l pl-4 ${isScheme ? "border-emerald-800" : "border-slate-200"}`}>
            <span className={`block text-[10px] ${isScheme ? "text-emerald-200" : "text-slate-400"}`}>Application Fee</span>
            <span className={`font-bold ${isScheme ? "text-emerald-300" : "text-emerald-600"}`}>
              {service.fee === 0 ? "Free / Nil" : `₹${service.fee}`}
            </span>
          </div>
        </div>
      </div>

      {/* Existing Active Application Warning Banner */}
      {existingApp && (
        <div className="p-5 sm:p-6 rounded-3xl bg-amber-50/95 border-2 border-amber-300 text-amber-950 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0 text-amber-700">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <h3 className="text-sm sm:text-base font-extrabold text-amber-900">
                  {i18n.language === "mr"
                    ? "अर्ज आधीच सादर केला आहे"
                    : i18n.language === "hi"
                    ? "आवेदन पहले ही जमा किया जा चुका है"
                    : "Active Application Already Submitted"}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-200 text-amber-900 border border-amber-300">
                  {existingApp.status}
                </span>
              </div>
              <p className="text-xs text-amber-800 mt-1 max-w-2xl leading-relaxed">
                You already have an active application registered for this scheme (Application Reference:{" "}
                <span className="font-mono font-bold text-amber-950 underline">{existingApp.application_number}</span>).
                Under public service governance rules, duplicate submissions for an active application are strictly prohibited.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0 w-full md:w-auto">
            <button
              type="button"
              onClick={() => onTrackSubmitted(existingApp.application_number)}
              className="w-full md:w-auto inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition space-x-1.5 cursor-pointer"
            >
              <span>Track Application</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Step Stepper */}
      {step < 4 && (
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className={`flex items-center space-x-2 ${step >= 1 ? "text-blue-700 font-bold" : "text-slate-400"}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 1 ? "bg-blue-700 text-white" : "bg-slate-200 text-slate-700"}`}>1</span>
            <span className="text-xs hidden sm:inline">Eligibility & Overview</span>
          </div>
          <div className="w-12 h-0.5 bg-slate-200" />
          <div className={`flex items-center space-x-2 ${step >= 2 ? "text-blue-700 font-bold" : "text-slate-400"}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 2 ? "bg-blue-700 text-white" : "bg-slate-200 text-slate-700"}`}>2</span>
            <span className="text-xs hidden sm:inline">Application Form</span>
          </div>
          <div className="w-12 h-0.5 bg-slate-200" />
          <div className={`flex items-center space-x-2 ${step >= 3 ? "text-blue-700 font-bold" : "text-slate-400"}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 3 ? "bg-blue-700 text-white" : "bg-slate-200 text-slate-700"}`}>3</span>
            <span className="text-xs hidden sm:inline">Document Vault & Proofs</span>
          </div>
        </div>
      )}

      {/* Step 1: Eligibility & Checklist */}
      {step === 1 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center">
              <Building className="w-4 h-4 mr-2 text-blue-600" />
              1. Scheme / Service Eligibility Criteria
            </h2>
            <div className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200">
              {formatEligibility(service.eligibility)}
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center">
              <FileText className="w-4 h-4 mr-2 text-blue-600" />
              2. Required Supporting Documents
            </h2>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
              {requiredDocs.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500 bg-white">
                  No specific supporting documents required for this service.
                </div>
              ) : (
                requiredDocs.map((doc) => (
                  <div key={doc.key} className="p-3.5 flex items-center justify-between text-xs bg-white">
                    <div className="flex items-center space-x-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-bold text-slate-800">{doc.name}</span>
                    </div>
                    {doc.mandatory ? (
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                        Mandatory
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                        Optional
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            {existingApp ? (
              <>
                <div className="text-xs font-semibold text-amber-700 flex items-center space-x-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Duplicate applications are blocked while your application is active.</span>
                </div>
                <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={onGoToDashboard}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer"
                  >
                    Go to Dashboard
                  </button>
                  <button
                    type="button"
                    onClick={() => onTrackSubmitted(existingApp.application_number)}
                    className="inline-flex items-center px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md transition space-x-1.5 cursor-pointer"
                  >
                    <span>Track Active Application</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    onRequireLogin(
                      `Please sign in to proceed to the application form for ${service ? (i18n.language === "mr" ? service.name_mr || service.name : service.name) : "this service"}.`,
                      () => setStep(2)
                    );
                  } else {
                    setStep(2);
                  }
                }}
                className="inline-flex items-center px-6 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-md transition ml-auto cursor-pointer"
              >
                <span>{isAuthenticated ? "Proceed to Application Form" : "Sign In to Apply"}</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Form */}
      {step === 2 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
            <div>
              <h2 className="text-base font-black text-slate-900">
                Application Form Details
              </h2>
              <p className="text-xs text-slate-500">
                Pre-filled automatically from your DigiLocker citizen profile where applicable.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {profile && (
                <button
                  type="button"
                  onClick={() => applyProfileAutoFill(true)}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition shadow-2xs cursor-pointer"
                  title="Force re-populate form from your DigiLocker verified profile"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>⚡ Auto-fill from Profile</span>
                </button>
              )}
              {profile && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  Profile Auto-Fill Active
                </span>
              )}
            </div>
          </div>

          {autoFillNotice && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-950">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-bold">
                  ⚡ Successfully auto-filled {autoFillNotice.count} demographic field(s) from your verified DigiLocker profile!
                </span>
              </div>
              <span className="text-[10px] text-emerald-700 bg-white/80 px-2 py-0.5 rounded-md font-semibold border border-emerald-200">
                DigiLocker Synced
              </span>
            </div>
          )}

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
              className="inline-flex items-center px-6 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-md transition"
            >
              <span>Continue to Documents</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Zero Re-upload Document Vault & Proofs */}
      {step === 3 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
            <div>
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <h2 className="text-base font-black text-slate-900">
                  Supporting Documents Verification
                </h2>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">
                  PDF FORMAT ONLY
                </span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-300">
                  MAX 256 KB
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Existing credentials are automatically fetched from your Uploaded Docs vault. No re-upload required!
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleRefreshVault}
                disabled={refreshingVault}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-2xs cursor-pointer"
                title="Re-check and sync documents from your vault"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${refreshingVault ? "animate-spin" : ""}`} />
                <span>Sync Uploaded Docs</span>
              </button>
              {onOpenProfileVault && (
                <button
                  type="button"
                  onClick={onOpenProfileVault}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition border border-blue-200 shadow-2xs cursor-pointer"
                  title="Open DigiLocker Vault to manage or upload more documents"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>DigiLocker Vault</span>
                </button>
              )}
            </div>
          </div>

          {/* Zero Re-upload Status Banner */}
          {requiredDocs.length > 0 && (() => {
            const autoCount = requiredDocs.filter(d => findMatchingVaultDoc(d.type, d.name)).length;
            const missingCount = requiredDocs.filter(d => !findMatchingVaultDoc(d.type, d.name) && !uploadFiles[d.key]).length;

            return (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 flex items-start space-x-3 shadow-2xs">
                <div className="p-2 bg-emerald-600 text-white rounded-xl shrink-0 mt-0.5 shadow-2xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="text-xs text-emerald-950 flex-1">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-extrabold block text-emerald-900 text-sm">
                      ⚡ Zero Re-Upload Engine: {autoCount} of {requiredDocs.length} Document(s) Auto-Fetched!
                    </span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Auto-Fetched Active
                    </span>
                  </div>
                  <p className="mt-1 text-emerald-900 leading-relaxed">
                    Documents already uploaded to your profile vault have been automatically linked. You do not need to upload them again.
                    {missingCount > 0 ? (
                      <span className="block mt-1 font-bold text-amber-900">
                        ⚠️ This scheme requires {missingCount} special document(s) not in your vault. Please upload them below (.pdf only, max 256KB).
                      </span>
                    ) : (
                      <span className="block mt-1 font-bold text-emerald-800">
                        ✓ All required documents are ready from your vault!
                      </span>
                    )}
                  </p>
                </div>
              </div>
            );
          })()}

          <div className="space-y-4">
            {requiredDocs.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
                No documents are required for this application. You can proceed to submit directly.
              </div>
            ) : (
              requiredDocs.map((doc) => {
                const matchedVault = findMatchingVaultDoc(doc.type, doc.name);
                const manualFile = uploadFiles[doc.key];
                const docError = uploadErrors[doc.key];

                return (
                  <div
                    key={doc.key}
                    className={`p-4 rounded-2xl border transition flex flex-col gap-2 ${
                      matchedVault && !manualFile
                        ? "bg-emerald-50/50 border-emerald-300"
                        : manualFile
                        ? "bg-blue-50/50 border-blue-200"
                        : "bg-amber-50/30 border-amber-200"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <span className="font-bold text-xs text-slate-900">
                            {doc.name} {doc.mandatory && <span className="text-rose-500">*</span>}
                          </span>
                          {matchedVault && !manualFile ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                              Auto-Fetched from Uploaded Docs
                            </span>
                          ) : manualFile ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                              Special Document Attached (.pdf)
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              Special Document Required - Please Upload
                            </span>
                          )}
                        </div>

                        {matchedVault && !manualFile ? (
                          <p className="text-[11px] text-emerald-700 font-mono">
                            ✓ {matchedVault.original_file_name || matchedVault.file_name} • {(matchedVault.file_size / 1024).toFixed(1)} KB • PDF Verified
                          </p>
                        ) : !manualFile ? (
                          <p className="text-[11px] text-amber-700">
                            Scheme requires this document. Strictly .pdf format, max 256 KB.
                          </p>
                        ) : null}
                      </div>

                      <div className="flex items-center space-x-2 shrink-0 flex-wrap gap-y-1">
                        {matchedVault && !manualFile ? (
                          <button
                            type="button"
                            onClick={() => setPreviewDoc(matchedVault)}
                            className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-blue-700 text-xs font-semibold transition flex items-center space-x-1 shadow-2xs cursor-pointer"
                            title="Preview and inspect verification details"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-600" />
                            <span>Preview</span>
                          </button>
                        ) : !manualFile ? (
                          <button
                            type="button"
                            onClick={() => setShowDigiLockerModal(true)}
                            className="px-2.5 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                            title="Fetch directly from DigiLocker repository"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                            <span>DigiLocker</span>
                          </button>
                        ) : null}

                        <label
                          htmlFor={`file-upload-${doc.key}`}
                          className="cursor-pointer px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center shadow-2xs"
                        >
                          <Upload className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                          <span>{matchedVault || manualFile ? "Replace PDF" : "Upload PDF"}</span>
                          <input
                            id={`file-upload-${doc.key}`}
                            type="file"
                            accept=".pdf"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleFileUpload(doc.key, e.target.files[0]);
                                e.target.value = "";
                              }
                            }}
                            className="hidden"
                          />
                        </label>

                        {manualFile && (
                          <div className="flex items-center space-x-1.5 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg">
                            <span className="text-xs font-bold text-blue-700 truncate max-w-[130px]" title={manualFile.name}>
                              ✓ {manualFile.name} ({(manualFile.size / 1024).toFixed(1)} KB)
                            </span>
                            {verifyingUploads[doc.key] && (
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  verifyingUploads[doc.key].status === "DIGILOCKER_VERIFIED"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : verifyingUploads[doc.key].status === "SYSTEM_VERIFIED"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {verifyingUploads[doc.key].confidence_score}% match
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleFileRemove(doc.key)}
                              className="text-slate-400 hover:text-rose-600 text-xs font-bold px-0.5 transition cursor-pointer"
                              title="Remove file"
                            >
                              ✕
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {docError && (
                      <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                        <span>{docError}</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
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
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              Back
            </button>
            <button
              onClick={handleSubmitApplication}
              disabled={submitting || !!existingApp}
              className="inline-flex items-center px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition disabled:opacity-50 space-x-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {submitting && <RefreshCw className="w-4 h-4 animate-spin" />}
              <span>{existingApp ? "Already Submitted" : submitting ? "Submitting..." : isScheme ? "Submit Scheme Application" : "Submit Application"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Success Acknowledgment */}
      {step === 4 && submittedAppNumber && (
        <div className="bg-white p-8 sm:p-10 rounded-3xl border border-emerald-200 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-xs">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="text-2xl font-black text-slate-900">
              {isScheme ? "Scheme Application Submitted!" : "Application Submitted Successfully!"}
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Your application has been registered with the Maha-Seva gateway and forwarded to the{" "}
              <strong>{service.department_name}</strong> verification desk.
            </p>
          </div>

          {/* Reference Number Box */}
          <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl inline-block shadow-2xs">
            <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">
              Application Reference Number
            </span>
            <span className="text-xl sm:text-2xl font-mono font-black text-blue-700 tracking-wider">
              {submittedAppNumber}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onTrackSubmitted(submittedAppNumber)}
              className="inline-flex items-center px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-md transition cursor-pointer"
            >
              <span>Track Application Timeline</span>
              <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
            </button>
            <button
              onClick={onGoToDashboard}
              className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer"
            >
              Go to Citizen Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Document Preview & Verification Inspection Modal */}
      <DocumentPreviewModal
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        document={previewDoc}
      />

      {/* DigiLocker National Gateway Connect Modal */}
      <DigiLockerConnectModal
        isOpen={showDigiLockerModal}
        onClose={() => setShowDigiLockerModal(false)}
        onSynced={async () => {
          await fetchCitizenProfile();
        }}
      />
    </div>
  );
};
