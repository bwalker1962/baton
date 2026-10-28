"use client";
import Link from "next/link";
import { use, useState } from "react";
import { useStore, type ProjectStep } from "@/lib/store";
import { getTemplate } from "@/lib/templates";
import { shortDate } from "@/lib/format";
import { Due } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { buildSteps } from "@/components/ProjectStarter";
import { CERTAINTY, dateLabel, type Certainty } from "@/lib/intake";
import { PEERS, ranked, topicForTemplate } from "@/lib/advisor";
import { AdviceRow } from "@/components/Advice";
import { getClient } from "@/lib/data";

export default function ProjectPage({ params }: { params: Promise<{ id: string; pid: string }> }) {
  const { id, pid } = use(params);
  const { projects, updateProject } = useStore();
  const project = projects.find((p) => p.id === pid);
  const [steps, setSteps] = useState<ProjectStep[]>(project?.steps ?? []);
  const [skipping, setSkipping] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [extra, setExtra] = useState("");

  if (!project) {
    return (
      <section className="card empty">
        <h3>Project not found</h3>
        <p>This prototype keeps projects in memory, so they reset when the page reloads.</p>
        <Link className="btn" href={`/clients/${id}/projects`}>Back to projects</Link>
      </section>
    );
  }
  const tpl = getTemplate(project.templateId);
  const set = (sid: string, patch: Partial<ProjectStep>) => setSteps((all) => all.map((s) => (s.id === sid ? { ...s, ...patch } : s)));
  const phases = [...new Set(steps.map((s) => s.phase))];
  const done = steps.filter((s) => s.status !== "open").length;
  const filled = tpl?.fields.filter((f) => project.info[f.id]) ?? [];
  const missing = tpl?.fields.filter((f) => !project.info[f.id]) ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 900 }}>
      <div className="pagehead">
        <div>
          <div className="eyebrow">{tpl?.name ?? "Project"}</div>
          <h2 style={{ margin: "4px 0 0", fontSize: 22 }}>{project.name}</h2>
        </div>
        <span className="badge b-neutral">{done} of {steps.length} steps handled</span>
      </div>

      {project.certainty && (
        <section className="card" aria-label="How real is it" style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <strong className="small">How real is it?</strong>
            <div className="seg" role="radiogroup" aria-label="Project status">
              {(Object.keys(CERTAINTY) as Certainty[]).map((k) => (
                <button key={k} role="radio" aria-checked={project.certainty === k} aria-pressed={project.certainty === k} onClick={() => {
                  const live = k === "proposed" || k === "confirmed";
                  const fill = live && steps.length === 0 ? buildSteps(project.templateId, project.info.date) : steps;
                  setSteps(fill);
                  updateProject(project.id, { certainty: k, steps: fill });
                }}>{CERTAINTY[k].label}</button>
              ))}
            </div>
          </div>
          <div className="small muted">{CERTAINTY[project.certainty].next}{project.checkBack && (project.certainty === "heard" || project.certainty === "rough") ? ` Check back ${shortDate(project.checkBack).full}.` : ""}</div>
          {project.source && <div className="xs muted">Started from: &ldquo;{project.source}&rdquo;</div>}
        </section>
      )}

      {(() => {
        const topic = topicForTemplate(project.templateId);
        if (!topic) return null;
        return (
          <section className="card" aria-label="Advisor">
            <div className="card-head">
              <h2 style={{ display: "flex", gap: 8, alignItems: "center" }}><Icon name="bulb" size={18} />What matters most</h2>
              <Link className="small" href={`/advisor?client=${id}&topic=${topic.id}`}>All {topic.name.toLowerCase()} advice</Link>
            </div>
            {ranked(topic.items).slice(0, 3).map((c, n) => <AdviceRow key={c.id} c={c} rank={n + 1} segment={PEERS[id]?.segment} clientName={getClient(id)?.name} />)}
          </section>
        );
      })()}

      <section className="card">
        <div className="card-head"><h2>Details</h2></div>
        <div style={{ display: "flex", gap: 18, flexWrap: "wrap", padding: "0 18px 16px" }} className="small">
          {filled.map((f) => <span key={f.id}><span className="muted">{f.label}</span><br /><strong>{f.type === "date" ? dateLabel(project.info[f.id], f.id === "date" && project.info.dateMonthOnly === "yes") : project.info[f.id]}</strong></span>)}
          {filled.length === 0 && <span className="muted">No details yet.</span>}
        </div>
        {missing.length > 0 && <div className="row muted small">Still open, if useful: {missing.map((f) => f.label).join(", ")}</div>}
      </section>

      <section className="card">
        <div className="card-head"><h2>Checklist</h2><span className="muted small">Tick, skip with a reason, or add steps as things change</span></div>
        {steps.length === 0 && <div className="row muted small">No checklist yet. It starts when this becomes Proposed or Confirmed.</div>}
        {phases.map((ph) => (
          <div key={ph}>
            <div className="row muted xs" style={{ fontWeight: 700, letterSpacing: "0.04em", background: "var(--surface-2)" }}>{ph.toUpperCase()}</div>
            {steps.filter((s) => s.phase === ph).map((s) => (
              <div className="row" key={s.id} style={{ flexWrap: "wrap" }}>
                <input type="checkbox" checked={s.status === "done"} disabled={s.status === "skipped"} onChange={() => set(s.id, { status: s.status === "done" ? "open" : "done" })} aria-label={`Done: ${s.title}`} style={{ width: 18, height: 18 }} />
                <span className="grow" style={{ flexBasis: 220, textDecoration: s.status !== "open" ? "line-through" : undefined, color: s.status === "skipped" ? "var(--muted)" : undefined }}>
                  {s.title}
                  {s.status === "skipped" && <span className="muted small"> · skipped: {s.skipReason || "no reason given"}</span>}
                </span>
                {s.signoff && s.status === "open" && <span className="badge b-eyes"><Icon name="eye" size={13} />sign-off</span>}
                <span className="chip chip-skill" style={s.skill ? undefined : { background: "var(--neutral-bg)", color: "var(--neutral-fg)" }}>{s.owner}</span>
                <Due iso={s.due} />
                {s.status === "skipped" ? (
                  <button className="btn" style={{ minHeight: 32 }} onClick={() => set(s.id, { status: "open", skipReason: undefined })}>Restore</button>
                ) : skipping === s.id ? (
                  <span style={{ display: "flex", gap: 6 }}>
                    <input className="input" autoFocus value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why skip? (optional)" style={{ padding: "6px 8px" }} aria-label="Reason for skipping" />
                    <button className="btn" style={{ minHeight: 32 }} onClick={() => { set(s.id, { status: "skipped", skipReason: reason }); setSkipping(null); setReason(""); }}>Skip</button>
                  </span>
                ) : (
                  s.status === "open" && <button className="btn" style={{ minHeight: 32 }} onClick={() => setSkipping(s.id)}>Not needed</button>
                )}
              </div>
            ))}
          </div>
        ))}
        <div className="row">
          <Icon name="plus" />
          <input className="input grow" value={extra} onChange={(e) => setExtra(e.target.value)} placeholder="Add a step" aria-label="Add a step"
            onKeyDown={(e) => { if (e.key === "Enter" && extra.trim()) { setSteps((a) => [...a, { id: `x${Date.now()}`, title: extra.trim(), phase: "Added by you", due: null, owner: "BCW", status: "open" }]); setExtra(""); } }} />
        </div>
      </section>
    </div>
  );
}
