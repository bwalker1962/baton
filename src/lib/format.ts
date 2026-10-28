import { TODAY } from "./data";
import type { Health } from "./types";

const DAY = 86_400_000;

export function daysFromToday(iso: string | null): number | null {
  if (!iso) return null;
  return Math.round((Date.parse(iso) - Date.parse(TODAY)) / DAY);
}

export function dueLabel(iso: string | null): { text: string; tone: "bad" | "warn" | "neutral" } {
  const d = daysFromToday(iso);
  if (d === null) return { text: "No date", tone: "neutral" };
  if (d < 0) return { text: `${-d}d late`, tone: "bad" };
  if (d === 0) return { text: "Today", tone: "warn" };
  if (d <= 2) return { text: `in ${d}d`, tone: "warn" };
  return { text: `in ${d}d`, tone: "neutral" };
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function shortDate(iso: string): { mon: string; day: string; full: string } {
  const mon = MONTHS[Number(iso.slice(5, 7)) - 1];
  const day = String(Number(iso.slice(8, 10)));
  return { mon: mon.toUpperCase(), day, full: `${mon} ${day}` };
}

export const healthLabel: Record<Health, string> = {
  good: "On track",
  warn: "Watch",
  bad: "Off track",
  none: "Not started",
};

export const healthClass: Record<Health, string> = {
  good: "b-good",
  warn: "b-warn",
  bad: "b-bad",
  none: "b-neutral",
};

export const healthOrder: Record<Health, number> = { bad: 0, warn: 1, none: 3, good: 2 };

export function minutesLabel(m: number): string {
  const h = Math.floor(m / 60);
  const r = m % 60;
  return h ? `${h}h ${r.toString().padStart(2, "0")}m` : `${r}m`;
}
