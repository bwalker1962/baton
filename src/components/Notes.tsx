"use client";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { clients, TODAY } from "@/lib/data";
import { ACTION, WITH_OPTIONS, eid, entriesFromText, nowIso, openActions, type Entry, type Note } from "@/lib/notes";
import { useClientLook, useStore } from "@/lib/store";
import { shortDate } from "@/lib/format";
import { Icon } from "./Icon";
import { ClientTile } from "./ui";

const when = (iso: string) => (iso === TODAY ? "Today" : `${shortDate(iso).full}`);
const clientOf = (id: string) => clients.find((c) => c.id === id)!;
/** "2:10 pm" for today, "Oct 27, 3:30 pm" otherwise. */
export const stamp = (iso: string) => {
  const d = new Date(iso);
  const today = new Date().toDateString() === d.toDateString();
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).toLowerCase();
  return today ? time : `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${time}`;
};

/** A borderless text area that grows with its words, so editing feels like writing on the note. */
function InlineText({ value, onChange, onKeyDown, label, inputRef, done }: {
  value: string; onChange: (v: string) => void; onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void; label: string;
  inputRef?: (el: HTMLTextAreaElement | null) => void; done?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  useLayoutEffect(() => { const el = ref.current; if (el) { el.style.height = "auto"; el.style.height = `${el.scrollHeight}px`; } }, [value]);
  return (
    <textarea ref={(el) => { ref.current = el; inputRef?.(el); }} className="inline-text" rows={1} value={value} aria-label={label}
      onChange={(e) => onChange(e.target.value)} onKeyDown={onKeyDown} style={done ? { textDecoration: "line-through" } : undefined} />
  );
}

function EntryRow({ e, editable, onText, onToggle, onKey, inputRef }: {
  e: Entry; editable: boolean; onText: (v: string) => void; onToggle: () => void;
  onKey: (k: React.KeyboardEvent<HTMLTextAreaElement>) => void; inputRef: (el: HTMLTextAreaElement | null) => void;
}) {
  const [showStamp, setShowStamp] = useState(false);
  return (
    <div className={`entry ${e.action ? "is-action" : ""} ${e.done ? "is-done" : ""}`}>
      {e.action && (editable
        ? <input type="checkbox" checked={!!e.done} onChange={onToggle} aria-label={`Done: ${e.text}`} />
        : <span aria-hidden="true">☐</span>)}
      <span style={{ flex: 1, minWidth: 0 }}>
        {editable ? <InlineText value={e.text} onChange={onText} onKeyDown={onKey} label="Note entry" inputRef={inputRef} done={e.done} /> : <span className="entry-text">{e.text}</span>}
        {showStamp && (
          <span className="entry-stamp">Added {stamp(e.at)}{e.edited ? ` · edited ${stamp(e.edited)}` : ""}{e.doneAt ? ` · done ${stamp(e.doneAt)}` : ""}</span>
        )}
      </span>
      {editable && (
        <button className="stamp-btn" aria-pressed={showStamp} aria-label={`When this was written: ${stamp(e.at)}`} title={stamp(e.at)} onClick={() => setShowStamp((v) => !v)}>
          <Icon name="clock" size={11} stroke={2.2} />
        </button>
      )}
    </div>
  );
}

/** One note on the pad, edited in place. Who and every entry are editable; each entry carries its time. */
export function PostIt({ note, showClient, editable, clamp }: { note: Note; showClient?: boolean; editable?: boolean; clamp?: boolean }) {
  // Client color only where it tells clients apart (Home's mixed stacks); inside a client every note looks the same.
  const { saveNote, removeNote } = useStore();
  const look = useClientLook(clientOf(note.clientId));
  const [showDone, setShowDone] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [draft, setDraft] = useState("");
  const refs = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const focusNext = useRef<string | null>(null);
  useEffect(() => { if (focusNext.current) { const el = refs.current[focusNext.current]; el?.focus(); el?.setSelectionRange(el.value.length, el.value.length); focusNext.current = null; } });

  const save = (entries: Entry[], patch: Partial<Note> = {}) => saveNote({ ...note, ...patch, entries, updated: nowIso() });
  const active = note.entries.filter((e) => !e.done);
  const completed = note.entries.filter((e) => e.done);

  const setText = (id: string, v: string) => {
    const action = ACTION.test(v);
    save(note.entries.map((e) => (e.id === id ? { ...e, text: v.replace(ACTION, ""), action: e.action || action || undefined, edited: nowIso() } : e)));
  };
  const toggle = (id: string) => save(note.entries.map((e) => (e.id === id ? { ...e, done: !e.done || undefined, doneAt: e.done ? undefined : nowIso() } : e)));
  const onKey = (e: Entry) => (k: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const i = note.entries.findIndex((x) => x.id === e.id);
    if (k.key === "Enter" && !k.shiftKey) {
      k.preventDefault();
      const next: Entry = { id: eid(), text: "", at: nowIso(), action: e.action };
      const list = [...note.entries]; list.splice(i + 1, 0, next);
      focusNext.current = next.id; save(list);
    } else if (k.key === "Backspace" && !e.text) {
      k.preventDefault();
      const prev = active[active.findIndex((x) => x.id === e.id) - 1];
      if (prev) focusNext.current = prev.id;
      save(note.entries.filter((x) => x.id !== e.id));
    }
  };
  const addLine = () => {
    if (!draft.trim()) return;
    save([...note.entries, ...entriesFromText(draft, nowIso())]);
    setDraft("");
  };

  return (
    <article className="postit" style={showClient ? { ["--note" as string]: look.color } : undefined} aria-label={`Note with ${note.with}, ${when(note.date)}`}>
      <div className="who">
        {editable ? (
          <span style={{ display: "flex", alignItems: "center", gap: 4, minWidth: 0 }}>
            <span style={{ opacity: 0.8 }}>Who</span>
            <input className="inline-who" list="note-with" value={note.with} aria-label="Who the conversation was with"
              onChange={(e) => save(note.entries, { with: e.target.value })} style={{ width: `${Math.max(5, note.with.length + 2)}ch` }} />
            <datalist id="note-with">{WITH_OPTIONS.map((w) => <option key={w} value={w} />)}</datalist>
            <span style={{ whiteSpace: "nowrap" }}>· {when(note.date)}</span>
          </span>
        ) : <span>{showClient ? `${clientOf(note.clientId).name} · ` : ""}{note.with}</span>}
        {!editable && <span>{when(note.date)}</span>}
      </div>
      {editable && <div className="xs" style={{ opacity: 0.7, marginTop: -4, marginBottom: 6 }}>Updated {stamp(note.updated)}</div>}

      <div className={clamp ? "clamp" : undefined}>
        {active.map((e) => (
          <EntryRow key={e.id} e={e} editable={!!editable} onText={(v) => setText(e.id, v)} onToggle={() => toggle(e.id)} onKey={onKey(e)} inputRef={(el) => { refs.current[e.id] = el; }} />
        ))}
      </div>

      {editable && (
        <input className="inline-add" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add a line… (→ makes an action)" aria-label="Add a line"
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addLine(); } }} onBlur={addLine} />
      )}

      {completed.length > 0 && (editable ? (
        <div className="completed">
          <button className="completed-toggle" aria-expanded={showDone} onClick={() => setShowDone((v) => !v)}>
            {showDone ? "▾" : "▸"} Completed items ({completed.length})
          </button>
          {showDone && completed.map((e) => (
            <EntryRow key={e.id} e={e} editable onText={(v) => setText(e.id, v)} onToggle={() => toggle(e.id)} onKey={onKey(e)} inputRef={(el) => { refs.current[e.id] = el; }} />
          ))}
        </div>
      ) : <div className="xs" style={{ opacity: 0.6, marginTop: 4 }}>{completed.length} completed</div>)}

      {editable && (
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, marginTop: 6 }}>
          {confirmDelete ? (
            <>
              <span className="xs" style={{ alignSelf: "center" }}>Delete this note?</span>
              <button className="btn" style={{ minHeight: 26, padding: "0 8px" }} onClick={() => removeNote(note.id)}>Delete</button>
              <button className="btn" style={{ minHeight: 26, padding: "0 8px" }} onClick={() => setConfirmDelete(false)}>Keep</button>
            </>
          ) : (
            <button className="note-delete" aria-label="Delete note" title="Delete note" onClick={() => setConfirmDelete(true)}>Delete</button>
          )}
        </div>
      )}
    </article>
  );
}

/** Write a note. Client is fixed inside a client's space, chosen on Home. */
export function Composer({ clientId, onDone }: { clientId?: string; onDone?: () => void }) {
  const { saveNote } = useStore();
  const [cid, setCid] = useState(clientId ?? "");
  const [who, setWho] = useState("CEO");
  const [date, setDate] = useState(TODAY);
  const [text, setText] = useState("");
  const look = useClientLook(clientOf(cid || clients[0].id));
  const save = () => {
    if (!cid || !text.trim()) return;
    const at = nowIso();
    saveNote({ id: `n${Date.now().toString(36)}`, clientId: cid, with: who.trim() || "CEO", date, entries: entriesFromText(text, at), updated: at });
    setText("");
    onDone?.();
  };
  return (
    <form className="postit" style={{ ...(!clientId && cid ? { ["--note" as string]: look.color } : {}), display: "flex", flexDirection: "column", gap: 8 }} onSubmit={(e) => { e.preventDefault(); save(); }} aria-label="New note">
      {!clientId && (
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
        <label style={{ flex: 1, minWidth: 140, display: "flex", alignItems: "center", gap: 6 }} className="small">
          <span style={{ fontWeight: 700, opacity: 0.8 }}>Who</span>
          <input className="input" list="note-with-new" value={who} onChange={(e) => setWho(e.target.value)} placeholder="CEO, a name…" style={{ padding: "6px 8px" }} />
          <datalist id="note-with-new">{WITH_OPTIONS.map((w) => <option key={w} value={w} />)}</datalist>
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
        <span className="xs" style={{ opacity: 0.7, marginRight: "auto" }}>⌘ Enter to save · every line gets a timestamp</span>
        {onDone && <button type="button" className="btn" style={{ minHeight: 32, background: "transparent" }} onClick={onDone}>Cancel</button>}
        <button type="submit" className="btn btn-primary" style={{ minHeight: 32 }} disabled={!cid || !text.trim()}>{cid ? "Save note" : "Pick a client"}</button>
      </div>
    </form>
  );
}

function Stack({ clientId, notes }: { clientId: string; notes: Note[] }) {
  const c = clientOf(clientId);
  const look = useClientLook(c);
  const open = notes.reduce((n, x) => n + openActions(x).length, 0);
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
export function NotesBoard({ bare }: { bare?: boolean }) {
  const { notes } = useStore();
  const [writing, setWriting] = useState(false);
  const byClient = clients
    .map((c) => ({ id: c.id, list: notes.filter((n) => n.clientId === c.id).sort((a, b) => b.updated.localeCompare(a.updated)) }))
    .filter((g) => g.list.length)
    .sort((a, b) => b.list[0].updated.localeCompare(a.list[0].updated));
  const add = <button className="btn" style={{ minHeight: 32 }} onClick={() => setWriting((w) => !w)} aria-expanded={writing}><Icon name="plus" size={15} />Note</button>;
  const inner = (
    <>
      {writing && <div style={{ padding: "0 18px 16px", maxWidth: 560 }}><Composer onDone={() => setWriting(false)} /></div>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 22, padding: "4px 18px 20px" }}>
        {byClient.map((g) => <Stack key={g.id} clientId={g.id} notes={g.list} />)}
      </div>
    </>
  );
  if (bare) return <><div style={{ padding: "0 18px 8px" }}>{add}</div>{inner}</>;
  return (
    <section className="card" aria-label="Conversation notes">
      <div className="card-head">
        <h2 style={{ display: "flex", gap: 8, alignItems: "center" }}><Icon name="chat" size={18} />Conversation notes</h2>
        {add}
      </div>
      {inner}
    </section>
  );
}
