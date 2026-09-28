import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import api, { API_BASE_URL } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { CitizenProfile, VaultDocument } from "../types";
import {
  X,
  User,
  ShieldCheck,
  FileText,
  Upload,
  Download,
  Trash2,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Building,
  LandPlot,
  GraduationCap,
  Sparkles,
  Save,
  Clock,
  RefreshCw,
  LogOut,
  MapPin,
  Plus,
  FileCheck,
  Eye,
  ExternalLink,
  ShieldAlert,
  BarChart3
} from "lucide-react";
import { DigiLockerConnectModal } from "./DigiLockerConnectModal";
import { DocumentPreviewModal, PreviewableDocument } from "./DocumentPreviewModal";

interface CitizenProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated?: (profile: CitizenProfile) => void;
  onNavigate?: (tab: string, param?: any) => void;
  initialTab?: "profile" | "uploaded-docs" | "vault";
}

interface StandardDocMeta {
  type: string;
  name: string;
  name_mr: string;
  name_hi: string;
  description: string;
  icon: any;
  color: string;
}

const STANDARD_VAULT_DOCS: StandardDocMeta[] = [
  {
    type: "AADHAAR",
    name: "Aadhaar Card",
    name_mr: "आधार कार्ड",
    name_hi: "आधार कार्ड",
    description: "12-digit Unique Identification proof with biometric validation",
    icon: CreditCard,
    color: "from-blue-500 to-indigo-600"
  },
  {
    type: "PAN",
    name: "PAN Card",
    name_mr: "पॅन कार्ड",
    name_hi: "पैन कार्ड",
    description: "Permanent Account Number for tax identification and MSME subsidies",
    icon: CreditCard,
    color: "from-purple-500 to-indigo-600"
  },
  {
    type: "LAND_RECORD",
    name: "7/12 Land Record (Satbara Extract)",
    name_mr: "७/१२ सातबारा व ८-अ उतारा",
    name_hi: "7/12 भू-अभिलेख खसरा / खतौनी",
    description: "Certified land ownership record for agriculture & crop insurance schemes",
    icon: LandPlot,
    color: "from-emerald-500 to-teal-600"
  },
  {
    type: "INCOME_CERT",
    name: "Income Certificate (Tehsildar)",
    name_mr: "तहसीलदार उत्पन्न प्रमाणपत्र",
    name_hi: "तहसीलदार आय प्रमाण पत्र",
    description: "Competent authority verified annual family income certificate",
    icon: FileText,
    color: "from-amber-500 to-orange-600"
  },
  {
    type: "DOMICILE_CERT",
    name: "Domicile & Residence Certificate",
    name_mr: "अधिवास व रहिवासी प्रमाणपत्र",
    name_hi: "मूल निवास / अधिवास प्रमाण पत्र",
    description: "Proof of permanent state residency for state quota & benefits",
    icon: Building,
    color: "from-cyan-500 to-blue-600"
  },
  {
    type: "MARKSHEET",
    name: "Educational Marksheet / Degree",
    name_mr: "१० वी/१२ वी/पदवी गुणपत्रिका",
    name_hi: "10वीं/12वीं/डिग्री अंकतालिका",
    description: "Educational qualification certificate for scholarship & skill grants",
    icon: GraduationCap,
    color: "from-rose-500 to-pink-600"
  },
  {
    type: "BANK_PASSBOOK",
    name: "Bank Passbook / Cancelled Cheque",
    name_mr: "बँक पासबुक (आधार लिंक)",
    name_hi: "बैंक पासबुक (आधार सीडेड)",
    description: "Aadhaar seeded bank account for direct benefit transfer (DBT)",
    icon: Building,
    color: "from-emerald-600 to-green-700"
  },
  {
    type: "RATION_CARD",
    name: "Ration Card (Yellow/Orange/White)",
    name_mr: "रेशन कार्ड (पिवळे/केशरी/पांढरे)",
    name_hi: "राशन कार्ड (राष्ट्रीय खाद्य सुरक्षा)",
    description: "Food and civil supplies beneficiary household card",
    icon: FileText,
    color: "from-violet-500 to-purple-600"
  }
];

export const MAX_DOC_SIZE_BYTES = 256 * 1024; // 256 KB strictly

export const validatePdfFile = (file: File): string | null => {
  const isPdf = file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf";
  if (!isPdf) {
    return `Invalid format. All documents must strictly be in PDF format (.pdf). Selected file: "${file.name}"`;
  }
  if (file.size > MAX_DOC_SIZE_BYTES) {
    const sizeKb = (file.size / 1024).toFixed(1);
    return `File exceeds maximum permissible size of 256 KB (selected file is ${sizeKb} KB). Please upload a compressed PDF under 256 KB.`;
  }
  return null;
};

export const CitizenProfileDrawer: React.FC<CitizenProfileDrawerProps> = ({
  isOpen,
  onClose,
  onProfileUpdated,
  onNavigate,
  initialTab,
}) => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<"profile" | "uploaded-docs">(
    initialTab === "uploaded-docs" ? "uploaded-docs" : "profile"
  );
  const [profile, setProfile] = useState<CitizenProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Document in-app preview modal state
  const [previewDoc, setPreviewDoc] = useState<VaultDocument | null>(null);
  const authToken = localStorage.getItem("mahaseva_token") || "";

  // DigiLocker and Verification modal states
  const [showDigiLockerModal, setShowDigiLockerModal] = useState(false);
  const [verifyingDocId, setVerifyingDocId] = useState<number | null>(null);

  // Upload New / Custom Document state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newDocCategory, setNewDocCategory] = useState("AADHAAR");
  const [customDocTitle, setCustomDocTitle] = useState("");
  const [newDocFile, setNewDocFile] = useState<File | null>(null);
  const [newDocValidationError, setNewDocValidationError] = useState<string | null>(null);
  const [isUploadingCustom, setIsUploadingCustom] = useState(false);

  // Form edit states
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [stateCode, setStateCode] = useState("MH");
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [address, setAddress] = useState("");
  const [casteCategory, setCasteCategory] = useState("OBC");
  const [beneficiaryCategory, setBeneficiaryCategory] = useState("FARMER");
  const [bankAccount, setBankAccount] = useState("");
  const [bankIfsc, setBankIfsc] = useState("");
  const [bankName, setBankName] = useState("");

  // Additional demographic & residence auto-fill state
  const [district, setDistrict] = useState("Pune");
  const [taluka, setTaluka] = useState("Haveli");
  const [village, setVillage] = useState("Ambegaon");
  const [pincode, setPincode] = useState("411030");
  const [residenceYears, setResidenceYears] = useState<number | string>(30);
  const [placeOfBirth, setPlaceOfBirth] = useState("Pune, Maharashtra");
  const [dob, setDob] = useState("1994-05-15");
  const [gender, setGender] = useState("Male");
  const [maritalStatus, setMaritalStatus] = useState("Married");
  const [fatherOrSpouseName, setFatherOrSpouseName] = useState("");
  const [subCaste, setSubCaste] = useState("");
  const [rationCardNo, setRationCardNo] = useState("");
  const [annualIncome, setAnnualIncome] = useState<number | string>(180000);

  useEffect(() => {
    if (isOpen) {
      loadProfile();
      setMsg(null);
      if (initialTab) {
        setActiveTab(initialTab === "uploaded-docs" ? "uploaded-docs" : "profile");
      }
    }
  }, [isOpen, initialTab]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get("/citizen/profile");
      const p: CitizenProfile = res.data;
      setProfile(p);
      setFullName(p.full_name || "");
      setPhone(p.phone || "");
      setStateCode(p.state_code || "MH");
      setAadhaarNumber(p.aadhaar_number || "");
      setPanNumber(p.pan_number || "");
      setAddress(p.profile_data?.address || "");
      setCasteCategory(p.profile_data?.caste_category || "GENERAL");
      setBeneficiaryCategory(p.profile_data?.beneficiary_category || "GENERAL");
      setBankAccount(p.profile_data?.bank_account_number || "");
      setBankIfsc(p.profile_data?.bank_ifsc || "");
      setBankName(p.profile_data?.bank_name || "");

      // Residence & demographics
      setDistrict(p.profile_data?.district || "Pune");
      setTaluka(p.profile_data?.taluka || "Haveli");
      setVillage(p.profile_data?.village || "Ambegaon");
      setPincode(p.profile_data?.pincode || "411030");
      setResidenceYears(p.profile_data?.residence_years !== undefined ? p.profile_data.residence_years : 30);
      setPlaceOfBirth(p.profile_data?.place_of_birth || (p.profile_data?.district ? `${p.profile_data.district}, ${p.state_code || "Maharashtra"}` : "Pune, Maharashtra"));
      setDob(p.profile_data?.dob || "1994-05-15");
      setGender(p.profile_data?.gender || "Male");
      setMaritalStatus(p.profile_data?.marital_status || "Married");
      setFatherOrSpouseName(p.profile_data?.father_or_spouse_name || "");
      setSubCaste(p.profile_data?.sub_caste || "");
      setRationCardNo(p.profile_data?.ration_card_no || "");
      setAnnualIncome(p.profile_data?.annual_family_income !== undefined ? p.profile_data.annual_family_income : (p.profile_data?.annual_income !== undefined ? p.profile_data.annual_income : 180000));
    } catch (err: any) {
      console.error(err);
      setMsg({ type: "error", text: "Failed to load profile. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const payload = {
        full_name: fullName,
        phone,
        state_code: stateCode,
        aadhaar_number: aadhaarNumber,
        pan_number: panNumber,
        address,
        caste_category: casteCategory,
        beneficiary_category: beneficiaryCategory,
        bank_account_number: bankAccount,
        bank_ifsc: bankIfsc,
        bank_name: bankName,
        district,
        taluka,
        village,
        pincode,
        residence_years: Number(residenceYears) || 30,
        place_of_birth: placeOfBirth,
        dob,
        gender,
        marital_status: maritalStatus,
        father_or_spouse_name: fatherOrSpouseName,
        sub_caste: subCaste,
        ration_card_no: rationCardNo,
        annual_family_income: Number(annualIncome) || 180000,
        profile_data: {
          district,
          taluka,
          village,
          pincode,
          residence_years: Number(residenceYears) || 30,
          place_of_birth: placeOfBirth,
          dob,
          gender,
          marital_status: maritalStatus,
          father_or_spouse_name: fatherOrSpouseName,
          sub_caste: subCaste,
          ration_card_no: rationCardNo,
          annual_family_income: Number(annualIncome) || 180000,
        },
      };
      const res = await api.put("/citizen/profile", payload);
      setProfile(res.data);
      if (onProfileUpdated) onProfileUpdated(res.data);
      setMsg({ type: "success", text: "Citizen demographics and identity saved successfully!" });
    } catch (err: any) {
      setMsg({
        type: "error",
        text: err.response?.data?.detail || "Failed to update profile. Please check inputs.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUploadVaultDoc = async (docType: string, file: File) => {
    const valError = validatePdfFile(file);
    if (valError) {
      setMsg({ type: "error", text: valError });
      return;
    }

    setUploadingType(docType);
    setMsg(null);
    try {
      const formData = new FormData();
      formData.append("document_type", docType);
      formData.append("file", file);

      await api.post("/citizen/vault/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await loadProfile();
      setMsg({
        type: "success",
        text: `✓ ${docType.replace(/_/g, " ")} successfully uploaded (.pdf, ${(file.size / 1024).toFixed(1)} KB) and ready for zero re-upload scheme applications.`,
      });
    } catch (err: any) {
      setMsg({
        type: "error",
        text: err.response?.data?.detail || "File upload failed. Ensure document is strictly in .pdf format and under 256 KB.",
      });
    } finally {
      setUploadingType(null);
    }
  };

  const handleReverifyVaultDoc = async (docId: number) => {
    setVerifyingDocId(docId);
    try {
      const res = await api.post(`/citizen/vault/${docId}/verify`);
      if (profile) {
        const updatedVault = profile.vault_documents.map((d) => (d.id === docId ? res.data : d));
        const updatedProfile = { ...profile, vault_documents: updatedVault };
        setProfile(updatedProfile);
        if (onProfileUpdated) onProfileUpdated(updatedProfile);
      }
      setMsg({
        type: "success",
        text: "Document verified through system automated engine! Status: " + res.data.verification_status
      });
    } catch (err: any) {
      setMsg({
        type: "error",
        text: "Verification check failed: " + (err?.response?.data?.detail || err.message)
      });
    } finally {
      setVerifyingDocId(null);
    }
  };

  const handleDigiLockerSynced = (newDocs: VaultDocument[]) => {
    if (profile) {
      const existingMap = new Map(profile.vault_documents.map((d) => [d.document_type, d]));
      newDocs.forEach((d) => existingMap.set(d.document_type, d));
      const updatedProfile = {
        ...profile,
        vault_documents: Array.from(existingMap.values())
      };
      setProfile(updatedProfile);
      if (onProfileUpdated) onProfileUpdated(updatedProfile);
    }
    setMsg({
      type: "success",
      text: `DigiLocker synchronization complete! ${newDocs.length} certificate(s) verified and stored in your vault.`
    });
  };

  const handleCustomDocSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocFile) {
      setNewDocValidationError("Please choose a PDF file to upload.");
      return;
    }
    const valError = validatePdfFile(newDocFile);
    if (valError) {
      setNewDocValidationError(valError);
      return;
    }

    let finalType = newDocCategory;
    if (newDocCategory === "CUSTOM") {
      if (!customDocTitle.trim()) {
        setNewDocValidationError("Please enter a custom document name.");
        return;
      }
      finalType = customDocTitle.trim().toUpperCase().replace(/[^A-Z0-9]/g, "_");
    }

    setIsUploadingCustom(true);
    setNewDocValidationError(null);
    try {
      const formData = new FormData();
      formData.append("document_type", finalType);
      formData.append("file", newDocFile);

      await api.post("/citizen/vault/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await loadProfile();
      setMsg({
        type: "success",
        text: `✓ ${customDocTitle || finalType.replace(/_/g, " ")} successfully uploaded (.pdf, ${(newDocFile.size / 1024).toFixed(1)} KB)!`,
      });
      setShowUploadModal(false);
      setNewDocFile(null);
      setCustomDocTitle("");
    } catch (err: any) {
      setNewDocValidationError(err.response?.data?.detail || "Upload failed. Ensure file is .pdf and under 256KB.");
    } finally {
      setIsUploadingCustom(false);
    }
  };

  const handleDeleteVaultDoc = async (docId: number, docType: string) => {
    if (!window.confirm(`Are you sure you want to remove ${docType} from your vault?`)) return;
    try {
      await api.delete(`/citizen/vault/${docId}`);
      await loadProfile();
      setMsg({ type: "success", text: `${docType} removed from vault.` });
    } catch (err: any) {
      setMsg({ type: "error", text: "Failed to delete vault document." });
    }
  };

  if (!isOpen) return null;

  const getDocFromVault = (type: string): VaultDocument | undefined => {
    return profile?.vault_documents?.find((d) => d.document_type === type);
  };

  const uploadedCount = profile?.vault_documents?.length || 0;

  const renderOfficerProfile = () => (
    <form onSubmit={handleSaveProfile} className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200/80 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-xs shrink-0">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-indigo-950 uppercase tracking-wider">
              Departmental Officer Credentials
            </h4>
            <p className="text-xs text-indigo-800/80 mt-0.5">
              Authorized public service verification authority for {user?.state_code || "MH"} jurisdiction.
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-800 border border-indigo-300">
          OFFICER ID #{user?.department_id || 1}
        </span>
      </div>

      {/* Identity Information */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
        <h4 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-2 flex items-center">
          <User className="w-4 h-4 mr-2 text-indigo-600" />
          Official Identity & Contact Details
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Full Legal Officer Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Official Contact Phone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Official Government Email
            </label>
            <input
              type="email"
              value={user?.email || ""}
              disabled
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Jurisdiction State
            </label>
            <input
              type="text"
              value={`${user?.state_code || "MH"} - Maharashtra State Administration`}
              disabled
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Statutory Department Details */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
        <h4 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-2 flex items-center">
          <ShieldCheck className="w-4 h-4 mr-2 text-indigo-600" />
          Statutory Clearance & Department Designation
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Assigned Department</span>
            <span className="font-extrabold text-slate-900 mt-0.5 block">Department of Revenue & Citizen Records</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Designation</span>
            <span className="font-extrabold text-slate-900 mt-0.5 block">Competent Verification Officer</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Statutory Authority</span>
            <span className="font-extrabold text-slate-900 mt-0.5 block">Section 4, Maharashtra Right to Services Act</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Security Clearance</span>
            <span className="font-extrabold text-emerald-700 mt-0.5 block">✓ Level-2 eSign & DSC Authorized</span>
          </div>
        </div>
      </div>

      {/* Officer Verification Desk Action */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-5 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-indigo-300 text-xs font-bold uppercase">
            <Building className="w-4 h-4" />
            <span>Official Verification Queue</span>
          </div>
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/40">
            RTS Statutory
          </span>
        </div>
        <p className="text-xs text-indigo-200 leading-relaxed">
          Review submitted citizen applications, inspect uploaded PDF proofs, verify land records & income certificates, and grant digital statutory approvals.
        </p>
        <button
          type="button"
          onClick={() => {
            onClose();
            if (onNavigate) onNavigate("officer-workbench");
          }}
          className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-extrabold text-xs transition shadow-lg flex items-center space-x-2 cursor-pointer"
        >
          <span>Open Officer Verification Desk</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition flex items-center space-x-2 cursor-pointer"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save Officer Profile</span>
        </button>
      </div>
    </form>
  );

  const renderAdminProfile = () => (
    <form onSubmit={handleSaveProfile} className="space-y-6">
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200/80 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-purple-700 text-white rounded-xl shadow-xs shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-purple-950 uppercase tracking-wider">
              Platform Super Administrator
            </h4>
            <p className="text-xs text-purple-800/80 mt-0.5">
              National federation authority & multi-tenant public service governance.
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-300">
          ROOT CLEARANCE
        </span>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
        <h4 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-2 flex items-center">
          <User className="w-4 h-4 mr-2 text-purple-600" />
          Administrator Credentials & Identity
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Administrator Legal Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Emergency Contact Mobile
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Admin Email Address
            </label>
            <input
              type="email"
              value={user?.email || ""}
              disabled
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Administrative Scope
            </label>
            <input
              type="text"
              value="All-India Federation & Multi-State Gateway"
              disabled
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
        <h4 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-2 flex items-center">
          <ShieldCheck className="w-4 h-4 mr-2 text-purple-600" />
          Platform Security Clearances
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Clearance Level</span>
            <span className="font-extrabold text-purple-900 mt-0.5 block">Level-5 Root Administrator</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Audit Stream Ledger</span>
            <span className="font-extrabold text-emerald-700 mt-0.5 block">✓ Immutable SHA-256 Active</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Multi-Tenant Access</span>
            <span className="font-extrabold text-slate-900 mt-0.5 block">28 States & 8 Union Territories</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Two-Factor Authentication</span>
            <span className="font-extrabold text-emerald-700 mt-0.5 block">✓ Enforced (OTP & Biometric)</span>
          </div>
        </div>
      </div>

      {/* Super Admin Telemetry Action */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white rounded-2xl p-5 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-purple-300 text-xs font-bold uppercase">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Platform Governance Console</span>
          </div>
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-200 border border-purple-400/40">
            Root Access
          </span>
        </div>
        <p className="text-xs text-purple-200 leading-relaxed">
          Monitor departmental SLA metrics, inspect cross-state public service performance, review immutable security audit logs, and oversee all 28 states & 8 UTs.
        </p>
        <button
          type="button"
          onClick={() => {
            onClose();
            if (onNavigate) onNavigate("admin-dashboard");
          }}
          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs transition shadow-lg flex items-center space-x-2 cursor-pointer"
        >
          <span>Open Administrator Telemetry Console</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-md hover:shadow-lg transition flex items-center space-x-2 cursor-pointer"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save Administrator Profile</span>
        </button>
      </div>
    </form>
  );

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-fade-in"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-2xl bg-white shadow-2xl border-l border-slate-200 flex flex-col transform transition ease-in-out duration-300">
          {/* Drawer Header */}
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 px-6 py-6 text-white relative">
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 p-0.5 shadow-lg shrink-0">
                <div className="w-full h-full rounded-[14px] bg-slate-900 flex items-center justify-center font-extrabold text-xl text-amber-300">
                  {user?.full_name ? user.full_name.charAt(0).toUpperCase() : (profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : "U")}
                </div>
              </div>
              <div className="flex-1 min-w-0 pr-8">
                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                  <h2 className="text-xl font-black text-white tracking-tight truncate">
                    {profile?.full_name || user?.full_name || "User Profile"}
                  </h2>
                  {user?.role === "SUPER_ADMIN" ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 shrink-0">
                      <ShieldCheck className="w-3 h-3 mr-1 text-amber-400" />
                      Super Administrator
                    </span>
                  ) : user?.role === "OFFICER" || user?.role === "DEPARTMENT_ADMIN" ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
                      <Building className="w-3 h-3 mr-1 text-indigo-300" />
                      Official Government Desk
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                      <ShieldCheck className="w-3 h-3 mr-1 text-emerald-400" />
                      DigiLocker Verified
                    </span>
                  )}
                </div>
                <p className="text-xs text-blue-200 font-medium mt-0.5 truncate">
                  {user?.email || profile?.email} • {user?.role === "SUPER_ADMIN" ? "National & Multi-State Jurisdiction" : user?.role === "OFFICER" ? `Department ID #${user?.department_id || 1} • ${user?.state_code || "MH"} Jurisdiction` : `${profile?.state_code || user?.state_code || "MH"} Resident`}
                </p>

                {/* Account Actions: Switch Role & Sign Out */}
                <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-white/10">
                  <button
                    onClick={() => {
                      logout();
                      onClose();
                      if (onNavigate) onNavigate("login");
                    }}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/15 transition shadow-2xs cursor-pointer"
                    title="Switch to another citizen, officer or admin account"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-amber-300" />
                    <span>Switch Role</span>
                  </button>
                  <button
                    onClick={() => {
                      logout();
                      onClose();
                      if (onNavigate) onNavigate("home");
                    }}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 hover:text-white border border-rose-400/30 transition shadow-2xs cursor-pointer"
                    title="Sign out of Maha-Seva Portal"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-300" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Sub-nav Tabs */}
            <div className="flex items-center space-x-2 mt-6 bg-white/10 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab("profile")}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
                  activeTab === "profile"
                    ? "bg-white text-blue-900 shadow-xs"
                    : "text-white/80 hover:text-white hover:bg-white/5"
                }`}
              >
                <User className={`w-3.5 h-3.5 ${activeTab === "profile" ? "text-blue-900" : "text-white/80"}`} />
                <span>
                  {user?.role === "SUPER_ADMIN"
                    ? "Admin Profile"
                    : user?.role === "OFFICER" || user?.role === "DEPARTMENT_ADMIN"
                    ? "Officer Profile"
                    : "Citizen Profile"}
                </span>
              </button>
              <button
                onClick={() => setActiveTab("uploaded-docs")}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
                  activeTab === "uploaded-docs"
                    ? "bg-white text-blue-900 shadow-xs"
                    : "text-white/80 hover:text-white hover:bg-white/5"
                }`}
              >
                <FileText className={`w-3.5 h-3.5 ${activeTab === "uploaded-docs" ? "text-blue-900" : "text-white/80"}`} />
                <span>Documents & Vault ({uploadedCount})</span>
              </button>
            </div>
          </div>

          {/* Feedback message */}
          {msg && (
            <div
              className={`px-6 py-3 text-xs font-semibold flex items-center justify-between ${
                msg.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border-b border-emerald-200"
                  : "bg-rose-50 text-rose-800 border-b border-rose-200"
              }`}
            >
              <div className="flex items-center space-x-2">
                {msg.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{msg.text}</span>
              </div>
              <button onClick={() => setMsg(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mb-3" />
                <p className="text-xs font-semibold">Loading your verified profile...</p>
              </div>
            ) : activeTab === "uploaded-docs" ? (
              /* TAB 1: UPLOADED DOCS VAULT */
              <div className="space-y-6">
                {/* Information Banner */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl p-4 shadow-2xs">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs shrink-0 mt-0.5">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="text-xs text-blue-900 leading-relaxed flex-1">
                      <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                        <strong className="text-sm font-bold text-blue-950">
                          Uploaded Docs | Zero Re-Upload Engine
                        </strong>
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">
                            PDF ONLY
                          </span>
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-300">
                            MAX 256 KB
                          </span>
                        </div>
                      </div>
                      Upload your documents once. When applying for government schemes (like <strong>PM-KISAN</strong>, <strong>Ladki Bahin</strong>, or <strong>Scholarships</strong>), your uploaded documents will be <strong>automatically fetched</strong> without needing to upload them again!
                    </div>
                  </div>
                </div>

                {/* Upload New Document Form / Modal Toggle */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900 flex items-center">
                        <FileCheck className="w-4 h-4 mr-2 text-blue-600" />
                        Upload Document
                      </h4>
                      <p className="text-xs text-slate-500">
                        Upload standard certificates or custom supporting files (.pdf format strictly, max 256KB).
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowUploadModal(!showUploadModal)}
                      className="px-3.5 py-1.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-2xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{showUploadModal ? "Hide Form" : "Upload Document"}</span>
                    </button>
                  </div>

                  {showUploadModal && (
                    <form onSubmit={handleCustomDocSubmit} className="pt-3 border-t border-slate-100 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Document Type / Category
                          </label>
                          <select
                            value={newDocCategory}
                            onChange={(e) => {
                              setNewDocCategory(e.target.value);
                              setNewDocValidationError(null);
                            }}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          >
                            <option value="AADHAAR">Aadhaar Card (12-Digit UID)</option>
                            <option value="PAN">PAN Card</option>
                            <option value="LAND_RECORD">7/12 Land Record (Satbara Extract)</option>
                            <option value="INCOME_CERT">Income Certificate (Tehsildar)</option>
                            <option value="DOMICILE_CERT">Domicile & Residence Certificate</option>
                            <option value="MARKSHEET">Educational Marksheet / Degree</option>
                            <option value="BANK_PASSBOOK">Bank Passbook / Cancelled Cheque</option>
                            <option value="RATION_CARD">Ration Card</option>
                            <option value="CASTE_CERT">Caste / Tribe Certificate</option>
                            <option value="DISABILITY_CERT">Disability / Divyangjan Certificate</option>
                            <option value="UTILITY_BILL">Electricity / Utility Bill</option>
                            <option value="CUSTOM">Custom / Special Supporting Document</option>
                          </select>
                        </div>

                        {newDocCategory === "CUSTOM" && (
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              Custom Document Title
                            </label>
                            <input
                              type="text"
                              value={customDocTitle}
                              onChange={(e) => setCustomDocTitle(e.target.value)}
                              placeholder="e.g. Crop Loss Survey Report"
                              required
                              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                          </div>
                        )}

                        <div className={newDocCategory === "CUSTOM" ? "sm:col-span-2" : ""}>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Select PDF File (Strictly .PDF • Max 256 KB)
                          </label>
                          <div className="flex items-center space-x-2">
                            <label className="cursor-pointer px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-bold transition flex items-center shadow-2xs">
                              <Upload className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                              <span>{newDocFile ? "Change PDF" : "Choose PDF File"}</span>
                              <input
                                type="file"
                                accept=".pdf"
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (f) {
                                    const valErr = validatePdfFile(f);
                                    if (valErr) {
                                      setNewDocValidationError(valErr);
                                      setNewDocFile(null);
                                    } else {
                                      setNewDocValidationError(null);
                                      setNewDocFile(f);
                                    }
                                  }
                                }}
                                className="hidden"
                              />
                            </label>
                            {newDocFile && (
                              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-xl truncate max-w-[250px]">
                                ✓ {newDocFile.name} ({(newDocFile.size / 1024).toFixed(1)} KB)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {newDocValidationError && (
                        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center space-x-2">
                          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                          <span>{newDocValidationError}</span>
                        </div>
                      )}

                      <div className="flex justify-end space-x-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setShowUploadModal(false);
                            setNewDocFile(null);
                            setNewDocValidationError(null);
                          }}
                          className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isUploadingCustom || !newDocFile}
                          className="px-5 py-1.5 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-xs cursor-pointer"
                        >
                          {isUploadingCustom && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                          <span>{isUploadingCustom ? "Uploading..." : "Save to Vault"}</span>
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* Section: DigiLocker National Gateway Integration Banner */}
                <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-sky-900 text-white rounded-2xl p-4.5 sm:p-5 shadow-sm border border-blue-950 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start space-x-3.5">
                    <div className="w-11 h-11 rounded-xl bg-white p-2 flex items-center justify-center shadow-md shrink-0">
                      <div className="w-full h-full rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black text-xl">
                        <ShieldCheck className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 flex-wrap">
                        <h4 className="text-sm font-black text-white">DigiLocker Government Repository</h4>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-sky-400/20 text-sky-200 border border-sky-300/30">
                          MeitY Rule 9A Certified
                        </span>
                      </div>
                      <p className="text-xs text-blue-100 mt-1 max-w-xl leading-relaxed">
                        Instantly pull your verified Aadhaar, PAN, 7/12 Land Record, Income &amp; Domicile certificates from DigiLocker into your vault.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDigiLockerModal(true)}
                    className="px-4 py-2.5 rounded-xl bg-white hover:bg-blue-50 text-blue-950 font-black text-xs transition shadow-md flex items-center space-x-2 shrink-0 self-start sm:self-center cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>Open DigiLocker Gateway</span>
                  </button>
                </div>

                {/* Section: All Uploaded Documents */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black text-slate-900 flex items-center">
                      <FileText className="w-4 h-4 mr-1.5 text-emerald-600" />
                      All Vault Documents ({uploadedCount})
                    </h4>
                    <span className="text-[10px] text-slate-500 font-semibold">
                      Automated Authenticity Engine Enabled
                    </span>
                  </div>

                  {uploadedCount === 0 ? (
                    <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-300 space-y-2">
                      <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                      <p className="text-xs font-bold text-slate-700">No documents uploaded yet.</p>
                      <p className="text-[11px] text-slate-500">
                        Upload your PDF documents or fetch directly from DigiLocker to enable instant 1-click scheme applications!
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {profile?.vault_documents?.map((doc) => {
                        const standardMeta = STANDARD_VAULT_DOCS.find((m) => m.type === doc.document_type);
                        const isUploadingThis = uploadingType === doc.document_type;
                        const isVerifyingThis = verifyingDocId === doc.id;
                        const docDisplayName = standardMeta
                          ? i18n.language === "mr"
                            ? standardMeta.name_mr
                            : i18n.language === "hi"
                            ? standardMeta.name_hi
                            : standardMeta.name
                          : doc.document_type.replace(/_/g, " ");

                        const status = doc.verification_status || "UPLOADED";
                        const score = doc.confidence_score || doc.verification_details?.confidence_score || (status.includes("VERIFIED") ? 98 : 60);

                        return (
                          <div
                            key={doc.id}
                            className="bg-white rounded-2xl border border-slate-200 hover:border-blue-300 p-4 shadow-2xs transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="flex items-start space-x-3 min-w-0">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shrink-0 shadow-2xs">
                                <FileText className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                                  <span className="text-xs font-extrabold text-slate-900">
                                    {docDisplayName}
                                  </span>

                                  {/* Verification status badge */}
                                  {status === "DIGILOCKER_VERIFIED" ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                      <ShieldCheck className="w-3 h-3 mr-1 text-emerald-600" />
                                      DigiLocker Certified
                                    </span>
                                  ) : status === "SYSTEM_VERIFIED" || status === "VERIFIED" ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                                      <CheckCircle2 className="w-3 h-3 mr-1 text-blue-600" />
                                      System Verified ({score}%)
                                    </span>
                                  ) : status === "NEEDS_REVIEW" ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                      <AlertCircle className="w-3 h-3 mr-1 text-amber-600" />
                                      Needs Review
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                                      <Clock className="w-3 h-3 mr-1 text-slate-500" />
                                      Uploaded
                                    </span>
                                  )}
                                </div>

                                {doc.issuer && (
                                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                    Issuer: <span className="font-medium text-slate-700">{doc.issuer}</span>
                                  </p>
                                )}

                                <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-1 font-mono flex-wrap">
                                  <span className="text-slate-700 font-semibold truncate max-w-[200px]" title={doc.original_file_name || doc.file_name}>
                                    {doc.original_file_name || doc.file_name}
                                  </span>
                                  <span>•</span>
                                  <span className="font-bold text-slate-600">{(doc.file_size / 1024).toFixed(1)} KB</span>
                                  <span>•</span>
                                  <span>{new Date(doc.uploaded_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                                </div>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center space-x-2 self-end sm:self-center shrink-0">
                              <button
                                type="button"
                                onClick={() => setPreviewDoc(doc)}
                                className="px-3 py-1.5 rounded-xl border border-slate-200 hover:border-blue-300 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-bold transition flex items-center space-x-1.5 shadow-2xs cursor-pointer"
                                title="Preview PDF Document & Inspect System Verification"
                              >
                                <Eye className="w-3.5 h-3.5 text-blue-600" />
                                <span>Preview</span>
                              </button>

                              <button
                                type="button"
                                disabled={isVerifyingThis}
                                onClick={() => handleReverifyVaultDoc(doc.id)}
                                className="p-2 rounded-xl border border-slate-200 hover:border-indigo-300 bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 text-xs font-bold transition flex items-center shadow-2xs cursor-pointer"
                                title="Re-run automated verification engine"
                              >
                                <RefreshCw className={`w-3.5 h-3.5 ${isVerifyingThis ? "animate-spin text-indigo-600" : ""}`} />
                              </button>

                              <a
                                href={`${API_BASE_URL}/documents/${doc.id}/download?token=${encodeURIComponent(authToken)}`}
                                download={doc.original_file_name || `${doc.document_type}.pdf`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2 rounded-xl border border-slate-200 hover:border-blue-300 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-bold transition flex items-center shadow-2xs cursor-pointer"
                                title="Direct Download PDF"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>

                              <label
                                className={`px-3 py-1.5 rounded-xl border border-slate-200 hover:border-blue-300 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-bold cursor-pointer transition flex items-center space-x-1 shadow-2xs ${
                                  isUploadingThis ? "opacity-50 pointer-events-none" : ""
                                }`}
                                title="Replace with updated PDF (Max 256KB)"
                              >
                                <input
                                  type="file"
                                  accept=".pdf"
                                  className="hidden"
                                  onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) handleUploadVaultDoc(doc.document_type, f);
                                    e.target.value = "";
                                  }}
                                />
                                {isUploadingThis ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                                ) : (
                                  <Upload className="w-3.5 h-3.5" />
                                )}
                                <span>Replace</span>
                              </label>

                              <button
                                onClick={() => handleDeleteVaultDoc(doc.id, docDisplayName)}
                                className="p-2 rounded-xl border border-slate-200 hover:border-rose-300 bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition cursor-pointer"
                                title="Delete from vault"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Common Scheme Credentials Checklist */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-sm font-black text-slate-900 flex items-center">
                    <ShieldCheck className="w-4 h-4 mr-1.5 text-blue-600" />
                    Standard Scheme Credentials Checklist
                  </h4>
                  <p className="text-xs text-slate-500">
                    Having these 8 standard documents stored in your vault ensures seamless instant application across all government welfare schemes.
                  </p>

                  <div className="grid grid-cols-1 gap-3">
                    {STANDARD_VAULT_DOCS.map((meta) => {
                      const vaultDoc = getDocFromVault(meta.type);
                      const isUploading = uploadingType === meta.type;
                      const Icon = meta.icon;

                      return (
                        <div
                          key={meta.type}
                          className={`rounded-2xl border transition p-3.5 ${
                            vaultDoc
                              ? "bg-white border-emerald-200/80 shadow-2xs"
                              : "bg-white/80 border-dashed border-slate-300 hover:border-blue-400"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center space-x-3 min-w-0">
                              <div
                                className={`w-9 h-9 rounded-xl bg-gradient-to-br ${meta.color} flex items-center justify-center text-white shadow-2xs shrink-0`}
                              >
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center space-x-2">
                                  <h5 className="text-xs font-extrabold text-slate-900 truncate">
                                    {i18n.language === "mr"
                                      ? meta.name_mr
                                      : i18n.language === "hi"
                                      ? meta.name_hi
                                      : meta.name}
                                  </h5>
                                  {vaultDoc ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                                      <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                                      Ready in Vault
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 shrink-0">
                                      Not Uploaded
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                  {meta.description}
                                </p>
                              </div>
                            </div>

                            <div className="shrink-0">
                              {vaultDoc ? (
                                <div className="flex items-center space-x-2">
                                  <button
                                    type="button"
                                    onClick={() => setPreviewDoc(vaultDoc)}
                                    className="px-2.5 py-1 rounded-lg border border-slate-200 hover:border-blue-300 bg-slate-50 hover:bg-blue-50 text-blue-700 text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                                    title="Preview document"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>Preview</span>
                                  </button>
                                  <span className="text-xs text-emerald-700 font-mono font-bold">
                                    ✓ {(vaultDoc.file_size / 1024).toFixed(1)} KB
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-2">
                                  <button
                                    type="button"
                                    onClick={() => setShowDigiLockerModal(true)}
                                    className="px-2.5 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                                    title="Fetch from DigiLocker"
                                  >
                                    <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                                    <span className="hidden sm:inline">DigiLocker</span>
                                  </button>
                                  <label
                                    className={`px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer transition flex items-center space-x-1 shadow-2xs ${
                                      isUploading ? "opacity-50 pointer-events-none" : ""
                                    }`}
                                  >
                                    <input
                                      type="file"
                                      accept=".pdf"
                                      className="hidden"
                                      onChange={(e) => {
                                        const f = e.target.files?.[0];
                                        if (f) handleUploadVaultDoc(meta.type, f);
                                        e.target.value = "";
                                      }}
                                    />
                                    {isUploading ? (
                                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <Upload className="w-3.5 h-3.5" />
                                    )}
                                    <span>Upload PDF</span>
                                  </label>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : user?.role === "OFFICER" || user?.role === "DEPARTMENT_ADMIN" ? (
              renderOfficerProfile()
            ) : user?.role === "SUPER_ADMIN" ? (
              renderAdminProfile()
            ) : (
              /* TAB: CITIZEN PROFILE & DEMOGRAPHICS */
              <form onSubmit={handleSaveProfile} className="space-y-6">
                {/* Uploaded Docs Quick-Link Banner inside Profile Tab */}
                <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between shadow-2xs">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                        Personal Document Vault & Repository
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {uploadedCount} document(s) uploaded in your vault. Strictly .PDF format (max 256KB).
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("uploaded-docs")}
                    className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-xs cursor-pointer shrink-0"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>View Documents & Vault ({uploadedCount}) →</span>
                  </button>
                </div>

                {/* Personal Information */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
                  <h4 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-2 flex items-center">
                    <User className="w-4 h-4 mr-2 text-blue-600" />
                    Personal & Citizen Information
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Full Legal Name
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Mobile Phone Number
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Aadhaar Number
                      </label>
                      <input
                        type="text"
                        value={aadhaarNumber}
                        onChange={(e) => setAadhaarNumber(e.target.value)}
                        placeholder="XXXX-XXXX-XXXX"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        PAN Card Number
                      </label>
                      <input
                        type="text"
                        value={panNumber}
                        onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                        placeholder="ABCDE1234F"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none uppercase font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Beneficiary Profile Category
                      </label>
                      <select
                        value={beneficiaryCategory}
                        onChange={(e) => setBeneficiaryCategory(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="FARMER">🌾 Farmer / Cultivator (Eligible for PM-KISAN, Namo Shetkari)</option>
                        <option value="STUDENT">🎓 Student / Scholar (Eligible for AICTE, Shahu Maharaj)</option>
                        <option value="MSME_ENTREPRENEUR">🏭 MSME / Industrial Entrepreneur (Eligible for PMEGP, CMEGP)</option>
                        <option value="WOMAN_BENEFICIARY">👩 Woman Beneficiary (Eligible for Ladki Bahin DBT)</option>
                        <option value="GENERAL">👤 General Resident</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Social / Caste Category
                      </label>
                      <select
                        value={casteCategory}
                        onChange={(e) => setCasteCategory(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="GENERAL">Open / General</option>
                        <option value="OBC">Other Backward Class (OBC)</option>
                        <option value="SC">Scheduled Caste (SC)</option>
                        <option value="ST">Scheduled Tribe (ST)</option>
                        <option value="EWS">Economically Weaker Section (EWS)</option>
                        <option value="SEBC">Socially and Educationally Backward (SEBC)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Permanent Residential Address
                    </label>
                    <textarea
                      rows={2}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="House No, Village/Ward, Tehsil, District, PIN Code"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Residence & Domicile Auto-Fill Details */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="text-sm font-extrabold text-slate-900 flex items-center">
                      <MapPin className="w-4 h-4 mr-2 text-indigo-600" />
                      Residence & Domicile Details
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                      Auto-fills Domicile & Certificates
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Years of Continuous Residence in State
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={residenceYears}
                        onChange={(e) => setResidenceYears(e.target.value)}
                        placeholder="e.g. 30"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Place of Birth
                      </label>
                      <input
                        type="text"
                        value={placeOfBirth}
                        onChange={(e) => setPlaceOfBirth(e.target.value)}
                        placeholder="City / District, State"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        District
                      </label>
                      <input
                        type="text"
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        placeholder="e.g. Pune"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Taluka / Tehsil
                      </label>
                      <input
                        type="text"
                        value={taluka}
                        onChange={(e) => setTaluka(e.target.value)}
                        placeholder="e.g. Haveli"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Village / Town
                      </label>
                      <input
                        type="text"
                        value={village}
                        onChange={(e) => setVillage(e.target.value)}
                        placeholder="e.g. Ambegaon"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        PIN Code
                      </label>
                      <input
                        type="text"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        placeholder="411030"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Family, Demographics & Eligibility Details */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="text-sm font-extrabold text-slate-900 flex items-center">
                      <User className="w-4 h-4 mr-2 text-amber-600" />
                      Family & Eligibility Profile
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                      Auto-fills Schemes & Scholarships
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Date of Birth (DOB)
                      </label>
                      <input
                        type="date"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Gender
                      </label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Transgender / Other">Transgender / Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Marital Status
                      </label>
                      <select
                        value={maritalStatus}
                        onChange={(e) => setMaritalStatus(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="Married">Married</option>
                        <option value="Unmarried">Unmarried</option>
                        <option value="Widow">Widow</option>
                        <option value="Divorced / Abandoned">Divorced / Abandoned</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Father or Spouse Legal Name
                      </label>
                      <input
                        type="text"
                        value={fatherOrSpouseName}
                        onChange={(e) => setFatherOrSpouseName(e.target.value)}
                        placeholder="e.g. Deshmukh Anandrao"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Sub-Caste Name (if applicable)
                      </label>
                      <input
                        type="text"
                        value={subCaste}
                        onChange={(e) => setSubCaste(e.target.value)}
                        placeholder="e.g. Maratha / Kunbi"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Annual Family Income (in ₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={annualIncome}
                        onChange={(e) => setAnnualIncome(e.target.value)}
                        placeholder="180000"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        12-Digit Ration Card Number
                      </label>
                      <input
                        type="text"
                        value={rationCardNo}
                        onChange={(e) => setRationCardNo(e.target.value)}
                        placeholder="MH-PUN-7829104"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Direct Benefit Transfer (DBT) Bank Account */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="text-sm font-extrabold text-slate-900 flex items-center">
                      <Building className="w-4 h-4 mr-2 text-emerald-600" />
                      Direct Benefit Transfer (DBT) Bank Details
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Aadhaar Seeded
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Bank Name</label>
                      <input
                        type="text"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="e.g. State Bank of India"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Bank Account Number
                      </label>
                      <input
                        type="text"
                        value={bankAccount}
                        onChange={(e) => setBankAccount(e.target.value)}
                        placeholder="e.g. 349921008745"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">IFSC Code</label>
                      <input
                        type="text"
                        value={bankIfsc}
                        onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                        placeholder="e.g. SBIN0001234"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono uppercase"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition flex items-center space-x-2 cursor-pointer"
                  >
                    {saving ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>Save & Update Profile</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Drawer Footer */}
          <div className="border-t border-slate-200 px-6 py-4 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center">
              <ShieldCheck className="w-4 h-4 mr-1 text-blue-600" />
              Encrypted under IT Act 2000 & Digital Personal Data Protection
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold transition cursor-pointer"
            >
              Close Drawer
            </button>
          </div>
        </div>
      </div>

      {/* Universal Document Preview Modal with Automated Verification Inspector */}
      <DocumentPreviewModal
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        document={previewDoc}
        authToken={authToken}
      />

      {/* DigiLocker National Gateway Connect Modal */}
      <DigiLockerConnectModal
        isOpen={showDigiLockerModal}
        onClose={() => setShowDigiLockerModal(false)}
        onSynced={handleDigiLockerSynced}
      />
    </div>
  );
};

