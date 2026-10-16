"use client";

interface EdgeTooltipProps {
  label?: string;
  eventCount: number;
}

export default function EdgeTooltip({ label, eventCount }: EdgeTooltipProps) {
  return (
    <div className="bg-[#111118] border border-[#1e1e2e] rounded px-2 py-1 text-xs text-slate-300">
      <span className="font-mono text-indigo-400">{label}</span>
      <span className="ml-2 text-slate-500">({eventCount} events)</span>
    </div>
  );
}
