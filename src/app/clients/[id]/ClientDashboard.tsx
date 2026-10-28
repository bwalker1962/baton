"use client";
import { Dashboard } from "@/components/Dashboard";
import { DEFAULT_CLIENT } from "@/components/Widgets";
import { StartProjectPill } from "@/components/ProjectStarter";

// A client's first tab: a dashboard you arrange, led by what you owe this CEO.
export function ClientDashboard({ clientId }: { clientId: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <StartProjectPill clientId={clientId} />
      <Dashboard storageKey={`baton-dash-${clientId}-v2`} scope="client" clientId={clientId} defaults={DEFAULT_CLIENT} />
    </div>
  );
}
