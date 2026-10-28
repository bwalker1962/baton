"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { seg: "", label: "Score" },
  { seg: "tasks", label: "Tasks" },
  { seg: "projects", label: "Projects" },
  { seg: "chats", label: "Chats" },
  { seg: "apps", label: "Apps & files" },
  { seg: "report", label: "CEO report" },
];

export function ClientTabs({ id }: { id: string }) {
  const path = usePathname();
  const base = `/clients/${id}`;
  return (
    <nav className="tabs" aria-label="Client sections">
      {TABS.map((t) => {
        const href = t.seg ? `${base}/${t.seg}` : base;
        const active = t.seg ? path.startsWith(href) : path === base;
        return (
          <Link key={t.label} href={href} aria-current={active ? "page" : undefined}>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
