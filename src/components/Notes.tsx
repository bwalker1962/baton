"use client";
import Link from "next/link";
import { useState } from "react";
import { clients, TODAY } from "@/lib/data";
import { ACTION, WITH_OPTIONS, actions, type Note } from "@/lib/notes";
import { useClientLook, useStore } from "@/lib/store";
import { shortDate } from "@/lib/format";
import { Icon } from "./Icon";
import { ClientTile } from "./ui";

const when = (iso: string) => (iso === TODAY ? "Today" : `${shortDate(iso).full}`);
const clientOf = (id: string) => clients.find((c) => c.id === id)!;

/** One note on the pad. Action lines ("→ …") become tick boxes. */
export function PostIt({ note, showClient, editable, clamp }: { note: Note; showClient?: boolean; editable?: boolean; clamp?: boolean }) {
  const { saveNote, removeNote } = useStore();
  const look = useClientLook(clientOf(note.clientId));
  const [editing, setEditing] = useState(false);
  const lines = note.text.split("\n");
  const toggle = (i: number) => {
    const done = note.done ?? [];
    saveNote({ ...note, done: done.includes(i) ? done.filter((x) => x !== i) : [...done, i] });
  };

  if (editing) return <Composer note={note} onDone={() => setEditing(false)} />;
  return (
    <article className="postit" style={{ ["--note" as string]: look.color }} aria-label={`Note with ${note.with}, ${when(note.date)}`}>
      <div className="who">
        <span>{showClient ? `${clientOf(note.clientId).name} · ` : ""}{note.with}</span>
        <span>{when(note.date)}</span>
      </div>
      <div className={clamp ? "clamp" : undefined}>
        {lines.map((line, i) =>
          ACTION.test(line) && !editable ? (
            <div key={i} className="act"><span aria-hidden="true">{(note.done ?? []).includes(i) ? "☑" : "☐"}</span>
              <span style={{ textDecoration: (note.done ?? []).includes(i) ? "line-through" : undefined }}>{line.replace(ACTION, "")}</span></div>
          ) : ACTION.test(line) ? (
            <label key={i} className="act">
              <input type="checkbox" checked={(note.done ?? []).includes(i)} onChange={() => toggle(i)} />
              <span style={{ textDecoration: (note.done ?? []).includes(i) ? "line-through" : undefined, opacity: (note.done ?? []).includes(i) ? 0.6 : 1 }}>{line.replace(ACTION, "")}</span>
            </label>
          ) : line.trim() ? <p key={i}>{line}</p> : null,
        )}
      </div>
      {editable && (
        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", marginTop: 8 }}>
          <button className="btn" style={{ minHeight: 30, background: "transparent" }} onClick={() => setEditing(true)}>Edit</button>
          <button className="btn" style={{ minHeight: 30, background: "transparent" }} aria-label="Delete note" onClick={() => removeNote(note.id)}>Delete</button>
        </div>
      )}
    </article>
  );
}

/** Write a note. Client is fixed inside a client's space, chosen on Home. */
export function Composer({ clientId, note, onDone }: { clientId?: string; note?: Note; onDone?: () => void }) {
  const { saveNote } = useStore();
  const [cid, setCid] = useState(note?.clientId ?? clientId ?? "");
  const [who, setWho] = useState(note?.with ?? "CEO");
  const [date, setDate] = useState(note?.date ?? TODAY);
  const [text, setText] = useState(note?.text ?? "");
  const look = useClientLook(clientOf(cid || clients[0].id));
  const save = () => {
    if (!cid || !text.trim()) return;
    saveNote({ id: note?.id ?? `n${Date.now().toString(36)}`, clientId: cid, with: who.trim() || "CEO", date, text: text.trim(), done: note?.done });
    if (!note) setText("");
    onDone?.();
  };
  return (
    <form className="postit" style={{ ["--note" as string]: cid ? look.color : "#9a9a9a", display: "flex", flexDirection: "column", gap: 8 }} onSubmit={(e) => { e.preventDefault(); save(); }} aria-label="New note">
      {!clientId && !note && (
        <div role="radiogroup" aria-label="Client" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {clients.map((c) => (
            <button type="button" key={c.id} role="radio" aria-checked={cid === c.id} onClick={() => setCid(c.id)} className="btn"
              style={{ minHeight: 30, padding: "0 8px", background: cid === c.id ? "rgba(0,0,0,.08)" : "transparent", borderColor: cid === c.id ? "currentColor" : undefined }}>
              <ClientTile client={c} small />{c.name}
            </button>
          ))}
        </div>
      )}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <label style={{ flex: 1, minWidth: 140 }}>
          <span style={{ position: "absolute", left: -9999 }}>Conversation with</span>
          <input className="input" list="note-with" value={who} onChange={(e) => setWho(e.target.value)} placeholder="With: CEO, a name…" style={{ padding: "6px 8px" }} />
          <datalist id="note-with">{WITH_OPTIONS.map((w) => <option key={w} value={w} />)}</datalist>
        </label>
        <label>
          <span style={{ position: "absolute", left: -9999 }}>Date</span>
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ padding: "6px 8px" }} />
        </label>
      </div>
      <textarea className="input" rows={4} value={text} onChange={(e) => setText(e.target.value)} aria-label="Note"
        onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); save(); } }}
        placeholder={"What did they say?\n→ Start a line with an arrow (or [ ]) to make it an action item"} />
      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", alignItems: "center" }}>
        <span className="xs" style={{ opacity: 0.7, marginRight: "auto" }}>⌘ Enter to save</span>
        {onDone && <button type="button" className="btn" style={{ minHeight: 32, background: "transparent" }} onClick={onDone}>Cancel</button>}
        <button type="submit" className="btn btn-primary" style={{ minHeight: 32 }} disabled={!cid || !text.trim()}>{cid ? "Save note" : "Pick a client"}</button>
      </div>
    </form>
  );
}

function Stack({ clientId, notes }: { clientId: string; notes: Note[] }) {
  const c = clientOf(clientId);
  const look = useClientLook(c);
  const open = notes.reduce((n, x) => n + actions(x.text).filter((a) => !(x.done ?? []).includes(a.i)).length, 0);
  return (
    <Link href={`/clients/${clientId}/notes`} className="stack" style={{ ["--note" as string]: look.color }} aria-label={`${c.name}: ${notes.length} notes, ${open} open action items`}>
      <div className="pile">
        {notes.length > 2 && <span className="layer l2" aria-hidden="true" />}
        {notes.length > 1 && <span className="layer l1" aria-hidden="true" />}
        <PostIt note={notes[0]} showClient clamp />
      </div>
      <div className="xs muted" style={{ display: "flex", justifyContent: "space-between", marginTop: 4, paddingRight: 14 }}>
        <span>{notes.length} note{notes.length === 1 ? "" : "s"}</span>
        {open > 0 && <span style={{ fontWeight: 700 }}>{open} open action{open === 1 ? "" : "s"}</span>}
      </div>
    </Link>
  );
}

/** Home: one cascading stack per client, most recent conversation on top. */
export function NotesBoard() {
  const { notes } = useStore();
  const [writing, setWriting] = useState(false);
  const byClient = clients
    .map((c) => ({ id: c.id, list: notes.filter((n) => n.clientId === c.id).sort((a, b) => b.date.localeCompare(a.date)) }))
    .filter((g) => g.list.length)
    .sort((a, b) => b.list[0].date.localeCompare(a.list[0].date));
  return (
    <section className="card" aria-label="Conversation notes">
      <div className="card-head">
        <h2 style={{ display: "flex", gap: 8, alignItems: "center" }}><Icon name="chat" size={18} />Conversation notes</h2>
        <button className="btn" style={{ minHeight: 34 }} onClick={() => setWriting((w) => !w)} aria-expanded={writing}><Icon name="plus" size={15} />Note</button>
      </div>
      {writing && <div style={{ padding: "0 18px 16px", maxWidth: 560 }}><Composer onDone={() => setWriting(false)} /></div>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 22, padding: "4px 18px 20px" }}>
        {byClient.map((g) => <Stack key={g.id} clientId={g.id} notes={g.list} />)}
      </div>
    </section>
  );
}
