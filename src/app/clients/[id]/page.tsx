import { Score } from "./Score";

export default async function ClientScore({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <Score clientId={id} />;
}
