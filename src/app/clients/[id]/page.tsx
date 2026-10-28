import { ClientDashboard } from "./ClientDashboard";

export default async function ClientHome({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ClientDashboard clientId={id} />;
}
