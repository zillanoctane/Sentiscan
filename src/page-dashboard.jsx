/* global React, AppData, Card, Donut, ActivityChart, WordCloud, ComparisonBars, useAnimNum */
const { useMemo } = React;

function PageDashboard({ setRoute }) {
  const { REVIEWS, EXPERIMENTS, TOP_POS_WORDS, TOP_NEG_WORDS, ACTIVITY } = AppData;
  const stats = useMemo(() => {
    const labeled = REVIEWS.filter(r => r.label);
    return {
      total: REVIEWS.length,
      labeled: labeled.length,
      pos: labeled.filter(r => r.label === "positif").length,
      neg: labeled.filter(r => r.label === "negatif").length,
      products: new Set(REVIEWS.map(r => r.product_name)).size,
    };
  }, []);
  const latest = EXPERIMENTS[EXPERIMENTS.length - 1];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      {/* Hero strip */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1.4fr 1fr",
        gap: 22,
      }}>
        <Card padded={false}>
          <div style={{ padding: "28px 28px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
            <div className="mono" style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)" }}>
              ringkasan analisis · {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
            </div>
            <h1 style={{
              margin: 0,
              fontSize: 36,
              fontWeight: 500,
              letterSpacing: "-0.025em",
              lineHeight: 1.1,
              textWrap: "balance",
            }}>
              {stats.labeled.toLocaleString("id-ID")} ulasan dianalisis dari{" "}
              <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontWeight: 400 }}>
                {stats.products} produk smartphone
              </span>{" "}
              di Tokopedia.
            </h1>
            <div className="stat-row" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0, borderTop: "1px solid var(--line)", paddingTop: 18 }}>
              <Stat k={stats.total.toLocaleString("id-ID")} v="Total ulasan" />
              <Stat k={stats.pos.toLocaleString("id-ID")} v="Positif" color="var(--pos)" />
              <Stat k={stats.neg.toLocaleString("id-ID")} v="Negatif" color="var(--neg)" />
              <Stat k={`${(latest.nb.acc * 100).toFixed(1)}%`} v="Akurasi NB terkini" last />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button onClick={() => setRoute("pemodelan")} style={btnPrimary}>Latih model baru →</button>
              <button onClick={() => setRoute("hasil")} style={btnGhost}>Lihat hasil terbaru</button>
            </div>
          </div>
        </Card>

        <Card title="Distribusi sentimen" subtitle="seluruh dataset">
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <Donut pos={stats.pos} neg={stats.neg} size={160} thickness={20} />
            <div style={{ display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>
              <Legend color="var(--pos)" label="positif" value={stats.pos} total={stats.labeled} />
              <Legend color="var(--neg)" label="negatif" value={stats.neg} total={stats.labeled} />
              <div style={{ paddingTop: 10, borderTop: "1px dashed var(--line-strong)" }}>
                <div className="mono" style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                  rasio
                </div>
                <div style={{ fontSize: 18, fontWeight: 500 }}>
                  {(stats.pos / stats.neg).toFixed(2)} : 1
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Row 2 */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 22 }}>
        <Card title="Aktivitas ulasan" subtitle="14 hari terakhir" action={<span className="mono" style={chip}>+12.4%</span>}>
          <ActivityChart data={ACTIVITY} height={200} />
        </Card>

        <Card title="Perbandingan algoritma" subtitle={`eksperimen #${latest.id}`}>
          <ComparisonBars nb={latest.nb} knn={latest.knn} />
          <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>Pemenang:</span>
            <span style={{
              padding: "4px 10px",
              background: "var(--ink)",
              color: "var(--bg)",
              borderRadius: 3,
              fontSize: 12,
              fontWeight: 500,
            }}>Naïve Bayes</span>
            <span className="mono" style={{ fontSize: 11, color: "var(--muted)", marginLeft: "auto" }}>F1 +{((latest.nb.f1 - latest.knn.f1) * 100).toFixed(1)}</span>
          </div>
        </Card>
      </div>

      {/* Row 3 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}>
        <Card title="Kata paling positif" subtitle="frekuensi tinggi · label positif">
          <WordCloud words={TOP_POS_WORDS} accent="var(--pos)" />
        </Card>
        <Card title="Kata paling negatif" subtitle="frekuensi tinggi · label negatif">
          <WordCloud words={TOP_NEG_WORDS} accent="var(--neg)" />
        </Card>
      </div>

      {/* Row 4 — recent reviews */}
      <Card title="Ulasan terbaru" subtitle="terbaru dari dataset" action={<a href="#/dataset" style={{ fontSize: 12, color: "var(--ink-2)", textDecoration: "underline", textUnderlineOffset: 3 }}>Lihat semua →</a>}>
        <RecentReviews />
      </Card>
    </div>
  );
}

function Stat({ k, v, color, last }) {
  return (
    <div style={{
      paddingRight: 18,
      borderRight: last ? "none" : "1px solid var(--line)",
      paddingLeft: 0,
    }}>
      <div style={{
        fontSize: 26,
        fontWeight: 500,
        letterSpacing: "-0.02em",
        color: color || "var(--ink)",
        marginBottom: 2,
      }}>{k}</div>
      <div className="mono" style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{v}</div>
    </div>
  );
}

function Legend({ color, label, value, total }) {
  const pct = (value / total) * 100;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 8, height: 8, background: color, borderRadius: 1 }}></span>
          <span style={{ fontSize: 13 }}>{label}</span>
        </div>
        <span className="mono" style={{ fontSize: 12 }}>{value.toLocaleString("id-ID")}</span>
      </div>
      <div style={{ height: 4, background: "var(--line)", borderRadius: 1 }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 1 }}></div>
      </div>
    </div>
  );
}

function RecentReviews() {
  const recent = AppData.REVIEWS.filter(r => r.label).slice(-6).reverse();
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {recent.map((r, i) => (
        <div key={r.id} style={{
          display: "grid",
          gridTemplateColumns: "auto 1fr auto auto",
          gap: 16,
          alignItems: "center",
          padding: "12px 0",
          borderTop: i === 0 ? "none" : "1px solid var(--line)",
        }}>
          <span className="mono" style={{ fontSize: 10, color: "var(--muted)", width: 50 }}>#{r.id}</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: 2 }}>
              {r.review_text}
            </div>
            <div className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>
              {r.product_name} · ★ {r.rating} · {r.created_at}
            </div>
          </div>
          <span style={{
            padding: "2px 8px",
            borderRadius: 2,
            fontSize: 11,
            fontWeight: 500,
            background: r.label === "positif" ? "var(--pos-soft)" : "var(--neg-soft)",
            color: r.label === "positif" ? "var(--pos)" : "var(--neg)",
          }} className="mono">{r.label}</span>
        </div>
      ))}
    </div>
  );
}

const btnPrimary = {
  fontSize: 13,
  padding: "10px 18px",
  background: "var(--ink)",
  color: "var(--bg)",
  border: "none",
  borderRadius: 3,
  fontWeight: 500,
  cursor: "pointer",
  fontFamily: "inherit",
};
const btnGhost = {
  fontSize: 13,
  padding: "10px 18px",
  background: "transparent",
  color: "var(--ink)",
  border: "1px solid var(--line-strong)",
  borderRadius: 3,
  fontWeight: 500,
  cursor: "pointer",
  fontFamily: "inherit",
};
const chip = {
  fontSize: 10,
  padding: "3px 8px",
  background: "var(--pos-soft)",
  color: "var(--pos)",
  borderRadius: 2,
  letterSpacing: "0.04em",
};

window.PageDashboard = PageDashboard;
window.dashStyles = { btnPrimary, btnGhost, chip };
