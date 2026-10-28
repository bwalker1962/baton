import type { Crew, Health } from "@/lib/types";
import { dueLabel, healthClass, healthLabel } from "@/lib/format";
import { Icon } from "./Icon";

const healthIcon: Record<Health, string> = { good: "check", warn: "alert", bad: "stop", none: "empty" };

/** Status always shows icon, word and color together, never color alone. */
export function StatusBadge({ health, label }: { health: Health; label?: string }) {
  return (
    <span className={`badge ${healthClass[health]}`}>
      <Icon name={healthIcon[health]} size={14} stroke={2.4} />
      {label ?? healthLabel[health]}
    </span>
  );
}

export function StatusIcon({ health }: { health: Health }) {
  const color = { good: "var(--good-dot)", warn: "var(--warn-dot)", bad: "var(--bad-dot)", none: "var(--gray-dot)" }[health];
  return (
    <span style={{ color, display: "inline-flex" }} title={healthLabel[health]}>
      <Icon name={healthIcon[health]} size={18} stroke={2.2} />
      <span className="sr-only" style={{ position: "absolute", left: -9999 }}>{healthLabel[health]}</span>
    </span>
  );
}

export function Due({ iso }: { iso: string | null }) {
  const d = dueLabel(iso);
  const cls = d.tone === "bad" ? "b-bad" : d.tone === "warn" ? "b-warn" : "b-neutral";
  return <span className={`badge ${cls}`}>{d.text}</span>;
}

export { ClientTile } from "./ClientTile";

export function CrewChip({ crew }: { crew: Crew }) {
  const cls = { skill: "chip-skill", app: "chip-app", person: "chip-person", gap: "chip-gap" }[crew.kind];
  const prefix = crew.kind === "gap" ? "Gap: " : "";
  return <span className={`chip ${cls}`}>{prefix}{crew.label}</span>;
}

export function Progress({ pct, health }: { pct: number; health: Health }) {
  const color = { good: "var(--good-dot)", warn: "var(--warn-dot)", bad: "var(--bad-dot)", none: "var(--gray-dot)" }[health];
  return (
    <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
      <span className="bar" aria-hidden="true"><span style={{ width: `${pct}%`, background: color }} /></span>
      <span className="muted xs">{pct}%</span>
    </span>
  );
}
