import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import api from "../services/api";
import { ServiceItem, Department, ServiceCategory } from "../types";
import { Search, Filter, Clock, Building, ArrowRight, CheckCircle2 } from "lucide-react";

import { ALL_INDIA_STATES_AND_UTS, ALL_OPTION } from "../constants/states";

interface ServiceCatalogPageProps {
  initialSearch?: string;
  initialState?: string;
  onSelectService: (serviceId: number) => void;
  onStateChange?: (state: string) => void;
}

const statesList = ALL_INDIA_STATES_AND_UTS.filter((s) => s.type === "STATE");
const utsList = ALL_INDIA_STATES_AND_UTS.filter((s) => s.type === "UT");

export const ServiceCatalogPage: React.FC<ServiceCatalogPageProps> = ({
  initialSearch = "",
  initialState = "ALL",
  onSelectService,
  onStateChange,
}) => {
  const { t, i18n } = useTranslation();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState(initialSearch);
  const [selectedState, setSelectedState] = useState<string>(initialState);
  const [selectedDept, setSelectedDept] = useState<number | null>(null);
  const [selectedCat, setSelectedCat] = useState<number | null>(null);

  useEffect(() => {
    fetchFiltersAndServices();
  }, [selectedState]);

  useEffect(() => {
    fetchServices();
  }, [search, selectedState, selectedDept, selectedCat]);

  const fetchFiltersAndServices = async () => {
    try {
      const deptParams: any = {};
      if (selectedState && selectedState !== "ALL") {
        deptParams.state_code = selectedState;
      }
      const [deptRes, catRes] = await Promise.all([
        api.get("/departments", { params: deptParams }),
        api.get("/services/categories")
      ]);
      setDepartments(deptRes.data || []);
      setCategories(catRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchServices = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (search.trim()) params.q = search.trim();
      if (selectedState && selectedState !== "ALL") params.state_code = selectedState;
      if (selectedDept) params.department_id = selectedDept;
      if (selectedCat) params.category_id = selectedCat;

      const res = await api.get("/services", { params });
      setServices(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getServiceTitle = (svc: ServiceItem) => {
    if (i18n.language === "hi" && svc.name_hi) return svc.name_hi;
    if (i18n.language === "mr" && svc.name_mr) return svc.name_mr;
    return svc.name;
  };

  const getServiceDescription = (svc: ServiceItem) => {
    if (i18n.language === "hi" && svc.description_hi) return svc.description_hi;
    return svc.description;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          {i18n.language === "mr"
            ? "शासकीय सेवा निर्देशिका"
            : i18n.language === "hi"
            ? "सरकारी सेवा निर्देशिका"
            : "Government Services Catalog"}
        </h1>
        <p className="text-sm text-slate-600">
          {i18n.language === "mr"
            ? "भारतातील सर्व २८ राज्ये आणि ८ केंद्रशासित प्रदेशांमधील अधिकृत शासकीय सेवा शोधा व अर्ज करा."
            : i18n.language === "hi"
            ? "भारत के सभी 28 राज्यों एवं 8 केंद्र शासित प्रदेशों में संचालित आधिकारिक डिजिटल सार्वजनिक सेवाओं को खोजें और ऑनलाइन आवेदन करें।"
            : "Search and apply for official digital public services across all 28 States and 8 Union Territories of India."}
        </p>
      </div>

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
              i18n.language === "mr"
                ? "नाव किंवा कीवर्डने शोधा..."
                : i18n.language === "hi"
                ? "सेवा का नाम या शब्द खोजें..."
                : "Search by title or keyword..."
            }
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <optgroup label={i18n.language === "hi" ? "--- 28 राज्य ---" : i18n.language === "mr" ? "--- २८ राज्य ---" : "--- 28 States ---"}>
              {statesList.map((st) => (
                <option key={st.code} value={st.code}>
                  {i18n.language === "hi" ? `${st.hi} (${st.code})` : i18n.language === "mr" ? `${st.mr} (${st.code})` : `${st.name} (${st.code})`}
                </option>
              ))}
            </optgroup>
            <optgroup label={i18n.language === "hi" ? "--- 8 केंद्र शासित प्रदेश ---" : i18n.language === "mr" ? "--- ८ केंद्रशासित प्रदेश ---" : "--- 8 Union Territories ---"}>
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

      {/* Services Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 text-sm flex items-center justify-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
          <span>{t("common.loading")}</span>
        </div>
      ) : services.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
          <Filter className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="font-bold text-slate-700">{t("common.no_data")}</p>
          <p className="text-xs text-slate-500">
            {i18n.language === "mr"
              ? "कृपया शोध निकष बदला किंवा राज्य फिल्टर रीसेट करा."
              : i18n.language === "hi"
              ? "कृपया खोज मानदंड बदलें या राज्य फिल्टर रीसेट करें।"
              : "Try adjusting your search criteria or resetting filters."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((svc) => (
            <div
              key={svc.id}
              className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-blue-400 hover:shadow-xl transition flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-slate-900 text-amber-300">
                      {svc.state_code || "MH"}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200 truncate max-w-[160px]">
                      {svc.department_name}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-emerald-600">
                    {svc.fee === 0 ? t("common.free") : `₹${svc.fee}`}
                  </span>
                </div>

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
                  className="inline-flex items-center px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold shadow-sm transition"
                >
                  <span>{t("common.apply_now")}</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
