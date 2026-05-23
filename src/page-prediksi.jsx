/* global React, Card */
const { useState } = React;

const EXAMPLES = [
  "Mantap, pengiriman cepat dan barang original sesuai deskripsi!",
  "Kecewa banget, baterai cepat habis dan layar bergaris.",
  "Harga bersaing, packing rapi, recommended seller.",
  "Lama sampai dua minggu, barang akhirnya rusak. Komplain dicuekin.",
];

const POS_KEYWORDS = ["bagus", "mantap", "cepat", "rapi", "original", "puas", "ramah", "recommended", "lancar", "jernih", "awet", "stabil"];
const NEG_KEYWORDS = ["kecewa", "rusak", "lama", "habis", "lemot", "panas", "hang", "bergaris", "bocor", "blur", "pecah", "buruk", "jelek", "lambat"];

function PagePrediksi() {
  const [text, setText] = useState(EXAMPLES[0]);
  const [result, setResult] = useState(null);
  const [predicting, setPredicting] = useState(false);
  const [history, setHistory] = useState([]);

  function predict() {
    if (!text.trim()) return;
    setPredicting(true);
    setResult(null);
    setTimeout(() => {
      const lower = text.toLowerCase();
      const posHits = POS_KEYWORDS.filter(k => lower.includes(k));
      const negHits = NEG_KEYWORDS.filter(k => lower.includes(k));
      const posScore = posHits.length;
      const negScore = negHits.length;
      const nbLabel = posScore >= negScore ? "positif" : "negatif";
      const knnLabel = posScore >= negScore + 1 ? "positif" : negScore >= posScore + 1 ? "negatif" : (Math.random() > 0.4 ? "positif" : "negatif");
      const nbConf = Math.min(0.99, 0.55 + Math.abs(posScore - negScore) * 0.12 + Math.random() * 0.08);
      const knnConf = Math.min(0.95, 0.50 + Math.abs(posScore - negScore) * 0.10 + Math.random() * 0.10);
      const tokens = lower.replace(/[^a-z\s]/g, " ").split(/\s+/).filter(Boolean);
      const tokenWeights = tokens.map(t => {
        if (POS_KEYWORDS.includes(t)) return { t, w: "pos" };
        if (NEG_KEYWORDS.includes(t)) return { t, w: "neg" };
        return { t, w: null };
      });
      const r = { text, nbLabel, knnLabel, nbConf, knnConf, tokenWeights, agreed: nbLabel === knnLabel };
      setResult(r);
      setHistory((prev) => [{ ...r, time: new Date() }, ...prev].slice(0, 8));
      setPredicting(false);
    }, 850);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <Card title="Prediksi sentimen" subtitle="masukkan ulasan, dapatkan prediksi dari kedua model">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Tulis ulasan dalam Bahasa Indonesia…"
          style={{
            width: "100%",
            minHeight: 120,
            padding: "14px 16px",
            border: "1px solid var(--line-strong)",
            borderRadius: 3,
            background: "var(--bg)",
            fontSize: 15,
            fontFamily: "inherit",
            lineHeight: 1.5,
            resize: "vertical",
            outline: "none",
            color: "var(--ink)",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
          <button onClick={predict} disabled={predicting || !text.trim()} style={{
            padding: "10px 18px",
            background: "var(--ink)",
            color: "var(--bg)",
            border: "none",
            borderRadius: 3,
            fontSize: 14,
            fontWeight: 500,
            cursor: predicting ? "wait" : "pointer",
            opacity: !text.trim() ? 0.4 : 1,
            fontFamily: "inherit",
          }}>
            {predicting ? "Memprediksi…" : "Prediksi sekarang"}
          </button>
          <span style={{ color: "var(--muted)", fontSize: 12 }}>atau coba:</span>
          {EXAMPLES.map((ex, i) => (
            <button key={i} onClick={() => setText(ex)} style={{
              fontSize: 11, padding: "5px 10px", background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 99,
              cursor: "pointer", color: "var(--ink-2)", fontFamily: "inherit",
            }}>
              contoh {i + 1}
            </button>
          ))}
          <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--muted)" }} className="mono">
            {text.length} char · {text.split(/\s+/).filter(Boolean).length} token
          </span>
        </div>
      </Card>

      {result && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}>
          <PredictionCard model="Naïve Bayes" label={result.nbLabel} conf={result.nbConf} accent />
          <PredictionCard model="K-Nearest Neighbor" label={result.knnLabel} conf={result.knnConf} />

          <Card title="Token analisis" subtitle="kata penting & bobot sentimen" span={2}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, lineHeight: 1.8 }}>
              {result.tokenWeights.map((t, i) => (
                <span key={i} style={{
                  padding: "3px 8px",
                  fontSize: 13,
                  borderRadius: 2,
                  background: t.w === "pos" ? "var(--pos-soft)" : t.w === "neg" ? "var(--neg-soft)" : "var(--bg)",
                  color: t.w === "pos" ? "var(--pos)" : t.w === "neg" ? "var(--neg)" : "var(--ink-2)",
                  border: t.w ? "none" : "1px solid var(--line)",
                  fontWeight: t.w ? 500 : 400,
                  fontFamily: t.w ? "inherit" : "'JetBrains Mono', monospace",
                }}>
                  {t.t}
                </span>
              ))}
            </div>
            <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px dashed var(--line)", display: "flex", gap: 18, fontSize: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 10, height: 10, background: "var(--pos)", borderRadius: 1 }}></span>
                <span>kata bersifat positif</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 10, height: 10, background: "var(--neg)", borderRadius: 1 }}></span>
                <span>kata bersifat negatif</span>
              </div>
              <div style={{ marginLeft: "auto", color: "var(--muted)" }}>
                Kesepakatan model: {result.agreed
                  ? <strong style={{ color: "var(--pos)" }}>setuju ✓</strong>
                  : <strong style={{ color: "var(--neg)" }}>berbeda</strong>}
              </div>
            </div>
          </Card>
        </div>
      )}

      {history.length > 0 && (
        <Card title="Riwayat prediksi" subtitle={`${history.length} terakhir dalam sesi ini`}>
          <div>
            {history.map((h, i) => (
              <div key={i} style={{
                display: "grid",
                gridTemplateColumns: "1fr auto auto",
                gap: 16,
                alignItems: "center",
                padding: "10px 0",
                borderTop: i === 0 ? "none" : "1px solid var(--line)",
              }}>
                <div style={{ fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", paddingRight: 20 }}>
                  {h.text}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <Pill model="NB" label={h.nbLabel} conf={h.nbConf} />
                  <Pill model="KNN" label={h.knnLabel} conf={h.knnConf} />
                </div>
                <span className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>
                  {h.time.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function PredictionCard({ model, label, conf, accent }) {
  return (
    <div style={{
      background: "var(--bg-2)",
      border: "1px solid",
      borderColor: accent ? "var(--ink)" : "var(--line)",
      borderRadius: 4,
      padding: "22px 24px",
      position: "relative",
    }}>
      <div className="mono" style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
        {model}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 16 }}>
        <span style={{
          fontFamily: "'Instrument Serif', serif",
          fontStyle: "italic",
          fontSize: 48,
          fontWeight: 400,
          lineHeight: 1,
          color: label === "positif" ? "var(--pos)" : "var(--neg)",
        }}>
          {label}
        </span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 6 }}>
        <span className="mono" style={{ color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>confidence</span>
        <span className="mono">{(conf * 100).toFixed(1)}%</span>
      </div>
      <div style={{ height: 6, background: "var(--line)", borderRadius: 1, overflow: "hidden" }}>
        <div style={{
          width: `${conf * 100}%`,
          height: "100%",
          background: label === "positif" ? "var(--pos)" : "var(--neg)",
          transition: "width 600ms cubic-bezier(0.2, 0.9, 0.3, 1)",
        }}></div>
      </div>
    </div>
  );
}

function Pill({ model, label, conf }) {
  return (
    <span className="mono" style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "3px 8px",
      borderRadius: 2,
      fontSize: 10,
      background: label === "positif" ? "var(--pos-soft)" : "var(--neg-soft)",
      color: label === "positif" ? "var(--pos)" : "var(--neg)",
    }}>
      <span style={{ opacity: 0.7 }}>{model}</span>
      <span style={{ fontWeight: 600 }}>{label}</span>
      <span style={{ opacity: 0.7 }}>{(conf * 100).toFixed(0)}%</span>
    </span>
  );
}

window.PagePrediksi = PagePrediksi;
