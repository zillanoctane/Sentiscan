/* global React, AppData, Card, ConfusionMatrix, ComparisonBars, useAnimNum */

function PageHasil() {
  const exp = AppData.EXPERIMENTS[AppData.EXPERIMENTS.length - 1];
  const nb = exp.nb;
  const knn = exp.knn;
  const isNB = exp.best === "naive_bayes";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      {/* Verdict banner */}
      <div style={{
        background: "var(--ink)",
        color: "var(--bg)",
        borderRadius: 4,
        padding: "26px 32px",
        display: "grid",
        gridTemplateColumns: "1.4fr 1fr 1fr",
        gap: 32,
        alignItems: "center",
      }}>
        <div>
          <div className="mono" style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(244,241,234,0.55)", marginBottom: 8 }}>
            Kesimpulan eksperimen #{exp.id}
          </div>
          <div style={{ fontSize: 26, fontWeight: 500, letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: 10 }}>
            <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontWeight: 400 }}>
              {isNB ? "Naïve Bayes" : "KNN"}
            </span>{" "}
            unggul {(((isNB ? nb.f1 : knn.f1) - (isNB ? knn.f1 : nb.f1)) * 100).toFixed(2)} poin F1.
          </div>
          <div style={{ fontSize: 13, color: "rgba(244,241,234,0.7)", lineHeight: 1.5, maxWidth: 460 }}>
            Pada dataset 1.247 ulasan smartphone Tokopedia dengan test_size {exp.test_size} dan k={exp.knn_k}, model Naïve Bayes konsisten menghasilkan akurasi & F1-score lebih tinggi dibanding KNN.
          </div>
        </div>

        <BigStat label="Akurasi (NB)" value={nb.acc} color="var(--pos)" />
        <BigStat label="Akurasi (KNN)" value={knn.acc} color="rgba(244,241,234,0.85)" />
      </div>

      {/* Side by side metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}>
        <ModelCard title="Naïve Bayes" subtitle="MultinomialNB · α=1.0" metrics={nb} winner={isNB} accent="var(--pos)" />
        <ModelCard title={`K-Nearest Neighbor`} subtitle={`k=${exp.knn_k} · cosine`} metrics={knn} winner={!isNB} accent="var(--neg)" />
      </div>

      {/* Confusion matrices */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}>
        <Card title="Confusion Matrix — Naïve Bayes" subtitle={`total uji: ${nb.cm.flat().reduce((a,b)=>a+b,0)}`}>
          <ConfusionMatrix cm={nb.cm} />
          <CMStats cm={nb.cm} />
        </Card>
        <Card title="Confusion Matrix — KNN" subtitle={`total uji: ${knn.cm.flat().reduce((a,b)=>a+b,0)}`}>
          <ConfusionMatrix cm={knn.cm} />
          <CMStats cm={knn.cm} />
        </Card>
      </div>

      {/* Comparison bar chart */}
      <Card title="Perbandingan metrik" subtitle="weighted average (positif + negatif)">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48 }}>
          <ComparisonBars nb={nb} knn={knn} />
          <MetricsTable nb={nb} knn={knn} k={exp.knn_k} />
        </div>
      </Card>

      {/* Export & detail */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}>
        <Card title="Export hasil" subtitle="untuk laporan skripsi / dosen pembimbing">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <ExportRow icon="📄" label="Laporan PDF" desc="Ringkasan eksperimen + grafik · A4 portrait" filename="sentiscan-exp05-2026-05-18.pdf" size="1.2 MB" />
            <ExportRow icon="📊" label="Data mentah CSV" desc="Semua prediksi + label aktual" filename="predictions.csv" size="186 KB" />
            <ExportRow icon="📈" label="Confusion matrix PNG" desc="Untuk lampiran" filename="confusion-matrices.png" size="42 KB" />
          </div>
        </Card>

        <Card title="Detail eksperimen" subtitle={exp.name}>
          <table style={{ width: "100%", fontSize: 13 }}>
            <tbody>
              <DetailRow k="Dataset" v="ds_2026_05_18 · 1247 ulasan" />
              <DetailRow k="Train / Test" v={`${Math.round(1247 * (1 - exp.test_size))} / ${Math.round(1247 * exp.test_size)}`} />
              <DetailRow k="Test size" v={exp.test_size} />
              <DetailRow k="KNN k" v={exp.knn_k} />
              <DetailRow k="Random state" v="42" />
              <DetailRow k="Vectorizer" v="TfidfVectorizer · max_features=5000" />
              <DetailRow k="Stratify" v="label (positif / negatif)" />
              <DetailRow k="Tanggal" v={exp.date} />
              <DetailRow k="Durasi" v="4.2 detik" />
              <DetailRow k="Pemenang" v={
                <span style={{
                  padding: "2px 8px",
                  background: "var(--pos-soft)",
                  color: "var(--pos)",
                  borderRadius: 2,
                  fontSize: 11,
                  fontWeight: 500,
                }} className="mono">naive_bayes</span>
              } />
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}

function BigStat({ label, value, color }) {
  const v = useAnimNum(value);
  return (
    <div>
      <div className="mono" style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(244,241,234,0.55)", marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 56, fontWeight: 400, fontFamily: "'Instrument Serif', serif", fontStyle: "italic", lineHeight: 0.9, color }}>
        {(v * 100).toFixed(1)}<span style={{ fontSize: 24, marginLeft: 2 }}>%</span>
      </div>
    </div>
  );
}

function ModelCard({ title, subtitle, metrics, winner, accent }) {
  return (
    <div style={{
      background: "var(--bg-2)",
      border: "1px solid",
      borderColor: winner ? "var(--ink)" : "var(--line)",
      borderWidth: winner ? 2 : 1,
      borderRadius: 4,
      padding: "22px 24px",
      position: "relative",
    }}>
      {winner && (
        <span style={{
          position: "absolute", top: -10, right: 20,
          padding: "3px 10px", background: "var(--ink)", color: "var(--bg)",
          fontSize: 10, fontWeight: 600, borderRadius: 2,
          letterSpacing: "0.08em", textTransform: "uppercase",
          fontFamily: "'JetBrains Mono', monospace",
        }}>★ best model</span>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 500, letterSpacing: "-0.01em" }}>{title}</div>
          <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{subtitle}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <MiniMetric label="Accuracy" value={metrics.acc} />
        <MiniMetric label="Precision" value={metrics.prec} />
        <MiniMetric label="Recall" value={metrics.rec} />
        <MiniMetric label="F1-Score" value={metrics.f1} highlight />
      </div>
    </div>
  );
}

function MiniMetric({ label, value, highlight }) {
  const v = useAnimNum(value);
  return (
    <div style={{
      padding: "14px 14px",
      background: highlight ? "var(--bg)" : "transparent",
      border: highlight ? "1px solid var(--line-strong)" : "1px dashed var(--line)",
      borderRadius: 3,
    }}>
      <div className="mono" style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 500, letterSpacing: "-0.02em" }}>
        {(v * 100).toFixed(1)}<span style={{ fontSize: 14, color: "var(--muted)" }}>%</span>
      </div>
    </div>
  );
}

function CMStats({ cm }) {
  const [[tp, fn], [fp, tn]] = cm;
  const total = tp + fn + fp + tn;
  return (
    <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px dashed var(--line)", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
      <CMStat label="TP" v={tp} desc="benar positif" />
      <CMStat label="FN" v={fn} desc="lolos negatif" />
      <CMStat label="FP" v={fp} desc="salah positif" />
      <CMStat label="TN" v={tn} desc="benar negatif" />
    </div>
  );
}
function CMStat({ label, v, desc }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>{label}</span>
        <span style={{ fontSize: 17, fontWeight: 500 }}>{v}</span>
      </div>
      <div className="mono" style={{ fontSize: 9, color: "var(--muted)", marginTop: 2 }}>{desc}</div>
    </div>
  );
}

function MetricsTable({ nb, knn, k }) {
  const rows = [
    { k: "Accuracy", nb: nb.acc, knn: knn.acc },
    { k: "Precision", nb: nb.prec, knn: knn.prec },
    { k: "Recall", nb: nb.rec, knn: knn.rec },
    { k: "F1-Score", nb: nb.f1, knn: knn.f1 },
  ];
  return (
    <div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>
            <th style={mtTh}>Metrik</th>
            <th style={mtTh}>Naïve Bayes</th>
            <th style={mtTh}>KNN (k={k})</th>
            <th style={mtTh}>Selisih</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => {
            const winnerNB = r.nb >= r.knn;
            return (
              <tr key={r.k} style={{ borderTop: "1px solid var(--line)" }}>
                <td style={mtTd}>{r.k}</td>
                <td style={{ ...mtTd, fontWeight: winnerNB ? 600 : 400, color: winnerNB ? "var(--ink)" : "var(--muted)" }} className="mono">
                  {(r.nb * 100).toFixed(2)}{winnerNB ? " ★" : ""}
                </td>
                <td style={{ ...mtTd, fontWeight: !winnerNB ? 600 : 400, color: !winnerNB ? "var(--ink)" : "var(--muted)" }} className="mono">
                  {(r.knn * 100).toFixed(2)}{!winnerNB ? " ★" : ""}
                </td>
                <td style={mtTd} className="mono">
                  <span style={{ color: r.nb > r.knn ? "var(--pos)" : "var(--neg)" }}>
                    {r.nb > r.knn ? "+" : ""}{((r.nb - r.knn) * 100).toFixed(2)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const mtTh = {
  textAlign: "left",
  padding: "8px 10px",
  fontWeight: 500,
  fontSize: 10,
  color: "var(--muted)",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  borderBottom: "1px solid var(--line-strong)",
  fontFamily: "'JetBrains Mono', monospace",
};
const mtTd = {
  padding: "10px",
};

function ExportRow({ icon, label, desc, filename, size }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14,
      padding: "12px 14px",
      background: "var(--bg)",
      border: "1px solid var(--line)",
      borderRadius: 3,
    }}>
      <div style={{ width: 32, height: 32, background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="3" y="2" width="10" height="12" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M5 6h6M5 9h6M5 12h4" stroke="currentColor" strokeWidth="1.3"/>
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
        <div className="mono" style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>{filename} · {size}</div>
      </div>
      <button style={{ padding: "6px 12px", background: "var(--ink)", color: "var(--bg)", border: "none", borderRadius: 3, fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
        Unduh
      </button>
    </div>
  );
}

function DetailRow({ k, v }) {
  return (
    <tr style={{ borderBottom: "1px dotted var(--line)" }}>
      <td style={{ padding: "8px 0", fontSize: 12, color: "var(--muted)" }}>{k}</td>
      <td style={{ padding: "8px 0", fontSize: 12, textAlign: "right", fontFamily: "'JetBrains Mono', monospace" }}>{v}</td>
    </tr>
  );
}

window.PageHasil = PageHasil;
