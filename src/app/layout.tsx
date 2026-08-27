import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SessionGuard } from "@/components/SessionGuard";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ARKA KIDS | Preschool Management",
  description: "Centralized preschool operations for branches, admissions, fees, attendance, and parent engagement.",
  icons: {
    icon: "/favicon.ico",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased font-sans bg-background text-foreground`}
        suppressHydrationWarning
      >
        <SessionGuard>
          {children}
        </SessionGuard>
      </body>
    </html>
  );
}
