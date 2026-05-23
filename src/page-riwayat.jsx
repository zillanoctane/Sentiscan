/* global React, AppData, Card, ComparisonBars */
const { useState } = React;

function PageRiwayat() {
  const exps = [...AppData.EXPERIMENTS].reverse();
  const [selected, setSelected] = useState(exps[0].id);
  const exp = AppData.EXPERIMENTS.find(e => e.id === selected);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 22 }}>
      <Card title="Riwayat eksperimen" subtitle={`${exps.length} eksperimen`} padded={false}>
        <div>
          {exps.map((e, i) => {
            const active = e.id === selected;
            return (
              <div
                key={e.id}
                onClick={() => setSelected(e.id)}
                style={{
                  padding: "14px 18px",
                  borderTop: i === 0 ? "none" : "1px solid var(--line)",
                  cursor: "pointer",
                  background: active ? "var(--bg)" : "transparent",
                  position: "relative",
                }}
              >
                {active && <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 2, background: "var(--ink)" }}></span>}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: active ? 500 : 400 }}>{e.name}</span>
                  <span className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>#{e.id}</span>
                </div>
                <div className="mono" style={{ fontSize: 10, color: "var(--muted)", marginBottom: 8 }}>
                  {e.date} · test {e.test_size} · k={e.knn_k}
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span className="mono" style={{ fontSize: 10, color: "var(--pos)" }}>NB {(e.nb.f1 * 100).toFixed(1)}</span>
                  <span style={{ color: "var(--muted)", fontSize: 10 }}>vs</span>
                  <span className="mono" style={{ fontSize: 10, color: "var(--ink-2)" }}>KNN {(e.knn.f1 * 100).toFixed(1)}</span>
                  <span className="mono" style={{
                    marginLeft: "auto", fontSize: 9, padding: "1px 6px", borderRadius: 2,
                    background: e.best === "naive_bayes" ? "var(--ink)" : "var(--neg)",
                    color: "var(--bg)",
                  }}>{e.best === "naive_bayes" ? "NB" : "KNN"} ★</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        <Card title={exp.name} subtitle={`${exp.date} · pemenang: ${exp.best === "naive_bayes" ? "Naïve Bayes" : "KNN"}`}>
          <ComparisonBars nb={exp.nb} knn={exp.knn} />
        </Card>

        <Card title="Progres antar eksperimen" subtitle="F1-Score Naïve Bayes vs KNN">
          <ProgressChart experiments={AppData.EXPERIMENTS} highlight={selected} onSelect={setSelected} />
        </Card>
      </div>
    </div>
  );
}

function ProgressChart({ experiments, highlight, onSelect }) {
  const W = 600;
  const H = 180;
  const PAD = 28;
  const max = 1;
  const min = 0.7;
  const x = (i) => PAD + (i * (W - PAD * 2)) / (experiments.length - 1);
  const y = (v) => H - PAD - ((v - min) / (max - min)) * (H - PAD * 2);

  const nbPath = experiments.map((e, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(e.nb.f1)}`).join(" ");
  const knnPath = experiments.map((e, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(e.knn.f1)}`).join(" ");

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
        {/* Y gridlines */}
        {[0.75, 0.80, 0.85, 0.90, 0.95].map(v => (
          <g key={v}>
            <line x1={PAD} x2={W - PAD} y1={y(v)} y2={y(v)} stroke="var(--line)" strokeWidth="0.5" strokeDasharray="2,3" />
            <text x={PAD - 6} y={y(v) + 3} textAnchor="end" fontSize="9" fill="var(--muted)" fontFamily="'JetBrains Mono', monospace">
              {(v * 100).toFixed(0)}
            </text>
          </g>
        ))}
        {/* NB area fill */}
        <path d={nbPath + ` L${x(experiments.length - 1)},${H - PAD} L${x(0)},${H - PAD} Z`} fill="var(--pos)" opacity="0.08" />
        {/* Lines */}
        <path d={nbPath} fill="none" stroke="var(--pos)" strokeWidth="1.8" strokeLinejoin="round" />
        <path d={knnPath} fill="none" stroke="var(--ink-2)" strokeWidth="1.8" strokeDasharray="4,3" strokeLinejoin="round" />
        {/* Dots */}
        {experiments.map((e, i) => (
          <g key={e.id} onClick={() => onSelect(e.id)} style={{ cursor: "pointer" }}>
            <circle cx={x(i)} cy={y(e.nb.f1)} r={highlight === e.id ? 5 : 3.5} fill="var(--pos)" stroke="var(--bg-2)" strokeWidth="1.5" />
            <circle cx={x(i)} cy={y(e.knn.f1)} r={highlight === e.id ? 5 : 3.5} fill="var(--ink-2)" stroke="var(--bg-2)" strokeWidth="1.5" />
            <text x={x(i)} y={H - 8} textAnchor="middle" fontSize="9" fill={highlight === e.id ? "var(--ink)" : "var(--muted)"} fontFamily="'JetBrains Mono', monospace" fontWeight={highlight === e.id ? 600 : 400}>
              #{e.id}
            </text>
          </g>
        ))}
      </svg>
      <div style={{ display: "flex", gap: 18, marginTop: 8 }}>
        <Legend2 color="var(--pos)" label="Naïve Bayes" solid />
        <Legend2 color="var(--ink-2)" label="KNN" />
      </div>
    </div>
  );
}

function Legend2({ color, label, solid }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <svg width="20" height="3">
        {solid ? <line x1="0" x2="20" y1="1.5" y2="1.5" stroke={color} strokeWidth="2" />
              : <line x1="0" x2="20" y1="1.5" y2="1.5" stroke={color} strokeWidth="2" strokeDasharray="3,2" />}
      </svg>
      <span className="mono" style={{ fontSize: 11, color: "var(--ink-2)" }}>{label}</span>
    </div>
  );
}

window.PageRiwayat = PageRiwayat;
