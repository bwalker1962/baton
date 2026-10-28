import { notFound } from "next/navigation";
import { clients, getClient } from "@/lib/data";
import { StatusBadge } from "@/components/ui";
import { ClientTabs } from "@/components/ClientTabs";
import { Icon } from "@/components/Icon";

export function generateStaticParams() {
  return clients.map((c) => ({ id: c.id }));
}

const PHASES = ["Align", "Shape", "Grow", "Optimize"] as const;

export default async function ClientLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = getClient(id);
  if (!client) notFound();
  const at = PHASES.indexOf(client.phase);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div className="pagehead">
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <span className="tile" style={{ background: client.color, width: 48, height: 48, borderRadius: 12, fontSize: 20 }} aria-hidden="true">{client.initial}</span>
          <div>
            <div className="eyebrow">{client.retainer}{client.regulated ? " · regulated: compliance review on" : ""}</div>
            <h1 className="title" style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              {client.name} <StatusBadge health={client.health} />
            </h1>
          </div>
        </div>
        <ol aria-label="Engagement phase" style={{ display: "flex", gap: 6, listStyle: "none", margin: 0, padding: 0, flexWrap: "wrap" }}>
          {PHASES.map((p, i) => (
            <li key={p} className={`badge ${i === at ? "" : "b-neutral"}`} style={i === at ? { background: client.color, color: "#fff" } : i < at ? { opacity: 0.75 } : undefined} aria-current={i === at ? "step" : undefined}>
              {i < at ? "✓ " : ""}{p}
            </li>
          ))}
        </ol>
      </div>

      <section aria-label="Key files" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {client.keyFiles.map((f) => (
          <a key={f.label} href="#" className="btn" style={{ minHeight: 36, fontWeight: 500 }} title={`${f.source} · updated ${f.updated}`}>
            <Icon name={f.isLogin ? "lock" : "file"} size={15} />{f.label}
            <span className="muted xs">{f.isLogin ? "vault" : f.source}</span>
          </a>
        ))}
      </section>

      <ClientTabs id={client.id} />
      {children}
    </div>
  );
}
