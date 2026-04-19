"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Info, AlertTriangle, X } from "lucide-react";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id:      string;
  type:    ToastType;
  title:   string;
  message?: string;
}

interface ToastCtxValue {
  toast: (type: ToastType, title: string, message?: string) => void;
}

const ToastCtx = createContext<ToastCtxValue>({ toast: () => {} });

const icons = {
  success: <CheckCircle   size={16} className="text-[#0098EA]" />,
  error:   <XCircle       size={16} className="text-red-500" />,
  info:    <Info          size={16} className="text-black/40 dark:text-white/40" />,
  warning: <AlertTriangle size={16} className="text-amber-500" />,
};

const borders = {
  success: "border-[#0098EA]/30",
  error:   "border-red-500/30",
  info:    "border-black/10 dark:border-white/10",
  warning: "border-amber-400/40",
};

function ToastItem({ t, onDismiss }: { t: Toast; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4500);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0,  scale: 1 }}
      exit={{    opacity: 0, y: -8,  scale: 0.97, transition: { duration: 0.15 } }}
      className={`flex items-start gap-3 bg-white dark:bg-[#1a1a1a] border ${borders[t.type]} rounded-xl px-4 py-3 shadow-lg shadow-black/8 min-w-[280px] max-w-[360px]`}
    >
      <span className="mt-0.5 shrink-0">{icons[t.type]}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-black dark:text-white">{t.title}</p>
        {t.message && (
          <p className="text-[12px] text-black/50 dark:text-white/40 mt-0.5 leading-relaxed">{t.message}</p>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="shrink-0 text-black/25 dark:text-white/25 hover:text-black dark:hover:text-white transition-colors mt-0.5"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, type, title, message }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 items-end">
        <AnimatePresence>
          {toasts.map(t => (
            <ToastItem key={t.id} t={t} onDismiss={() => dismiss(t.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);
