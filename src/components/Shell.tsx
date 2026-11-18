"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clients, firm } from "@/lib/data";
import { useStore, UNDO_SECONDS, type Mode } from "@/lib/store";
import { Icon } from "./Icon";
import { DropDocs } from "./DropDocs";
import { CommandPalette } from "./CommandPalette";
import { WorkTimer } from "./WorkTimer";
import { OneOnOne } from "./OneOnOne";
import { ClientTile } from "./ui";
import { useEffect, useState } from "react";
import { useSpaces } from "@/app/spaces/page";

function ModeSwitch() {
  const { mode, setMode } = useStore();
  const opts: { m: Mode; icon: string; label: string }[] = [
    { m: "light", icon: "sun", label: "Light" },
    { m: "half", icon: "half", label: "Half-dark" },
    { m: "dark", icon: "moon", label: "Dark" },
  ];
  return (
    <div className="modes" role="radiogroup" aria-label="Appearance">
      {opts.map((o) => (
        <button key={o.m} role="radio" aria-checked={mode === o.m} aria-label={o.label} title={o.label} onClick={() => setMode(o.m)}>
          <Icon name={o.icon} size={16} />
        </button>
      ))}
    </div>
  );
}

function Toast() {
  const { pending, undo } = useStore();
  const [left, setLeft] = useState(UNDO_SECONDS);
  useEffect(() => {
    if (!pending) return;
    const tick = () => setLeft(Math.max(0, Math.ceil((pending.expires - Date.now()) / 1000)));
    tick();
    const t = setInterval(tick, 250);
    return () => clearInterval(t);
  }, [pending]);
  if (!pending) return null;
  return (
    <div className="toast fade" role="status">
      <span className="small">{pending.label}. Sends in {left}s.</span>
      <button onClick={undo}>Undo</button>
    </div>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { items, brand } = useStore();
  const spaces = useSpaces();
  const [searching, setSearching] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  useEffect(() => { try { setSidebarCollapsed(localStorage.getItem("baton-sidebar-collapsed")==="true"); } catch {} }, []);
  const toggleSidebar = () => setSidebarCollapsed(v => { const next=!v; try { localStorage.setItem("baton-sidebar-collapsed",String(next)); } catch {} return next; });
  const [mac, setMac] = useState(true);
  const [dateLabel, setDateLabel] = useState("");
  useEffect(() => {
    setMac(/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent));
    setDateLabel(new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }));
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.closest?.("input, textarea, select, [contenteditable=true]");
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setSearching((s) => !s); }
      else if (e.key === "/" && !typing) { e.preventDefault(); setSearching(true); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const eyes = items.filter((i) => i.state === "needs").length;
  const clientId = path.startsWith("/clients/") ? path.split("/")[2] : null;
  const active = clientId ? clients.find((c) => c.id === clientId) : null;
  const is = (p: string) => (p === "/" ? path === "/" : path.startsWith(p)) ? "page" : undefined;

  // Sign-up and login screens render without the app frame.
  if (["/login", "/signup", "/forgot"].some((p) => path.startsWith(p))) return <>{children}</>;

  const accent = active ? brand[active.id]?.accent ?? active.color : undefined;
  return (
    <div style={accent ? ({ ["--accent" as string]: accent } as React.CSSProperties) : undefined}>
      <header className={`topbar ${active ? "client" : ""}`}>
        <Link href="/" className="brand" aria-label="Baton home">
          <span className="brand-mark">B</span>
          <span className="brand-name">Baton</span>
          <span className="brand-sub">{firm.name}</span>
        </Link>
        <button className="baton-sidebar-toggle" onClick={toggleSidebar} aria-label={sidebarCollapsed?"Expand sidebar":"Collapse sidebar"} aria-expanded={!sidebarCollapsed} title={sidebarCollapsed?"Show navigation":"Stow navigation"}><Icon name="menu" size={18}/></button>
        <button className="search" aria-label="Search or jump" aria-keyshortcuts="Meta+K Control+K" onClick={() => setSearching(true)}>
          <Icon name="search" size={16} />
          <span>Search or jump to a client, task, chat…</span>
          <kbd>{mac ? "⌘K" : "Ctrl K"}</kbd>
        </button>
        <WorkTimer />
        <span className="baton-top-date" aria-label="Current date">{dateLabel}</span>
        {active && (
          <span className="switcher hide-mobile">
            <ClientTile client={active} small />
            {active.name}
          </span>
        )}
        <ModeSwitch />
        <Link href="/login" className="avatar hide-mobile" aria-label="Brett Walker. Sign out" title="Sign out" style={{ textDecoration: "none" }}>BW</Link>
      </header>

      <div className={`layout ${sidebarCollapsed?"baton-sidebar-stowed":""}`}>
        <nav className="sidenav" aria-label="Main">
          <Link href="/" aria-current={is("/")}><Icon name="home" />Home</Link>
          <Link href="/today" aria-current={is("/today")}><Icon name="tasks" />Today</Link>

          <Link href="/signoff" aria-current={is("/signoff")}><Icon name="eye" />Sign-off{eyes > 0 && <span className="navcount">{eyes}</span>}</Link>
          <details className="baton-nav-more"><summary><Icon name="layers" />Tools</summary><div><Link href="/advisor" aria-current={is("/advisor")}><Icon name="bulb" />Advisor</Link><Link href="/skills" aria-current={is("/skills")}><Icon name="layers" />Skills</Link><Link href="/plan" aria-current={is("/plan")}><Icon name="calendar" />Plan day</Link></div></details>
          <div className="navlabel"><Link href="/spaces" className="baton-spaces-heading">SPACES <span aria-hidden="true">+</span></Link></div>
          {spaces.filter(s=>!s.archived).map(sp=><Link key={sp.id} href={`/spaces/${sp.id}`} aria-current={path===`/spaces/${sp.id}`?"page":undefined}><span className="baton-nav-space-dot" style={{background:sp.color}} aria-hidden="true"/>{sp.name}</Link>)}
          <div style={{ marginTop: "auto", padding: "24px 12px 0" }} className="xs muted">© 2026 {firm.name}</div>
        </nav>
        <main className="main">{children}</main>
      </div>

      <nav className="bottomnav" aria-label="Mobile">
        <Link href="/signoff" aria-current={is("/signoff")}><Icon name="eye" size={22} />Sign-off</Link>
        <Link href="/today" aria-current={is("/today")}><Icon name="tasks" size={22} />Today</Link>
        <Link href="/" aria-current={is("/")}><Icon name="check" size={22} />Glance</Link>
        <Link href="/spaces" aria-current={is("/spaces")}><Icon name="grid" size={22} />Spaces</Link>
        <Link href="/skills" aria-current={is("/skills")}><Icon name="user" size={22} />More</Link>
      </nav>
      <Toast />
      <DropDocs here={active?.id} />
      <CommandPalette open={searching} onClose={() => setSearching(false)} here={active?.id} />
      <OneOnOne here={active?.id} />
    </div>
  );
}
