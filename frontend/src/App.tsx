import React, { useState, useEffect } from "react";
import api from "./services/api";
import { useAuth } from "./context/AuthContext";
import { ServiceItem } from "./types";

import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { SmartAssistantModal } from "./components/SmartAssistantModal";

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

  const [services, setServices] = useState<ServiceItem[]>([]);
  const [assistantOpen, setAssistantOpen] = useState(false);

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
    // Check local token role or wait for state
    handleNavigate("home");
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar
        currentTab={currentTab}
        onNavigate={handleNavigate}
        onOpenAssistant={() => setAssistantOpen(true)}
      />

      <main className="flex-1">
        {currentTab === "home" && (
          <HomePage
            services={services}
            onSelectService={handleSelectService}
            onNavigate={handleNavigate}
            onOpenAssistant={() => setAssistantOpen(true)}
          />
        )}

        {currentTab === "services" && (
          <ServiceCatalogPage
            initialSearch={tabParam?.q || ""}
            onSelectService={handleSelectService}
          />
        )}

        {currentTab === "apply" && tabParam?.serviceId && (
          <ApplyServicePage
            serviceId={tabParam.serviceId}
            onBack={() => handleNavigate("services")}
            onTrackSubmitted={(appNum) => handleNavigate("track", { number: appNum })}
            onGoToDashboard={() => handleNavigate("citizen-dashboard")}
            onRequireLogin={() => handleNavigate("login")}
          />
        )}

        {currentTab === "track" && (
          <TrackApplicationPage initialNumber={tabParam?.number || ""} />
        )}

        {currentTab === "citizen-dashboard" && (
          <CitizenDashboard
            onNavigate={handleNavigate}
            onOpenAssistant={() => setAssistantOpen(true)}
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
          />
        )}

        {currentTab === "register" && (
          <RegisterPage
            onSuccess={handleLoginSuccess}
            onNavigateLogin={() => handleNavigate("login")}
          />
        )}
      </main>

      <Footer />

      {/* Floating Smart Assistant Trigger (Always available in bottom right) */}
      <button
        onClick={() => setAssistantOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white p-3.5 rounded-full shadow-2xl flex items-center space-x-2 transition-transform hover:scale-105"
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
      />
    </div>
  );
};
