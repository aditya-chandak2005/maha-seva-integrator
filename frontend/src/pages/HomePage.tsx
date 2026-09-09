import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { 
  Search, 
  ArrowRight, 
  Building, 
  Clock, 
  FileCheck2, 
  CheckCircle, 
  Sparkles, 
  Shield, 
  Users, 
  Zap, 
  Award,
  FileText,
  HelpCircle,
  TrendingUp
} from "lucide-react";
import { ServiceItem } from "../types";

interface HomePageProps {
  services: ServiceItem[];
  onSelectService: (serviceId: number) => void;
  onNavigate: (tab: string, param?: any) => void;
  onOpenAssistant: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  services,
  onSelectService,
  onNavigate,
  onOpenAssistant,
}) => {
  const { t, i18n } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [trackNumber, setTrackNumber] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigate("services", { q: searchQuery });
  };

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackNumber.trim()) {
      onNavigate("track", { number: trackNumber.trim() });
    }
  };

  const popularServices = services.slice(0, 4);

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-900 via-blue-800 to-indigo-900 text-white py-16 sm:py-24 px-4 sm:px-8">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="relative max-w-5xl mx-auto text-center space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-semibold backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-orange-400" />
            <span>Smart India Hackathon 2026 — Problem Statement SIH26129 (PS-129)</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
            {t("brand.slogan")}
          </h1>

          <p className="text-base sm:text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
            {t("hero.subtitle")}
          </p>

          {/* Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="max-w-3xl mx-auto mt-8 flex flex-col sm:flex-row gap-2 bg-white p-2 rounded-2xl shadow-2xl border border-white/20"
          >
            <div className="relative flex-1 flex items-center">
              <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("hero.search_placeholder")}
                className="w-full px-3 py-3 text-sm text-slate-800 focus:outline-none placeholder-slate-400"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-sm rounded-xl transition shadow-md flex items-center justify-center"
            >
              <span>{t("common.search")}</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </form>

          {/* Quick Action Badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs">
            <button
              onClick={onOpenAssistant}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 font-bold text-white shadow-lg transition"
            >
              <Sparkles className="w-4 h-4" />
              <span>{t("hero.ask_assistant")}</span>
            </button>
            <button
              onClick={() => onNavigate("services")}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium border border-white/20 transition"
            >
              {t("hero.explore_btn")}
            </button>
            <button
              onClick={() => onNavigate("track")}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium border border-white/20 transition"
            >
              {t("hero.track_btn")}
            </button>
          </div>
        </div>
      </section>

      {/* Quick Track Strip */}
      <section className="max-w-5xl mx-auto px-4 -mt-10 relative z-10">
        <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Track Application in Real-Time
              </h3>
              <p className="text-xs text-slate-500">
                Enter your unique application tracking reference (e.g., <code className="text-blue-600 font-mono">MH-REV-2026-00101</code>)
              </p>
            </div>
          </div>

          <form onSubmit={handleTrackSubmit} className="flex w-full md:w-auto gap-2">
            <input
              type="text"
              value={trackNumber}
              onChange={(e) => setTrackNumber(e.target.value)}
              placeholder="e.g. MH-REV-2026-00101"
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 md:w-64 font-mono text-slate-800"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition shrink-0"
            >
              Track Status
            </button>
          </form>
        </div>
      </section>

      {/* Popular Services Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
              {i18n.language === "mr" ? "सर्वाधिक विचारल्या जाणाऱ्या सेवा" : "Most Applied Public Services"}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              Popular Services
            </h2>
          </div>
          <button
            onClick={() => onNavigate("services")}
            className="text-sm font-bold text-blue-700 hover:text-blue-800 flex items-center"
          >
            <span>View All Services Directory</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {popularServices.map((svc) => (
            <div
              key={svc.id}
              className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-blue-400 hover:shadow-xl transition-all flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                    {svc.department_name?.split(" ")[0] || "Department"}
                  </span>
                  <span className="text-xs font-bold text-emerald-600">
                    {svc.fee === 0 ? "Free" : `₹${svc.fee}`}
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
                  {svc.processing_days} {t("common.days")}
                </span>
                <button
                  onClick={() => onSelectService(svc.id)}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-50 group-hover:bg-blue-600 text-blue-700 group-hover:text-white text-xs font-semibold transition"
                >
                  {t("common.apply_now")}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works (Government Orchestration) */}
      <section className="bg-slate-100 py-16 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
              End-To-End Orchestration
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              How Maha-Seva Integrator Works
            </h2>
            <p className="text-sm text-slate-600">
              Eliminating departmental silos through automated interoperability, dynamic verification, and real-time synchronization.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 font-extrabold flex items-center justify-center text-base">
                1
              </div>
              <h3 className="font-bold text-slate-900 text-base">Search & Discover</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Find the exact public service you need using multilingual keyword search or our AI Smart Assistant without guessing departments.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 font-extrabold flex items-center justify-center text-base">
                2
              </div>
              <h3 className="font-bold text-slate-900 text-base">Dynamic Application</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Fill dynamic, schema-driven forms with live validation. Attach required documents securely with automated SHA-256 integrity checks.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-700 font-extrabold flex items-center justify-center text-base">
                3
              </div>
              <h3 className="font-bold text-slate-900 text-base">Adapter Orchestration</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Our Integration Adapter layer submits payloads to relevant departmental backends (Revenue, ULB, DigiLocker) seamlessly.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 font-extrabold flex items-center justify-center text-base">
                4
              </div>
              <h3 className="font-bold text-slate-900 text-base">Transparent Tracking</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Track status updates on an immutable visual timeline with instant SMS/In-app notifications as officers process the request.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-slate-600">
            Answers regarding Maharashtra digital public service delivery under the RTS Act.
          </p>
        </div>

        <div className="space-y-3">
          <div className="bg-white p-5 rounded-xl border border-slate-200">
            <h4 className="font-bold text-sm text-slate-900">
              What is the Maharashtra Right to Public Services Act (RTS)?
            </h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              The Maharashtra Right to Public Services Act, 2015 guarantees citizens the right to receive eligible public services in a transparent, accountable, and time-bound manner with statutory remedies for delays.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200">
            <h4 className="font-bold text-sm text-slate-900">
              How does Maha-Seva Integrator solve departmental silos (SIH PS-129)?
            </h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Instead of forcing citizens to register and re-upload proofs across multiple disparate portals (Revenue, Municipal, Transport), Maha-Seva provides a single orchestration gateway with standardized adapters that synchronize data automatically across departments.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200">
            <h4 className="font-bold text-sm text-slate-900">
              Are my uploaded documents safe?
            </h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Yes. Documents are encrypted, verified with SHA-256 cryptographic hashes, restricted by role-based access control, and never exposed via public unauthenticated links.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
