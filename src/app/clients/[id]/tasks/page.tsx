"use client";
import { use, useState } from "react";
import { tasks as seed, TODAY } from "@/lib/data";
import { useStore } from "@/lib/store";
import { SnoozeButton, wakeLabel } from "@/components/Snooze";
import type { CrewKind } from "@/lib/types";
import { Due, Progress, StatusBadge } from "@/components/ui";
import { Icon } from "@/components/Icon";

export default function Tasks({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [rows, setRows] = useState(seed.filter((t) => t.clientId === id));
  const [owners, setOwners] = useState<string[]>(["BCW", "Client", "PR contractor", "rf-copy", "rf-positioning", "rf-content"]);
  const [adding, setAdding] = useState<string | null>(null);
  const [newOwner, setNewOwner] = useState("");
  const { snoozed, snooze } = useStore();
  const [showSnoozed, setShowSnoozed] = useState(false);
  const isAsleep = (tid: string) => !!snoozed[tid] && snoozed[tid] > TODAY;
  const asleep = rows.filter((t) => isAsleep(t.id));
  const visible = rows.filter((t) => !isAsleep(t.id));

  const setOwner = (taskId: string, owner: string) => {
    if (owner === "__new") return setAdding(taskId);
    const kind: CrewKind = owner.startsWith("rf-") ? "skill" : "person";
    setRows((r) => r.map((t) => (t.id === taskId ? { ...t, owner, ownerKind: kind } : t)));
  };
  const saveOwner = () => {
    if (!adding || !newOwner.trim()) return setAdding(null);
    setOwners((o) => [...o, newOwner.trim()]);
    setRows((r) => r.map((t) => (t.id === adding ? { ...t, owner: newOwner.trim(), ownerKind: "person" } : t)));
    setAdding(null);
    setNewOwner("");
  };

  return (
    <section className="card scroll-x">
      <div className="card-head">
        <h2>Tasks</h2>
        <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span className="muted small hide-mobile">Change an owner inline, or snooze until it matters</span>
          {asleep.length > 0 && <button className="btn" style={{ minHeight: 32 }} aria-pressed={showSnoozed} onClick={() => setShowSnoozed((v) => !v)}><Icon name="clock" size={15} />Snoozed · {asleep.length}</button>}
        </span>
      </div>
      {showSnoozed && asleep.length > 0 && (
        <div style={{ background: "var(--surface-2)" }}>
          {asleep.map((t) => (
            <div key={t.id} className="row small" style={{ gap: 10 }}>
              <Icon name="clock" size={15} />
              <span className="grow"><strong>{t.title}</strong> <span className="muted">· back {wakeLabel(snoozed[t.id])}</span></span>
              <button className="btn" style={{ minHeight: 30 }} onClick={() => snooze(t.id, null)}>Wake now</button>
            </div>
          ))}
        </div>
      )}
      {rows.length === 0 ? (
        <div className="empty"><h3>No tasks yet</h3><p>Start a project from a template to create them.</p></div>
      ) : (
        <table className="tbl" style={{ minWidth: 760 }}>
          <thead><tr><th>Task</th><th>Status</th><th>Owner</th><th>Due</th><th>Progress</th><th>Roadblock</th><th><span style={{ position: "absolute", left: -9999 }}>Snooze</span></th></tr></thead>
          <tbody>
            {visible.map((t) => (
              <tr key={t.id}>
                <td><strong>{t.title}</strong><br /><span className="muted small">{t.dept}</span></td>
                <td><StatusBadge health={t.health} /></td>
                <td>
                  {adding === t.id ? (
                    <span style={{ display: "flex", gap: 6 }}>
                      <input className="input" autoFocus value={newOwner} onChange={(e) => setNewOwner(e.target.value)} placeholder="Name, organization" aria-label="New owner name" style={{ padding: "6px 8px", minWidth: 150 }} onKeyDown={(e) => e.key === "Enter" && saveOwner()} />
                      <button className="btn" style={{ minHeight: 34 }} onClick={saveOwner}>Add</button>
                    </span>
                  ) : (
                    <select className="input" aria-label={`Owner of ${t.title}`} value={owners.includes(t.owner) ? t.owner : ""} onChange={(e) => setOwner(t.id, e.target.value)} style={{ padding: "6px 8px", minWidth: 150 }}>
                      {!owners.includes(t.owner) && <option value="">{t.owner}</option>}
                      {owners.map((o) => <option key={o} value={o}>{o}</option>)}
                      <option value="__new">+ New owner…</option>
                    </select>
                  )}
                </td>
                <td><Due iso={t.due} /></td>
                <td><Progress pct={t.pct} health={t.health} /></td>
                <td className="small">{t.blocker ? <span className="chip" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}><Icon name={t.blocker.kind === "access" ? "lock" : t.blocker.kind === "task" ? "link" : "user"} size={13} />{t.blocker.label}</span> : <span className="muted">None</span>}</td>
                <td><SnoozeButton label={t.title} compact onSnooze={(until) => snooze(t.id, until)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
