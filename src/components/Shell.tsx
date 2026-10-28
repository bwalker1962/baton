"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clients, firm } from "@/lib/data";
import { useStore, UNDO_SECONDS, type Mode } from "@/lib/store";
import { Icon } from "./Icon";
import { ClientTile } from "./ui";
import { useEffect, useState } from "react";

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
        <button className="search" aria-label="Search or jump">
          <Icon name="search" size={16} />
          <span>Search or jump to a client, task, chat…</span>
          <kbd>⌘K</kbd>
        </button>
        {active && (
          <span className="switcher hide-mobile">
            <ClientTile client={active} small />
            {active.name}
          </span>
        )}
        <ModeSwitch />
        <Link href="/login" className="avatar hide-mobile" aria-label="Brett Walker. Sign out" title="Sign out" style={{ textDecoration: "none" }}>BW</Link>
      </header>

      <div className="layout">
        <nav className="sidenav" aria-label="Main">
          <Link href="/" aria-current={is("/")}><Icon name="home" />Home</Link>
          <Link href="/today" aria-current={is("/today")}><Icon name="tasks" />Today</Link>
          <Link href="/signoff" aria-current={is("/signoff")}><Icon name="eye" />Sign-off{eyes > 0 && <span className="navcount">{eyes}</span>}</Link>
          <Link href="/advisor" aria-current={is("/advisor")}><Icon name="bulb" />Advisor</Link>
          <Link href="/skills" aria-current={is("/skills")}><Icon name="layers" />Skills</Link>
          <div className="navlabel">CLIENTS</div>
          {clients.map((c) => {
            const dot = { good: "var(--good-dot)", warn: "var(--warn-dot)", bad: "var(--bad-dot)", none: "var(--gray-dot)" }[c.health];
            return (
              <Link key={c.id} href={`/clients/${c.id}`} aria-current={clientId === c.id ? "page" : undefined}>
                <ClientTile client={c} small />
                {c.name}
                <span className="dot" style={{ marginLeft: "auto", background: dot }} aria-hidden="true" />
              </Link>
            );
          })}
          <div style={{ marginTop: "auto", padding: "24px 12px 0" }} className="xs muted">© 2026 {firm.name}</div>
        </nav>
        <main className="main">{children}</main>
      </div>

      <nav className="bottomnav" aria-label="Mobile">
        <Link href="/signoff" aria-current={is("/signoff")}><Icon name="eye" size={22} />Sign-off</Link>
        <Link href="/today" aria-current={is("/today")}><Icon name="tasks" size={22} />Today</Link>
        <Link href="/" aria-current={is("/")}><Icon name="check" size={22} />Glance</Link>
        <Link href="/clients" aria-current={is("/clients")}><Icon name="grid" size={22} />Clients</Link>
        <Link href="/skills" aria-current={is("/skills")}><Icon name="user" size={22} />More</Link>
      </nav>
      <Toast />
    </div>
  );
}
