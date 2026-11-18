"use client";
import { CardHead } from "@/components/ui";
import { use, useState } from "react";
import { topics } from "@/lib/data";
import { shortDate } from "@/lib/format";
import { useStore } from "@/lib/store";
import { ArchivedToggle, BulkBar, ItemMenu, SelectBox, useSelection } from "@/components/Housekeeping";
import type { Topic } from "@/lib/types";
import type { Ref } from "@/lib/housekeeping";

export default function Chats({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { isGone, isArchived, nameOf, rename } = useStore();
  const [sort, setSort] = useState<"recent" | "category">("recent");
  const [showArchived, setShowArchived] = useState(false);
  const kept = topics.filter((t) => t.clientId === id && !isGone("chat", t.id)).map((t) => ({ ...t, title: nameOf("chat", t.id, t.title) }));
  const archivedCount = kept.filter((t) => isArchived("chat", t.id)).length;
  const list = kept.filter((t) => isArchived("chat", t.id) === showArchived).sort((a, b) => (a.date < b.date ? 1 : -1));
  const sel = useSelection(list.map((t) => t.id));
  const ref = (t: Topic): Ref => ({ kind: "chat", id: t.id, name: t.title, clientId: t.clientId });
  const groups =
    sort === "recent"
      ? [{ name: showArchived ? "Archived" : "Newest first", items: list }]
      : [...new Set(list.map((t) => t.category))].sort().map((c) => ({ name: c, items: list.filter((t) => t.category === c) }));

  return (
    <>
      <div className="pagehead">
        <div className="seg" role="group" aria-label="Sort topics">
          <button aria-pressed={sort === "recent"} onClick={() => setSort("recent")}>Most recent</button>
          <button aria-pressed={sort === "category"} onClick={() => setSort("category")}>By category</button>
        </div>
        <span style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <ArchivedToggle count={archivedCount} on={showArchived} onChange={setShowArchived} />
          <button className="btn btn-primary">New chat</button>
        </span>
      </div>
      {list.length > 0 && (
        <section className="card" style={{ overflow: "visible" }}>
          <label className="row small muted" style={{ gap: 8, borderTop: 0 }}><SelectBox checked={sel.all} onChange={sel.toggleAll} label="Select all chats" />Select all</label>
          <BulkBar refs={list.filter((t) => sel.has(t.id)).map(ref)} onClear={sel.clear} archived={showArchived} />
        </section>
      )}
      {list.length === 0 && <section className="card empty"><h3>{showArchived ? "Nothing archived" : "No chats yet"}</h3>{!showArchived && <p>Chats appear here as topics, with the decision and follow-ups from each.</p>}</section>}
      {list.length > 0 && groups.map((g) => (
        <section key={g.name} className="card fade">
          <CardHead icon="chat" title={g.name} count={g.items.length} />
          {g.items.map((t) => {
            const d = shortDate(t.date);
            return (
              <article className={`row ${showArchived ? "hk-archived" : ""}`} key={t.id} style={{ alignItems: "flex-start", flexWrap: "wrap" }}>
                <SelectBox checked={sel.has(t.id)} onChange={() => sel.toggle(t.id)} label={`Select ${t.title}`} />
                <span style={{ width: 52, flex: "none", textAlign: "center", border: "1px solid var(--border)", borderRadius: 10, padding: "4px 0" }}>
                  <span style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--bad-fg)" }}>{d.mon}</span>
                  <span style={{ display: "block", fontSize: 18, fontWeight: 700 }}>{d.day}</span>
                </span>
                <span className="grow" style={{ flexBasis: 280, display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <strong>{t.title}</strong>
                    <span className="badge b-neutral">{t.category}</span>
                  </span>
                  <span className="muted">{t.summary}</span>
                  <span style={{ background: "var(--surface-2)", borderRadius: 8, padding: "6px 10px" }}><strong>Decision</strong> · {t.decision}</span>
                </span>
                <span className="small" style={{ width: 170 }}>
                  <span className="muted">Program</span><br />{t.program}<br />
                  <span className="muted">Follow-ups</span><br />{t.followups}
                </span>
                <ItemMenu item={ref(t)} compact onRename={(n) => rename("chat", t.id, n)} />
              </article>
            );
          })}
        </section>
      ))}
    </>
  );
}
