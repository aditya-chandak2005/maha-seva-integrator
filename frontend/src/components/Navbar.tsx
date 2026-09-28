import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { 
  Building2, 
  Globe, 
  Bell, 
  User as UserIcon, 
  LogOut, 
  LayoutDashboard, 
  FileText, 
  ShieldAlert, 
  Menu, 
  X,
  Search,
  RefreshCw,
  Sparkles,
  ChevronDown
} from "lucide-react";
import { NotificationItem } from "../types";

interface NavbarProps {
  currentTab: string;
  onNavigate: (tab: string, param?: any) => void;
  onOpenAssistant: () => void;
  onOpenProfileVault?: (tab?: "profile" | "uploaded-docs") => void;
  onOpenLoginModal?: (notice?: string) => void;
  selectedState?: string;
  onSelectState?: (state: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onNavigate,
  onOpenAssistant,
  onOpenProfileVault,
  onOpenLoginModal,
  selectedState = "ALL",
  onSelectState,
}) => {
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(true);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [servicesDropdownOpen, setServicesDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const servicesDropdownRef = useRef<HTMLDivElement>(null);
  const notifDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        servicesDropdownRef.current &&
        !servicesDropdownRef.current.contains(event.target as Node)
      ) {
        setServicesDropdownOpen(false);
      }
      if (
        notifDropdownRef.current &&
        !notifDropdownRef.current.contains(event.target as Node)
      ) {
        setNotifDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated, currentTab]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data || []);
    } catch (err) {
      // Silently ignore if not logged in
    }
  };

  const markAllRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const setLanguage = (lang: "en" | "mr" | "hi") => {
    i18n.changeLanguage(lang);
    localStorage.setItem("mahaseva_lang", lang);
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm transition-colors">
      {/* Main Navbar */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div
          onClick={() => onNavigate("home")}
          className="flex items-center space-x-2.5 sm:space-x-3 cursor-pointer group shrink-0"
        >
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-800 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition">
            <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="font-extrabold text-lg sm:text-xl text-slate-900 tracking-tight leading-none flex items-center">
              Maha-Seva
              <span className="text-orange-600 ml-1.5">Integrator</span>
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-500 font-semibold uppercase tracking-wider mt-1 hidden sm:block">
              {i18n.language === "mr"
                ? "एक व्यासपीठ. अनेक शासकीय सेवा."
                : i18n.language === "hi"
                ? "एक मंच. अनेक सरकारी सेवाएं."
                : "Federated Digital Public Services Gateway"}
            </div>
          </div>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center space-x-1 xl:space-x-2 text-xs xl:text-sm font-semibold text-slate-700">
          <button
            onClick={() => onNavigate("home")}
            className={`px-2.5 xl:px-3 py-2 rounded-lg transition ${
              currentTab === "home"
                ? "text-blue-700 bg-blue-50 font-bold"
                : "hover:text-blue-600 hover:bg-slate-50"
            }`}
          >
            {t("nav.home")}
          </button>

          {/* Single Services Button with Dropdown Menu containing Documents & Schemes */}
          <div className="relative" ref={servicesDropdownRef}>
            <button
              onClick={() => setServicesDropdownOpen((prev) => !prev)}
              className={`px-2.5 xl:px-3 py-2 rounded-lg transition flex items-center space-x-1.5 cursor-pointer ${
                currentTab === "services"
                  ? "text-blue-700 bg-blue-50 font-bold"
                  : servicesDropdownOpen
                  ? "text-blue-700 bg-slate-100 font-semibold"
                  : "hover:text-blue-600 hover:bg-slate-50"
              }`}
              aria-expanded={servicesDropdownOpen}
              aria-haspopup="true"
            >
              <span>{t("nav.services")}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${
                  servicesDropdownOpen ? "rotate-180 text-blue-600" : ""
                }`}
              />
            </button>

            {servicesDropdownOpen && (
              <div className="absolute left-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-fadeIn">
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {i18n.language === "mr" ? "उपलब्ध सेवा प्रकार" : i18n.language === "hi" ? "उपलब्ध सेवाएं" : "Select Service Category"}
                </div>

                {/* Sub-button 1: Documents & Proofs */}
                <button
                  onClick={() => {
                    onNavigate("services", { mode: "documents" });
                    setServicesDropdownOpen(false);
                  }}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-blue-50/80 transition flex items-start space-x-3 group border border-transparent hover:border-blue-200 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white transition shadow-2xs">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-blue-700 transition">
                      {i18n.language === "mr" ? "शासकीय दाखले" : i18n.language === "hi" ? "दस्तावेज व प्रमाण पत्र" : "Documents & Proofs"}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      {i18n.language === "mr"
                        ? "उत्पन्न, जात, अधिवास दाखले व परवाने"
                        : i18n.language === "hi"
                        ? "आय, जाति, निवास प्रमाण पत्र व लाइसेंस"
                        : "Income, caste, domicile certificates & licenses"}
                    </p>
                  </div>
                </button>

                {/* Sub-button 2: Government Schemes & DBT */}
                <button
                  onClick={() => {
                    onNavigate("services", { mode: "schemes" });
                    setServicesDropdownOpen(false);
                  }}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-emerald-50/80 transition flex items-start space-x-3 group border border-transparent hover:border-emerald-200 mt-1 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-emerald-600 group-hover:text-white transition shadow-2xs">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-emerald-700 transition">
                        {i18n.language === "mr" ? "शासकीय योजना" : i18n.language === "hi" ? "सरकारी योजनाएं" : "Government Schemes"}
                      </span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded-md">
                        DBT
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      {i18n.language === "mr"
                        ? "थेट बँक हस्तांतरण, शेती व विद्यार्थी सबसिडी"
                        : i18n.language === "hi"
                        ? "प्रत्यक्ष लाभ (DBT), किसान व छात्रवृत्ति योजनाएं"
                        : "Direct benefit transfers, grants & subsidies"}
                    </p>
                  </div>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigate("track")}
            className={`px-2.5 xl:px-3 py-2 rounded-lg transition ${
              currentTab === "track"
                ? "text-blue-700 bg-blue-50 font-bold"
                : "hover:text-blue-600 hover:bg-slate-50"
            }`}
          >
            {t("nav.track")}
          </button>

          {isAuthenticated && user?.role === "CITIZEN" && (
            <button
              onClick={() => onNavigate("citizen-dashboard")}
              className={`px-2.5 xl:px-3 py-2 rounded-lg transition flex items-center space-x-1.5 ${
                currentTab === "citizen-dashboard"
                  ? "text-blue-700 bg-blue-50 font-bold"
                  : "hover:text-blue-600 hover:bg-slate-50"
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{t("nav.dashboard")}</span>
            </button>
          )}

          {isAuthenticated && (user?.role === "OFFICER" || user?.role === "DEPARTMENT_ADMIN") && (
            <button
              onClick={() => onNavigate("officer-workbench")}
              className={`px-2.5 xl:px-3 py-2 rounded-lg transition flex items-center space-x-1.5 ${
                currentTab === "officer-workbench"
                  ? "text-indigo-700 bg-indigo-50 font-bold"
                  : "text-indigo-600 hover:bg-indigo-50"
              }`}
            >
              <FileText className="w-4 h-4 mr-1 shrink-0" />
              <span>{t("nav.officer_desk")}</span>
            </button>
          )}

          {isAuthenticated && user?.role === "SUPER_ADMIN" && (
            <button
              onClick={() => onNavigate("admin-dashboard")}
              className={`px-2.5 xl:px-3 py-2 rounded-lg transition flex items-center space-x-1.5 ${
                currentTab === "admin-dashboard"
                  ? "text-purple-700 bg-purple-50 font-bold"
                  : "text-purple-600 hover:bg-purple-50"
              }`}
            >
              <ShieldAlert className="w-4 h-4 mr-1 shrink-0" />
              <span>{t("nav.admin_desk")}</span>
            </button>
          )}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          {/* Language Dropdown Selector */}
          <div className="flex items-center space-x-1.5 bg-blue-50/70 hover:bg-blue-50 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl border border-blue-200 hover:border-blue-400 text-xs font-semibold text-slate-800 transition focus-within:ring-2 focus-within:ring-blue-500 shadow-2xs">
            <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 shrink-0" />
            <select
              aria-label="Select Language"
              value={i18n.language}
              onChange={(e) => setLanguage(e.target.value as "en" | "mr" | "hi")}
              className="bg-transparent border-0 focus:outline-none cursor-pointer text-xs font-bold text-slate-800 pr-1"
            >
              <option value="en" className="bg-white text-slate-900">English (EN)</option>
              <option value="mr" className="bg-white text-slate-900">मराठी (MR)</option>
              <option value="hi" className="bg-white text-slate-900">हिन्दी (HI)</option>
            </select>
          </div>

          {/* Notifications Bell */}
          {isAuthenticated && (
            <div className="relative" ref={notifDropdownRef}>
              <button
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg relative transition"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {notifDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-fadeIn">
                  <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                    <span className="font-bold text-sm text-slate-800">
                      Notifications ({unreadCount} unread)
                    </span>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-xs text-blue-600 hover:underline font-semibold cursor-pointer"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-3 text-xs leading-relaxed transition ${
                            n.is_read
                              ? "bg-white text-slate-600"
                              : "bg-blue-50/70 text-slate-900 font-medium"
                          }`}
                        >
                          <div className="font-bold text-slate-900 mb-0.5">{n.title}</div>
                          <p>{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Auth Button or User Menu */}
          {isAuthenticated && user ? (
            <div className="flex items-center">
              {/* Universal Profile Button */}
              {onOpenProfileVault && (
                <button
                  onClick={() => onOpenProfileVault("profile")}
                  className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 active:scale-[0.99] text-white text-xs font-bold shadow-xs hover:shadow transition shrink-0 cursor-pointer"
                  title="Profile"
                >
                  <UserIcon className="w-4 h-4" />
                  <span>Profile</span>
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-2 sm:space-x-2.5">
              <button
                onClick={() => {
                  if (onOpenLoginModal) onOpenLoginModal("Welcome to Maha-Seva Portal. Please sign in to continue.");
                  else onNavigate("login");
                }}
                className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-2xs cursor-pointer"
              >
                {t("nav.login")}
              </button>
              <button
                onClick={() => onNavigate("register")}
                className="px-3.5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 active:scale-[0.99] text-white text-xs font-bold shadow-xs hover:shadow transition cursor-pointer"
              >
                {t("nav.register")}
              </button>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-2">
          <button
            onClick={() => { onNavigate("home"); setMobileMenuOpen(false); }}
            className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {t("nav.home")}
          </button>
          {/* Mobile Services Group with Documents & Schemes */}
          <div className="rounded-xl border border-slate-200/80 overflow-hidden bg-slate-50/50">
            <button
              onClick={() => setMobileServicesOpen(!mobileServicesOpen)}
              className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-100/80 transition"
            >
              <span className="flex items-center space-x-2">
                <span>{t("nav.services")}</span>
                {currentTab === "services" && (
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                )}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
                  mobileServicesOpen ? "rotate-180 text-blue-600" : ""
                }`}
              />
            </button>
            {mobileServicesOpen && (
              <div className="p-2 space-y-1 bg-white border-t border-slate-200/60">
                {/* Button 1: Documents & Proofs */}
                <button
                  onClick={() => {
                    onNavigate("services", { mode: "documents" });
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left p-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center space-x-2.5 transition"
                >
                  <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    {i18n.language === "mr"
                      ? "शासकीय दाखले"
                      : i18n.language === "hi"
                      ? "दस्तावेज व प्रमाण पत्र"
                      : "Documents & Proofs"}
                  </span>
                </button>

                {/* Button 2: Government Schemes */}
                <button
                  onClick={() => {
                    onNavigate("services", { mode: "schemes" });
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left p-2 rounded-lg text-xs font-bold text-emerald-800 bg-emerald-50/60 hover:bg-emerald-100 flex items-center justify-between transition"
                >
                  <div className="flex items-center space-x-2.5">
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      {i18n.language === "mr"
                        ? "शासकीय योजना"
                        : i18n.language === "hi"
                        ? "सरकारी योजनाएं"
                        : "Government Schemes"}
                    </span>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded-md">
                    DBT
                  </span>
                </button>
              </div>
            )}
          </div>
          {isAuthenticated && user && onOpenProfileVault && (
            <button
              onClick={() => { onOpenProfileVault("profile"); setMobileMenuOpen(false); }}
              className="block w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold text-blue-900 bg-blue-50/90 hover:bg-blue-100 transition flex items-center space-x-2"
            >
              <UserIcon className="w-4 h-4 text-blue-700" />
              <span>Profile</span>
            </button>
          )}
          <button
            onClick={() => { onNavigate("track"); setMobileMenuOpen(false); }}
            className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {t("nav.track")}
          </button>
          {isAuthenticated && (
            <button
              onClick={() => {
                if (user?.role === "OFFICER") onNavigate("officer-workbench");
                else if (user?.role === "SUPER_ADMIN") onNavigate("admin-dashboard");
                else onNavigate("citizen-dashboard");
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-blue-700 bg-blue-50"
            >
              Dashboard
            </button>
          )}

          {!isAuthenticated && (
            <div className="pt-2 border-t border-slate-100 flex items-center space-x-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onOpenLoginModal) onOpenLoginModal("Welcome to Maha-Seva Portal. Please sign in to continue.");
                  else onNavigate("login");
                }}
                className="flex-1 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 text-center transition cursor-pointer"
              >
                {t("nav.login")}
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate("register");
                }}
                className="flex-1 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold text-center shadow-xs transition cursor-pointer"
              >
                {t("nav.register")}
              </button>
            </div>
          )}

          {/* Mobile Language Selector */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between px-2">
            <span className="text-xs font-bold text-slate-600 flex items-center">
              <Globe className="w-4 h-4 mr-1.5 text-blue-600" />
              {i18n.language === "mr" ? "भाषा निवडा:" : i18n.language === "hi" ? "भाषा चुनें:" : "Language:"}
            </span>
            <select
              aria-label="Select Language"
              value={i18n.language}
              onChange={(e) => {
                setLanguage(e.target.value as "en" | "mr" | "hi");
                setMobileMenuOpen(false);
              }}
              className="bg-slate-100 border border-slate-300 text-xs font-bold text-slate-800 rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              <option value="en">English (EN)</option>
              <option value="mr">मराठी (MR)</option>
              <option value="hi">हिन्दी (HI)</option>
            </select>
          </div>
        </div>
      )}
    </header>
  );
};
