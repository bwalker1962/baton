"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";

const TABS = [
  { seg: "", label: "Sign-off" },
  { seg: "score", label: "Score" },
  { seg: "tasks", label: "Tasks" },
  { seg: "projects", label: "Projects" },
  { seg: "chats", label: "Chats" },
  { seg: "apps", label: "Apps & files" },
  { seg: "report", label: "CEO report" },
  { seg: "brand", label: "Brand" },
];

export function ClientTabs({ id }: { id: string }) {
  const path = usePathname();
  const { items } = useStore();
  const eyes = items.filter((i) => i.clientId === id && i.state === "needs").length;
  const base = `/clients/${id}`;
  return (
    <nav className="tabs" aria-label="Client sections">
      {TABS.map((t) => {
        const href = t.seg ? `${base}/${t.seg}` : base;
        const active = t.seg ? path.startsWith(href) : path === base;
        return (
          <Link key={t.label} href={href} aria-current={active ? "page" : undefined}>
            {t.label}{t.seg === "" && eyes > 0 && <span className="navcount" style={{ marginLeft: 6 }}>{eyes}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
