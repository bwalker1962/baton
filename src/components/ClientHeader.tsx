"use client";
import { useClientLook } from "@/lib/store";
import type { Client } from "@/lib/types";
import { ClientTile } from "./ClientTile";
import { StatusBadge } from "./ui";

const PHASES = ["Align", "Shape", "Grow", "Optimize"] as const;

export function ClientHeader({ client }: { client: Client }) {
  const look = useClientLook(client);
  const at = PHASES.indexOf(client.phase);
  return (
    <div className="pagehead">
      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <ClientTile client={client} size={48} />
        <div>
          <div className="eyebrow">{client.retainer}{client.regulated ? " · regulated: compliance review on" : ""}</div>
          <h1 className="title" style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            {client.name} <StatusBadge health={client.health} />
          </h1>
        </div>
      </div>
      <ol aria-label="Engagement phase" style={{ display: "flex", gap: 6, listStyle: "none", margin: 0, padding: 0, flexWrap: "wrap" }}>
        {PHASES.map((p, i) => (
          <li key={p} className={`badge ${i === at ? "" : "b-neutral"}`} style={i === at ? { background: look.color, color: "#fff" } : i < at ? { opacity: 0.75 } : undefined} aria-current={i === at ? "step" : undefined}>
            {i < at ? "✓ " : ""}{p}
          </li>
        ))}
      </ol>
    </div>
  );
}
