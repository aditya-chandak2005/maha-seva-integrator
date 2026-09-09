import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import api from "../services/api";
import { ServiceItem, Department, ServiceCategory } from "../types";
import { Search, Filter, Clock, Building, ArrowRight, CheckCircle2 } from "lucide-react";

interface ServiceCatalogPageProps {
  initialSearch?: string;
  onSelectService: (serviceId: number) => void;
}

export const ServiceCatalogPage: React.FC<ServiceCatalogPageProps> = ({
  initialSearch = "",
  onSelectService,
}) => {
  const { t, i18n } = useTranslation();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState(initialSearch);
  const [selectedDept, setSelectedDept] = useState<number | null>(null);
  const [selectedCat, setSelectedCat] = useState<number | null>(null);

  useEffect(() => {
    fetchFiltersAndServices();
  }, []);

  useEffect(() => {
    fetchServices();
  }, [search, selectedDept, selectedCat]);

  const fetchFiltersAndServices = async () => {
    try {
      const [deptRes, catRes] = await Promise.all([
        api.get("/departments"),
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          {i18n.language === "mr" ? "शासकीय सेवा निर्देशिका" : "Government Services Catalog"}
        </h1>
        <p className="text-sm text-slate-600">
          Search and apply for all official Maharashtra digital public services across departments.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search Field */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or keyword..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap w-full md:w-auto gap-2">
          <select
            value={selectedDept || ""}
            onChange={(e) => setSelectedDept(e.target.value ? Number(e.target.value) : null)}
            className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white text-slate-700 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{t("common.filter_by_dept")}</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            value={selectedCat || ""}
            onChange={(e) => setSelectedCat(e.target.value ? Number(e.target.value) : null)}
            className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white text-slate-700 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{t("common.filter_by_cat")}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
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
            Try adjusting your search criteria or resetting filters.
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
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                    {svc.department_name}
                  </span>
                  <span className="text-xs font-bold text-emerald-600">
                    {svc.fee === 0 ? t("common.free") : `₹${svc.fee}`}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-lg group-hover:text-blue-700 transition">
                  {i18n.language === "mr" ? svc.name_mr || svc.name : svc.name}
                </h3>

                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {svc.description}
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
