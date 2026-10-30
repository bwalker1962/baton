"use client";
import { CardHead } from "@/components/ui";
import { use, useState } from "react";
import { useStore } from "@/lib/store";
import { noteText, openActions } from "@/lib/notes";
import { Composer, PostIt } from "@/components/Notes";
import { WorkingStyle } from "@/components/Coach";

export default function ClientNotes({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { notes, agendas } = useStore();
  const agenda = agendas.find((a) => a.clientId === id);
  const topics = agenda?.items.filter((i) => !i.covered) ?? [];
  const [who, setWho] = useState("All");
  const [q, setQ] = useState("");
  const mine = notes.filter((n) => n.clientId === id).sort((a, b) => b.updated.localeCompare(a.updated));
  const people = ["All", ...new Set(mine.map((n) => n.with))];
  const shown = mine.filter((n) => (who === "All" || n.with === who) && (!q || noteText(n).toLowerCase().includes(q.toLowerCase())));
  const open = mine.flatMap(openActions);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div style={{ flex: "1 1 420px", maxWidth: 620 }}><Composer clientId={id} /></div>
        <div style={{ flex: "1 1 260px", display: "flex", flexDirection: "column", gap: 12 }}>
        <section className="card" aria-label="Next 1:1">
          <CardHead icon="chat" title={`Next 1:1${agenda ? ` with ${agenda.with}` : ""}`} count={topics.length} />
          <div style={{ padding: "0 18px 16px" }}>
            <div className="xs muted" style={{ marginBottom: 8 }}>Floats at the bottom right on every screen. Drag tasks, sign-off items or projects onto it.</div>
            {topics.length ? <ol style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }} className="small">{topics.map((t) => <li key={t.id}>{t.title}</li>)}</ol> : <p className="small muted" style={{ margin: 0 }}>No topics yet.</p>}
          </div>
        </section>
          <WorkingStyle clientId={id} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <div className="seg" role="group" aria-label="Conversation with">
          {people.map((p) => <button key={p} aria-pressed={who === p} onClick={() => setWho(p)}>{p}</button>)}
        </div>
        <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search notes" aria-label="Search notes" style={{ maxWidth: 240 }} />
        <span className="muted small" style={{ marginLeft: "auto" }}>{mine.length} note{mine.length === 1 ? "" : "s"} · {open.length} open action{open.length === 1 ? "" : "s"}</span>
      </div>
      {shown.length === 0 ? (
        <section className="card empty"><h3>No notes yet</h3><p>Jot down what the CEO or staff said. Lines starting with → become action items.</p></section>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 18, alignItems: "start" }}>
          {shown.map((n) => <PostIt key={n.id} note={n} editable />)}
        </div>
      )}
    </div>
  );
}
