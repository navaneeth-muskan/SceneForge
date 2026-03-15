"use client";

import { LucideIcon } from "lucide-react";

interface AgentSkillCardProps {
  icon: LucideIcon;
  label: string;
  description: string;
  badge?: string;
  disabled?: boolean;
  onClick: () => void;
}

export function AgentSkillCard({
  icon: Icon,
  label,
  description,
  badge,
  disabled = false,
  onClick,
}: AgentSkillCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full text-left p-3 rounded-lg border transition-all group ${
        disabled
          ? "border-slate-700/50 opacity-50 cursor-not-allowed"
          : "border-slate-700 hover:border-blue-500/50 hover:bg-blue-500/5 cursor-pointer"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
            disabled ? "bg-slate-800" : "bg-blue-500/10 group-hover:bg-blue-500/20"
          }`}
        >
          <Icon className={`w-4 h-4 ${disabled ? "text-slate-500" : "text-blue-400"}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-200 group-hover:text-white">
              {label}
            </span>
            {badge && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-medium">
                {badge}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 group-hover:text-slate-400 mt-0.5 leading-snug">
            {description}
          </p>
        </div>
      </div>
    </button>
  );
}
