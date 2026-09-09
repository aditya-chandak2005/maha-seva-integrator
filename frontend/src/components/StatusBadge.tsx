import React from "react";
import { useTranslation } from "react-i18next";
import { 
  CheckCircle2, 
  Clock, 
  FileCheck, 
  AlertCircle, 
  XCircle, 
  RotateCcw,
  Hourglass
} from "lucide-react";

interface StatusBadgeProps {
  status: string;
  className?: string;
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = "", showIcon = true }) => {
  const { t } = useTranslation();

  const getStatusConfig = (st: string) => {
    switch (st?.toUpperCase()) {
      case "APPROVED":
      case "COMPLETED":
        return {
          bg: "bg-emerald-50 text-emerald-700 border-emerald-300",
          icon: <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
        };
      case "SUBMITTED":
        return {
          bg: "bg-blue-50 text-blue-700 border-blue-300",
          icon: <Clock className="w-3.5 h-3.5 mr-1 text-blue-600" />
        };
      case "UNDER_REVIEW":
        return {
          bg: "bg-amber-50 text-amber-700 border-amber-300",
          icon: <Hourglass className="w-3.5 h-3.5 mr-1 text-amber-600" />
        };
      case "DOCUMENT_VERIFICATION":
        return {
          bg: "bg-indigo-50 text-indigo-700 border-indigo-300",
          icon: <FileCheck className="w-3.5 h-3.5 mr-1 text-indigo-600" />
        };
      case "PROCESSING":
        return {
          bg: "bg-cyan-50 text-cyan-700 border-cyan-300",
          icon: <RotateCcw className="w-3.5 h-3.5 mr-1 text-cyan-600 animate-spin" />
        };
      case "ADDITIONAL_INFORMATION_REQUIRED":
        return {
          bg: "bg-orange-50 text-orange-700 border-orange-300",
          icon: <AlertCircle className="w-3.5 h-3.5 mr-1 text-orange-600" />
        };
      case "REJECTED":
      case "CANCELLED":
        return {
          bg: "bg-rose-50 text-rose-700 border-rose-300",
          icon: <XCircle className="w-3.5 h-3.5 mr-1 text-rose-600" />
        };
      default:
        return {
          bg: "bg-slate-50 text-slate-700 border-slate-300",
          icon: <Clock className="w-3.5 h-3.5 mr-1 text-slate-500" />
        };
    }
  };

  const config = getStatusConfig(status);
  const localizedText = t(`statuses.${status}`, status?.replace(/_/g, " "));

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg} ${className}`}
    >
      {showIcon && config.icon}
      {localizedText}
    </span>
  );
};
