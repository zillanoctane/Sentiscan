/* global React */
const { useState, useEffect, useRef, useMemo } = React;

// Sample Indonesian reviews mimicking Tokopedia smartphone reviews.
// Marked with ground-truth label so the animation can show correct classification.
const REVIEWS = [
  {
    text: "Barangnya bagus banget, pengiriman cepat dan sesuai deskripsi. Mantap seller!",
    tokens: ["barang", "bagus", "banget", "pengiriman", "cepat", "dan", "sesuai", "deskripsi", "mantap", "seller"],
    stops: new Set(["dan"]),
    highlights: { "bagus": "pos", "mantap": "pos", "cepat": "pos" },
    label: "positif",
    nb: 0.94,
    knn: 0.88,
  },
  {
    text: "Kualitas mengecewakan, baterai cepat habis dan layar bergaris.",
    tokens: ["kualitas", "mengecewakan", "baterai", "cepat", "habis", "dan", "layar", "bergaris"],
    stops: new Set(["dan"]),
    highlights: { "mengecewakan": "neg", "habis": "neg", "bergaris": "neg" },
    label: "negatif",
    nb: 0.91,
    knn: 0.79,
  },
  {
    text: "Harga bersaing, original, packing rapi. Recommended seller!",
    tokens: ["harga", "bersaing", "original", "packing", "rapi", "recommended", "seller"],
    stops: new Set([]),
    highlights: { "original": "pos", "rapi": "pos", "recommended": "pos" },
    label: "positif",
    nb: 0.97,
    knn: 0.93,
  },
  {
    text: "Lama banget pengirimannya, barang sampai dalam keadaan rusak. Kecewa.",
    tokens: ["lama", "banget", "pengiriman", "barang", "sampai", "dalam", "keadaan", "rusak", "kecewa"],
    stops: new Set(["dalam"]),
    highlights: { "lama": "neg", "rusak": "neg", "kecewa": "neg" },
    label: "negatif",
    nb: 0.96,
    knn: 0.85,
  },
  {
    text: "Sinyal kuat, kamera jernih, performa lancar untuk gaming. Worth it!",
    tokens: ["sinyal", "kuat", "kamera", "jernih", "performa", "lancar", "untuk", "gaming", "worth", "it"],
    stops: new Set(["untuk"]),
    highlights: { "kuat": "pos", "jernih": "pos", "lancar": "pos", "worth": "pos" },
    label: "positif",
    nb: 0.93,
    knn: 0.90,
  },
  {
    text: "Boros baterai, sering hang, panas saat dipakai. Tidak rekomen.",
    tokens: ["boros", "baterai", "sering", "hang", "panas", "saat", "dipakai", "tidak", "rekomen"],
    stops: new Set(["saat"]),
    highlights: { "boros": "neg", "hang": "neg", "panas": "neg" },
    label: "negatif",
    nb: 0.92,
    knn: 0.81,
  },
];

// Phase durations (ms)
const PHASES = {
  ENTER: 500,
  SCAN: 1700,
  CLEAN: 600,
  CLASSIFY: 900,
  HOLD: 700,
  EXIT: 400,
};
const CYCLE = Object.values(PHASES).reduce((a, b) => a + b, 0);

function useNow(running) {
  const [t, setT] = useState(0);
  const start = useRef(performance.now());
  useEffect(() => {
    if (!running) return;
    let raf;
    const tick = () => {
      setT(performance.now() - start.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running]);
  return t;
}

function phaseAt(t) {
  const c = t % CYCLE;
  let acc = 0;
  for (const [name, dur] of Object.entries(PHASES)) {
    if (c < acc + dur) {
      return { name, local: (c - acc) / dur, absLocal: c - acc };
    }
    acc += dur;
  }
  return { name: "EXIT", local: 1, absLocal: PHASES.EXIT };
}

function indexAt(t) {
  return Math.floor(t / CYCLE) % REVIEWS.length;
}

function SentimentScanner({ accent }) {
  const t = useNow(true);
  const idx = indexAt(t);
  const ph = phaseAt(t);
  const review = REVIEWS[idx];

  // Running tally — count from start of session, plus add any time we hit CLASSIFY
  const [tally, setTally] = useState({ pos: 1284, neg: 612 });
  const lastIdxRef = useRef(idx);
  useEffect(() => {
    if (lastIdxRef.current !== idx) {
      const prev = REVIEWS[lastIdxRef.current];
      setTally((s) => ({
        pos: s.pos + (prev.label === "positif" ? 1 : 0),
        neg: s.neg + (prev.label === "negatif" ? 1 : 0),
      }));
      lastIdxRef.current = idx;
    }
  }, [idx]);

  const total = tally.pos + tally.neg;
  const posPct = total ? (tally.pos / total) * 100 : 50;

  // Recent stack — last 8 results
  const stack = useMemo(() => {
    const arr = [];
    for (let i = 1; i <= 8; i++) {
      const k = (idx - i + REVIEWS.length * 10) % REVIEWS.length;
      arr.push({ key: `${Math.floor(t / CYCLE) - i}-${k}`, label: REVIEWS[k].label });
    }
    return arr;
  }, [idx, Math.floor(t / 100)]);

  // Token reveal: during SCAN phase, fraction of tokens highlighted
  const tokenCount = review.tokens.length;
  let tokenProgress = 0;
  let phaseStage = "enter";
  if (ph.name === "ENTER") {
    tokenProgress = 0;
    phaseStage = "enter";
  } else if (ph.name === "SCAN") {
    tokenProgress = Math.min(1, ph.local) * tokenCount;
    phaseStage = "scan";
  } else if (ph.name === "CLEAN") {
    tokenProgress = tokenCount;
    phaseStage = "clean";
  } else {
    tokenProgress = tokenCount;
    phaseStage = "classify";
  }

  const classifyVisible = ph.name === "CLASSIFY" || ph.name === "HOLD" || ph.name === "EXIT";
  const classifyOpacity = ph.name === "CLASSIFY" ? Math.min(1, ph.local * 2) : ph.name === "EXIT" ? 1 - ph.local : 1;
  const cardTranslate = ph.name === "EXIT" ? -ph.local * 24 : ph.name === "ENTER" ? (1 - ph.local) * 24 : 0;
  const cardOpacity = ph.name === "EXIT" ? 1 - ph.local : ph.name === "ENTER" ? ph.local : 1;

  // Scanner bar Y position (0 at top, 1 at bottom) during SCAN
  let scanY = 0;
  let scanVisible = ph.name === "SCAN";
  if (ph.name === "SCAN") scanY = Math.min(1, ph.local);

  return (
    <div style={{
      position: "relative",
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      gap: 18,
    }}>
      {/* Header strip */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        paddingBottom: 14,
        borderBottom: "1px solid var(--line)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            width: 8, height: 8, borderRadius: "50%",
            background: "var(--pos)",
            boxShadow: "0 0 0 4px rgba(42,122,82,0.15)",
            animation: "pulse 1.4s ease-in-out infinite",
          }}></span>
          <span className="mono" style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-2)" }}>
            LIVE · sentiscan/classifier
          </span>
        </div>
        <div className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
          model: nb + knn (k=5)
        </div>
      </div>

      {/* Main scan card */}
      <div style={{
        position: "relative",
        background: "#fdfbf6",
        border: "1px solid var(--line)",
        borderRadius: 4,
        padding: "22px 24px 20px",
        minHeight: 260,
        overflow: "hidden",
        transform: `translateY(${cardTranslate}px)`,
        opacity: cardOpacity,
        transition: "transform 60ms linear",
        boxShadow: "0 1px 0 rgba(20,17,13,0.04), 0 24px 60px -40px rgba(20,17,13,0.25)",
      }}>
        {/* Index marker */}
        <div style={{
          position: "absolute", top: 14, right: 16,
          display: "flex", gap: 10, alignItems: "center",
        }}>
          <span className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>
            #{(10472 + idx).toString().padStart(5, "0")}
          </span>
        </div>

        <div className="mono" style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 14 }}>
          incoming review · id
        </div>

        {/* Token field */}
        <div style={{
          position: "relative",
          fontSize: 21,
          lineHeight: 1.5,
          color: "var(--ink)",
          minHeight: 105,
          fontWeight: 400,
        }}>
          {review.tokens.map((tok, i) => {
            const revealed = i < tokenProgress;
            const isStop = review.stops.has(tok);
            const high = review.highlights[tok];
            const stopFade = phaseStage === "clean" || phaseStage === "classify";
            const visible = !(isStop && stopFade);
            const tokOpacity = !revealed ? 0.18 : (isStop && stopFade ? 0 : 1);
            const tokColor = revealed ? "var(--ink)" : "var(--muted)";
            return (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  marginRight: 6,
                  position: "relative",
                  opacity: tokOpacity,
                  color: tokColor,
                  transition: "opacity 280ms ease, color 200ms ease, transform 280ms ease",
                  transform: !visible ? "translateY(-4px)" : "translateY(0)",
                }}
              >
                <span style={{
                  position: "relative",
                  zIndex: 1,
                  fontWeight: high && revealed && phaseStage !== "enter" ? 600 : 400,
                }}>{tok}</span>
                {high && revealed && (
                  <span style={{
                    position: "absolute",
                    left: -3, right: -3, bottom: -2, height: 8,
                    background: high === "pos" ? "var(--pos-soft)" : "var(--neg-soft)",
                    borderBottom: `2px solid ${high === "pos" ? "var(--pos)" : "var(--neg)"}`,
                    zIndex: 0,
                    transformOrigin: "left",
                    animation: revealed ? "underlineIn 260ms ease forwards" : "none",
                  }}></span>
                )}
              </span>
            );
          })}

          {/* Scanner sweep line */}
          {scanVisible && (
            <div style={{
              position: "absolute",
              left: -24, right: -24,
              top: `${scanY * 100}%`,
              height: 22,
              pointerEvents: "none",
              background: "linear-gradient(180deg, rgba(20,17,13,0) 0%, rgba(20,17,13,0.08) 50%, rgba(20,17,13,0) 100%)",
              borderTop: "1px solid rgba(20,17,13,0.18)",
              transform: "translateY(-11px)",
            }}></div>
          )}
        </div>

        {/* Classification result */}
        <div style={{
          marginTop: 22,
          paddingTop: 18,
          borderTop: "1px dashed var(--line-strong)",
          display: "flex",
          alignItems: "flex-end",
          gap: 24,
          justifyContent: "space-between",
          opacity: classifyVisible ? classifyOpacity : 0,
          transition: "opacity 200ms ease",
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span className="mono" style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)" }}>
              predicted label
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <span style={{
                fontFamily: "'Instrument Serif', serif",
                fontStyle: "italic",
                fontSize: 38,
                lineHeight: 1,
                color: review.label === "positif" ? "var(--pos)" : "var(--neg)",
              }}>
                {review.label}
              </span>
              <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
                ↑ f1 weighted
              </span>
            </div>
          </div>

          <ModelBar name="Naïve Bayes" value={review.nb} active={review.nb >= review.knn} accent={review.label === "positif" ? "var(--pos)" : "var(--neg)"} />
          <ModelBar name="KNN k=5" value={review.knn} active={review.knn > review.nb} accent={review.label === "positif" ? "var(--pos)" : "var(--neg)"} />
        </div>
      </div>

      {/* Footer: tally + recent stack */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: 20,
        alignItems: "stretch",
      }}>
        <div style={{
          background: "var(--bg-2)",
          border: "1px solid var(--line)",
          borderRadius: 4,
          padding: "14px 18px",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span className="mono" style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)" }}>
              session distribution · n = {total.toLocaleString()}
            </span>
            <span className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>
              {posPct.toFixed(1)}% pos
            </span>
          </div>
          {/* Bar */}
          <div style={{
            display: "flex", height: 10, borderRadius: 2, overflow: "hidden",
            background: "var(--line)",
          }}>
            <div style={{
              width: `${posPct}%`,
              background: "var(--pos)",
              transition: "width 400ms ease",
            }}></div>
            <div style={{
              width: `${100 - posPct}%`,
              background: "var(--neg)",
              transition: "width 400ms ease",
            }}></div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, background: "var(--pos)", borderRadius: 1 }}></span>
              <span className="mono" style={{ fontSize: 12 }}>positif</span>
              <span className="mono" style={{ fontSize: 12, color: "var(--muted)" }}>{tally.pos.toLocaleString()}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, background: "var(--neg)", borderRadius: 1 }}></span>
              <span className="mono" style={{ fontSize: 12 }}>negatif</span>
              <span className="mono" style={{ fontSize: 12, color: "var(--muted)" }}>{tally.neg.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Recent stack */}
        <div style={{
          background: "var(--bg-2)",
          border: "1px solid var(--line)",
          borderRadius: 4,
          padding: "14px 16px",
          minWidth: 150,
        }}>
          <div className="mono" style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 10 }}>
            recent
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {stack.slice(0, 6).map((s, i) => (
              <div key={s.key} style={{
                display: "flex", alignItems: "center", gap: 8,
                opacity: 1 - i * 0.13,
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: 1,
                  background: s.label === "positif" ? "var(--pos)" : "var(--neg)",
                }}></span>
                <span className="mono" style={{ fontSize: 11, color: "var(--ink-2)" }}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(42,122,82,0.4); }
          50% { box-shadow: 0 0 0 6px rgba(42,122,82,0); }
        }
        @keyframes underlineIn {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
      `}</style>
    </div>
  );
}

function ModelBar({ name, value, active, accent }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 110 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span className="mono" style={{ fontSize: 10, color: active ? "var(--ink)" : "var(--muted)", fontWeight: active ? 600 : 400 }}>
          {name}
        </span>
        <span className="mono" style={{ fontSize: 11, color: "var(--ink)" }}>
          {(value * 100).toFixed(1)}
        </span>
      </div>
      <div style={{ height: 4, background: "var(--line)", borderRadius: 1, overflow: "hidden" }}>
        <div style={{
          width: `${value * 100}%`,
          height: "100%",
          background: active ? accent : "var(--line-strong)",
          transition: "width 350ms ease",
        }}></div>
      </div>
    </div>
  );
}

window.SentimentScanner = SentimentScanner;
