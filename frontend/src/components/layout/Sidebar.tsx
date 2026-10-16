"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Bot,
  GitBranch,
  ShieldAlert,
  Coins,
  FileCheck2,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/badge";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeVariant?: "default" | "running" | "alert" | "escalating";
}

const navItems: NavItem[] = [
  {
    label: "Control Tower",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Agents",
    href: "/agents/demo-agent",
    icon: Bot,
  },
  {
    label: "Live Traces & DAG",
    href: "/traces",
    icon: GitBranch,
  },
  {
    label: "Escalations",
    href: "/escalations",
    icon: ShieldAlert,
    badge: "1",
    badgeVariant: "escalating",
  },
  {
    label: "Cost Attribution",
    href: "/costs",
    icon: Coins,
  },
  {
    label: "Audit Log & Replay",
    href: "/audit",
    icon: FileCheck2,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 border-r border-zinc-800/80 bg-zinc-950/80 flex flex-col backdrop-blur-sm select-none">
      {/* Brand Header */}
      <div className="h-14 border-b border-zinc-800/80 flex items-center px-4 gap-3">
        <div className="w-8 h-8 rounded-md bg-zinc-900 border border-zinc-700/80 flex items-center justify-center text-emerald-400 font-mono text-xs font-bold shadow-inner">
          <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-mono font-semibold tracking-wider text-zinc-100 uppercase">
            Agent Control Tower
          </span>
          <span className="text-[10px] text-zinc-500 font-mono tracking-tight">
            ACT v1.0 • Techgium PS6
          </span>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="p-3 space-y-6 flex-1 overflow-y-auto">
        <div>
          <div className="px-2 mb-2 text-[10px] font-mono font-medium tracking-wider text-zinc-400 uppercase">
            Operations Center
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between px-2.5 py-2 rounded-md text-xs font-medium transition-all group",
                    isActive
                      ? "bg-zinc-800/90 text-zinc-100 font-semibold shadow-sm border border-zinc-700/60"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={cn(
                        "w-4 h-4 transition-colors",
                        isActive
                          ? "text-emerald-400"
                          : "text-zinc-500 group-hover:text-zinc-300"
                      )}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <Badge
                      variant={item.badgeVariant ?? "default"}
                      className="text-[10px] h-4 px-1.5 font-mono"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Framework Integrations */}
        <div className="pt-2 border-t border-zinc-800/60">
          <div className="px-2 mb-2 text-[10px] font-mono font-medium tracking-wider text-zinc-400 uppercase">
            Monitored Frameworks
          </div>
          <div className="px-2 space-y-1.5 font-mono text-[11px]">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-framework-langchain inline-block" />
                LangChain
              </span>
              <span className="text-zinc-400 text-[10px]">v0.2</span>
            </div>
            <div className="flex items-center justify-between text-zinc-400">
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-framework-autogen inline-block" />
                AutoGen
              </span>
              <span className="text-zinc-400 text-[10px]">v0.4</span>
            </div>
            <div className="flex items-center justify-between text-zinc-400">
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-framework-crewai inline-block" />
                CrewAI
              </span>
              <span className="text-zinc-400 text-[10px]">v0.51</span>
            </div>
          </div>
        </div>
      </div>

      {/* Telemetry Footer */}
      <div className="p-3 border-t border-zinc-800/80 bg-zinc-950/60 text-[11px] font-mono text-zinc-400 space-y-1">
        <div className="flex items-center justify-between">
          <span>PIPELINE</span>
          <span className="text-emerald-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
            SYNCHRONIZED
          </span>
        </div>
        <div className="flex items-center justify-between text-[10px] text-zinc-400">
          <span>LATENCY</span>
          <span className="tabular-nums">14 ms</span>
        </div>
      </div>
    </aside>
  );
}
