"use client";

import { useState } from "react";
import { AgentState } from "@/app/dashboard/page";
import { Play, Pause, Copy, Check, ExternalLink } from "lucide-react";

interface Props {
  state:         AgentState;
  agentWallet:   string | null;
  amount:        number;
  onAmount:      (n: number) => void;
  walletBalance: number | null;
  onStart:       () => void;
  onPause:       () => void;
}

export function AgentStatus({ state, agentWallet, amount, onAmount, walletBalance, onStart, onPause }: Props) {
  const isRunning = state === "thinking" || state === "executing";
  const [copied, setCopied]   = useState(false);

  const copyAddress = () => {
    if (!agentWallet) return;
    navigator.clipboard.writeText(agentWallet).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="bg-white dark:bg-[#141414] border border-black/[0.07] dark:border-white/[0.07] rounded-2xl p-4 md:p-5 space-y-4">

      {/* Header row */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-bold text-[15px] tracking-tight text-black dark:text-white mb-0.5">Surge Agent</p>
          {agentWallet ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-[11px] font-mono text-black/30 dark:text-white/30 truncate max-w-[160px] sm:max-w-none">
                {agentWallet.slice(0, 10)}…{agentWallet.slice(-8)}
              </p>
              <button
                onClick={copyAddress}
                title="Copy wallet address"
                className="text-black/25 dark:text-white/25 hover:text-[#0098EA] transition-colors"
              >
                {copied ? <Check size={12} className="text-[#0098EA]" /> : <Copy size={12} />}
              </button>
              <a
                href={`https://testnet.tonscan.org/address/${agentWallet}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-black/25 dark:text-white/25 hover:text-[#0098EA] transition-colors"
                title="View on Tonscan"
              >
                <ExternalLink size={12} />
              </a>
            </div>
          ) : (
            <p className="text-[11px] text-black/30 dark:text-white/30">No wallet deployed yet</p>
          )}
        </div>

        <div className="shrink-0">
          {!isRunning ? (
            <button
              onClick={onStart}
              className="inline-flex items-center gap-2 px-4 md:px-5 py-2.5 rounded-xl bg-[#0098EA] hover:bg-[#007bc0] text-white text-[13px] font-semibold transition-colors"
            >
              <Play size={12} />
              {state === "paused" ? "Resume" : "Start Agent"}
            </button>
          ) : (
            <button
              onClick={onPause}
              className="inline-flex items-center gap-2 px-4 md:px-5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-black/60 dark:text-white/60 text-[13px] font-semibold hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            >
              <Pause size={12} />
              Pause
            </button>
          )}
        </div>
      </div>

      {/* Funding reminder when wallet is deployed but not running yet */}
      {agentWallet && state === "paused" && (
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 text-[12px] text-amber-800 dark:text-amber-300">
          <span className="shrink-0">⚠</span>
          <span>
            Fund the agentic wallet on testnet to enable real transactions.{" "}
            <button onClick={copyAddress} className="underline font-semibold">
              {copied ? "Copied!" : "Copy address"}
            </button>
          </span>
        </div>
      )}

      {/* Capital input */}
      <div className={`flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl border ${
        isRunning
          ? "border-black/[0.04] dark:border-white/[0.04] bg-black/[0.02] dark:bg-white/[0.02]"
          : "border-black/[0.07] dark:border-white/[0.07]"
      }`}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-black/30 dark:text-white/30">
              Capital to deploy
            </p>
            {walletBalance !== null && (
              <p className="text-[10px] font-mono text-black/35 dark:text-white/35">
                Available: <span className="text-black/60 dark:text-white/60 font-semibold">{walletBalance.toFixed(2)} TON</span>
              </p>
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <input
              type="number"
              min={1}
              step={0.5}
              value={amount}
              disabled={isRunning}
              onChange={e => onAmount(Math.max(0.1, parseFloat(e.target.value) || 0))}
              className="w-24 md:w-28 text-[20px] md:text-[22px] font-extrabold tracking-tight bg-transparent border-none outline-none text-black dark:text-white disabled:opacity-40"
            />
            <span className="text-[14px] font-semibold text-black/30 dark:text-white/30">TON</span>
          </div>
        </div>

        {!isRunning ? (
          <div className="flex gap-1 md:gap-1.5 shrink-0">
            {[5, 10, 50].map(v => (
              <button
                key={v}
                onClick={() => onAmount(v)}
                className={`px-2.5 md:px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${
                  amount === v
                    ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white"
                    : "bg-transparent text-black/40 dark:text-white/40 border-black/10 dark:border-white/10 hover:border-black/25 dark:hover:border-white/25"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-black/25 dark:text-white/25 shrink-0">Pause to edit</p>
        )}
      </div>
    </div>
  );
}
