"use client";
import Link from "next/link";
import { use, useState } from "react";
import { useStore, type ProjectStep } from "@/lib/store";
import { getTemplate } from "@/lib/templates";
import { shortDate } from "@/lib/format";
import { Due } from "@/components/ui";
import { Icon } from "@/components/Icon";

export default function ProjectPage({ params }: { params: Promise<{ id: string; pid: string }> }) {
  const { id, pid } = use(params);
  const { projects } = useStore();
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

      <section className="card">
        <div className="card-head"><h2>Details</h2></div>
        <div style={{ display: "flex", gap: 18, flexWrap: "wrap", padding: "0 18px 16px" }} className="small">
          {filled.map((f) => <span key={f.id}><span className="muted">{f.label}</span><br /><strong>{f.type === "date" ? `${shortDate(project.info[f.id]).full}, ${project.info[f.id].slice(0, 4)}` : project.info[f.id]}</strong></span>)}
          {filled.length === 0 && <span className="muted">No details yet.</span>}
        </div>
        {missing.length > 0 && <div className="row muted small">Still open, if useful: {missing.map((f) => f.label).join(", ")}</div>}
      </section>

      <section className="card">
        <div className="card-head"><h2>Checklist</h2><span className="muted small">Tick, skip with a reason, or add steps as things change</span></div>
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
