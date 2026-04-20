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
          {/* Surge brand mark — hex + lightning bolt */}
          <svg width="26" height="26" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polygon points="18,2 32,10 32,26 18,34 4,26 4,10" fill="none" stroke="rgba(0,229,255,0.2)" strokeWidth="1"/>
            <polygon points="18,6 28,12 28,24 18,30 8,24 8,12" fill="none" stroke="rgba(0,229,255,0.4)" strokeWidth="1"/>
            <path d="M13 20 L18 11 L23 20 H19.5 L21.5 25 L14.5 17.5 H17.5Z" fill="#00E5FF"/>
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
