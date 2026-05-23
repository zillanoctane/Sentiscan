/* global React, AppData, Card, ConfusionMatrix, ComparisonBars */
const { useState } = React;

function PagePemodelan({ setRoute }) {
  const [testSize, setTestSize] = useState(0.2);
  const [k, setK] = useState(5);
  const [training, setTraining] = useState(false);
  const [phase, setPhase] = useState(null);
  const [trainLogs, setTrainLogs] = useState([]);
  const [result, setResult] = useState(null);

  function startTrain() {
    setTraining(true);
    setResult(null);
    setTrainLogs([]);
    const phases = [
      { name: "split", label: "train_test_split", delay: 500, log: `→ stratify=label, random_state=42, test_size=${testSize}` },
      { name: "tfidf", label: "TF-IDF vectorizer", delay: 700, log: `→ fitur ekstrak: 4823 terms, ngram_range=(1,1)` },
      { name: "nb", label: "Train Naïve Bayes", delay: 900, log: `→ MultinomialNB() · 997 sampel latih · 250 sampel uji` },
      { name: "knn", label: `Train KNN (k=${k})`, delay: 1100, log: `→ KNeighborsClassifier(n_neighbors=${k}) · cosine metric` },
      { name: "evaluate", label: "Evaluate (NB + KNN)", delay: 700, log: `→ classification_report, confusion_matrix` },
      { name: "save", label: "Save experiment", delay: 400, log: `→ experiment_id: exp_${Date.now()}` },
    ];
    let i = 0;
    const tick = () => {
      if (i >= phases.length) {
        // produce result with slight randomness around latest
        const base = AppData.EXPERIMENTS[AppData.EXPERIMENTS.length - 1];
        const nbAcc = Math.min(0.95, base.nb.acc + (Math.random() - 0.5) * 0.02);
        const knnAcc = Math.min(0.88, base.knn.acc + (Math.random() - 0.5) * 0.03);
        const r = {
          nb: { acc: nbAcc, prec: nbAcc + 0.003, rec: nbAcc, f1: nbAcc - 0.001, cm: base.nb.cm },
          knn: { acc: knnAcc, prec: knnAcc + 0.005, rec: knnAcc, f1: knnAcc - 0.001, cm: base.knn.cm },
          test_size: testSize, knn_k: k, time: 3.4 + Math.random() * 2,
        };
        r.best = r.nb.f1 >= r.knn.f1 ? "naive_bayes" : "knn";
        setResult(r);
        setTraining(false);
        setPhase(null);
        return;
      }
      const p = phases[i];
      setPhase(p.name);
      setTrainLogs((prev) => [...prev, { time: `+${(i * 0.6).toFixed(1)}s`, label: p.label, detail: p.log }]);
      i++;
      setTimeout(tick, p.delay);
    };
    tick();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 22 }}>
        {/* Parameters */}
        <Card title="Parameter pelatihan" subtitle="Konfigurasi eksperimen">
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <ParamSlider
              label="Test size"
              value={testSize}
              min={0.1} max={0.4} step={0.05}
              onChange={setTestSize}
              format={(v) => `${(v * 100).toFixed(0)}%`}
              hint="Proporsi data uji vs latih"
            />
            <ParamSlider
              label="KNN — nilai k"
              value={k}
              min={1} max={15} step={2}
              onChange={setK}
              format={(v) => v}
              hint="Jumlah tetangga terdekat"
            />

            <div style={{ paddingTop: 14, borderTop: "1px dashed var(--line-strong)" }}>
              <div className="mono" style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
                pengaturan tetap
              </div>
              <FixedRow k="Algoritma A" v="MultinomialNB" />
              <FixedRow k="Algoritma B" v={`KNeighborsClassifier(k=${k})`} />
              <FixedRow k="Vectorizer" v="TfidfVectorizer" />
              <FixedRow k="Stratify" v="label" />
              <FixedRow k="random_state" v="42" />
            </div>

            <button onClick={startTrain} disabled={training} style={{
              padding: "12px 16px",
              background: training ? "var(--ink-2)" : "var(--ink)",
              color: "var(--bg)",
              border: "none",
              borderRadius: 3,
              fontWeight: 500,
              cursor: training ? "wait" : "pointer",
              fontSize: 14,
              fontFamily: "inherit",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}>
              {training ? (
                <>
                  <span className="spinner"></span>
                  Melatih kedua model…
                </>
              ) : "Latih & bandingkan →"}
            </button>
          </div>
        </Card>

        {/* Training console */}
        <Card title="Konsol pelatihan" subtitle={training ? "aktif" : result ? "selesai" : "siap"} action={
          <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
            Python 3.11 · scikit-learn 1.4.2
          </span>
        }>
          <div style={{
            background: "#13110d",
            color: "#e9e3d2",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12,
            padding: "16px 18px",
            borderRadius: 3,
            minHeight: 240,
            maxHeight: 320,
            overflowY: "auto",
            lineHeight: 1.55,
          }}>
            {trainLogs.length === 0 && !training && (
              <div style={{ color: "#847c6f" }}>$ siap untuk memulai pelatihan...</div>
            )}
            {trainLogs.map((l, i) => (
              <div key={i} style={{ display: "flex", gap: 12, marginBottom: 6 }}>
                <span style={{ color: "#847c6f", flexShrink: 0, width: 50 }}>{l.time}</span>
                <div>
                  <div style={{ color: "#f6f4ef" }}>▸ {l.label}</div>
                  <div style={{ color: "#a59c8b", marginLeft: 12 }}>{l.detail}</div>
                </div>
              </div>
            ))}
            {training && (
              <div style={{ display: "flex", gap: 12 }}>
                <span style={{ color: "#847c6f", width: 50 }}>+{(trainLogs.length * 0.6).toFixed(1)}s</span>
                <span style={{ color: "var(--pos)" }}>⏵ menjalankan…</span>
              </div>
            )}
            {result && (
              <div style={{ marginTop: 14, padding: "10px 12px", border: "1px solid #3a352c", borderRadius: 2, color: "#d9ead8" }}>
                ✓ Pelatihan selesai dalam {result.time.toFixed(1)}s — pemenang: <strong style={{ color: "var(--pos)" }}>{result.best === "naive_bayes" ? "Naïve Bayes" : "KNN"}</strong>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Live result */}
      {result && (
        <Card title="Ringkasan hasil eksperimen" subtitle="metrik weighted average" action={
          <button onClick={() => setRoute("hasil")} style={btnGhost}>Buka halaman Hasil →</button>
        }>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 36 }}>
            <ComparisonBars nb={result.nb} knn={result.knn} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <ConfusionMatrix cm={result.nb.cm} title="Naïve Bayes" />
              <ConfusionMatrix cm={result.knn.cm} title="KNN" />
            </div>
          </div>
        </Card>
      )}

      <style>{`
        .spinner {
          width: 12px; height: 12px;
          border: 1.5px solid rgba(244,241,234,0.3);
          border-top-color: var(--bg);
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          display: inline-block;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function ParamSlider({ label, value, min, max, step, onChange, format, hint }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <span className="mono" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)" }}>{label}</span>
        <span className="mono" style={{ fontSize: 18, fontWeight: 500 }}>{format(value)}</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ width: "100%", accentColor: "var(--ink)" }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
        <span className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>{format(min)}</span>
        <span style={{ fontSize: 11, color: "var(--muted)" }}>{hint}</span>
        <span className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>{format(max)}</span>
      </div>
    </div>
  );
}

function FixedRow({ k, v }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px dotted var(--line)" }}>
      <span style={{ fontSize: 12, color: "var(--muted)" }}>{k}</span>
      <span className="mono" style={{ fontSize: 12, color: "var(--ink-2)" }}>{v}</span>
    </div>
  );
}

const btnGhost = { fontSize: 12, padding: "7px 14px", background: "transparent", color: "var(--ink)", border: "1px solid var(--line-strong)", borderRadius: 3, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" };

window.PagePemodelan = PagePemodelan;
