import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { 
  Sparkles, 
  Send, 
  X, 
  ArrowRight, 
  Clock, 
  Building, 
  Cpu, 
  Bot, 
  User, 
  RotateCcw,
  ShieldCheck,
  Lock
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

const renderInlineText = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-bold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={index} className="px-1 py-0.5 bg-slate-100 text-blue-700 rounded text-xs font-mono">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
};

const isTableSeparator = (line: string): boolean => {
  const trimmed = line.trim();
  if (!trimmed.includes("|")) return false;
  const clean = trimmed.replace(/^\||\|$/g, "");
  const parts = clean.split("|").map((p) => p.trim());
  return parts.length > 0 && parts.every((p) => /^:?-+:?$/.test(p));
};

const parseTableRow = (line: string): string[] => {
  const trimmed = line.trim();
  const clean = trimmed.replace(/^\||\|$/g, "");
  return clean.split("|").map((c) => c.trim());
};

const renderTableCell = (cellText: string) => {
  const clean = cellText.trim();
  const rawParts = clean
    .split(/(?:<br\s*\/?>|\n|(?<=\s)•\s*|(?<=^)•\s*)/gi)
    .map((s) => s.trim())
    .filter(Boolean);

  if (rawParts.length > 1) {
    return (
      <ul className="space-y-1 my-0.5">
        {rawParts.map((item, idx) => (
          <li key={idx} className="flex items-start gap-1.5 text-xs text-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1 shrink-0" />
            <span className="flex-1 leading-snug">{renderInlineText(item.replace(/^[-*•]\s*/, ""))}</span>
          </li>
        ))}
      </ul>
    );
  }
  return <span className="leading-snug">{renderInlineText(clean)}</span>;
};

interface ParsedBlock {
  type: "heading3" | "heading4" | "callout" | "table" | "bullet_list" | "numbered_list" | "paragraph";
  content?: string;
  items?: string[];
  headers?: string[];
  rows?: string[][];
}

const parseMarkdownBlocks = (text: string): ParsedBlock[] => {
  const normalized = text.replace(/\r\n/g, "\n");
  const rawLines = normalized.split("\n");
  const blocks: ParsedBlock[] = [];

  let i = 0;
  while (i < rawLines.length) {
    const line = rawLines[i].trim();

    if (!line) {
      i++;
      continue;
    }

    if (line.startsWith("### ")) {
      blocks.push({
        type: "heading3",
        content: line.replace(/^###\s+/, "")
      });
      i++;
      continue;
    }

    if (line.startsWith("#### ")) {
      blocks.push({
        type: "heading4",
        content: line.replace(/^####\s+/, "")
      });
      i++;
      continue;
    }

    if (/^(?:💡|👉|📌|⚠️|✅|🏛️)/.test(line)) {
      blocks.push({
        type: "callout",
        content: line
      });
      i++;
      continue;
    }

    if (line.includes("|") && i + 1 < rawLines.length && isTableSeparator(rawLines[i + 1])) {
      const headers = parseTableRow(line);
      i += 2;
      const rows: string[][] = [];
      while (i < rawLines.length && rawLines[i].includes("|") && rawLines[i].trim().length > 0) {
        if (!isTableSeparator(rawLines[i])) {
          rows.push(parseTableRow(rawLines[i]));
        }
        i++;
      }
      blocks.push({
        type: "table",
        headers,
        rows
      });
      continue;
    }

    if (/^[-*•]\s+/.test(line)) {
      const items: string[] = [];
      while (i < rawLines.length && /^[-*•]\s+/.test(rawLines[i].trim())) {
        items.push(rawLines[i].trim().replace(/^[-*•]\s+/, ""));
        i++;
      }
      blocks.push({
        type: "bullet_list",
        items
      });
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < rawLines.length && /^\d+\.\s+/.test(rawLines[i].trim())) {
        items.push(rawLines[i].trim().replace(/^\d+\.\s+/, ""));
        i++;
      }
      blocks.push({
        type: "numbered_list",
        items
      });
      continue;
    }

    blocks.push({
      type: "paragraph",
      content: line
    });
    i++;
  }

  return blocks;
};

const renderFormattedResponse = (content: string) => {
  const blocks = parseMarkdownBlocks(content);
  return (
    <div className="space-y-3 text-xs sm:text-sm leading-relaxed text-slate-800">
      {blocks.map((block, bIdx) => {
        if (block.type === "heading3" && block.content) {
          return (
            <h3
              key={bIdx}
              className="text-sm sm:text-base font-extrabold text-slate-900 pt-1 pb-1.5 border-b border-slate-200/80"
            >
              {renderInlineText(block.content)}
            </h3>
          );
        }

        if (block.type === "heading4" && block.content) {
          return (
            <h4
              key={bIdx}
              className="text-xs sm:text-sm font-bold text-blue-950 mt-2 mb-1"
            >
              {renderInlineText(block.content)}
            </h4>
          );
        }

        if (block.type === "callout" && block.content) {
          const iconMatch = block.content.match(/^(💡|👉|📌|⚠️|✅|🏛️)/);
          const icon = iconMatch ? iconMatch[1] : "💡";
          const text = block.content.replace(/^(?:💡|👉|📌|⚠️|✅|🏛️)\s*/, "");
          return (
            <div
              key={bIdx}
              className="p-3 rounded-xl bg-blue-50/90 border border-blue-200 text-blue-950 text-xs my-2.5 flex items-start gap-2.5 shadow-xs"
            >
              <span className="text-base shrink-0 select-none">{icon}</span>
              <div className="flex-1 font-medium leading-relaxed">{renderInlineText(text)}</div>
            </div>
          );
        }

        if (block.type === "table" && block.headers && block.rows) {
          return (
            <div
              key={bIdx}
              className="my-3 overflow-hidden rounded-xl border border-slate-200/90 shadow-sm bg-white"
            >
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white">
                      {block.headers.map((h, hIdx) => (
                        <th
                          key={hIdx}
                          className="py-2.5 px-3.5 font-bold text-[11px] sm:text-xs tracking-wide uppercase text-white whitespace-nowrap"
                        >
                          {renderInlineText(h)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {block.rows.map((row, rIdx) => (
                      <tr
                        key={rIdx}
                        className="hover:bg-blue-50/40 transition-colors odd:bg-white even:bg-slate-50/60"
                      >
                        {row.map((cell, cIdx) => (
                          <td
                            key={cIdx}
                            className="py-2.5 px-3.5 text-slate-700 align-top leading-relaxed text-xs sm:text-sm font-normal"
                          >
                            {renderTableCell(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        }

        if (block.type === "bullet_list" && block.items) {
          return (
            <ul key={bIdx} className="space-y-1.5 pl-1 my-1.5">
              {block.items.map((item, lIdx) => (
                <li key={lIdx} className="flex items-start gap-2 text-slate-700 text-xs sm:text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                  <span className="flex-1 leading-relaxed">{renderInlineText(item)}</span>
                </li>
              ))}
            </ul>
          );
        }

        if (block.type === "numbered_list" && block.items) {
          return (
            <ol key={bIdx} className="space-y-1.5 pl-1 my-1.5">
              {block.items.map((item, lIdx) => (
                <li key={lIdx} className="flex items-start gap-2 text-slate-700 text-xs sm:text-sm">
                  <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {lIdx + 1}
                  </span>
                  <span className="flex-1 leading-relaxed">{renderInlineText(item)}</span>
                </li>
              ))}
            </ol>
          );
        }

        if (block.type === "paragraph" && block.content) {
          return (
            <p key={bIdx} className="text-xs sm:text-sm text-slate-800 leading-relaxed">
              {renderInlineText(block.content)}
            </p>
          );
        }

        return null;
      })}
    </div>
  );
};

interface SmartAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectService: (serviceId: string | number) => void;
  selectedState?: string;
  onRequireLogin?: () => void;
}

export const SmartAssistantModal: React.FC<SmartAssistantModalProps> = ({
  isOpen,
  onClose,
  onSelectService,
  selectedState = "ALL",
  onRequireLogin,
}) => {
  const { t, i18n } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasServerKey, setHasServerKey] = useState<boolean>(true);
  const [activeModelName, setActiveModelName] = useState<string>("gemini-2.0-flash");
  const [chatState, setChatState] = useState<string>(selectedState || "ALL");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setChatState(selectedState || "ALL");
  }, [selectedState]);

  useEffect(() => {
    if (isOpen) {
      checkKeyStatus();
      if (messages.length === 0) {
        initWelcomeMessage();
      }
    }
  }, [isOpen, i18n.language]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const checkKeyStatus = async () => {
    try {
      const res = await api.get("/assistant/key-status");
      setHasServerKey(res.data.has_key);
      if (res.data.model) {
        setActiveModelName(res.data.model);
      }
    } catch {
      setHasServerKey(false);
    }
  };

  const getGreetingText = () => {
    if (i18n.language === "mr") {
      return `🙏 नमस्कार! मी **Maha-Seva AI स्मार्ट मदतनीस** आहे.
मी तुम्हाला महाराष्ट्र, कर्नाटक, गुजरात, दिल्ली, उत्तर प्रदेश आणि केंद्र सरकारच्या सर्व शासकीय सेवा, दाखले आणि कल्याणकारी योजनांबद्दल अचूक माहिती देईन.

खालीलपैकी कशाबद्दल माहिती हवी आहे?
• 📄 **शासकीय दाखले**: उत्पन्न दाखला, जात प्रमाणपत्र, अधिवास, नॉन-क्रिमीलेअर, ७/१२ उतारा
• 🚜 **शेतकरी योजना**: पीएम किसान, महाकृषी सौर कृषी पंप अनुदान, पीक विमा
• 🌸 **महिला व बाल योजना**: लाडकी बहीण योजना, मातृ वंदना, सुकन्या समृद्धी
• 🎓 **विद्यार्थी शिष्यवृत्ती**: महाडीबीटी उच्च शिक्षण शिष्यवृत्ती, स्वाधार योजना
• 💼 **व्यवसाय व कर्ज**: पीएमईजीपी (PMEGP), मुद्रा कर्ज, अण्णासाहेब पाटील महामंडळ कर्ज`;
    }
    if (i18n.language === "hi") {
      return `🙏 नमस्ते! मैं **Maha-Seva AI स्मार्ट सहायक** हूँ।
मैं आपको महाराष्ट्र, कर्नाटक, गुजरात, दिल्ली, उत्तर प्रदेश और भारत सरकार की सभी लोक सेवाओं, प्रमाण पत्रों और जनकल्याणकारी योजनाओं की सटीक जानकारी प्रदान करूँगा।

आप किस विषय पर जानकारी चाहते हैं?
• 📄 **सरकारी प्रमाण पत्र**: आय प्रमाण पत्र, जाति प्रमाण पत्र, मूल निवास, ईडब्ल्यूएस, खतौनी / 7/12
• 🚜 **किसान योजनाएं**: पीएम-किसान सम्मान निधि, सोलर पंप सब्सिडी, फसल बीमा
• 🌸 **महिला कल्याण**: लाडली बहना योजना, मातृ वंदना, सुकन्या समृद्धि
• 🎓 **छात्रवृत्ति योजनाएं**: राष्ट्रीय छात्रवृत्ति (NSP), पोस्ट-मैट्रिक स्कॉलरशिप
• 💼 **रोजगार व उद्योग**: पीएमईजीपी (PMEGP), मुद्रा लोन, एमएसएमई अनुदान`;
    }
    return `🙏 Welcome to **Maha-Seva AI Assistant**!
I am your official public services assistant powered by Gemini. I can guide you through statutory certificates, welfare schemes, and direct benefit transfers across **all 28 States, 8 UTs, and Central Government**.

What would you like assistance with today?
• 📄 **Statutory Certificates**: Income, Caste, Domicile, EWS, 7/12 land records
• 🚜 **Farmer Schemes**: PM-KISAN, Solar Agri Pump subsidies, Crop insurance
• 🌸 **Women & Child Welfare**: Ladki Bahin, Matru Vandana, Sukanya Samriddhi
• 🎓 **Scholarships**: NSP National Scholarships, MahaDBT post-matric grants
• 💼 **MSME & Livelihood**: PMEGP subsidy, MUDRA enterprise loans`;
  };

  const initWelcomeMessage = () => {
    const welcome: ChatMessage = {
      id: "welcome-msg",
      role: "assistant",
      text: getGreetingText(),
      engine: "catalog",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };
    setMessages([welcome]);
  };

  const handleSend = async (customQuery?: string) => {
    const q = (customQuery || inputQuery).trim();
    if (!q || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customQuery) setInputQuery("");
    setLoading(true);

    try {
      const historyPayload = messages.map((m) => ({
        role: m.role,
        content: m.text
      }));

      const res = await api.post("/assistant/query", {
        query: q,
        language: i18n.language,
        state_code: chatState,
        conversation_history: historyPayload
      });

      const assistantMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        role: "assistant",
        text: res.data.answer,
        services: res.data.suggested_services || [],
        engine: res.data.engine || "catalog",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        text: i18n.language === "mr"
          ? "क्षमस्व, सहाय्यक सर्व्हरशी संपर्क साधताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा."
          : i18n.language === "hi"
          ? "क्षमा करें, सहायक सर्वर से संपर्क करने में त्रुटि हुई। कृपया पुनः प्रयास करें।"
          : "Sorry, I encountered an issue reaching the assistant gateway. Please try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    initWelcomeMessage();
  };

  if (!isOpen) return null;

  const samplePrompts = [
    { en: "How to apply for Income Certificate?", hi: "आय प्रमाण पत्र के लिए क्या पात्रता है?", mr: "उत्पन्न दाखल्यासाठी कोणती कागदपत्रे लागतात?" },
    { en: "Tell me about Solar Pump Subsidy", hi: "सोलर पंप योजना की जानकारी दें", mr: "सौर कृषी पंप योजनेची माहिती सांगा" },
    { en: "Majhi Ladki Bahin Scheme benefits", hi: "लाडली बहना योजना के लाभ व दस्तावेज", mr: "माझी लाडकी बहीण योजनेचे नियम काय आहेत?" },
    { en: "Karnataka Domicile & Caste Certificate", hi: "कर्नाटक अधिवास व जाति प्रमाण पत्र", mr: "कर्नाटक रहिवासी व जात दाखला" }
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
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-800 text-white p-3.5 sm:p-5 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 shrink-0 shadow-md">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md text-amber-300 shadow-sm">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-base sm:text-lg leading-tight tracking-tight text-white">
                  {i18n.language === "mr"
                    ? "स्मार्ट AI सेवा सहाय्यक"
                    : i18n.language === "hi"
                    ? "स्मार्ट AI सेवा सहायक"
                    : "Maha-Seva AI Chatbot"}
                </h3>
                {hasServerKey ? (
                  <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/40">
                    <Sparkles className="w-2.5 h-2.5 mr-1 text-amber-300" />
                    {activeModelName.includes("2.0") ? "Gemini 2.0 Flash" : activeModelName.includes("1.5") ? "Gemini 1.5 Flash" : "Google Gemini"}
                  </span>
                ) : (
                  <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/40">
                    <Cpu className="w-2.5 h-2.5 mr-1 text-blue-300" />
                    Catalog Intelligence
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
              className="bg-white/10 hover:bg-white/20 text-white font-semibold text-xs px-2.5 py-1.5 rounded-lg border border-white/20 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer max-w-[140px] sm:max-w-[170px]"
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

            {/* Clear Conversation */}
            <button
              onClick={handleClearChat}
              title="Clear Conversation"
              className="p-2 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Close Modal */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {!isAuthenticated ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 text-center bg-slate-50">
            <div className="w-16 h-16 rounded-3xl bg-amber-100 border-2 border-amber-300 flex items-center justify-center text-amber-700 shadow-md mb-4">
              <Lock className="w-8 h-8" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-amber-200 text-amber-950 px-2.5 py-0.5 rounded-full border border-amber-300">
              {i18n.language === "mr" ? "प्रगत डिजिटल सेवा" : i18n.language === "hi" ? "उन्नत डिजिटल सेवा" : "Advanced Digital Service"}
            </span>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-2">
              {i18n.language === "mr"
                ? "AI सेवा सहाय्यकासाठी लॉगिन आवश्यक"
                : i18n.language === "hi"
                ? "AI सेवा सहायक के लिए लॉगिन आवश्यक"
                : "Sign In Required for AI Service Assistant"}
            </h3>
            <p className="text-xs text-slate-600 max-w-md mt-2 leading-relaxed">
              {i18n.language === "mr"
                ? "आपण संकेतस्थळावरील सर्व शासकीय योजना, दाखले आणि अर्जांचे नियम विनामूल्य पाहू शकता. परंतु AI सेवा सहाय्यक, वैयक्तिक मार्गदर्शन आणि अर्जाच्या पुढील प्रक्रियेसाठी कृपया लॉगिन करा."
                : i18n.language === "hi"
                ? "आप वेबसाइट पर सभी सरकारी योजनाओं, प्रमाण पत्रों और नियमों को बिना लॉगिन देख सकते हैं। परंतु AI सेवा सहायक, व्यक्तिगत मार्गदर्शन और आवेदन की आगे की प्रक्रिया हेतु कृपया लॉगिन करें।"
                : "You can freely browse all government schemes, certificates, and application forms without signing in. To use the AI Smart Assistant for personalized guidance and eligibility verification, please sign in."}
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onRequireLogin) onRequireLogin();
                }}
                className="px-6 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-md transition cursor-pointer flex items-center space-x-2"
              >
                <User className="w-4 h-4" />
                <span>{i18n.language === "mr" ? "लॉगिन करा" : i18n.language === "hi" ? "लॉगिन करें" : "Sign In with Dialog"}</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                {i18n.language === "mr" ? "योजना ब्राउझ करा" : i18n.language === "hi" ? "योजनाएं देखें" : "Continue Browsing Schemes"}
              </button>
            </div>
          </div>
        ) : (
          <>
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
                      {msg.engine && msg.engine.toLowerCase().includes("gemini") ? (
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5 text-emerald-600 inline" />
                          {msg.engine.includes("2.0") ? "Gemini 2.0 Flash" : msg.engine.includes("1.5") ? "Gemini 1.5 Flash" : "Google Gemini"}
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
                {msg.role === "assistant" ? (
                  renderFormattedResponse(msg.text)
                ) : (
                  <div className="whitespace-pre-line">{msg.text}</div>
                )}

                {/* Embedded Matching Service Cards */}
                {msg.services && msg.services.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-2.5">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      {i18n.language === "mr"
                        ? "संबंधित अधिकृत सरकारी सेवा व योजना:"
                        : i18n.language === "hi"
                        ? "संबंधित आधिकारिक सरकारी सेवाएं एवं योजनाएं:"
                        : "Recommended Government Services & Schemes:"}
                    </span>
                    <div className="grid gap-2">
                      {msg.services.map((svc) => (
                        <div
                          key={svc.id}
                          className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-white hover:border-blue-400 hover:shadow-md transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-1 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-200">
                                {svc.state_code || "MH"}
                              </span>
                              {svc.service_type === "SCHEME" ? (
                                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                                  <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                                  {i18n.language === "mr" ? "कल्याणकारी योजना" : i18n.language === "hi" ? "सरकारी योजना" : "Welfare Scheme"}
                                </span>
                              ) : (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                                  {i18n.language === "mr" ? "नागरी दाखला" : i18n.language === "hi" ? "सरकारी प्रमाण पत्र" : "Public Service"}
                                </span>
                              )}
                              <h6 className="font-bold text-slate-900 text-sm">
                                {getServiceTitle(svc)}
                              </h6>
                            </div>

                            {svc.benefit_amount && (
                              <div className="inline-flex items-center text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                                🎁 {svc.benefit_amount}
                              </div>
                            )}

                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-0.5">
                              <span className="flex items-center">
                                <Building className="w-3 h-3 mr-1 text-slate-400 shrink-0" />
                                {svc.department_name}
                              </span>
                              <span className="flex items-center">
                                <Clock className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
                                {svc.processing_days} {t("common.days")}
                              </span>
                              <span className="font-bold text-emerald-600">
                                {svc.fee === 0 ? t("common.free") : `₹${svc.fee}`}
                              </span>
                              {svc.documents_required && svc.documents_required.length > 0 && (
                                <span className="text-[11px] text-indigo-700 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                                  📑 {svc.documents_required.length} Docs
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              onClose();
                              onSelectService(svc.id);
                            }}
                            className="inline-flex items-center justify-center px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition shrink-0"
                          >
                            <span>
                              {svc.service_type === "SCHEME"
                                ? (i18n.language === "mr" ? "योजनेसाठी अर्ज करा" : i18n.language === "hi" ? "योजना आवेदन करें" : "Apply for Scheme")
                                : t("common.apply_now")}
                            </span>
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
                  {hasServerKey ? "Google Gemini is analyzing your query across official catalogs..." : "Checking official All-India services catalog..."}
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
                  ? "योजना किंवा दाखल्याबद्दल विचारा (उदा. सोलर पंप अनुदान, लाडकी बहीण, अधिवास, शिष्यवृत्ती)..."
                  : i18n.language === "hi"
                  ? "योजना अथवा प्रमाण पत्र के बारे में पूछें (उदा. सोलर पंप सब्सिडी, लाडली बहना, मूल निवास, छात्रवृत्ति)..."
                  : "Ask about any scheme or document (e.g. PM-KUSUM solar subsidy, Ladki Bahin, Domicile, MUDRA loan)..."
              }
              className="flex-1 px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
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
          <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] text-slate-400 mt-1.5 px-1">
            <span>Grounded on official All-India Right to Public Services catalogs. Zero hallucination.</span>
            <span>Current Scope: <strong>{getStateShortName(chatState, i18n.language)}</strong></span>
          </div>
        </div>
        </>
      )}
      </div>
    </div>
  );
};
