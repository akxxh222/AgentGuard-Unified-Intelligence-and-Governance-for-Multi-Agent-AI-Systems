"use client";
import { useEffect, useMemo, useState } from "react";
import { EventDrawer } from "@/components/details";
import { EmptyState, FrameworkBadge, SearchInput, StatusBadge } from "@/components/ui";
import { useAgentData } from "@/hooks/useAgentData";
import { formatUsd, safeTime } from "@/lib/derive";
import type { AgentEvent } from "@/lib/types";

export default function EventsPage() {
  const { events } = useAgentData(); const [query, setQuery] = useState("");
  const [framework, setFramework] = useState("all"); const [type, setType] = useState("all");
  const [status, setStatus] = useState("all"); const [order, setOrder] = useState("desc");
  const [selected, setSelected] = useState<AgentEvent | null>(null);
  useEffect(() => { const params = new URLSearchParams(window.location.search); setQuery(params.get("trace") ?? params.get("agent") ?? ""); }, []);
  const types = [...new Set(events.map((event) => event.event_type))];
  const visible = useMemo(() => events.filter((event) =>
    (framework === "all" || event.framework === framework) && (type === "all" || event.event_type === type) &&
    (status === "all" || event.status === status) && `${event.agent_id} ${event.task_id} ${event.trace_id}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => (Date.parse(a.timestamp) - Date.parse(b.timestamp)) * (order === "asc" ? 1 : -1)).slice(0, 250), [events, framework, type, status, query, order]);
  return <><div className="page-intro"><p>Canonical telemetry is rendered as text only; payload values are never interpreted as HTML.</p><span className="eyebrow">LOCAL LIMIT 250 EVENTS</span></div>
    <div className="filters"><SearchInput value={query} onChange={setQuery} placeholder="Search agent, task, or trace"/><select className="select" value={framework} onChange={(e) => setFramework(e.target.value)} aria-label="Filter framework"><option value="all">All frameworks</option><option>langchain</option><option>autogen</option><option>crewai</option></select><select className="select" value={type} onChange={(e) => setType(e.target.value)} aria-label="Filter event type"><option value="all">All event types</option>{types.map((item) => <option key={item}>{item}</option>)}</select><select className="select" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter status"><option value="all">All statuses</option><option>running</option><option>success</option><option>failed</option></select><button className="button button-secondary" onClick={() => setOrder((value) => value === "desc" ? "asc" : "desc")}>Time: {order === "desc" ? "newest" : "oldest"}</button></div>
    <div className="panel table-wrap">{visible.length ? <table className="data-table"><thead><tr><th>Timestamp</th><th>Agent</th><th>Framework</th><th>Event type</th><th>Status</th><th>Tokens in / out</th><th>Cost</th><th>Trace ID</th></tr></thead><tbody>{visible.map((event) => <tr key={event.event_id} onClick={() => setSelected(event)} tabIndex={0} onKeyDown={(e) => e.key === "Enter" && setSelected(event)}><td>{safeTime(event.timestamp)}</td><td className="primary-cell mono">{event.agent_id}<span className="secondary">{event.task_id}</span></td><td><FrameworkBadge framework={event.framework}/></td><td>{event.event_type}</td><td><StatusBadge status={event.status}/></td><td>{event.tokens_in.toLocaleString()} / {event.tokens_out.toLocaleString()}</td><td>{formatUsd(event.cost_usd)}</td><td className="mono">{event.trace_id.slice(0, 14)}…</td></tr>)}</tbody></table> : <EmptyState title="No matching events" detail="Clear filters or verify that GET /events is available."/>}</div>
    <EventDrawer event={selected} onClose={() => setSelected(null)}/></>;
}
