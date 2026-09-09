import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../services/api";
import { Sparkles, Send, X, ArrowRight, Clock, Building } from "lucide-react";
import { SuggestedService } from "../types";

interface SmartAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectService: (serviceId: number) => void;
}

export const SmartAssistantModal: React.FC<SmartAssistantModalProps> = ({
  isOpen,
  onClose,
  onSelectService,
}) => {
  const { t, i18n } = useTranslation();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [responseMsg, setResponseMsg] = useState<string | null>(null);
  const [suggestedServices, setSuggestedServices] = useState<SuggestedService[]>([]);

  if (!isOpen) return null;

  const handleAsk = async (userQuery?: string) => {
    const q = userQuery || query;
    if (!q.trim()) return;

    setLoading(true);
    setResponseMsg(null);
    setSuggestedServices([]);

    try {
      const res = await api.post("/assistant/chat", {
        query: q,
        language: i18n.language,
      });
      setResponseMsg(res.data.response);
      setSuggestedServices(res.data.suggested_services || []);
    } catch (err) {
      console.error(err);
      setResponseMsg(
        i18n.language === "mr"
          ? "माहिती मिळवताना तांत्रिक अडचण आली. कृपया पुन्हा प्रयत्न करा."
          : "An error occurred while consulting the assistant. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const samplePrompts = [
    {
      en: "I need an income certificate for my daughter's scholarship",
      mr: "मुलीच्या शिष्यवृत्तीसाठी मला उत्पन्नाचा दाखला हवा आहे",
    },
    {
      en: "How do I register a newly born baby in Pune?",
      mr: "पुण्यात नुकत्याच जन्मलेल्या बाळाची नोंदणी कशी करावी?",
    },
    {
      en: "Require proof of 15 years domicile for state government recruitment",
      mr: "शासकीय नोकरीसाठी १५ वर्षे वास्तव्याचा दाखला हवा आहे",
    },
    {
      en: "Need a new piped drinking water connection for my house",
      mr: "माझ्या घरासाठी नवीन पिण्याच्या पाण्याची नळ जोडणी हवी आहे",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md">
              <Sparkles className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">
                {i18n.language === "mr"
                  ? "स्मार्ट शासकीय सेवा सहाय्यक"
                  : "Smart Service Assistant"}
              </h3>
              <p className="text-xs text-blue-200">
                {i18n.language === "mr"
                  ? "महाराष्ट्र शासन डिजिटल सेवा मार्गदर्शक (Grounded on official catalog)"
                  : "Assists citizens in finding official Maharashtra government services"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {i18n.language === "mr" ? "उदाहरणे (क्लिक करा):" : "Sample queries (Click to ask):"}
            </p>
            <div className="flex flex-wrap gap-2">
              {samplePrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    const txt = i18n.language === "mr" ? p.mr : p.en;
                    setQuery(txt);
                    handleAsk(txt);
                  }}
                  className="text-xs px-3 py-1.5 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 border border-slate-200 transition text-left"
                >
                  {i18n.language === "mr" ? p.mr : p.en}
                </button>
              ))}
            </div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAsk()}
              placeholder={
                i18n.language === "mr"
                  ? "आपल्या गरजेनुसार विचारा (उदा. मला उत्पन्नाचा दाखला काढायचा आहे)..."
                  : "Describe what you need in your own words..."
              }
              className="w-full pl-4 pr-12 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            />
            <button
              onClick={() => handleAsk()}
              disabled={loading || !query.trim()}
              className="absolute right-2 top-2 p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          {/* Response Container */}
          {loading && (
            <div className="p-6 text-center text-slate-500 text-sm flex items-center justify-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce delay-100" />
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce delay-200" />
              <span className="ml-2 font-medium">
                {i18n.language === "mr"
                  ? "अधिकृत सेवा सूचीमध्ये तपासत आहे..."
                  : "Consulting verified government service directory..."}
              </span>
            </div>
          )}

          {responseMsg && (
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 text-sm text-slate-800 leading-relaxed shadow-sm">
              <p className="font-medium text-blue-900 mb-1">
                {i18n.language === "mr" ? "मार्गदर्शन:" : "Recommendation:"}
              </p>
              <p>{responseMsg}</p>
            </div>
          )}

          {suggestedServices.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                {i18n.language === "mr" ? "संबंधित शासकीय सेवा:" : "Verified Matching Services:"}
              </h4>
              <div className="grid gap-3">
                {suggestedServices.map((svc) => (
                  <div
                    key={svc.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-md transition flex items-center justify-between"
                  >
                    <div>
                      <h5 className="font-bold text-slate-900 text-base">
                        {i18n.language === "mr" ? svc.name_mr || svc.name : svc.name}
                      </h5>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        <span className="flex items-center">
                          <Building className="w-3.5 h-3.5 mr-1 text-slate-400" />
                          {svc.department_name}
                        </span>
                        <span className="flex items-center">
                          <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                          {svc.processing_days} {t("common.days")}
                        </span>
                        <span className="font-semibold text-emerald-600">
                          {svc.fee === 0 ? t("common.free") : `₹${svc.fee}`}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        onClose();
                        onSelectService(svc.id);
                      }}
                      className="inline-flex items-center px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition"
                    >
                      {t("common.apply_now")}
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-500">
          Grounded directly on official Maharashtra Right to Services (RTS) catalog. Never hallucinates official requirements.
        </div>
      </div>
    </div>
  );
};
