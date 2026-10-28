"use client";
import { use, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TODAY } from "@/lib/data";
import { addDays, getTemplate, type TemplateStep } from "@/lib/templates";
import { useStore, type ProjectStep } from "@/lib/store";
import { shortDate } from "@/lib/format";
import { Icon } from "@/components/Icon";

interface DraftStep extends TemplateStep {
  include: boolean;
  custom?: boolean;
}

export default function NewProject({ params }: { params: Promise<{ id: string; template: string }> }) {
  const { id, template } = use(params);
  const tpl = getTemplate(template);
  const router = useRouter();
  const { addProject } = useStore();

  const [info, setInfo] = useState<Record<string, string>>({});
  const [name, setName] = useState(tpl ? tpl.name : "New project");
  const [steps, setSteps] = useState<DraftStep[]>((tpl?.steps ?? []).map((s) => ({ ...s, include: true })));
  const [newStep, setNewStep] = useState("");

  const keyField = tpl?.fields.find((f) => f.key);
  const keyDate = (keyField && info[keyField.id]) || null;
  const phases = useMemo(() => [...new Set(steps.map((s) => s.phase))], [steps]);

  const due = (s: DraftStep) => (keyDate ? addDays(keyDate, s.offsetDays) : null);
  const update = (sid: string, patch: Partial<DraftStep>) => setSteps((all) => all.map((s) => (s.id === sid ? { ...s, ...patch } : s)));
  const addCustom = () => {
    if (!newStep.trim()) return;
    setSteps((all) => [...all, { id: `c${Date.now()}`, title: newStep.trim(), phase: "Added by you", offsetDays: 0, owner: "BCW", include: true, custom: true }]);
    setNewStep("");
  };

  const create = () => {
    const pid = `p${Date.now()}`;
    const chosen: ProjectStep[] = steps.filter((s) => s.include).map((s) => ({
      id: s.id, title: s.title, phase: s.phase, due: due(s), owner: s.skill ?? s.owner, skill: s.skill, signoff: s.signoff, status: "open",
    }));
    addProject({ id: pid, clientId: id, templateId: tpl?.id ?? "blank", name: info.name || info.topic || info.show || info.program || name, info, steps: chosen, created: TODAY });
    router.push(`/clients/${id}/projects/${pid}`);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 900 }}>
      <div>
        <div className="eyebrow">New project · {tpl ? tpl.name : "Blank"}</div>
        <p className="muted small" style={{ margin: "4px 0 0" }}>Fill in what you know. Skip anything that doesn&apos;t apply; you can add it later. Nothing here is required.</p>
      </div>

      <section className="card" aria-label="Details">
        <div className="card-head"><h2>Details</h2><span className="muted small">All optional</span></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12, padding: "4px 18px 18px" }}>
          {!tpl && (
            <label className="small" style={{ display: "flex", flexDirection: "column", gap: 4 }}>Project name
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
            </label>
          )}
          {tpl?.fields.map((f) => (
            <label key={f.id} className="small" style={{ display: "flex", flexDirection: "column", gap: 4, gridColumn: f.type === "textarea" ? "1 / -1" : undefined }}>
              <span style={{ fontWeight: 600 }}>{f.label}{f.key && <span className="muted" style={{ fontWeight: 400 }}> · steps are timed from this</span>}</span>
              {f.type === "select" ? (
                <select className="input" value={info[f.id] ?? ""} onChange={(e) => setInfo({ ...info, [f.id]: e.target.value })}>
                  <option value="">Not set</option>
                  {f.options?.map((o) => <option key={o}>{o}</option>)}
                </select>
              ) : f.type === "textarea" ? (
                <textarea className="input" rows={2} value={info[f.id] ?? ""} onChange={(e) => setInfo({ ...info, [f.id]: e.target.value })} />
              ) : (
                <input className="input" type={f.type === "url" ? "url" : f.type === "date" ? "date" : "text"} placeholder={f.type === "url" ? "https://" : undefined} value={info[f.id] ?? ""} onChange={(e) => setInfo({ ...info, [f.id]: e.target.value })} />
              )}
              {f.hint && <span className="muted xs">{f.hint}</span>}
            </label>
          ))}
        </div>
      </section>

      <section className="card" aria-label="Checklist">
        <div className="card-head">
          <h2>Suggested steps</h2>
          <span className="muted small">{steps.filter((s) => s.include).length} of {steps.length} included{keyDate ? "" : " · set the key date to see due dates"}</span>
        </div>
        {phases.map((ph) => (
          <div key={ph}>
            <div className="row muted xs" style={{ fontWeight: 700, letterSpacing: "0.04em", background: "var(--surface-2)" }}>{ph.toUpperCase()}</div>
            {steps.filter((s) => s.phase === ph).map((s) => {
              const d = due(s);
              return (
                <div className="row" key={s.id} style={{ flexWrap: "wrap", opacity: s.include ? 1 : 0.5 }}>
                  <input type="checkbox" checked={s.include} onChange={() => update(s.id, { include: !s.include })} aria-label={`Include ${s.title}`} style={{ width: 18, height: 18 }} />
                  <input className="input grow" value={s.title} onChange={(e) => update(s.id, { title: e.target.value })} aria-label="Step name" style={{ flexBasis: 240, background: "transparent", border: "1px solid transparent", padding: "6px 8px" }} />
                  {s.when && <span className="badge b-neutral">{s.when}</span>}
                  {s.signoff && <span className="badge b-eyes"><Icon name="eye" size={13} />sign-off</span>}
                  <span className="chip chip-skill" style={s.skill ? undefined : { background: "var(--neutral-bg)", color: "var(--neutral-fg)" }}>{s.skill ?? s.owner}</span>
                  <span className="muted small" style={{ width: 92, textAlign: "right" }}>{d ? shortDate(d).full : s.offsetDays === 0 ? "On the day" : `${Math.abs(s.offsetDays)}d ${s.offsetDays < 0 ? "before" : "after"}`}</span>
                  {s.custom && <button className="btn btn-danger" style={{ minHeight: 32 }} onClick={() => setSteps((all) => all.filter((x) => x.id !== s.id))}>Remove</button>}
                </div>
              );
            })}
          </div>
        ))}
        <div className="row">
          <Icon name="plus" />
          <input className="input grow" value={newStep} onChange={(e) => setNewStep(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addCustom()} placeholder="Add your own step" aria-label="Add your own step" />
          <button className="btn" onClick={addCustom}>Add</button>
        </div>
      </section>

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button className="btn" onClick={() => router.back()}>Cancel</button>
        <button className="btn btn-primary btn-lg" onClick={create}>Create project</button>
      </div>
    </div>
  );
}
