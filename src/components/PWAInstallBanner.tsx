"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show if already installed as PWA
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    // Don't show if already dismissed
    if (localStorage.getItem("dueviq:pwa-dismissed") === "1") return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!deferredPrompt || dismissed) return null;

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setDismissed(true);
    }
  }

  function handleDismiss() {
    localStorage.setItem("dueviq:pwa-dismissed", "1");
    setDismissed(true);
  }

  return (
    <div className="fixed bottom-20 sm:bottom-6 inset-x-4 sm:inset-x-auto sm:right-6 sm:left-auto sm:w-80 z-50 rounded-2xl border border-border bg-surface shadow-lg p-4 flex items-start gap-3 animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">Install Dueviq</p>
        <p className="text-xs text-foreground-muted mt-0.5">
          Add to your home screen for the full app experience.
        </p>
        <button
          onClick={handleInstall}
          className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white"
        >
          <Download size={12} /> Install app
        </button>
      </div>
      <button
        onClick={handleDismiss}
        aria-label="Dismiss"
        className="text-foreground-muted hover:text-foreground mt-0.5 shrink-0"
      >
        <X size={16} />
      </button>
    </div>
  );
}
