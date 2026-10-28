"use client";
import { useEffect, useRef, useState } from "react";
import { TODAY } from "@/lib/data";
import { addDays } from "@/lib/templates";
import { shortDate } from "@/lib/format";
import { Icon } from "./Icon";

type Unit = "days" | "weeks" | "months";
const PRESETS: { label: string; n: number; unit: Unit }[] = [
  { label: "Tomorrow", n: 1, unit: "days" },
  { label: "3 days", n: 3, unit: "days" },
  { label: "1 week", n: 1, unit: "weeks" },
  { label: "2 weeks", n: 2, unit: "weeks" },
  { label: "1 month", n: 1, unit: "months" },
];

export function wakeDate(n: number, unit: Unit, from = TODAY): string {
  if (unit === "months") {
    const d = new Date(from + "T12:00");
    d.setMonth(d.getMonth() + n);
    return d.toISOString().slice(0, 10);
  }
  return addDays(from, unit === "weeks" ? n * 7 : n);
}

const weekday = (iso: string) => new Date(iso + "T12:00").toLocaleDateString("en-US", { weekday: "short" });
export const wakeLabel = (iso: string) => `${weekday(iso)} ${shortDate(iso).full}`;

/** A small menu: pick a preset, or snooze for any number of days, weeks or months. */
export function SnoozeButton({ label, onSnooze, compact }: { label: string; onSnooze: (until: string) => void; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [n, setN] = useState(10);
  const [unit, setUnit] = useState<Unit>("days");
  const ref = useRef<HTMLDivElement>(null);
  // Fixed position so the menu isn't clipped by scrolling tables.
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const shut = () => setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    window.addEventListener("scroll", shut, true);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc); window.removeEventListener("scroll", shut, true); };
  }, [open]);

  const pick = (until: string) => { onSnooze(until); setOpen(false); };

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button type="button" className="btn" aria-haspopup="menu" aria-expanded={open} aria-label={`Snooze ${label}`} title="Snooze"
        style={{ minHeight: 32, padding: compact ? "0 8px" : "0 10px" }} onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const top = r.bottom + 6 + 330 > window.innerHeight ? Math.max(8, r.top - 336) : r.bottom + 6;
          setPos({ top, left: Math.max(8, Math.min(r.right - 240, window.innerWidth - 248)) });
          setOpen((o) => !o);
        }}>
        <Icon name="clock" size={15} />{!compact && "Snooze"}
      </button>
      {open && (
        <div role="menu" className="card fade" style={{ position: "fixed", top: pos?.top, left: pos?.left, zIndex: 60, width: 240, padding: 8, boxShadow: "var(--shadow-lg, 0 10px 30px rgba(0,0,0,.18))", display: "flex", flexDirection: "column", gap: 2 }}>
          <div className="xs muted" style={{ fontWeight: 700, letterSpacing: "0.04em", padding: "4px 8px" }}>SNOOZE UNTIL</div>
          {PRESETS.map((p) => {
            const until = wakeDate(p.n, p.unit);
            return (
              <button key={p.label} role="menuitem" className="btn" style={{ justifyContent: "space-between", border: 0, background: "none", minHeight: 34 }} onClick={() => pick(until)}>
                <span>{p.label}</span><span className="muted small">{wakeLabel(until)}</span>
              </button>
            );
          })}
          <form onSubmit={(e) => { e.preventDefault(); if (n > 0) pick(wakeDate(n, unit)); }} style={{ display: "flex", gap: 6, padding: "6px 4px 2px", borderTop: "1px solid var(--divider)", marginTop: 4, alignItems: "center" }}>
            <input className="input" type="number" min={1} max={365} value={n} onChange={(e) => setN(Number(e.target.value))} aria-label="How many" style={{ width: 60, padding: "6px 8px" }} />
            <select className="input" value={unit} onChange={(e) => setUnit(e.target.value as Unit)} aria-label="Unit" style={{ width: "auto", padding: "6px 8px" }}>
              <option value="days">days</option><option value="weeks">weeks</option><option value="months">months</option>
            </select>
            <button className="btn btn-primary" type="submit" style={{ minHeight: 34, padding: "0 10px" }}>Go</button>
          </form>
          {n > 0 && <div className="xs muted" style={{ padding: "2px 6px" }}>Wakes {wakeLabel(wakeDate(n, unit))}</div>}
        </div>
      )}
    </div>
  );
}
