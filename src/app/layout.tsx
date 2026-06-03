import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { ThemeScript } from "@/components/theme/ThemeScript";
import { Providers } from "@/components/Providers";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";
import { ConsentBanner } from "@/components/ConsentBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MoneyNest — Financial peace, organized",
  description:
    "Organize your bills, subscriptions, goals, and spending in one peaceful place.",
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
        <meta name="theme-color" content="#5b7f5e" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icon.svg" />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ServiceWorkerRegistrar />
        <Providers>{children}</Providers>
        <ConsentBanner />
      </body>
    </html>
  );
}
