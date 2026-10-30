import { CardHead } from "@/components/ui";
import { notFound } from "next/navigation";
import { getClient } from "@/lib/data";
import { Icon } from "@/components/Icon";

const STATE: Record<string, { cls: string; label: string }> = {
  connected: { cls: "b-good", label: "Connected" },
  drafts: { cls: "b-info", label: "Drafts only" },
  requested: { cls: "b-warn", label: "Access requested" },
  error: { cls: "b-bad", label: "Connection failed" },
};

export default async function Apps({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = getClient(id);
  if (!client) notFound();
  return (
    <>
      <section className="card">
        <CardHead icon="plug" title="Apps" count={client.apps.length}><button className="btn">+ Connect app</button></CardHead>
        <div className="grid-auto" style={{ padding: "4px 18px 18px" }}>
          {client.apps.map((a) => (
            <div key={a.role} style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 12 }}>
              <div className="muted small">{a.role}</div>
              <div style={{ fontWeight: 600, margin: "2px 0 8px" }}>{a.app}</div>
              <span className={`badge ${STATE[a.state].cls}`}>{STATE[a.state].label}</span>
            </div>
          ))}
        </div>
        <div className="row muted small">Skills in this workspace can reach only the apps listed here. Skills ask for a role, such as Social or Email, and this list decides which app answers.</div>
      </section>
      <section className="card">
        <CardHead icon="file" title="Key files" count={client.keyFiles.length}><button className="btn">+ Pin a file</button></CardHead>
        {client.keyFiles.map((f) => (
          <div className="row" key={f.label}>
            <Icon name={f.isLogin ? "lock" : "file"} />
            <span className="grow"><strong>{f.label}</strong><br /><span className="muted small">{f.source} · updated {f.updated}</span></span>
            {f.isLogin ? <span className="badge b-neutral">Opens in your password manager</span> : <a href="#" className="btn" style={{ minHeight: 34 }}>Open</a>}
          </div>
        ))}
        <div className="row muted small">Baton never stores passwords. Login pins point to a vault item; skills never see credentials.</div>
      </section>
    </>
  );
}
