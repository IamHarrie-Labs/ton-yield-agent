"use client";

import { Position } from "@/app/dashboard/page";

interface Props {
  tonstakerApy: number;
  bestPoolApy:  number;
  position:     Position;
  actionsToday: number;
}

export function MetricCards({ tonstakerApy, bestPoolApy, position, actionsToday }: Props) {
  const pnlUp = position.pnl >= 0;
  const cards = [
    { label: "Tonstakers APY",  value: `${tonstakerApy.toFixed(2)}%`,         sub: "Liquid staking",        accent: false },
    { label: "Best Pool APY",   value: `${bestPoolApy.toFixed(2)}%`,           sub: "Top STON.fi pool",      accent: false },
    { label: "Portfolio Value", value: `${position.totalTon.toFixed(2)} TON`,
      sub: pnlUp ? `+${position.pnl.toFixed(4)} TON earned` : `${position.pnl.toFixed(4)} TON`,
      accent: pnlUp },
    { label: "Actions Today",   value: actionsToday.toString(),                 sub: "Transactions executed", accent: false },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
      {cards.map(({ label, value, sub, accent }) => (
        <div
          key={label}
          className="bg-white dark:bg-[#141414] border border-black/[0.07] dark:border-white/[0.07] rounded-2xl p-4 md:p-5 hover:border-[#0098EA]/30 transition-colors"
        >
          <p className="text-[9px] md:text-[10px] font-semibold uppercase tracking-[0.13em] text-black/30 dark:text-white/30 mb-2 md:mb-3">
            {label}
          </p>
          <p className="text-[18px] md:text-[24px] font-extrabold tracking-tight leading-none text-black dark:text-white mb-1 truncate">
            {value}
          </p>
          <p className={`text-[10px] md:text-[11px] ${accent ? "text-[#0098EA]" : "text-black/35 dark:text-white/35"}`}>
            {sub}
          </p>
        </div>
      ))}
    </div>
  );
}
