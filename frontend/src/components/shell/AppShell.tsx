"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useAgentData } from "@/hooks/useAgentData";
import { Icon } from "@/components/ui";

const nav = [{ href: "/", label: "Overview", icon: "overview" }, { href: "/agents", label: "Agents", icon: "agents" }, { href: "/lineage", label: "Lineage", icon: "lineage" }, { href: "/alerts", label: "Alerts", icon: "alerts" }, { href: "/costs", label: "Costs", icon: "costs" }, { href: "/events", label: "Event Explorer", icon: "events" }, { href: "/settings", label: "Settings", icon: "settings" }];
const titles: Record<string, [string, string]> = { "/": ["Overview", "System health and multi-agent execution"], "/agents": ["Agents", "Registry derived from observed telemetry"], "/lineage": ["Agent Lineage", "Observed agent and tool relationships"], "/alerts": ["Anomaly Alerts", "Detector findings and related evidence"], "/costs": ["Cost Analytics", "Token and spend attribution"], "/events": ["Event Explorer", "Search and inspect canonical telemetry"], "/settings": ["Settings", "Collector and data-mode configuration"] };

export function AppShell({ children }: { children: ReactNode }) { const pathname = usePathname(); const [mobileOpen, setMobileOpen] = useState(false); const data = useAgentData(); const [title, subtitle] = titles[pathname] ?? ["AgentGuard Core", "Agent control tower"];
  return <div className="app-shell">
    <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}><div className="brand"><div className="brand-mark"><span/></div><div><strong>AgentGuard</strong><small>CONTROL TOWER</small></div></div><nav aria-label="Primary navigation">{nav.map((item) => { const active = pathname === item.href; return <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={active ? "nav-link active" : "nav-link"} aria-current={active ? "page" : undefined}><Icon name={item.icon}/><span>{item.label}</span></Link>; })}</nav><div className="sidebar-foot"><span className="eyebrow">OPEN SOURCE MVP</span><p>Telemetry without guesswork.</p><code>v0.1.0</code></div></aside>
    {mobileOpen && <button className="sidebar-scrim" onClick={() => setMobileOpen(false)} aria-label="Close navigation"/>}
    <div className="app-main"><header className="topbar"><div className="topbar-title"><button className="icon-button mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open navigation" aria-expanded={mobileOpen}><Icon name="menu"/></button><div><h1>{title}</h1><p>{subtitle}</p></div></div><div className="topbar-actions"><div className="mode-switch" aria-label="Data mode"><button className={data.mode === "live" ? "selected" : ""} onClick={() => data.setMode("live")}>Live</button><button className={data.mode === "demo" ? "selected" : ""} onClick={() => data.setMode("demo")}>Demo</button></div><div className={`connection connection-${data.connection}`}><span/>{data.connection === "demo" ? "DEMO — Synthetic Data" : data.connection}</div><div className="last-updated"><span>Last updated</span><strong>{data.lastUpdated ? new Date(data.lastUpdated).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "Never"}</strong></div><button className="icon-button" onClick={data.refresh} aria-label="Refresh data" disabled={data.loading}><Icon name="refresh" className={data.loading ? "h-4 w-4 spin" : "h-4 w-4"}/></button></div></header>
      {data.mode === "demo" && <div className="demo-banner"><strong>DEMO — Synthetic Data</strong><span>Offline, deterministic scenario. Incidents shown here are not collector findings.</span></div>}
      {data.error && <div className="error-banner"><Icon name="info"/><span>{data.error}</span></div>}
      <main className="page-content">{children}</main>
    </div>
  </div>;
}

