"use client";
import { use, useState } from "react";
import { notFound } from "next/navigation";
import { departments, getClient, tasks } from "@/lib/data";
import { healthLabel } from "@/lib/format";
import { useStore } from "@/lib/store";
import { minutesLabel } from "@/lib/format";
import { pace, useTimeData, weekTotals, WEEKLY_TARGET_HOURS } from "@/lib/time";
import { Icon } from "@/components/Icon";
import { Progress, StatusBadge, ClientTile } from "@/components/ui";

const PACE_NOTE: Record<string, string> = {
  under: `Below the ${WEEKLY_TARGET_HOURS.min}–${WEEKLY_TARGET_HOURS.max}h conductor budget. Either the week was light or time went untracked.`,
  on: `Inside the ${WEEKLY_TARGET_HOURS.min}–${WEEKLY_TARGET_HOURS.max}h conductor budget this account is priced on.`,
  over: `Above the ${WEEKLY_TARGET_HOURS.min}–${WEEKLY_TARGET_HOURS.max}h budget. Worth knowing why before it becomes the norm.`,
  none: "No time tracked against this client this week.",
};

export default function Report({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const client = getClient(id);
  const { items, projects } = useStore();
  const { sessions } = useTimeData();
  const [reviewed, setReviewed] = useState(false);
  if (!client) notFound();
  const week = weekTotals(sessions)[id];
  const minutes = Math.round((week?.ms ?? 0) / 60000);
  const verdict = pace(minutes);
  const byProject = Object.entries(week?.byProject ?? {}).sort((a, b) => b[1] - a[1]);
  const depts = departments.filter((d) => d.clientId === id);
  const flagged = depts.filter((d) => d.health === "bad" || d.health === "warn");
  const shipped = items.filter((i) => i.clientId === id && (i.state === "approved" || i.state === "approved-changes"));
  const decisions = tasks.filter((t) => t.clientId === id && t.blocker?.kind !== "task" && (t.health === "bad" || t.health === "warn")).slice(0, 3);

  return (
    <div style={{ maxWidth: 820, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        {reviewed ? (
          <span className="badge b-good"><Icon name="eyecheck" size={14} />Reviewed by BCW · ready to share</span>
        ) : (
          <span className="badge b-eyes"><Icon name="eye" size={14} />Draft · needs your eyes before sharing</span>
        )}
        <button className="btn btn-primary" onClick={() => setReviewed(true)} disabled={reviewed}>{reviewed ? "Shared link copied" : "Reviewed · share with CEO"}</button>
      </div>

      {/* Your margin check. Not part of what the CEO sees. */}
      <div
        className="card small"
        style={{ padding: "10px 14px", display: "flex", gap: 10, alignItems: "baseline", flexWrap: "wrap" }}
      >
        <span className="muted">For you only</span>
        <strong>{minutes > 0 ? minutesLabel(minutes) : "No time tracked"}</strong>
        {verdict !== "none" && (
          <span className={`badge ${verdict === "over" ? "b-warn" : verdict === "under" ? "b-eyes" : "b-good"}`}>
            {verdict === "over" ? "Over budget" : verdict === "under" ? "Under budget" : "On budget"}
          </span>
        )}
        <span className="muted" style={{ flexBasis: "100%" }}>{PACE_NOTE[verdict]}</span>
      </div>

      <article className="card" style={{ overflow: "hidden" }}>
        <header style={{ background: "var(--surface-2)", borderTop: `4px solid ${client.color}`, padding: "18px 24px", display: "flex", gap: 14, alignItems: "center" }}>
          <ClientTile client={client} size={40} />
          <div>
            <div className="small muted">Weekly update · week of Oct 26</div>
            <h2 style={{ margin: "2px 0 0", fontSize: 22 }}>How things are going at {client.name}</h2>
          </div>
        </header>
        <section className="row" style={{ alignItems: "flex-start", padding: "18px 24px" }}>
          <StatusBadge health={client.health} />
          <p style={{ margin: 0, lineHeight: 1.6 }}>{client.summary}</p>
        </section>
        {depts.length > 0 && (
          <section style={{ padding: "16px 24px", borderTop: "1px solid var(--divider)" }}>
            <h3 className="muted" style={{ margin: "0 0 10px", fontSize: 13 }}>By department</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8 }}>
              {depts.map((d) => <span key={d.id} className="small" style={{ display: "flex", gap: 8, alignItems: "center" }}><StatusBadge health={d.health} label={d.name} /></span>)}
            </div>
            {flagged.length > 0 && (
              <ul style={{ margin: "12px 0 0", paddingLeft: 18, lineHeight: 1.6 }}>
                {flagged.map((d) => <li key={d.id}><strong>{d.name}</strong> ({healthLabel[d.health].toLowerCase()}): {d.next}.</li>)}
              </ul>
            )}
          </section>
        )}
        <section style={{ padding: "16px 24px", borderTop: "1px solid var(--divider)" }}>
          <h3 className="muted" style={{ margin: "0 0 10px", fontSize: 13 }}>Your spotlight projects</h3>
          {client.spotlight.map((s, i) => (
            <div key={s} style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 12, marginBottom: 8, display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
              <strong>{s}</strong>
              <Progress pct={i === 0 ? 60 : 15} health={i === 0 ? "good" : "warn"} />
              <div className="muted small" style={{ flexBasis: "100%" }}>[Detail for this CEO: what happened this week, next milestone and date]</div>
            </div>
          ))}
        </section>
        <section style={{ padding: "16px 24px", borderTop: "1px solid var(--divider)" }}>
          <h3 className="muted" style={{ margin: "0 0 10px", fontSize: 13 }}>What went out this week, reviewed by BCW</h3>
          {shipped.length === 0 ? <p className="muted small" style={{ margin: 0 }}>Items you approve this week appear here, so the CEO sees the human review.</p> : (
            <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>{shipped.map((i) => <li key={i.id}>{i.title} <span className="muted">· {i.channel}</span></li>)}</ul>
          )}
        </section>
        <section style={{ padding: "16px 24px", borderTop: "1px solid var(--divider)" }}>
          <h3 className="muted" style={{ margin: "0 0 10px", fontSize: 13 }}>Where your time went</h3>
          {minutes === 0 ? (
            <p className="muted small" style={{ margin: 0 }}>
              No time tracked against {client.name} this week. Start a timer from a task and it lands here.
            </p>
          ) : (
            <>
              <p style={{ margin: "0 0 10px", lineHeight: 1.6 }}>
                <strong>{minutesLabel(minutes)}</strong> of senior marketing attention, across {week?.sessions ?? 0}{" "}
                {week?.sessions === 1 ? "session" : "sessions"}.
              </p>
              {byProject.length > 0 && (
                <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
                  {byProject.map(([pid, ms]) => (
                    <li key={pid || "none"}>
                      {projects.find((p) => p.id === pid)?.name ?? "General account work"}
                      <span className="muted"> · {minutesLabel(Math.round(ms / 60000))}</span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </section>

        <section style={{ padding: "16px 24px 22px", borderTop: "1px solid var(--divider)" }}>
          <h3 className="muted" style={{ margin: "0 0 10px", fontSize: 13 }}>Decisions needed from you</h3>
          {decisions.length === 0 ? <p className="muted small" style={{ margin: 0 }}>None this week.</p> : (
            <ol style={{ margin: 0, paddingLeft: 20, lineHeight: 1.7 }}>{decisions.map((t) => <li key={t.id}><strong>{t.title}</strong> <span className="muted">· {t.blocker?.label ?? "your call"}</span></li>)}</ol>
          )}
        </section>
      </article>
    </div>
  );
}
