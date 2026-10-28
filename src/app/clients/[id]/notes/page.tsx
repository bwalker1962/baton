"use client";
import { use, useState } from "react";
import { useStore } from "@/lib/store";
import { actions } from "@/lib/notes";
import { Composer, PostIt } from "@/components/Notes";

export default function ClientNotes({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { notes } = useStore();
  const [who, setWho] = useState("All");
  const [q, setQ] = useState("");
  const mine = notes.filter((n) => n.clientId === id).sort((a, b) => b.date.localeCompare(a.date));
  const people = ["All", ...new Set(mine.map((n) => n.with))];
  const shown = mine.filter((n) => (who === "All" || n.with === who) && (!q || n.text.toLowerCase().includes(q.toLowerCase())));
  const open = mine.flatMap((n) => actions(n.text).filter((a) => !(n.done ?? []).includes(a.i)));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ maxWidth: 620 }}><Composer clientId={id} /></div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <div className="seg" role="group" aria-label="Conversation with">
          {people.map((p) => <button key={p} aria-pressed={who === p} onClick={() => setWho(p)}>{p}</button>)}
        </div>
        <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search notes" aria-label="Search notes" style={{ maxWidth: 240 }} />
        <span className="muted small" style={{ marginLeft: "auto" }}>{mine.length} notes · {open.length} open action{open.length === 1 ? "" : "s"}</span>
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
