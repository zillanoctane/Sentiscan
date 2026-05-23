/* global React, AppData, Card */
const { useState, useEffect } = React;

const STAGES = [
  { id: "clean", label: "Cleaning", desc: "Hapus URL, angka, tanda baca, emoji" },
  { id: "case", label: "Case folding", desc: "Ubah ke huruf kecil" },
  { id: "token", label: "Tokenizing", desc: "Pisah jadi token kata" },
  { id: "stop", label: "Stopword removal", desc: "Hapus stopword ID (Sastrawi)" },
  { id: "stem", label: "Stemming", desc: "Ubah ke kata dasar (StemmerFactory)" },
  { id: "join", label: "Join tokens", desc: "Simpan ke clean_text" },
];

const SAMPLES = [
  { raw: "Mantap, pengiriman cepat banget! Barangnya sesuai deskripsi 100% ORIGINAL 😍", clean: "mantap kirim cepat barang suai deskripsi original" },
  { raw: "Kecewa, baterai cepat habis dan sering panas dipakai gaming...", clean: "kecewa baterai cepat habis sering panas pakai gaming" },
  { raw: "Harga di toko ini paling murah, packing rapi, recommended seller!! 👍", clean: "harga toko murah packing rapi recommended sell" },
  { raw: "Sayang sekali ada cacat di layar pojok kanan atas, mengecewakan banget", clean: "sayang cacat layar pojok kanan atas kecewa" },
  { raw: "Original 100%, fast charging mantap, kamera jernih malam hari juga bagus", clean: "original fast charging mantap kamera jernih malam hari bagus" },
];

function PagePraproses() {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeStage, setActiveStage] = useState(-1);
  const [done, setDone] = useState(false);

  function run() {
    setDone(false);
    setRunning(true);
    setProgress(0);
    setActiveStage(0);
    let s = 0;
    const total = STAGES.length;
    const stepDur = 700;
    const interval = setInterval(() => {
      s++;
      if (s >= total) {
        clearInterval(interval);
        setProgress(100);
        setActiveStage(total);
        setRunning(false);
        setDone(true);
      } else {
        setActiveStage(s);
        setProgress((s / total) * 100);
      }
    }, stepDur);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <Card padded={false}>
        <div style={{ padding: "20px 22px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 500 }}>Pipeline praproses teks</div>
            <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>
              6 tahap berurutan · Sastrawi (Indonesia) · TF-IDF siap ekstrak
            </div>
          </div>
          <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>dataset_id: ds_2026_05_18</span>
          <button onClick={run} disabled={running} style={{ ...btnPrimary, opacity: running ? 0.5 : 1, cursor: running ? "wait" : "pointer" }}>
            {running ? "Memproses…" : done ? "Jalankan ulang" : "Jalankan praproses"}
          </button>
        </div>

        {/* Stage pipeline */}
        <div style={{ padding: "22px 22px 26px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12, marginBottom: 22 }}>
            {STAGES.map((s, i) => {
              const isActive = activeStage === i && running;
              const isDone = activeStage > i || (done && i < STAGES.length);
              return (
                <div key={s.id} style={{
                  padding: "14px 12px",
                  background: isActive ? "var(--bg)" : isDone ? "var(--pos-soft)" : "var(--bg)",
                  border: "1px solid",
                  borderColor: isActive ? "var(--ink)" : isDone ? "var(--pos)" : "var(--line)",
                  borderRadius: 3,
                  position: "relative",
                  transition: "all 200ms",
                }}>
                  <div className="mono" style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.06em", marginBottom: 6 }}>
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 10, color: "var(--muted)", lineHeight: 1.4 }}>{s.desc}</div>
                  {isDone && (
                    <svg width="12" height="12" viewBox="0 0 12 12" style={{ position: "absolute", top: 8, right: 8 }}>
                      <circle cx="6" cy="6" r="6" fill="var(--pos)"/>
                      <path d="M3.5 6l1.8 1.8L8.5 4.5" stroke="var(--bg)" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                  {isActive && (
                    <div style={{
                      position: "absolute", left: -1, right: -1, bottom: -1, height: 2,
                      background: "var(--ink)",
                      animation: "stageProgress 700ms linear",
                    }}></div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>progress global</span>
            <span className="mono" style={{ fontSize: 11 }}>{Math.round(progress)}%</span>
          </div>
          <div style={{ height: 4, background: "var(--line)", borderRadius: 1, overflow: "hidden" }}>
            <div style={{ width: `${progress}%`, height: "100%", background: done ? "var(--pos)" : "var(--ink)", transition: "width 500ms ease" }}></div>
          </div>
        </div>
      </Card>

      {/* Before / After preview */}
      <Card title="Preview before / after" subtitle="sampel 5 baris dari dataset">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th} className="mono">#</th>
              <th style={th} className="mono">teks asli</th>
              <th style={th} className="mono">clean_text</th>
            </tr>
          </thead>
          <tbody>
            {SAMPLES.map((s, i) => (
              <tr key={i} style={{ borderTop: "1px solid var(--line)" }}>
                <td style={{ padding: "12px 10px", verticalAlign: "top" }}>
                  <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>{i + 1}</span>
                </td>
                <td style={{ padding: "12px 10px", verticalAlign: "top", fontSize: 13, color: "var(--ink-2)", maxWidth: 380 }}>
                  {s.raw}
                </td>
                <td style={{ padding: "12px 10px", verticalAlign: "top", fontSize: 13 }}>
                  {done || activeStage >= 5 ? (
                    <span className="mono" style={{ background: "var(--pos-soft)", padding: "2px 6px", borderRadius: 2, color: "var(--ink)" }}>
                      {s.clean}
                    </span>
                  ) : (
                    <span style={{ color: "var(--muted)", fontStyle: "italic" }}>menunggu praproses…</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <style>{`
        @keyframes stageProgress {
          from { transform: scaleX(0); transform-origin: left; }
          to { transform: scaleX(1); transform-origin: left; }
        }
      `}</style>
    </div>
  );
}

const th = {
  textAlign: "left",
  padding: "10px",
  fontWeight: 500,
  fontSize: 10,
  color: "var(--muted)",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};
const btnPrimary = { fontSize: 13, padding: "9px 16px", background: "var(--ink)", color: "var(--bg)", border: "none", borderRadius: 3, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" };

window.PagePraproses = PagePraproses;
