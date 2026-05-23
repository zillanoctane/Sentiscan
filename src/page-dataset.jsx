/* global React, AppData, Card */
const { useState, useMemo, useRef } = React;

function PageDataset() {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [labelFilter, setLabelFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [extraReviews, setExtraReviews] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [scrapeStatus, setScrapeStatus] = useState(null);
  const fileInputRef = useRef();

  const PAGE_SIZE = 12;
  const allReviews = useMemo(() => [...extraReviews, ...AppData.REVIEWS], [extraReviews]);
  const brands = useMemo(() => ["all", ...new Set(AppData.REVIEWS.map(r => r.brand))], []);
  const filtered = useMemo(() => {
    return allReviews.filter(r => {
      if (labelFilter !== "all" && r.label !== labelFilter) return false;
      if (brandFilter !== "all" && r.brand !== brandFilter) return false;
      if (query) {
        const q = query.toLowerCase();
        if (!r.review_text.toLowerCase().includes(q) && !r.product_name.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [allReviews, query, labelFilter, brandFilter]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function simulateUpload(file) {
    setUploadProgress({ name: file.name, size: file.size, pct: 0, status: "parsing" });
    let pct = 0;
    const interval = setInterval(() => {
      pct += 7 + Math.random() * 12;
      if (pct >= 100) {
        clearInterval(interval);
        // generate a few fake new reviews from the "upload"
        const added = [];
        const startId = Math.max(...allReviews.map(r => r.id)) + 1;
        for (let i = 0; i < 23; i++) {
          const tpl = AppData.REVIEWS[Math.floor(Math.random() * AppData.REVIEWS.length)];
          added.push({ ...tpl, id: startId + i, created_at: new Date().toISOString().slice(0, 10) });
        }
        setExtraReviews((prev) => [...added, ...prev]);
        setUploadProgress({ name: file.name, size: file.size, pct: 100, status: "done", added: added.length });
      } else {
        setUploadProgress((prev) => ({ ...prev, pct: Math.min(99, pct) }));
      }
    }, 110);
  }

  function simulateScrape(e) {
    e.preventDefault();
    const form = new FormData(e.target);
    const url = form.get("url");
    if (!url) return;
    setScrapeStatus({ url, status: "connecting", found: 0 });
    let step = 0;
    const steps = [
      { status: "connecting", found: 0 },
      { status: "parsing", found: 24 },
      { status: "parsing", found: 87 },
      { status: "parsing", found: 156 },
      { status: "saving", found: 218 },
      { status: "done", found: 247 },
    ];
    const tick = () => {
      if (step >= steps.length) return;
      setScrapeStatus({ url, ...steps[step] });
      step++;
      if (step < steps.length) setTimeout(tick, 650);
    };
    tick();
  }

  function autoLabel() {
    // pretend
    alert("Auto-label dijalankan: 247 ulasan terlabeli berdasarkan rating.");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      {/* Acquisition row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}>
        <Card title="Scrape dari URL Tokopedia" subtitle="ambil ulasan langsung dari halaman produk">
          <form onSubmit={simulateScrape} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <label style={lbl}>URL produk</label>
            <input name="url" defaultValue="https://www.tokopedia.com/galeri-smartphone/iphone-15-pro-max-256gb" style={input} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={lbl}>Nama dataset</label>
                <input defaultValue="iPhone 15 Pro Max — Mei 2026" style={input} />
              </div>
              <div>
                <label style={lbl}>Maks ulasan</label>
                <input type="number" defaultValue="500" style={input} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button type="submit" style={btnPrimary}>Mulai scraping</button>
              <button type="button" style={btnGhost}>Test koneksi</button>
            </div>
          </form>

          {scrapeStatus && (
            <div style={{ marginTop: 18, padding: 14, background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 3 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span className="mono" style={{ fontSize: 11, color: "var(--ink-2)" }}>{scrapeStatus.url}</span>
                <span className="mono" style={{ fontSize: 11, color: scrapeStatus.status === "done" ? "var(--pos)" : "var(--muted)" }}>
                  {scrapeStatus.status === "done" ? "✓ selesai" : scrapeStatus.status}
                </span>
              </div>
              <div style={{ height: 4, background: "var(--line)", borderRadius: 1, overflow: "hidden" }}>
                <div style={{
                  width: `${Math.min(100, (scrapeStatus.found / 247) * 100)}%`,
                  height: "100%",
                  background: scrapeStatus.status === "done" ? "var(--pos)" : "var(--ink)",
                  transition: "width 400ms ease",
                }}></div>
              </div>
              <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 8 }}>
                {scrapeStatus.found} ulasan ditemukan
              </div>
            </div>
          )}
        </Card>

        <Card title="Unggah CSV" subtitle="kolom wajib: review_text · opsional: rating, label">
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) simulateUpload(f);
            }}
            style={{
              border: "1.5px dashed var(--line-strong)",
              borderRadius: 4,
              padding: "32px 20px",
              textAlign: "center",
              cursor: "pointer",
              background: "var(--bg)",
              transition: "background 150ms",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(20,17,13,0.02)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "var(--bg)"}
          >
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ marginBottom: 10, opacity: 0.7 }}>
              <rect x="4" y="6" width="24" height="22" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M11 18l5-5 5 5M16 13v10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
              Tarik file CSV ke sini atau klik untuk pilih
            </div>
            <div className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
              maks 10MB · format UTF-8 · contoh: <a href="#" style={{ color: "var(--ink-2)" }}>template.csv</a>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              style={{ display: "none" }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) simulateUpload(f); }}
            />
          </div>

          {uploadProgress && (
            <div style={{ marginTop: 16, padding: 12, background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 3 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 12 }}>{uploadProgress.name}</span>
                <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>{Math.round(uploadProgress.pct)}%</span>
              </div>
              <div style={{ height: 4, background: "var(--line)", borderRadius: 1, overflow: "hidden" }}>
                <div style={{
                  width: `${uploadProgress.pct}%`,
                  height: "100%",
                  background: uploadProgress.status === "done" ? "var(--pos)" : "var(--ink)",
                  transition: "width 200ms",
                }}></div>
              </div>
              {uploadProgress.status === "done" && (
                <div className="mono" style={{ fontSize: 11, color: "var(--pos)", marginTop: 8 }}>
                  ✓ {uploadProgress.added} baris berhasil ditambahkan
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Reviews table */}
      <Card padded={false}>
        <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>Tabel ulasan</div>
            <div className="mono" style={{ fontSize: 10, color: "var(--muted)", marginTop: 2, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {filtered.length.toLocaleString("id-ID")} dari {allReviews.length.toLocaleString("id-ID")} ulasan
            </div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
            <input
              placeholder="Cari teks atau produk…"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              style={{ ...input, width: 240, padding: "7px 12px" }}
            />
            <select value={labelFilter} onChange={(e) => { setLabelFilter(e.target.value); setPage(1); }} style={{ ...input, padding: "7px 12px", width: "auto" }}>
              <option value="all">Semua label</option>
              <option value="positif">Positif</option>
              <option value="negatif">Negatif</option>
            </select>
            <select value={brandFilter} onChange={(e) => { setBrandFilter(e.target.value); setPage(1); }} style={{ ...input, padding: "7px 12px", width: "auto" }}>
              {brands.map(b => <option key={b} value={b}>{b === "all" ? "Semua merek" : b}</option>)}
            </select>
            <button onClick={autoLabel} style={btnGhost}>Auto-label</button>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "var(--bg)" }}>
                <Th>ID</Th>
                <Th>Produk</Th>
                <Th wide>Teks ulasan</Th>
                <Th>Rating</Th>
                <Th>Label</Th>
                <Th>Tanggal</Th>
                <Th>Aksi</Th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((r, i) => (
                <tr key={r.id} style={{ borderTop: "1px solid var(--line)" }}>
                  <Td><span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>#{r.id}</span></Td>
                  <Td>
                    <div style={{ fontSize: 13 }}>{r.product_name}</div>
                    <div className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>{r.brand}</div>
                  </Td>
                  <Td>
                    <div style={{ maxWidth: 480, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={r.review_text}>
                      {r.review_text}
                    </div>
                  </Td>
                  <Td>
                    <Stars rating={r.rating} />
                  </Td>
                  <Td>
                    {r.label ? (
                      <span className="mono" style={{
                        padding: "2px 8px",
                        borderRadius: 2,
                        fontSize: 11,
                        background: r.label === "positif" ? "var(--pos-soft)" : "var(--neg-soft)",
                        color: r.label === "positif" ? "var(--pos)" : "var(--neg)",
                      }}>{r.label}</span>
                    ) : (
                      <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>—</span>
                    )}
                  </Td>
                  <Td><span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>{r.created_at}</span></Td>
                  <Td>
                    <button style={iconBtn}>✎</button>
                    <button style={iconBtn}>×</button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ padding: "14px 18px", borderTop: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
            halaman {page} / {totalPages}
          </span>
          <div style={{ display: "flex", gap: 4 }}>
            <button onClick={() => setPage(1)} disabled={page === 1} style={pageBtn(page === 1)}>«</button>
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} style={pageBtn(page === 1)}>‹</button>
            {pageNumbers(page, totalPages).map((p, i) => (
              p === "…"
                ? <span key={i} className="mono" style={{ padding: "0 8px", color: "var(--muted)", alignSelf: "center" }}>…</span>
                : <button key={p} onClick={() => setPage(p)} style={pageBtn(false, page === p)}>{p}</button>
            ))}
            <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} style={pageBtn(page === totalPages)}>›</button>
            <button onClick={() => setPage(totalPages)} disabled={page === totalPages} style={pageBtn(page === totalPages)}>»</button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function pageNumbers(p, total) {
  const out = [];
  if (total <= 7) { for (let i = 1; i <= total; i++) out.push(i); return out; }
  out.push(1);
  if (p > 3) out.push("…");
  for (let i = Math.max(2, p - 1); i <= Math.min(total - 1, p + 1); i++) out.push(i);
  if (p < total - 2) out.push("…");
  out.push(total);
  return out;
}

function Stars({ rating }) {
  return (
    <div style={{ display: "flex", gap: 1 }}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width="11" height="11" viewBox="0 0 12 12" fill={i <= rating ? "var(--ink)" : "var(--line-strong)"}>
          <path d="M6 1l1.5 3.2L11 4.7l-2.5 2.4.6 3.4L6 8.9 2.9 10.5l.6-3.4L1 4.7l3.5-.5L6 1z"/>
        </svg>
      ))}
    </div>
  );
}

const Th = ({ children, wide }) => (
  <th style={{
    textAlign: "left",
    padding: "10px 14px",
    fontWeight: 500,
    fontSize: 11,
    color: "var(--muted)",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontFamily: "'JetBrains Mono', monospace",
    width: wide ? "auto" : "1%",
    whiteSpace: "nowrap",
  }}>{children}</th>
);
const Td = ({ children }) => (
  <td style={{ padding: "10px 14px", verticalAlign: "middle" }}>{children}</td>
);

const input = {
  fontSize: 13,
  padding: "9px 12px",
  border: "1px solid var(--line-strong)",
  borderRadius: 3,
  background: "var(--bg)",
  color: "var(--ink)",
  fontFamily: "inherit",
  width: "100%",
  outline: "none",
};
const lbl = { fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 };
const btnPrimary = { fontSize: 13, padding: "9px 16px", background: "var(--ink)", color: "var(--bg)", border: "none", borderRadius: 3, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" };
const btnGhost = { fontSize: 13, padding: "9px 16px", background: "transparent", color: "var(--ink)", border: "1px solid var(--line-strong)", borderRadius: 3, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" };
const iconBtn = { width: 24, height: 24, border: "1px solid var(--line)", background: "var(--bg)", borderRadius: 2, cursor: "pointer", color: "var(--ink-2)", marginRight: 4, fontSize: 12, fontFamily: "inherit" };
const pageBtn = (disabled, active) => ({
  minWidth: 28, height: 28, padding: "0 8px",
  border: "1px solid var(--line)",
  background: active ? "var(--ink)" : "var(--bg)",
  color: active ? "var(--bg)" : disabled ? "var(--muted)" : "var(--ink)",
  borderRadius: 2, cursor: disabled ? "default" : "pointer",
  fontSize: 12, fontFamily: "'JetBrains Mono', monospace",
});

window.PageDataset = PageDataset;
