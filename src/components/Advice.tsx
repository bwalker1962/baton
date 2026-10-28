import type { Consideration, Segment } from "@/lib/advisor";

const IMPACT_CLS = { Highest: "b-good", High: "b-info", Medium: "b-neutral" } as const;

export function AdviceRow({ c, segment, clientName, rank, compact }: { c: Consideration; segment?: Segment; clientName?: string; rank?: number; compact?: boolean }) {
  const peer = segment ? c.peer?.[segment] : undefined;
  return (
    <div className="row" style={{ alignItems: "flex-start", gap: 12 }}>
      {rank !== undefined && <span className="muted" style={{ fontWeight: 700, width: 18, textAlign: "right", paddingTop: 2 }}>{rank}</span>}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <strong>{c.title}</strong>
          <span className={`badge ${IMPACT_CLS[c.impact]}`}>{c.impact} impact</span>
          <span className="badge b-neutral">{c.effort} effort</span>
        </div>
        <div className="small"><span className="muted">For the customer: </span>{c.customer}</div>
        {peer && !compact && <div className="small"><span className="muted">Companies like {clientName}: </span>{peer}</div>}
        {!compact && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 2 }}>
            {c.skills.map((s) => <span key={s} className="chip chip-skill">{s}</span>)}
          </div>
        )}
      </div>
    </div>
  );
}
