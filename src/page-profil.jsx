/* global React, Card, useProfile, saveProfile, ProfileAvatar */
const { useState, useRef } = React;

function PageProfil() {
  const profile = useProfile();
  const [form, setForm] = useState({
    name: profile.name,
    email: profile.email,
    role: profile.role,
    institution: profile.institution,
    nim: profile.nim,
    photo: profile.photo,
  });
  const [saved, setSaved] = useState(false);
  const fileRef = useRef();

  function pickPhoto(file) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("Foto maksimal 5MB"); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      // resize via canvas to keep storage small
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas");
        const max = 320;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        c.width = img.width * scale;
        c.height = img.height * scale;
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        const dataUrl = c.toDataURL("image/jpeg", 0.85);
        setForm((f) => ({ ...f, photo: dataUrl }));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function removePhoto() {
    setForm((f) => ({ ...f, photo: null }));
  }

  function save(e) {
    e.preventDefault();
    saveProfile(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 22, alignItems: "start" }}>
      {/* Photo card */}
      <Card title="Foto profil" subtitle="JPG / PNG · maks 5MB">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <div
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "var(--ink)"; }}
            onDragLeave={(e) => e.currentTarget.style.borderColor = "var(--line)"}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.style.borderColor = "var(--line)";
              const f = e.dataTransfer.files?.[0];
              if (f) pickPhoto(f);
            }}
            onClick={() => fileRef.current?.click()}
            style={{
              width: 180,
              height: 180,
              borderRadius: "50%",
              border: "1.5px dashed var(--line-strong)",
              background: form.photo ? "transparent" : "var(--bg)",
              backgroundImage: form.photo ? `url(${form.photo})` : "none",
              backgroundSize: "cover",
              backgroundPosition: "center",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              position: "relative",
              transition: "border-color 150ms",
              overflow: "hidden",
            }}
          >
            {!form.photo && (
              <div style={{ textAlign: "center", padding: 20 }}>
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ marginBottom: 6, color: "var(--muted)" }}>
                  <rect x="4" y="8" width="24" height="20" stroke="currentColor" strokeWidth="1.4"/>
                  <circle cx="16" cy="18" r="5" stroke="currentColor" strokeWidth="1.4"/>
                  <path d="M11 8l2-3h6l2 3" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
                </svg>
                <div className="mono" style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  Tarik / klik
                </div>
              </div>
            )}
            {form.photo && (
              <div style={{
                position: "absolute",
                inset: 0,
                background: "rgba(20,17,13,0.0)",
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
                paddingBottom: 18,
                opacity: 0,
                transition: "all 200ms",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(20,17,13,0.4)"; e.currentTarget.style.opacity = 1; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(20,17,13,0)"; e.currentTarget.style.opacity = 0; }}
              >
                <span className="mono" style={{
                  color: "var(--bg)",
                  fontSize: 11,
                  padding: "4px 10px",
                  background: "rgba(0,0,0,0.5)",
                  borderRadius: 99,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}>Ganti foto</span>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => pickPhoto(e.target.files?.[0])} />

          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={() => fileRef.current?.click()} style={btnGhost}>Unggah foto</button>
            {form.photo && <button type="button" onClick={removePhoto} style={btnGhost}>Hapus</button>}
          </div>

          <div style={{
            width: "100%",
            padding: 14,
            background: "var(--bg)",
            border: "1px solid var(--line)",
            borderRadius: 3,
            textAlign: "center",
          }}>
            <div style={{ marginBottom: 10, display: "flex", justifyContent: "center" }}>
              <ProfileAvatar profile={form} size={48} />
            </div>
            <div className="mono" style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              preview di sidebar
            </div>
          </div>
        </div>
      </Card>

      {/* Form */}
      <form onSubmit={save}>
        <Card title="Informasi pengguna" subtitle="data ditampilkan pada laporan ekspor" action={
          saved && <span className="mono" style={{ fontSize: 11, color: "var(--pos)" }}>✓ tersimpan</span>
        }>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            <Field label="Nama lengkap" value={form.name} onChange={(v) => setForm({...form, name: v})} />
            <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({...form, email: v})} />
            <Field label="Peran" value={form.role} onChange={(v) => setForm({...form, role: v})} />
            <Field label="NIM / NIP" value={form.nim} onChange={(v) => setForm({...form, nim: v})} />
            <div style={{ gridColumn: "span 2" }}>
              <Field label="Institusi" value={form.institution} onChange={(v) => setForm({...form, institution: v})} />
            </div>
          </div>

          <div style={{ marginTop: 22, paddingTop: 18, borderTop: "1px solid var(--line)", display: "flex", gap: 10 }}>
            <button type="submit" style={btnPrimary}>Simpan perubahan</button>
            <button type="button" onClick={() => setForm({
              name: profile.name, email: profile.email, role: profile.role,
              institution: profile.institution, nim: profile.nim, photo: profile.photo,
            })} style={btnGhost}>Reset</button>
          </div>
        </Card>

        <div style={{ height: 22 }}></div>

        <Card title="Preferensi aplikasi" subtitle="opsional">
          <PreferenceRow label="Bahasa antarmuka" v="Bahasa Indonesia" />
          <PreferenceRow label="Notifikasi email" v="Saat eksperimen selesai" />
          <PreferenceRow label="Default test_size" v="0.20" />
          <PreferenceRow label="Default KNN k" v="5" />
          <PreferenceRow label="Auto-export PDF" v="Aktif" />
        </Card>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <span className="mono" style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          fontSize: 14,
          padding: "10px 12px",
          border: "1px solid var(--line-strong)",
          borderRadius: 3,
          background: "var(--bg)",
          color: "var(--ink)",
          fontFamily: "inherit",
          outline: "none",
        }}
      />
    </label>
  );
}

function PreferenceRow({ label, v }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px dotted var(--line)" }}>
      <span style={{ fontSize: 13 }}>{label}</span>
      <span className="mono" style={{ fontSize: 12, color: "var(--ink-2)" }}>{v}</span>
    </div>
  );
}

const btnPrimary = { fontSize: 13, padding: "10px 18px", background: "var(--ink)", color: "var(--bg)", border: "none", borderRadius: 3, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" };
const btnGhost = { fontSize: 12, padding: "8px 14px", background: "transparent", color: "var(--ink)", border: "1px solid var(--line-strong)", borderRadius: 3, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" };

window.PageProfil = PageProfil;
