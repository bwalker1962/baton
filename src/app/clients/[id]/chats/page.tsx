"use client";
import { use, useState } from "react";
import { topics } from "@/lib/data";
import { shortDate } from "@/lib/format";

export default function Chats({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [sort, setSort] = useState<"recent" | "category">("recent");
  const list = topics.filter((t) => t.clientId === id).sort((a, b) => (a.date < b.date ? 1 : -1));
  const groups =
    sort === "recent"
      ? [{ name: "Newest first", items: list }]
      : [...new Set(list.map((t) => t.category))].sort().map((c) => ({ name: c, items: list.filter((t) => t.category === c) }));

  return (
    <>
      <div className="pagehead">
        <div className="seg" role="group" aria-label="Sort topics">
          <button aria-pressed={sort === "recent"} onClick={() => setSort("recent")}>Most recent</button>
          <button aria-pressed={sort === "category"} onClick={() => setSort("category")}>By category</button>
        </div>
        <button className="btn btn-accent">New chat</button>
      </div>
      {list.length === 0 && <section className="card empty"><h3>No chats yet</h3><p>Chats appear here as topics, with the decision and follow-ups from each.</p></section>}
      {groups.map((g) => (
        <section key={g.name} className="card fade">
          <div className="card-head"><h2 style={{ fontSize: 14 }}>{g.name}</h2><span className="muted small">{g.items.length} topics</span></div>
          {g.items.map((t) => {
            const d = shortDate(t.date);
            return (
              <article className="row" key={t.id} style={{ alignItems: "flex-start", flexWrap: "wrap" }}>
                <span style={{ width: 52, flex: "none", textAlign: "center", border: "1px solid var(--border)", borderRadius: 10, padding: "4px 0" }}>
                  <span style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--bad-fg)" }}>{d.mon}</span>
                  <span style={{ display: "block", fontSize: 18, fontWeight: 700 }}>{d.day}</span>
                </span>
                <span className="grow" style={{ flexBasis: 280, display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <strong>{t.title}</strong>
                    <span className="badge badge-accent">{t.category}</span>
                  </span>
                  <span className="muted">{t.summary}</span>
                  <span style={{ background: "var(--surface-2)", borderRadius: 8, padding: "6px 10px" }}><strong>Decision</strong> · {t.decision}</span>
                </span>
                <span className="small" style={{ width: 170 }}>
                  <span className="muted">Program</span><br />{t.program}<br />
                  <span className="muted">Follow-ups</span><br />{t.followups}
                </span>
              </article>
            );
          })}
        </section>
      ))}
    </>
  );
}
