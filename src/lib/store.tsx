"use client";
// Prototype state: appearance, sign-off decisions with undo, projects from templates.
// Everything here is kept on this device via usePersisted; a real build moves
// the same shapes to the database and the components above do not change.
// © 2026 RidgeFront. All rights reserved.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { signoffItems as seedItems, tasks as seedTasks } from "./data";
import type { SignoffItem, SignoffState } from "./types";
import { migrate, noteSeed, type Note } from "./notes";
import { agendaSeed, type Agenda } from "./agenda";
import { styleSeed, type Style } from "./coach";
import { usePersisted } from "./persist";
import type { Task } from "./types";

export type Mode = "light" | "half" | "dark";
export interface Space { id: string; name: string; kind: "personal" | "business" | "client"; color: string; website?: string; archived?: boolean; }

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

/** What you decided about a sign-off item, kept apart from the item itself. */
interface Decision {
  state: SignoffState;
  outcome?: string;
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
  spaces: Space[];
  addSpace: (space: Space) => void;
  updateSpace: (id: string, patch: Partial<Space>) => void;
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
  agendaOpenFor: string | null;
  openAgenda: (clientId: string | null) => void;
  /** Every task: the sample list plus tasks created in Baton, with your edits applied. */
  tasks: Task[];
  editTask: (id: string, patch: Partial<Task>) => void;
  /** Working style per client person, in your words. Private to you. */
  styles: Style[];
  saveStyles: (s: Style[]) => void;
  /** Coach tips you've dismissed, with the date (they can return when things change). */
  dismissed: Record<string, string>;
  dismissTip: (id: string) => void;
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
  // Appearance keeps its own plain-string key so an existing choice survives.
  const [mode, setModeState] = useState<Mode>("light");

  const [spaces, setSpaces] = usePersisted<Space[]>("baton-spaces-v1", []);
  const [projects, setProjects] = usePersisted<Project[]>("baton-projects-v1", []);
  const [docs, setDocs] = usePersisted<FiledDoc[]>("baton-docs-v1", []);
  const [snoozed, setSnoozed] = usePersisted<Record<string, string>>("baton-snoozed-v1", {});
  const [brand, setBrandState] = usePersisted<Record<string, BrandChoice>>("baton-brand-v1", {});
  const [notes, setNotes] = usePersisted<Note[]>("baton-notes-v1", noteSeed, (raw) =>
    Array.isArray(raw) ? (raw as unknown[]).map(migrate) : noteSeed,
  );
  const [agendas, setAgendas] = usePersisted<Agenda[]>("baton-agendas-v1", agendaSeed);
  const [newTasks, setNewTasks] = usePersisted<Task[]>("baton-newtasks-v1", []);
  const [taskEdits, setTaskEdits] = usePersisted<Record<string, Partial<Task>>>("baton-taskedits-v1", {});
  const [styles, setStyles] = usePersisted<Style[]>("baton-styles-v1", styleSeed);
  const [dismissed, setDismissed] = usePersisted<Record<string, string>>("baton-dismissed-v1", {});
  // Decisions are stored as an overlay on the seed items, the same way task
  // edits are. The alternative — persisting whole items — would freeze a copy
  // of every asset body on the device and drift from the seed data.
  const [decisions, setDecisions] = usePersisted<Record<string, Decision>>("baton-decisions-v1", {});

  const [pending, setPending] = useState<Pending | null>(null);
  const [agendaOpenFor, openAgenda] = useState<string | null>(null);

  const items = useMemo<SignoffItem[]>(
    () => seedItems.map((i) => (decisions[i.id] ? { ...i, ...decisions[i.id] } : i)),
    [decisions],
  );
  const tasks = useMemo(
    () => [...seedTasks, ...newTasks].map((t) => (taskEdits[t.id] ? { ...t, ...taskEdits[t.id] } : t)),
    [newTasks, taskEdits],
  );

  const addSpace = useCallback((space: Space) => setSpaces((all) => [...all, space]), [setSpaces]);
  const updateSpace = useCallback(
    (id: string, patch: Partial<Space>) => setSpaces((all) => all.map((s) => (s.id === id ? { ...s, ...patch } : s))),
    [setSpaces],
  );
  const addProject = useCallback((p: Project) => setProjects((prev) => [p, ...prev]), [setProjects]);
  const updateProject = useCallback(
    (id: string, patch: Partial<Project>) => setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p))),
    [setProjects],
  );
  const addDoc = useCallback((d: FiledDoc) => setDocs((all) => [d, ...all]), [setDocs]);
  const moveDoc = useCallback(
    (id: string, clientId: string) => setDocs((all) => all.map((d) => (d.id === id ? { ...d, clientId } : d))),
    [setDocs],
  );
  const snooze = useCallback(
    (id: string, until: string | null) =>
      setSnoozed((all) => {
        const next = { ...all };
        if (until) next[id] = until;
        else delete next[id];
        return next;
      }),
    [setSnoozed],
  );
  const saveNote = useCallback(
    (n: Note) => setNotes((all) => (all.some((x) => x.id === n.id) ? all.map((x) => (x.id === n.id ? n : x)) : [n, ...all])),
    [setNotes],
  );
  const removeNote = useCallback((id: string) => setNotes((all) => all.filter((x) => x.id !== id)), [setNotes]);
  const saveAgenda = useCallback(
    (a: Agenda) =>
      setAgendas((all) =>
        all.some((x) => x.clientId === a.clientId) ? all.map((x) => (x.clientId === a.clientId ? a : x)) : [...all, a],
      ),
    [setAgendas],
  );
  const addTask = useCallback((t: Task) => setNewTasks((all) => [...all, t]), [setNewTasks]);
  const editTask = useCallback(
    (id: string, patch: Partial<Task>) => setTaskEdits((all) => ({ ...all, [id]: { ...all[id], ...patch } })),
    [setTaskEdits],
  );
  const saveStyles = useCallback((s: Style[]) => setStyles(s), [setStyles]);
  const dismissTip = useCallback(
    (id: string) => setDismissed((all) => ({ ...all, [id]: new Date().toISOString() })),
    [setDismissed],
  );
  const setBrand = useCallback(
    (clientId: string, b: BrandChoice) => setBrandState((all) => ({ ...all, [clientId]: b })),
    [setBrandState],
  );

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

  // --- Sign-off decisions, with a short window to take one back ------------
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const decisionsRef = useRef(decisions);
  decisionsRef.current = decisions;
  const pendingRef = useRef(pending);
  pendingRef.current = pending;

  useEffect(() => () => { if (undoTimer.current) clearTimeout(undoTimer.current); }, []);

  const decide = useCallback(
    (id: string, state: SignoffState, outcome?: string) => {
      const seed = seedItems.find((i) => i.id === id);
      if (!seed) return;
      const previous = decisionsRef.current[id]?.state ?? seed.state;
      if (undoTimer.current) clearTimeout(undoTimer.current);
      setPending({ id, label: `${LABELS[state]}: ${seed.title}`, previous, expires: Date.now() + UNDO_SECONDS * 1000 });
      undoTimer.current = setTimeout(() => setPending(null), UNDO_SECONDS * 1000);
      setDecisions((prev) => ({ ...prev, [id]: { state, outcome: outcome ?? prev[id]?.outcome ?? seed.outcome } }));
    },
    [setDecisions],
  );

  const undo = useCallback(() => {
    const p = pendingRef.current;
    if (!p) return;
    setDecisions((prev) => ({ ...prev, [p.id]: { ...prev[p.id], state: p.previous } }));
    setPending(null);
    if (undoTimer.current) clearTimeout(undoTimer.current);
  }, [setDecisions]);

  const value = useMemo(
    () => ({ spaces, addSpace, updateSpace, brand, setBrand, mode, setMode, items, decide, pending, undo, projects, addProject, updateProject, docs, addDoc, moveDoc, snoozed, snooze, notes, saveNote, removeNote, agendas, saveAgenda, newTasks, addTask, agendaOpenFor, openAgenda, tasks, editTask, styles, saveStyles, dismissed, dismissTip }),
    [spaces, addSpace, updateSpace, brand, setBrand, mode, setMode, items, decide, pending, undo, projects, addProject, updateProject, docs, addDoc, moveDoc, snoozed, snooze, notes, saveNote, removeNote, agendas, saveAgenda, newTasks, addTask, agendaOpenFor, openAgenda, tasks, editTask, styles, saveStyles, dismissed, dismissTip],
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
