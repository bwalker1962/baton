"use client";
// Shared housekeeping controls: the ⋯ menu on any item, delete confirms that show the blast
// radius, the undo toast, multi-select with a bulk bar, and the Archived toggle.
// © 2026 RidgeFront. All rights reserved.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getClient, topics } from "@/lib/data";
import { useStore } from "@/lib/store";
import { downloadJson, KIND_LABEL, keyOf, radiusText, UNDO_KINDS, type Ref } from "@/lib/housekeeping";
import { Icon } from "./Icon";

/** Stable id for a pinned key file, which has no id of its own. */
export const keyFileId = (clientId: string, label: string) => `${clientId}/${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

/** What goes with an item when it is deleted, in words, plus a note about what stays. */
export function useRadius() {
  const { allProjects, allTasks, allNotes, allDocs, allItems, isGone } = useStore();
  return useCallback((r: Ref): { text: string; keeps?: string } => {
    if (r.kind === "workspace") {
      const c = getClient(r.id);
      const files = (c?.keyFiles.filter((f) => !isGone("file", keyFileId(r.id, f.label))).length ?? 0) + allDocs.filter((d) => d.clientId === r.id).length;
      const chats = topics.filter((t) => t.clientId === r.id && !isGone("chat", t.id)).length;
      const reviews = allItems.filter((i) => i.clientId === r.id && i.state !== "needs").length;
      return {
        text: radiusText([
          [allProjects.filter((p) => p.clientId === r.id).length, "project"],
          [allTasks.filter((t) => t.clientId === r.id).length, "task"],
          [files, "file"],
          [chats, "chat"],
          [allNotes.filter((n) => n.clientId === r.id).length, "note"],
        ]),
        keeps: reviews ? `${reviews} sign-off record${reviews === 1 ? "" : "s"} stay in the log.` : undefined,
      };
    }
    if (r.kind === "project") {
      const p = allProjects.find((x) => x.id === r.id);
      return { text: radiusText([[p?.steps.length ?? 0, "step"]]) };
    }
    if (r.kind === "file") return { text: "Only Baton's copy or link goes", keeps: "The file itself stays where it lives, in Drive, Moda or wherever it came from. Sign-off records for it are kept." };
    if (r.kind === "chat") return { text: "Its summary, decision and follow-ups go with it" };
    return { text: "Nothing else goes with it" };
  }, [allProjects, allTasks, allNotes, allDocs, allItems, isGone]);
}

/** Everything the browser holds for one workspace, as a download. A real build zips the files. */
export function useExportWorkspace() {
  const { allProjects, allTasks, allNotes, allDocs, allItems, nameOf, isGone } = useStore();
  return useCallback((clientId: string, name: string) => {
    const c = getClient(clientId);
    downloadJson(`${name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-export-${new Date().toISOString().slice(0, 10)}.json`, {
      exported: new Date().toISOString(),
      workspace: { id: clientId, name, website: c?.website },
      projects: allProjects.filter((p) => p.clientId === clientId),
      tasks: allTasks.filter((t) => t.clientId === clientId),
      notes: allNotes.filter((n) => n.clientId === clientId),
      chats: topics.filter((t) => t.clientId === clientId && !isGone("chat", t.id)).map((t) => ({ ...t, title: nameOf("chat", t.id, t.title) })),
      files: [
        ...(c?.keyFiles ?? []).filter((f) => !isGone("file", keyFileId(clientId, f.label))).map((f) => ({ name: nameOf("file", keyFileId(clientId, f.label), f.label), source: f.source, updated: f.updated, note: "Link only; the file lives in its source app" })),
        ...allDocs.filter((d) => d.clientId === clientId),
      ],
      signoffRecords: allItems.filter((i) => i.clientId === clientId).map((i) => ({ id: i.id, title: i.title, state: i.state, outcome: i.outcome, version: i.version })),
    });
  }, [allProjects, allTasks, allNotes, allDocs, allItems, nameOf, isGone]);
}

/** Confirm a delete. Names what goes with it; big deletes need the name typed. */
export function ConfirmDelete({ refs, onDone, typed }: { refs: Ref[]; onDone: () => void; typed?: boolean }) {
  const { trash } = useStore();
  const radius = useRadius();
  const exportWs = useExportWorkspace();
  const [text, setText] = useState("");
  const [exported, setExported] = useState(false);
  const one = refs.length === 1 ? refs[0] : null;
  const r = one ? radius(one) : null;
  const needsTyping = !!typed && !!one;
  const ok = !needsTyping || text.trim().toLowerCase() === one!.name.trim().toLowerCase();
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onDone();
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [onDone]);
  const go = () => {
    if (!ok) return;
    trash(refs, r?.text, r?.keeps);
    onDone();
  };
  const title = one ? `Delete ${one.name}?` : `Delete ${refs.length} items?`;
  return (
    <div className="backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onDone(); }}>
      <form className="sheet fade" role="alertdialog" aria-modal="true" aria-label={title} onSubmit={(e) => { e.preventDefault(); go(); }}>
        <h2 style={{ margin: 0, fontSize: 19 }}>{title}</h2>
        {r ? <p style={{ margin: 0 }}><strong>{r.text}.</strong>{r.keeps ? <> {r.keeps}</> : null}</p>
          : <p style={{ margin: 0 }}>{refs.map((x) => x.name).slice(0, 6).join(", ")}{refs.length > 6 ? `, and ${refs.length - 6} more` : ""}.</p>}
        <p className="muted small" style={{ margin: 0 }}>It goes to Trash, under Settings, where you can restore it for 30 days. Nothing outside Baton is touched.</p>
        {one?.kind === "workspace" && (
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", background: "var(--surface-2)", borderRadius: 10, padding: 10 }}>
            <span className="small grow">Take a copy first: notes, tasks, projects, chats, the file list and sign-off records.</span>
            <button type="button" className="btn" onClick={() => { exportWs(one.id, one.name); setExported(true); }}>{exported ? "Exported" : "Export first"}</button>
          </div>
        )}
        {needsTyping && (
          <label className="small" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            Type <strong>{one!.name}</strong> to confirm
            <input className="input" autoFocus value={text} onChange={(e) => setText(e.target.value)} aria-label={`Type ${one!.name} to confirm`} autoComplete="off" />
          </label>
        )}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button type="button" className="btn" onClick={onDone} autoFocus={!needsTyping}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={!ok}>Move to Trash</button>
        </div>
      </form>
    </div>
  );
}

/** Delete with the right amount of friction: undo for small things, confirm for the rest. */
export function useDelete() {
  const { trash } = useStore();
  const [asking, setAsking] = useState<{ refs: Ref[]; typed?: boolean } | null>(null);
  const del = useCallback((refs: Ref[]) => {
    if (!refs.length) return;
    if (refs.every((r) => UNDO_KINDS.includes(r.kind))) trash(refs);
    else setAsking({ refs, typed: refs.some((r) => r.kind === "workspace") });
  }, [trash]);
  const dialog = asking ? <ConfirmDelete refs={asking.refs} typed={asking.typed} onDone={() => setAsking(null)} /> : null;
  return { del, dialog };
}

/** The ⋯ menu on an item: rename, archive or bring back, move, delete. */
export function ItemMenu({ item, onRename, moveTo, onMove, compact }: {
  item: Ref; onRename?: (name: string) => void; moveTo?: { id: string; name: string }[]; onMove?: (clientId: string) => void; compact?: boolean;
}) {
  const { archive, unarchive, isArchived } = useStore();
  const { del, dialog } = useDelete();
  const [open, setOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(item.name);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const archived = isArchived(item.kind, item.id);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) { setOpen(false); setRenaming(false); } };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); setRenaming(false); } };
    const shut = () => { setOpen(false); setRenaming(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    window.addEventListener("scroll", shut, true);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc); window.removeEventListener("scroll", shut, true); };
  }, [open]);
  const stop = (e: React.SyntheticEvent) => { e.preventDefault(); e.stopPropagation(); };
  const label = KIND_LABEL[item.kind].toLowerCase();
  const others = (moveTo ?? []).filter((m) => m.id !== item.clientId);
  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }} onClick={(e) => e.stopPropagation()}>
      <button type="button" className="btn hk-more" aria-haspopup="menu" aria-expanded={open} aria-label={`More actions for ${item.name}`} title="Rename, archive, delete"
        style={{ minHeight: 32, padding: compact ? "0 6px" : "0 10px" }}
        onClick={(e) => {
          stop(e);
          const r = e.currentTarget.getBoundingClientRect();
          const top = r.bottom + 6 + 260 > window.innerHeight ? Math.max(8, r.top - 266) : r.bottom + 6;
          setPos({ top, left: Math.max(8, Math.min(r.right - 230, window.innerWidth - 238)) });
          setName(item.name); setRenaming(false); setOpen((o) => !o);
        }}>⋯</button>
      {open && (
        <div role="menu" className="card fade hk-menu" style={{ top: pos?.top, left: pos?.left }}>
          {renaming && onRename ? (
            <form onSubmit={(e) => { e.preventDefault(); if (name.trim()) onRename(name.trim()); setOpen(false); setRenaming(false); }} style={{ display: "flex", flexDirection: "column", gap: 6, padding: 4 }}>
              <input className="input" autoFocus value={name} onChange={(e) => setName(e.target.value)} aria-label={`New name for ${item.name}`} />
              <span style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                <button type="button" className="btn" style={{ minHeight: 30 }} onClick={() => setRenaming(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ minHeight: 30 }}>Rename</button>
              </span>
            </form>
          ) : (
            <>
              {onRename && <button role="menuitem" className="hk-item" onClick={() => setRenaming(true)}>Rename</button>}
              {archived
                ? <button role="menuitem" className="hk-item" onClick={() => { unarchive([item]); setOpen(false); }}>Unarchive</button>
                : <button role="menuitem" className="hk-item" onClick={() => { archive([item]); setOpen(false); }}>Archive <span className="muted xs">hide, keep everything</span></button>}
              {onMove && others.length > 0 && (
                <label className="hk-item" style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  Move to
                  <select className="input" style={{ padding: "4px 6px" }} value="" aria-label={`Move ${item.name} to`} onChange={(e) => { if (e.target.value) { onMove(e.target.value); setOpen(false); } }}>
                    <option value="">Choose…</option>
                    {others.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </label>
              )}
              <button role="menuitem" className="hk-item hk-danger" onClick={() => { setOpen(false); del([item]); }}>Delete {label}</button>
            </>
          )}
        </div>
      )}
      {dialog}
    </div>
  );
}

/** Multi-select for a list. Selection clears when the list changes under it. */
export function useSelection(ids: string[]) {
  const [picked, setPicked] = useState<string[]>([]);
  const idKey = ids.join("|");
  useEffect(() => { setPicked((p) => p.filter((x) => ids.includes(x))); }, [idKey]); // eslint-disable-line react-hooks/exhaustive-deps
  return useMemo(() => ({
    picked,
    has: (id: string) => picked.includes(id),
    toggle: (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id])),
    all: picked.length > 0 && picked.length === ids.length,
    toggleAll: () => setPicked((p) => (p.length === ids.length ? [] : [...ids])),
    clear: () => setPicked([]),
  }), [picked, idKey]); // eslint-disable-line react-hooks/exhaustive-deps
}

export function SelectBox({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <input type="checkbox" className="hk-check" checked={checked} aria-label={label}
      onClick={(e) => e.stopPropagation()} onChange={onChange} />
  );
}

/** Shown while anything is selected: archive, move or delete them all at once. */
export function BulkBar({ refs, onClear, moveTo, onMove, archived }: {
  refs: Ref[]; onClear: () => void; moveTo?: { id: string; name: string }[]; onMove?: (clientId: string) => void; archived?: boolean;
}) {
  const { archive, unarchive } = useStore();
  const { del, dialog } = useDelete();
  if (!refs.length) return null;
  return (
    <div className="hk-bulk fade" role="toolbar" aria-label="Selected items">
      <strong className="small">{refs.length} selected</strong>
      {archived
        ? <button className="btn" onClick={() => { unarchive(refs); onClear(); }}>Unarchive</button>
        : <button className="btn" onClick={() => { archive(refs); onClear(); }}>Archive</button>}
      {onMove && moveTo && moveTo.length > 0 && (
        <select className="input" style={{ width: "auto", padding: "6px 8px" }} value="" aria-label="Move selected to" onChange={(e) => { if (e.target.value) { onMove(e.target.value); onClear(); } }}>
          <option value="">Move to…</option>
          {moveTo.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      )}
      <button className="btn btn-danger" onClick={() => { del(refs); onClear(); }}>Delete</button>
      <button className="btn" onClick={onClear} style={{ marginLeft: "auto" }}>Clear</button>
      {dialog}
    </div>
  );
}

/** "Archived · 3": shows the archived items of a list in place. */
export function ArchivedToggle({ count, on, onChange }: { count: number; on: boolean; onChange: (v: boolean) => void }) {
  if (!count && !on) return null;
  return (
    <button className="btn" style={{ minHeight: 32 }} aria-pressed={on} onClick={() => onChange(!on)}>
      <Icon name="layers" size={15} />{on ? "Hide archived" : `Archived · ${count}`}
    </button>
  );
}

/** The undo toast for archive and delete. */
export function HKToastView({ raised }: { raised?: boolean }) {
  const { hkToast, dismissHkToast } = useStore();
  if (!hkToast) return null;
  return (
    <div className="toast fade" role="status" style={raised ? { bottom: 84 } : undefined}>
      <span className="small">{hkToast.label}.</span>
      {hkToast.undo && <button onClick={() => { hkToast.undo!(); dismissHkToast(); }}>Undo</button>}
    </div>
  );
}

export const refKey = (r: Ref) => keyOf(r.kind, r.id);
