import React from "react";
import { TimelineEvent } from "../types";
import { StatusBadge } from "./StatusBadge";
import { CheckCircle2, User, Building, Clock } from "lucide-react";

interface TimelineProps {
  events: TimelineEvent[];
  currentStatus: string;
}

export const Timeline: React.FC<TimelineProps> = ({ events }) => {
  if (!events || events.length === 0) {
    return (
      <div className="py-6 text-center text-slate-500 text-sm">
        No recorded status progression yet.
      </div>
    );
  }

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      {events.map((event, idx) => {
        const isLatest = idx === events.length - 1;
        return (
          <div key={event.id || idx} className="relative group">
            {/* Step Bullet */}
            <div
              className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                isLatest
                  ? "bg-blue-600 border-blue-600 text-white ring-4 ring-blue-100"
                  : "bg-white border-emerald-500 text-emerald-600"
              }`}
            >
              {isLatest ? (
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
            </div>

            {/* Event Card */}
            <div
              className={`p-4 rounded-xl border transition-all ${
                isLatest
                  ? "bg-white border-blue-200 shadow-sm"
                  : "bg-slate-50/70 border-slate-200"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <StatusBadge status={event.new_status} />
                <span className="text-xs text-slate-500 flex items-center">
                  <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  {formatDate(event.created_at)}
                </span>
              </div>

              {event.remarks && (
                <p className="text-sm text-slate-700 font-medium mb-2 leading-relaxed">
                  {event.remarks}
                </p>
              )}

              {event.actor_name && (
                <div className="flex items-center text-xs text-slate-500 pt-1 border-t border-slate-100 mt-2">
                  {event.actor_role === "OFFICER" ? (
                    <Building className="w-3.5 h-3.5 mr-1 text-blue-600" />
                  ) : (
                    <User className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  )}
                  <span>
                    Actioned by: <strong className="text-slate-700">{event.actor_name}</strong>
                    {event.actor_role && (
                      <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] bg-slate-200 text-slate-700 font-semibold">
                        {event.actor_role}
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
