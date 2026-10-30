"use client";
import { use, useEffect, useState } from "react";
import { TODAY } from "@/lib/data";
import { TaskPopover, anchorOf, type Anchor } from "@/components/TaskPopover";
import { useStore } from "@/lib/store";
import { SnoozeButton, wakeLabel } from "@/components/Snooze";
import { dragInto1on1 } from "@/lib/agenda";
import { useAddToAgenda } from "@/components/OneOnOne";
import type { CrewKind } from "@/lib/types";
import { Due, Progress, StatusBadge, CardHead } from "@/components/ui";
import { Icon } from "@/components/Icon";

export default function Tasks({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [owners, setOwners] = useState<string[]>(["BCW", "Client", "PR contractor", "rf-copy", "rf-positioning", "rf-content"]);
  const [adding, setAdding] = useState<string | null>(null);
  const [newOwner, setNewOwner] = useState("");
  const { snoozed, snooze, tasks, editTask } = useStore();
  const [pop, setPop] = useState<{ id: string; anchor: Anchor } | null>(null);
  // Arriving from search (?task=…): open that task's settings next to it.
  useEffect(() => {
    const want = new URLSearchParams(window.location.search).get("task");
    if (!want) return;
    const t = setTimeout(() => {
      const el = document.querySelector(`[data-task="${want}"]`);
      if (el) { el.scrollIntoView({ block: "center" }); setPop({ id: want, anchor: anchorOf(el) }); }
    }, 50);
    return () => clearTimeout(t);
  }, []);
  const addToAgenda = useAddToAgenda();
  const [added, setAdded] = useState<string[]>([]);
  // Includes tasks sent back from a 1:1; edits made anywhere show here.
  const all = tasks.filter((t) => t.clientId === id);
  const [showSnoozed, setShowSnoozed] = useState(false);
  const isAsleep = (tid: string) => !!snoozed[tid] && snoozed[tid] > TODAY;
  const asleep = all.filter((t) => isAsleep(t.id));
  const visible = all.filter((t) => !isAsleep(t.id));

  const setOwner = (taskId: string, owner: string) => {
    if (owner === "__new") return setAdding(taskId);
    const kind: CrewKind = owner.startsWith("rf-") ? "skill" : "person";
    editTask(taskId, { owner, ownerKind: kind });
  };
  const saveOwner = () => {
    if (!adding || !newOwner.trim()) return setAdding(null);
    setOwners((o) => [...o, newOwner.trim()]);
    editTask(adding, { owner: newOwner.trim(), ownerKind: "person" });
    setAdding(null);
    setNewOwner("");
  };

  return (
    <section className="card scroll-x">
      <CardHead icon="tasks" title="Tasks" count={visible.length} sub="Click a task to adjust it">
        {asleep.length > 0 && <button className="btn" style={{ minHeight: 32 }} aria-pressed={showSnoozed} onClick={() => setShowSnoozed((v) => !v)}><Icon name="clock" size={15} />Snoozed · {asleep.length}</button>}
      </CardHead>
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
      {all.length === 0 ? (
        <div className="empty"><h3>No tasks yet</h3><p>Start a project from a template to create them.</p></div>
      ) : (
        <table className="tbl" style={{ minWidth: 760 }}>
          <thead><tr><th>Task</th><th>Status</th><th>Owner</th><th>Due</th><th>Progress</th><th>Roadblock</th><th><span style={{ position: "absolute", left: -9999 }}>Snooze</span></th></tr></thead>
          <tbody>
            {visible.map((t) => (
              <tr key={t.id} {...dragInto1on1({ kind: "task", title: t.title, href: `/clients/${id}/tasks`, refId: t.id, clientId: id })}>
                <td>
                  <button className="title-btn" data-task={t.id} aria-haspopup="dialog" onClick={(e) => setPop({ id: t.id, anchor: anchorOf(e.currentTarget) })}>{t.title}</button>
                  {t.promised && <span className="badge b-info" style={{ marginLeft: 6 }}>Promised to {t.promised.to}</span>}
                  <br /><span className="muted small">{t.dept}</span>
                </td>
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
                <td style={{ whiteSpace: "nowrap" }}>
                  <button className="btn" style={{ minHeight: 32, padding: "0 8px", marginRight: 4 }} aria-label={`Add ${t.title} to the next 1:1`} title="Add to next 1:1"
                    disabled={added.includes(t.id)} onClick={() => { addToAgenda(id, { title: t.title, kind: "task", href: `/clients/${id}/tasks`, refId: t.id }); setAdded((a) => [...a, t.id]); }}>
                    {added.includes(t.id) ? "On 1:1" : "1:1"}
                  </button>
                  <SnoozeButton label={t.title} compact onSnooze={(until) => snooze(t.id, until)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {pop && <TaskPopover taskId={pop.id} anchor={pop.anchor} onClose={() => setPop(null)} />}
    </section>
  );
}
