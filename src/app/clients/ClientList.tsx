"use client";
import Link from "next/link";
import { activeClients } from "@/lib/data";
import { useStore } from "@/lib/store";
import { ClientTile, StatusBadge } from "@/components/ui";

/** Live client workspaces. Archived ones are under Spaces; deleted ones are in Trash. */
export function ClientList() {
  useStore(); // re-render when a workspace is archived or deleted
  const list = activeClients();
  return (
    <section className="card">
      {list.map((c) => (
        <Link className="row" key={c.id} href={`/clients/${c.id}`}>
          <ClientTile client={c} />
          <span className="grow"><span style={{ fontWeight: 600 }}>{c.name}</span><br /><span className="muted small">{c.phase} · {c.retainer}</span></span>
          <StatusBadge health={c.health} />
        </Link>
      ))}
      {list.length === 0 && <div className="empty"><h3>No live clients</h3><p>Archived workspaces are under Spaces; deleted ones are in Trash.</p></div>}
    </section>
  );
}
