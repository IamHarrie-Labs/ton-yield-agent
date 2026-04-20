"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AgentLog, AgentState } from "@/app/dashboard/page";
import { ExternalLink } from "lucide-react";

// ─── Includes all AgentLog["type"] values ────────────────────────────────────
const typeStyles: Record<AgentLog["type"], { color: string; label: string }> = {
  thought: { color: "#888",    label: "think"  },
  action:  { color: "#0098EA", label: "exec"   },
  tx:      { color: "#0098EA", label: "tx"     },
  info:    { color: "#666",    label: "info"   },
  error:   { color: "#ef4444", label: "error"  },
  warning: { color: "#f59e0b", label: "warn"   },
};

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString("en-US", { hour12: false });
}

const PLACEHOLDER_LOGS: AgentLog[] = [
  { id: "p1", ts: Date.now() - 4000, type: "info",    message: "Agent initialized. Waiting for wallet deployment…" },
  { id: "p2", ts: Date.now() - 3000, type: "thought", message: "Evaluating yield opportunities across Tonstakers and STON.fi…" },
  { id: "p3", ts: Date.now() - 2000, type: "thought", message: "Fetching current APY rates from Tonstakers SDK…" },
  { id: "p4", ts: Date.now() - 1000, type: "info",    message: "Deploy your agent above to begin live execution" },
];

interface Props {
  logs:       AgentLog[];
  agentState: AgentState;
}

export function AgentFeed({ logs, agentState }: Props) {
  const bottomRef   = useRef<HTMLDivElement>(null);
  const displayLogs = logs.length > 0 ? logs : PLACEHOLDER_LOGS;
  const isLive      = agentState === "thinking" || agentState === "executing";

  useEffect(() => {
    // Only auto-scroll when real logs are added — never on mount/placeholder
    if (logs.length === 0) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [logs.length]);

  return (
    <div className={`rounded-2xl overflow-hidden flex flex-col h-[360px] md:h-[460px] border ${
      isLive
        ? "border-[#0098EA]/30"
        : "border-black/[0.07] dark:border-white/[0.07]"
    } bg-[#0d0d0d]`}>

      {/* Terminal title bar */}
      <div className="flex items-center gap-2 px-4 md:px-5 py-3 border-b border-white/[0.05] bg-[#111] shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
          <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
          <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
        </div>
        <span className="ml-2 text-[11px] text-white/25 font-mono tracking-wide">agent.reasoning_feed</span>
        {isLive && (
          <div className="ml-auto flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0098EA] animate-pulse" />
            <span className="text-[11px] text-[#0098EA] font-semibold">live</span>
          </div>
        )}
      </div>

      {/* Scrollable log list */}
      <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-2 font-mono text-[11px] md:text-[12px]">
        <AnimatePresence initial={false}>
          {displayLogs.map((log) => {
            const s = typeStyles[log.type] ?? typeStyles.info;
            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.18 }}
                className="flex gap-2 md:gap-3 leading-relaxed"
              >
                {/* Timestamp */}
                <span className="text-white/20 shrink-0 tabular-nums hidden sm:block" suppressHydrationWarning>
                  {formatTime(log.ts)}
                </span>
                {/* Type label */}
                <span className="shrink-0 font-semibold w-[38px]" style={{ color: s.color }}>
                  {s.label}
                </span>
                {/* Message */}
                <span className="text-white/55 break-all min-w-0">
                  {log.message}
                  {log.txHash && (
                    <a
                      href={`https://testnet.tonscan.org/tx/${log.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 inline-flex items-center gap-0.5 text-[#0098EA] hover:underline"
                    >
                      view <ExternalLink size={9} />
                    </a>
                  )}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Blinking cursor while live */}
        {isLive && (
          <div className="flex gap-2 md:gap-3">
            <span className="text-white/20 tabular-nums hidden sm:block" suppressHydrationWarning>
              {formatTime(Date.now())}
            </span>
            <span className="text-[#0098EA] font-semibold w-[38px]">think</span>
            <span className="text-white/30 animate-pulse">▌</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
