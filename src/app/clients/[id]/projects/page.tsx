"use client";
import { CardHead } from "@/components/ui";
import Link from "next/link";
import { use, useState } from "react";
import { templates } from "@/lib/templates";
import { useStore, type Project } from "@/lib/store";
import { Icon } from "@/components/Icon";
import { StartProjectPill } from "@/components/ProjectStarter";
import { dragInto1on1 } from "@/lib/agenda";
import { CERTAINTY } from "@/lib/intake";
import { ArchivedToggle, BulkBar, ItemMenu, SelectBox, useSelection } from "@/components/Housekeeping";
import { useSpaces } from "@/app/spaces/page";
import type { Ref } from "@/lib/housekeeping";

export default function Projects({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { allProjects, isArchived, updateProject } = useStore();
  const [showArchived, setShowArchived] = useState(false);
  const all = allProjects.filter((p) => p.clientId === id);
  const archived = all.filter((p) => isArchived("project", p.id));
  const mine = showArchived ? archived : all.filter((p) => !isArchived("project", p.id));
  const sel = useSelection(mine.map((p) => p.id));
  const moveTo = useSpaces().filter((s) => !s.archived && s.id !== id).map((s) => ({ id: s.id, name: s.name }));
  const ref = (p: Project): Ref => ({ kind: "project", id: p.id, name: p.name, clientId: p.clientId });

  return (
    <>
      <StartProjectPill clientId={id} />
      {(mine.length > 0 || archived.length > 0) && (
        <section className="card">
          <CardHead icon="layers" title={showArchived ? "Archived projects" : "Projects"} count={mine.length}>
            <ArchivedToggle count={archived.length} on={showArchived} onChange={setShowArchived} />
          </CardHead>
          {mine.length > 1 && <label className="row small muted" style={{ gap: 8 }}><SelectBox checked={sel.all} onChange={sel.toggleAll} label="Select all projects" />Select all</label>}
          <BulkBar refs={mine.filter((p) => sel.has(p.id)).map(ref)} onClear={sel.clear} archived={showArchived}
            moveTo={moveTo} onMove={(cid) => mine.filter((p) => sel.has(p.id)).forEach((p) => updateProject(p.id, { clientId: cid }))} />
          {mine.length === 0 && <div className="row muted small">Nothing here.</div>}
          {mine.map((p) => {
            const open = p.steps.filter((s) => s.status === "open").length;
            const done = p.steps.filter((s) => s.status === "done").length;
            return (
              <div className={`row ${showArchived ? "hk-archived" : ""}`} key={p.id} style={{ gap: 10 }}>
                <SelectBox checked={sel.has(p.id)} onChange={() => sel.toggle(p.id)} label={`Select ${p.name}`} />
                <Link className="grow" href={`/clients/${id}/projects/${p.id}`} style={{ display: "flex", gap: 12, alignItems: "center", color: "var(--text)" }}
                  {...dragInto1on1({ kind: "project", title: p.name, href: `/clients/${id}/projects/${p.id}`, refId: p.id, clientId: id })}>
                  <Icon name={templates.find((t) => t.id === p.templateId)?.icon ?? "file"} />
                  <span className="grow"><strong>{p.name}</strong><br /><span className="muted small">{p.steps.length ? `${done} done · ${open} open` : "Watching, no tasks yet"}{showArchived ? " · read-only" : ""}</span></span>
                  {p.certainty && <span className={`badge ${CERTAINTY[p.certainty].cls}`}>{CERTAINTY[p.certainty].label}</span>}
                </Link>
                <ItemMenu item={ref(p)} compact onRename={(n) => updateProject(p.id, { name: n })} moveTo={moveTo} onMove={(cid) => updateProject(p.id, { clientId: cid })} />
              </div>
            );
          })}
        </section>
      )}
      <section className="card">
        <CardHead icon="plus" title="Or start from a template" sub="Every field and step is optional" />
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
