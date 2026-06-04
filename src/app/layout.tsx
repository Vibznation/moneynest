import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { ThemeScript } from "@/components/theme/ThemeScript";
import { Providers } from "@/components/Providers";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";
import { ConsentBanner } from "@/components/ConsentBanner";
import { PWAInstallBanner } from "@/components/PWAInstallBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Dueviq — Simple Money Organizer",
    template: "%s — Dueviq",
  },
  description:
    "Know what's due. Know what's safe to spend. Organize your bills, subscriptions, goals, and accounts in one calm place.",
  applicationName: "Dueviq",
  keywords: ["bills", "budget", "subscriptions", "savings goals", "personal finance", "money organizer"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#102A43" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

        <link rel="apple-touch-icon" href="/icon-512.png" />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ServiceWorkerRegistrar />
        <Providers>{children}</Providers>
        <PWAInstallBanner />
        <ConsentBanner />
      </body>
    </html>
  );
}
