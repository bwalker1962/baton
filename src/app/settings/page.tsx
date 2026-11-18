"use client";
// Settings: Trash (30 days, restore or delete forever) and the activity log.
// © 2026 RidgeFront. All rights reserved.
import Link from "next/link";
import { useEffect, useState } from "react";
import { clients } from "@/lib/data";
import { useStore } from "@/lib/store";
import { daysLeft, KIND_LABEL, keyOf, TRASH_DAYS, type Activity, type TrashEntry } from "@/lib/housekeeping";
import { SelectBox, useSelection } from "@/components/Housekeeping";
import { CardHead } from "@/components/ui";
import { Icon } from "@/components/Icon";

const stamp = (iso: string) => new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

function useClientName() {
  const { spaces } = useStore();
  return (id?: string) => (id ? spaces.find((s) => s.id === id)?.name ?? clients.find((c) => c.id === id)?.name ?? id : "");
}

function TrashCard() {
  const { hk, restore, purge, isGone } = useStore();
  const clientName = useClientName();
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => setNow(Date.now()), []);
  const list = [...hk.trash].sort((a, b) => b.deletedAt.localeCompare(a.deletedAt));
  const sel = useSelection(list.map((t) => t.key));
  const [sure, setSure] = useState<string | null>(null); // a key, or "bulk"
  const parentGone = (t: TrashEntry) => t.kind !== "workspace" && !!t.clientId && isGone("workspace", t.clientId) && hk.trash.some((x) => x.key === keyOf("workspace", t.clientId!));
  const forever = (keys: string[]) => { purge(keys); setSure(null); sel.clear(); };

  return (
    <section className="card" id="trash">
      <CardHead icon="empty" title="Trash" count={list.length} sub={`Kept ${TRASH_DAYS} days, then deleted for good`} />
      {list.length === 0 ? (
        <div className="empty"><h3>Trash is empty</h3><p>Deleted workspaces, projects, tasks, notes, chats and files wait here for {TRASH_DAYS} days.</p></div>
      ) : (
        <>
          <div className="hk-bulk" style={{ background: "transparent" }}>
            <label className="small muted" style={{ display: "flex", gap: 8, alignItems: "center" }}><SelectBox checked={sel.all} onChange={sel.toggleAll} label="Select everything in Trash" />Select all</label>
            {sel.picked.length > 0 && (
              <>
                <strong className="small">{sel.picked.length} selected</strong>
                <button className="btn" onClick={() => { restore(sel.picked); sel.clear(); }}>Restore</button>
                {sure === "bulk"
                  ? <><span className="small">Can&apos;t be undone.</span><button className="btn btn-danger" onClick={() => forever(sel.picked)}>Delete {sel.picked.length} forever</button><button className="btn" onClick={() => setSure(null)}>Keep</button></>
                  : <button className="btn btn-danger" onClick={() => setSure("bulk")}>Delete forever</button>}
              </>
            )}
          </div>
          {list.map((t) => {
            const left = now === null ? TRASH_DAYS : daysLeft(t.deletedAt, now);
            return (
              <div className="row" key={t.key} style={{ flexWrap: "wrap" }}>
                <SelectBox checked={sel.has(t.key)} onChange={() => sel.toggle(t.key)} label={`Select ${t.name}`} />
                <span className="grow" style={{ flexBasis: 240 }}>
                  <strong>{t.name}</strong> <span className="badge b-neutral">{KIND_LABEL[t.kind]}</span><br />
                  <span className="muted small">
                    {t.kind !== "workspace" && t.clientId ? `${clientName(t.clientId)} · ` : ""}Deleted {stamp(t.deletedAt)} · {left} day{left === 1 ? "" : "s"} left
                    {t.radius ? ` · went with it: ${t.radius.toLowerCase()}` : ""}
                  </span>
                  {parentGone(t) && <><br /><span className="xs muted">Its workspace is in Trash too. Restore that to see this again.</span></>}
                </span>
                <button className="btn" onClick={() => restore([t.key])}>Restore</button>
                {sure === t.key
                  ? <><button className="btn btn-danger" onClick={() => forever([t.key])}>Yes, delete forever</button><button className="btn" onClick={() => setSure(null)}>Keep</button></>
                  : <button className="btn btn-danger" onClick={() => setSure(t.key)}>Delete forever</button>}
              </div>
            );
          })}
        </>
      )}
      <div className="row muted small">Delete forever removes it from Baton only. Files stay where they live, and sign-off records are always kept.</div>
    </section>
  );
}

const VERB: Record<Activity["action"], string> = {
  archived: "archived", unarchived: "unarchived", deleted: "deleted", restored: "restored",
  "deleted forever": "deleted forever", "purged after 30 days": "purged after 30 days", renamed: "renamed",
};

function ActivityCard() {
  const { hk, allItems } = useStore();
  const clientName = useClientName();
  const [all, setAll] = useState(false);
  const [filter, setFilter] = useState<"all" | "deletes" | "archives">("all");
  const list = hk.activity.filter((a) => filter === "all" || (filter === "deletes" ? ["deleted", "restored", "deleted forever", "purged after 30 days"].includes(a.action) : ["archived", "unarchived"].includes(a.action)));
  const shown = all ? list : list.slice(0, 25);
  const decided = allItems.filter((i) => i.state !== "needs").length;
  return (
    <section className="card" id="activity">
      <CardHead icon="clock" title="Activity log" count={hk.activity.length}>
        <span className="seg" role="group" aria-label="Show">
          {(["all", "deletes", "archives"] as const).map((f) => <button key={f} aria-pressed={filter === f} onClick={() => setFilter(f)}>{f === "all" ? "All" : f === "deletes" ? "Deletes" : "Archives"}</button>)}
        </span>
      </CardHead>
      <div className="row small" style={{ gap: 10, background: "var(--surface-2)" }}>
        <Icon name="eyecheck" size={16} />
        <span>Sign-off records are never deleted. {decided} decided record{decided === 1 ? " is" : "s are"} on file, including any for items or workspaces you deleted.</span>
      </div>
      {shown.length === 0 && <div className="row muted small">Nothing yet. Every archive, delete and restore lands here with who and when.</div>}
      {shown.map((a) => (
        <div className="row small" key={a.id} style={{ gap: 10 }}>
          <span className="muted" style={{ width: 120, flex: "none" }}>{stamp(a.at)}</span>
          <span className="grow"><strong>{a.who}</strong> {VERB[a.action]} {KIND_LABEL[a.kind].toLowerCase()} <strong>{a.name}</strong>{a.kind !== "workspace" && a.clientId ? <span className="muted"> · {clientName(a.clientId)}</span> : null}{a.detail ? <span className="muted"> · {a.detail}</span> : null}</span>
        </div>
      ))}
      {list.length > shown.length && <button className="row as-button xs" onClick={() => setAll(true)}>Show all {list.length}</button>}
    </section>
  );
}

export default function Settings() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 900 }}>
      <div className="pagehead">
        <div>
          <h1 className="title">Settings</h1>
          <p className="muted small" style={{ margin: "4px 0 0" }}>Archive hides without losing. Delete goes to Trash for {TRASH_DAYS} days. Nothing outside Baton is touched. <Link href="/spaces">Manage spaces</Link></p>
        </div>
      </div>
      <TrashCard />
      <ActivityCard />
      <p className="xs muted">This prototype keeps Trash and the log in this browser. The real build keeps them on the server, per firm.</p>
    </div>
  );
}
