"use client";

import { TonConnectButton, useTonWallet } from "@tonconnect/ui-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

const steps = [
  { num: "01", title: "Connect Wallet", desc: "Link your TON wallet in one tap. Self-custody stays with you." },
  { num: "02", title: "Set Your Goal",  desc: "Choose maximize, conservative, or balanced yield strategy." },
  { num: "03", title: "Agent Takes Over", desc: "Claude AI monitors markets 24/7 and executes the best moves." },
];

const stats = [
  { value: "4.2%", label: "Live staking APY" },
  { value: "24/7", label: "Autonomous operation" },
  { value: "TON",  label: "Native blockchain" },
  { value: "0",    label: "Clicks after setup" },
];

export default function LandingPage() {
  const wallet = useTonWallet();
  const router = useRouter();
  const { theme, toggle } = useTheme();

  useEffect(() => {
    if (wallet) router.push("/dashboard");
  }, [wallet, router]);

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-black dark:text-white">

      {/* ── Navbar ── */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-black/[0.06] dark:border-white/[0.06] bg-white/90 dark:bg-[#0a0a0a]/90 backdrop-blur-md">
        <div className="max-w-[1200px] mx-auto px-6 h-[60px] flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <svg width="24" height="24" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="28" cy="28" r="24" stroke="#C8392B" strokeWidth="2.5" strokeDasharray="128 22" strokeDashoffset="-8" fill="none" strokeLinecap="round"/>
              <circle cx="28" cy="28" r="11" fill="none" stroke="currentColor" strokeWidth="2" className="text-black dark:text-white"/>
              <line x1="28" y1="17" x2="28" y2="39" stroke="#C8392B" strokeWidth="2.5" strokeLinecap="round"/>
              <line x1="28" y1="4" x2="28" y2="10" stroke="#C8392B" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span className="font-semibold text-[15px] tracking-tight text-black dark:text-white">Surge</span>
          </div>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-8 text-[13px] font-medium text-black/50 dark:text-white/40">
            <a href="#how"   className="hover:text-black dark:hover:text-white transition-colors">How it works</a>
            <a href="#stats" className="hover:text-black dark:hover:text-white transition-colors">Stats</a>
            <a
              href="/docs"
              className="hover:text-black dark:hover:text-white transition-colors"
            >
              Docs
            </a>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
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
            <div className="scale-[0.92] origin-right">
              <TonConnectButton />
            </div>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="pt-[130px] pb-[100px] px-6">
        <div className="max-w-[1200px] mx-auto">

          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 border border-black/10 dark:border-white/10 rounded-full px-3.5 py-1 mb-10"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#0098EA] animate-pulse" />
            <span className="text-[12px] font-medium text-black/60 dark:text-white/50 tracking-wide uppercase">
              Testnet Live — STON.fi Hackathon 2025
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.05 }}
            className="text-[clamp(48px,8vw,96px)] font-extrabold leading-[1.0] tracking-[-0.03em] mb-8 max-w-[900px]"
          >
            Autonomous<br />
            DeFi yield,<br />
            <span className="text-[#0098EA]">on TON.</span>
          </motion.h1>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="text-[18px] text-black/50 dark:text-white/40 max-w-[480px] leading-relaxed mb-12 font-normal"
          >
            Connect your TON wallet. An AI agent stakes, swaps, and rebalances
            your portfolio around the clock — no manual clicks required.
          </motion.p>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.18 }}
            className="flex flex-wrap items-center gap-4"
          >
            <TonConnectButton />
            <a
              href="#how"
              className="inline-flex items-center gap-1.5 text-[14px] font-medium text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors"
            >
              How it works <ArrowUpRight size={14} />
            </a>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-5 text-[11px] text-black/30 dark:text-white/25 tracking-wide"
          >
            Testnet only · Contracts unaudited · Use with care
          </motion.p>
        </div>
      </section>

      {/* ── Stats ── */}
      <section id="stats" className="border-y border-black/[0.07] dark:border-white/[0.06] py-14 px-6 bg-[#f9f9f9] dark:bg-[#111]">
        <div className="max-w-[1200px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map(({ value, label }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.07 }}
              className="space-y-1"
            >
              <div className="text-[40px] font-extrabold tracking-tight leading-none text-black dark:text-white">{value}</div>
              <div className="text-[13px] text-black/40 dark:text-white/40 font-medium">{label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="py-[100px] px-6">
        <div className="max-w-[1200px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-16"
          >
            <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-black/30 dark:text-white/25 mb-3">Process</p>
            <h2 className="text-[clamp(32px,4vw,52px)] font-extrabold tracking-[-0.02em] leading-tight text-black dark:text-white">
              Three steps to<br />autonomous yield.
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-px bg-black/[0.07] dark:bg-white/[0.06] border border-black/[0.07] dark:border-white/[0.06]">
            {steps.map(({ num, title, desc }, i) => (
              <motion.div
                key={num}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + i * 0.08 }}
                className="bg-white dark:bg-[#141414] p-10 group hover:bg-[#0098EA] dark:hover:bg-[#0098EA] transition-colors duration-300"
              >
                <div className="text-[11px] font-bold tracking-[0.15em] text-black/20 dark:text-white/20 group-hover:text-white/40 mb-8 transition-colors">
                  {num}
                </div>
                <h3 className="text-[22px] font-bold tracking-tight mb-3 text-black dark:text-white group-hover:text-white transition-colors">
                  {title}
                </h3>
                <p className="text-[14px] text-black/50 dark:text-white/40 leading-relaxed group-hover:text-white/70 transition-colors">
                  {desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="py-[100px] px-6 bg-black text-white">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-start md:items-end justify-between gap-10">
          <div>
            <h2 className="text-[clamp(36px,5vw,64px)] font-extrabold tracking-[-0.02em] leading-tight mb-4">
              Start earning<br />while you sleep.
            </h2>
            <p className="text-[15px] text-white/40 max-w-sm leading-relaxed">
              Powered by TON Agentic Wallets, Tonstakers, and STON.fi Omniston.
            </p>
          </div>
          <div className="shrink-0">
            <TonConnectButton />
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-black border-t border-white/[0.06] px-6 py-8">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <svg width="18" height="18" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="28" cy="28" r="24" stroke="#C8392B" strokeWidth="2.5" strokeDasharray="128 22" strokeDashoffset="-8" fill="none" strokeLinecap="round"/>
              <circle cx="28" cy="28" r="11" fill="none" stroke="white" strokeWidth="2" opacity="0.4"/>
              <line x1="28" y1="17" x2="28" y2="39" stroke="#C8392B" strokeWidth="2.5" strokeLinecap="round"/>
              <line x1="28" y1="4" x2="28" y2="10" stroke="#C8392B" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span className="text-white/40 text-[13px]">Surge</span>
          </div>
          <p className="text-[12px] text-white/20">
            Built for the STON.fi Vibe Coding Hackathon · Tonstakers track · 2025
          </p>
        </div>
      </footer>

    </div>
  );
}
