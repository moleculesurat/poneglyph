import type { Metadata } from "next";
import { Aleo, Host_Grotesk, Azeret_Mono } from "next/font/google";
import "./globals.css";
import { PersonaProvider } from "@/components/persona";
import { ToastProvider } from "@/components/toast";
import { AppShell } from "@/components/AppShell";

const aleo = Aleo({
  variable: "--font-aleo",
  subsets: ["latin"],
  weight: ["300"],
  style: ["normal", "italic"],
});

const host = Host_Grotesk({
  variable: "--font-host",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const azeret = Azeret_Mono({
  variable: "--font-azeret",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Poneglyph — Agentic Compliance Sandbox",
  description:
    "From regulatory text to operational action. A Walrus Securitas sandbox for SEBI TechSprint PS2 — simulated data, real architecture.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${aleo.variable} ${host.variable} ${azeret.variable}`}>
      <body>
        <div className="wash" />
        <div className="dotgrid" />
        <PersonaProvider>
          <ToastProvider>
            <AppShell>{children}</AppShell>
          </ToastProvider>
        </PersonaProvider>
        <div className="grain" />
      </body>
    </html>
  );
}
