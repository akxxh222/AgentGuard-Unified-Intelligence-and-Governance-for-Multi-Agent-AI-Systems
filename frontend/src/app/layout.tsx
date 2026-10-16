import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { AgentDataProvider } from "@/hooks/useAgentData";
import { AppShell } from "@/components/shell/AppShell";
import "./globals.css";
const inter = Inter({ subsets: ["latin"], variable: "--font-sans" }); const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });
export const metadata: Metadata = { title: { default: "AgentGuard Core", template: "%s · AgentGuard Core" }, description: "Multi-agent telemetry, anomaly detection, and cost observability" };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="en" className={`${inter.variable} ${mono.variable}`}><body><AgentDataProvider><AppShell>{children}</AppShell></AgentDataProvider></body></html>; }
