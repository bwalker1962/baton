"use client";
// Search or jump: ⌘K / Ctrl+K (or "/") from anywhere. Finds clients and their tabs, sign-off
// items, tasks, projects, notes, chats, skills and advice, plus a few quick actions.
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { clients, getClient, skills, topics } from "@/lib/data";
import { TOPICS } from "@/lib/advisor";
import { useStore, type Mode } from "@/lib/store";
import { Icon } from "./Icon";
import { ClientTile } from "./ui";

type Group = "Actions" | "Go to" | "Clients" | "Sign-off" | "Tasks" | "Projects" | "Notes" | "Chats" | "Skills" | "Advice";
interface Hit { id: string; group: Group; title: string; sub?: string; icon: string; clientId?: string; keywords?: string; run: () => void }

const ORDER: Group[] = ["Actions", "Clients", "Sign-off", "Tasks", "Projects", "Notes", "Chats", "Go to", "Skills", "Advice"];
const TABS: [string, string][] = [["", "Dashboard"], ["signoff", "Sign-off"], ["score", "Score"], ["tasks", "Tasks"], ["projects", "Projects"], ["notes", "Notes"], ["chats", "Chats"], ["apps", "Apps & files"], ["report", "CEO report"], ["brand", "Brand"]];

/** Every word of the query must appear; titles that start with it rank first. */
function score(h: Hit, q: string): number {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const title = h.title.toLowerCase();
  const hay = `${title} ${(h.sub ?? "").toLowerCase()} ${(h.keywords ?? "").toLowerCase()}`;
  if (!words.every((w) => hay.includes(w))) return 0;
  let s = 1;
  if (title.startsWith(words[0])) s += 3;
  else if (title.split(/[\s:·-]+/).some((t) => t.startsWith(words[0]))) s += 2;
  if (words.every((w) => title.includes(w))) s += 1;
  // On a tie, the shorter (more exact) title wins: "Dark" before "Half-dark".
  return s - title.length / 1000;
}

export function CommandPalette({ open, onClose, here }: { open: boolean; onClose: () => void; here?: string }) {
  const router = useRouter();
  const { items, tasks, projects, notes, setMode, openAgenda } = useStore();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const go = (href: string) => () => router.push(href);

  useEffect(() => { if (open) { setQ(""); setActive(0); } }, [open]);

  const all = useMemo<Hit[]>(() => {
    const hits: Hit[] = [];
    const cname = (id: string) => getClient(id)?.name ?? "";
    // Quick actions; the client you're in comes first.
    const order = here ? [getClient(here)!, ...clients.filter((c) => c.id !== here)] : clients;
    for (const c of order) {
      hits.push({ id: `a-note-${c.id}`, group: "Actions", title: `New note for ${c.name}`, icon: "chat", clientId: c.id, keywords: "write jot conversation ceo", run: go(`/clients/${c.id}/notes`) });
      hits.push({ id: `a-1on1-${c.id}`, group: "Actions", title: `Open ${c.name} 1:1 agenda`, icon: "chat", clientId: c.id, keywords: "one on one meeting agenda topics", run: () => openAgenda(c.id) });
      hits.push({ id: `a-proj-${c.id}`, group: "Actions", title: `Start a project for ${c.name}`, icon: "plus", clientId: c.id, keywords: "new project event webinar campaign", run: go(`/clients/${c.id}/projects?start=1`) });
    }
    (["light", "half", "dark"] as Mode[]).forEach((m) => hits.push({ id: `a-mode-${m}`, group: "Actions", title: `Appearance: ${m === "half" ? "Half-dark" : m[0].toUpperCase() + m.slice(1)}`, icon: m === "light" ? "sun" : m === "dark" ? "moon" : "half", keywords: "theme mode dark light", run: () => setMode(m) }));

    [["/", "Home", "home"], ["/today", "Today", "tasks"], ["/signoff", "Sign-off queue", "eye"], ["/advisor", "Advisor", "bulb"], ["/skills", "Skills", "layers"], ["/clients", "All clients", "grid"]]
      .forEach(([href, title, icon]) => hits.push({ id: `p-${href}`, group: "Go to", title, icon, run: go(href) }));

    for (const c of clients) {
      hits.push({ id: `c-${c.id}`, group: "Clients", title: c.name, sub: `${c.phase} · ${c.retainer}`, icon: "grid", clientId: c.id, run: go(`/clients/${c.id}`) });
      TABS.slice(1).forEach(([seg, label]) => hits.push({ id: `c-${c.id}-${seg}`, group: "Clients", title: `${c.name}: ${label}`, icon: "link", clientId: c.id, run: go(`/clients/${c.id}/${seg}`) }));
    }
    for (const i of items) hits.push({ id: `s-${i.id}`, group: "Sign-off", title: i.title, sub: `${cname(i.clientId)} · ${i.channel} · ${i.state === "needs" ? "needs your eyes" : i.state.replace("-", " ")}`, icon: "eye", clientId: i.clientId, keywords: `${i.skill} ${(i.settings ?? []).map((x) => x.value).join(" ")}`, run: go(`/signoff/${i.id}`) });
    for (const t of tasks) hits.push({ id: `t-${t.id}`, group: "Tasks", title: t.title, sub: `${cname(t.clientId)} · ${t.owner}${t.promised ? ` · promised to ${t.promised.to}` : ""}`, icon: "tasks", clientId: t.clientId, keywords: `${t.dept} ${t.blocker?.label ?? ""}`, run: go(`/clients/${t.clientId}/tasks?task=${t.id}`) });
    for (const p of projects) hits.push({ id: `pr-${p.id}`, group: "Projects", title: p.name, sub: cname(p.clientId), icon: "layers", clientId: p.clientId, keywords: Object.values(p.info).join(" "), run: go(`/clients/${p.clientId}/projects/${p.id}`) });
    for (const n of notes) {
      const text = n.entries.map((e) => e.text).join(" · ");
      hits.push({ id: `n-${n.id}`, group: "Notes", title: n.entries[0]?.text ?? "Note", sub: `${cname(n.clientId)} · ${n.with} · ${n.date.slice(5).replace("-", "/")}`, icon: "chat", clientId: n.clientId, keywords: text, run: go(`/clients/${n.clientId}/notes`) });
    }
    for (const t of topics) hits.push({ id: `ch-${t.id}`, group: "Chats", title: t.title, sub: `${cname(t.clientId)} · ${t.category}`, icon: "chat", clientId: t.clientId, keywords: `${t.summary} ${t.decision} ${t.program}`, run: go(`/clients/${t.clientId}/chats`) });
    for (const s of skills) hits.push({ id: `k-${s.id}`, group: "Skills", title: s.id, sub: s.job, icon: "layers", keywords: s.dept, run: go("/skills") });
    for (const a of TOPICS) hits.push({ id: `ad-${a.id}`, group: "Advice", title: `Best practices: ${a.name}`, icon: "bulb", keywords: a.match.source.replace(/[|\\?()]/g, " "), run: go(`/advisor?topic=${a.id}${here ? `&client=${here}` : ""}`) });
    return hits;
  }, [items, tasks, projects, notes, here, setMode, openAgenda]); // eslint-disable-line react-hooks/exhaustive-deps

  const results = useMemo(() => {
    if (!q.trim()) {
      // Before typing: actions for where you are, then places to go.
      const start = all.filter((h) => (h.group === "Actions" && (!here || h.clientId === here) && !h.id.startsWith("a-mode")) || h.group === "Go to");
      return here ? start : start.filter((h) => h.group === "Go to" || h.id.startsWith("a-1on1"));
    }
    return all.map((h) => ({ h, s: score(h, q) })).filter((x) => x.s > 0)
      .sort((a, b) => ORDER.indexOf(a.h.group) - ORDER.indexOf(b.h.group) || b.s - a.s)
      .reduce<Hit[]>((acc, { h }) => (acc.filter((x) => x.group === h.group).length < 6 ? [...acc, h] : acc), []);
  }, [q, all, here]);

  useEffect(() => { setActive(0); }, [q]);
  useEffect(() => { list.current?.querySelector(`[data-i="${active}"]`)?.scrollIntoView({ block: "nearest" }); }, [active]);

  if (!open) return null;
  const pick = (h?: Hit) => { if (!h) return; onClose(); h.run(); };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(results.length - 1, a + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    else if (e.key === "Enter") { e.preventDefault(); pick(results[active]); }
    else if (e.key === "Escape") { e.preventDefault(); onClose(); }
  };

  let lastGroup = "";
  return (
    <div className="backdrop palette-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="palette fade" role="dialog" aria-modal="true" aria-label="Search or jump">
        <div className="palette-input">
          <Icon name="search" size={18} />
          <input ref={input} autoFocus value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey} placeholder="Search clients, tasks, sign-off, notes, chats…"
            role="combobox" aria-expanded="true" aria-controls="palette-list" aria-activedescendant={results[active] ? `pal-${results[active].id}` : undefined} aria-autocomplete="list" />
          <kbd>esc</kbd>
        </div>
        <div className="palette-list" id="palette-list" role="listbox" ref={list} aria-label="Results">
          {results.length === 0 && <div className="palette-empty">Nothing matches &ldquo;{q}&rdquo;. Try a client name, a task, or a word from a note.</div>}
          {results.map((h, n) => {
            const head = h.group !== lastGroup ? (lastGroup = h.group) : null;
            const c = h.clientId ? clients.find((x) => x.id === h.clientId) : undefined;
            return (
              <div key={h.id}>
                {head && <div className="palette-group" aria-hidden="true">{head}</div>}
                <div id={`pal-${h.id}`} data-i={n} role="option" aria-selected={n === active} className={`palette-item ${n === active ? "active" : ""}`}
                  onMouseMove={() => setActive(n)} onClick={() => pick(h)}>
                  {c ? <ClientTile client={c} small /> : <span className="palette-icon"><Icon name={h.icon} size={15} /></span>}
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span className="palette-title">{h.title}</span>
                    {h.sub && <span className="palette-sub">{h.sub}</span>}
                  </span>
                  {n === active && <kbd>↵</kbd>}
                </div>
              </div>
            );
          })}
        </div>
        <div className="palette-foot"><span><kbd>↑</kbd><kbd>↓</kbd> move</span><span><kbd>↵</kbd> open</span><span><kbd>{typeof navigator !== "undefined" && !/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent) ? "Ctrl K" : "⌘K"}</kbd> anywhere</span></div>
      </div>
    </div>
  );
}
