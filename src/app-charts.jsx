/* global React */
const { useState, useEffect, useRef } = React;

// ─────────────────────── ANIMATED VALUE HOOK ───────────────────────
function useAnimNum(target, duration = 700) {
  const [v, setV] = useState(0);
  const startRef = useRef(performance.now());
  const fromRef = useRef(0);
  const targetRef = useRef(target);
  useEffect(() => {
    fromRef.current = v;
    targetRef.current = target;
    startRef.current = performance.now();
    let raf;
    const tick = () => {
      const t = Math.min(1, (performance.now() - startRef.current) / duration);
      const e = 1 - Math.pow(1 - t, 3);
      setV(fromRef.current + (targetRef.current - fromRef.current) * e);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return v;
}
window.useAnimNum = useAnimNum;

// ─────────────────────── CONFUSION MATRIX ───────────────────────
// cm = [[TP, FN], [FP, TN]] order: rows=actual [pos, neg], cols=predicted [pos, neg]
function ConfusionMatrix({ cm, color = "var(--ink)", title }) {
  const max = Math.max(...cm.flat());
  const total = cm.flat().reduce((a, b) => a + b, 0);
  const cell = (v, kind) => {
    const intensity = v / max;
    const correct = kind === "tp" || kind === "tn";
    const bg = correct
      ? `color-mix(in oklab, var(--pos) ${Math.round(intensity * 60 + 8)}%, transparent)`
      : `color-mix(in oklab, var(--neg) ${Math.round(intensity * 50 + 6)}%, transparent)`;
    return { v, bg, correct };
  };
  const tp = cell(cm[0][0], "tp");
  const fn = cell(cm[0][1], "fn");
  const fp = cell(cm[1][0], "fp");
  const tn = cell(cm[1][1], "tn");

  const Cell = ({ data }) => (
    <div style={{
      background: data.bg,
      padding: "16px 14px",
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      gap: 4,
      minHeight: 78,
      border: "1px solid var(--line)",
    }}>
      <span style={{ fontSize: 24, fontWeight: 500, letterSpacing: "-0.02em", color: "var(--ink)" }}>
        {data.v}
      </span>
      <span className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>
        {(data.v / total * 100).toFixed(1)}%
      </span>
    </div>
  );

  return (
    <div>
      {title && <div className="mono" style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 10 }}>{title}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr 1fr", gap: 0 }}>
        <div></div>
        <div className="mono" style={{ fontSize: 10, color: "var(--muted)", textAlign: "center", paddingBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>pred. positif</div>
        <div className="mono" style={{ fontSize: 10, color: "var(--muted)", textAlign: "center", paddingBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>pred. negatif</div>

        <div className="mono" style={{ fontSize: 10, color: "var(--muted)", writingMode: "vertical-rl", transform: "rotate(180deg)", display: "flex", alignItems: "center", justifyContent: "center", paddingRight: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>aktual pos</div>
        <Cell data={tp} />
        <Cell data={fn} />

        <div className="mono" style={{ fontSize: 10, color: "var(--muted)", writingMode: "vertical-rl", transform: "rotate(180deg)", display: "flex", alignItems: "center", justifyContent: "center", paddingRight: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>aktual neg</div>
        <Cell data={fp} />
        <Cell data={tn} />
      </div>
    </div>
  );
}
window.ConfusionMatrix = ConfusionMatrix;

// ─────────────────────── DONUT (sentiment distribution) ───────────────────────
function Donut({ pos, neg, size = 180, thickness = 22 }) {
  const total = pos + neg || 1;
  const posPct = pos / total;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const animPos = useAnimNum(posPct);
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--line)" strokeWidth={thickness} />
        <circle
          cx={size/2} cy={size/2} r={r}
          fill="none"
          stroke="var(--pos)"
          strokeWidth={thickness}
          strokeDasharray={`${animPos * c} ${c}`}
          strokeLinecap="butt"
        />
        <circle
          cx={size/2} cy={size/2} r={r}
          fill="none"
          stroke="var(--neg)"
          strokeWidth={thickness}
          strokeDasharray={`${(1 - animPos) * c} ${c}`}
          strokeDashoffset={`-${animPos * c}`}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ fontSize: 28, fontWeight: 500, letterSpacing: "-0.02em" }}>{(posPct * 100).toFixed(1)}%</div>
        <div className="mono" style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>positif</div>
      </div>
    </div>
  );
}
window.Donut = Donut;

// ─────────────────────── COMPARISON BARS (NB vs KNN) ───────────────────────
function ComparisonBars({ nb, knn, metric = "f1" }) {
  const metrics = [
    { key: "acc", label: "Accuracy" },
    { key: "prec", label: "Precision" },
    { key: "rec", label: "Recall" },
    { key: "f1", label: "F1-Score" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {metrics.map((m) => {
        const nbV = nb[m.key];
        const knnV = knn[m.key];
        const max = Math.max(nbV, knnV);
        return (
          <div key={m.key}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
              <span className="mono" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)" }}>{m.label}</span>
              <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>Δ {((nbV - knnV) * 100).toFixed(1)}</span>
            </div>
            <BarRow label="Naïve Bayes" value={nbV} max={1} accent="var(--ink)" winning={nbV >= knnV} />
            <div style={{ height: 6 }}></div>
            <BarRow label="KNN" value={knnV} max={1} accent="var(--ink-2)" winning={knnV > nbV} />
          </div>
        );
      })}
    </div>
  );
}
window.ComparisonBars = ComparisonBars;

function BarRow({ label, value, max, accent, winning }) {
  const w = useAnimNum(value / max);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "90px 1fr 60px", alignItems: "center", gap: 12 }}>
      <span className="mono" style={{ fontSize: 11, color: winning ? "var(--ink)" : "var(--muted)", fontWeight: winning ? 600 : 400 }}>
        {label}{winning ? " ★" : ""}
      </span>
      <div style={{ height: 14, background: "var(--line)", position: "relative", borderRadius: 1 }}>
        <div style={{ width: `${w * 100}%`, height: "100%", background: accent, borderRadius: 1, transition: "width 60ms linear" }}></div>
      </div>
      <span className="mono" style={{ fontSize: 12, color: "var(--ink)", textAlign: "right" }}>{(value * 100).toFixed(1)}%</span>
    </div>
  );
}
window.BarRow = BarRow;

// ─────────────────────── ACTIVITY CHART (time series) ───────────────────────
function ActivityChart({ data, height = 180 }) {
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d.pos + d.neg));
  const w = 100 / data.length;
  return (
    <div>
      <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" style={{ width: "100%", height, display: "block" }}>
        {/* horizontal grid */}
        {[0.25, 0.5, 0.75].map(g => (
          <line key={g} x1="0" x2="100" y1={height * g} y2={height * g} stroke="var(--line)" strokeWidth="0.3" strokeDasharray="0.5,0.5" />
        ))}
        {data.map((d, i) => {
          const total = d.pos + d.neg;
          const x = i * w + w * 0.15;
          const bw = w * 0.7;
          const totalH = (total / max) * (height - 12);
          const posH = (d.pos / total) * totalH;
          const negH = totalH - posH;
          return (
            <g key={i}>
              <rect x={x} y={height - totalH} width={bw} height={posH} fill="var(--pos)" />
              <rect x={x} y={height - totalH + posH} width={bw} height={negH} fill="var(--neg)" />
            </g>
          );
        })}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
        {data.filter((_, i) => i % 2 === 0).map((d, i) => (
          <span key={i} className="mono" style={{ fontSize: 9, color: "var(--muted)" }}>{d.date}</span>
        ))}
      </div>
    </div>
  );
}
window.ActivityChart = ActivityChart;

// ─────────────────────── WORD CLOUD (simple flow) ───────────────────────
function WordCloud({ words, accent }) {
  const max = Math.max(...words.map(w => w.c));
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 12px", lineHeight: 1.2 }}>
      {words.map((w, i) => {
        const size = 12 + (w.c / max) * 22;
        const op = 0.55 + (w.c / max) * 0.45;
        return (
          <span key={w.w} style={{
            fontSize: size,
            color: accent,
            opacity: op,
            fontWeight: 400,
            letterSpacing: "-0.01em",
          }}>{w.w}</span>
        );
      })}
    </div>
  );
}
window.WordCloud = WordCloud;

// ─────────────────────── CARD WRAPPER ───────────────────────
function Card({ title, subtitle, children, action, padded = true, span = 1 }) {
  return (
    <div style={{
      background: "var(--bg-2)",
      border: "1px solid var(--line)",
      borderRadius: 4,
      gridColumn: `span ${span}`,
      display: "flex",
      flexDirection: "column",
    }}>
      {(title || action) && (
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "14px 18px",
          borderBottom: "1px solid var(--line)",
        }}>
          <div>
            {title && <div style={{ fontSize: 13.5, fontWeight: 500 }}>{title}</div>}
            {subtitle && <div className="mono" style={{ fontSize: 10, color: "var(--muted)", marginTop: 2, letterSpacing: "0.06em", textTransform: "uppercase" }}>{subtitle}</div>}
          </div>
          {action}
        </div>
      )}
      <div style={{ padding: padded ? 18 : 0, flex: 1 }}>{children}</div>
    </div>
  );
}
window.Card = Card;
