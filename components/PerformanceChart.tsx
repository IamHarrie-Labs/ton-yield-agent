"use client";

import { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine,
} from "recharts";
import { useTheme } from "@/components/ThemeProvider";

export interface Snapshot {
  ts:       number;
  totalTon: number;
  pnl:      number;
  apy?:     number;   // optional APY at snapshot time for history chart
}

interface Props {
  snapshots: Snapshot[];
  initial:   number;
}

function fmt(ts: number) {
  return new Date(ts).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

const CustomTooltip = ({ active, payload, label, isDark, tab }: any) => {
  if (!active || !payload?.length) return null;
  const val = parseFloat(payload[0].value);
  return (
    <div className={`border rounded-xl px-3 py-2 shadow-lg text-[12px] ${
      isDark ? "bg-[#1a1a1a] border-white/10" : "bg-white border-black/10"
    }`}>
      <p className={`mb-1 ${isDark ? "text-white/40" : "text-black/40"}`}>{label}</p>
      {tab === "value" && (
        <p className={`font-bold ${isDark ? "text-white" : "text-black"}`}>{val.toFixed(4)} TON</p>
      )}
      {tab === "pnl" && (
        <p className={`font-semibold ${val >= 0 ? "text-[#0098EA]" : isDark ? "text-white/50" : "text-black/50"}`}>
          PnL: {val >= 0 ? "+" : ""}{val.toFixed(5)} TON
        </p>
      )}
      {tab === "apy" && (
        <p className="font-semibold text-[#0098EA]">{val.toFixed(2)}% APY</p>
      )}
    </div>
  );
};

type Tab = "value" | "pnl" | "apy";

export function PerformanceChart({ snapshots, initial }: Props) {
  const [active, setActive] = useState<Tab>("value");
  const { theme } = useTheme();
  const isDark    = theme === "dark";

  const gridColor = isDark ? "#2a2a2a" : "#f0f0f0";
  const tickColor = isDark ? "#555"    : "#9ca3af";

  const data = snapshots.map(s => ({
    time:  fmt(s.ts),
    value: s.totalTon,
    pnl:   s.pnl,
    apy:   s.apy ?? 0,
  }));

  const tabs: { id: Tab; label: string }[] = [
    { id: "value", label: "Value" },
    { id: "pnl",   label: "PnL"   },
    { id: "apy",   label: "APY"   },
  ];

  const lastPnl = data[data.length - 1]?.pnl ?? 0;
  const isUp    = lastPnl >= 0;
  const minVal  = data.length ? Math.min(...data.map(d => d.value)) * 0.999 : 0;
  const maxVal  = data.length ? Math.max(...data.map(d => d.value)) * 1.001 : initial;

  const emptyState = (
    <div className="bg-white dark:bg-[#141414] border border-black/[0.07] dark:border-white/[0.07] rounded-2xl p-4 md:p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-black/30 dark:text-white/30 mb-4">
        Performance
      </p>
      <div className="h-[130px] md:h-[160px] flex flex-col items-center justify-center gap-2 border border-dashed border-black/10 dark:border-white/10 rounded-xl">
        <p className="text-[12px] text-black/30 dark:text-white/30">Collecting data…</p>
        <p className="text-[11px] text-black/20 dark:text-white/20">Check back after 2+ agent cycles</p>
      </div>
    </div>
  );

  if (data.length < 2) return emptyState;

  return (
    <div className="bg-white dark:bg-[#141414] border border-black/[0.07] dark:border-white/[0.07] rounded-2xl p-4 md:p-5">

      {/* Header */}
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-black/30 dark:text-white/30">
            Performance
          </p>
          <span className={`text-[12px] md:text-[13px] font-bold ${isUp ? "text-[#0098EA]" : "text-black/50 dark:text-white/50"}`}>
            {isUp ? "+" : ""}{lastPnl.toFixed(5)} TON
          </span>
        </div>

        {/* Tab switcher */}
        <div className="flex rounded-lg border border-black/10 dark:border-white/10 overflow-hidden">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`px-2.5 py-1 text-[10px] font-semibold transition-colors ${
                active === tab.id
                  ? "bg-black dark:bg-white text-white dark:text-black"
                  : "bg-transparent text-black/40 dark:text-white/40 hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={140}>
        <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 9, fill: tickColor }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={active === "value" ? [minVal, maxVal] : ["auto", "auto"]}
            tick={{ fontSize: 9, fill: tickColor }}
            axisLine={false}
            tickLine={false}
            width={50}
            tickFormatter={v => active === "apy" ? `${parseFloat(v).toFixed(1)}%` : parseFloat(v).toFixed(2)}
          />
          <Tooltip content={<CustomTooltip isDark={isDark} tab={active} />} />
          {active === "pnl" && (
            <ReferenceLine y={0} stroke={isDark ? "#333" : "#e5e7eb"} strokeDasharray="4 4" />
          )}
          <Line
            type="monotone"
            dataKey={active}
            stroke="#0098EA"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "#0098EA" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
