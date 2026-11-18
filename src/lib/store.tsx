"use client";
// Prototype state: appearance, sign-off decisions with undo, projects from templates.
// In-memory only; a real build moves this to the database.
// © 2026 RidgeFront. All rights reserved.
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { clients, localToday, setHiddenClients, setToday, signoffItems as seedItems, tasks as seedTasks, TODAY } from "./data";
import { aid, daysLeft, HK_EMPTY, HK_STORAGE, keyOf, ME, plural, UNDO_KINDS, type Activity, type HKAction, type HKKind, type HKState, type Ref, type TrashEntry } from "./housekeeping";
import type { SignoffItem, SignoffState } from "./types";
import { migrate, noteSeed, type Note } from "./notes";
import { agendaSeed, type Agenda } from "./agenda";
import { styleSeed, type Style } from "./coach";
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
  /** Today's date (YYYY-MM-DD, local). Re-renders consumers when the real date is applied or the day rolls over. */
  today: string;
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

  // Housekeeping. The lists above leave out anything archived or in Trash, and anything in an
  // archived or deleted client workspace. The all* lists keep archived items, for the
  // Archived views and for an archived workspace's own pages; only Trash and purged are gone.
  /** Every sign-off record, deleted workspaces included: Review records are never deleted. */
  allItems: SignoffItem[];
  allTasks: Task[];
  allNotes: Note[];
  allProjects: Project[];
  allDocs: FiledDoc[];
  renameDoc: (id: string, name: string) => void;
  hk: HKState;
  isArchived: (kind: HKKind, id: string) => boolean;
  /** In Trash or deleted for good. */
  isGone: (kind: HKKind, id: string) => boolean;
  workspaceState: (clientId: string) => "live" | "archived" | "trashed" | "purged";
  archive: (refs: Ref[]) => void;
  unarchive: (refs: Ref[]) => void;
  /** Move to Trash. Tasks and notes get an undo toast; the rest were confirmed first. */
  trash: (refs: Ref[], radius?: string, detail?: string) => void;
  restore: (keys: string[]) => void;
  purge: (keys: string[]) => void;
  rename: (kind: HKKind, id: string, name: string) => void;
  /** The name you gave an item Baton doesn't own (a chat, a pinned file), or its own. */
  nameOf: (kind: HKKind, id: string, fallback: string) => string;
  hkToast: HKToast | null;
  dismissHkToast: () => void;
}

export interface HKToast { label: string; expires: number; undo?: () => void }

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
  // Use the real date. Applied in a layout effect so it lands before any child's effects
  // read TODAY, and rechecked every minute so an open tab rolls over at midnight.
  const [today, setTodayState] = useState(TODAY);
  useLayoutEffect(() => {
    const apply = () => { const d = localToday(); setToday(d); setTodayState(d); };
    apply();
    const t = setInterval(apply, 60_000);
    return () => clearInterval(t);
  }, []);
  const [mode, setModeState] = useState<Mode>("light");
  const [allItems, setItems] = useState<SignoffItem[]>(seedItems);
  const [pending, setPending] = useState<Pending | null>(null);
  const [spaces, setSpaces] = useState<Space[]>([]);
  useEffect(() => { try { const raw = localStorage.getItem("baton-spaces-v1"); if (raw) setSpaces(JSON.parse(raw)); } catch {} }, []);
  const addSpace = useCallback((space: Space) => setSpaces(all => { const next = [...all, space]; try { localStorage.setItem("baton-spaces-v1", JSON.stringify(next)); } catch {} return next; }), []);
  const updateSpace = useCallback((id: string, patch: Partial<Space>) => setSpaces(all => { const next = all.some(s => s.id === id) ? all.map(s => s.id === id ? { ...s, ...patch } : s) : [...all, { id, ...patch } as Space]; try { localStorage.setItem("baton-spaces-v1", JSON.stringify(next)); } catch {} return next; }), []);
  const [allProjects, setProjects] = useState<Project[]>([]);
  useEffect(() => { try { const saved = localStorage.getItem("baton-projects-v1"); if (saved) setProjects(JSON.parse(saved)); } catch {} }, []);
  const [allDocs, setDocs] = useState<FiledDoc[]>([]);
  useEffect(() => { try { const raw = localStorage.getItem("baton-docs-v1"); if (raw) setDocs(JSON.parse(raw)); } catch {} }, []);
  const persistDocs = (next: FiledDoc[]) => { try { localStorage.setItem("baton-docs-v1", JSON.stringify(next)); } catch {} return next; };
  const [snoozed, setSnoozed] = useState<Record<string, string>>({});
  const [allNotes, setNotes] = useState<Note[]>(noteSeed);
  // Notes are kept on this device in the prototype; the build stores them per client.
  useEffect(() => {
    try { const raw = localStorage.getItem("baton-notes-v1"); if (raw) setNotes((JSON.parse(raw) as unknown[]).map(migrate)); } catch {}
  }, []);
  const persist = (next: Note[]) => { try { localStorage.setItem("baton-notes-v1", JSON.stringify(next)); } catch {} return next; };
  const saveNote = useCallback((n: Note) => setNotes((all) => persist(all.some((x) => x.id === n.id) ? all.map((x) => (x.id === n.id ? n : x)) : [n, ...all])), []);
  const removeNote = useCallback((id: string) => setNotes((all) => persist(all.filter((x) => x.id !== id))), []);
  const [agendas, setAgendas] = useState<Agenda[]>(agendaSeed);
  const [newTasks, setNewTasks] = useState<Task[]>([]);
  const [agendaOpenFor, openAgenda] = useState<string | null>(null);
  const [taskEdits, setTaskEdits] = useState<Record<string, Partial<Task>>>({});
  useEffect(() => { try { const raw = localStorage.getItem("baton-taskedits-v1"); if (raw) setTaskEdits(JSON.parse(raw)); } catch {} }, []);
  const editTask = useCallback((id: string, patch: Partial<Task>) => setTaskEdits((all) => {
    const next = { ...all, [id]: { ...all[id], ...patch } };
    try { localStorage.setItem("baton-taskedits-v1", JSON.stringify(next)); } catch {}
    return next;
  }), []);
  const [styles, setStyles] = useState<Style[]>(styleSeed);
  const [dismissed, setDismissed] = useState<Record<string, string>>({});
  useEffect(() => {
    try { const raw = localStorage.getItem("baton-styles-v1"); if (raw) setStyles(JSON.parse(raw)); } catch {}
    try { const raw = localStorage.getItem("baton-dismissed-v1"); if (raw) setDismissed(JSON.parse(raw)); } catch {}
  }, []);
  const saveStyles = useCallback((s: Style[]) => { setStyles(s); try { localStorage.setItem("baton-styles-v1", JSON.stringify(s)); } catch {} }, []);
  const dismissTip = useCallback((id: string) => setDismissed((all) => {
    const next = { ...all, [id]: new Date().toISOString() };
    try { localStorage.setItem("baton-dismissed-v1", JSON.stringify(next)); } catch {}
    return next;
  }), []);
  const allTasks = useMemo(() => [...seedTasks, ...newTasks].map((t) => (taskEdits[t.id] ? { ...t, ...taskEdits[t.id] } : t)), [newTasks, taskEdits]);
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
  const addDoc = useCallback((d: FiledDoc) => setDocs((all) => persistDocs([d, ...all])), []);
  const moveDoc = useCallback((id: string, clientId: string) => setDocs((all) => persistDocs(all.map((d) => (d.id === id ? { ...d, clientId } : d)))), []);
  const renameDoc = useCallback((id: string, name: string) => setDocs((all) => persistDocs(all.map((d) => (d.id === id ? { ...d, name } : d)))), []);
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

  const addProject = useCallback((p: Project) => setProjects((prev) => { const next = [p, ...prev]; try { localStorage.setItem("baton-projects-v1", JSON.stringify(next)); } catch {} return next; }), []);
  const updateProject = useCallback((id: string, patch: Partial<Project>) => setProjects((prev) => { const next = prev.map((p) => (p.id === id ? { ...p, ...patch } : p)); try { localStorage.setItem("baton-projects-v1", JSON.stringify(next)); } catch {} return next; }), []);

  // ---- Housekeeping ----
  const [hk, setHk] = useState<HKState>(HK_EMPTY);
  const saveHk = useCallback((fn: (s: HKState) => HKState) => setHk((s) => {
    const next = fn(s);
    try { localStorage.setItem(HK_STORAGE, JSON.stringify(next)); } catch {}
    return next;
  }), []);
  const [hkToast, setHkToast] = useState<HKToast | null>(null);
  const hkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toast = useCallback((label: string, undo?: () => void) => {
    if (hkTimer.current) clearTimeout(hkTimer.current);
    setHkToast({ label, undo, expires: Date.now() + UNDO_SECONDS * 1000 });
    hkTimer.current = setTimeout(() => setHkToast(null), UNDO_SECONDS * 1000);
  }, []);
  const dismissHkToast = useCallback(() => { if (hkTimer.current) clearTimeout(hkTimer.current); setHkToast(null); }, []);
  const entry = (action: HKAction, r: Ref, detail?: string, who = ME): Activity =>
    ({ id: aid(), at: new Date().toISOString(), who, action, kind: r.kind, name: r.name, clientId: r.clientId, detail });

  /** Delete for good what Baton owns. Seed data stays in the code but is hidden by its purged key. */
  const removeOwned = useCallback((refs: Ref[]) => {
    const ids = (k: HKKind) => new Set(refs.filter((r) => r.kind === k).map((r) => r.id));
    const ws = ids("workspace"), pr = ids("project"), nt = ids("note"), tk = ids("task"), fl = ids("file");
    if (ws.size) setSpaces((all) => { const next = all.filter((x) => !ws.has(x.id)); try { localStorage.setItem("baton-spaces-v1", JSON.stringify(next)); } catch {} return next; });
    setProjects((all) => { const next = all.filter((x) => !pr.has(x.id) && !ws.has(x.clientId)); try { localStorage.setItem("baton-projects-v1", JSON.stringify(next)); } catch {} return next; });
    setNotes((all) => persist(all.filter((x) => !nt.has(x.id) && !ws.has(x.clientId))));
    setNewTasks((all) => { const next = all.filter((x) => !tk.has(x.id) && !ws.has(x.clientId)); try { localStorage.setItem("baton-newtasks-v1", JSON.stringify(next)); } catch {} return next; });
    setDocs((all) => persistDocs(all.filter((x) => !fl.has(x.id) && !ws.has(x.clientId))));
  }, []);

  // Load, then purge anything that has sat in Trash for 30 days. Declared after the other
  // loads so the purge filters what they loaded.
  useEffect(() => {
    let saved: HKState = HK_EMPTY;
    try { const raw = localStorage.getItem(HK_STORAGE); if (raw) saved = { ...HK_EMPTY, ...JSON.parse(raw) }; } catch {}
    const expired = saved.trash.filter((t) => daysLeft(t.deletedAt) === 0);
    if (expired.length) {
      saved = {
        ...saved,
        trash: saved.trash.filter((t) => !expired.includes(t)),
        purged: [...saved.purged, ...expired.map((t) => t.key)],
        activity: [...expired.map((t) => entry("purged after 30 days", t, undefined, "Baton")), ...saved.activity],
      };
      removeOwned(expired);
      try { localStorage.setItem(HK_STORAGE, JSON.stringify(saved)); } catch {}
    }
    setHk(saved);
  }, [removeOwned]); // eslint-disable-line react-hooks/exhaustive-deps

  const trashKeys = useMemo(() => new Set(hk.trash.map((t) => t.key)), [hk.trash]);
  const purgedKeys = useMemo(() => new Set(hk.purged), [hk.purged]);
  const isGone = useCallback((kind: HKKind, id: string) => { const k = keyOf(kind, id); return trashKeys.has(k) || purgedKeys.has(k); }, [trashKeys, purgedKeys]);
  const isArchived = useCallback((kind: HKKind, id: string) => !!hk.archived[keyOf(kind, id)], [hk.archived]);
  const workspaceState = useCallback((clientId: string) => {
    const k = keyOf("workspace", clientId);
    return purgedKeys.has(k) ? "purged" : trashKeys.has(k) ? "trashed" : hk.archived[k] ? "archived" : "live";
  }, [purgedKeys, trashKeys, hk.archived]) as Store["workspaceState"];
  /** Usable at all: not in Trash, not purged, and neither is its workspace. */
  const kept = useCallback((kind: HKKind, id: string, clientId?: string) => !isGone(kind, id) && !(clientId && isGone("workspace", clientId)), [isGone]);
  /** Shown in everyday lists: kept, not archived, and its workspace not archived. */
  const shown = useCallback((kind: HKKind, id: string, clientId?: string) => kept(kind, id, clientId) && !isArchived(kind, id) && !(clientId && isArchived("workspace", clientId)), [kept, isArchived]);

  // Cross-client views read this without asking the store. Set during render so it is current
  // before any child reads it.
  setHiddenClients(clients.filter((c) => workspaceState(c.id) !== "live").map((c) => c.id));

  const items = useMemo(() => allItems.filter((i) => shown("workspace", i.clientId, i.clientId)), [allItems, shown]);
  const keptTasks = useMemo(() => allTasks.filter((t) => kept("task", t.id, t.clientId)), [allTasks, kept]);
  const tasks = useMemo(() => allTasks.filter((t) => shown("task", t.id, t.clientId)), [allTasks, shown]);
  const keptNotes = useMemo(() => allNotes.filter((n) => kept("note", n.id, n.clientId)), [allNotes, kept]);
  const notes = useMemo(() => allNotes.filter((n) => shown("note", n.id, n.clientId)), [allNotes, shown]);
  const keptProjects = useMemo(() => allProjects.filter((p) => kept("project", p.id, p.clientId)), [allProjects, kept]);
  const projects = useMemo(() => allProjects.filter((p) => shown("project", p.id, p.clientId)), [allProjects, shown]);
  const keptDocs = useMemo(() => allDocs.filter((d) => kept("file", d.id, d.clientId)), [allDocs, kept]);
  const docs = useMemo(() => allDocs.filter((d) => shown("file", d.id, d.clientId)), [allDocs, shown]);

  const unarchiveNow = useCallback((refs: Ref[]) => saveHk((s) => {
    const archived = { ...s.archived };
    refs.forEach((r) => delete archived[keyOf(r.kind, r.id)]);
    return { ...s, archived, activity: [...refs.map((r) => entry("unarchived", r)), ...s.activity] };
  }), [saveHk]); // eslint-disable-line react-hooks/exhaustive-deps
  const archive = useCallback((refs: Ref[]) => {
    if (!refs.length) return;
    const at = new Date().toISOString();
    saveHk((s) => ({ ...s, archived: { ...s.archived, ...Object.fromEntries(refs.map((r) => [keyOf(r.kind, r.id), at])) }, activity: [...refs.map((r) => entry("archived", r)), ...s.activity] }));
    toast(refs.length === 1 ? `Archived ${refs[0].name}` : `Archived ${plural(refs.length, "item")}`, () => unarchiveNow(refs));
  }, [saveHk, toast, unarchiveNow]); // eslint-disable-line react-hooks/exhaustive-deps
  const unarchive = useCallback((refs: Ref[]) => { if (refs.length) { unarchiveNow(refs); toast(refs.length === 1 ? `${refs[0].name} is back` : `${plural(refs.length, "item")} are back`); } }, [unarchiveNow, toast]);

  const restore = useCallback((keys: string[]) => saveHk((s) => {
    const back = s.trash.filter((t) => keys.includes(t.key));
    return { ...s, trash: s.trash.filter((t) => !keys.includes(t.key)), activity: [...back.map((t) => entry("restored", t)), ...s.activity] };
  }), [saveHk]); // eslint-disable-line react-hooks/exhaustive-deps
  const trash = useCallback((refs: Ref[], radius?: string, detail?: string) => {
    if (!refs.length) return;
    const at = new Date().toISOString();
    const added: TrashEntry[] = refs.map((r) => ({ ...r, key: keyOf(r.kind, r.id), deletedAt: at, radius: refs.length === 1 ? radius : undefined }));
    saveHk((s) => ({ ...s, trash: [...added, ...s.trash.filter((t) => !added.some((a) => a.key === t.key))], activity: [...refs.map((r) => entry("deleted", r, detail)), ...s.activity] }));
    const label = refs.length === 1 ? `Deleted ${refs[0].name}` : `Deleted ${plural(refs.length, "item")}`;
    const small = refs.every((r) => UNDO_KINDS.includes(r.kind));
    toast(small ? label : `${label}. It's in Trash for 30 days`, () => restore(added.map((a) => a.key)));
  }, [saveHk, toast, restore]); // eslint-disable-line react-hooks/exhaustive-deps
  const purge = useCallback((keys: string[]) => {
    const gone = hk.trash.filter((t) => keys.includes(t.key));
    if (!gone.length) return;
    saveHk((s) => ({ ...s, trash: s.trash.filter((t) => !keys.includes(t.key)), purged: [...new Set([...s.purged, ...gone.map((t) => t.key)])], activity: [...gone.map((t) => entry("deleted forever", t)), ...s.activity] }));
    removeOwned(gone);
    toast(gone.length === 1 ? `${gone[0].name} is gone for good` : `${plural(gone.length, "item")} gone for good`);
  }, [hk.trash, saveHk, removeOwned, toast]); // eslint-disable-line react-hooks/exhaustive-deps
  const rename = useCallback((kind: HKKind, id: string, name: string) => saveHk((s) => {
    const k = keyOf(kind, id);
    const before = s.renames[k];
    if (!name.trim() || before === name.trim()) return s;
    return { ...s, renames: { ...s.renames, [k]: name.trim() }, activity: [entry("renamed", { kind, id, name: name.trim() }, before ? `was ${before}` : undefined), ...s.activity] };
  }), [saveHk]); // eslint-disable-line react-hooks/exhaustive-deps
  const nameOf = useCallback((kind: HKKind, id: string, fallback: string) => hk.renames[keyOf(kind, id)] ?? fallback, [hk.renames]);

  const value = useMemo(
    () => ({ today, spaces, addSpace, updateSpace, brand, setBrand, mode, setMode, items, decide, pending, undo, projects, addProject, updateProject, docs, addDoc, moveDoc, snoozed, snooze, notes, saveNote, removeNote, agendas, saveAgenda, newTasks, addTask, agendaOpenFor, openAgenda, tasks, editTask, styles, saveStyles, dismissed, dismissTip,
      allItems, allTasks: keptTasks, allNotes: keptNotes, allProjects: keptProjects, allDocs: keptDocs, renameDoc, hk, isArchived, isGone, workspaceState, archive, unarchive, trash, restore, purge, rename, nameOf, hkToast, dismissHkToast }),
    [today, spaces, addSpace, updateSpace, brand, setBrand, mode, setMode, items, decide, pending, undo, projects, addProject, updateProject, docs, addDoc, moveDoc, snoozed, snooze, notes, saveNote, removeNote, agendas, saveAgenda, newTasks, addTask, agendaOpenFor, tasks, editTask, styles, saveStyles, dismissed, dismissTip,
      allItems, keptTasks, keptNotes, keptProjects, keptDocs, renameDoc, hk, isArchived, isGone, workspaceState, archive, unarchive, trash, restore, purge, rename, nameOf, hkToast, dismissHkToast],
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
