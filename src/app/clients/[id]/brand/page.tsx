"use client";
import { use, useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { getClient } from "@/lib/data";
import { contrastWithWhite, readableAccent } from "@/lib/color";
import { useStore } from "@/lib/store";
import { Icon } from "@/components/Icon";

type Phase = "idle" | "scanning" | "found";

export default function Brand({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const client = getClient(id);
  const { brand, setBrand } = useStore();
  const saved = client ? brand[client.id] : undefined;

  const [url, setUrl] = useState(client?.website ?? "");
  const [phase, setPhase] = useState<Phase>(saved ? "found" : "idle");
  const [color, setColor] = useState(saved?.color ?? client?.detected.palette[0]?.hex ?? "#5b6cf0");
  const [logo, setLogo] = useState(saved?.logo ?? client?.detected.logos[0]?.id ?? "monogram");
  const [initial, setInitial] = useState(saved?.initial ?? client?.initial ?? "?");
  const [savedNote, setSavedNote] = useState(false);

  useEffect(() => {
    if (phase !== "scanning") return;
    const t = setTimeout(() => setPhase("found"), 900);
    return () => clearTimeout(t);
  }, [phase]);

  if (!client) notFound();
  const accent = readableAccent(color);
  const tile = (size: number, round = 8) => (
    <span className="tile" style={{ background: accent.color, width: size, height: size, borderRadius: round, fontSize: size * 0.42 }} aria-hidden="true">
      {logo === "monogram" ? initial : <svg width="60%" height="60%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M4 18L10 8l4 6 2-3 4 7z" /></svg>}
    </span>
  );

  const save = () => {
    setBrand(client.id, { color, accent: accent.color, logo, initial });
    setSavedNote(true);
    setTimeout(() => setSavedNote(false), 2500);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 960 }}>
      <section className="card">
        <div className="card-head">
          <h2>Pull brand from website</h2>
          <span className="muted small">Gathered automatically; adjust anything</span>
        </div>
        <div style={{ display: "flex", gap: 8, padding: "0 18px 16px", flexWrap: "wrap" }}>
          <label style={{ flex: 1, minWidth: 240 }}>
            <span style={{ position: "absolute", left: -9999 }}>Client website</span>
            <input className="input" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" />
          </label>
          <button className="btn btn-primary" onClick={() => setPhase("scanning")} disabled={phase === "scanning"}>
            {phase === "scanning" ? "Reading site…" : phase === "found" ? "Fetch again" : "Fetch brand"}
          </button>
        </div>
        <div className="row muted xs">Reads the site&apos;s logo, favicon, app icon, social image, theme color and main colors. Prototype shows sample results.</div>
      </section>

      {phase === "found" && (
        <div className="split fade">
          <div className="wide" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <section className="card">
              <div className="card-head"><h2>Logo</h2></div>
              <div className="grid-auto" style={{ padding: "0 18px 16px", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))" }}>
                {[...client.detected.logos, { id: "monogram", source: "Monogram", kind: "logo" as const }].map((l) => (
                  <label key={l.id} className={`option ${logo === l.id ? "selected" : ""}`} style={{ flexDirection: "column", alignItems: "flex-start", padding: 12 }}>
                    <span style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                      <input type="radio" name="logo" checked={logo === l.id} onChange={() => setLogo(l.id)} />
                      <span className="badge b-neutral">{l.kind}</span>
                    </span>
                    <span role="img" aria-label={`${l.source} preview`} style={{ width: "100%", height: 64, borderRadius: 8, background: "var(--surface-2)", border: "1px dashed var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontSize: 12 }}>
                      {l.id === "monogram" ? <span className="tile" style={{ background: accent.color }}>{initial}</span> : "[image]"}
                    </span>
                    <span className="small" style={{ fontWeight: 600 }}>{l.source}</span>
                  </label>
                ))}
              </div>
              {logo === "monogram" && (
                <label className="row small" style={{ gap: 8 }}>
                  <span className="muted">Monogram letters</span>
                  <input className="input" value={initial} maxLength={2} onChange={(e) => setInitial(e.target.value.toUpperCase() || "?")} style={{ width: 70 }} />
                </label>
              )}
            </section>

            <section className="card">
              <div className="card-head"><h2>Color</h2><span className="muted small">Used for this client&apos;s tile, top bar and accents</span></div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", padding: "0 18px 12px" }}>
                {client.detected.palette.map((p) => (
                  <button key={p.hex} onClick={() => setColor(p.hex)} aria-pressed={color === p.hex} className="card" style={{ padding: 8, display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start", borderWidth: 2, borderColor: color === p.hex ? "var(--text)" : "var(--border)", width: 130 }}>
                    <span style={{ width: "100%", height: 40, borderRadius: 6, background: p.hex, border: "1px solid var(--border)" }} aria-hidden="true" />
                    <span className="xs" style={{ fontWeight: 600 }}>{p.source}</span>
                    <span className="xs muted">{p.hex}</span>
                  </button>
                ))}
                <label className="card" style={{ padding: 8, display: "flex", flexDirection: "column", gap: 6, width: 130, cursor: "pointer" }}>
                  <input type="color" value={color} onChange={(e) => setColor(e.target.value)} style={{ width: "100%", height: 40, border: 0, background: "none" }} aria-label="Custom color" />
                  <span className="xs" style={{ fontWeight: 600 }}>Custom</span>
                  <span className="xs muted">{color}</span>
                </label>
              </div>
              {accent.adjusted && (
                <div className="row small" style={{ gap: 8 }}>
                  <Icon name="alert" size={16} />
                  <span>That color is too light for white text ({contrastWithWhite(color).toFixed(1)}:1). Baton uses a deeper shade, {accent.color}, for its own accents. The client&apos;s real brand is unchanged.</span>
                </div>
              )}
            </section>

            {client.detected.fonts.length > 0 && (
              <section className="card">
                <div className="card-head"><h2>Fonts found</h2><span className="muted small">For reference in briefs and designs</span></div>
                <div style={{ display: "flex", gap: 8, padding: "0 18px 16px", flexWrap: "wrap" }}>{client.detected.fonts.map((f) => <span key={f} className="badge b-neutral">{f}</span>)}</div>
              </section>
            )}
          </div>

          <aside className="narrow" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <section className="card" style={{ overflow: "hidden" }} aria-label="Preview">
              <div className="card-head"><h2>How it looks in Baton</h2></div>
              <div style={{ borderTop: `4px solid ${accent.color}`, padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", background: "var(--nav-bg)", borderRadius: 9, padding: "8px 12px" }}>
                  {tile(22, 6)}<span style={{ fontWeight: 600 }}>{client.name}</span>
                </div>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  {tile(48, 12)}
                  <div><div className="muted xs">Client workspace</div><strong style={{ fontSize: 18 }}>{client.name}</strong></div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span className="badge" style={{ background: accent.color, color: "#fff" }}>Grow</span>
                  <span className="badge badge-accent" style={{ ["--accent" as string]: accent.color }}>Strategy</span>
                  <button className="btn" style={{ background: accent.color, borderColor: accent.color, color: "#fff", minHeight: 34 }}>Send</button>
                </div>
              </div>
            </section>
            <button className="btn btn-primary btn-lg" onClick={save}>{savedNote ? "Saved" : "Use this brand"}</button>
            <p className="muted xs" style={{ margin: 0 }}>Applies to this client everywhere in Baton. You can also send these to the client&apos;s Moda brand kit.</p>
          </aside>
        </div>
      )}
    </div>
  );
}
