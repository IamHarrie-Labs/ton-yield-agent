"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

interface Props {
  open:      boolean;
  amount:    number;
  goal:      string;
  onConfirm: () => void;
  onCancel:  () => void;
}

const goalDesc: Record<string, string> = {
  conservative: "100% liquid staking via Tonstakers — lowest risk, ~4% APY",
  balanced:     "~60% staking + ~40% STON.fi LP — moderate risk, mixed yield",
  maximize:     "Best available APY across all options — higher risk, higher reward",
};

export function ConfirmModal({ open, amount, goal, onConfirm, onCancel }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
            onClick={onCancel}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{    opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.18 }}
            className="fixed z-[101] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md"
          >
            <div className="bg-white dark:bg-[#1a1a1a] border border-black/[0.07] dark:border-white/[0.07] rounded-2xl p-6 mx-4 shadow-2xl">

              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#0098EA]/10 flex items-center justify-center shrink-0">
                    <AlertTriangle size={18} className="text-[#0098EA]" />
                  </div>
                  <div>
                    <p className="font-bold text-[15px] text-black dark:text-white">Confirm Agent Start</p>
                    <p className="text-[12px] text-black/40 dark:text-white/40">Review before deploying capital</p>
                  </div>
                </div>
                <button onClick={onCancel} className="text-black/25 dark:text-white/25 hover:text-black dark:hover:text-white transition-colors">
                  <X size={18} />
                </button>
              </div>

              {/* Details */}
              <div className="bg-black/[0.03] dark:bg-white/[0.04] rounded-xl p-4 space-y-3 mb-5">
                <div className="flex justify-between">
                  <span className="text-[13px] text-black/50 dark:text-white/40">Capital to deploy</span>
                  <span className="text-[13px] font-bold text-black dark:text-white">{amount} TON</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[13px] text-black/50 dark:text-white/40">Strategy</span>
                  <span className="text-[13px] font-bold text-black dark:text-white capitalize">{goal}</span>
                </div>
                <div className="pt-2 border-t border-black/[0.06] dark:border-white/[0.06]">
                  <p className="text-[12px] text-black/50 dark:text-white/40 leading-relaxed">
                    {goalDesc[goal] ?? "Custom strategy"}
                  </p>
                </div>
              </div>

              {/* Warning */}
              <div className="flex gap-2 mb-5 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40">
                <AlertTriangle size={13} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[12px] text-amber-800 dark:text-amber-300 leading-relaxed">
                  This is a <strong>testnet demo</strong>. The agent will execute transactions autonomously using your configured strategy. You can pause at any time.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onCancel}
                  className="flex-1 py-2.5 rounded-xl border border-black/10 dark:border-white/10 text-[13px] font-semibold text-black/60 dark:text-white/50 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  className="flex-1 py-2.5 rounded-xl bg-[#0098EA] hover:bg-[#007bc0] text-white text-[13px] font-semibold transition-colors"
                >
                  Start Agent
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
