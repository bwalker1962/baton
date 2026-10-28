"use client";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getClient } from "@/lib/data";
import { useStore } from "@/lib/store";
import type { SignoffItem } from "@/lib/types";
import { Icon } from "@/components/Icon";
import { ClientTile, Due } from "@/components/ui";

const CHECKS = ["Read in full", "Claims and proof points accurate", "Recipients, channel and send time right"];

type ChangePath = "fix" | "owner" | "call" | "meet" | "chat";
const PATHS: { id: ChangePath; title: string; sub: string; icon: string; holds?: boolean }[] = [
  { id: "fix", title: "I'll fix it now", sub: "Edit inline; your edit ships", icon: "file" },
  { id: "owner", title: "Owner applies my notes", sub: "Comes back as a one-tap diff to confirm", icon: "link" },
  { id: "call", title: "Call me", sub: "Free today: 11:30, 2:00, 4:15", icon: "phone", holds: true },
  { id: "meet", title: "Let's meet", sub: "15 minutes, item and notes as the agenda", icon: "calendar", holds: true },
  { id: "chat", title: "Discuss in chat", sub: "Scoped to this item", icon: "chat", holds: true },
];

function Asset({ item, accent }: { item: SignoffItem; accent: string }) {
  if (item.kind === "email") {
    return (
      <article aria-label="Email preview" className="card" style={{ overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--divider)", lineHeight: 1.6 }} className="small">
          <div><span className="muted">From</span> [Sender, {getClient(item.clientId)?.name}]</div>
          <div><span className="muted">To</span> [Recipient]</div>
          <div style={{ fontWeight: 700, fontSize: 15, marginTop: 4 }}>{item.subject}</div>
        </div>
        <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 10, lineHeight: 1.6, fontSize: 15 }}>
          <span style={{ height: 26, width: 110, borderRadius: 6, background: accent, color: "#fff", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>[Logo]</span>
          {item.body.map((p) => <p key={p} style={{ margin: 0 }}>{p}</p>)}
        </div>
      </article>
    );
  }
  if (item.kind === "social") {
    return (
      <article aria-label="Post preview" className="card" style={{ overflow: "hidden", maxWidth: 460 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 12px" }}><span style={{ width: 32, height: 32, borderRadius: "50%", background: accent }} aria-hidden="true" /><strong className="small">[{item.channel} account]</strong></div>
        <div role="img" aria-label="Post image placeholder" style={{ aspectRatio: "1 / 1", background: `color-mix(in srgb, ${accent} 14%, var(--surface-2))`, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontWeight: 600, textAlign: "center", padding: 20 }}>[Image from Moda, shown full size]</div>
        <div style={{ padding: "10px 12px", lineHeight: 1.5 }} className="small">{item.body.map((p) => <p key={p} style={{ margin: "0 0 6px" }}>{p}</p>)}</div>
      </article>
    );
  }
  return (
    <article aria-label="Document preview" className="card" style={{ padding: 24, lineHeight: 1.7 }}>
      {item.body.map((p) => <p key={p} style={{ margin: "0 0 10px" }}>{p}</p>)}
    </article>
  );
}

export default function Review({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { items, decide } = useStore();
  const router = useRouter();
  const item = items.find((i) => i.id === id);
  const [checks, setChecks] = useState<boolean[]>(CHECKS.map(() => false));
  const [note, setNote] = useState("");
  const [lessonTo, setLessonTo] = useState("skill");
  const [sheet, setSheet] = useState<null | "changes" | "resubmit" | "decline">(null);
  const [path, setPath] = useState<ChangePath>("call");

  useEffect(() => { setChecks(CHECKS.map(() => false)); setNote(""); setSheet(null); }, [id]);

  if (!item) return <section className="card empty"><h3>Item not found</h3><Link href="/signoff" className="btn">Back to sign-off</Link></section>;
  const client = getClient(item.clientId)!;
  const queue = items.filter((i) => i.state === "needs");
  const next = queue.find((i) => i.id !== id);
  const ready = checks.every(Boolean);
  const decided = item.state !== "needs";

  const finish = (state: Parameters<typeof decide>[1], outcome?: string) => {
    decide(item.id, state, outcome);
    setSheet(null);
    router.push(next ? `/signoff/${next.id}` : "/signoff");
  };

  return (
    <div style={{ ["--accent" as string]: client.color, display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="pagehead">
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Link href="/signoff" className="btn" aria-label="Back to sign-off" style={{ minHeight: 40, padding: "0 10px" }}><Icon name="back" /></Link>
          <ClientTile client={client} />
          <div>
            <div className="eyebrow">{client.name} · {item.dept} · {queue.findIndex((i) => i.id === id) + 1 || "–"} of {queue.length}</div>
            <h1 className="title" style={{ fontSize: 22 }}>{item.title}</h1>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {!decided && <span className="badge b-eyes"><Icon name="eye" size={13} />Needs your eyes</span>}
          <span className="badge b-neutral">Tier {item.tier}</span>
          <span className="badge b-neutral">{item.skill} {item.version}</span>
          <Due iso={item.due} />
        </div>
      </div>

      <div className="split">
        <div className="wide" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div className="muted small">Exact version that will go out · {item.sendAt}</div>
          <Asset item={item} accent={client.color} />
        </div>
        <aside className="narrow" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {item.regulatory && (
            <section className="card" style={{ padding: 14 }}>
              <h2 style={{ margin: "0 0 6px", fontSize: 14, display: "flex", gap: 6, alignItems: "center" }}><Icon name="check" size={16} />rf-regulatory checked</h2>
              <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }} className="small">{item.regulatory.map((r) => <li key={r}>{r}</li>)}</ul>
            </section>
          )}
          {item.changedSinceLast && (
            <section className="card" style={{ padding: 14 }}>
              <h2 style={{ margin: "0 0 6px", fontSize: 14 }}>Changed since your last look</h2>
              <p className="small" style={{ margin: 0 }}>{item.changedSinceLast}</p>
            </section>
          )}
          {item.sendAt.startsWith("Blocked") && (
            <div className="note" style={{ background: "var(--bad-bg)", color: "var(--bad-fg)" }}><Icon name="stop" size={16} />Send step is blocked: no send tool connected.</div>
          )}
        </aside>
      </div>

      {decided ? (
        <section className="card" style={{ padding: 16 }}>
          <strong>Decided:</strong> {item.state.replace("-", " ")} {item.outcome && <span className="muted">· {item.outcome}</span>}
        </section>
      ) : (
        <section id="decision" className="card" aria-label="Decision" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12, borderWidth: 2, borderColor: "var(--text)" }}>
          <fieldset style={{ border: 0, padding: 0, margin: 0, display: "flex", gap: 16, flexWrap: "wrap" }}>
            <legend style={{ fontWeight: 700, marginBottom: 6 }}>Sign-off checklist</legend>
            {CHECKS.map((c, n) => (
              <label key={c} style={{ display: "flex", gap: 8, alignItems: "center", minHeight: 32, cursor: "pointer" }}>
                <input type="checkbox" checked={checks[n]} onChange={() => setChecks((all) => all.map((v, k) => (k === n ? !v : v)))} style={{ width: 18, height: 18 }} />{c}
              </label>
            ))}
          </fieldset>
          <label className="small" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <strong>Note (saved as training signal)</strong>
            <textarea className="input" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="What would make this better next time?" />
          </label>
          <label className="small" style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span className="muted">Apply lesson to</span>
            <select className="input" value={lessonTo} onChange={(e) => setLessonTo(e.target.value)} style={{ width: "auto", padding: "6px 8px" }}>
              <option value="skill">{item.skill} (all clients)</option>
              <option value="client">{client.name} Direction only</option>
              <option value="item">Just this item</option>
            </select>
          </label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <button className="btn btn-danger" onClick={() => setSheet("decline")}>Decline</button>
            <button className="btn" onClick={() => setSheet("resubmit")}>Changes and resubmit</button>
            <button className="btn btn-outline" onClick={() => setSheet("changes")}>Approve with changes</button>
            <button className="btn btn-primary btn-lg" disabled={!ready} onClick={() => finish("approved")} title={ready ? undefined : "Tick the checklist first"} style={!ready ? { opacity: 0.45, cursor: "not-allowed" } : undefined}>
              <Icon name="eyecheck" />Approve{item.tier === 1 ? " · confirm" : ""}
            </button>
          </div>
          {!ready && <div className="muted xs" style={{ textAlign: "right" }}>Approve unlocks once the checklist is ticked.</div>}
        </section>
      )}

      {!decided && (
        <div className="show-mobile sticky-actions" style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setSheet("changes")}>With changes</button>
          <button className="btn btn-primary btn-lg" style={{ flex: 1.4 }}
            onClick={() => (ready ? finish("approved") : document.getElementById("decision")?.scrollIntoView({ behavior: "smooth" }))}>
            <Icon name="eyecheck" />{ready ? "Approve" : "Review checklist"}
          </button>
        </div>
      )}

      {sheet && (
        <div className="backdrop" role="presentation" onClick={() => setSheet(null)}>
          <div className="sheet fade" role="dialog" aria-modal="true" aria-label={sheet} onClick={(e) => e.stopPropagation()}>
            {sheet === "changes" ? (
              <>
                <h2 style={{ margin: 0, fontSize: 20 }}>Approve with changes</h2>
                <div className="muted small">{item.title} · {item.sendAt}</div>
                <label className="small" style={{ display: "flex", flexDirection: "column", gap: 4 }}><strong>What should change?</strong>
                  <textarea className="input" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Small fixes only: a word, a date, a link" />
                </label>
                <div className="muted xs">If the change grows past small fixes, or touches a claim, price or recipient list, it becomes Changes and resubmit.</div>
                {PATHS.map((p, n) => (
                  <div key={p.id}>
                    {n === 2 && <div className="xs muted" style={{ fontWeight: 700, letterSpacing: "0.04em", margin: "6px 0" }}>TALK IT THROUGH · HOLDS THE SEND</div>}
                    <label className={`option ${path === p.id ? "selected" : ""}`}>
                      <input type="radio" name="path" checked={path === p.id} onChange={() => setPath(p.id)} />
                      <span className="grow"><strong>{p.title}</strong><br /><span className="muted small">{p.sub}</span></span>
                      <Icon name={p.icon} />
                    </label>
                  </div>
                ))}
                {PATHS.find((p) => p.id === path)?.holds && !item.sendAt.startsWith("Blocked") && (
                  <div className="note" style={{ background: "var(--warn-bg)", color: "var(--warn-fg)" }}><Icon name="alert" size={16} />Send is set for {item.sendAt}. It will hold until you confirm the changes.</div>
                )}
                <button className="btn btn-primary btn-lg" onClick={() => {
                  const holds = PATHS.find((p) => p.id === path)?.holds;
                  finish(holds ? "held" : "approved-changes", note || PATHS.find((p) => p.id === path)?.title);
                }}>{PATHS.find((p) => p.id === path)?.holds ? "Hold send and request" : "Approve with these changes"}</button>
              </>
            ) : (
              <>
                <h2 style={{ margin: 0, fontSize: 20 }}>{sheet === "resubmit" ? "Changes and resubmit" : "Decline"}</h2>
                <p className="muted small" style={{ margin: 0 }}>{sheet === "resubmit" ? "Returns to the owner with your notes, then comes back through full sign-off." : "Closes the item; anything depending on it is cancelled."}</p>
                <label className="small" style={{ display: "flex", flexDirection: "column", gap: 4 }}><strong>{sheet === "resubmit" ? "What needs to change?" : "Reason"}</strong>
                  <textarea className="input" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
                </label>
                <button className={`btn btn-lg ${sheet === "decline" ? "btn-danger" : "btn-primary"}`} onClick={() => finish(sheet === "resubmit" ? "resubmit" : "declined", note)}>
                  {sheet === "resubmit" ? "Send back" : "Decline item"}
                </button>
              </>
            )}
            <button className="btn" onClick={() => setSheet(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
