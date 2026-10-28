"use client";
import type { Client } from "@/lib/types";
import { useStore } from "@/lib/store";
import { Icon } from "./Icon";

/** Quick-access files for a client, including documents dropped into Baton. */
export function KeyFiles({ client }: { client: Client }) {
  const { docs } = useStore();
  const mine = docs.filter((d) => d.clientId === client.id);
  return (
    <section aria-label="Key files" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
      {client.keyFiles.map((f) => (
        <a key={f.label} href="#" className="btn" style={{ minHeight: 36, fontWeight: 500 }} title={`${f.source} · updated ${f.updated}`}>
          <Icon name={f.isLogin ? "lock" : "file"} size={15} />{f.label}
          <span className="muted xs">{f.isLogin ? "vault" : f.source}</span>
        </a>
      ))}
      {mine.map((d) => (
        <a key={d.id} href="#" className="btn fade" style={{ minHeight: 36, fontWeight: 500, borderStyle: "dashed" }} title={`${d.name} · added ${d.added}`}>
          <Icon name="file" size={15} />{d.kind === "Document" ? d.name : d.kind}
          <span className="muted xs">new</span>
        </a>
      ))}
      <span className="muted xs hide-mobile" style={{ marginLeft: 4 }}>Drop files anywhere to add them</span>
    </section>
  );
}
