import React, { useState, useEffect } from "react";
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
  Search
} from "lucide-react";
import { NotificationItem } from "../types";

interface NavbarProps {
  currentTab: string;
  onNavigate: (tab: string, param?: any) => void;
  onOpenAssistant: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onNavigate,
  onOpenAssistant,
}) => {
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

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

  const toggleLanguage = () => {
    const nextLang = i18n.language === "en" ? "mr" : "en";
    i18n.changeLanguage(nextLang);
    localStorage.setItem("mahaseva_lang", nextLang);
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      {/* Top Government Strip */}
      <div className="bg-slate-900 text-slate-300 text-[11px] py-1 px-4 sm:px-8 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
          <span>Government of Maharashtra | महाराष्ट्र शासन — Smart India Hackathon 2026 (PS-129)</span>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleLanguage}
            className="flex items-center space-x-1 font-semibold text-white hover:text-amber-300 transition"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{i18n.language === "en" ? "मराठी" : "English"}</span>
          </button>
          <span className="text-slate-500">|</span>
          <span className="hidden sm:inline">Toll Free Helpline: 1800-120-8040</span>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div
          onClick={() => onNavigate("home")}
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-800 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="font-extrabold text-lg sm:text-xl text-slate-900 tracking-tight leading-none flex items-center">
              Maha-Seva
              <span className="text-orange-600 ml-1">Integrator</span>
            </div>
            <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
              {i18n.language === "mr" ? "एक व्यासपीठ. अनेक शासकीय सेवा." : "Digital Public Service Gateway"}
            </div>
          </div>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-2 text-sm font-medium text-slate-700">
          <button
            onClick={() => onNavigate("home")}
            className={`px-3 py-2 rounded-lg transition ${
              currentTab === "home"
                ? "text-blue-700 bg-blue-50 font-bold"
                : "hover:text-blue-600 hover:bg-slate-50"
            }`}
          >
            {t("nav.home")}
          </button>

          <button
            onClick={() => onNavigate("services")}
            className={`px-3 py-2 rounded-lg transition ${
              currentTab === "services"
                ? "text-blue-700 bg-blue-50 font-bold"
                : "hover:text-blue-600 hover:bg-slate-50"
            }`}
          >
            {t("nav.services")}
          </button>

          <button
            onClick={() => onNavigate("track")}
            className={`px-3 py-2 rounded-lg transition ${
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
              className={`px-3 py-2 rounded-lg transition flex items-center ${
                currentTab === "citizen-dashboard"
                  ? "text-blue-700 bg-blue-50 font-bold"
                  : "hover:text-blue-600 hover:bg-slate-50"
              }`}
            >
              <LayoutDashboard className="w-4 h-4 mr-1.5" />
              {t("nav.dashboard")}
            </button>
          )}

          {isAuthenticated && (user?.role === "OFFICER" || user?.role === "DEPARTMENT_ADMIN") && (
            <button
              onClick={() => onNavigate("officer-workbench")}
              className={`px-3 py-2 rounded-lg transition flex items-center ${
                currentTab === "officer-workbench"
                  ? "text-indigo-700 bg-indigo-50 font-bold"
                  : "text-indigo-600 hover:bg-indigo-50"
              }`}
            >
              <FileText className="w-4 h-4 mr-1.5" />
              {t("nav.officer_desk")}
            </button>
          )}

          {isAuthenticated && user?.role === "SUPER_ADMIN" && (
            <button
              onClick={() => onNavigate("admin-dashboard")}
              className={`px-3 py-2 rounded-lg transition flex items-center ${
                currentTab === "admin-dashboard"
                  ? "text-purple-700 bg-purple-50 font-bold"
                  : "text-purple-600 hover:bg-purple-50"
              }`}
            >
              <ShieldAlert className="w-4 h-4 mr-1.5" />
              {t("nav.admin_desk")}
            </button>
          )}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Smart Assistant Trigger */}
          <button
            onClick={onOpenAssistant}
            className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold shadow-sm hover:opacity-95 transition"
          >
            <span>✨</span>
            <span>{i18n.language === "mr" ? "स्मार्ट मदतनीस" : "AI Assistant"}</span>
          </button>

          {/* Notifications Bell */}
          {isAuthenticated && (
            <div className="relative">
              <button
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg relative transition"
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
                        className="text-xs text-blue-600 hover:underline font-semibold"
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
                            n.is_read ? "bg-white text-slate-600" : "bg-blue-50/70 text-slate-900 font-medium"
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
          {isAuthenticated ? (
            <div className="flex items-center space-x-2">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-900 truncate max-w-[120px]">
                  {user?.full_name}
                </span>
                <span className="text-[10px] text-slate-500 font-semibold">
                  {user?.role}
                </span>
              </div>
              <button
                onClick={logout}
                title="Logout"
                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onNavigate("login")}
                className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                {t("nav.login")}
              </button>
              <button
                onClick={() => onNavigate("register")}
                className="px-3.5 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold shadow-sm transition"
              >
                {t("nav.register")}
              </button>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-2">
          <button
            onClick={() => { onNavigate("home"); setMobileMenuOpen(false); }}
            className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {t("nav.home")}
          </button>
          <button
            onClick={() => { onNavigate("services"); setMobileMenuOpen(false); }}
            className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {t("nav.services")}
          </button>
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
          <button
            onClick={() => { onOpenAssistant(); setMobileMenuOpen(false); }}
            className="block w-full text-left px-3 py-2 rounded-lg text-sm font-bold text-amber-600 bg-amber-50"
          >
            ✨ Smart Service Assistant
          </button>
        </div>
      )}
    </header>
  );
};
