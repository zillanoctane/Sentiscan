/* global React, ReactDOM, AppShell, PageDashboard, PageDataset, PagePraproses, PagePemodelan, PageHasil, PagePrediksi, PageRiwayat, PageProfil */

// ─────────── Auth gate ───────────
(function authGate() {
  let auth = null;
  try { auth = JSON.parse(localStorage.getItem("sentiscan.auth")); } catch {}
  if (!auth) { window.location.href = "login.html"; return; }
  if (auth.role === "pelanggan") { window.location.href = "customer.html"; return; }
  // sync profile from auth (so sidebar reflects the logged-in user)
  try {
    const existing = JSON.parse(localStorage.getItem("sentiscan.profile")) || {};
    const merged = {
      ...existing,
      name: auth.name || existing.name,
      email: auth.email || existing.email,
      role: auth.role || existing.role || "Analis",
      institution: auth.institution || existing.institution,
      nim: auth.nim || existing.nim,
      photo: auth.photo !== undefined ? auth.photo : existing.photo,
    };
    localStorage.setItem("sentiscan.profile", JSON.stringify(merged));
  } catch {}
})();

function AppRoot() {
  return (
    <AppShell>
      {(route, setRoute) => {
        switch (route) {
          case "dashboard": return <PageDashboard setRoute={setRoute} />;
          case "dataset": return <PageDataset />;
          case "praproses": return <PagePraproses />;
          case "pemodelan": return <PagePemodelan setRoute={setRoute} />;
          case "hasil": return <PageHasil />;
          case "prediksi": return <PagePrediksi />;
          case "riwayat": return <PageRiwayat />;
          case "profil": return <PageProfil />;
          default: return <PageDashboard setRoute={setRoute} />;
        }
      }}
    </AppShell>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<AppRoot />);
