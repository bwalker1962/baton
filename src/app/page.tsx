"use client";
import Link from "next/link";
import { ProjectStarter } from "@/components/ProjectStarter";
import { NotesBoard } from "@/components/Notes";
import { CERTAINTY } from "@/lib/intake";
import { clients, tasks, TODAY } from "@/lib/data";
import { healthOrder, minutesLabel, shortDate } from "@/lib/format";
import { useStore } from "@/lib/store";
import { Icon } from "@/components/Icon";
import { ClientTile, Due, StatusBadge } from "@/components/ui";

const upcoming = [
  { date: "2026-11-03", title: "Award entry due", client: "Pentara", dept: "Earned media" },
  { date: "2026-11-04", title: "Cost alignment review", client: "Pentara", dept: "Strategy" },
  { date: "2026-11-10", title: "[Conference] abstract close", client: "PhotoPharmics", dept: "Events" },
];

export default function Home() {
  const { items, projects } = useStore();
  const needs = items.filter((i) => i.state === "needs");
  const offTrack = tasks.filter((t) => t.health === "bad");
  const watch = tasks.filter((t) => t.health === "warn");
  const dueThisWeek = tasks.filter((t) => t.due && t.due >= TODAY && t.due <= "2026-11-04");
  const sorted = [...clients].sort((a, b) => healthOrder[a.health] - healthOrder[b.health]);
  const totalMinutes = clients.reduce((s, c) => s + c.minutesThisWeek, 0);

  const stats = [
    { href: "/signoff", label: "Needs your eyes", n: needs.length, icon: "eye", bg: "var(--eyes-bg)", fg: "var(--eyes-fg)", sub: `${needs.filter((i) => i.tier === 1).length} Tier 1 · ${needs.filter((i) => i.due === TODAY).length} due today` },
    { href: "/signoff", label: "Off track", n: offTrack.length, icon: "stop", bg: "var(--bad-bg)", fg: "var(--bad-fg)", sub: offTrack.map((t) => t.title).slice(0, 2).join(" · ") },
    { href: "/signoff", label: "Watch", n: watch.length, icon: "alert", bg: "var(--warn-bg)", fg: "var(--warn-fg)", sub: `${watch.filter((t) => t.blocker?.kind === "client").length} waiting on clients` },
    { href: "/signoff", label: "Due this week", n: dueThisWeek.length, icon: "clock", bg: "var(--info-bg)", fg: "var(--info-fg)", sub: "Next: award entry, Nov 3" },
  ];

  return (
    <>
      <div className="pagehead">
        <div>
          <div className="eyebrow">Wednesday, October 28</div>
          <h1 className="title">Good morning, Brett</h1>
        </div>
        {needs.length > 0 && (
          <Link href="/signoff" className="btn btn-primary btn-lg">
            <Icon name="eye" />Start sign-off · {needs.length}
          </Link>
        )}
      </div>
      <ProjectStarter />

      {needs.length === 0 && (
        <section className="card fade" style={{ padding: 20, display: "flex", gap: 14, alignItems: "center" }}>
          <span className="stat-icon" style={{ background: "var(--good-bg)", color: "var(--good-fg)" }}><Icon name="check" /></span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>All clear. Nothing needs you right now.</div>
            <div className="muted small">Next scheduled item: award entry draft for Pentara, due Nov 3.</div>
          </div>
        </section>
      )}

      <section className="grid4" aria-label="What needs you">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="card stat">
            <span style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="muted" style={{ fontWeight: 500 }}>{s.label}</span>
              <span className="stat-icon" style={{ background: s.bg, color: s.fg }}><Icon name={s.icon} size={17} stroke={2.2} /></span>
            </span>
            <span className="stat-num">{s.n}</span>
            <span className="muted small">{s.sub}</span>
          </Link>
        ))}
      </section>

      <NotesBoard />
      <div className="split">
        <section className="card wide scroll-x" aria-label="Clients">
          <div className="card-head">
            <h2>Clients</h2>
            <span className="muted small">Worst first · your time this week: {minutesLabel(totalMinutes)}</span>
          </div>
          <table className="tbl" style={{ minWidth: 620 }}>
            <thead>
              <tr><th scope="col">Client</th><th scope="col">Status</th><th scope="col">Phase</th><th scope="col">Your time</th><th scope="col" style={{ textAlign: "right" }}>Your eyes</th></tr>
            </thead>
            <tbody>
              {sorted.map((c) => {
                const n = needs.filter((i) => i.clientId === c.id).length;
                return (
                  <tr key={c.id}>
                    <td>
                      <Link href={`/clients/${c.id}`} style={{ color: "var(--text)", fontWeight: 600, display: "flex", gap: 10, alignItems: "center" }}>
                        <ClientTile client={c} />{c.name}
                      </Link>
                    </td>
                    <td><StatusBadge health={c.health} /></td>
                    <td className="muted">{c.phase}</td>
                    <td className="muted">{minutesLabel(c.minutesThisWeek)}</td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>{n || <span className="muted">0</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        <section className="card narrow" aria-label="Coming up">
          <div className="card-head"><h2>Coming up</h2></div>
          {upcoming.map((u) => {
            const d = shortDate(u.date);
            return (
              <div className="row" key={u.title}>
                <span style={{ width: 44, flex: "none", textAlign: "center", border: "1px solid var(--border)", borderRadius: 10, padding: "4px 0" }}>
                  <span style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--bad-fg)" }}>{d.mon}</span>
                  <span style={{ display: "block", fontSize: 17, fontWeight: 700 }}>{d.day}</span>
                </span>
                <span className="grow"><span style={{ fontWeight: 600 }}>{u.title}</span><br /><span className="muted small">{u.client} · {u.dept}</span></span>
                <Due iso={u.date} />
              </div>
            );
          })}
          {projects.slice(0, 3).map((p) => (
            <Link className="row" key={p.id} href={`/clients/${p.clientId}/projects/${p.id}`}>
              <Icon name="plus" size={16} />
              <span className="grow"><span style={{ fontWeight: 600 }}>{p.name}</span><br /><span className="muted small">{p.certainty ? CERTAINTY[p.certainty].label : "New project"} · {p.steps.filter((s) => s.status === "open").length} open steps</span></span>
            </Link>
          ))}
        </section>
      </div>
    </>
  );
}
