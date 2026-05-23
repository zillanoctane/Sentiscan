/* global React, ReactDOM */
const { useState, useEffect } = React;

// ─────────── Konfigurasi backend ───────────
// URL backend FastAPI. Ubah port di sini jika backend dijalankan di port lain.
const API_BASE = "http://localhost:8001";

// Helper: panggil API JSON, kembalikan { ok, data, error }
async function apiPost(path, body) {
  try {
    const res = await fetch(API_BASE + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    let data = null;
    try { data = await res.json(); } catch {}
    if (!res.ok) {
      const msg = (data && (data.detail || data.message)) || "Terjadi kesalahan pada server.";
      return { ok: false, error: typeof msg === "string" ? msg : "Permintaan gagal." };
    }
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: "Tidak bisa terhubung ke server. Pastikan backend berjalan di " + API_BASE + "." };
  }
}

// ─────────── Auth helpers ───────────
const AUTH_KEY = "sentiscan.auth";
const USERS_KEY = "sentiscan.users";

function getUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; }
  catch { return []; }
}

// One-time cleanup: hapus akun demo bawaan yang tersimpan dari versi sebelumnya
(function cleanupDemoAccounts() {
  try {
    const stored = JSON.parse(localStorage.getItem(USERS_KEY)) || [];
    const cleaned = stored.filter(
      (u) => u.email !== "demo@analis.com" && u.email !== "demo@pelanggan.com"
    );
    if (cleaned.length !== stored.length) {
      localStorage.setItem(USERS_KEY, JSON.stringify(cleaned));
    }
    // Juga keluarkan user kalau dia sedang login pakai akun demo
    const auth = JSON.parse(localStorage.getItem(AUTH_KEY));
    if (auth && (auth.email === "demo@analis.com" || auth.email === "demo@pelanggan.com")) {
      localStorage.removeItem(AUTH_KEY);
    }
  } catch {}
})();
function saveUsers(u) { localStorage.setItem(USERS_KEY, JSON.stringify(u)); }
function setAuth(u) { localStorage.setItem(AUTH_KEY, JSON.stringify(u)); }
function getAuth() { try { return JSON.parse(localStorage.getItem(AUTH_KEY)); } catch { return null; } }
function clearAuth() { localStorage.removeItem(AUTH_KEY); }

window.Auth = { getUsers, saveUsers, setAuth, getAuth, clearAuth };

// ─────────── Shared layout ───────────
function AuthLayout({ children, title, sub }) {
  return (
    <div className="auth-grid" style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1.05fr", background: "var(--bg)" }}>
      {/* LEFT — Form */}
      <div className="auth-form" style={{ display: "flex", flexDirection: "column", padding: "32px 56px", justifyContent: "space-between", maxWidth: 620 }}>
        <a href="index.html" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "var(--ink)" }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <circle cx="11" cy="11" r="10" stroke="var(--ink)" strokeWidth="1.4" />
            <path d="M3 11 Q 11 4, 19 11" stroke="var(--pos)" strokeWidth="1.4" fill="none" />
            <path d="M3 11 Q 11 18, 19 11" stroke="var(--neg)" strokeWidth="1.4" fill="none" />
            <circle cx="11" cy="11" r="1.6" fill="var(--ink)" />
          </svg>
          <span style={{ fontWeight: 600, letterSpacing: "-0.01em", fontSize: 17 }}>Sentiscan</span>
        </a>

        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1, paddingTop: 60 }}>
          <div className="mono" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 14 }}>
            {sub}
          </div>
          <h1 style={{
            fontSize: 44,
            fontWeight: 500,
            letterSpacing: "-0.025em",
            lineHeight: 1.05,
            margin: 0,
            marginBottom: 36,
            textWrap: "balance",
          }}>{title}</h1>
          {children}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--muted)" }}>
          <span className="mono">© 2026 Sentiscan</span>
          <div style={{ display: "flex", gap: 16 }}>
            <a href="#" style={{ color: "var(--muted)", textDecoration: "none" }}>Privacy</a>
            <a href="#" style={{ color: "var(--muted)", textDecoration: "none" }}>Bantuan</a>
          </div>
        </div>
      </div>

      {/* RIGHT — Visual */}
      <div className="auth-visual" style={{
        background: "var(--ink)",
        color: "var(--bg)",
        padding: "56px 56px 56px",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}>
        <BrandVisual />
      </div>
    </div>
  );
}

function BrandVisual() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 1800);
    return () => clearInterval(i);
  }, []);
  const samples = [
    { t: "Mantap, pengiriman cepat dan barang original!", l: "positif", c: 96 },
    { t: "Kecewa, baterai cepat habis dan layar bergaris.", l: "negatif", c: 91 },
    { t: "Harga bersaing, packing rapi. Recommended seller!", l: "positif", c: 97 },
    { t: "Lama banget pengirimannya, barang sampai rusak.", l: "negatif", c: 94 },
  ];
  const items = [];
  for (let i = 0; i < 4; i++) items.push(samples[(tick + i) % samples.length]);

  return (
    <>
      <div className="mono" style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(244,241,234,0.55)" }}>
        sentiscan / live classifier · v1.0
      </div>

      <div style={{ position: "relative" }}>
        <div style={{ marginBottom: 30 }}>
          <div style={{
            fontFamily: "'Instrument Serif', serif",
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: 60,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            color: "var(--bg)",
            maxWidth: 480,
            textWrap: "balance",
          }}>
            Satu kesimpulan dari jutaan ulasan.
          </div>
        </div>

        {/* Sample chips */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 460 }}>
          {items.map((s, i) => (
            <div key={tick + "-" + i} style={{
              background: "rgba(244,241,234,0.06)",
              border: "1px solid rgba(244,241,234,0.12)",
              borderRadius: 3,
              padding: "12px 14px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              opacity: 1 - i * 0.18,
              animation: i === 0 ? "slideIn 600ms ease" : "none",
            }}>
              <div style={{ flex: 1, fontSize: 13, color: "rgba(244,241,234,0.92)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {s.t}
              </div>
              <span className="mono" style={{
                fontSize: 10,
                padding: "3px 8px",
                borderRadius: 2,
                background: s.l === "positif" ? "rgba(42,122,82,0.35)" : "rgba(181,58,42,0.35)",
                color: s.l === "positif" ? "#a4d8b8" : "#f3b8a8",
                fontWeight: 500,
              }}>{s.l} · {s.c}%</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0, paddingTop: 24, borderTop: "1px solid rgba(244,241,234,0.12)" }}>
        <Stat k="1.247" v="Ulasan dianalisis" />
        <Stat k="92.4%" v="Akurasi NB" />
        <Stat k="2" v="Algoritma dibandingkan" />
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </>
  );
}

function Stat({ k, v }) {
  return (
    <div>
      <div style={{ fontSize: 24, fontWeight: 500, letterSpacing: "-0.02em", marginBottom: 4 }}>{k}</div>
      <div className="mono" style={{ fontSize: 10, color: "rgba(244,241,234,0.55)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{v}</div>
    </div>
  );
}

// ─────────── LOGIN ───────────
function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Lengkapi email dan password."); return; }
    setLoading(true);

    const { ok, data, error } = await apiPost("/api/auth/login", { email, password });
    if (!ok) {
      setError(error);
      setLoading(false);
      return;
    }
    // Simpan token + info user ke localStorage agar dipakai halaman lain
    setAuth({
      token: data.access_token,
      email: data.email,
      name: data.name,
      role: data.role,
    });
    window.location.href = data.role === "pelanggan" ? "customer.html" : "app.html";
  }

  return (
    <AuthLayout title={<>Masuk ke <span className="serif">akun Anda</span>.</>} sub="Sentiscan / login">
      <form onSubmit={submit} style={{ maxWidth: 420 }}>
        <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="nama@email.com" />
        <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" />

        {error && (
          <div style={{ padding: "10px 12px", background: "var(--neg-soft)", color: "var(--neg)", borderRadius: 3, fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, fontSize: 13 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", color: "var(--ink-2)" }}>
            <input type="checkbox" style={{ accentColor: "var(--ink)" }} />
            Ingat saya
          </label>
          <a href="#" style={{ color: "var(--ink-2)", textDecoration: "underline", textUnderlineOffset: 3 }}>Lupa password?</a>
        </div>

        <button type="submit" disabled={loading} style={btnPrimary}>
          {loading ? "Memverifikasi…" : "Masuk →"}
        </button>

        <div style={{ marginTop: 28, fontSize: 13, color: "var(--ink-2)" }}>
          Belum punya akun? <a href="register.html" style={{ color: "var(--ink)", fontWeight: 500, textUnderlineOffset: 3 }}>Daftar di sini</a>
        </div>
      </form>
    </AuthLayout>
  );
}

// ─────────── REGISTER ───────────
function RegisterForm() {
  const [form, setForm] = useState({
    name: "", email: "", password: "", confirm: "",
    role: "pelanggan", institution: "", nim: "",
    agree: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const upd = (k) => (v) => setForm({ ...form, [k]: v });

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!form.name || !form.email || !form.password) { setError("Lengkapi semua field wajib."); return; }
    if (form.password.length < 6) { setError("Password minimal 6 karakter."); return; }
    if (form.password !== form.confirm) { setError("Konfirmasi password tidak cocok."); return; }
    if (!form.agree) { setError("Centang persetujuan ketentuan layanan."); return; }

    setLoading(true);

    // 1. Daftarkan akun ke database lewat backend
    const reg = await apiPost("/api/auth/register", {
      email: form.email,
      password: form.password,
      name: form.name,
      role: form.role,
      institution: form.role === "analis" ? (form.institution || null) : null,
      nim: form.role === "analis" ? (form.nim || null) : null,
    });
    if (!reg.ok) {
      setError(reg.error);
      setLoading(false);
      return;
    }

    // 2. Langsung login agar dapat token
    const login = await apiPost("/api/auth/login", {
      email: form.email,
      password: form.password,
    });
    if (!login.ok) {
      // akun sudah dibuat, tapi login gagal — arahkan ke halaman login
      setError("Akun berhasil dibuat. Silakan masuk.");
      setLoading(false);
      setTimeout(() => { window.location.href = "login.html"; }, 1200);
      return;
    }

    setAuth({
      token: login.data.access_token,
      email: login.data.email,
      name: login.data.name,
      role: login.data.role,
    });
    window.location.href = login.data.role === "pelanggan" ? "customer.html" : "app.html";
  }

  return (
    <AuthLayout title={<>Buat akun <span className="serif">Sentiscan</span>.</>} sub="Sentiscan / daftar">
      <form onSubmit={submit} style={{ maxWidth: 460 }}>
        {/* Role picker */}
        <div className="mono" style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
          saya seorang…
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 22 }}>
          <RolePick
            active={form.role === "pelanggan"}
            onClick={() => upd("role")("pelanggan")}
            title="Pelanggan"
            desc="Tulis ulasan produk smartphone, lihat insight."
          />
          <RolePick
            active={form.role === "analis"}
            onClick={() => upd("role")("analis")}
            title="Analis / Peneliti"
            desc="Akses penuh: dataset, training NB & KNN, hasil."
          />
        </div>

        <Field label="Nama lengkap" value={form.name} onChange={upd("name")} placeholder="cth. Budi Santoso" />
        <Field label="Email" type="email" value={form.email} onChange={upd("email")} placeholder="nama@email.com" />

        {form.role === "analis" && (
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 12 }}>
            <Field label="Institusi" value={form.institution} onChange={upd("institution")} placeholder="cth. Universitas Indonesia" />
            <Field label="NIM / NIP" value={form.nim} onChange={upd("nim")} placeholder="cth. 1906356121" />
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Password" type="password" value={form.password} onChange={upd("password")} placeholder="min. 6 karakter" />
          <Field label="Konfirmasi password" type="password" value={form.confirm} onChange={upd("confirm")} placeholder="ulangi" />
        </div>

        {error && (
          <div style={{ padding: "10px 12px", background: "var(--neg-soft)", color: "var(--neg)", borderRadius: 3, fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}

        <label style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 22, fontSize: 13, color: "var(--ink-2)", cursor: "pointer" }}>
          <input type="checkbox" checked={form.agree} onChange={(e) => upd("agree")(e.target.checked)} style={{ accentColor: "var(--ink)", marginTop: 3 }} />
          <span>Saya menyetujui <a href="#" style={{ color: "var(--ink)" }}>Ketentuan Layanan</a> dan <a href="#" style={{ color: "var(--ink)" }}>Kebijakan Privasi</a>.</span>
        </label>

        <button type="submit" disabled={loading} style={btnPrimary}>
          {loading ? "Membuat akun…" : "Daftar →"}
        </button>

        <div style={{ marginTop: 22, fontSize: 13, color: "var(--ink-2)" }}>
          Sudah punya akun? <a href="login.html" style={{ color: "var(--ink)", fontWeight: 500 }}>Masuk</a>
        </div>
      </form>
    </AuthLayout>
  );
}

function RolePick({ active, onClick, title, desc }) {
  return (
    <button type="button" onClick={onClick} style={{
      padding: "14px 14px",
      background: active ? "var(--bg-2)" : "var(--bg)",
      border: "1.5px solid",
      borderColor: active ? "var(--ink)" : "var(--line)",
      borderRadius: 3,
      cursor: "pointer",
      textAlign: "left",
      fontFamily: "inherit",
      position: "relative",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        <span style={{
          width: 12, height: 12, borderRadius: "50%",
          border: "1.5px solid",
          borderColor: active ? "var(--ink)" : "var(--line-strong)",
          background: active ? "var(--ink)" : "var(--bg)",
          boxShadow: active ? "inset 0 0 0 2.5px var(--bg)" : "none",
        }}></span>
        <span style={{ fontSize: 14, fontWeight: 500 }}>{title}</span>
      </div>
      <div style={{ fontSize: 11.5, color: "var(--muted)", lineHeight: 1.45 }}>{desc}</div>
    </button>
  );
}

function Field({ label, type = "text", value, onChange, placeholder }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div className="mono" style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
        {label}
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "12px 14px",
          border: "1px solid var(--line-strong)",
          borderRadius: 3,
          background: "var(--bg)",
          color: "var(--ink)",
          fontFamily: "inherit",
          fontSize: 14,
          outline: "none",
        }}
        onFocus={(e) => e.target.style.borderColor = "var(--ink)"}
        onBlur={(e) => e.target.style.borderColor = "var(--line-strong)"}
      />
    </div>
  );
}

const btnPrimary = {
  width: "100%",
  padding: "13px 18px",
  background: "var(--ink)",
  color: "var(--bg)",
  border: "none",
  borderRadius: 3,
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
  fontFamily: "inherit",
};
const btnGhost = {
  padding: "10px 14px",
  background: "var(--bg-2)",
  color: "var(--ink)",
  border: "1px solid var(--line-strong)",
  borderRadius: 3,
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
  fontFamily: "inherit",
};

window.LoginForm = LoginForm;
window.RegisterForm = RegisterForm;
