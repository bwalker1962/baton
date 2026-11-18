"use client";
import Link from "next/link";
import { useState } from "react";
import { clients } from "@/lib/data";
import { useStore, type Space } from "@/lib/store";
import { ArchivedToggle, BulkBar, ItemMenu, SelectBox, useSelection } from "@/components/Housekeeping";
import type { Ref } from "@/lib/housekeeping";

const defaults: Space[] = [
  { id: "personal", name: "Personal", kind: "personal", color: "#64748b" },
  { id: "ridgefront", name: "RidgeFront", kind: "business", color: "#334155" },
  ...clients.map(c => ({ id: c.id, name: c.name, kind: "client" as const, color: c.color, website: c.website }))
];
/** Every space you can still reach: archived ones carry archived: true; ones in Trash are left out. */
export function useSpaces() {
  const { spaces, isGone, isArchived } = useStore();
  return [...defaults.map(d => ({ ...d, ...spaces.find(s => s.id === d.id) })), ...spaces.filter(s => !defaults.some(d => d.id === s.id))]
    .filter(s => !isGone("workspace", s.id))
    .map(s => ({ ...s, archived: !!s.archived || isArchived("workspace", s.id) }));
}
export default function SpacesPage() {
  const { projects, addSpace, updateSpace } = useStore();
  const spaces = useSpaces();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<Space["kind"]>("client");
  const [color, setColor] = useState("#4263a8");
  const [website, setWebsite] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const beginEdit = (s: Space) => { setEditing(s.id); setAdding(false); setName(s.name); setKind(s.kind); setColor(s.color); setWebsite(s.website ?? ""); };
  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const patch = { name: name.trim(), kind, color, website: website.trim() || undefined };
    if (editing) updateSpace(editing, { ...patch, id: editing });
    else addSpace({ ...patch, id: "space-" + crypto.randomUUID() });
    setAdding(false); setEditing(null); setName("");
  };
  const archived = spaces.filter(s => s.archived);
  const shown = spaces.filter(s => showArchived ? s.archived : !s.archived);
  const sel = useSelection(shown.map(s => s.id));
  const ref = (s: Space): Ref => ({ kind: "workspace", id: s.id, name: s.name, clientId: s.id });
  return <div className="baton-space-page">
    <div className="pagehead"><div><h1 className="title">Spaces</h1><p className="muted small">One home for each part of your work. Archive a space to drop it off Home and Today without losing anything.</p></div><span style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><ArchivedToggle count={archived.length} on={showArchived} onChange={setShowArchived} /><button className="btn btn-primary" onClick={() => { setAdding(true); setEditing(null); setName(""); setKind("client"); setColor("#4263a8"); setWebsite(""); }}>+ New space</button></span></div>
    {(adding || editing) && <form className="card baton-space-editor" onSubmit={save}>
      <h2>{editing ? "Edit space" : "New space"}</h2>
      <label>Name<input className="input" required autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Space name" /></label>
      <label>Type<select className="input" value={kind} onChange={e => setKind(e.target.value as Space["kind"])}><option value="client">Client</option><option value="business">Business</option><option value="personal">Personal</option></select></label>
      <label>Color<input type="color" value={color} onChange={e => setColor(e.target.value)} /></label>
      <label>Website (optional)<input className="input" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://..." /></label>
      <div className="baton-space-actions"><button type="button" className="btn" onClick={() => {setAdding(false);setEditing(null);}}>Cancel</button><button className="btn btn-primary" type="submit">Save space</button></div>
    </form>}
    {showArchived && <p className="muted small" style={{ margin: 0 }}>Archived spaces. They stay off Home and Today until you unarchive them.</p>}
    {shown.length > 1 && <label className="small muted" style={{ display: "flex", gap: 8, alignItems: "center" }}><SelectBox checked={sel.all} onChange={sel.toggleAll} label="Select all spaces" />Select all</label>}
    <BulkBar refs={shown.filter(s => sel.has(s.id)).map(ref)} onClear={sel.clear} archived={showArchived} />
    <div className="baton-space-list">{shown.map(s => <div className={`card baton-space-line ${s.archived ? "hk-archived" : ""}`} key={s.id}>
      <SelectBox checked={sel.has(s.id)} onChange={() => sel.toggle(s.id)} label={`Select ${s.name}`} />
      <span className="baton-space-mark" style={{background:s.color}} aria-hidden="true">{s.name.slice(0,1).toUpperCase()}</span>
      <Link className="grow" href={`/spaces/${s.id}`}><strong>{s.name}</strong><span className="muted small">{s.kind} · {projects.filter(p=>p.clientId===s.id).length} projects{s.archived ? " · archived" : ""}</span></Link>
      <button className="btn" onClick={() => beginEdit(s)}>Edit</button>
      <ItemMenu item={ref(s)} onRename={(n) => updateSpace(s.id, { ...s, archived: undefined, name: n })} />
    </div>)}</div>
    {shown.length === 0 && <section className="card empty"><h3>{showArchived ? "Nothing archived" : "No spaces"}</h3></section>}
  </div>;
}
