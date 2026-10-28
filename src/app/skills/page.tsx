import { skills } from "@/lib/data";

export const metadata = { title: "Skills" };

export default function Skills() {
  const depts = [...new Set(skills.map((s) => s.dept))];
  return (
    <>
      <div className="pagehead">
        <div>
          <div className="eyebrow">Shared across every client · each loads that client&apos;s Direction</div>
          <h1 className="title">Skills</h1>
        </div>
      </div>
      {depts.map((d) => (
        <section className="card scroll-x" key={d}>
          <div className="card-head"><h2 style={{ fontSize: 14 }}>{d}</h2></div>
          <table className="tbl" style={{ minWidth: 560 }}>
            <tbody>
              {skills.filter((s) => s.dept === d).map((s) => (
                <tr key={s.id}>
                  <td style={{ width: 160 }}><span className="chip chip-skill">{s.id}</span></td>
                  <td>{s.job}</td>
                  <td className="muted small" style={{ width: 70 }}>{s.version}</td>
                  <td style={{ width: 150, textAlign: "right" }}>
                    {s.firstPass === null ? <span className="badge b-neutral">New · no data yet</span> : (
                      <span className={`badge ${s.firstPass >= 85 ? "b-good" : s.firstPass >= 75 ? "b-warn" : "b-bad"}`}>{s.firstPass}% first-pass</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
      <p className="muted small">First-pass approval is the share of a skill&apos;s work you approved without changes. Figures are sample data.</p>
    </>
  );
}
