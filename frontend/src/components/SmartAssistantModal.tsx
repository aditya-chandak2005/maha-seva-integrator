import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import api from "../services/api";
import { 
  Sparkles, 
  Send, 
  X, 
  ArrowRight, 
  Clock, 
  Building, 
  Key, 
  CheckCircle, 
  Cpu, 
  Bot, 
  User, 
  RotateCcw,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff
} from "lucide-react";
import { SuggestedService } from "../types";
import { ALL_INDIA_STATES_AND_UTS, ALL_OPTION, CENTRAL_OPTION, getStateShortName } from "../constants/states";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  services?: SuggestedService[];
  engine?: string;
  timestamp: string;
}

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
  selectedState: initialSelectedState = "ALL"
}) => {
  const { t, i18n } = useTranslation();
  const [chatState, setChatState] = useState<string>(initialSelectedState);
  const [inputQuery, setInputQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Gemini API Key Management
  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => localStorage.getItem("mahaseva_gemini_key") || "");
  const [showKeyDrawer, setShowKeyDrawer] = useState<boolean>(false);
  const [showKeyText, setShowKeyText] = useState<boolean>(false);
  const [validatingKey, setValidatingKey] = useState<boolean>(false);
  const [keyStatusMsg, setKeyStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isKeyActive, setIsKeyActive] = useState<boolean>(() => !!localStorage.getItem("mahaseva_gemini_key"));

  // Chat Conversation History
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Sync state filter if parent updates
  useEffect(() => {
    if (initialSelectedState) {
      setChatState(initialSelectedState);
    }
  }, [initialSelectedState]);

  // Initial welcome message on open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeText = 
        i18n.language === "mr"
          ? "नमस्ते! मी भारतातील सर्व २८ राज्ये आणि ८ केंद्रशासित प्रदेशांसाठी आपला AI डिजिटल सेवा मार्गदर्शक आहे. मी आपली काय मदत करू शकतो? आपण दाखले, ७/१२ जमिनीच्या नोंदी, वीज जोडणी, रेशन कार्ड किंवा पेन्शन योजनांबद्दल विचारू शकता."
          : i18n.language === "hi"
          ? "नमस्ते! मैं भारत के सभी 28 राज्यों एवं 8 केंद्र शासित प्रदेशों के लिए आपका आधिकारिक AI डिजिटल सेवा सहायक हूँ। मैं आपकी क्या मदद कर सकता हूँ? आप जाति, आय, मूल निवास प्रमाण पत्र, भू-अभिलेख, बिजली या नल कनेक्शन अथवा पेंशन के बारे में पूछ सकते हैं।"
          : "Namaste! I am your AI Citizen Public Services Guide for all 28 States and 8 Union Territories of India. How can I assist you today? You can ask about certificates, land records, electricity meters, food security ration cards, or welfare schemes.";

      setMessages([
        {
          id: "welcome-1",
          role: "assistant",
          text: welcomeText,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          engine: isKeyActive ? "gemini-2.5-flash" : "local-catalog-intelligence"
        }
      ]);
    }
  }, [isOpen, i18n.language]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  if (!isOpen) return null;

  // Handle Testing & Validating Key
  const handleValidateAndSaveKey = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const key = geminiApiKey.trim();
    if (!key) {
      setKeyStatusMsg({ type: "error", text: "Please enter an API key." });
      return;
    }

    setValidatingKey(true);
    setKeyStatusMsg(null);

    try {
      const res = await api.post("/assistant/validate-key", { api_key: key });
      if (res.data.valid) {
        localStorage.setItem("mahaseva_gemini_key", key);
        setIsKeyActive(true);
        setKeyStatusMsg({ type: "success", text: "✨ Google Gemini 2.5 Flash connected and verified successfully!" });
        setTimeout(() => setShowKeyDrawer(false), 2000);
      } else {
        setKeyStatusMsg({ type: "error", text: res.data.message || "Invalid Gemini API key." });
      }
    } catch (err: any) {
      setKeyStatusMsg({ type: "error", text: "Connection error: Unable to contact Gemini API." });
    } finally {
      setValidatingKey(false);
    }
  };

  const handleClearKey = () => {
    setGeminiApiKey("");
    localStorage.removeItem("mahaseva_gemini_key");
    setIsKeyActive(false);
    setKeyStatusMsg(null);
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  // Send message
  const handleSend = async (userQuery?: string) => {
    const q = (userQuery || inputQuery).trim();
    if (!q || loading) return;

    const userMsgId = "msg-" + Date.now();
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: "user",
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setLoading(true);

    try {
      // Build history context for multi-turn conversational reasoning
      const historyContext = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.text
      }));

      const payload: any = {
        query: q,
        language: i18n.language,
        history: historyContext
      };

      if (geminiApiKey.trim()) {
        payload.api_key = geminiApiKey.trim();
      }

      if (chatState && chatState !== "ALL") {
        payload.state_code = chatState;
      }

      const res = await api.post("/assistant/chat", payload);

      const botMsg: ChatMessage = {
        id: "bot-" + Date.now(),
        role: "assistant",
        text: res.data.response,
        services: res.data.suggested_services || [],
        engine: res.data.engine || (geminiApiKey.trim() ? "gemini-2.5-flash" : "local-catalog-intelligence"),
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      const errMsg: ChatMessage = {
        id: "err-" + Date.now(),
        role: "assistant",
        text:
          i18n.language === "mr"
            ? "माहिती मिळवताना तांत्रिक अडचण आली. कृपया पुन्हा प्रयत्न करा."
            : i18n.language === "hi"
            ? "जानकारी प्राप्त करते समय तकनीकी समस्या आई। कृपया पुनः प्रयास करें।"
            : "An error occurred while consulting the assistant. Please try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const samplePrompts = [
    {
      en: "How do I get my CBSE 10th / 12th digital marksheet or duplicate certificate?",
      mr: "सीबीएसई १० वी / १२ वी डिजिटल गुणपत्रिका किंवा द्वितीयक प्रत कशी मिळवावी?",
      hi: "सीबीएसई 10वीं / 12वीं की डिजिटल मार्कशीट या माइग्रेशन सर्टिफिकेट कैसे प्राप्त करें?"
    },
    {
      en: "How can I verify Maharashtra State Board SSC / HSC marksheet on e-MarkSheet?",
      mr: "महाराष्ट्र राज्य मंडळाची १० वी व १२ वी गुणपत्रिका e-MarkSheet वर कशी पडताळावी?",
      hi: "महाराष्ट्र बोर्ड 10वीं/12वीं अंकतालिका e-MarkSheet से कैसे सत्यापित करें?"
    },
    {
      en: "How to apply for National Scholarship Portal (NSP) schemes?",
      mr: "राष्ट्रीय शिष्यवृत्ती पोर्टल (NSP) योजनांसाठी अर्ज कसा करावा?",
      hi: "राष्ट्रीय छात्रवृत्ति पोर्टल (NSP) योजनाओं के लिए आवेदन कैसे करें?"
    },
    {
      en: "How do I get an Income Certificate for college scholarship?",
      mr: "महाविद्यालयीन शिष्यवृत्तीसाठी उत्पन्नाचा दाखला कसा मिळवावा?",
      hi: "कॉलेज छात्रवृत्ति हेतु आय प्रमाण पत्र के लिए कैसे आवेदन करें?"
    },
    {
      en: "Need a new BESCOM electricity meter connection in Bengaluru",
      mr: "बंगळुरूमध्ये नवीन बेस्कॉम वीज मीटर कनेक्शन हवे आहे",
      hi: "बेंगलुरु में नए बेस्कॉम बिजली मीटर कनेक्शन के लिए क्या चाहिए?"
    },
    {
      en: "How to apply for Delhi NFSA Food Security Ration Card?",
      mr: "दिल्ली अन्न सुरक्षा रेशन कार्डसाठी अर्ज कसा करावा?",
      hi: "दिल्ली में ई-डिस्ट्रिक्ट खाद्य सुरक्षा राशन कार्ड कैसे बनेगा?"
    },
    {
      en: "Need official 7/12 Land Record and mutation in Maharashtra",
      mr: "महाराष्ट्रात अधिकृत ७/१२ सातबारा व फेरफार उतारा हवा आहे",
      hi: "महाराष्ट्र में आधिकारिक 7/12 भूलेख एवं दाखिल खारिज नकल"
    },
    {
      en: "Apply for Rajasthan Mool Niwas / Bonafide Resident certificate",
      mr: "राजस्थान मूल निवासी दाखल्यासाठी अर्ज करा",
      hi: "राजस्थान मूल निवास प्रमाण पत्र (e-Mitra) कैसे प्राप्त करें?"
    },
    {
      en: "Procedure for J&K e-UNNAT Domicile Certificate",
      mr: "जम्मू व काश्मीर अधिवास प्रमाणपत्राची प्रक्रिया काय आहे?",
      hi: "जम्मू-कश्मीर ई-उन्नत अधिवास (Domicile) प्रमाण पत्र की प्रक्रिया"
    }
  ];

  const getServiceTitle = (svc: SuggestedService) => {
    if (i18n.language === "hi" && svc.name_hi) return svc.name_hi;
    if (i18n.language === "mr" && svc.name_mr) return svc.name_mr;
    return svc.name;
  };

  const statesList = ALL_INDIA_STATES_AND_UTS.filter((s) => s.type === "STATE");
  const utsList = ALL_INDIA_STATES_AND_UTS.filter((s) => s.type === "UT");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col h-[90vh] max-h-[820px]">
        {/* Chatbot Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-800 text-white p-4 sm:p-5 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md text-amber-300 shadow-inner">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-base sm:text-lg leading-tight tracking-tight">
                  {i18n.language === "mr"
                    ? "स्मार्ट AI सेवा सहाय्यक"
                    : i18n.language === "hi"
                    ? "स्मार्ट AI सेवा सहायक"
                    : "Maha-Seva AI Chatbot"}
                </h3>
                {isKeyActive ? (
                  <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/40">
                    <Sparkles className="w-2.5 h-2.5 mr-1 text-amber-300" />
                    Gemini 2.5 Flash
                  </span>
                ) : (
                  <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/40">
                    <Cpu className="w-2.5 h-2.5 mr-1 text-blue-300" />
                    Local Intelligence
                  </span>
                )}
              </div>
              <p className="text-[11px] text-blue-200 mt-0.5">
                {i18n.language === "mr"
                  ? "भारतातील २८ राज्ये व ८ केंद्रशासित प्रदेशांसाठी अधिकृत AI मार्गदर्शक"
                  : i18n.language === "hi"
                  ? "भारत के सभी 28 राज्यों एवं 8 केंद्र शासित प्रदेशों का अधिकृत AI मार्गदर्शक"
                  : "All-India Government Public Services AI Assistant (36 States & UTs)"}
              </p>
            </div>
          </div>

          {/* Header Action Controls */}
          <div className="flex items-center space-x-2">
            {/* Jurisdiction State Filter */}
            <select
              value={chatState}
              onChange={(e) => setChatState(e.target.value)}
              className="bg-white/10 hover:bg-white/20 text-white font-semibold text-xs px-2.5 py-1.5 rounded-lg border border-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400 cursor-pointer max-w-[140px] sm:max-w-[170px]"
              title="Filter by State/UT"
            >
              <option value="ALL" className="text-slate-900">
                {i18n.language === "hi" ? "अखिल भारतीय (All India)" : i18n.language === "mr" ? "अखिल भारतीय (All India)" : "All India (36 States & UTs)"}
              </option>
              <option value="CENTRAL" className="text-blue-950 font-bold bg-blue-50">
                🏛️ {i18n.language === "hi" ? "भारत सरकार (केन्द्र सरकार / CBSE)" : i18n.language === "mr" ? "भारत सरकार (केंद्र सरकार / CBSE)" : "Central Govt (CBSE & National)"}
              </option>
              <optgroup label="28 States" className="text-slate-900">
                {statesList.map((st) => (
                  <option key={st.code} value={st.code} className="text-slate-900">
                    {i18n.language === "hi" ? `${st.hi} (${st.code})` : i18n.language === "mr" ? `${st.mr} (${st.code})` : `${st.name} (${st.code})`}
                  </option>
                ))}
              </optgroup>
              <optgroup label="8 Union Territories" className="text-slate-900">
                {utsList.map((ut) => (
                  <option key={ut.code} value={ut.code} className="text-slate-900">
                    {i18n.language === "hi" ? `${ut.hi} (${ut.code})` : i18n.language === "mr" ? `${ut.mr} (${ut.code})` : `${ut.name} (${ut.code})`}
                  </option>
                ))}
              </optgroup>
            </select>

            {/* Gemini API Key Toggle Button */}
            <button
              onClick={() => setShowKeyDrawer(!showKeyDrawer)}
              title="Configure Gemini 2.5 Flash API Key"
              className={`p-2 rounded-lg transition flex items-center space-x-1 ${
                isKeyActive
                  ? "bg-amber-400 text-slate-950 font-bold shadow-sm"
                  : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
              }`}
            >
              <Key className="w-4 h-4" />
              <span className="text-[11px] hidden sm:inline">{isKeyActive ? "AI Key Active" : "Set AI Key"}</span>
            </button>

            {/* Clear Conversation */}
            <button
              onClick={handleClearChat}
              title="Clear Conversation"
              className="p-2 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Close Modal */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Gemini API Key Drawer */}
        {showKeyDrawer && (
          <div className="bg-slate-900 text-white p-4 border-b border-slate-700 animate-fadeIn">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-300 flex items-center">
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                Google Gemini API Key Activation
              </span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center underline"
              >
                <span>Get Free Gemini Key</span>
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </div>
            <p className="text-[11px] text-slate-300 mb-3">
              Enter your Gemini API key to activate real-time conversational reasoning with <code className="text-amber-300 font-mono">gemini-2.5-flash</code>. Your key is stored securely in local browser storage and used only for your queries.
            </p>
            <form onSubmit={handleValidateAndSaveKey} className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input
                  type={showKeyText ? "text" : "password"}
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  placeholder="AIzaSy... (Paste your Google Gemini API Key here)"
                  className="w-full pl-3 pr-9 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowKeyText(!showKeyText)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                >
                  {showKeyText ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={validatingKey || !geminiApiKey.trim()}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold text-xs transition flex items-center justify-center shrink-0"
                >
                  {validatingKey ? (
                    <span className="flex items-center">
                      <span className="w-3 h-3 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mr-1.5" />
                      Testing...
                    </span>
                  ) : (
                    "Test & Connect"
                  )}
                </button>

                {geminiApiKey && (
                  <button
                    type="button"
                    onClick={handleClearKey}
                    className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition shrink-0"
                  >
                    Clear
                  </button>
                )}
              </div>
            </form>

            {keyStatusMsg && (
              <div className={`mt-2.5 p-2 rounded-lg text-xs flex items-center space-x-1.5 ${
                keyStatusMsg.type === "success"
                  ? "bg-emerald-950/70 border border-emerald-500/40 text-emerald-300"
                  : "bg-rose-950/70 border border-rose-500/40 text-rose-300"
              }`}>
                {keyStatusMsg.type === "success" ? (
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                )}
                <span>{keyStatusMsg.text}</span>
              </div>
            )}
          </div>
        )}

        {/* Informational Banner if no Key */}
        {!isKeyActive && !showKeyDrawer && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between text-xs text-amber-900">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Running in <strong>Local Intelligence</strong> mode. Add a free Gemini API key to activate multi-turn conversational AI reasoning.
              </span>
            </div>
            <button
              onClick={() => setShowKeyDrawer(true)}
              className="font-bold underline text-amber-900 hover:text-amber-950 text-xs shrink-0 ml-2"
            >
              Add Key
            </button>
          </div>
        )}

        {/* Chat Conversation Thread */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${
                msg.role === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-gradient-to-tr from-indigo-700 to-blue-700 text-amber-300"
                }`}
              >
                {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-sm leading-relaxed shadow-sm ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-tr-none"
                    : "bg-white border border-slate-200 text-slate-800 rounded-tl-none"
                }`}
              >
                {/* Meta Header for Assistant */}
                {msg.role === "assistant" && (
                  <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-slate-100 text-[10px] text-slate-400">
                    <span className="font-semibold text-slate-600">
                      {i18n.language === "mr" ? "शासकीय सेवा सहाय्यक" : i18n.language === "hi" ? "सरकारी सेवा सहायक" : "Maha-Seva Assistant"}
                    </span>
                    <div className="flex items-center space-x-1.5">
                      {msg.engine === "gemini-2.5-flash" ? (
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          Gemini 2.5 Flash
                        </span>
                      ) : (
                        <span className="text-blue-700 font-semibold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                          Catalog Intelligence
                        </span>
                      )}
                      <span>{msg.timestamp}</span>
                    </div>
                  </div>
                )}

                {/* Text Content */}
                <div className="whitespace-pre-line">{msg.text}</div>

                {/* Embedded Matching Service Cards */}
                {msg.services && msg.services.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-2.5">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      {i18n.language === "mr"
                        ? "संबंधित अधिकृत सरकारी सेवा:"
                        : i18n.language === "hi"
                        ? "संबंधित आधिकारिक सरकारी सेवाएं:"
                        : "Recommended Government Services:"}
                    </span>
                    <div className="grid gap-2">
                      {msg.services.map((svc) => (
                        <div
                          key={svc.id}
                          className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-blue-400 hover:shadow-md transition flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center space-x-1.5">
                              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                                {svc.state_code || "MH"}
                              </span>
                              <h6 className="font-bold text-slate-900 text-sm">
                                {getServiceTitle(svc)}
                              </h6>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-500">
                              <span className="flex items-center truncate max-w-[150px]">
                                <Building className="w-3 h-3 mr-1 text-slate-400 shrink-0" />
                                {svc.department_name}
                              </span>
                              <span className="flex items-center">
                                <Clock className="w-3 h-3 mr-1 text-slate-400 shrink-0" />
                                {svc.processing_days} {t("common.days")}
                              </span>
                              <span className="font-bold text-emerald-600">
                                {svc.fee === 0 ? t("common.free") : `₹${svc.fee}`}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              onClose();
                              onSelectService(svc.id);
                            }}
                            className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition shrink-0"
                          >
                            <span>{t("common.apply_now")}</span>
                            <ArrowRight className="w-3.5 h-3.5 ml-1" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {msg.role === "user" && (
                  <div className="text-[10px] text-blue-200 text-right mt-1">
                    {msg.timestamp}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-700 text-amber-300 flex items-center justify-center shrink-0 shadow-xs">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-4 text-xs text-slate-500 shadow-sm flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce delay-100" />
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce delay-200" />
                <span className="ml-1 font-medium">
                  {isKeyActive ? "Gemini 2.5 Flash is analyzing your query across official catalogs..." : "Checking official All-India services catalog..."}
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Sample Prompts Strip */}
        <div className="px-4 py-2 bg-slate-100 border-t border-slate-200 overflow-x-auto whitespace-nowrap flex gap-1.5 scrollbar-thin">
          <span className="text-[11px] font-semibold text-slate-500 flex items-center mr-1">
            {i18n.language === "hi" ? "त्वरित प्रश्न:" : i18n.language === "mr" ? "उदाहरणे:" : "Quick prompts:"}
          </span>
          {samplePrompts.map((p, idx) => {
            const txt = i18n.language === "mr" ? p.mr : i18n.language === "hi" ? p.hi : p.en;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(txt)}
                disabled={loading}
                className="text-xs px-2.5 py-1 rounded-full bg-white hover:bg-blue-50 hover:text-blue-700 text-slate-700 border border-slate-200 transition shrink-0"
              >
                {txt}
              </button>
            );
          })}
        </div>

        {/* Chat Input Bar */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder={
                i18n.language === "mr"
                  ? "आपल्या गरजेनुसार विचारा (उदा. मला नवीन वीज किंवा नळ जोडणी हवी आहे)..."
                  : i18n.language === "hi"
                  ? "अपनी आवश्यकता बताएं (उदा. मुझे नया बिजली या नल कनेक्शन चाहिए, या राशन कार्ड)..."
                  : "Ask about public services in any state (e.g. need an electricity connection in Bengaluru)..."
              }
              className="flex-1 px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
            />
            <button
              type="submit"
              disabled={loading || !inputQuery.trim()}
              className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm transition shadow-md flex items-center justify-center shrink-0"
            >
              <Send className="w-4 h-4 mr-1.5" />
              <span>Send</span>
            </button>
          </form>
          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 px-1">
            <span>Grounded on official All-India Right to Public Services catalogs. Zero hallucination.</span>
            <span>Current Scope: <strong>{getStateShortName(chatState, i18n.language)}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
