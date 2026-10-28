"use client";
// Prototype state: appearance, sign-off decisions with undo, projects from templates.
// In-memory only; a real build moves this to the database.
// © 2026 RidgeFront. All rights reserved.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { signoffItems as seedItems } from "./data";
import type { SignoffItem, SignoffState } from "./types";

export type Mode = "light" | "half" | "dark";

export interface ProjectStep {
  id: string;
  title: string;
  phase: string;
  due: string | null;
  owner: string;
  skill?: string;
  signoff?: boolean;
  status: "open" | "done" | "skipped";
  skipReason?: string;
}

export interface Project {
  id: string;
  clientId: string;
  templateId: string;
  name: string;
  info: Record<string, string>;
  steps: ProjectStep[];
  created: string;
}

interface Pending {
  id: string;
  label: string;
  previous: SignoffState;
  expires: number;
}

export interface BrandChoice {
  color: string; // as chosen
  accent: string; // readable version used in Baton
  logo: string; // detected logo id, or "monogram"
  initial: string;
}

interface Store {
  brand: Record<string, BrandChoice>;
  setBrand: (clientId: string, b: BrandChoice) => void;
  mode: Mode;
  setMode: (m: Mode) => void;
  items: SignoffItem[];
  decide: (id: string, state: SignoffState, outcome?: string) => void;
  pending: Pending | null;
  undo: () => void;
  projects: Project[];
  addProject: (p: Project) => void;
}

const Ctx = createContext<Store | null>(null);
export const UNDO_SECONDS = 10;

const LABELS: Record<SignoffState, string> = {
  needs: "Back in your queue",
  approved: "Approved",
  "approved-changes": "Approved with changes",
  resubmit: "Sent back to resubmit",
  declined: "Declined",
  held: "Held for discussion",
};

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<Mode>("light");
  const [items, setItems] = useState<SignoffItem[]>(seedItems);
  const [pending, setPending] = useState<Pending | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [brand, setBrandState] = useState<Record<string, BrandChoice>>({});
  const setBrand = useCallback((clientId: string, b: BrandChoice) => setBrandState((all) => ({ ...all, [clientId]: b })), []);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("baton-mode") as Mode | null;
      if (saved === "light" || saved === "half" || saved === "dark") setModeState(saved);
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.dataset.mode = mode;
  }, [mode]);

  const setMode = useCallback((m: Mode) => {
    setModeState(m);
    try {
      localStorage.setItem("baton-mode", m);
    } catch {}
  }, []);

  const decide = useCallback((id: string, state: SignoffState, outcome?: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) {
        if (timer.current) clearTimeout(timer.current);
        setPending({ id, label: `${LABELS[state]}: ${item.title}`, previous: item.state, expires: Date.now() + UNDO_SECONDS * 1000 });
        timer.current = setTimeout(() => setPending(null), UNDO_SECONDS * 1000);
      }
      return prev.map((i) => (i.id === id ? { ...i, state, outcome: outcome ?? i.outcome } : i));
    });
  }, []);

  const undo = useCallback(() => {
    setPending((p) => {
      if (p) setItems((prev) => prev.map((i) => (i.id === p.id ? { ...i, state: p.previous } : i)));
      return null;
    });
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const addProject = useCallback((p: Project) => setProjects((prev) => [p, ...prev]), []);

  const value = useMemo(
    () => ({ brand, setBrand, mode, setMode, items, decide, pending, undo, projects, addProject }),
    [brand, setBrand, mode, setMode, items, decide, pending, undo, projects, addProject],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** A client's look inside Baton: the saved brand choice, or its defaults. */
export function useClientLook(client: { id: string; color: string; initial: string }) {
  const { brand } = useStore();
  const b = brand[client.id];
  return { color: b?.accent ?? client.color, initial: b?.initial ?? client.initial, logo: b?.logo ?? "monogram" };
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore must be used inside StoreProvider");
  return s;
}
