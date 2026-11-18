"use client";
import { useClientLook, useStore } from "@/lib/store";
import { ItemMenu } from "./Housekeeping";
import { useSpaces } from "@/app/spaces/page";
import type { Client } from "@/lib/types";
import { ClientTile } from "./ClientTile";
import { StatusBadge } from "./ui";
import { CoachButton } from "./Coach";

const PHASES = ["Align", "Shape", "Grow", "Optimize"] as const;

export function ClientHeader({ client }: { client: Client }) {
  const look = useClientLook(client);
  const { updateSpace } = useStore();
  const name = useSpaces().find((s) => s.id === client.id)?.name ?? client.name;
  const at = PHASES.indexOf(client.phase);
  return (
    <div className="pagehead">
      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <ClientTile client={client} size={48} />
        <div>
          <div className="eyebrow">{client.retainer}{client.regulated ? " · regulated: compliance review on" : ""}</div>
          <h1 className="title" style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            {name} <StatusBadge health={client.health} /> <CoachButton context="client" clientId={client.id} />
            <ItemMenu item={{ kind: "workspace", id: client.id, name, clientId: client.id }} onRename={(n) => updateSpace(client.id, { id: client.id, name: n, kind: "client", color: client.color, website: client.website })} />
          </h1>
        </div>
      </div>
      <ol aria-label="Engagement phase" style={{ display: "flex", gap: 6, listStyle: "none", margin: 0, padding: 0, flexWrap: "wrap" }}>
        {PHASES.map((p, i) => (
          <li key={p} className={`badge ${i === at ? "" : "b-neutral"}`} style={i === at ? { background: look.color, color: "#fff" } : undefined} aria-current={i === at ? "step" : undefined}>
            {i < at ? "✓ " : ""}{p}
          </li>
        ))}
      </ol>
    </div>
  );
}
