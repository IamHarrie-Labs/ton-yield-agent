"use client";

import { TonConnectButton } from "@tonconnect/ui-react";
import { Moon, Sun }        from "lucide-react";
import { AgentState }       from "@/app/dashboard/page";
import { useTheme }         from "@/components/ThemeProvider";

const stateConfig: Record<AgentState, { label: string; color: string }> = {
  idle:      { label: "Idle",     color: "#9ca3af" },
  thinking:  { label: "Thinking", color: "#f59e0b" },
  executing: { label: "Active",   color: "#0098EA" },
  paused:    { label: "Paused",   color: "#6b7280" },
};

export function TopBar({ agentState, agentWallet }: {
  agentState:  AgentState;
  agentWallet: string | null;
}) {
  const { theme, toggle } = useTheme();
  const { label, color }  = stateConfig[agentState];

  return (
    <header className="border-b border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-[#0f0f0f] px-4 md:px-6 h-[56px] md:h-[60px] flex items-center justify-between sticky top-0 z-40">

      {/* Logo */}
      <div className="flex items-center gap-2 md:gap-3 min-w-0">
        <a href="/" className="flex items-center gap-2 shrink-0">
          {/* Orator brand mark */}
          <svg width="26" height="26" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="28" cy="28" r="24" stroke="#C8392B" strokeWidth="2.5" strokeDasharray="128 22" strokeDashoffset="-8" fill="none" strokeLinecap="round"/>
            <circle cx="28" cy="28" r="11" fill="none" stroke="currentColor" strokeWidth="2" className="text-black dark:text-white"/>
            <line x1="28" y1="17" x2="28" y2="39" stroke="#C8392B" strokeWidth="2.5" strokeLinecap="round"/>
            <line x1="28" y1="4" x2="28" y2="10" stroke="#C8392B" strokeWidth="2" strokeLinecap="round"/>
            <line x1="46" y1="14" x2="42.2" y2="16.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.35" className="text-black dark:text-white"/>
            <line x1="46" y1="42" x2="42.2" y2="39.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.35" className="text-black dark:text-white"/>
            <line x1="10" y1="14" x2="13.8" y2="16.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.35" className="text-black dark:text-white"/>
            <line x1="10" y1="42" x2="13.8" y2="39.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.35" className="text-black dark:text-white"/>
          </svg>
          <span className="font-bold text-[14px] md:text-[15px] tracking-tight text-black dark:text-white">
            Surge
          </span>
        </a>
        {agentWallet && (
          <span className="hidden md:block text-[11px] font-mono text-black/25 dark:text-white/25 border border-black/10 dark:border-white/10 rounded-full px-2.5 py-0.5 truncate max-w-[180px]">
            {agentWallet.slice(0, 8)}…{agentWallet.slice(-6)}
          </span>
        )}
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 md:gap-3 shrink-0">

        {/* Agent state dot (mobile) + pill (desktop) */}
        <div className="flex items-center gap-1.5 sm:px-3 sm:py-1 sm:rounded-full sm:border sm:border-black/[0.07] dark:sm:border-white/[0.07]">
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{
              backgroundColor: color,
              boxShadow:       agentState === "executing" ? `0 0 6px ${color}` : "none",
              animation:       agentState === "executing" || agentState === "thinking" ? "pulse 1.5s infinite" : "none",
            }}
          />
          <span className="hidden sm:block text-[12px] font-medium text-black/50 dark:text-white/50">{label}</span>
        </div>

        {/* Dark mode toggle */}
        <button
          onClick={toggle}
          className="w-8 h-8 rounded-lg border border-black/[0.07] dark:border-white/[0.07] flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          aria-label="Toggle dark mode"
        >
          {theme === "dark"
            ? <Sun  size={14} className="text-white/60" />
            : <Moon size={14} className="text-black/50" />
          }
        </button>

        <div className="scale-[0.85] md:scale-[0.88] origin-right">
          <TonConnectButton />
        </div>
      </div>
    </header>
  );
}
