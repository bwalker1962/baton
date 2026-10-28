import { notFound } from "next/navigation";
import { clients, getClient } from "@/lib/data";
import { ClientTabs } from "@/components/ClientTabs";
import { ClientHeader } from "@/components/ClientHeader";
import { KeyFiles } from "@/components/KeyFiles";

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
      <KeyFiles client={client} />
      <ClientTabs id={client.id} />
      {children}
    </div>
  );
}
