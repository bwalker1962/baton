"use client";
import Link from "next/link";
import { use, useState } from "react";
import { useStore } from "@/lib/store";
import { useSpaces } from "@/lib/spaces";
export default function SpaceDetail({params}:{params:Promise<{id:string}>}) {
 const {id}=use(params); const {projects,addProject}=useStore(); const space=useSpaces().find(s=>s.id===id);
 const [name,setName]=useState("");
 if(!space) return <section className="card empty"><h2>Space not found</h2><Link href="/spaces">All spaces</Link></section>;
 const mine=projects.filter(p=>p.clientId===id);
 return <div className="baton-space-page">
 <div className="pagehead"><div><Link className="small muted" href="/spaces">Spaces</Link><h1 className="title">{space.name}</h1><span className="muted small">{space.kind}</span></div><Link className="btn" href="/spaces">Manage spaces</Link></div>
 <form className="card baton-space-quickadd" onSubmit={e=>{e.preventDefault();if(!name.trim())return;addProject({id:"p"+crypto.randomUUID(),clientId:id,templateId:"blank",name:name.trim(),info:{},steps:[],created:new Date().toISOString().slice(0,10),certainty:"confirmed"});setName("");}}>
 <input className="input grow" value={name} onChange={e=>setName(e.target.value)} placeholder="New project name…" aria-label="New project name" required/><button className="btn btn-primary">Create project</button></form>
 <section className="card"><div className="card-head"><h2>Projects</h2><span className="muted small">{mine.length}</span></div>{mine.length ? mine.map(p=><Link key={p.id} className="row" href={`/clients/${id}/projects/${p.id}`}><span className="grow"><strong>{p.name}</strong><span className="muted small" style={{display:"block"}}>{p.steps.filter(s=>s.status==="open").length} open steps</span></span><span>›</span></Link>):<p className="muted" style={{padding:"0 18px 16px"}}>No projects yet. Start one above.</p>}</section></div>;
}
