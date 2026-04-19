"use client";

import { useState } from "react";
import { Position, PoolPosition } from "@/app/dashboard/page";
import { ExternalLink, LogOut, Clock } from "lucide-react";

interface Props {
  position:        Position;
  poolPositions:   PoolPosition[];
  onCloseStaking?: () => void;
  onCloseLP?:      (address: string) => void;
}

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60)   return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

function RiskBadge({ tvl, apy }: { tvl: number; apy: number }) {
  let level: "Low" | "Med" | "High" = "Med";
  if (tvl > 1_000_000 && apy < 20) level = "Low";
  else if (tvl < 100_000 || apy > 50) level = "High";
  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-black/10 dark:border-white/10 text-black/40 dark:text-white/40">
      {level} Risk
    </span>
  );
}

function ApyBreakdown({ baseApy, rewardApy, feeApy }: { baseApy: number; rewardApy: number; feeApy: number }) {
  const total = baseApy + rewardApy + feeApy;
  return (
    <div className="space-y-1.5 pt-3 border-t border-black/[0.05] dark:border-white/[0.05]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-black/25 dark:text-white/25 mb-2">APY Breakdown</p>
      {[
        { label: "Base rate",       val: baseApy,   sign: ""  },
        { label: "Staking rewards", val: rewardApy, sign: "+" },
        ...(feeApy > 0 ? [{ label: "Trading fees", val: feeApy, sign: "+" }] : []),
      ].map(({ label, val, sign }) => (
        <div key={label} className="flex justify-between">
          <span className="text-[11px] text-black/40 dark:text-white/40">{label}</span>
          <span className="text-[11px] font-semibold text-black/70 dark:text-white/70">{sign}{val.toFixed(2)}%</span>
        </div>
      ))}
      <div className="flex justify-between pt-1.5 border-t border-black/[0.05] dark:border-white/[0.05]">
        <span className="text-[11px] font-bold text-black dark:text-white">Total APY</span>
        <span className="text-[12px] font-extrabold text-[#0098EA]">{total.toFixed(2)}%</span>
      </div>
    </div>
  );
}

function IncomeEstimate({ tonDeployed, apy }: { tonDeployed: number; apy: number }) {
  const daily   = tonDeployed * apy / 100 / 365;
  const monthly = daily * 30;
  return (
    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-black/[0.05] dark:border-white/[0.05]">
      <div className="bg-black/[0.03] dark:bg-white/[0.04] rounded-xl p-3">
        <p className="text-[9px] font-semibold uppercase tracking-wide text-black/30 dark:text-white/30 mb-1">Daily</p>
        <p className="text-[13px] font-bold text-black dark:text-white">+{daily.toFixed(5)}</p>
        <p className="text-[9px] text-black/30 dark:text-white/30">TON / day</p>
      </div>
      <div className="bg-black/[0.03] dark:bg-white/[0.04] rounded-xl p-3">
        <p className="text-[9px] font-semibold uppercase tracking-wide text-black/30 dark:text-white/30 mb-1">Monthly</p>
        <p className="text-[13px] font-bold text-black dark:text-white">+{monthly.toFixed(4)}</p>
        <p className="text-[9px] text-black/30 dark:text-white/30">TON / mo</p>
      </div>
    </div>
  );
}

function PositionCard({
  title, sub, badge, apy, rows, breakdown, income, txHash, simulated, onClose,
}: {
  title: string; sub: string; badge: React.ReactNode; apy: number;
  rows: { label: string; value: string; accent?: boolean }[];
  breakdown: { base: number; reward: number; fee: number };
  income: { ton: number; apy: number };
  txHash?:   string;
  simulated?: boolean;
  onClose?:  () => void;
}) {
  const [confirmClose, setConfirmClose] = useState(false);

  return (
    <div className="rounded-2xl border border-black/[0.07] dark:border-white/[0.07] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/[0.02] dark:bg-white/[0.02] border-b border-black/[0.05] dark:border-white/[0.05]">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[13px] font-bold text-black dark:text-white">{title}</span>
          <span className="text-[10px] text-black/30 dark:text-white/30">{sub}</span>
          {simulated && (
            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-700/40">
              simulated
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {badge}
          <span className="text-[12px] font-extrabold text-[#0098EA]">{apy.toFixed(2)}% APY</span>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {rows.map(({ label, value, accent }) => (
            <div key={label}>
              <p className="text-[10px] text-black/30 dark:text-white/30 mb-0.5">{label}</p>
              <p className={`text-[14px] font-bold ${accent ? "text-[#0098EA]" : "text-black dark:text-white"}`}>
                {value}
              </p>
            </div>
          ))}
        </div>
        <ApyBreakdown baseApy={breakdown.base} rewardApy={breakdown.reward} feeApy={breakdown.fee} />
        <IncomeEstimate tonDeployed={income.ton} apy={income.apy} />

        <div className="flex items-center justify-between pt-1">
          {txHash ? (
            <a
              href={`https://testnet.tonscan.org/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-black/25 dark:text-white/25 hover:text-[#0098EA] transition-colors"
            >
              <ExternalLink size={10} /> View on Tonscan
            </a>
          ) : <span />}

          {onClose && (
            confirmClose ? (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-black/40 dark:text-white/40">Confirm exit?</span>
                <button
                  onClick={() => { onClose(); setConfirmClose(false); }}
                  className="text-[11px] font-semibold text-red-500 hover:text-red-600 transition-colors"
                >Yes</button>
                <button
                  onClick={() => setConfirmClose(false)}
                  className="text-[11px] text-black/30 dark:text-white/30 hover:text-black dark:hover:text-white transition-colors"
                >No</button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmClose(true)}
                className="inline-flex items-center gap-1 text-[11px] text-black/25 dark:text-white/25 hover:text-red-500 transition-colors"
              >
                <LogOut size={10} /> Exit position
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export function PositionPanel({ position, poolPositions, onCloseStaking, onCloseLP }: Props) {
  const pnlPos  = position.pnl >= 0;
  const hasAny  = position.staked > 0 || poolPositions.length > 0;
  const tonIn   = position.staked / 0.98;
  const totalDeployed = tonIn + poolPositions.reduce((s, p) => s + p.tonDeployed, 0);

  return (
    <div className="bg-white dark:bg-[#141414] border border-black/[0.07] dark:border-white/[0.07] rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-black/30 dark:text-white/30">
          Active Positions
        </p>
        {hasAny && (
          <span className={`text-[12px] font-bold ${pnlPos ? "text-[#0098EA]" : "text-black/50 dark:text-white/50"}`}>
            {pnlPos ? "+" : ""}{position.pnl.toFixed(5)} TON
          </span>
        )}
      </div>

      {!hasAny ? (
        <div className="py-10 text-center border border-dashed border-black/10 dark:border-white/10 rounded-2xl">
          <p className="text-[13px] font-medium text-black/30 dark:text-white/30">No positions yet</p>
          <p className="text-[11px] text-black/20 dark:text-white/20 mt-1">Start the agent to deploy capital</p>
        </div>
      ) : (
        <div className="space-y-3">
          {position.staked > 0 && (
            <PositionCard
              title="Tonstakers" sub="Liquid Staking"
              badge={<RiskBadge tvl={50_000_000} apy={4.20} />}
              apy={4.20}
              rows={[
                { label: "Deposited",      value: `${tonIn.toFixed(4)} TON` },
                { label: "Received",       value: `${position.staked.toFixed(4)} tsTON`, accent: true },
                { label: "Est. daily",     value: `+${(tonIn * 4.20 / 100 / 365).toFixed(5)} TON` },
                { label: "Type",           value: "Auto-compounding" },
              ]}
              breakdown={{ base: 3.10, reward: 1.10, fee: 0 }}
              income={{ ton: tonIn, apy: 4.20 }}
              onClose={onCloseStaking}
            />
          )}

          {poolPositions.map(pool => (
            <PositionCard
              key={pool.address}
              title={`${pool.token0}/${pool.token1}`} sub="STON.fi LP"
              badge={<RiskBadge tvl={pool.tvlUsd ?? 500_000} apy={pool.apy} />}
              apy={pool.apy}
              simulated={pool.simulated}
              rows={[
                { label: "Deployed",   value: `${pool.tonDeployed.toFixed(4)} TON` },
                { label: "USD Value",  value: `$${pool.usdValue.toFixed(2)}`, accent: true },
                { label: "Pool share", value: `${pool.share}%` },
                { label: "Entered",    value: timeAgo(pool.enteredAt) },
              ]}
              breakdown={{ base: pool.apy * 0.4, reward: pool.apy * 0.3, fee: pool.apy * 0.3 }}
              income={{ ton: pool.tonDeployed, apy: pool.apy }}
              txHash={pool.txHash}
              onClose={onCloseLP ? () => onCloseLP(pool.address) : undefined}
            />
          ))}

          {/* Summary */}
          <div className="flex justify-between px-4 py-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.05]">
            <div>
              <p className="text-[10px] text-black/30 dark:text-white/30 mb-0.5">Total deployed</p>
              <p className="text-[14px] font-bold text-black dark:text-white">{totalDeployed.toFixed(4)} TON</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-black/30 dark:text-white/30 mb-0.5">Yield earned</p>
              <p className={`text-[14px] font-bold ${pnlPos ? "text-[#0098EA]" : "text-black/50 dark:text-white/40"}`}>
                {pnlPos ? "+" : ""}{position.pnl.toFixed(5)} TON
              </p>
            </div>
          </div>

          {/* Unbonding notice */}
          <div className="flex items-center gap-2 text-[11px] text-black/30 dark:text-white/25 pt-1">
            <Clock size={11} />
            Tonstakers unstaking: ~36–72h unbonding period
          </div>
        </div>
      )}
    </div>
  );
}
