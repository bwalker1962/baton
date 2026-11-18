"use client";
import Link from "next/link";
import { useState } from "react";
import { useSpaces } from "@/lib/spaces";
import { useStore, type Space } from "@/lib/store";

export default function SpacesPage() {
  const { projects, addSpace, updateSpace } = useStore();
  const spaces = useSpaces();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<Space["kind"]>("client");
  const [color, setColor] = useState("#4263a8");
  const [website, setWebsite] = useState("");
  const beginEdit = (s: Space) => { setEditing(s.id); setAdding(false); setName(s.name); setKind(s.kind); setColor(s.color); setWebsite(s.website ?? ""); };
  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const patch = { name: name.trim(), kind, color, website: website.trim() || undefined };
    if (editing) updateSpace(editing, { ...patch, id: editing });
    else addSpace({ ...patch, id: "space-" + crypto.randomUUID() });
    setAdding(false); setEditing(null); setName("");
  };
  return <div className="baton-space-page">
    <div className="pagehead"><div><h1 className="title">Spaces</h1><p className="muted small">One home for each part of your work.</p></div><button className="btn btn-primary" onClick={() => { setAdding(true); setEditing(null); setName(""); setKind("client"); setColor("#4263a8"); setWebsite(""); }}>+ New space</button></div>
    {(adding || editing) && <form className="card baton-space-editor" onSubmit={save}>
      <h2>{editing ? "Edit space" : "New space"}</h2>
      <label>Name<input className="input" required autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Space name" /></label>
      <label>Type<select className="input" value={kind} onChange={e => setKind(e.target.value as Space["kind"])}><option value="client">Client</option><option value="business">Business</option><option value="personal">Personal</option></select></label>
      <label>Color<input type="color" value={color} onChange={e => setColor(e.target.value)} /></label>
      <label>Website (optional)<input className="input" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://..." /></label>
      <div className="baton-space-actions"><button type="button" className="btn" onClick={() => {setAdding(false);setEditing(null);}}>Cancel</button><button className="btn btn-primary" type="submit">Save space</button></div>
    </form>}
    <div className="baton-space-list">{spaces.filter(s => !s.archived).map(s => <div className="card baton-space-line" key={s.id}>
      <span className="baton-space-mark" style={{background:s.color}} aria-hidden="true">{s.name.slice(0,1).toUpperCase()}</span>
      <Link className="grow" href={`/spaces/${s.id}`}><strong>{s.name}</strong><span className="muted small">{s.kind} · {projects.filter(p=>p.clientId===s.id).length} projects</span></Link>
      <button className="btn" onClick={() => beginEdit(s)}>Edit</button>
    </div>)}</div>
  </div>;
}
