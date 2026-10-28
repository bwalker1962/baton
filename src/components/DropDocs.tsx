"use client";
// Drag documents from your computer onto any Baton screen. Obvious ones file themselves;
// anything unclear asks which client before it's stored.
import { useCallback, useEffect, useRef, useState } from "react";
import { clients, TODAY } from "@/lib/data";
import { KINDS, classify, kindOf, looksSecret, readable, type Verdict } from "@/lib/filing";
import { useStore } from "@/lib/store";
import { Icon } from "./Icon";
import { ClientTile } from "./ui";

interface Pending { id: string; name: string; size: number; kind: string; excerpt: string; verdict: Verdict; secret: boolean; moving?: boolean }

const sizeLabel = (b: number) => (b > 1_000_000 ? `${(b / 1_000_000).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1000))} KB`);

export function DropDocs({ here }: { here?: string }) {
  const { addDoc, moveDoc } = useStore();
  const [over, setOver] = useState(false);
  const [queue, setQueue] = useState<Pending[]>([]);
  const [choice, setChoice] = useState<string | undefined>();
  const [kind, setKind] = useState("Document");
  const [note, setNote] = useState<{ text: string; doc?: Pending } | null>(null);
  const depth = useRef(0);
  const noteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const name = (id?: string) => clients.find((c) => c.id === id)?.name;

  const flash = (text: string, doc?: Pending) => {
    setNote({ text, doc });
    if (noteTimer.current) clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(() => setNote(null), 8000);
  };

  const take = useCallback(async (files: File[]) => {
    const asks: Pending[] = [];
    const filed: string[] = [];
    for (const f of files) {
      const text = readable(f) ? await f.text().catch(() => "") : "";
      const p: Pending = { id: `doc${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, name: f.name, size: f.size, kind: kindOf(f.name, f.type),
        excerpt: text.replace(/\s+/g, " ").trim().slice(0, 220), verdict: classify(f.name, text, here), secret: looksSecret(f.name, text) };
      if (!p.secret && p.verdict.sure && p.verdict.clientId) {
        addDoc({ id: p.id, clientId: p.verdict.clientId, name: p.name, kind: p.kind, size: p.size, added: TODAY });
        filed.push(`${p.name} → ${name(p.verdict.clientId)}`);
        if (files.length === 1) flash(`Filed to ${name(p.verdict.clientId)} as ${p.kind}`, p);
      } else asks.push(p);
    }
    if (files.length > 1 && filed.length) flash(`Filed ${filed.length} of ${files.length}: ${filed.join("; ")}`);
    if (asks.length) setQueue((q) => [...q, ...asks]);
  }, [addDoc, here]);

  useEffect(() => {
    const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes("Files");
    const enter = (e: DragEvent) => { if (!hasFiles(e)) return; depth.current++; setOver(true); };
    const leave = (e: DragEvent) => { if (!hasFiles(e)) return; depth.current = Math.max(0, depth.current - 1); if (!depth.current) setOver(false); };
    const overFn = (e: DragEvent) => { if (hasFiles(e)) e.preventDefault(); };
    const drop = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault(); depth.current = 0; setOver(false);
      take(Array.from(e.dataTransfer?.files ?? []));
    };
    window.addEventListener("dragenter", enter); window.addEventListener("dragleave", leave);
    window.addEventListener("dragover", overFn); window.addEventListener("drop", drop);
    return () => { window.removeEventListener("dragenter", enter); window.removeEventListener("dragleave", leave); window.removeEventListener("dragover", overFn); window.removeEventListener("drop", drop); };
  }, [take]);

  const current = queue[0];
  useEffect(() => { if (current) { setChoice(current.verdict.suggest); setKind(current.kind); } }, [current]);

  const fileIt = () => {
    if (!current || !choice) return;
    if (current.moving) moveDoc(current.id, choice);
    else addDoc({ id: current.id, clientId: choice, name: current.name, kind, size: current.size, added: TODAY });
    flash(`Filed to ${name(choice)} as ${kind}`);
    setQueue((q) => q.slice(1));
  };

  return (
    <>
      {over && (
        <div className="fade" style={{ position: "fixed", inset: 0, zIndex: 80, background: "color-mix(in srgb, var(--bg) 80%, transparent)", display: "grid", placeItems: "center", pointerEvents: "none" }}>
          <div className="card" style={{ padding: "28px 36px", textAlign: "center", border: "2px dashed var(--accent, var(--text))", maxWidth: 420 }}>
            <Icon name="file" size={32} />
            <h2 style={{ margin: "8px 0 4px" }}>{here ? `Drop into ${name(here)}` : "Drop to file in Baton"}</h2>
            <p className="muted small" style={{ margin: 0 }}>Baton reads it and checks which client it belongs to. If that isn&apos;t obvious, it asks.</p>
          </div>
        </div>
      )}

      {current && (
        <div className="backdrop" role="presentation">
          <div className="sheet fade" role="dialog" aria-modal="true" aria-label="Which client?">
            {current.secret ? (
              <>
                <h2 style={{ margin: 0, fontSize: 20, display: "flex", gap: 8, alignItems: "center" }}><Icon name="lock" />Not stored: looks like logins</h2>
                <p className="small" style={{ margin: 0 }}><strong>{current.name}</strong> appears to contain passwords or keys. Baton never stores those. Add the logins to the client&apos;s vault in your password manager, and Baton will link to them.</p>
                <button className="btn btn-primary btn-lg" onClick={() => setQueue((q) => q.slice(1))}>Got it</button>
              </>
            ) : (
              <>
                <h2 style={{ margin: 0, fontSize: 20 }}>Which client is this for?</h2>
                <div className="card" style={{ padding: 12, display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <Icon name="file" />
                  <div style={{ minWidth: 0 }}>
                    <strong style={{ wordBreak: "break-word" }}>{current.name}</strong> <span className="muted xs">{sizeLabel(current.size)}</span>
                    {current.excerpt ? <p className="small muted" style={{ margin: "4px 0 0" }}>&ldquo;{current.excerpt}{current.excerpt.length >= 220 ? "…" : ""}&rdquo;</p> : <p className="xs muted" style={{ margin: "4px 0 0" }}>Judged by its name. The full build reads PDFs and Word files too.</p>}
                  </div>
                </div>
                <div className="note" style={{ background: "var(--warn-bg)", color: "var(--warn-fg)" }}><Icon name="alert" size={16} />{current.verdict.reason}</div>
                <div role="radiogroup" aria-label="Client" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {clients.map((c) => (
                    <label key={c.id} className={`option ${choice === c.id ? "selected" : ""}`}>
                      <input type="radio" name="drop-client" checked={choice === c.id} onChange={() => setChoice(c.id)} />
                      <ClientTile client={c} small />
                      <span className="grow">{c.name}</span>
                      {current.verdict.hits[c.id] ? <span className="xs muted">named {current.verdict.hits[c.id]}×</span> : null}
                      {here === c.id && <span className="xs muted">you&apos;re here</span>}
                    </label>
                  ))}
                </div>
                <label className="small" style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span className="muted">File as</span>
                  <select className="input" value={kind} onChange={(e) => setKind(e.target.value)} style={{ width: "auto", padding: "6px 8px" }}>
                    {KINDS.map((k) => <option key={k}>{k}</option>)}
                  </select>
                </label>
                <button className="btn btn-primary btn-lg" disabled={!choice} onClick={fileIt}>{choice ? `File to ${name(choice)}` : "Pick a client"}</button>
                <button className="btn" onClick={() => setQueue((q) => q.slice(1))}>{current.moving ? "Leave it where it is" : "Don't file it"}</button>
                {queue.length > 1 && <div className="xs muted" style={{ textAlign: "center" }}>{queue.length - 1} more to check</div>}
              </>
            )}
          </div>
        </div>
      )}

      {note && !current && (
        <div className="toast fade" role="status" style={{ bottom: 88 }}>
          <span className="small"><Icon name="check" size={15} /> {note.text}</span>
          {note.doc && <button onClick={() => { setQueue((q) => [...q, { ...note.doc!, moving: true, verdict: { ...note.doc!.verdict, suggest: note.doc!.verdict.clientId, reason: "Pick where it should go instead." } }]); setNote(null); }}>Change</button>}
        </div>
      )}
    </>
  );
}
