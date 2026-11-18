"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSpaces } from "@/app/spaces/page";

type Session = { id:string; task:string; spaceId:string; started:number; ended:number };
type Running = { task:string; spaceId:string; started:number };
const KEY="baton-time-v1";
const format=(ms:number)=>{const sec=Math.floor(Math.max(0,ms)/1000);return [Math.floor(sec/3600),Math.floor(sec%3600/60),sec%60].map(n=>String(n).padStart(2,"0")).join(":");};
export function WorkTimer(){
 const spaces=useSpaces();
 const [open,setOpen]=useState(false);
 const [ready,setReady]=useState(false);
 const [task,setTask]=useState("");
 const [spaceId,setSpaceId]=useState("personal");
 const [running,setRunning]=useState<Running|null>(null);
 const [sessions,setSessions]=useState<Session[]>([]);
 const [now,setNow]=useState(0);
 useEffect(()=>{try{const raw=localStorage.getItem(KEY);if(raw){const data=JSON.parse(raw);setRunning(data.running??null);setSessions(Array.isArray(data.sessions)?data.sessions:[]);}}catch{}setNow(Date.now());setReady(true);},[]);
 useEffect(()=>{if(!ready)return;try{localStorage.setItem(KEY,JSON.stringify({running,sessions}));}catch{}},[ready,running,sessions]);
 useEffect(()=>{if(!running)return;const t=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(t);},[running]);
 const start=()=>{if(!task.trim())return;setRunning({task:task.trim(),spaceId,started:Date.now()});setNow(Date.now());setOpen(false);};
 const stop=()=>{if(!running)return;const ended=Date.now();setSessions(old=>[{id:crypto.randomUUID(),...running,ended},...old]);setRunning(null);setOpen(true);};
 const download=()=>{const rows=[["Date","Space","Task","Start","Finish","Minutes"],...sessions.map(s=>[new Date(s.started).toLocaleDateString("en-CA"),spaces.find(x=>x.id===s.spaceId)?.name??s.spaceId,s.task,new Date(s.started).toISOString(),new Date(s.ended).toISOString(),String(Math.round((s.ended-s.started)/60000))])];const csv=rows.map(row=>row.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(",")).join("\r\n");const url=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));const a=document.createElement("a");a.href=url;a.download="baton-time-log.csv";a.click();URL.revokeObjectURL(url);};
 return <div className="baton-timer-wrap">
 <button className={`baton-timer-trigger ${running?"is-running":""}`} onClick={()=>setOpen(v=>!v)} aria-expanded={open} aria-label={running?"Open running work timer":"Open work timer"}><span aria-hidden="true">{running?"●":"◷"}</span><span>{running?format(now-running.started):"Timer"}</span></button>
 {open&&<div className="baton-timer-panel">
 <div className="baton-timer-title"><strong>Work timer</strong><button onClick={()=>setOpen(false)} aria-label="Close timer">×</button></div>
 {running?<><div className="baton-timer-clock">{format(now-running.started)}</div><strong>{running.task}</strong><p className="muted small">{spaces.find(s=>s.id===running.spaceId)?.name??"Personal"}</p><button className="btn btn-primary" onClick={stop}>Finish & log time</button></>:<>
 <label>What are you working on?<input className="input" value={task} onChange={e=>setTask(e.target.value)} placeholder="Task or project" /></label>
 <label>Space<select className="input" value={spaceId} onChange={e=>setSpaceId(e.target.value)}>{spaces.filter(s=>!s.archived).map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
 <button className="btn btn-primary" disabled={!task.trim()} onClick={start}>Start timer</button>
 </>}
 <div className="baton-timer-log"><strong>Recent sessions</strong>{sessions.slice(0,5).map(s=><div key={s.id}><span>{s.task}<small>{spaces.find(x=>x.id===s.spaceId)?.name??s.spaceId}</small></span><strong>{format(s.ended-s.started)}</strong></div>)}{!sessions.length&&<p className="muted small">No time logged yet.</p>}{sessions.length>0&&<button className="btn" onClick={download}>Export CSV</button>}</div>
 <p className="muted small">Optional. Stored in this browser only.</p>
 </div>}
 </div>;
}
