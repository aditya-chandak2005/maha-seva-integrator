import React, { useState, useEffect } from "react";
import api from "./services/api";
import { useAuth } from "./context/AuthContext";
import { ServiceItem } from "./types";

import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { SmartAssistantModal } from "./components/SmartAssistantModal";
import { CitizenProfileDrawer } from "./components/CitizenProfileDrawer";
import { LoginModal } from "./components/LoginModal";

import { HomePage } from "./pages/HomePage";
import { ServiceCatalogPage } from "./pages/ServiceCatalogPage";
import { ApplyServicePage } from "./pages/ApplyServicePage";
import { TrackApplicationPage } from "./pages/TrackApplicationPage";
import { CitizenDashboard } from "./pages/CitizenDashboard";
import { OfficerWorkbenchPage } from "./pages/OfficerWorkbenchPage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";

export const App: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>("home");
  const [tabParam, setTabParam] = useState<any>(null);
  const [selectedState, setSelectedState] = useState<string>("ALL");

  const [services, setServices] = useState<ServiceItem[]>([]);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);
  const [profileDrawerTab, setProfileDrawerTab] = useState<"profile" | "uploaded-docs">("profile");

  // Universal Login Dialog Modal State
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loginModalNotice, setLoginModalNotice] = useState<string | undefined>();
  const [loginModalSuccessAction, setLoginModalSuccessAction] = useState<(() => void) | null>(null);

  const requireAuth = (notice?: string, actionOnSuccess?: () => void): boolean => {
    if (isAuthenticated) {
      if (actionOnSuccess) actionOnSuccess();
      return true;
    }
    setLoginModalNotice(notice || "Please sign in to access advanced portal services.");
    setLoginModalSuccessAction(() => actionOnSuccess || null);
    setLoginModalOpen(true);
    return false;
  };

  const handleOpenAssistant = () => {
    requireAuth(
      "Please sign in to access the Smart AI Service Assistant (scheme discovery & eligibility guidance).",
      () => setAssistantOpen(true)
    );
  };

  const handleLoginModalSuccess = () => {
    setLoginModalOpen(false);
    if (loginModalSuccessAction) {
      const action = loginModalSuccessAction;
      setLoginModalSuccessAction(null);
      action();
    }
  };

  const handleOpenProfileVault = (tab: "profile" | "uploaded-docs" = "profile") => {
    if (!isAuthenticated) {
      requireAuth("Please sign in to access your Profile and Document Vault.");
      return;
    }
    setProfileDrawerTab(tab);
    setProfileDrawerOpen(true);
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await api.get("/services");
      setServices(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNavigate = (tab: string, param?: any) => {
    setCurrentTab(tab);
    setTabParam(param || null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSelectService = (serviceId: number) => {
    handleNavigate("apply", { serviceId });
  };

  // Redirect after login based on role
  const handleLoginSuccess = () => {
    const token = localStorage.getItem("mahaseva_token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload.role === "SUPER_ADMIN") {
          handleNavigate("admin-dashboard");
          return;
        } else if (payload.role === "OFFICER" || payload.role === "DEPARTMENT_ADMIN") {
          handleNavigate("officer-workbench");
          return;
        } else {
          handleNavigate("citizen-dashboard");
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }
    handleNavigate("home");
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 overflow-x-hidden">
      <Navbar
        currentTab={currentTab}
        onNavigate={handleNavigate}
        onOpenAssistant={handleOpenAssistant}
        onOpenProfileVault={handleOpenProfileVault}
        onOpenLoginModal={(notice) => requireAuth(notice)}
        selectedState={selectedState}
        onSelectState={setSelectedState}
      />

      <main className="flex-1">
        {currentTab === "home" && (
          <HomePage
            services={services}
            onSelectService={handleSelectService}
            onNavigate={handleNavigate}
            onOpenAssistant={handleOpenAssistant}
            selectedState={selectedState}
            onSelectState={setSelectedState}
          />
        )}

        {currentTab === "services" && (
          <ServiceCatalogPage
            initialSearch={tabParam?.q || ""}
            initialState={tabParam?.state || selectedState}
            initialMode={tabParam?.mode || "documents"}
            onSelectService={handleSelectService}
            onStateChange={setSelectedState}
          />
        )}

        {currentTab === "apply" && tabParam?.serviceId && (
          <ApplyServicePage
            serviceId={tabParam.serviceId}
            onBack={() => handleNavigate("services")}
            onTrackSubmitted={(appNum) => handleNavigate("track", { number: appNum })}
            onGoToDashboard={() => handleNavigate("citizen-dashboard")}
            onRequireLogin={(notice, onSuccess) => {
              requireAuth(
                notice || "Please sign in to proceed with your application.",
                onSuccess
              );
            }}
            onOpenProfileVault={() => handleOpenProfileVault("uploaded-docs")}
          />
        )}

        {currentTab === "track" && (
          <TrackApplicationPage 
            initialNumber={tabParam?.number || ""} 
            onNavigate={handleNavigate}
          />
        )}

        {currentTab === "citizen-dashboard" && (
          <CitizenDashboard
            onNavigate={handleNavigate}
            onOpenAssistant={handleOpenAssistant}
            onOpenProfileVault={handleOpenProfileVault}
          />
        )}

        {currentTab === "officer-workbench" && (
          <OfficerWorkbenchPage />
        )}

        {currentTab === "admin-dashboard" && (
          <AdminDashboardPage />
        )}

        {currentTab === "login" && (
          <LoginPage
            onSuccess={handleLoginSuccess}
            onNavigateRegister={() => handleNavigate("register")}
            initialEmail={tabParam?.prefillEmail || ""}
            registrationNotice={tabParam?.notice || ""}
          />
        )}

        {currentTab === "register" && (
          <RegisterPage
            onSuccess={handleLoginSuccess}
            onNavigateLogin={(prefillEmail, notice) => 
              handleNavigate("login", { prefillEmail, notice })
            }
          />
        )}
      </main>

      <Footer />

      {/* Floating Smart Assistant Trigger (Always available in bottom right) */}
      <button
        onClick={handleOpenAssistant}
        className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white p-3.5 rounded-full shadow-2xl flex items-center space-x-2 transition-transform hover:scale-105 cursor-pointer"
        title="Ask Smart Service Assistant"
      >
        <span className="text-xl">✨</span>
        <span className="text-xs font-bold hidden sm:inline">AI Service Assistant</span>
      </button>

      {/* Smart Assistant Modal */}
      <SmartAssistantModal
        isOpen={assistantOpen}
        onClose={() => setAssistantOpen(false)}
        onSelectService={handleSelectService}
        selectedState={selectedState}
        onRequireLogin={() => {
          requireAuth(
            "Please sign in to chat with the AI Service Assistant.",
            () => setAssistantOpen(true)
          );
        }}
      />

      {/* Citizen Profile & DigiLocker Vault Slide-over Drawer */}
      <CitizenProfileDrawer
        isOpen={profileDrawerOpen}
        initialTab={profileDrawerTab}
        onClose={() => setProfileDrawerOpen(false)}
        onNavigate={handleNavigate}
      />

      {/* Universal Login Dialog Box */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => {
          setLoginModalOpen(false);
          setLoginModalSuccessAction(null);
        }}
        onSuccess={handleLoginModalSuccess}
        notice={loginModalNotice}
        onNavigateRegister={() => {
          setLoginModalOpen(false);
          handleNavigate("register");
        }}
      />
    </div>
  );
};
