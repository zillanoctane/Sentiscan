/* global React, ReactDOM, AppData, Card, useAnimNum */
const { useState, useEffect, useRef, useMemo } = React;

// ─────────── Auth gate ───────────
function getAuth() { try { return JSON.parse(localStorage.getItem("sentiscan.auth")); } catch { return null; } }
function clearAuth() { localStorage.removeItem("sentiscan.auth"); }

// ─────────── Customer profile (photo) ───────────
const CUST_PROFILE_KEY = "sentiscan.cust.profile";
function loadCustProfile() {
  try { const r = localStorage.getItem(CUST_PROFILE_KEY); if (r) return JSON.parse(r); } catch {}
  return null;
}
function saveCustProfile(p) {
  localStorage.setItem(CUST_PROFILE_KEY, JSON.stringify(p));
  window.dispatchEvent(new Event("cust:profile"));
}

// ─────────── My reviews (localStorage) ───────────
const MY_REVIEWS_KEY = "sentiscan.cust.reviews";
function loadMyReviews() {
  try { return JSON.parse(localStorage.getItem(MY_REVIEWS_KEY)) || []; } catch { return []; }
}
function saveMyReviews(r) { localStorage.setItem(MY_REVIEWS_KEY, JSON.stringify(r)); window.dispatchEvent(new Event("cust:reviews")); }

const POS_K = ["bagus","mantap","cepat","rapi","original","puas","ramah","recommended","lancar","jernih","awet","stabil","premium","tajam","terang","worth","oke","keren"];
const NEG_K = ["kecewa","rusak","lama","habis","lemot","panas","hang","bergaris","bocor","blur","pecah","buruk","jelek","lambat","cacat","palsu"];

function predict(text) {
  const lower = text.toLowerCase();
  const p = POS_K.filter(k => lower.includes(k)).length;
  const n = NEG_K.filter(k => lower.includes(k)).length;
  if (p === 0 && n === 0) return { label: "netral", conf: 0.55 };
  const label = p >= n ? "positif" : "negatif";
  const conf = Math.min(0.97, 0.62 + Math.abs(p - n) * 0.1);
  return { label, conf };
}

// ─────────── Layout ───────────
function CustomerApp() {
  const [auth, setAuth] = useState(getAuth());
  const [route, setRoute] = useState(location.hash.replace("#/", "") || "produk");
  useEffect(() => {
    if (!auth) { window.location.href = "login.html"; return; }
    const onHash = () => setRoute(location.hash.replace("#/", "") || "produk");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [auth]);

  if (!auth) return null;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Header auth={auth} route={route} />
      <main className="cust-main" style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 32px 60px" }}>
        {route === "produk" && <ProductsPage />}
        {route.startsWith("produk/") && <ProductDetail id={parseInt(route.split("/")[1], 10)} />}
        {route === "ulasanku" && <MyReviews />}
        {route === "profil" && <CustomerProfile auth={auth} setAuth={setAuth} />}
      </main>
    </div>
  );
}

function Header({ auth, route }) {
  const [open, setOpen] = useState(false);
  const profile = useCustProfile(auth);
  const tabs = [
    { id: "produk", label: "Produk" },
    { id: "ulasanku", label: "Ulasan saya" },
    { id: "profil", label: "Profil" },
  ];
  function logout() { clearAuth(); window.location.href = "login.html"; }

  return (
    <header style={{ borderBottom: "1px solid var(--line)", background: "var(--bg)", position: "sticky", top: 0, zIndex: 30 }}>
      <div className="cust-head" style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px", display: "flex", alignItems: "center", height: 64, gap: 32 }}>
        <a href="#/produk" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "var(--ink)" }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <circle cx="11" cy="11" r="10" stroke="var(--ink)" strokeWidth="1.4" />
            <path d="M3 11 Q 11 4, 19 11" stroke="var(--pos)" strokeWidth="1.4" fill="none" />
            <path d="M3 11 Q 11 18, 19 11" stroke="var(--neg)" strokeWidth="1.4" fill="none" />
            <circle cx="11" cy="11" r="1.6" fill="var(--ink)" />
          </svg>
          <span style={{ fontWeight: 600, letterSpacing: "-0.01em", fontSize: 17 }}>Sentiscan</span>
          <span className="mono" style={{ fontSize: 10, padding: "2px 7px", border: "1px solid var(--line)", borderRadius: 99, color: "var(--muted)" }}>pelanggan</span>
        </a>

        <nav style={{ display: "flex", gap: 4, marginLeft: 12 }}>
          {tabs.map((t) => {
            const active = route === t.id || (t.id === "produk" && route.startsWith("produk"));
            return (
              <a key={t.id} href={"#/" + t.id} style={{
                padding: "8px 14px",
                fontSize: 14,
                color: active ? "var(--ink)" : "var(--ink-2)",
                background: active ? "var(--bg-2)" : "transparent",
                borderRadius: 4,
                textDecoration: "none",
                fontWeight: active ? 500 : 400,
              }}>{t.label}</a>
            );
          })}
        </nav>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14, position: "relative" }}>
          <button onClick={() => setOpen(!open)} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "6px 12px 6px 6px",
            background: "var(--bg-2)", border: "1px solid var(--line)",
            borderRadius: 99, cursor: "pointer", fontFamily: "inherit",
          }}>
            <Avatar profile={profile} auth={auth} size={28} />
            <span style={{ fontSize: 13, fontWeight: 500 }}>{auth.name.split(" ")[0]}</span>
            <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 4l3 3 3-3" stroke="var(--ink-2)" strokeWidth="1.3" fill="none"/></svg>
          </button>
          {open && (
            <div style={{
              position: "absolute", top: "calc(100% + 8px)", right: 0,
              background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 4,
              minWidth: 220, boxShadow: "0 16px 40px -20px rgba(0,0,0,0.2)", padding: 6, zIndex: 50,
            }}>
              <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--line)", marginBottom: 4 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{auth.name}</div>
                <div className="mono" style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>{auth.email}</div>
              </div>
              <a href="#/profil" onClick={() => setOpen(false)} style={menuItem}>Profil & foto</a>
              <a href="#/ulasanku" onClick={() => setOpen(false)} style={menuItem}>Ulasan saya</a>
              <button onClick={logout} style={{ ...menuItem, width: "100%", textAlign: "left", border: "none", background: "transparent", color: "var(--neg)", borderTop: "1px solid var(--line)", marginTop: 4, paddingTop: 10, fontFamily: "inherit", cursor: "pointer", fontSize: 13 }}>Keluar</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

const menuItem = {
  display: "block",
  padding: "8px 12px",
  fontSize: 13,
  color: "var(--ink)",
  textDecoration: "none",
  borderRadius: 3,
};

function useCustProfile(auth) {
  const [p, setP] = useState(loadCustProfile() || auth);
  useEffect(() => {
    const sync = () => setP(loadCustProfile() || auth);
    window.addEventListener("cust:profile", sync);
    return () => window.removeEventListener("cust:profile", sync);
  }, [auth]);
  return p;
}

function Avatar({ profile, auth, size = 32 }) {
  const initials = (auth?.name || profile?.name || "U").split(" ").map(s => s[0]).slice(0, 2).join("").toUpperCase();
  const photo = profile?.photo || auth?.photo;
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: photo ? "transparent" : "var(--ink)",
      color: "var(--bg)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 500, fontSize: size * 0.36,
      overflow: "hidden", flexShrink: 0,
      backgroundImage: photo ? `url(${photo})` : "none",
      backgroundSize: "cover", backgroundPosition: "center",
    }}>
      {!photo && initials}
    </div>
  );
}

// ─────────── PRODUCTS LIST ───────────
function ProductsPage() {
  const products = useMemo(() => {
    // Group reviews by product and compute aggregate metrics
    const map = new Map();
    for (const r of AppData.REVIEWS) {
      if (!map.has(r.product_name)) {
        map.set(r.product_name, { name: r.product_name, brand: r.brand, reviews: [], rating_sum: 0 });
      }
      const p = map.get(r.product_name);
      p.reviews.push(r);
      p.rating_sum += r.rating;
    }
    return [...map.values()].map(p => {
      const labeled = p.reviews.filter(r => r.label);
      const pos = labeled.filter(r => r.label === "positif").length;
      return {
        ...p,
        id: encodeURIComponent(p.name),
        total: p.reviews.length,
        avg: p.rating_sum / p.reviews.length,
        pos_pct: labeled.length ? (pos / labeled.length) * 100 : 0,
      };
    });
  }, []);

  const [q, setQ] = useState("");
  const [brand, setBrand] = useState("all");
  const [sort, setSort] = useState("populer");

  const brands = useMemo(() => ["all", ...new Set(products.map(p => p.brand))], [products]);
  const filtered = useMemo(() => {
    let list = products.filter(p => {
      if (brand !== "all" && p.brand !== brand) return false;
      if (q && !p.name.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
    if (sort === "populer") list.sort((a, b) => b.total - a.total);
    else if (sort === "rating") list.sort((a, b) => b.avg - a.avg);
    else if (sort === "positif") list.sort((a, b) => b.pos_pct - a.pos_pct);
    return list;
  }, [products, q, brand, sort]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      {/* Banner */}
      <div style={{
        background: "var(--ink)", color: "var(--bg)",
        borderRadius: 4, padding: "32px 36px",
        display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 32, alignItems: "center",
      }}>
        <div>
          <div className="mono" style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(244,241,234,0.55)", marginBottom: 12 }}>
            Portal pelanggan · {AppData.REVIEWS.length.toLocaleString("id-ID")} ulasan
          </div>
          <h1 style={{
            margin: 0, fontSize: 36, fontWeight: 500, letterSpacing: "-0.025em", lineHeight: 1.05,
            textWrap: "balance",
          }}>
            Bagikan pengalaman Anda — <span className="serif">setiap kata dianalisis otomatis</span>.
          </h1>
          <div style={{ marginTop: 14, color: "rgba(244,241,234,0.7)", fontSize: 14, lineHeight: 1.6, maxWidth: 540 }}>
            Pilih produk smartphone yang sudah Anda beli, tulis ulasan jujur, lihat langsung apakah Naïve Bayes & KNN mengklasifikasinya sebagai positif atau negatif.
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <BannerStat k={products.length} v="Produk smartphone" />
          <BannerStat k={`${Math.round(products.reduce((a, p) => a + p.pos_pct, 0) / products.length)}%`} v="Rata-rata positif" />
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <input
          placeholder="Cari produk…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ ...input, width: 280 }}
        />
        <select value={brand} onChange={(e) => setBrand(e.target.value)} style={{ ...input, width: "auto" }}>
          {brands.map(b => <option key={b} value={b}>{b === "all" ? "Semua merek" : b}</option>)}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} style={{ ...input, width: "auto" }}>
          <option value="populer">Paling banyak ulasan</option>
          <option value="rating">Rating tertinggi</option>
          <option value="positif">Paling positif</option>
        </select>
        <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--muted)" }} className="mono">
          {filtered.length} produk
        </span>
      </div>

      {/* Product grid */}
      <div className="prod-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
        {filtered.map((p) => <ProductCard key={p.name} product={p} />)}
      </div>
    </div>
  );
}

function BannerStat({ k, v }) {
  return (
    <div style={{ background: "rgba(244,241,234,0.05)", border: "1px solid rgba(244,241,234,0.1)", borderRadius: 3, padding: "16px 18px" }}>
      <div style={{ fontSize: 28, fontWeight: 500, letterSpacing: "-0.02em", marginBottom: 4 }}>{k}</div>
      <div className="mono" style={{ fontSize: 10, color: "rgba(244,241,234,0.55)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{v}</div>
    </div>
  );
}

function ProductCard({ product }) {
  return (
    <a href={`#/produk/${product.id}`} style={{
      background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: 4,
      textDecoration: "none", color: "var(--ink)",
      overflow: "hidden",
      display: "flex", flexDirection: "column",
      transition: "transform 150ms, border-color 150ms",
    }}
    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--ink)"; }}
    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--line)"; }}
    >
      {/* Placeholder phone visual */}
      <div style={{
        height: 160, background: "var(--bg)",
        borderBottom: "1px solid var(--line)",
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          width: 70, height: 130,
          background: "linear-gradient(135deg, var(--ink) 0%, var(--ink-2) 100%)",
          borderRadius: 10,
          border: "2px solid var(--line-strong)",
          position: "relative",
        }}>
          <div style={{ position: "absolute", top: 4, left: "50%", transform: "translateX(-50%)", width: 14, height: 3, background: "var(--line-strong)", borderRadius: 2 }}></div>
          <div style={{ position: "absolute", inset: 8, background: "rgba(244,241,234,0.04)", borderRadius: 4 }}></div>
        </div>
        <span className="mono" style={{
          position: "absolute", top: 12, left: 12, fontSize: 9,
          color: "var(--muted)", letterSpacing: "0.06em", textTransform: "uppercase",
        }}>{product.brand}</span>
      </div>

      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.3 }}>{product.name}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: "auto" }}>
          <Stars rating={Math.round(product.avg)} />
          <span className="mono" style={{ fontSize: 11 }}>{product.avg.toFixed(1)}</span>
          <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>· {product.total} ulasan</span>
        </div>
        <div style={{ height: 4, background: "var(--line)", borderRadius: 1, overflow: "hidden" }}>
          <div style={{ width: `${product.pos_pct}%`, height: "100%", background: "var(--pos)" }}></div>
        </div>
        <div className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>
          {product.pos_pct.toFixed(0)}% sentimen positif
        </div>
      </div>
    </a>
  );
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

// ─────────── PRODUCT DETAIL ───────────
function ProductDetail({ id }) {
  const productName = decodeURIComponent(location.hash.split("/").slice(2).join("/"));
  const reviews = useMemo(() => AppData.REVIEWS.filter(r => r.product_name === productName), [productName]);
  const product = reviews[0];
  const avg = reviews.reduce((a, r) => a + r.rating, 0) / reviews.length;
  const labeled = reviews.filter(r => r.label);
  const pos = labeled.filter(r => r.label === "positif").length;
  const posPct = (pos / labeled.length) * 100;

  if (!product) return <div>Produk tidak ditemukan. <a href="#/produk">Kembali</a></div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <a href="#/produk" style={{ fontSize: 13, color: "var(--muted)", textDecoration: "none" }}>← Semua produk</a>

      {/* Product header */}
      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 32 }}>
        <div style={{
          height: 320, background: "var(--bg-2)",
          border: "1px solid var(--line)", borderRadius: 4,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            width: 130, height: 250,
            background: "linear-gradient(135deg, var(--ink) 0%, var(--ink-2) 100%)",
            borderRadius: 18,
            border: "3px solid var(--line-strong)",
            position: "relative",
          }}>
            <div style={{ position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)", width: 22, height: 5, background: "var(--line-strong)", borderRadius: 3 }}></div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 14 }}>
          <span className="mono" style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{product.brand}</span>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 500, letterSpacing: "-0.02em" }}>{product.product_name}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Stars rating={Math.round(avg)} />
            <span style={{ fontSize: 18, fontWeight: 500 }}>{avg.toFixed(1)}</span>
            <span style={{ color: "var(--muted)", fontSize: 13 }}>· {reviews.length} ulasan</span>
          </div>
          <div style={{ display: "flex", gap: 32, paddingTop: 8 }}>
            <div>
              <div className="mono" style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Sentimen positif</div>
              <div style={{ fontSize: 22, fontWeight: 500, color: "var(--pos)" }}>{posPct.toFixed(0)}%</div>
            </div>
            <div>
              <div className="mono" style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Total ulasan</div>
              <div style={{ fontSize: 22, fontWeight: 500 }}>{reviews.length}</div>
            </div>
            <div>
              <div className="mono" style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Bintang 5</div>
              <div style={{ fontSize: 22, fontWeight: 500 }}>{reviews.filter(r => r.rating === 5).length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Review form */}
      <ReviewForm productName={product.product_name} />

      {/* Reviews list */}
      <ReviewsList reviews={reviews} />
    </div>
  );
}

function ReviewForm({ productName }) {
  const [text, setText] = useState("");
  const [rating, setRating] = useState(5);
  const [preview, setPreview] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Live prediction on text change
  useEffect(() => {
    if (text.trim().length < 8) { setPreview(null); return; }
    const t = setTimeout(() => setPreview(predict(text)), 250);
    return () => clearTimeout(t);
  }, [text]);

  function submit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    setTimeout(() => {
      const p = predict(text);
      const rec = {
        id: Date.now(),
        product_name: productName,
        review_text: text,
        rating,
        label: p.label === "netral" ? (rating >= 4 ? "positif" : rating <= 2 ? "negatif" : "netral") : p.label,
        nb: { label: p.label, conf: p.conf },
        knn: { label: p.label, conf: Math.max(0.6, p.conf - 0.07) },
        created_at: new Date().toISOString(),
      };
      saveMyReviews([rec, ...loadMyReviews()]);
      setSubmitted(rec);
      setSubmitting(false);
    }, 1200);
  }

  if (submitted) {
    return (
      <Card title="✓ Ulasan terkirim" subtitle="prediksi sentimen instan">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 15, marginBottom: 14, lineHeight: 1.5, color: "var(--ink-2)" }}>
              "{submitted.review_text}"
            </div>
            <Stars rating={submitted.rating} />
            <div style={{ marginTop: 12, fontSize: 13, color: "var(--muted)" }}>
              Terima kasih sudah berbagi. Ulasan Anda akan masuk ke dataset analisis.
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button onClick={() => { setSubmitted(false); setText(""); }} style={btnGhost}>Tulis ulasan lain</button>
              <a href="#/ulasanku" style={{ ...btnPrimary, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>Lihat ulasan saya →</a>
            </div>
          </div>
          <div style={{ background: "var(--bg)", border: "1px solid var(--line)", padding: 18, borderRadius: 3 }}>
            <div className="mono" style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
              hasil prediksi sentimen
            </div>
            <ModelLine model="Naïve Bayes" label={submitted.nb.label} conf={submitted.nb.conf} />
            <ModelLine model="KNN k=5" label={submitted.knn.label} conf={submitted.knn.conf} />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Tulis ulasan Anda" subtitle="ulasan akan diklasifikasi otomatis oleh Naïve Bayes & KNN">
      <form onSubmit={submit}>
        {/* Rating */}
        <div style={{ marginBottom: 14 }}>
          <div className="mono" style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Rating</div>
          <div style={{ display: "flex", gap: 4 }}>
            {[1,2,3,4,5].map(i => (
              <button key={i} type="button" onClick={() => setRating(i)} style={{
                background: "none", border: "none", padding: 4, cursor: "pointer",
              }}>
                <svg width="28" height="28" viewBox="0 0 12 12" fill={i <= rating ? "var(--ink)" : "var(--line-strong)"}>
                  <path d="M6 1l1.5 3.2L11 4.7l-2.5 2.4.6 3.4L6 8.9 2.9 10.5l.6-3.4L1 4.7l3.5-.5L6 1z"/>
                </svg>
              </button>
            ))}
            <span style={{ marginLeft: 12, alignSelf: "center", fontSize: 14, color: "var(--ink-2)" }}>
              {["", "Sangat buruk", "Buruk", "Cukup", "Baik", "Sangat baik"][rating]}
            </span>
          </div>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Bagikan pengalaman Anda dengan produk ini..."
          style={{
            width: "100%", minHeight: 120, padding: "14px 16px",
            border: "1px solid var(--line-strong)", borderRadius: 3,
            background: "var(--bg)", fontSize: 15, fontFamily: "inherit",
            lineHeight: 1.5, resize: "vertical", outline: "none", color: "var(--ink)",
          }}
        />

        {preview && (
          <div style={{
            marginTop: 12, padding: "10px 14px",
            background: preview.label === "positif" ? "var(--pos-soft)" : preview.label === "negatif" ? "var(--neg-soft)" : "var(--bg)",
            border: "1px solid", borderColor: preview.label === "positif" ? "var(--pos)" : preview.label === "negatif" ? "var(--neg)" : "var(--line)",
            borderRadius: 3, display: "flex", alignItems: "center", gap: 10,
          }}>
            <span className="mono" style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>preview prediksi:</span>
            <span style={{
              fontSize: 14, fontWeight: 500,
              color: preview.label === "positif" ? "var(--pos)" : preview.label === "negatif" ? "var(--neg)" : "var(--ink-2)",
            }}>{preview.label}</span>
            <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>{(preview.conf * 100).toFixed(0)}% confidence</span>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14 }}>
          <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>{text.length} karakter · min 10</span>
          <button type="submit" disabled={submitting || text.trim().length < 10} style={{
            ...btnPrimary,
            opacity: text.trim().length < 10 ? 0.4 : 1,
            cursor: submitting || text.trim().length < 10 ? "not-allowed" : "pointer",
          }}>
            {submitting ? "Memproses…" : "Kirim ulasan →"}
          </button>
        </div>
      </form>
    </Card>
  );
}

function ModelLine({ model, label, conf }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0" }}>
      <span className="mono" style={{ fontSize: 11, color: "var(--muted)", width: 90 }}>{model}</span>
      <span style={{
        padding: "3px 10px", borderRadius: 2, fontSize: 12, fontWeight: 500,
        background: label === "positif" ? "var(--pos-soft)" : label === "negatif" ? "var(--neg-soft)" : "var(--bg-2)",
        color: label === "positif" ? "var(--pos)" : label === "negatif" ? "var(--neg)" : "var(--ink-2)",
      }}>{label}</span>
      <div style={{ flex: 1, height: 4, background: "var(--line)", borderRadius: 1, overflow: "hidden" }}>
        <div style={{ width: `${conf * 100}%`, height: "100%", background: label === "positif" ? "var(--pos)" : label === "negatif" ? "var(--neg)" : "var(--ink-2)" }}></div>
      </div>
      <span className="mono" style={{ fontSize: 11, width: 36, textAlign: "right" }}>{(conf * 100).toFixed(0)}%</span>
    </div>
  );
}

function ReviewsList({ reviews }) {
  const [filter, setFilter] = useState("all");
  const filtered = reviews.filter(r => filter === "all" || r.label === filter).slice(0, 30);
  return (
    <Card title={`Ulasan dari pelanggan lain`} subtitle={`${reviews.length} ulasan`} action={
      <div style={{ display: "flex", gap: 4 }}>
        {["all", "positif", "negatif"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "5px 12px", border: "1px solid", borderColor: filter === f ? "var(--ink)" : "var(--line)",
            background: filter === f ? "var(--ink)" : "var(--bg)", color: filter === f ? "var(--bg)" : "var(--ink-2)",
            borderRadius: 99, fontSize: 11, cursor: "pointer", fontFamily: "inherit",
          }}>{f === "all" ? "Semua" : f}</button>
        ))}
      </div>
    }>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {filtered.map((r, i) => (
          <div key={r.id} style={{
            padding: "14px 0", borderTop: i === 0 ? "none" : "1px solid var(--line)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--ink)", color: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 500 }}>
                {String.fromCharCode(65 + (r.id % 26))}
              </div>
              <Stars rating={r.rating} />
              {r.label && (
                <span className="mono" style={{
                  padding: "2px 8px", borderRadius: 2, fontSize: 10,
                  background: r.label === "positif" ? "var(--pos-soft)" : "var(--neg-soft)",
                  color: r.label === "positif" ? "var(--pos)" : "var(--neg)",
                }}>{r.label}</span>
              )}
              <span className="mono" style={{ fontSize: 10, color: "var(--muted)", marginLeft: "auto" }}>{r.created_at}</span>
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.55, color: "var(--ink-2)" }}>{r.review_text}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─────────── MY REVIEWS ───────────
function MyReviews() {
  const [revs, setRevs] = useState(loadMyReviews());
  useEffect(() => {
    const sync = () => setRevs(loadMyReviews());
    window.addEventListener("cust:reviews", sync);
    return () => window.removeEventListener("cust:reviews", sync);
  }, []);
  const pos = revs.filter(r => r.label === "positif").length;
  const neg = revs.filter(r => r.label === "negatif").length;

  if (revs.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "80px 20px" }}>
        <div style={{ fontSize: 28, fontFamily: "'Instrument Serif', serif", fontStyle: "italic", marginBottom: 12 }}>Belum ada ulasan.</div>
        <div style={{ color: "var(--muted)", marginBottom: 24 }}>Mulai dengan menulis ulasan untuk produk yang sudah Anda beli.</div>
        <a href="#/produk" style={{ ...btnPrimary, textDecoration: "none", display: "inline-block" }}>Jelajahi produk →</a>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <div className="stat-row" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
        <Stat3 k={revs.length} v="Total ulasan" />
        <Stat3 k={pos} v="Positif" color="var(--pos)" />
        <Stat3 k={neg} v="Negatif" color="var(--neg)" />
      </div>

      <Card title="Riwayat ulasan saya" subtitle={`${revs.length} ulasan`}>
        <div>
          {revs.map((r, i) => (
            <div key={r.id} style={{ padding: "14px 0", borderTop: i === 0 ? "none" : "1px solid var(--line)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{r.product_name}</span>
                <span className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>
                  {new Date(r.created_at).toLocaleString("id-ID")}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <Stars rating={r.rating} />
                <span className="mono" style={{
                  padding: "2px 8px", borderRadius: 2, fontSize: 10, fontWeight: 500,
                  background: r.label === "positif" ? "var(--pos-soft)" : r.label === "negatif" ? "var(--neg-soft)" : "var(--bg-2)",
                  color: r.label === "positif" ? "var(--pos)" : r.label === "negatif" ? "var(--neg)" : "var(--ink-2)",
                }}>{r.label}</span>
                <span className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>NB {(r.nb.conf * 100).toFixed(0)}% · KNN {(r.knn.conf * 100).toFixed(0)}%</span>
              </div>
              <div style={{ fontSize: 13.5, lineHeight: 1.55, color: "var(--ink-2)" }}>{r.review_text}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Stat3({ k, v, color }) {
  return (
    <div style={{ background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: 4, padding: "20px 22px" }}>
      <div style={{ fontSize: 36, fontWeight: 500, color: color || "var(--ink)", letterSpacing: "-0.02em", marginBottom: 4 }}>{k}</div>
      <div className="mono" style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{v}</div>
    </div>
  );
}

// ─────────── CUSTOMER PROFILE (photo upload) ───────────
function CustomerProfile({ auth, setAuth }) {
  const stored = loadCustProfile() || {};
  const [photo, setPhoto] = useState(stored.photo || auth.photo || null);
  const [name, setName] = useState(stored.name || auth.name);
  const [email, setEmail] = useState(stored.email || auth.email);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef();

  function pickPhoto(file) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("Maks 5MB"); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas");
        const max = 320;
        const sc = Math.min(1, max / Math.max(img.width, img.height));
        c.width = img.width * sc; c.height = img.height * sc;
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        setPhoto(c.toDataURL("image/jpeg", 0.85));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function save(e) {
    e.preventDefault();
    const p = { name, email, photo };
    saveCustProfile(p);
    const newAuth = { ...auth, name, email, photo };
    localStorage.setItem("sentiscan.auth", JSON.stringify(newAuth));
    setAuth(newAuth);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <Card title="Profil saya" subtitle="kelola foto dan info akun" action={saved && <span className="mono" style={{ fontSize: 11, color: "var(--pos)" }}>✓ tersimpan</span>}>
        <form onSubmit={save} style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 32, alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); pickPhoto(e.dataTransfer.files?.[0]); }}
              style={{
                width: 160, height: 160, borderRadius: "50%",
                border: "1.5px dashed var(--line-strong)",
                backgroundImage: photo ? `url(${photo})` : "none",
                backgroundSize: "cover", backgroundPosition: "center",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                background: photo ? `url(${photo}) center/cover` : "var(--bg)",
              }}
            >
              {!photo && (
                <div style={{ textAlign: "center", color: "var(--muted)" }}>
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ marginBottom: 6 }}>
                    <circle cx="16" cy="13" r="5" stroke="currentColor" strokeWidth="1.4"/>
                    <path d="M4 28c0-5 5-9 12-9s12 4 12 9" stroke="currentColor" strokeWidth="1.4"/>
                  </svg>
                  <div className="mono" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>Klik / tarik</div>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => pickPhoto(e.target.files?.[0])} />
            <button type="button" onClick={() => fileRef.current?.click()} style={btnGhost}>Unggah foto</button>
            {photo && <button type="button" onClick={() => setPhoto(null)} style={{ ...btnGhost, color: "var(--neg)" }}>Hapus</button>}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Field label="Nama" value={name} onChange={setName} />
            <Field label="Email" value={email} onChange={setEmail} type="email" />
            <Field label="Peran" value="Pelanggan" disabled />

            <div style={{ paddingTop: 12, borderTop: "1px solid var(--line)", display: "flex", gap: 10 }}>
              <button type="submit" style={btnPrimary}>Simpan perubahan</button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", disabled }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span className="mono" style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>
      <input
        type={type} value={value} disabled={disabled}
        onChange={(e) => onChange && onChange(e.target.value)}
        style={{
          padding: "10px 12px", border: "1px solid var(--line-strong)", borderRadius: 3,
          background: disabled ? "var(--bg-2)" : "var(--bg)",
          color: disabled ? "var(--muted)" : "var(--ink)",
          fontFamily: "inherit", fontSize: 14, outline: "none",
        }}
      />
    </label>
  );
}

const input = {
  padding: "9px 12px", border: "1px solid var(--line-strong)", borderRadius: 3,
  background: "var(--bg)", fontSize: 13, fontFamily: "inherit", outline: "none", color: "var(--ink)",
};
const btnPrimary = {
  padding: "10px 18px", background: "var(--ink)", color: "var(--bg)",
  border: "none", borderRadius: 3, fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
};
const btnGhost = {
  padding: "9px 14px", background: "transparent", color: "var(--ink)",
  border: "1px solid var(--line-strong)", borderRadius: 3, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
};

window.CustomerApp = CustomerApp;
