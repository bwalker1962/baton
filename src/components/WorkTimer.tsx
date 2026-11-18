"use client";
import { useEffect, useRef, useState } from "react";
import { useSpaces } from "@/app/spaces/page";

type Session = { id:string; task:string; spaceId:string; started:number; ended:number; excludedMs?:number; note?:string };
type Running = { task:string; spaceId:string; started:number; pausedAt?:number; excludedMs:number; lastActive:number };
const KEY="baton-time-v1", IDLE_MS=10*60*1000;
const format=(ms:number)=>{const sec=Math.floor(Math.max(0,ms)/1000);return [Math.floor(sec/3600),Math.floor(sec%3600/60),sec%60].map(n=>String(n).padStart(2,"0")).join(":");};
const elapsed=(r:Running,now:number)=>Math.max(0,(r.pausedAt??now)-r.started-r.excludedMs);
export function WorkTimer(){
 const spaces=useSpaces();
 const [open,setOpen]=useState(false),[ready,setReady]=useState(false);
 const [task,setTask]=useState(""),[spaceId,setSpaceId]=useState("personal");
 const [running,setRunning]=useState<Running|null>(null),[sessions,setSessions]=useState<Session[]>([]);
 const [now,setNow]=useState(0),[review,setReview]=useState(false),[warning,setWarning]=useState("");
 const lastPersist=useRef(0);
 useEffect(()=>{try{const raw=localStorage.getItem(KEY);if(raw){const data=JSON.parse(raw);if(data.running){const r=data.running;setRunning({...r,excludedMs:r.excludedMs??0,lastActive:r.lastActive??r.started});}setSessions(Array.isArray(data.sessions)?data.sessions:[]);}}catch{setWarning("Saved timer data could not be read.");}setNow(Date.now());setReady(true);},[]);
 useEffect(()=>{if(!ready)return;try{localStorage.setItem(KEY,JSON.stringify({running,sessions}));}catch{setWarning("Timer data could not be saved in this browser.");}},[ready,running,sessions]);
 useEffect(()=>{if(!running)return;const t=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(t);},[running]);
 // Detect inactivity; never silently change billable time. Browser activity is only a hint.
 useEffect(()=>{if(!ready||!running||running.pausedAt)return;
 const check=()=>{const n=Date.now();if(n-running.lastActive>=IDLE_MS){setReview(true);setOpen(true);}};
 const activity=()=>{const n=Date.now();if(n-running.lastActive>=IDLE_MS){setReview(true);setOpen(true);return;}if(n-lastPersist.current>30000){lastPersist.current=n;setRunning(r=>r&&!r.pausedAt?{...r,lastActive:n}:r);}};
 const onVisible=()=>{if(document.visibilityState==="visible")check();};
 const t=setInterval(check,15000);
 window.addEventListener("pointerdown",activity);window.addEventListener("keydown",activity);window.addEventListener("focus",check);document.addEventListener("visibilitychange",onVisible);
 check();
 return()=>{clearInterval(t);window.removeEventListener("pointerdown",activity);window.removeEventListener("keydown",activity);window.removeEventListener("focus",check);document.removeEventListener("visibilitychange",onVisible);};
 },[ready,running?.started,running?.lastActive,running?.pausedAt]);
 const start=()=>{if(!task.trim()||running)return;const n=Date.now();setRunning({task:task.trim(),spaceId,started:n,lastActive:n,excludedMs:0});setNow(n);setReview(false);setOpen(false);};
 const keep=()=>{setRunning(r=>r?{...r,lastActive:Date.now()}:r);setReview(false);};
 const excludeIdle=()=>{setRunning(r=>r?{...r,excludedMs:r.excludedMs+Math.max(0,Date.now()-r.lastActive),lastActive:Date.now()}:r);setReview(false);};
 const pause=()=>{setRunning(r=>r&&!r.pausedAt?{...r,pausedAt:Date.now()}:r);setReview(false);};
 const resume=()=>{const n=Date.now();setRunning(r=>r&&r.pausedAt?{...r,excludedMs:r.excludedMs+n-r.pausedAt,pausedAt:undefined,lastActive:n}:r);setReview(false);};
 const stop=()=>{if(!running)return;const ended=running.pausedAt??Date.now();setSessions(old=>[{id:crypto.randomUUID(),task:running.task,spaceId:running.spaceId,started:running.started,ended,excludedMs:running.excludedMs},...old]);setRunning(null);setReview(false);setOpen(true);};
 const discard=()=>{if(!window.confirm("Discard this running timer without logging it?"))return;setRunning(null);setReview(false);};
 const download=()=>{const rows=[["Date","Space","Task","Start","Finish","Tracked minutes","Excluded minutes"],...sessions.map(s=>[new Date(s.started).toLocaleDateString("en-CA"),spaces.find(x=>x.id===s.spaceId)?.name??s.spaceId,s.task,new Date(s.started).toISOString(),new Date(s.ended).toISOString(),String(Math.round((s.ended-s.started-(s.excludedMs??0))/60000)),String(Math.round((s.excludedMs??0)/60000))])];const csv=rows.map(row=>row.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(",")).join("\r\n");const url=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));const a=document.createElement("a");a.href=url;a.download="baton-time-log.csv";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 const idle=running?Math.max(0,now-running.lastActive):0;
 return <div className="baton-timer-wrap">
 <button className={`baton-timer-trigger ${running?"is-running":""}`} onClick={()=>setOpen(v=>!v)} aria-expanded={open} aria-label={running?"Open running work timer":"Open work timer"}><span aria-hidden="true">{running?(running.pausedAt?"Ⅱ":"●"):"◷"}</span><span>{running?format(elapsed(running,now)):"Timer"}</span>{review&&<span aria-label="Needs review">!</span>}</button>
 {open&&<div className="baton-timer-panel" role="region" aria-label="Work timer">
 <div className="baton-timer-title"><strong>Work timer</strong><button onClick={()=>setOpen(false)} aria-label="Close timer">×</button></div>
 {warning&&<p role="alert" className="baton-timer-alert">{warning}</p>}
 {running?<><div className="baton-timer-clock">{format(elapsed(running,now))}</div><strong>{running.task}</strong><p className="muted small">{spaces.find(s=>s.id===running.spaceId)?.name??"Personal"}</p>
 {review&&!running.pausedAt&&<div className="baton-timer-alert" role="alert"><strong>Still working?</strong><p>No interaction detected for {Math.floor(idle/60000)} minutes. This may be a break or work away from the screen. Choose what to count.</p><div className="baton-timer-buttons"><button className="btn" onClick={keep}>Count all time</button><button className="btn" onClick={excludeIdle}>Exclude idle time</button><button className="btn" onClick={pause}>Pause now</button></div></div>}
 <div className="baton-timer-buttons">{running.pausedAt?<button className="btn btn-primary" onClick={resume}>Resume</button>:<button className="btn" onClick={pause}>Pause</button>}<button className="btn btn-primary" onClick={stop}>Finish & log</button><button className="btn" onClick={discard}>Discard</button></div>
 </>:<><label>What are you working on?<input className="input" value={task} onChange={e=>setTask(e.target.value)} placeholder="Task or project" /></label><label>Space<select className="input" value={spaceId} onChange={e=>setSpaceId(e.target.value)}>{spaces.filter(s=>!s.archived).map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label><button className="btn btn-primary" disabled={!task.trim()} onClick={start}>Start timer</button></>}
 <div className="baton-timer-log"><strong>Recent sessions</strong>{sessions.slice(0,5).map(s=><div key={s.id}><span>{s.task}<small>{spaces.find(x=>x.id===s.spaceId)?.name??s.spaceId}</small></span><strong>{format(s.ended-s.started-(s.excludedMs??0))}</strong></div>)}{!sessions.length&&<p className="muted small">No time logged yet.</p>}{sessions.length>0&&<button className="btn" onClick={download}>Export CSV</button>}</div>
 <p className="muted small">Idle detection is approximate. Your choices control logged time. Stored in this browser only.</p>
 </div>}
 </div>;
}
