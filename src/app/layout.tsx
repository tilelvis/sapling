import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { Providers } from "@/components/planner/providers";
import { ServiceWorkerRegister } from "@/components/planner/sw-register";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Forestry Tuition Planner",
  description:
    "A simple 4-year forestry degree tuition & MMF savings planner. Plan your September & April fees, track savings, and stay on track to graduate.",
  keywords: [
    "forestry", "tuition", "planner", "MMF", "money market fund",
    "Kenya", "HELB", "savings", "university", "PWA",
  ],
  authors: [{ name: "Forestry Planner" }],
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Tuition Planner",
  },
  applicationName: "Forestry Tuition Planner",
  openGraph: {
    title: "Forestry Tuition Planner",
    description: "Plan your forestry degree tuition & MMF savings over 4 years.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#2d6a4f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Tuition Planner" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>{children}</Providers>
        <ServiceWorkerRegister />
        <Toaster />
        <SonnerToaster position="top-center" />
      </body>
    </html>
  );
}
