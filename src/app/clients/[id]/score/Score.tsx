"use client";
import Link from "next/link";
import { useState } from "react";
import { departments, tasks } from "@/lib/data";
import { useStore } from "@/lib/store";
import type { Health } from "@/lib/types";
import { healthLabel } from "@/lib/format";
import { Icon } from "@/components/Icon";
import { CrewChip, Due, Progress, StatusBadge, StatusIcon, CardHead } from "@/components/ui";

const BLOCKER: Record<string, string> = { client: "Waiting on", you: "Waiting on you", task: "Depends on", access: "Needs" };

interface Row {
  key: string;
  title: string;
  dept: string;
  owner: string;
  health: Health | "eyes";
  pct?: number;
  due: string | null;
  blocker?: string;
  action: string;
  href?: string;
}

export function Score({ clientId }: { clientId: string }) {
  const { items } = useStore();
  const [view, setView] = useState<"dept" | "status">("dept");
  const [show, setShow] = useState({ icons: true, progress: true, due: true, blockers: true });
  const depts = departments.filter((d) => d.clientId === clientId);
  const clientItems = items.filter((i) => i.clientId === clientId && i.state === "needs");

  const rows: Row[] = [
    ...clientItems.map((i) => ({ key: i.id, title: i.title, dept: i.dept, owner: `${i.skill} ${i.version}`, health: "eyes" as const, due: i.due, blocker: "Waiting on you", action: "Review", href: `/signoff/${i.id}` })),
    ...tasks.filter((t) => t.clientId === clientId).map((t) => ({
      key: t.id, title: t.title, dept: t.dept, owner: t.owner, health: t.health, pct: t.pct, due: t.due,
      blocker: t.blocker ? `${BLOCKER[t.blocker.kind]} ${t.blocker.label}` : undefined,
      action: t.blocker?.kind === "client" ? "Nudge" : t.ownerKind === "gap" ? "Assign" : t.health === "bad" ? "Unblock" : "Open",
    })),
  ];
  const lanes: { key: Row["health"]; name: string }[] = [
    { key: "bad", name: "Off track" },
    { key: "eyes", name: "Needs your eyes" },
    { key: "warn", name: "Watch" },
    { key: "good", name: "On track" },
    { key: "none", name: "Not started" },
  ];

  if (depts.length === 0) {
    return (
      <section className="card empty">
        <Icon name="grid" size={28} />
        <h3>The Score isn&apos;t set up for this client yet</h3>
        <p>Assign skills, apps and people to each department to see status at a glance.</p>
        <p className="xs">In this prototype, Pentara has a full Score.</p>
        <Link href="/clients/pentara" className="btn">See Pentara&apos;s Score</Link>
      </section>
    );
  }

  return (
    <>
      <div className="pagehead">
        <div className="seg" role="group" aria-label="View">
          <button aria-pressed={view === "dept"} onClick={() => setView("dept")}>By department</button>
          <button aria-pressed={view === "status"} onClick={() => setView("status")}>By status</button>
        </div>
        {view === "status" && (
          <fieldset className="card" style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center", padding: "8px 14px", margin: 0 }}>
            <legend style={{ position: "absolute", left: -9999 }}>Display</legend>
            <span style={{ fontWeight: 600 }}>Display</span>
            {(["icons", "progress", "due", "blockers"] as const).map((k) => (
              <label key={k} style={{ display: "flex", gap: 6, alignItems: "center", cursor: "pointer" }}>
                <input type="checkbox" checked={show[k]} onChange={() => setShow((s) => ({ ...s, [k]: !s[k] }))} />
                {{ icons: "Status icons", progress: "Progress", due: "Due dates", blockers: "Roadblocks" }[k]}
              </label>
            ))}
          </fieldset>
        )}
      </div>

      {view === "dept" ? (
        <section className="grid-auto" aria-label="Departments">
          {depts.map((d) => {
            const eyes = clientItems.filter((i) => i.dept === d.name).length;
            return (
              <article key={d.id} className="card fade" style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10, borderWidth: d.health === "bad" || d.health === "warn" ? 2 : 1, borderColor: d.health === "bad" ? "var(--bad-dot)" : d.health === "warn" ? "var(--warn-dot)" : "var(--border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                  <h3 style={{ margin: 0, fontSize: 15 }}>{d.name}</h3>
                  <StatusBadge health={d.health} label={d.health === "none" ? "Unstaffed" : healthLabel[d.health]} />
                </div>
                <div className="muted small">{d.scope}</div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{d.crew.map((c) => <CrewChip key={c.label} crew={c} />)}</div>
                <div style={{ borderTop: "1px solid var(--divider)", paddingTop: 10, display: "flex", flexDirection: "column", gap: 4 }} className="small">
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><span className="muted">{d.metricLabel}</span><strong>{d.metric}</strong></div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><span className="muted">Next</span><span style={{ textAlign: "right" }}>{d.next}</span></div>
                </div>
                {eyes > 0 && (
                  <Link href="/signoff" className="note" style={{ background: "var(--eyes-bg)", color: "var(--eyes-fg)" }}>
                    <Icon name="eye" size={16} />{eyes} {eyes === 1 ? "item needs" : "items need"} your eyes
                  </Link>
                )}
              </article>
            );
          })}
        </section>
      ) : (
        <>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {lanes.map((l) => {
              const n = rows.filter((r) => r.health === l.key).length;
              const cls = { bad: "b-bad", eyes: "b-eyes", warn: "b-warn", good: "b-good", none: "b-neutral" }[l.key];
              return n ? <span key={l.key} className={`badge ${cls}`}>{n} {l.name}</span> : null;
            })}
          </div>
          {lanes.map((l) => {
            const laneRows = rows.filter((r) => r.health === l.key).sort((a, b) => (a.due ?? "9") < (b.due ?? "9") ? -1 : 1);
            if (!laneRows.length) return null;
            return (
              <section key={l.key} className="card scroll-x fade" aria-label={l.name}>
                <CardHead title={l.name} count={laneRows.length} />
                {laneRows.map((r) => (
                  <div className="row" key={r.key} style={{ flexWrap: "wrap" }}>
                    {show.icons && (r.health === "eyes" ? <span style={{ color: "var(--eyes-fg)", display: "inline-flex" }}><Icon name="eye" /></span> : <StatusIcon health={r.health} />)}
                    <span className="grow" style={{ flexBasis: 220 }}><span style={{ fontWeight: 600 }}>{r.title}</span><br /><span className="muted small">{r.dept} · {r.owner}</span></span>
                    {show.blockers && r.blocker && <span className="chip" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>{r.blocker}</span>}
                    {show.progress && r.pct !== undefined && <Progress pct={r.pct} health={r.health === "eyes" ? "warn" : r.health} />}
                    {show.due && <Due iso={r.due} />}
                    {r.href ? <Link href={r.href} className="btn btn-primary" style={{ minHeight: 36 }}>{r.action}</Link> : <button className="btn" style={{ minHeight: 36 }}>{r.action}</button>}
                  </div>
                ))}
              </section>
            );
          })}
        </>
      )}
    </>
  );
}
