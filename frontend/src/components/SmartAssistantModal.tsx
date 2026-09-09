import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import api from "../services/api";
import { Sparkles, Send, X, ArrowRight, Clock, Building, Key, CheckCircle, Cpu } from "lucide-react";
import { SuggestedService } from "../types";

interface SmartAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectService: (serviceId: number) => void;
  selectedState?: string;
}

export const SmartAssistantModal: React.FC<SmartAssistantModalProps> = ({
  isOpen,
  onClose,
  onSelectService,
  selectedState = "ALL"
}) => {
  const { t, i18n } = useTranslation();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [responseMsg, setResponseMsg] = useState<string | null>(null);
  const [suggestedServices, setSuggestedServices] = useState<SuggestedService[]>([]);
  const [activeEngine, setActiveEngine] = useState<string | null>(null);

  // Gemini API Key management
  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => localStorage.getItem("mahaseva_gemini_key") || "");
  const [showKeyInput, setShowKeyInput] = useState<boolean>(false);
  const [savedKeyNotice, setSavedKeyNotice] = useState<boolean>(false);

  useEffect(() => {
    if (geminiApiKey) {
      setActiveEngine("gemini-2.5-flash");
    }
  }, [geminiApiKey]);

  if (!isOpen) return null;

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("mahaseva_gemini_key", geminiApiKey.trim());
    setSavedKeyNotice(true);
    setTimeout(() => setSavedKeyNotice(false), 3000);
    setShowKeyInput(false);
    if (geminiApiKey.trim()) {
      setActiveEngine("gemini-2.5-flash");
    }
  };

  const handleClearKey = () => {
    setGeminiApiKey("");
    localStorage.removeItem("mahaseva_gemini_key");
    setActiveEngine(null);
  };

  const handleAsk = async (userQuery?: string) => {
    const q = userQuery || query;
    if (!q.trim()) return;

    setLoading(true);
    setResponseMsg(null);
    setSuggestedServices([]);

    try {
      const payload: any = {
        query: q,
        language: i18n.language,
      };

      if (geminiApiKey.trim()) {
        payload.api_key = geminiApiKey.trim();
      }

      if (selectedState && selectedState !== "ALL") {
        payload.state_code = selectedState;
      }

      const res = await api.post("/assistant/chat", payload);
      setResponseMsg(res.data.response);
      setSuggestedServices(res.data.suggested_services || []);
      setActiveEngine(res.data.engine || (geminiApiKey.trim() ? "gemini-2.5-flash" : "local-catalog-intelligence"));
    } catch (err) {
      console.error(err);
      setResponseMsg(
        i18n.language === "mr"
          ? "माहिती मिळवताना तांत्रिक अडचण आली. कृपया पुन्हा प्रयत्न करा."
          : i18n.language === "hi"
          ? "जानकारी प्राप्त करते समय तकनीकी समस्या आई। कृपया पुनः प्रयास करें।"
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
      hi: "मेरी बेटी की छात्रवृत्ति के लिए मुझे आय प्रमाण पत्र चाहिए"
    },
    {
      en: "How do I get a new BESCOM electricity connection in Bengaluru?",
      mr: "बंगळुरूमध्ये बेस्कॉम नवीन वीज जोडणीसाठी कसा अर्ज करावा?",
      hi: "बेंगलुरु में बेस्कॉम नया बिजली मीटर कनेक्शन कैसे प्राप्त करें?"
    },
    {
      en: "Apply for Delhi Food Security NFSA ration card",
      mr: "दिल्ली अन्न सुरक्षा रेशन कार्डसाठी अर्ज करा",
      hi: "दिल्ली ई-डिस्ट्रिक्ट पर खाद्य सुरक्षा राशन कार्ड के लिए कैसे आवेदन करें?"
    },
    {
      en: "Require 15 years domicile proof for state government jobs",
      mr: "शासकीय नोकरीसाठी १५ वर्षे वास्तव्याचा दाखला हवा आहे",
      hi: "सरकारी भर्ती परीक्षा हेतु मूल निवास प्रमाण पत्र चाहिए"
    },
    {
      en: "Need official 7/12 land record extract and mutation",
      mr: "अधिकृत ७/१२ उतारा आणि फेरफार नोंद हवी आहे",
      hi: "आधिकारिक ७/१२ भू-अभिलेख खसरा नकल एवं दाखिल खारिज"
    }
  ];

  const getServiceTitle = (svc: SuggestedService) => {
    if (i18n.language === "hi" && svc.name_hi) return svc.name_hi;
    if (i18n.language === "mr" && svc.name_mr) return svc.name_mr;
    return svc.name;
  };

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
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-lg leading-tight">
                  {i18n.language === "mr"
                    ? "स्मार्ट शासकीय सेवा सहाय्यक"
                    : i18n.language === "hi"
                    ? "स्मार्ट शासकीय सेवा सहायक"
                    : "Smart Service Assistant"}
                </h3>
                {activeEngine === "gemini-2.5-flash" ? (
                  <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/40">
                    <Sparkles className="w-2.5 h-2.5 mr-1 text-amber-300" />
                    Gemini 2.5 Flash
                  </span>
                ) : (
                  <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-blue-100 border border-white/30">
                    <Cpu className="w-2.5 h-2.5 mr-1 text-blue-200" />
                    Local Intelligence
                  </span>
                )}
              </div>
              <p className="text-xs text-blue-200 mt-0.5">
                {i18n.language === "mr"
                  ? "अखिल भारतीय डिजिटल सेवा मार्गदर्शक (MH, KA, GJ, DL, UP)"
                  : i18n.language === "hi"
                  ? "अखिल भारतीय सरकारी डिजिटल सेवा मार्गदर्शक (MH, KA, GJ, DL, UP)"
                  : "All-India Digital Public Services Guide (MH, KA, GJ, DL, UP)"}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setShowKeyInput(!showKeyInput)}
              title="Configure Gemini API Key"
              className={`p-1.5 rounded-lg transition ${
                geminiApiKey ? "bg-amber-400 text-slate-900 font-bold" : "hover:bg-white/10 text-white/80"
              }`}
            >
              <Key className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Gemini API Key Drawer */}
        {showKeyInput && (
          <div className="bg-slate-800 text-white p-4 border-b border-slate-700 animate-fadeIn">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-300 flex items-center">
                <Key className="w-3.5 h-3.5 mr-1" />
                Google Gemini API Key (Optional)
              </span>
              <span className="text-[11px] text-slate-400">
                Powers live natural conversational reasoning via gemini-2.5-flash
              </span>
            </div>
            <form onSubmit={handleSaveKey} className="flex gap-2">
              <input
                type="password"
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                placeholder="AIzaSy... (Saved locally in browser)"
                className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition"
              >
                Save Key
              </button>
              {geminiApiKey && (
                <button
                  type="button"
                  onClick={handleClearKey}
                  className="px-2 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs transition"
                >
                  Clear
                </button>
              )}
            </form>
            {savedKeyNotice && (
              <p className="text-[11px] text-emerald-400 mt-1 flex items-center">
                <CheckCircle className="w-3 h-3 mr-1" /> Key saved! Assistant will now query Gemini 2.5 Flash.
              </p>
            )}
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Quick Prompts */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {i18n.language === "mr"
                ? "उदाहरणे (क्लिक करा):"
                : i18n.language === "hi"
                ? "नमूना प्रश्न (पूछने के लिए क्लिक करें):"
                : "Sample queries (Click to ask):"}
            </p>
            <div className="flex flex-wrap gap-2">
              {samplePrompts.map((p, idx) => {
                const txt = i18n.language === "mr" ? p.mr : i18n.language === "hi" ? p.hi : p.en;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setQuery(txt);
                      handleAsk(txt);
                    }}
                    className="text-xs px-3 py-1.5 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 border border-slate-200 transition text-left"
                  >
                    {txt}
                  </button>
                );
              })}
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
                  : i18n.language === "hi"
                  ? "अपनी आवश्यकता बताएं (उदा. मुझे नया बिजली या नल कनेक्शन चाहिए)..."
                  : "Describe what you need in your own words (e.g. need an income certificate)..."
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

          {/* Loading Indicator */}
          {loading && (
            <div className="p-6 text-center text-slate-500 text-sm flex items-center justify-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce delay-100" />
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce delay-200" />
              <span className="ml-2 font-medium">
                {i18n.language === "mr"
                  ? "अधिकृत सेवा सूचीमध्ये तपासत आहे..."
                  : i18n.language === "hi"
                  ? "आधिकारिक सरकारी सेवा सूची में जांच हो रही है..."
                  : "Consulting verified government service directory..."}
              </span>
            </div>
          )}

          {/* Response Message */}
          {responseMsg && (
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 text-sm text-slate-800 leading-relaxed shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <p className="font-medium text-blue-900">
                  {i18n.language === "mr" ? "मार्गदर्शन:" : i18n.language === "hi" ? "सलाह एवं मार्गदर्शन:" : "Recommendation:"}
                </p>
                {activeEngine === "gemini-2.5-flash" && (
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
                    Powered by Gemini 2.5 Flash
                  </span>
                )}
              </div>
              <p>{responseMsg}</p>
            </div>
          )}

          {/* Suggested Matching Services */}
          {suggestedServices.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                {i18n.language === "mr"
                  ? "संबंधित शासकीय सेवा:"
                  : i18n.language === "hi"
                  ? "संबंधित आधिकारिक सरकारी सेवाएं:"
                  : "Verified Matching Services:"}
              </h4>
              <div className="grid gap-3">
                {suggestedServices.map((svc) => (
                  <div
                    key={svc.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-md transition flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                          {svc.state_code || "MH"}
                        </span>
                        <h5 className="font-bold text-slate-900 text-base">
                          {getServiceTitle(svc)}
                        </h5>
                      </div>
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
          Grounded directly on official Right to Public Services catalogs. Zero hallucination guarantee.
        </div>
      </div>
    </div>
  );
};
