"use client";
import { useEffect, useMemo, useState } from "react";
import { clients } from "@/lib/data";
import { CUSTOMER_TEST, FUNDAMENTALS, PEERS, TOPICS, ranked, topicFor } from "@/lib/advisor";
import { AdviceRow } from "@/components/Advice";
import { ClientTile } from "@/components/ui";
import { Icon } from "@/components/Icon";

export default function Advisor() {
  const [clientId, setClientId] = useState(clients[1].id);
  const [ask, setAsk] = useState("");
  const [query, setQuery] = useState("newsletter");

  // Deep links from projects: /advisor?client=pentara&topic=booth
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("client")) setClientId(p.get("client")!);
    if (p.get("topic")) setQuery(TOPICS.find((t) => t.id === p.get("topic"))?.name ?? p.get("topic")!);
  }, []);

  const client = clients.find((c) => c.id === clientId)!;
  const peer = PEERS[clientId];
  const topic = useMemo(() => TOPICS.find((t) => t.name === query) ?? topicFor(query), [query]);
  const skillsUsed = [...new Set([...(topic?.items ?? []), ...FUNDAMENTALS].flatMap((c) => c.skills))];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 1000 }}>
      <div className="pagehead">
        <div>
          <div className="eyebrow">Best practices, customer first</div>
          <h1 className="title">Advisor</h1>
        </div>
      </div>

      <section className="card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }} role="radiogroup" aria-label="Client">
          {clients.map((c) => (
            <button key={c.id} role="radio" aria-checked={c.id === clientId} className={`btn ${c.id === clientId ? "btn-outline" : ""}`} onClick={() => setClientId(c.id)} style={{ minHeight: 38 }}>
              <ClientTile client={c} small />{c.name}
            </button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); if (ask.trim()) setQuery(ask.trim()); }} style={{ display: "flex", gap: 8 }}>
          <input className="input" value={ask} onChange={(e) => setAsk(e.target.value)} placeholder="What are you working on? e.g. trade show booth, website refresh, newsletter" aria-label="Area to advise on" style={{ flex: 1 }} />
          <button className="btn btn-primary" type="submit">Advise</button>
        </form>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {TOPICS.map((t) => (
            <button key={t.id} className={`badge ${topic?.id === t.id ? "b-info" : "b-neutral"}`} style={{ cursor: "pointer", padding: "6px 10px", fontSize: 13, border: "1px solid var(--border)" }} onClick={() => { setQuery(t.name); setAsk(""); }} aria-pressed={topic?.id === t.id}>{t.name}</button>
          ))}
        </div>
      </section>

      <section className="card" style={{ padding: 16, display: "flex", gap: 14, alignItems: "flex-start" }} aria-label="Compared with">
        <ClientTile client={client} size={40} />
        <div className="small" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {peer.segment ? (
            <>
              <div><span className="muted">Compared with: </span><strong>{peer.peers}</strong></div>
              <div><span className="muted">Their customers: </span>{peer.buyers}</div>
            </>
          ) : (
            <>
              <strong>{client.name} doesn&apos;t have a peer set yet.</strong>
              <span className="muted">Advice below is general. Name three companies it competes with, or finish the strategic brief, and the advice gets specific.</span>
            </>
          )}
        </div>
      </section>

      <section className="card" aria-label="Highest-impact moves">
        <div className="card-head">
          <h2>{topic ? `${topic.name}: highest-impact moves` : `"${query}"`}</h2>
          <span className="muted small">Ranked by impact, then least effort</span>
        </div>
        {topic ? (
          ranked(topic.items).map((c, n) => <AdviceRow key={c.id} c={c} rank={n + 1} segment={peer.segment} clientName={client.name} />)
        ) : (
          <div className="row small" style={{ gap: 8 }}>
            <Icon name="search" size={16} />
            <span>No playbook for this area yet. In the build, rf-compete researches what companies like {client.name} do here and returns ranked moves with sources. Meanwhile the fundamentals below still apply.</span>
          </div>
        )}
      </section>

      <div className="split">
        <section className="card wide" aria-label="Applies to everything">
          <div className="card-head"><h2>Applies to everything</h2><span className="muted small">It&apos;s about your customers, not about you</span></div>
          {ranked(FUNDAMENTALS).map((c) => <AdviceRow key={c.id} c={c} compact />)}
        </section>
        <aside className="narrow" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <section className="card" style={{ padding: 14 }} aria-label="Customer-first test">
            <h2 style={{ margin: "0 0 8px", fontSize: 14 }}>Customer-first test</h2>
            <ol style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }} className="small">{CUSTOMER_TEST.map((q) => <li key={q}>{q}</li>)}</ol>
          </section>
          <section className="card" style={{ padding: 14 }} aria-label="Skills used">
            <h2 style={{ margin: "0 0 8px", fontSize: 14 }}>Skills behind this advice</h2>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{skillsUsed.map((s) => <span key={s} className="chip chip-skill">{s}</span>)}</div>
          </section>
          <p className="xs muted" style={{ margin: 0 }}>Prototype shows sample guidance. In the build, every peer practice is researched live and cited with a link and date, and your sign-off notes refine it.</p>
        </aside>
      </div>
    </div>
  );
}
