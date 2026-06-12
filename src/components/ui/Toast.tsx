"use client";

import { useEffect, useState } from "react";
import { X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  message: string;
  onDismiss: () => void;
  /** Auto-dismiss after this many ms. Default 5000. */
  duration?: number;
}

export function Toast({ message, onDismiss, duration = 5000 }: Props) {
  const [visible, setVisible] = useState(false);

  // Animate in on mount
  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  // Auto-dismiss
  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      // Allow exit animation before removing
      const exit = setTimeout(onDismiss, 300);
      return () => clearTimeout(exit);
    }, duration);
    return () => clearTimeout(t);
  }, [duration, onDismiss]);

  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className={cn(
        "flex items-start gap-3 rounded-xl border border-danger-soft bg-danger-soft px-4 py-3 shadow-lg text-sm text-foreground",
        "transition-all duration-300",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
      )}
    >
      <AlertCircle size={16} className="shrink-0 mt-0.5 text-danger" />
      <p className="flex-1">{message}</p>
      <button
        onClick={() => {
          setVisible(false);
          setTimeout(onDismiss, 300);
        }}
        aria-label="Dismiss notification"
        className="shrink-0 rounded-lg p-0.5 text-foreground-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info"
      >
        <X size={14} />
      </button>
    </div>
  );
}

interface ToastRegionProps {
  notice: { id: number; message: string } | null;
  onDismiss: () => void;
}

export function ToastRegion({ notice, onDismiss }: ToastRegionProps) {
  if (!notice) return null;
  return (
    <div className="fixed bottom-24 sm:bottom-6 inset-x-4 sm:inset-x-auto sm:right-6 sm:left-auto sm:w-96 z-50">
      <Toast key={notice.id} message={notice.message} onDismiss={onDismiss} />
    </div>
  );
}
