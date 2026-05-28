"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Receipt, Repeat, Target, Map, Landmark } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/today", label: "Today", icon: Home },
  { href: "/bills", label: "Bills", icon: Receipt },
  { href: "/subscriptions", label: "Subs", icon: Repeat },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/money-map", label: "Map", icon: Map },
  { href: "/accounts", label: "Accounts", icon: Landmark },
];

export function MobileTabBar() {
  const pathname = usePathname();
  return (
    <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-surface/95 backdrop-blur pb-safe">
      <ul className="grid grid-cols-6">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname?.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "tap flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium",
                  active
                    ? "text-foreground"
                    : "text-foreground-muted hover:text-foreground",
                )}
              >
                <span
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
      </ul>
    </nav>
  );
}

export function DesktopNav() {
  const pathname = usePathname();
  return (
    <nav className="hidden sm:flex items-center gap-1">
      {tabs.map(({ href, label, icon: Icon }) => {
        const active = pathname?.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium",
              active
                ? "bg-surface-muted text-foreground"
                : "text-foreground-muted hover:text-foreground hover:bg-surface-muted",
            )}
          >
            <Icon size={16} />
            {label === "Subs"
              ? "Subscriptions"
              : label === "Map"
                ? "Money Map"
                : label}
          </Link>
        );
      })}
    </nav>
  );
}
