/* global React */
const { useState, useEffect } = React;

// ───────────────────────────── ROUTER ─────────────────────────────
function useHashRoute() {
  const [route, setRoute] = useState(() => (location.hash.replace("#/", "") || "dashboard"));
  useEffect(() => {
    const onChange = () => setRoute(location.hash.replace("#/", "") || "dashboard");
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return [route, (r) => { location.hash = "#/" + r; }];
}
window.useHashRoute = useHashRoute;

// ───────────────────────────── USER PROFILE (localStorage) ─────────────────────────────
const PROFILE_KEY = "sentiscan.profile";
function loadProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return {
    name: "Rizky Pratama",
    email: "rizky.pratama@univ.ac.id",
    role: "Mahasiswa",
    institution: "Universitas Indonesia",
    nim: "1906356121",
    photo: null,
  };
}
function saveProfile(p) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
  window.dispatchEvent(new Event("profile:change"));
}
window.loadProfile = loadProfile;
window.saveProfile = saveProfile;

function useProfile() {
  const [p, setP] = useState(loadProfile());
  useEffect(() => {
    const sync = () => setP(loadProfile());
    window.addEventListener("profile:change", sync);
    return () => window.removeEventListener("profile:change", sync);
  }, []);
  return p;
}
window.useProfile = useProfile;

// ───────────────────────────── NAV ITEMS ─────────────────────────────
const NAV = [
  { group: "Analisis", items: [
    { id: "dashboard", label: "Dashboard", icon: IconGrid },
    { id: "dataset", label: "Dataset", icon: IconDatabase },
    { id: "praproses", label: "Praproses", icon: IconFilter },
    { id: "pemodelan", label: "Pemodelan", icon: IconCpu },
    { id: "hasil", label: "Hasil", icon: IconBars },
  ]},
  { group: "Eksplorasi", items: [
    { id: "prediksi", label: "Prediksi cepat", icon: IconBolt },
    { id: "riwayat", label: "Riwayat", icon: IconClock },
  ]},
  { group: "Akun", items: [
    { id: "profil", label: "Profil", icon: IconUser },
  ]},
];

// ───────────────────────────── ICONS (tiny inline SVG) ─────────────────────────────
function IconGrid({ s = 16 }) { return <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="5" height="5" stroke="currentColor" strokeWidth="1.3"/><rect x="9" y="2" width="5" height="5" stroke="currentColor" strokeWidth="1.3"/><rect x="2" y="9" width="5" height="5" stroke="currentColor" strokeWidth="1.3"/><rect x="9" y="9" width="5" height="5" stroke="currentColor" strokeWidth="1.3"/></svg>; }
function IconDatabase({ s = 16 }) { return <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><ellipse cx="8" cy="3.5" rx="5.5" ry="1.8" stroke="currentColor" strokeWidth="1.3"/><path d="M2.5 3.5v9c0 1 2.5 1.8 5.5 1.8s5.5-.8 5.5-1.8v-9" stroke="currentColor" strokeWidth="1.3"/><path d="M2.5 8c0 1 2.5 1.8 5.5 1.8s5.5-.8 5.5-1.8" stroke="currentColor" strokeWidth="1.3"/></svg>; }
function IconFilter({ s = 16 }) { return <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M2 3h12l-4.5 5.5V14L6.5 12V8.5L2 3z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>; }
function IconCpu({ s = 16 }) { return <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><rect x="4" y="4" width="8" height="8" stroke="currentColor" strokeWidth="1.3"/><rect x="6.5" y="6.5" width="3" height="3" stroke="currentColor" strokeWidth="1.3"/><path d="M2 6h2M2 10h2M12 6h2M12 10h2M6 2v2M10 2v2M6 12v2M10 12v2" stroke="currentColor" strokeWidth="1.3"/></svg>; }
function IconBars({ s = 16 }) { return <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><rect x="2" y="9" width="3" height="5" stroke="currentColor" strokeWidth="1.3"/><rect x="6.5" y="5" width="3" height="9" stroke="currentColor" strokeWidth="1.3"/><rect x="11" y="2" width="3" height="12" stroke="currentColor" strokeWidth="1.3"/></svg>; }
function IconBolt({ s = 16 }) { return <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M9 1L3 9h4l-1 6 6-8H8l1-6z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>; }
function IconClock({ s = 16 }) { return <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3"/><path d="M8 4v4l3 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>; }
function IconUser({ s = 16 }) { return <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M2 14c.6-3 3-4.5 6-4.5s5.4 1.5 6 4.5" stroke="currentColor" strokeWidth="1.3"/></svg>; }
function IconSearch({ s = 14 }) { return <svg width={s} height={s} viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3"/><path d="M9.5 9.5l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>; }
function IconBell({ s = 16 }) { return <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M3 12V8a5 5 0 0 1 10 0v4l1.2 1.2H1.8L3 12z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M6 14a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.3"/></svg>; }
function IconLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="11" r="10" stroke="var(--ink)" strokeWidth="1.4" />
      <path d="M3 11 Q 11 4, 19 11" stroke="var(--pos)" strokeWidth="1.4" fill="none" />
      <path d="M3 11 Q 11 18, 19 11" stroke="var(--neg)" strokeWidth="1.4" fill="none" />
      <circle cx="11" cy="11" r="1.6" fill="var(--ink)" />
    </svg>
  );
}
window.Icons = { IconGrid, IconDatabase, IconFilter, IconCpu, IconBars, IconBolt, IconClock, IconUser, IconSearch, IconBell, IconLogo };

// ───────────────────────────── SIDEBAR ─────────────────────────────
function Sidebar({ route, setRoute, open, onNavigate }) {
  const profile = useProfile();
  return (
    <aside className={"app-sidebar" + (open ? " open" : "")} style={{
      width: 244,
      background: "var(--bg)",
      borderRight: "1px solid var(--line)",
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      position: "sticky",
      top: 0,
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: "20px 22px 18px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid var(--line)" }}>
        <IconLogo />
        <span style={{ fontWeight: 600, letterSpacing: "-0.01em", fontSize: 16 }}>Sentiscan</span>
        <span className="mono" style={{ marginLeft: "auto", fontSize: 9, padding: "2px 6px", border: "1px solid var(--line)", borderRadius: 2, color: "var(--muted)" }}>v1.0</span>
      </div>

      {/* Nav */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 12px" }}>
        {NAV.map((group) => (
          <div key={group.group} style={{ marginBottom: 20 }}>
            <div className="mono" style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", padding: "0 10px 8px" }}>
              {group.group}
            </div>
            {group.items.map((it) => {
              const Icon = it.icon;
              const active = route === it.id;
              return (
                <a
                  key={it.id}
                  href={"#/" + it.id}
                  onClick={() => onNavigate && onNavigate()}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "8px 10px",
                    margin: "1px 0",
                    borderRadius: 4,
                    fontSize: 13.5,
                    color: active ? "var(--ink)" : "var(--ink-2)",
                    background: active ? "var(--bg-2)" : "transparent",
                    textDecoration: "none",
                    fontWeight: active ? 500 : 400,
                    position: "relative",
                  }}
                >
                  {active && <span style={{ position: "absolute", left: -12, top: 6, bottom: 6, width: 2, background: "var(--ink)", borderRadius: 1 }}></span>}
                  <span style={{ color: active ? "var(--ink)" : "var(--muted)", display: "flex" }}><Icon /></span>
                  {it.label}
                </a>
              );
            })}
          </div>
        ))}
      </div>

      {/* Profile preview + logout */}
      <div style={{ borderTop: "1px solid var(--line)", padding: "10px 12px" }}>
        <a href="#/profil" onClick={() => onNavigate && onNavigate()} style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "6px 6px",
          textDecoration: "none",
          color: "var(--ink)",
          borderRadius: 3,
        }}>
          <ProfileAvatar profile={profile} size={32} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{profile.name}</div>
            <div className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>{profile.role}</div>
          </div>
        </a>
        <button onClick={() => { localStorage.removeItem("sentiscan.auth"); window.location.href = "login.html"; }} style={{
          width: "100%", marginTop: 4, padding: "7px 10px",
          background: "transparent", color: "var(--ink-2)",
          border: "1px solid var(--line)", borderRadius: 3,
          fontSize: 12, cursor: "pointer", fontFamily: "inherit",
          display: "flex", alignItems: "center", gap: 8, justifyContent: "center",
        }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M4 2H2v8h2M8 8l3-2-3-2M11 6H5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Keluar
        </button>
      </div>
    </aside>
  );
}

function ProfileAvatar({ profile, size = 36 }) {
  const initials = (profile.name || "U").split(" ").map(s => s[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: "50%",
      background: profile.photo ? "transparent" : "var(--ink)",
      color: "var(--bg)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: 500,
      fontSize: size * 0.36,
      overflow: "hidden",
      flexShrink: 0,
      border: "1px solid var(--line)",
      backgroundImage: profile.photo ? `url(${profile.photo})` : "none",
      backgroundSize: "cover",
      backgroundPosition: "center",
    }}>
      {!profile.photo && initials}
    </div>
  );
}
window.ProfileAvatar = ProfileAvatar;

// ───────────────────────────── TOPBAR ─────────────────────────────
const ROUTE_LABEL = {
  dashboard: "Dashboard",
  dataset: "Dataset",
  praproses: "Praproses",
  pemodelan: "Pemodelan",
  hasil: "Hasil",
  prediksi: "Prediksi cepat",
  riwayat: "Riwayat eksperimen",
  profil: "Profil",
};

function TopBar({ route, onBurger }) {
  const profile = useProfile();
  return (
    <header className="app-topbar" style={{
      minHeight: 60,
      borderBottom: "1px solid var(--line)",
      display: "flex",
      alignItems: "center",
      padding: "0 32px",
      gap: 24,
      background: "var(--bg)",
      position: "sticky",
      top: 0,
      zIndex: 30,
    }}>
      <button
        className="app-burger"
        onClick={onBurger}
        aria-label="Buka menu"
        style={{
          display: "none",
          width: 34, height: 34, borderRadius: 4,
          border: "1px solid var(--line)", background: "var(--bg-2)",
          alignItems: "center", justifyContent: "center",
          color: "var(--ink)", cursor: "pointer", flexShrink: 0,
        }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
      </button>

      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexShrink: 0 }}>
        <span className="mono" style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted)" }}>
          Sentiscan /
        </span>
        <span style={{ fontSize: 15, fontWeight: 500 }}>{ROUTE_LABEL[route] || route}</span>
      </div>

      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16, minWidth: 0 }}>
        <div className="app-search" style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "7px 12px",
          border: "1px solid var(--line)",
          borderRadius: 4,
          background: "var(--bg-2)",
          width: 280,
          maxWidth: "38vw",
          color: "var(--muted)",
        }}>
          <IconSearch />
          <span style={{ fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Cari ulasan, eksperimen, produk…</span>
          <span className="mono" style={{ marginLeft: "auto", fontSize: 10, padding: "1px 5px", border: "1px solid var(--line)", borderRadius: 2, flexShrink: 0 }}>⌘K</span>
        </div>
        <button style={{
          width: 34, height: 34, borderRadius: 4, border: "1px solid var(--line)", background: "var(--bg-2)",
          display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-2)", cursor: "pointer", position: "relative",
        }}>
          <IconBell />
          <span style={{ position: "absolute", top: 7, right: 8, width: 6, height: 6, borderRadius: 3, background: "var(--neg)", border: "1.5px solid var(--bg-2)" }}></span>
        </button>
        <a href="#/profil" style={{ textDecoration: "none" }}>
          <ProfileAvatar profile={profile} size={34} />
        </a>
      </div>
    </header>
  );
}

// ───────────────────────────── APP SHELL ─────────────────────────────
function AppShell({ children }) {
  const [route, setRoute] = useHashRoute();
  const [navOpen, setNavOpen] = useState(false);
  // tutup drawer otomatis ketika layar dilebarkan ke ukuran desktop
  useEffect(() => {
    const onResize = () => { if (window.innerWidth > 900) setNavOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      <Sidebar
        route={route}
        setRoute={setRoute}
        open={navOpen}
        onNavigate={() => setNavOpen(false)}
      />
      <div
        className={"app-scrim" + (navOpen ? " show" : "")}
        onClick={() => setNavOpen(false)}
      />
      <main className="app-main" style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <TopBar route={route} onBurger={() => setNavOpen(v => !v)} />
        <div className="app-pad" style={{ flex: 1, padding: "28px 32px 48px", overflowX: "hidden" }}>
          {children(route, setRoute)}
        </div>
      </main>
    </div>
  );
}

window.AppShell = AppShell;
window.NAV = NAV;
