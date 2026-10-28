import Link from "next/link";
import { clients } from "@/lib/data";
import { ClientTile, StatusBadge } from "@/components/ui";

export const metadata = { title: "Clients" };

export default function Clients() {
  return (
    <>
      <h1 className="title">Clients</h1>
      <section className="card">
        {clients.map((c) => (
          <Link className="row" key={c.id} href={`/clients/${c.id}`}>
            <ClientTile client={c} />
            <span className="grow"><span style={{ fontWeight: 600 }}>{c.name}</span><br /><span className="muted small">{c.phase} · {c.retainer}</span></span>
            <StatusBadge health={c.health} />
          </Link>
        ))}
      </section>
    </>
  );
}
