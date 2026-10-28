"use client";
import Link from "next/link";
import { useState } from "react";
import { getClient } from "@/lib/data";
import { useStore } from "@/lib/store";
import type { SignoffItem } from "@/lib/types";
import { Icon } from "@/components/Icon";
import { ClientTile, Due } from "@/components/ui";

const DONE_LABEL: Record<string, { cls: string; text: string }> = {
  approved: { cls: "b-good", text: "Approved" },
  "approved-changes": { cls: "b-good", text: "Approved with changes" },
  resubmit: { cls: "b-warn", text: "Resubmit" },
  declined: { cls: "b-bad", text: "Declined" },
  held: { cls: "b-info", text: "Held: in discussion" },
};

function ItemRow({ i }: { i: SignoffItem }) {
  const c = getClient(i.clientId)!;
  const done = DONE_LABEL[i.state];
  return (
    <Link href={`/signoff/${i.id}`} className="row" style={{ flexWrap: "wrap" }}>
      <ClientTile client={c} />
      <span className="grow" style={{ flexBasis: 220 }}>
        <strong>{i.title}</strong><br />
        <span className="muted small">{c.name} · {i.channel} · Tier {i.tier} · {i.skill} {i.version}</span>
      </span>
      {i.regulatory && <span className="badge b-info">Compliance checked</span>}
      {done ? <span className={`badge ${done.cls}`}>{done.text}</span> : <Due iso={i.due} />}
    </Link>
  );
}

export default function SignoffQueue() {
  const { items } = useStore();
  const [tier, setTier] = useState<0 | 1 | 2>(0);
  const needs = items.filter((i) => i.state === "needs" && (!tier || i.tier === tier)).sort((a, b) => (a.due < b.due ? -1 : 1));
  const held = items.filter((i) => i.state === "held");
  const done = items.filter((i) => !["needs", "held"].includes(i.state));

  return (
    <>
      <div className="pagehead">
        <div>
          <div className="eyebrow">Nothing ships without your eyes</div>
          <h1 className="title">Sign-off</h1>
        </div>
        <div className="seg" role="group" aria-label="Filter by tier">
          <button aria-pressed={tier === 0} onClick={() => setTier(0)}>All</button>
          <button aria-pressed={tier === 1} onClick={() => setTier(1)}>Tier 1</button>
          <button aria-pressed={tier === 2} onClick={() => setTier(2)}>Tier 2</button>
        </div>
      </div>

      <section className="card">
        <div className="card-head">
          <h2 style={{ display: "flex", gap: 8, alignItems: "center" }}><span style={{ color: "var(--eyes-fg)", display: "inline-flex" }}><Icon name="eye" /></span>Needs your eyes · {needs.length}</h2>
          {needs[0] && <Link href={`/signoff/${needs[0].id}`} className="btn btn-primary">Review mode</Link>}
        </div>
        {needs.length === 0 ? (
          <div className="empty"><Icon name="check" size={28} /><h3>All clear</h3><p>Nothing needs your eyes right now.</p></div>
        ) : needs.map((i) => <ItemRow key={i.id} i={i} />)}
      </section>

      {held.length > 0 && (
        <section className="card">
          <div className="card-head"><h2>Held for discussion · {held.length}</h2><span className="muted small">Approved in principle; nothing sends until you confirm the changes</span></div>
          {held.map((i) => <ItemRow key={i.id} i={i} />)}
        </section>
      )}

      {done.length > 0 && (
        <section className="card">
          <div className="card-head"><h2>Decided today · {done.length}</h2></div>
          {done.map((i) => <ItemRow key={i.id} i={i} />)}
        </section>
      )}
    </>
  );
}
