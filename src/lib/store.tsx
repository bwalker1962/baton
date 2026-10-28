"use client";
// Prototype state: appearance, sign-off decisions with undo, projects from templates.
// In-memory only; a real build moves this to the database.
// © 2026 RidgeFront. All rights reserved.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { signoffItems as seedItems } from "./data";
import type { SignoffItem, SignoffState } from "./types";
import { noteSeed, type Note } from "./notes";
import { agendaSeed, type Agenda } from "./agenda";
import type { Task } from "./types";

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
  certainty?: import("./intake").Certainty; // how real it is; decides whether work starts
  checkBack?: string; // for unofficial projects: when to ask if it became real
  source?: string; // the prompt it was started from
}

interface Pending {
  id: string;
  label: string;
  previous: SignoffState;
  expires: number;
}

/** A document dropped into Baton and filed to a client. */
export interface FiledDoc {
  id: string;
  clientId: string;
  name: string;
  kind: string; // Brand guide, Logo, Brief, Report, Contract, Meeting notes, Document
  size: number;
  added: string;
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
  updateProject: (id: string, patch: Partial<Project>) => void;
  docs: FiledDoc[];
  addDoc: (d: FiledDoc) => void;
  moveDoc: (id: string, clientId: string) => void;
  /** Snoozed task ids and the date each wakes. */
  snoozed: Record<string, string>;
  snooze: (id: string, until: string | null) => void;
  notes: Note[];
  saveNote: (n: Note) => void; // add or update
  removeNote: (id: string) => void;
  agendas: Agenda[];
  saveAgenda: (a: Agenda) => void;
  /** Tasks created in Baton (from 1:1 follow-ups), merged with each client's task list. */
  newTasks: Task[];
  addTask: (t: Task) => void;
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
  const [docs, setDocs] = useState<FiledDoc[]>([]);
  const [snoozed, setSnoozed] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Note[]>(noteSeed);
  // Notes are kept on this device in the prototype; the build stores them per client.
  useEffect(() => {
    try { const raw = localStorage.getItem("baton-notes-v1"); if (raw) setNotes(JSON.parse(raw)); } catch {}
  }, []);
  const persist = (next: Note[]) => { try { localStorage.setItem("baton-notes-v1", JSON.stringify(next)); } catch {} return next; };
  const saveNote = useCallback((n: Note) => setNotes((all) => persist(all.some((x) => x.id === n.id) ? all.map((x) => (x.id === n.id ? n : x)) : [n, ...all])), []);
  const removeNote = useCallback((id: string) => setNotes((all) => persist(all.filter((x) => x.id !== id))), []);
  const [agendas, setAgendas] = useState<Agenda[]>(agendaSeed);
  const [newTasks, setNewTasks] = useState<Task[]>([]);
  useEffect(() => {
    try { const raw = localStorage.getItem("baton-agendas-v1"); if (raw) setAgendas(JSON.parse(raw)); } catch {}
    try { const raw = localStorage.getItem("baton-newtasks-v1"); if (raw) setNewTasks(JSON.parse(raw)); } catch {}
  }, []);
  const saveAgenda = useCallback((a: Agenda) => setAgendas((all) => {
    const next = all.some((x) => x.clientId === a.clientId) ? all.map((x) => (x.clientId === a.clientId ? a : x)) : [...all, a];
    try { localStorage.setItem("baton-agendas-v1", JSON.stringify(next)); } catch {}
    return next;
  }), []);
  const addTask = useCallback((t: Task) => setNewTasks((all) => {
    const next = [...all, t];
    try { localStorage.setItem("baton-newtasks-v1", JSON.stringify(next)); } catch {}
    return next;
  }), []);
  const addDoc = useCallback((d: FiledDoc) => setDocs((all) => [d, ...all]), []);
  const moveDoc = useCallback((id: string, clientId: string) => setDocs((all) => all.map((d) => (d.id === id ? { ...d, clientId } : d))), []);
  const snooze = useCallback((id: string, until: string | null) => setSnoozed((all) => {
    const next = { ...all };
    if (until) next[id] = until; else delete next[id];
    return next;
  }), []);
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
  const updateProject = useCallback((id: string, patch: Partial<Project>) => setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p))), []);

  const value = useMemo(
    () => ({ brand, setBrand, mode, setMode, items, decide, pending, undo, projects, addProject, updateProject, docs, addDoc, moveDoc, snoozed, snooze, notes, saveNote, removeNote, agendas, saveAgenda, newTasks, addTask }),
    [brand, setBrand, mode, setMode, items, decide, pending, undo, projects, addProject, updateProject, docs, addDoc, moveDoc, snoozed, snooze, notes, saveNote, removeNote, agendas, saveAgenda, newTasks, addTask],
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
