"use client";
// Start a project by typing or talking. Baton asks only for what's missing, then shows
// what it understood, including how real the project is, before anything is created.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { clients, TODAY } from "@/lib/data";
import { CERTAINTY, answer, dateLabel, nextQuestion, parse, typeName, type Certainty, type Question, type SlotKey, type Slots } from "@/lib/intake";
import { addDays, getTemplate } from "@/lib/templates";
import { shortDate } from "@/lib/format";
import { useStore, type ProjectStep } from "@/lib/store";
import { Icon } from "./Icon";
import { ClientTile } from "./ui";

interface Msg { from: "you" | "baton"; text: string }

export function buildSteps(templateId: string, date: string | null | undefined): ProjectStep[] {
  return (getTemplate(templateId)?.steps ?? []).map((s) => ({
    id: s.id, title: s.title, phase: s.phase, due: date ? addDays(date, s.offsetDays) : null,
    owner: s.skill ?? s.owner, skill: s.skill, signoff: s.signoff, status: "open",
  }));
}

const EXAMPLES = [
  "Heard Pentara might exhibit at a neurology conference in April",
  "Morning Miracle wants a Valentine's email campaign, proposed for Feb 1",
  "PhotoPharmics confirmed a webinar Jan 21",
];

// The browser's built-in speech recognition, where it exists (Chrome, Safari, Edge).
type Rec = { lang: string; interimResults: boolean; onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void; onend: () => void; start: () => void; stop: () => void };
const getRecognizer = (): (new () => Rec) | undefined =>
  typeof window === "undefined" ? undefined : ((window as unknown as Record<string, unknown>).SpeechRecognition ?? (window as unknown as Record<string, unknown>).webkitSpeechRecognition) as (new () => Rec) | undefined;

export function ProjectStarter({ clientId, onClose }: { clientId?: string; onClose?: () => void }) {
  const router = useRouter();
  const { addProject } = useStore();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [slots, setSlots] = useState<Slots>(clientId ? { clientId } : {});
  const [guessed, setGuessed] = useState<Partial<Record<SlotKey, boolean>>>({});
  const [q, setQ] = useState<Question | null>(null);
  const [text, setText] = useState("");
  const [done, setDone] = useState(false);
  const [listening, setListening] = useState(false);
  const [canTalk, setCanTalk] = useState(false);
  const rec = useRef<Rec | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => setCanTalk(!!getRecognizer()), []);
  useEffect(() => { logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" }); }, [msgs, done]);

  const ask = (s: Slots, g: Partial<Record<SlotKey, boolean>>, log: Msg[]) => {
    const nq = nextQuestion(s, g);
    setQ(nq);
    if (nq) setMsgs([...log, { from: "baton", text: nq.text }]);
    else { setMsgs([...log, { from: "baton", text: "Here's what I have. Check it, then create." }]); setDone(true); }
  };

  const send = (raw: string) => {
    const t = raw.trim();
    if (!t) return;
    setText("");
    const log: Msg[] = [...msgs, { from: "you", text: t }];
    if (!q) {
      // First message: take everything it mentions; a guessed status still gets confirmed.
      const p = parse(t);
      const s: Slots = { ...slots, ...p, clientId: slots.clientId ?? p.clientId };
      const g = { certainty: !!p.certainty };
      setSlots(s); setGuessed(g); ask(s, g, log);
      return;
    }
    const s = answer(q.slot, t, slots);
    const g = { ...guessed, [q.slot]: false };
    if (q.slot === "certainty" && !s.certainty) { setMsgs([...log, { from: "baton", text: "Pick the closest one: heard about it, rough idea, proposed or confirmed." }]); return; }
    setSlots(s); setGuessed(g); ask(s, g, log);
  };

  const talk = () => {
    const R = getRecognizer();
    if (!R) return;
    if (listening) { rec.current?.stop(); return; }
    const r = new R(); r.lang = "en-US"; r.interimResults = true;
    r.onresult = (e) => setText(Array.from(e.results).map((x) => x[0].transcript).join(""));
    r.onend = () => setListening(false);
    rec.current = r; r.start(); setListening(true);
  };

  const reset = () => { setMsgs([]); setSlots(clientId ? { clientId } : {}); setGuessed({}); setQ(null); setDone(false); setText(""); };

  const create = () => {
    const cert = slots.certainty as Certainty;
    const tplId = slots.templateId === "blank" ? "blank" : slots.templateId!;
    const live = cert === "proposed" || cert === "confirmed";
    const pid = `p${Date.now().toString(36)}`;
    const info: Record<string, string> = {};
    if (slots.date) info.date = slots.date;
    if (slots.monthOnly) info.dateMonthOnly = "yes";
    if (slots.role && slots.role !== "Not decided") info.role = slots.role;
    if (slots.url) info.url = slots.url;
    addProject({
      id: pid, clientId: slots.clientId!, templateId: tplId, name: slots.name!, info,
      steps: live ? buildSteps(tplId, slots.date) : [], created: TODAY,
      certainty: cert, checkBack: slots.checkBack, source: msgs.find((m) => m.from === "you")?.text,
    });
    router.push(`/clients/${slots.clientId}/projects/${pid}`);
  };

  const client = clients.find((c) => c.id === slots.clientId);
  const fresh = msgs.length === 0;

  return (
    <section className="card" aria-label="Start a project" style={{ overflow: "hidden" }}>
      <div className="card-head">
        <h2 style={{ display: "flex", gap: 8, alignItems: "center" }}><Icon name="plus" size={18} />Start a project</h2>
        <span style={{ display: "flex", gap: 6 }}>
          {!fresh && <button className="btn" style={{ minHeight: 32 }} onClick={reset}>Start over</button>}
          {onClose && <button className="btn" style={{ minHeight: 32 }} onClick={onClose} aria-label="Close Start a project">Close</button>}
        </span>
      </div>

      {fresh ? (
        <div style={{ padding: "0 18px 4px" }} className="muted small">
          Describe it the way you&apos;d say it out loud. Half-formed is fine; I&apos;ll ask for what&apos;s missing.
        </div>
      ) : (
        <div ref={logRef} role="log" aria-live="polite" style={{ maxHeight: 340, overflowY: "auto", padding: "4px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
          {msgs.map((m, n) => (
            <div key={n} style={{ alignSelf: m.from === "you" ? "flex-end" : "flex-start", maxWidth: "82%", padding: "8px 12px", borderRadius: 14, fontSize: 14, lineHeight: 1.45,
              background: m.from === "you" ? "var(--text)" : "var(--surface-2)", color: m.from === "you" ? "var(--bg)" : "var(--text)",
              borderBottomRightRadius: m.from === "you" ? 4 : 14, borderBottomLeftRadius: m.from === "you" ? 14 : 4 }}>
              {m.text}
            </div>
          ))}
          {done && slots.certainty && (
            <div className="card fade" style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }} aria-label="Project summary">
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                {client && <ClientTile client={client} />}
                <div style={{ flex: 1 }}>
                  <div className="xs muted">{client?.name} · {typeName(slots.templateId)}</div>
                  <strong style={{ fontSize: 16 }}>{slots.name}</strong>
                </div>
                <span className={`badge ${CERTAINTY[slots.certainty].cls}`}>{CERTAINTY[slots.certainty].label}</span>
              </div>
              <dl className="small" style={{ margin: 0, display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 12px" }}>
                <dt className="muted">Date</dt><dd style={{ margin: 0 }}>{slots.date ? dateLabel(slots.date, slots.monthOnly) : "Not known yet"}</dd>
                {slots.role && <><dt className="muted">Role</dt><dd style={{ margin: 0 }}>{slots.role}</dd></>}
                {slots.checkBack && <><dt className="muted">Check back</dt><dd style={{ margin: 0 }}>{shortDate(slots.checkBack).full}</dd></>}
              </dl>
              <div className="note" style={{ background: "var(--surface-2)", fontWeight: 500 }}><Icon name="clock" size={16} />{CERTAINTY[slots.certainty].next}</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                {slots.templateId && <Link className="btn" href={`/clients/${slots.clientId}/projects/new/${slots.templateId}`}>Open the full form</Link>}
                <button className="btn btn-primary" onClick={create}>Create project</button>
              </div>
            </div>
          )}
        </div>
      )}

      {(fresh || (q && !done)) && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", padding: "10px 18px 0" }}>
          {(fresh ? EXAMPLES : q!.chips).map((c) => (
            <button key={c} className="badge b-neutral" style={{ border: "1px solid var(--border)", cursor: "pointer", padding: "6px 10px", fontSize: 13 }} onClick={() => (fresh ? setText(c) : send(c))}>{c}</button>
          ))}
        </div>
      )}

      {!done && (
        <form onSubmit={(e) => { e.preventDefault(); send(text); }} style={{ display: "flex", gap: 8, padding: "12px 18px 16px", alignItems: "flex-end" }}>
          <textarea className="input" rows={fresh ? 2 : 1} value={text} onChange={(e) => setText(e.target.value)} aria-label={q ? q.text : "Describe the project"}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(text); } }}
            placeholder={fresh ? "e.g. Heard Pentara might exhibit at AAIC next July. Not official yet." : "Answer, or tap an option"} style={{ flex: 1, resize: "none" }} />
          <button type="button" className="btn" onClick={talk} disabled={!canTalk} aria-pressed={listening}
            aria-label={listening ? "Stop listening" : "Talk instead of typing"} title={canTalk ? "Talk instead of typing" : "Voice isn't available in this browser"}
            style={{ minHeight: 42, padding: "0 12px", ...(listening ? { background: "var(--bad-bg)", color: "var(--bad-fg)" } : {}) }}>
            <Icon name="mic" />
          </button>
          <button type="submit" className="btn btn-primary" style={{ minHeight: 42 }} disabled={!text.trim()}>Send</button>
        </form>
      )}
    </section>
  );
}

/** "Start a project" as a pill that opens only when you need it. */
export function StartProjectPill({ clientId, children }: { clientId?: string; children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  // Arriving from search (?start=1) opens it straight away.
  useEffect(() => { if (new URLSearchParams(window.location.search).get("start")) setOpen(true); }, []);
  return (
    <>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <button className={`btn pill ${open ? "btn-outline" : ""}`} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          <Icon name="plus" size={15} />Start a project
        </button>
        {children}
      </div>
      {open && <div className="fade"><ProjectStarter clientId={clientId} onClose={() => setOpen(false)} /></div>}
    </>
  );
}
