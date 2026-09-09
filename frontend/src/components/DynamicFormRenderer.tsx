import React from "react";
import { useTranslation } from "react-i18next";
import { FormField } from "../types";

interface DynamicFormRendererProps {
  fields: FormField[];
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
  errors?: Record<string, string>;
}

export const DynamicFormRenderer: React.FC<DynamicFormRendererProps> = ({
  fields,
  values,
  onChange,
  errors = {}
}) => {
  const { i18n } = useTranslation();
  const isMarathi = i18n.language === "mr";

  return (
    <div className="space-y-5">
      {fields.map((field) => {
        const fieldLabel = (isMarathi && field.label_mr) ? field.label_mr : field.label;
        const fieldVal = values[field.key] !== undefined ? values[field.key] : "";
        const errorMsg = errors[field.key];

        return (
          <div key={field.key} className="flex flex-col">
            <label className="text-sm font-semibold text-slate-800 mb-1.5 flex items-center justify-between">
              <span>
                {fieldLabel}
                {field.required && <span className="text-rose-500 ml-1 font-bold">*</span>}
              </span>
            </label>

            {field.type === "TEXT" && (
              <input
                type="text"
                placeholder={field.placeholder || ""}
                value={fieldVal}
                onChange={(e) => onChange(field.key, e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-lg border text-sm transition-all focus:outline-none focus:ring-2 ${
                  errorMsg
                    ? "border-rose-300 ring-rose-100 focus:ring-rose-400"
                    : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"
                }`}
              />
            )}

            {field.type === "NUMBER" && (
              <input
                type="number"
                placeholder={field.placeholder || ""}
                value={fieldVal}
                onChange={(e) => onChange(field.key, e.target.value === "" ? "" : Number(e.target.value))}
                className={`w-full px-3.5 py-2.5 rounded-lg border text-sm transition-all focus:outline-none focus:ring-2 ${
                  errorMsg
                    ? "border-rose-300 ring-rose-100 focus:ring-rose-400"
                    : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"
                }`}
              />
            )}

            {field.type === "DATE" && (
              <input
                type="date"
                value={fieldVal}
                onChange={(e) => onChange(field.key, e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-lg border text-sm transition-all focus:outline-none focus:ring-2 ${
                  errorMsg
                    ? "border-rose-300 ring-rose-100 focus:ring-rose-400"
                    : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"
                }`}
              />
            )}

            {field.type === "TEXTAREA" && (
              <textarea
                rows={3}
                placeholder={field.placeholder || ""}
                value={fieldVal}
                onChange={(e) => onChange(field.key, e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-lg border text-sm transition-all focus:outline-none focus:ring-2 ${
                  errorMsg
                    ? "border-rose-300 ring-rose-100 focus:ring-rose-400"
                    : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"
                }`}
              />
            )}

            {field.type === "DROPDOWN" && (
              <select
                value={fieldVal}
                onChange={(e) => onChange(field.key, e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-lg border text-sm transition-all bg-white focus:outline-none focus:ring-2 ${
                  errorMsg
                    ? "border-rose-300 ring-rose-100 focus:ring-rose-400"
                    : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"
                }`}
              >
                <option value="">-- {isMarathi ? "कृपया निवडा" : "Please Select"} --</option>
                {field.options?.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            )}

            {field.type === "RADIO" && (
              <div className="flex flex-wrap gap-4 mt-1">
                {field.options?.map((opt) => (
                  <label key={opt} className="flex items-center text-sm text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name={field.key}
                      value={opt}
                      checked={fieldVal === opt}
                      onChange={(e) => onChange(field.key, e.target.value)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 mr-2"
                    />
                    {opt}
                  </label>
                ))}
              </div>
            )}

            {errorMsg && (
              <span className="text-xs text-rose-500 mt-1 font-medium">{errorMsg}</span>
            )}
          </div>
        );
      })}
    </div>
  );
};
