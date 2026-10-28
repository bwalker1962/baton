import { notFound } from "next/navigation";
import { clients, getClient } from "@/lib/data";
import { ClientTabs } from "@/components/ClientTabs";
import { ClientHeader } from "@/components/ClientHeader";
import { Icon } from "@/components/Icon";

export function generateStaticParams() {
  return clients.map((c) => ({ id: c.id }));
}

export default async function ClientLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = getClient(id);
  if (!client) notFound();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <ClientHeader client={client} />
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
