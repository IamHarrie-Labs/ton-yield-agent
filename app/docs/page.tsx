"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronRight, ExternalLink } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { Sun, Moon } from "lucide-react";

/* ─── Table of contents ─────────────────────────────────────────────── */
const sections = [
  { id: "overview",       label: "Overview" },
  { id: "how-it-works",  label: "How It Works" },
  { id: "goals",         label: "Agent Goals" },
  { id: "staking",       label: "Liquid Staking" },
  { id: "lp",            label: "LP Pools & Swaps" },
  { id: "risk",          label: "Risk Model" },
  { id: "wallet",        label: "Agentic Wallet" },
  { id: "ai",            label: "AI Decision Engine" },
  { id: "faq",           label: "FAQ" },
];

/* ─── Reusable section wrapper ──────────────────────────────────────── */
function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 mb-16">
      <h2 className="text-[26px] font-extrabold tracking-tight text-black dark:text-white mb-6 pb-3 border-b border-black/[0.07] dark:border-white/[0.07]">
        {title}
      </h2>
      <div className="space-y-4 text-[15px] leading-relaxed text-black/70 dark:text-white/60">
        {children}
      </div>
    </section>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="text-[17px] font-bold text-black dark:text-white mt-8 mb-3">{children}</h3>;
}

function P({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={className}>{children}</p>;
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="bg-black/[0.05] dark:bg-white/[0.07] px-1.5 py-0.5 rounded text-[13px] font-mono text-black/80 dark:text-white/80">
      {children}
    </code>
  );
}

function Callout({ type, children }: { type: "info" | "warn" | "tip"; children: React.ReactNode }) {
  const styles = {
    info: "bg-[#0098EA]/8 border-[#0098EA]/30 text-[#0098EA]",
    warn: "bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300",
    tip:  "bg-black/[0.03] dark:bg-white/[0.04] border-black/10 dark:border-white/10 text-black/70 dark:text-white/60",
  }[type];
  const icon = { info: "ℹ", warn: "⚠", tip: "💡" }[type];
  return (
    <div className={`flex gap-3 px-4 py-3 rounded-xl border text-[14px] ${styles}`}>
      <span className="shrink-0">{icon}</span>
      <span>{children}</span>
    </div>
  );
}

function Table({ rows }: { rows: [string, string, string][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-black/[0.07] dark:border-white/[0.07]">
      <table className="w-full text-[14px]">
        <thead>
          <tr className="bg-black/[0.03] dark:bg-white/[0.04] border-b border-black/[0.07] dark:border-white/[0.07]">
            {["Property", "Value", "Notes"].map(h => (
              <th key={h} className="text-left px-4 py-3 font-semibold text-black/60 dark:text-white/50 text-[12px] uppercase tracking-wide">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([a, b, c], i) => (
            <tr key={i} className="border-b border-black/[0.04] dark:border-white/[0.04] last:border-0">
              <td className="px-4 py-3 font-medium text-black dark:text-white">{a}</td>
              <td className="px-4 py-3 font-mono text-[13px] text-[#0098EA]">{b}</td>
              <td className="px-4 py-3 text-black/50 dark:text-white/40">{c}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────────────────── */
export default function DocsPage() {
  const [active, setActive] = useState("overview");
  const { theme, toggle }   = useTheme();

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-black dark:text-white">

      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-black/[0.06] dark:border-white/[0.06] bg-white/90 dark:bg-[#0a0a0a]/90 backdrop-blur-md">
        <div className="max-w-[1200px] mx-auto px-6 h-[60px] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-1.5 text-[13px] text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors">
              <ArrowLeft size={14} /> Back
            </Link>
            <div className="w-px h-4 bg-black/10 dark:bg-white/10" />
            <div className="flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="28" cy="28" r="24" stroke="#C8392B" strokeWidth="2.5" strokeDasharray="128 22" strokeDashoffset="-8" fill="none" strokeLinecap="round"/>
                <circle cx="28" cy="28" r="11" fill="none" stroke="currentColor" strokeWidth="2" className="text-black dark:text-white"/>
                <line x1="28" y1="17" x2="28" y2="39" stroke="#C8392B" strokeWidth="2.5" strokeLinecap="round"/>
                <line x1="28" y1="4" x2="28" y2="10" stroke="#C8392B" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span className="font-bold text-[14px]">Surge</span>
              <span className="text-[11px] text-black/30 dark:text-white/30 font-medium ml-1">/ Docs</span>
            </div>
          </div>
          <button
            onClick={toggle}
            className="w-8 h-8 rounded-lg border border-black/[0.07] dark:border-white/[0.07] flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            {theme === "dark" ? <Sun size={14} className="text-white/60" /> : <Moon size={14} className="text-black/50" />}
          </button>
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto px-6 py-12 flex gap-12">

        {/* ── Sidebar ── */}
        <aside className="hidden lg:block w-[200px] shrink-0">
          <nav className="sticky top-24 space-y-0.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-black/25 dark:text-white/25 mb-3 px-3">Contents</p>
            {sections.map(s => (
              <a
                key={s.id}
                href={`#${s.id}`}
                onClick={() => setActive(s.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] transition-colors ${
                  active === s.id
                    ? "bg-[#0098EA]/8 text-[#0098EA] font-semibold"
                    : "text-black/45 dark:text-white/40 hover:text-black dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                }`}
              >
                {active === s.id && <ChevronRight size={11} />}
                {s.label}
              </a>
            ))}
          </nav>
        </aside>

        {/* ── Content ── */}
        <main className="flex-1 min-w-0 max-w-[760px]">

          {/* ── Overview ── */}
          <Section id="overview" title="Overview">
            <P>
              <strong className="text-black dark:text-white">Surge</strong> is an autonomous DeFi agent built on the TON blockchain
              that continuously optimizes your yield by allocating capital across liquid staking (Tonstakers) and
              liquidity pools (STON.fi). It runs 24/7, reasons about market conditions using Claude AI, and executes
              transactions on your behalf — no manual intervention required after setup.
            </P>
            <Callout type="warn">
              This is a <strong>testnet-only</strong> application built for the STON.fi Vibe Coding Hackathon 2025.
              Smart contracts are unaudited. Do not use real funds.
            </Callout>
            <H3>Tech Stack</H3>
            <Table rows={[
              ["Blockchain",      "TON (testnet)",               "The Open Network"],
              ["AI Model",        "Claude Haiku 4.5",            "Anthropic — reasoning engine"],
              ["Liquid Staking",  "Tonstakers SDK",              "tsTON liquid staking token"],
              ["DEX / Swaps",     "STON.fi Omniston SDK",        "AMM liquidity pools"],
              ["Wallet Type",     "TON Agentic Wallet V5R1",     "Split-key, operator-controlled"],
              ["Frontend",        "Next.js 14 + Tailwind CSS",   "App Router, dark mode"],
            ]} />
          </Section>

          {/* ── How it works ── */}
          <Section id="how-it-works" title="How It Works">
            <P>
              When you click <strong className="text-black dark:text-white">Start Agent</strong>, the following sequence executes automatically:
            </P>
            <ol className="list-none space-y-4 mt-4">
              {[
                ["1", "Wallet Deployment", "A TON Agentic Wallet (WalletContractV5R1) is derived from a server-side mnemonic. This is the operator key — your connected wallet is the owner and retains ultimate control."],
                ["2", "Market Scan", "Claude Haiku fetches live APY data from the Tonstakers SDK and STON.fi pool API. It currently tracks 50+ active pools and filters for TVL > $10,000 USD."],
                ["3", "Reasoning", "The AI reasons about the data: compares staking APY vs pool APY, evaluates your selected goal (Conservative / Balanced / Maximize), and decides an allocation strategy."],
                ["4", "Execution", "Transactions are built and sent: staking via Tonstakers SDK, LP entry via STON.fi. If a pool requires a token swap (e.g., TON → STON), that swap is executed first automatically."],
                ["5", "Loop", "The agent re-evaluates every ~30 seconds. If a better opportunity is detected it rebalances, otherwise it holds and compounds."],
              ].map(([num, title, desc]) => (
                <li key={num} className="flex gap-4">
                  <div className="shrink-0 w-7 h-7 rounded-full bg-black/[0.05] dark:bg-white/[0.06] flex items-center justify-center text-[12px] font-bold text-black/50 dark:text-white/50 mt-0.5">
                    {num}
                  </div>
                  <div>
                    <p className="font-semibold text-black dark:text-white mb-1">{title}</p>
                    <p>{desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Section>

          {/* ── Goals ── */}
          <Section id="goals" title="Agent Goals">
            <P>Before starting, you select a goal that governs the agent's risk appetite and allocation strategy:</P>
            <div className="grid gap-4 mt-4">
              {[
                {
                  label: "Conservative",
                  tag: "Low risk",
                  color: "border-black/10 dark:border-white/10",
                  desc: "Capital is deployed exclusively to Tonstakers liquid staking. No LP exposure. Best for users who want predictable 4–5% APY with minimal smart-contract risk. The agent stakes 100% of your capital as tsTON and auto-compounds.",
                },
                {
                  label: "Balanced",
                  tag: "Moderate",
                  color: "border-[#0098EA]/30",
                  desc: "The agent splits capital: ~60% goes to Tonstakers staking and ~40% is deployed into the highest-APY STON.fi pool that meets the TVL safety threshold. This captures fee revenue on top of staking yield.",
                },
                {
                  label: "Maximize",
                  tag: "High yield",
                  color: "border-black/10 dark:border-white/10",
                  desc: "The agent chases the highest available APY regardless of source. It may allocate 100% to a high-yield LP pool if the APY significantly exceeds staking. More volatile — pool APYs fluctuate with trading volume.",
                },
              ].map(g => (
                <div key={g.label} className={`rounded-xl border ${g.color} p-5`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-black dark:text-white">{g.label}</span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border border-black/10 dark:border-white/10 text-black/40 dark:text-white/40">{g.tag}</span>
                  </div>
                  <p className="text-[14px]">{g.desc}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* ── Staking ── */}
          <Section id="staking" title="Liquid Staking via Tonstakers">
            <P>
              Tonstakers is the primary liquid staking protocol on TON. When the agent stakes your TON, you receive
              <Code>tsTON</Code> — a liquid staking token that represents your staked TON plus accumulated rewards.
            </P>
            <H3>How tsTON Works</H3>
            <P>
              <Code>tsTON</Code> continuously appreciates relative to TON as staking rewards accumulate in the pool.
              You don't need to claim rewards manually — the exchange rate between <Code>tsTON</Code> and <Code>TON</Code> increases over time.
            </P>
            <Table rows={[
              ["Current APY",      "~4.20%",           "Live rate from Tonstakers SDK"],
              ["Token received",   "tsTON",            "Liquid, tradeable staking token"],
              ["Compounding",      "Automatic",        "No claim transactions needed"],
              ["Unstaking delay",  "~36–72 hours",     "TON staking round cycle"],
              ["Min stake",        "1 TON",            "Protocol minimum"],
            ]} />
            <Callout type="tip">
              On the dashboard, the <strong>Deposited</strong> figure shows the raw TON you put in, while <strong>Received</strong> shows your tsTON balance. The agent tracks both for accurate PnL calculation.
            </Callout>
          </Section>

          {/* ── LP Pools & Swaps ── */}
          <Section id="lp" title="LP Pools & Automatic Swaps">
            <P>
              When the agent decides to enter a STON.fi liquidity pool, it handles everything end-to-end — including
              any required token swaps. Here's exactly what happens:
            </P>
            <H3>Example: You hold TON, agent targets TON/STON pool</H3>
            <ol className="list-decimal list-inside space-y-3 mt-3 text-[15px]">
              <li>Agent identifies <Code>TON/STON</Code> as the highest-APY pool matching your goal.</li>
              <li>Agent calculates the required split: 50% of capital stays as TON, 50% is swapped to STON.</li>
              <li><strong className="text-black dark:text-white">Swap executes automatically</strong> via STON.fi Omniston SDK — TON → STON at current market rate.</li>
              <li>Both tokens are deposited into the <Code>TON/STON</Code> pool in the correct ratio.</li>
              <li>The agent receives LP tokens representing your share of the pool.</li>
            </ol>
            <Callout type="info">
              Yes — the agent <strong>does perform swaps automatically</strong>. If you only hold TON and the best pool is
              TON/STON, it will swap the required portion of TON into STON before providing liquidity.
              You never need to manually acquire the second token.
            </Callout>
            <H3>Pool Selection Criteria</H3>
            <Table rows={[
              ["Min TVL",       "> $10,000 USD",   "Filters out illiquid pools"],
              ["APY cap",       "< 999%",          "Removes obvious data anomalies"],
              ["APY source",    "apy_1d",          "24h trailing from STON.fi API"],
              ["Pool type",     "AMM v2",          "Constant-product market maker"],
              ["Fee tier",      "0.3% per swap",   "Standard STON.fi LP fee"],
            ]} />
            <H3>Impermanent Loss Warning</H3>
            <P>
              Providing liquidity to two-sided pools exposes you to impermanent loss — if the price ratio between
              the two tokens changes significantly, you may receive less value than simply holding the tokens.
              The <strong className="text-black dark:text-white">Conservative</strong> goal avoids this entirely by staying in staking-only mode.
            </P>
            <Callout type="warn">
              Impermanent loss is a real risk in LP pools. High APY pools often correlate with higher price volatility
              and therefore higher impermanent loss risk. Use the Maximize goal only if you understand this tradeoff.
            </Callout>
          </Section>

          {/* ── Risk ── */}
          <Section id="risk" title="Risk Model">
            <P>Each position is assigned a risk badge based on TVL and APY:</P>
            <Table rows={[
              ["Low Risk",  "TVL > $1M AND APY < 20%",   "Established pools with sustainable yield"],
              ["Med Risk",  "Everything in between",       "Standard LP pools"],
              ["High Risk", "TVL < $100K OR APY > 50%",   "New or volatile pools"],
            ]} />
            <H3>Smart Contract Risk</H3>
            <P>
              Both Tonstakers and STON.fi are audited mainnet protocols. However, this application itself is
              unaudited hackathon code running on testnet. The agentic wallet pattern is experimental.
              Never use real funds.
            </P>
          </Section>

          {/* ── Wallet ── */}
          <Section id="wallet" title="Agentic Wallet Architecture">
            <P>
              Surge uses a split-key architecture for autonomous operation without requiring your approval
              on every transaction:
            </P>
            <div className="rounded-xl border border-black/[0.07] dark:border-white/[0.07] overflow-hidden mt-4">
              {[
                ["Owner Key", "Your connected wallet (Tonkeeper / TonConnect)", "Ultimate authority. Can override or withdraw at any time."],
                ["Operator Key", "Server-side mnemonic (AGENT_MNEMONIC)", "Signs daily transactions. Cannot withdraw to arbitrary addresses."],
              ].map(([role, who, note]) => (
                <div key={role} className="flex gap-4 p-4 border-b border-black/[0.04] dark:border-white/[0.04] last:border-0">
                  <div className="shrink-0 w-24 text-[12px] font-bold text-black/50 dark:text-white/40 pt-0.5">{role}</div>
                  <div>
                    <p className="font-semibold text-black dark:text-white text-[14px]">{who}</p>
                    <p className="text-[13px] text-black/50 dark:text-white/40 mt-0.5">{note}</p>
                  </div>
                </div>
              ))}
            </div>
            <Callout type="tip">
              The operator key lives in <Code>.env.local</Code> as <Code>AGENT_MNEMONIC</Code>. It never leaves the server and is never exposed to the browser.
            </Callout>
          </Section>

          {/* ── AI ── */}
          <Section id="ai" title="AI Decision Engine">
            <P>
              At the core of the agent is <strong className="text-black dark:text-white">Claude Haiku 4.5</strong> by Anthropic.
              Each reasoning cycle the model receives:
            </P>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li>Live Tonstakers APY</li>
              <li>Top 5 STON.fi pool APYs with TVL and token pair data</li>
              <li>Current portfolio position (staked TON, LP value, idle TON)</li>
              <li>User's selected goal (conservative / balanced / maximize)</li>
              <li>Capital amount to deploy</li>
            </ul>
            <P className="mt-4">
              The model outputs a structured JSON action:
            </P>
            <pre className="bg-black/[0.04] dark:bg-white/[0.04] rounded-xl p-4 text-[13px] font-mono text-black/80 dark:text-white/70 overflow-x-auto mt-3">
{`{
  "action": "stake" | "provide_liquidity" | "hold",
  "amount": 10,
  "pool": "EQ...poolAddress",
  "token0": "TON",
  "token1": "STON",
  "reasoning": "Pool APY 18.4% exceeds staking 4.2%..."
}`}
            </pre>
            <Callout type="info">
              All AI reasoning is streamed live to the <strong>Agent Feed</strong> terminal on the dashboard.
              You can see exactly why every decision was made.
            </Callout>
          </Section>

          {/* ── FAQ ── */}
          <Section id="faq" title="FAQ">
            {[
              ["Do I need to hold the second token to enter a pool?",
               "No. The agent automatically swaps a portion of your TON into the required token before providing liquidity. If the pool is TON/STON, it swaps ~50% of the allocated capital into STON first, then deposits both."],
              ["What happens if I pause the agent?",
               "All open positions remain intact — nothing is unstaked or withdrawn. The agent simply stops executing new transactions. You can resume at any time."],
              ["Can I change my goal while the agent is running?",
               "No. You must pause the agent first. Once paused, you can switch goals and then resume."],
              ["Why do some APY values look very high?",
               "STON.fi pool APYs are 24-hour trailing and can spike during high-volume periods. The agent applies a 999% cap and $10K TVL minimum to filter out anomalous values."],
              ["Is this on mainnet?",
               "No. This is testnet-only. The Tonstakers SDK is pointed at the TON testnet and all transactions use testnet TON with no real value."],
              ["What is tsTON?",
               "tsTON is the liquid staking token issued by Tonstakers. It represents staked TON + accrued rewards and appreciates against TON over time as staking rewards compound."],
              ["Where are my funds?",
               "All funds are held in the agentic wallet contract on-chain. The server never has custody — it only holds the operator signing key, which cannot withdraw to arbitrary addresses."],
            ].map(([q, a]) => (
              <details key={q as string} className="group border border-black/[0.07] dark:border-white/[0.07] rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none font-semibold text-black dark:text-white text-[15px] hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                  {q}
                  <ChevronRight size={16} className="text-black/30 dark:text-white/30 transition-transform group-open:rotate-90 shrink-0" />
                </summary>
                <div className="px-5 pb-4 text-[14px] text-black/60 dark:text-white/50 border-t border-black/[0.05] dark:border-white/[0.05] pt-3">
                  {a}
                </div>
              </details>
            ))}
          </Section>

          {/* Footer */}
          <div className="pt-6 border-t border-black/[0.07] dark:border-white/[0.07] flex items-center justify-between">
            <p className="text-[12px] text-black/30 dark:text-white/25">
              Built for the STON.fi Vibe Coding Hackathon · Tonstakers track · 2025
            </p>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[12px] text-black/30 dark:text-white/25 hover:text-[#0098EA] transition-colors"
            >
              Source <ExternalLink size={11} />
            </a>
          </div>

        </main>
      </div>
    </div>
  );
}
