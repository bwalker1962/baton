"use client";
// The coach icon: hover (or tap) for reminders and coaching that fit the card you're on.
import { CardHead } from "./ui";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { coach, CONTEXT_KINDS, KIND_LABEL, clientName, type CoachContext, type CoachTip } from "@/lib/coach";
import { useStore } from "@/lib/store";
import { useAddToAgenda } from "./OneOnOne";
import { Icon } from "./Icon";

const TITLE: Record<CoachContext, string> = {
  owed: "Keeping promises", oneonone: "Your next conversation", peace: "What could bite you", signoff: "Your review backlog", notes: "Reading the relationship", client: "Coaching for this client",
};

export function useCoach(context: CoachContext, clientId?: string): CoachTip[] {
  const { tasks, items, notes, agendas, styles, dismissed } = useStore();
  return coach({ tasks, items, notes, agendas, styles, clientId })
    .filter((t) => CONTEXT_KINDS[context].includes(t.kind) && !dismissed[t.id]);
}

export function CoachButton({ context, clientId }: { context: CoachContext; clientId?: string }) {
  const tips = useCoach(context, clientId);
  const { dismissTip } = useStore();
  const addToAgenda = useAddToAgenda();
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [all, setAll] = useState(false);
  const [onAgenda, setOnAgenda] = useState<string[]>([]);
  const [pos, setPos] = useState<{ top?: number; bottom?: number; left: number }>({ top: 0, left: 0 });
  const btn = useRef<HTMLButtonElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const urgent = tips.some((t) => t.weight >= 90);
  const shown = all ? tips : tips.slice(0, 3);

  const place = () => {
    const r = btn.current!.getBoundingClientRect();
    const w = Math.min(380, window.innerWidth - 24);
    const left = Math.max(12, Math.min(r.right - w, window.innerWidth - w - 12));
    // Open upward when there isn't room below.
    setPos(window.innerHeight - r.bottom < 380 && r.top > window.innerHeight - r.bottom ? { bottom: window.innerHeight - r.top + 8, left } : { top: r.bottom + 8, left });
  };
  const show = () => { if (timer.current) clearTimeout(timer.current); place(); setOpen(true); };
  const hideSoon = () => { if (pinned) return; if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(() => setOpen(false), 250); };

  useEffect(() => {
    if (!open) return;
    const out = (e: MouseEvent) => { if (!card.current?.contains(e.target as Node) && !btn.current?.contains(e.target as Node)) { setOpen(false); setPinned(false); } };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); setPinned(false); btn.current?.focus(); } };
    const shut = () => { if (!pinned) setOpen(false); };
    document.addEventListener("mousedown", out); document.addEventListener("keydown", esc); window.addEventListener("scroll", shut, true);
    return () => { document.removeEventListener("mousedown", out); document.removeEventListener("keydown", esc); window.removeEventListener("scroll", shut, true); };
  }, [open, pinned]);

  return (
    <>
      <button ref={btn} className={`coach-btn ${tips.length ? (urgent ? "urgent" : "has") : ""}`} aria-expanded={open} aria-haspopup="dialog"
        aria-label={`Coach: ${tips.length ? `${tips.length} suggestion${tips.length > 1 ? "s" : ""}` : "nothing to flag"}`} title="Coach"
        onMouseEnter={show} onMouseLeave={hideSoon} onFocus={show}
        onClick={() => { if (pinned) { setPinned(false); setOpen(false); } else { show(); setPinned(true); } }}>
        <Icon name="coach" size={15} stroke={2.2} />
        {tips.length > 0 && <span className="coach-count">{tips.length}</span>}
      </button>
      {open && (
        <div ref={card} role="dialog" aria-label={TITLE[context]} className="card coach-card fade" style={{ top: pos.top, bottom: pos.bottom, left: pos.left, maxHeight: pos.bottom !== undefined ? `min(70vh, ${Math.round((typeof window === "undefined" ? 800 : window.innerHeight) - pos.bottom - 12)}px)` : undefined }}
          onMouseEnter={show} onMouseLeave={hideSoon}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <strong className="small" style={{ display: "flex", gap: 6, alignItems: "center" }}><Icon name="coach" size={15} />{TITLE[context]}</strong>
            <span className="xs muted">{tips.length ? `${tips.length} to consider` : "All clear"}</span>
          </div>
          {tips.length === 0 && <p className="small muted" style={{ margin: 0 }}>Nothing to flag here. You&apos;re in good shape.</p>}
          {shown.map((t) => (
            <div key={t.id} className="coach-tip">
              <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                <span className={`badge ${t.weight >= 90 ? "b-warn" : t.kind === "style" ? "b-info" : "b-neutral"}`}><Icon name={KIND_LABEL[t.kind].icon} size={12} />{KIND_LABEL[t.kind].label}</span>
                {!clientId && <span className="xs muted">{clientName(t.clientId)}</span>}
              </div>
              <strong className="small">{t.headline}</strong>
              <span className="small">{t.advice}</span>
              <span className="xs muted">{t.source === "noticed" ? "Noticed: " : "You said: "}{t.evidence}</span>
              <span style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 2 }}>
                {t.href && <Link href={t.href} className="xs" onClick={() => setOpen(false)}>Go</Link>}
                <button className="coach-act" disabled={onAgenda.includes(t.id)} onClick={() => { addToAgenda(t.clientId, { title: t.headline, kind: "topic" }); setOnAgenda((a) => [...a, t.id]); }}>
                  {onAgenda.includes(t.id) ? "On the 1:1" : "Raise at 1:1"}
                </button>
                <button className="coach-act" onClick={() => dismissTip(t.id)} title="Hide this until something changes">Got it</button>
              </span>
            </div>
          ))}
          {tips.length > shown.length && <button className="coach-act" onClick={() => setAll(true)}>Show all {tips.length}</button>}
          <div className="xs muted" style={{ borderTop: "1px solid var(--divider)", paddingTop: 6 }}>
            Based on your promises, sign-off queue, 1:1s, notes and{" "}
            {clientId ? <Link href={`/clients/${clientId}/notes`} onClick={() => setOpen(false)}>working-style notes</Link> : "working-style notes"}. Private to you.
          </div>
        </div>
      )}
    </>
  );
}

/** Working style, in your words: how each person at the client likes to work. Feeds the coach. */
export function WorkingStyle({ clientId }: { clientId: string }) {
  const { styles, saveStyles } = useStore();
  const mine = styles.filter((s) => s.clientId === clientId);
  const [person, setPerson] = useState("CEO");
  const [trait, setTrait] = useState("");
  const set = (id: string, patch: Partial<{ person: string; trait: string }>) => saveStyles(styles.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const add = () => {
    if (!trait.trim()) return;
    saveStyles([...styles, { id: `y${Date.now().toString(36)}`, clientId, person: person.trim() || "CEO", trait: trait.trim() }]);
    setTrait("");
  };
  return (
    <section className="card" aria-label="Working style">
      <CardHead icon="coach" title="Working style" count={mine.length} />
      <div style={{ padding: "0 18px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
      <div>
        <div className="xs muted">Private to you. Describe what they do, not what they are: &ldquo;pushes back on dates&rdquo; coaches better than &ldquo;difficult.&rdquo;</div>
      </div>
      {mine.map((s) => (
        <div key={s.id} style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
          <input className="input" value={s.person} onChange={(e) => set(s.id, { person: e.target.value })} aria-label="Person" style={{ width: 86, padding: "4px 6px", fontSize: 13, fontWeight: 600 }} />
          <textarea className="input" rows={1} value={s.trait} onChange={(e) => set(s.id, { trait: e.target.value })} aria-label={`How ${s.person} works`} style={{ flex: 1, padding: "4px 6px", fontSize: 13, resize: "vertical" }} />
          <button className="btn" aria-label="Remove" onClick={() => saveStyles(styles.filter((x) => x.id !== s.id))} style={{ minHeight: 28, padding: "0 8px" }}>×</button>
        </div>
      ))}
      <form onSubmit={(e) => { e.preventDefault(); add(); }} style={{ display: "flex", gap: 6 }}>
        <input className="input" value={person} onChange={(e) => setPerson(e.target.value)} aria-label="Person" style={{ width: 86, padding: "4px 6px", fontSize: 13 }} />
        <input className="input" value={trait} onChange={(e) => setTrait(e.target.value)} placeholder="e.g. wants the bottom line first" aria-label="How they work" style={{ flex: 1, padding: "4px 6px", fontSize: 13 }} />
        <button className="btn" type="submit" style={{ minHeight: 30 }}>Add</button>
      </form>
      </div>
    </section>
  );
}
