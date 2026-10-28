import { SignoffList } from "@/components/SignoffList";

// A client's first tab: only this client's sign-off, so you review in one context at a time.
export default async function ClientSignoff({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <div style={{ display: "flex", flexDirection: "column", gap: 16 }}><SignoffList clientId={id} /></div>;
}
