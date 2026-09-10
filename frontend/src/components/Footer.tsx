import React from "react";
import { Building2, ShieldCheck, Phone, HelpCircle } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Col 1: Platform Overview */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center space-x-2 text-white">
              <Building2 className="w-5 h-5 text-orange-500" />
              <span className="font-bold text-base tracking-tight">
                Maha-Seva Integrator (महा-सेवा इंटिग्रेटर)
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-md">
              A unified digital government service orchestration platform integrating state and central government services to eliminate departmental delivery silos.
            </p>
            <div className="flex items-center space-x-2 text-emerald-400 pt-1 text-[11px] font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Compliant with Maharashtra Right to Public Services Act (RTS Act, 2015)</span>
            </div>
          </div>

          {/* Col 2: Citizen Resources */}
          <div className="space-y-2">
            <h4 className="text-white font-bold text-sm tracking-wider uppercase text-[11px]">
              Citizen Portals
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li><a href="#services" className="hover:text-white transition">Explore Services Directory</a></li>
              <li><a href="#track" className="hover:text-white transition">Real-Time Application Tracking</a></li>
              <li><a href="https://aaplesarkar.mahaonline.gov.in" target="_blank" rel="noreferrer" className="hover:text-white transition">Aaple Sarkar Portal</a></li>
              <li><a href="https://bhulekh.mahabhumi.gov.in" target="_blank" rel="noreferrer" className="hover:text-white transition">Mahabhumi 7/12 Records</a></li>
            </ul>
          </div>

          {/* Col 3: Support & Contacts */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm tracking-wider uppercase text-[11px]">
              National Helpline & Support
            </h4>
            <div className="p-3.5 bg-slate-800/90 rounded-xl border border-slate-700/80 space-y-2">
              <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <span>24x7 Citizen Helpline</span>
              </div>
              <div className="text-base font-extrabold text-white tracking-wider font-mono">
                1800-120-8040
              </div>
              <div className="text-[10px] text-slate-400">
                Toll-Free All India Public Service Inquiries
              </div>
            </div>
            <div className="space-y-1 text-xs">
              <p className="text-slate-300">
                <span className="text-slate-400">Email:</span> helpdesk@mahaseva.gov.in
              </p>
              <p className="text-slate-400 text-[11px]">
                Mantralaya, Madam Cama Road, Mumbai 400032
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© 2026 National & State Public Services Gateway. All Rights Reserved.</p>
          <div className="flex space-x-6">
            <span className="hover:text-slate-400 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-400 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-400 cursor-pointer">Hyperlinking Policy</span>
            <span className="hover:text-slate-400 cursor-pointer">Accessibility Statement</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
