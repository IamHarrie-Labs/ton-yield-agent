"use client";

import { Goal } from "@/app/dashboard/page";

const goals: { id: Goal; label: string; desc: string; tag: string }[] = [
  { id: "conservative", label: "Conservative", desc: "Stake via Tonstakers only. Lowest risk.",     tag: "Low risk"   },
  { id: "balanced",     label: "Balanced",     desc: "Mix staking + top STON.fi LP pool.",          tag: "Moderate"   },
  { id: "maximize",     label: "Maximize",     desc: "Chase highest APY across all options.",       tag: "High yield"  },
];

interface Props {
  goal:     Goal;
  onChange: (g: Goal) => void;
  disabled: boolean;
}

export function GoalSetter({ goal, onChange, disabled }: Props) {
  return (
    <div className="bg-white dark:bg-[#141414] border border-black/[0.07] dark:border-white/[0.07] rounded-2xl p-4 md:p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-black/30 dark:text-white/30 mb-3 md:mb-4">
        Agent Goal
      </p>
      {/* Mobile: horizontal scroll strip. Desktop: vertical stack */}
      <div className="flex gap-2 overflow-x-auto pb-1 md:overflow-visible md:flex-col md:gap-2 md:pb-0 snap-x snap-mandatory md:snap-none scrollbar-hide">
        {goals.map(({ id, label, desc, tag }) => {
          const active = goal === id;
          return (
            <button
              key={id}
              onClick={() => !disabled && onChange(id)}
              disabled={disabled}
              className={`shrink-0 snap-start w-[160px] md:w-full text-left rounded-xl border p-3 md:p-4 transition-all duration-200 ${
                active
                  ? "border-[#0098EA] bg-[#0098EA]/5 dark:bg-[#0098EA]/10"
                  : "border-black/[0.07] dark:border-white/[0.07] hover:border-black/20 dark:hover:border-white/20"
              } ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[13px] font-bold ${active ? "text-[#0098EA]" : "text-black dark:text-white"}`}>
                  {label}
                </span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                  active
                    ? "border-[#0098EA]/30 bg-[#0098EA]/10 text-[#0098EA]"
                    : "border-black/[0.07] dark:border-white/[0.07] text-black/35 dark:text-white/35"
                }`}>
                  {tag}
                </span>
              </div>
              <p className={`text-[12px] leading-relaxed ${active ? "text-[#0098EA]/70" : "text-black/40 dark:text-white/40"}`}>
                {desc}
              </p>
            </button>
          );
        })}
      </div>
      {disabled && (
        <p className="text-[11px] text-black/25 dark:text-white/25 mt-3">Pause the agent to change goal.</p>
      )}
    </div>
  );
}
