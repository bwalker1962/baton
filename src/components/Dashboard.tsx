"use client";
// A dashboard of widgets you arrange yourself. Drag a widget by its grip to move it; open
// Customize to drag new widgets in, resize them, or remove them. Saved per dashboard.
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import { TIER_LABEL, WIDGETS, type Size, type Slot, type Tier } from "./Widgets";

const MOVE = "application/x-baton-widget-move";
const NEW = "application/x-baton-widget-new";
const SIZE_LABEL: Record<Size, string> = { s: "Small", m: "Medium", l: "Wide" };
const has = (e: React.DragEvent, t: string) => Array.from(e.dataTransfer.types).includes(t);

export function Dashboard({ storageKey, scope, clientId, defaults }: { storageKey: string; scope: "home" | "client"; clientId?: string; defaults: Slot[] }) {
  const [layout, setLayout] = useState<Slot[]>(defaults);
  const [editing, setEditing] = useState(false);
  const [armed, setArmed] = useState<number | null>(null); // grip pressed: only then is a card draggable
  const [dragging, setDragging] = useState<number | null>(null);
  const [over, setOver] = useState<number | "end" | null>(null);
  const loaded = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setLayout((JSON.parse(raw) as Slot[]).filter((s) => WIDGETS.some((w) => w.id === s.w)));
    } catch {}
    loaded.current = true;
  }, [storageKey]);
  useEffect(() => { if (loaded.current) try { localStorage.setItem(storageKey, JSON.stringify(layout)); } catch {} }, [layout, storageKey]);

  const available = WIDGETS.filter((w) => w.scopes.includes(scope));
  const unused = available.filter((w) => !layout.some((s) => s.w === w.id));

  const insert = (slot: Slot, at: number) => setLayout((l) => { const n = [...l]; n.splice(at, 0, slot); return n; });
  const move = (from: number, to: number) => setLayout((l) => {
    if (to < 0 || to > l.length) return l;
    const n = [...l]; const [x] = n.splice(from, 1); n.splice(to > from ? to - 1 : to, 0, x); return n;
  });
  const drop = (e: React.DragEvent, at: number) => {
    e.preventDefault(); e.stopPropagation();
    if (has(e, MOVE)) move(Number(e.dataTransfer.getData(MOVE)), at);
    else if (has(e, NEW)) { const w = WIDGETS.find((x) => x.id === e.dataTransfer.getData(NEW)); if (w) insert({ w: w.id, size: w.sizes.includes("m") ? "m" : w.sizes[0] }, at); }
    setOver(null); setDragging(null); setArmed(null);
  };
  const accepts = (e: React.DragEvent) => has(e, MOVE) || has(e, NEW);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", alignItems: "center", flexWrap: "wrap" }}>
        {!editing && <span className="muted xs hide-mobile">Drag a card by its grip to move it</span>}
        {editing && <button className="btn" style={{ minHeight: 34 }} onClick={() => setLayout(defaults)}>Reset to recommended</button>}
        <button className={`btn ${editing ? "btn-primary" : ""}`} style={{ minHeight: 34 }} aria-pressed={editing} onClick={() => setEditing((v) => !v)}>
          <Icon name={editing ? "check" : "grid"} size={15} />{editing ? "Done" : "Customize"}
        </button>
      </div>

      {editing && (
        <section className="card fade" aria-label="Widget library" style={{ padding: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
            <strong className="small">Add widgets: drag onto the dashboard, or tap Add</strong>
            <span className="muted xs">Recommended order: CEO accountability, then peace of mind, then projects and tasks</span>
          </div>
          {unused.length === 0 ? <div className="muted small">Every widget is on the dashboard.</div> : (
            (["ceo", "peace", "work"] as Tier[]).map((t) => {
              const ws = unused.filter((w) => w.tier === t);
              if (!ws.length) return null;
              return (
                <div key={t} style={{ marginTop: 6 }}>
                  <div className="xs muted" style={{ fontWeight: 700, letterSpacing: "0.04em", marginBottom: 4 }}>{TIER_LABEL[t].toUpperCase()}</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {ws.map((w) => (
                      <div key={w.id} className="tray-item" draggable onDragStart={(e) => { e.dataTransfer.setData(NEW, w.id); e.dataTransfer.effectAllowed = "copy"; }}>
                        <Icon name={w.icon} size={16} />
                        <span><strong className="small">{w.title}</strong><br /><span className="muted xs">{w.blurb}</span></span>
                        <button className="btn" style={{ minHeight: 28, padding: "0 8px" }} onClick={() => insert({ w: w.id, size: w.sizes.includes("m") ? "m" : w.sizes[0] }, layout.length)} aria-label={`Add ${w.title}`}>Add</button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </section>
      )}

      <div className="dash" onDragOver={(e) => { if (accepts(e)) e.preventDefault(); }}>
        {layout.map((slot, n) => {
          const w = WIDGETS.find((x) => x.id === slot.w);
          if (!w) return null;
          const href = w.href?.(clientId);
          return (
            <section key={`${slot.w}-${n}`} className={`card widget size-${slot.size} ${over === n ? "drop-before" : ""} ${dragging === n ? "dragging" : ""}`} aria-label={w.title}
              draggable={armed === n}
              onDragStart={(e) => {
                // Only the card itself moves the card; drags of links and rows inside it (say, into the 1:1 agenda) pass through.
                if (e.target !== e.currentTarget) return;
                e.dataTransfer.setData(MOVE, String(n)); e.dataTransfer.effectAllowed = "move"; setDragging(n);
              }}
              onDragEnd={() => { setArmed(null); setDragging(null); setOver(null); }}
              onDragOver={(e) => { if (accepts(e)) { e.preventDefault(); setOver(n); } }}
              onDrop={(e) => drop(e, n)}>
              <div className="card-head widget-head">
                <h2 style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 15 }}>
                  <span className="grip" role="button" tabIndex={0} aria-label={`Move ${w.title}`} title="Drag to move"
                    onPointerDown={() => setArmed(n)} onPointerUp={() => setArmed(null)}
                    onKeyDown={(e) => { if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); move(n, n - 1); } if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); move(n, n + 2); } }}>⋮⋮</span>
                  <Icon name={w.icon} size={16} />{w.title}
                </h2>
                <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  {editing ? (
                    <>
                      {w.sizes.length > 1 && (
                        <span className="seg" role="group" aria-label={`Size of ${w.title}`}>
                          {w.sizes.map((s) => <button key={s} aria-pressed={slot.size === s} title={SIZE_LABEL[s]} onClick={() => setLayout((l) => l.map((x, i) => (i === n ? { ...x, size: s } : x)))}>{s.toUpperCase()}</button>)}
                        </span>
                      )}
                      <button className="btn" style={{ minHeight: 30, padding: "0 8px" }} aria-label={`Remove ${w.title}`} onClick={() => setLayout((l) => l.filter((_, i) => i !== n))}>×</button>
                    </>
                  ) : href ? <Link href={href} className="xs">Open</Link> : null}
                </span>
              </div>
              <div className="widget-body"><w.Body clientId={clientId} size={slot.size} /></div>
            </section>
          );
        })}
        <div className={`dash-end ${over === "end" ? "hot" : ""} ${editing ? "show" : ""}`}
          onDragOver={(e) => { if (accepts(e)) { e.preventDefault(); setOver("end"); } }} onDrop={(e) => drop(e, layout.length)}>
          Drop here to add at the end
        </div>
      </div>
    </div>
  );
}
