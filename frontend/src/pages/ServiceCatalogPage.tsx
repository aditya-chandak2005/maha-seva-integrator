import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { 
  Search, 
  Filter, 
  Clock, 
  ArrowRight, 
  FileText, 
  Sparkles,
  CheckCircle2
} from "lucide-react";
import { ServiceItem, Department, ServiceCategory, ALL_INDIA_STATES_AND_UTS } from "../types";
import api from "../services/api";

interface ServiceCatalogPageProps {
  onSelectService: (serviceId: string | number) => void;
  initialQuery?: string;
  initialSearch?: string;
  initialMode?: "documents" | "schemes";
  selectedState?: string;
  initialState?: string;
  onStateChange?: (state: string) => void;
}

export const ServiceCatalogPage: React.FC<ServiceCatalogPageProps> = ({
  onSelectService,
  initialQuery = "",
  initialSearch = "",
  initialMode = "documents",
  selectedState: controlledState = "ALL",
  initialState = "",
  onStateChange,
}) => {
  const { t, i18n } = useTranslation();
  const [mode, setMode] = useState<"documents" | "schemes">(initialMode);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Sync mode if changed from props (e.g. navbar click)
  useEffect(() => {
    if (initialMode) {
      setMode(initialMode);
    }
  }, [initialMode]);

  // Filters
  const [search, setSearch] = useState(initialSearch || initialQuery);
  const [selectedDept, setSelectedDept] = useState<number | null>(null);
  const [selectedCat, setSelectedCat] = useState<number | null>(null);
  const [selectedState, setSelectedState] = useState<string>(initialState || controlledState || "ALL");
  const [selectedSchemeType, setSelectedSchemeType] = useState<string>("ALL");

  useEffect(() => {
    const targetState = initialState || controlledState || "ALL";
    setSelectedState(targetState);
  }, [controlledState, initialState]);

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchServices();
  }, [search, selectedDept, selectedCat, selectedState, mode, selectedSchemeType]);

  const fetchMetadata = async () => {
    try {
      const [deptRes, catRes] = await Promise.all([
        api.get("/services/meta/departments"),
        api.get("/services/meta/categories"),
      ]);
      setDepartments(deptRes.data);
      setCategories(catRes.data);
    } catch (err) {
      console.error("Failed to fetch filter metadata", err);
    }
  };

  const fetchServices = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (search.trim()) params.q = search.trim();
      if (selectedDept) params.department_id = selectedDept;
      if (selectedCat) params.category_id = selectedCat;
      if (selectedState && selectedState !== "ALL") params.state_code = selectedState;
      if (mode === "schemes") {
        params.service_type = "SCHEME";
        if (selectedSchemeType && selectedSchemeType !== "ALL") {
          params.scheme_category = selectedSchemeType;
        }
      } else {
        params.service_type = "DOCUMENT";
      }

      const res = await api.get("/services", { params });
      setServices(res.data);
    } catch (err) {
      console.error("Failed to fetch services", err);
    } finally {
      setLoading(false);
    }
  };

  const statesList = ALL_INDIA_STATES_AND_UTS.filter((s) => s.type === "STATE");
  const utsList = ALL_INDIA_STATES_AND_UTS.filter((s) => s.type === "UT");

  const ALL_OPTION = {
    name: "All India / National (All 36 States & Central)",
    hi: "अखिल भारतीय / सर्व भारत (सभी 36 राज्य एवं केंद्र)",
    mr: "सर्व भारत / अखिल भारतीय (सर्व ३६ राज्ये व केंद्र)",
  };

  const CENTRAL_OPTION = {
    name: "Central Government (Govt of India)",
    hi: "भारत सरकार (केन्द्र सरकार)",
    mr: "भारत सरकार (केंद्र सरकार)",
  };

  const SCHEME_FILTERS = [
    { key: "ALL", label: "All Schemes", label_hi: "सभी योजनाएं", label_mr: "सर्व योजना" },
    { key: "FARMER", label: "🚜 Farmer & Krishi", label_hi: "🚜 किसान व कृषि", label_mr: "🚜 शेतकरी व कृषी" },
    { key: "EDUCATION", label: "🎓 Education & Scholarships", label_hi: "🎓 शिक्षा व छात्रवृत्ति", label_mr: "🎓 शिक्षण व शिष्यवृत्ती" },
    { key: "WOMEN", label: "🌸 Women & Child Welfare", label_hi: "🌸 महिला एवं बाल विकास", label_mr: "🌸 महिला व बाल कल्याण" },
    { key: "EMPLOYMENT", label: "💼 MSME & Self-Employment", label_hi: "💼 स्वरोजगार व उद्योग", label_mr: "💼 स्वयंरोजगार व उद्योग" },
    { key: "HEALTH", label: "🏥 Health & Ayushman", label_hi: "🏥 स्वास्थ्य व आयुष्मान", label_mr: "🏥 आरोग्य व आयुष्मान" },
  ];

  const getServiceTitle = (svc: ServiceItem) => {
    if (i18n.language === "hi" && svc.name_hi) return svc.name_hi;
    if (i18n.language === "mr" && svc.name_mr) return svc.name_mr;
    return svc.name;
  };

  const getServiceDescription = (svc: ServiceItem) => {
    if (i18n.language === "hi" && svc.description_hi) return svc.description_hi;
    if (i18n.language === "mr" && svc.description_mr) return svc.description_mr;
    return svc.description;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Dual Mode Switcher Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-bold backdrop-blur-md border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>National Federated Service & Welfare Gateway</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
            {mode === "documents"
              ? i18n.language === "mr"
                ? "शासकीय दाखले व कागदपत्रे सेवा"
                : i18n.language === "hi"
                ? "दस्तावेज व प्रमाण पत्र सेवाएं"
                : "Document & Statutory Certificate Services"
              : i18n.language === "mr"
              ? "शासकीय योजना, सबसिडी व डीबीटी"
              : i18n.language === "hi"
              ? "सरकारी योजनाएं, अनुदान एवं प्रत्यक्ष लाभ (DBT)"
              : "Government Schemes, Subsidies & Grants"}
          </h1>
          <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
            {mode === "documents"
              ? i18n.language === "mr"
                ? "उत्पन्न, अधिवास, ७/१२ उतारा, जात प्रमाणपत्र, गुणपत्रिका व इतर अधिकृत शासकीय कागदपत्रांसाठी थेट अर्ज करा."
                : i18n.language === "hi"
                ? "आय, मूल निवास, 7/12 भू-अभिलेख, जाति प्रमाण पत्र, अंकतालिका सत्यापन एवं अन्य आधिकारिक प्रमाण पत्रों हेतु आवेदन करें।"
                : "Apply for official government documents, revenue certificates, 7/12 land records, board marksheet attestations, and statutory identity cards."
              : i18n.language === "mr"
              ? "केंद्र व राज्य शासनाच्या शिक्षण शिष्यवृत्ती, शेतकरी सन्मान निधी, पीक विमा आणि औद्योगिक एमएसएमई सबसिडी योजनांचा थेट लाभ मिळवा."
              : i18n.language === "hi"
              ? "केंद्र एवं राज्य सरकार की शैक्षणिक छात्रवृत्ति, किसान सम्मान निधि, फसल बीमा और औद्योगिक एमएसएमई सब्सिडी योजनाओं का लाभ उठाएं।"
              : "Discover and apply for Central and State government welfare schemes, farmer subsidies, educational scholarships, and MSME industrial grants."}
          </p>
        </div>

        {/* Dual Mode Switch Buttons */}
        <div className="mt-6 pt-6 border-t border-white/10 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => {
              setMode("documents");
              setSelectedCat(null);
            }}
            className={`flex-1 flex items-center justify-between p-4 rounded-2xl border transition text-left cursor-pointer ${
              mode === "documents"
                ? "bg-white text-slate-900 border-white shadow-lg ring-2 ring-white/50"
                : "bg-white/10 text-white border-white/10 hover:bg-white/15"
            }`}
          >
            <div className="flex items-center space-x-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  mode === "documents" ? "bg-blue-600 text-white" : "bg-white/20 text-white"
                }`}
              >
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-black">
                  {i18n.language === "mr" ? "१. शासकीय दाखले व कागदपत्रे" : i18n.language === "hi" ? "1. दस्तावेज व प्रमाण पत्र" : "1. Document & Proof Services"}
                </div>
                <div
                  className={`text-[11px] ${
                    mode === "documents" ? "text-slate-600" : "text-blue-200"
                  }`}
                >
                  Income, Domicile, 7/12, Marksheets, DL & Affidavits
                </div>
              </div>
            </div>
            {mode === "documents" && (
              <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
            )}
          </button>

          <button
            onClick={() => {
              setMode("schemes");
              setSelectedCat(null);
            }}
            className={`flex-1 flex items-center justify-between p-4 rounded-2xl border transition text-left cursor-pointer ${
              mode === "schemes"
                ? "bg-emerald-500 text-white border-emerald-400 shadow-lg ring-2 ring-emerald-300/50"
                : "bg-white/10 text-white border-white/10 hover:bg-white/15"
            }`}
          >
            <div className="flex items-center space-x-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  mode === "schemes" ? "bg-white text-emerald-700" : "bg-white/20 text-white"
                }`}
              >
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-black flex items-center">
                  <span>{i18n.language === "mr" ? "२. शासकीय योजना व सबसिडी" : i18n.language === "hi" ? "2. सरकारी योजनाएं व सब्सिडी" : "2. Government Schemes & Subsidies"}</span>
                  <span className="ml-2 text-[10px] bg-white text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                    DBT Grants
                  </span>
                </div>
                <div
                  className={`text-[11px] ${
                    mode === "schemes" ? "text-emerald-100" : "text-blue-200"
                  }`}
                >
                  Scholarships, PM-KISAN, PMEGP, CMEGP & Welfare
                </div>
              </div>
            </div>
            {mode === "schemes" && (
              <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
            )}
          </button>
        </div>
      </div>

      {/* Scheme Domain Filter Chips (Only shown in Schemes mode) */}
      {mode === "schemes" && (
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
          {SCHEME_FILTERS.map((sf) => {
            const isSelected = selectedSchemeType === sf.key;
            return (
              <button
                key={sf.key}
                onClick={() => setSelectedSchemeType(sf.key)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center space-x-2 border shadow-2xs cursor-pointer ${
                  isSelected
                    ? "bg-emerald-700 text-white border-emerald-700 shadow-sm"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                <span>
                  {i18n.language === "mr"
                    ? sf.label_mr
                    : i18n.language === "hi"
                    ? sf.label_hi
                    : sf.label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search Field */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              mode === "schemes"
                ? i18n.language === "mr"
                  ? "योजनेचे नाव शोधा..."
                  : i18n.language === "hi"
                  ? "योजना का नाम खोजें..."
                  : "Search schemes by title..."
                : i18n.language === "mr"
                ? "दाखल्याचे नाव शोधा..."
                : i18n.language === "hi"
                ? "सेवा का नाम खोजें..."
                : "Search by certificate title..."
            }
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap w-full md:w-auto gap-2">
          {/* State Filter */}
          <select
            value={selectedState}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedState(val);
              setSelectedDept(null);
              if (onStateChange) onStateChange(val);
            }}
            className="px-3 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white font-semibold text-blue-800 focus:ring-2 focus:ring-blue-500 max-w-[220px]"
          >
            <option value="ALL">
              {i18n.language === "hi" ? ALL_OPTION.hi : i18n.language === "mr" ? ALL_OPTION.mr : ALL_OPTION.name}
            </option>
            <option value="CENTRAL" className="font-bold text-blue-900 bg-blue-50">
              🏛️ {i18n.language === "hi" ? CENTRAL_OPTION.hi : i18n.language === "mr" ? CENTRAL_OPTION.mr : CENTRAL_OPTION.name}
            </option>
            <optgroup label={i18n.language === "hi" ? "--- 28 राज्य ---" : i18n.language === "mr" ? "--- २८ राज्य ---" : "--- 28 States ---"} className="text-slate-900 bg-white">
              {statesList.map((st) => (
                <option key={st.code} value={st.code}>
                  {i18n.language === "hi" ? `${st.hi} (${st.code})` : i18n.language === "mr" ? `${st.mr} (${st.code})` : `${st.name} (${st.code})`}
                </option>
              ))}
            </optgroup>
            <optgroup label={i18n.language === "hi" ? "--- 8 केंद्र शासित प्रदेश ---" : i18n.language === "mr" ? "--- ८ केंद्रशासित प्रदेश ---" : "--- 8 Union Territories ---"} className="text-slate-900 bg-white">
              {utsList.map((ut) => (
                <option key={ut.code} value={ut.code}>
                  {i18n.language === "hi" ? `${ut.hi} (${ut.code})` : i18n.language === "mr" ? `${ut.mr} (${ut.code})` : `${ut.name} (${ut.code})`}
                </option>
              ))}
            </optgroup>
          </select>

          {/* Department Filter */}
          <select
            value={selectedDept || ""}
            onChange={(e) => setSelectedDept(e.target.value ? Number(e.target.value) : null)}
            className="px-3 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 max-w-[200px]"
          >
            <option value="">{t("common.filter_by_dept")}</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {i18n.language === "hi" && d.name_hi ? d.name_hi : i18n.language === "mr" && d.name_mr ? d.name_mr : d.name}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={selectedCat || ""}
            onChange={(e) => setSelectedCat(e.target.value ? Number(e.target.value) : null)}
            className="px-3 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white text-slate-700 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{t("common.filter_by_cat")}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {i18n.language === "hi" && c.name_hi ? c.name_hi : i18n.language === "mr" && c.name_mr ? c.name_mr : c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Services or Schemes Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 text-sm flex items-center justify-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
          <span>{t("common.loading")}</span>
        </div>
      ) : services.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
          <Filter className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="font-bold text-slate-700">{t("common.no_data")}</p>
          <p className="text-xs text-slate-500">
            {i18n.language === "mr"
              ? "कृपया शोध निकष बदला किंवा राज्य / श्रेणी फिल्टर रीसेट करा."
              : i18n.language === "hi"
              ? "कृपया खोज मानदंड बदलें या राज्य / श्रेणी फिल्टर रीसेट करें।"
              : "Try adjusting your search criteria or resetting filters."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((svc) => {
            const isScheme = svc.service_type === "SCHEME" || mode === "schemes";
            return (
              <div
                key={svc.id}
                className={`rounded-3xl p-6 border transition flex flex-col justify-between group shadow-2xs hover:shadow-xl ${
                  isScheme
                    ? "bg-gradient-to-b from-white to-emerald-50/20 border-emerald-200/80 hover:border-emerald-400"
                    : "bg-white border-slate-200 hover:border-blue-400"
                }`}
              >
                <div className="space-y-3">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-slate-900 text-amber-300">
                        {svc.state_code || "MH"}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200 truncate max-w-[150px]">
                        {svc.department_name}
                      </span>
                      {svc.sponsor_type && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-amber-100 text-amber-900">
                          {svc.sponsor_type}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-bold text-emerald-700 shrink-0">
                      {svc.fee === 0 ? t("common.free") : `₹${svc.fee}`}
                    </span>
                  </div>

                  {/* Benefit Highlight for Schemes */}
                  {svc.benefit_amount && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-1.5 flex items-center space-x-2 text-emerald-900">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="text-xs font-extrabold tracking-tight">
                        {svc.benefit_amount}
                      </span>
                    </div>
                  )}

                  <h3 className="font-bold text-slate-900 text-lg group-hover:text-blue-700 transition leading-snug">
                    {getServiceTitle(svc)}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {getServiceDescription(svc)}
                  </p>
                </div>

                <div className="pt-6 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500 flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    {svc.processing_days} {t("common.days")} SLA
                  </span>
                  <button
                    onClick={() => onSelectService(svc.id)}
                    className={`inline-flex items-center px-4 py-2 rounded-xl text-white text-xs font-bold shadow-xs transition cursor-pointer ${
                      isScheme
                        ? "bg-emerald-700 hover:bg-emerald-800"
                        : "bg-blue-700 hover:bg-blue-800"
                    }`}
                  >
                    <span>{isScheme ? "Apply for Scheme" : t("common.apply_now")}</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
