"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Receipt, Repeat, Target, Map, Landmark,
  Settings, Sparkles, MoreHorizontal, X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Core tabs always visible in the bottom bar (max 5 for comfortable mobile tap targets)
const coreTabs = [
  { href: "/today", label: "Today", icon: Home },
  { href: "/bills", label: "Bills", icon: Receipt },
  { href: "/accounts", label: "Accounts", icon: Landmark },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/money-map", label: "Map", icon: Map },
];

// All tabs for desktop nav
const allTabs = [
  ...coreTabs,
  { href: "/subscriptions", label: "Subscriptions", icon: Repeat },
];

// Extra links in the mobile "More" drawer
const moreLinks = [
  { href: "/subscriptions", label: "Subscriptions", icon: Repeat },
  { href: "/plus", label: "Dueviq+", icon: Sparkles },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function MobileTabBar() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const moreActive = moreLinks.some((l) => pathname?.startsWith(l.href));

  return (
    <>
      {/* Drawer backdrop */}
      {moreOpen && (
        <div
          className="sm:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setMoreOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* More drawer */}
      {moreOpen && (
        <div className="sm:hidden fixed bottom-16 inset-x-0 z-50 mx-4 mb-1 rounded-2xl border border-border bg-surface shadow-xl">
          <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-border">
            <span className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">More</span>
            <button
              onClick={() => setMoreOpen(false)}
              aria-label="Close menu"
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-foreground-muted hover:text-foreground hover:bg-surface-muted"
            >
              <X size={15} />
            </button>
          </div>
          <ul className="p-2" role="list">
            {moreLinks.map(({ href, label, icon: Icon }) => {
              const active = pathname?.startsWith(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
                      active
                        ? "bg-accent-soft text-foreground"
                        : "text-foreground-muted hover:text-foreground hover:bg-surface-muted",
                    )}
                  >
                    <Icon size={18} aria-hidden="true" />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Tab bar */}
      <nav aria-label="Main navigation" className="sm:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-surface/95 backdrop-blur pb-safe">
        <ul className="grid grid-cols-6" role="list">
          {coreTabs.map(({ href, label, icon: Icon }) => {
            const active = pathname?.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-label={label}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "tap flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium",
                    active ? "text-foreground" : "text-foreground-muted hover:text-foreground",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "inline-flex h-7 w-10 items-center justify-center rounded-full transition-colors",
                      active ? "bg-accent-soft" : "bg-transparent",
                    )}
                  >
                    <Icon size={17} />
                  </span>
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}

          {/* More button */}
          <li>
            <button
              onClick={() => setMoreOpen((v) => !v)}
              aria-label="More navigation options"
              aria-expanded={moreOpen}
              className={cn(
                "tap w-full flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium",
                moreActive || moreOpen ? "text-foreground" : "text-foreground-muted hover:text-foreground",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "inline-flex h-7 w-10 items-center justify-center rounded-full transition-colors",
                  moreActive || moreOpen ? "bg-accent-soft" : "bg-transparent",
                )}
              >
                <MoreHorizontal size={17} />
              </span>
              <span>More</span>
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}

export function DesktopNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Main navigation" className="hidden sm:flex items-center gap-1">
      {allTabs.map(({ href, label, icon: Icon }) => {
        const active = pathname?.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info",
              active
                ? "bg-surface-muted text-foreground"
                : "text-foreground-muted hover:text-foreground hover:bg-surface-muted",
            )}
          >
            <Icon size={16} aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
