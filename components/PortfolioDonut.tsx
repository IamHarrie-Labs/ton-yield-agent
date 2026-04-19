"use client";

import { Position, PoolPosition } from "@/app/dashboard/page";
import { useTheme } from "@/components/ThemeProvider";

interface Props {
  position:      Position;
  poolPositions: PoolPosition[];
}

function DonutChart({ slices, isDark }: { slices: { value: number; color: string; label: string }[]; isDark: boolean }) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  if (total === 0) return null;

  const radius  = 40;
  const stroke  = 12;
  const cx      = 60;
  const cy      = 60;
  const circum  = 2 * Math.PI * radius;

  let offset = 0;
  const arcs = slices.map(s => {
    const pct  = s.value / total;
    const dash = pct * circum;
    const arc  = { ...s, dash, offset, pct };
    offset += dash;
    return arc;
  });

  return (
    <svg width={120} height={120} viewBox="0 0 120 120">
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke={isDark ? "#2a2a2a" : "#f1f1f1"} strokeWidth={stroke} />
      {arcs.map((arc, i) => (
        <circle
          key={i}
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke={arc.color}
          strokeWidth={stroke}
          strokeDasharray={`${arc.dash} ${circum - arc.dash}`}
          strokeDashoffset={circum / 4 - arc.offset}
          strokeLinecap="butt"
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
      ))}
    </svg>
  );
}

export function PortfolioDonut({ position, poolPositions }: Props) {
  const { theme } = useTheme();
  const isDark    = theme === "dark";

  const stakedTon = position.staked / 0.98;
  const lpTon     = poolPositions.reduce((s, p) => s + p.tonDeployed, 0);
  const idleTon   = Math.max(0, position.totalTon - stakedTon - lpTon);
  const total     = stakedTon + lpTon + idleTon;

  const slices = [
    { label: "Staking",   value: stakedTon, color: "#0098EA" },
    { label: "LP Pools",  value: lpTon,     color: "#6366f1" },
    { label: "Idle",      value: idleTon,   color: isDark ? "#333" : "#e5e7eb" },
  ].filter(s => s.value > 0);

  const pct = (v: number) => total > 0 ? ((v / total) * 100).toFixed(1) : "0.0";

  if (total === 0) return null;

  return (
    <div className="bg-white dark:bg-[#141414] border border-black/[0.07] dark:border-white/[0.07] rounded-2xl p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-black/30 dark:text-white/30 mb-4">
        Portfolio Allocation
      </p>

      <div className="flex items-center gap-6">
        {/* Donut */}
        <div className="relative shrink-0">
          <DonutChart slices={slices} isDark={isDark} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-[11px] font-bold text-black dark:text-white">{total.toFixed(1)}</p>
            <p className="text-[9px] text-black/30 dark:text-white/30">TON</p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2.5">
          {stakedTon > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#0098EA]" />
                <span className="text-[12px] font-medium text-black dark:text-white">Staking</span>
              </div>
              <div className="text-right">
                <p className="text-[12px] font-bold text-black dark:text-white">{stakedTon.toFixed(2)} TON</p>
                <p className="text-[10px] text-black/30 dark:text-white/30">{pct(stakedTon)}%</p>
              </div>
            </div>
          )}
          {lpTon > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#6366f1]" />
                <span className="text-[12px] font-medium text-black dark:text-white">LP Pools</span>
              </div>
              <div className="text-right">
                <p className="text-[12px] font-bold text-black dark:text-white">{lpTon.toFixed(2)} TON</p>
                <p className="text-[10px] text-black/30 dark:text-white/30">{pct(lpTon)}%</p>
              </div>
            </div>
          )}
          {idleTon > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-black/10 dark:bg-white/10" />
                <span className="text-[12px] font-medium text-black/50 dark:text-white/40">Idle</span>
              </div>
              <div className="text-right">
                <p className="text-[12px] font-bold text-black/50 dark:text-white/40">{idleTon.toFixed(2)} TON</p>
                <p className="text-[10px] text-black/30 dark:text-white/30">{pct(idleTon)}%</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
