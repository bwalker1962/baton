"use client";
import Link from "next/link";
import { use } from "react";
import { templates } from "@/lib/templates";
import { useStore } from "@/lib/store";
import { Icon } from "@/components/Icon";
import { StartProjectPill } from "@/components/ProjectStarter";
import { dragInto1on1 } from "@/lib/agenda";
import { CERTAINTY } from "@/lib/intake";

export default function Projects({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { projects } = useStore();
  const mine = projects.filter((p) => p.clientId === id);

  return (
    <>
      <StartProjectPill clientId={id} />
      {mine.length > 0 && (
        <section className="card">
          <div className="card-head"><h2>Projects</h2></div>
          {mine.map((p) => {
            const open = p.steps.filter((s) => s.status === "open").length;
            const done = p.steps.filter((s) => s.status === "done").length;
            return (
              <Link className="row" key={p.id} href={`/clients/${id}/projects/${p.id}`}
                {...dragInto1on1({ kind: "project", title: p.name, href: `/clients/${id}/projects/${p.id}`, refId: p.id, clientId: id })}>
                <Icon name={templates.find((t) => t.id === p.templateId)?.icon ?? "file"} />
                <span className="grow"><strong>{p.name}</strong><br /><span className="muted small">{p.steps.length ? `${done} done · ${open} open` : "Watching, no tasks yet"}</span></span>
                {p.certainty && <span className={`badge ${CERTAINTY[p.certainty].cls}`}>{CERTAINTY[p.certainty].label}</span>}
              </Link>
            );
          })}
        </section>
      )}
      <section className="card">
        <div className="card-head">
          <h2>Or start from a template</h2>
          <span className="muted small">Templates suggest what usually matters. Every field and step is optional.</span>
        </div>
        <div className="grid-auto" style={{ padding: "4px 18px 18px" }}>
          {templates.map((t) => (
            <Link key={t.id} href={`/clients/${id}/projects/new/${t.id}`} className="card" style={{ padding: 14, color: "var(--text)", display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 600 }}><Icon name={t.icon} />{t.name}</span>
              <span className="muted small">{t.description}</span>
              <span className="xs muted">{t.fields.length} details · {t.steps.length} suggested steps</span>
            </Link>
          ))}
          <Link href={`/clients/${id}/projects/new/blank`} className="card" style={{ padding: 14, color: "var(--text)", display: "flex", flexDirection: "column", gap: 6, borderStyle: "dashed" }}>
            <span style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 600 }}><Icon name="plus" />Blank project</span>
            <span className="muted small">Start from nothing and add your own steps.</span>
          </Link>
        </div>
      </section>
    </>
  );
}
