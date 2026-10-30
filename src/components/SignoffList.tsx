"use client";
import Link from "next/link";
import { useState } from "react";
import { getClient } from "@/lib/data";
import { useStore } from "@/lib/store";
import type { SignoffItem } from "@/lib/types";
import { Icon } from "./Icon";
import { dragInto1on1 } from "@/lib/agenda";
import { ClientTile, Due, CardHead } from "./ui";

const DONE_LABEL: Record<string, { cls: string; text: string }> = {
  approved: { cls: "b-good", text: "Approved" },
  "approved-changes": { cls: "b-good", text: "Approved with changes" },
  resubmit: { cls: "b-warn", text: "Resubmit" },
  declined: { cls: "b-bad", text: "Declined" },
  held: { cls: "b-info", text: "Held: in discussion" },
};

function ItemRow({ i, scope }: { i: SignoffItem; scope?: string }) {
  const c = getClient(i.clientId)!;
  const done = DONE_LABEL[i.state];
  const flags = (i.slips ?? []).filter((x) => x.result !== "pass").length;
  return (
    <Link href={`/signoff/${i.id}${scope ? `?client=${scope}` : ""}`} className="row" style={{ flexWrap: "wrap" }}
      {...dragInto1on1({ kind: "signoff", title: i.title, href: `/signoff/${i.id}?client=${i.clientId}`, refId: i.id, clientId: i.clientId })}>
      <ClientTile client={c} />
      <span className="grow" style={{ flexBasis: 220 }}>
        <strong>{i.title}</strong><br />
        <span className="muted small">{scope ? "" : `${c.name} · `}{i.channel} · {i.sendAt} · {i.skill} {i.version}</span>
      </span>
      {flags > 0 && !done && <span className="badge b-warn"><Icon name="alert" size={13} />{flags} to check</span>}
      {i.regulatory && <span className="badge b-info">Compliance checked</span>}
      {done ? <span className={`badge ${done.cls}`}>{done.text}</span> : <Due iso={i.due} />}
    </Link>
  );
}

/** The sign-off queue: every client, or one client when clientId is set. */
export function SignoffList({ clientId }: { clientId?: string }) {
  const { items } = useStore();
  const [tier, setTier] = useState<0 | 1 | 2>(0);
  const mine = items.filter((i) => !clientId || i.clientId === clientId);
  const needs = mine.filter((i) => i.state === "needs" && (!tier || i.tier === tier)).sort((a, b) => (a.due < b.due ? -1 : 1));
  const held = mine.filter((i) => i.state === "held");
  const done = mine.filter((i) => !["needs", "held"].includes(i.state));
  const others = clientId ? items.filter((i) => i.state === "needs" && i.clientId !== clientId).length : 0;
  const name = clientId ? getClient(clientId)?.name : undefined;

  return (
    <>
      <section className="card">
        <div className="card-head">
          <h2 className="card-title"><span className="card-icon"><Icon name="eye" size={16} /></span>Needs your eyes<span className="card-count">{needs.length}</span></h2>
          <span style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span className="seg" role="group" aria-label="Filter by tier">
              <button aria-pressed={tier === 0} onClick={() => setTier(0)}>All</button>
              <button aria-pressed={tier === 1} onClick={() => setTier(1)}>Tier 1</button>
              <button aria-pressed={tier === 2} onClick={() => setTier(2)}>Tier 2</button>
            </span>
            {needs[0] && <Link href={`/signoff/${needs[0].id}${clientId ? `?client=${clientId}` : ""}`} className="btn btn-primary">Review mode</Link>}
          </span>
        </div>
        {needs.length === 0 ? (
          <div className="empty"><Icon name="check" size={28} /><h3>All clear</h3><p>Nothing{name ? ` from ${name}` : ""} needs your eyes right now.</p></div>
        ) : needs.map((i) => <ItemRow key={i.id} i={i} scope={clientId} />)}
        {clientId && others > 0 && (
          <Link href="/signoff" className="row small muted"><Icon name="link" size={14} />{others} more waiting for other clients</Link>
        )}
      </section>

      {held.length > 0 && (
        <section className="card">
          <CardHead icon="clock" title="Held for discussion" count={held.length} sub="Nothing sends until you confirm the changes" />
          {held.map((i) => <ItemRow key={i.id} i={i} scope={clientId} />)}
        </section>
      )}

      {done.length > 0 && (
        <section className="card">
          <CardHead icon="check" title="Decided today" count={done.length} />
          {done.map((i) => <ItemRow key={i.id} i={i} scope={clientId} />)}
        </section>
      )}
    </>
  );
}
