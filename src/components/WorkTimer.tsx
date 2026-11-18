"use client";
import { useEffect, useState } from "react";
import { useSpaces } from "@/app/spaces/page";
import { useStore } from "@/lib/store";

export const TIMER_KEY="baton-time-v2";
export const TIMER_START_EVENT="baton:start-timer";
export type TimerStart={taskId?:string;task:string;spaceId:string;projectId?:string};
type Timer={id:string;taskId?:string;task:string;spaceId:string;projectId?:string;started:number;pausedAt?:number;excludedMs:number;lastActive:number};
type Session=Timer & {ended:number};
type Data={running:Timer[];sessions:Session[]};
const empty:Data={running:[],sessions:[]};
const duration=(t:Timer,now:number)=>Math.max(0,(t.pausedAt??now)-t.started-t.excludedMs);
const clock=(ms:number)=>{const n=Math.floor(ms/1000);return [Math.floor(n/3600),Math.floor(n%3600/60),n%60].map(x=>String(x).padStart(2,"0")).join(":");};
function read():Data {try{const raw=localStorage.getItem(TIMER_KEY);if(raw){const d=JSON.parse(raw);return {running:Array.isArray(d.running)?d.running:[],sessions:Array.isArray(d.sessions)?d.sessions:[]};}
 const old=localStorage.getItem("baton-time-v1");if(old){const d=JSON.parse(old);return {running:d.running?[{...d.running,id:crypto.randomUUID(),excludedMs:d.running.excludedMs??0,lastActive:d.running.lastActive??d.running.started}]:[],sessions:Array.isArray(d.sessions)?d.sessions:[]};}}catch{}return empty;}
export function startTaskTimer(detail:TimerStart){window.dispatchEvent(new CustomEvent<TimerStart>(TIMER_START_EVENT,{detail}));}
export function WorkTimer(){
 const spaces=useSpaces();
 const {projects}=useStore();
 const [data,setData]=useState<Data>(empty),[ready,setReady]=useState(false),[open,setOpen]=useState(false);
 const [task,setTask]=useState(""),[spaceId,setSpaceId]=useState("personal"),[now,setNow]=useState(0);
 const [warning,setWarning]=useState(""),[review,setReview]=useState<string[]>([]);
 const [projectId,setProjectId]=useState("");
 useEffect(()=>{setData(read());setReady(true);setNow(Date.now());},[]);
 useEffect(()=>{if(!ready)return;try{localStorage.setItem(TIMER_KEY,JSON.stringify(data));window.dispatchEvent(new Event("baton:timers-changed"));}catch{setWarning("Unable to save timer data in this browser.");}},[data,ready]);
 useEffect(()=>{const t=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(t);},[]);
 useEffect(()=>{const onStart=(event:Event)=>{const d=(event as CustomEvent<TimerStart>).detail;if(!d?.task?.trim())return;const n=Date.now();setData(old=>({ ...old,running:[...old.running,{id:crypto.randomUUID(),taskId:d.taskId,task:d.task.trim(),spaceId:d.spaceId||"personal",projectId:d.projectId,started:n,lastActive:n,excludedMs:0}]}));setOpen(true);};window.addEventListener(TIMER_START_EVENT,onStart);return()=>window.removeEventListener(TIMER_START_EVENT,onStart);},[]);
 useEffect(()=>{if(!ready)return;const check=()=>{const n=Date.now();const ids=data.running.filter(t=>!t.pausedAt&&n-t.lastActive>=600000).map(t=>t.id);if(ids.length){setReview(ids);setOpen(true);}};const activity=()=>{const n=Date.now();const stale=data.running.some(t=>!t.pausedAt&&n-t.lastActive>=600000);if(stale){check();return;}setData(d=>({...d,running:d.running.map(t=>!t.pausedAt&&n-t.lastActive>=30000?{...t,lastActive:n}:t)}));};const interval=setInterval(check,15000);const visible=()=>{if(document.visibilityState==="visible")check();};window.addEventListener("pointerdown",activity);window.addEventListener("keydown",activity);window.addEventListener("focus",check);document.addEventListener("visibilitychange",visible);check();return()=>{clearInterval(interval);window.removeEventListener("pointerdown",activity);window.removeEventListener("keydown",activity);window.removeEventListener("focus",check);document.removeEventListener("visibilitychange",visible);};},[data.running,ready]);
 const change=(id:string,fn:(t:Timer)=>Timer)=>setData(d=>({...d,running:d.running.map(t=>t.id===id?fn(t):t)}));
 const pause=(id:string)=>change(id,t=>({...t,pausedAt:t.pausedAt??Date.now()}));
 const resume=(id:string)=>change(id,t=>{const n=Date.now();return {...t,excludedMs:t.excludedMs+(t.pausedAt?n-t.pausedAt:0),pausedAt:undefined,lastActive:n};});
 const resolve=(id:string,exclude:boolean)=>{change(id,t=>({...t,excludedMs:t.excludedMs+(exclude?Math.max(0,Date.now()-t.lastActive):0),lastActive:Date.now()}));setReview(v=>v.filter(x=>x!==id));};
 const finish=(id:string)=>{const target=data.running.find(t=>t.id===id);if(!target)return;const concurrent=data.running.filter(t=>t.id!==id&&!t.pausedAt&&t.started<Date.now());if(concurrent.length&&!window.confirm(`This timer overlaps ${concurrent.length} other running timer(s). Log this time to ${projects.find(p=>p.id===target.projectId)?.name??spaces.find(x=>x.id===target.spaceId)?.name??"its Space"} anyway? Concurrent time may be double-counted.`))return;setData(d=>{const t=d.running.find(x=>x.id===id);if(!t)return d;return {running:d.running.filter(x=>x.id!==id),sessions:[{...t,ended:t.pausedAt??Date.now()},...d.sessions]};});};
 const discard=(id:string)=>{if(!window.confirm("Discard this timer without logging it?"))return;setData(d=>({...d,running:d.running.filter(x=>x.id!==id)}));};
 const exportCSV=()=>{const rows=[["Date","Space","Project","Task","Task ID","Start","Finish","Tracked minutes","Excluded minutes","Overlaps another session"],...data.sessions.map(s=>[new Date(s.started).toLocaleDateString("en-CA"),spaces.find(x=>x.id===s.spaceId)?.name??s.spaceId,projects.find(p=>p.id===s.projectId)?.name??"",s.task,s.taskId??"",new Date(s.started).toISOString(),new Date(s.ended).toISOString(),String(Math.round(duration(s,s.ended)/60000)),String(Math.round(s.excludedMs/60000)),data.sessions.some(o=>o.id!==s.id&&o.started<s.ended&&o.ended>s.started)?"Yes":"No"])];const csv=rows.map(r=>r.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(",")).join("\r\n");const url=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));const a=document.createElement("a");a.href=url;a.download="baton-time-log.csv";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 const active=data.running.filter(t=>!t.pausedAt).length;
 return <div className="baton-timer-wrap">
 <button className={`baton-timer-trigger ${active?"is-running":""}`} onClick={()=>setOpen(v=>!v)} aria-expanded={open} aria-label="Open work timers"><span aria-hidden="true">◷</span><span>{data.running.length? `${active} active · ${data.running.length} timers`:"Timer"}</span>{review.length>0&&<span aria-label="Inactivity needs review">!</span>}</button>
 {open&&<div className="baton-timer-panel baton-timer-multi" role="region" aria-label="Work timers">
 <div className="baton-timer-title"><strong>Work timers</strong><button onClick={()=>setOpen(false)} aria-label="Close timers">×</button></div>
 {warning&&<p role="alert" className="baton-timer-alert">{warning}</p>}
 {data.running.map(t=><section className="baton-timer-session" key={t.id}>
 <div className="baton-timer-session-head"><strong>{t.task}</strong><strong className="baton-timer-clock-small">{clock(duration(t,now))}</strong></div>
 <p className="muted small">{spaces.find(s=>s.id===t.spaceId)?.name??t.spaceId}{t.pausedAt?" · Paused":" · Running"}</p>
 <label>Report under project<select className="input" value={t.projectId??""} onChange={e=>change(t.id,x=>({...x,projectId:e.target.value||undefined}))}><option value="">No project (Space only)</option>{projects.filter(p=>p.clientId===t.spaceId).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
 {review.includes(t.id)&&!t.pausedAt&&<div className="baton-timer-alert"><strong>Still working?</strong><p>Possible inactivity: {Math.floor((now-t.lastActive)/60000)} minutes. Review this timer.</p><div className="baton-timer-buttons"><button className="btn" onClick={()=>resolve(t.id,false)}>Count all</button><button className="btn" onClick={()=>resolve(t.id,true)}>Exclude idle</button><button className="btn" onClick={()=>{pause(t.id);setReview(v=>v.filter(x=>x!==t.id));}}>Pause</button></div></div>}
 <div className="baton-timer-buttons">{t.pausedAt?<button className="btn" onClick={()=>resume(t.id)}>Resume</button>:<button className="btn" onClick={()=>pause(t.id)}>Pause</button>}<button className="btn btn-primary" onClick={()=>finish(t.id)}>Finish & log</button><button className="btn" onClick={()=>discard(t.id)}>Discard</button></div>
 </section>)}
 <div className="baton-timer-new"><label>New timer<input className="input" value={task} onChange={e=>setTask(e.target.value)} placeholder="What are you working on?" /></label><label>Space<select className="input" value={spaceId} onChange={e=>{setSpaceId(e.target.value);setProjectId("");}}>{spaces.filter(s=>!s.archived).map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label><label>Project (optional)<select className="input" value={projectId} onChange={e=>setProjectId(e.target.value)}><option value="">No project</option>{projects.filter(p=>p.clientId===spaceId).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><button className="btn btn-primary" disabled={!task.trim()} onClick={()=>{startTaskTimer({task,spaceId,projectId:projectId||undefined});setTask("");}}>Start another timer</button></div>
 <div className="baton-timer-log"><strong>Recent sessions</strong>{data.sessions.slice(0,5).map(s=><div key={s.id}><span>{s.task}<small>{spaces.find(x=>x.id===s.spaceId)?.name??s.spaceId}</small></span><strong>{clock(duration(s,s.ended))}</strong></div>)}{data.sessions.length>0&&<button className="btn" onClick={exportCSV}>Export CSV</button>}</div>
 <p className="muted small">Multiple timers can overlap. Overlaps are flagged in exports; totals may double-count. Saved in this browser.</p>
 </div>}
 </div>;
}
