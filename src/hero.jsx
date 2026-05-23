/* global React, SentimentScanner */
const { useState, useEffect } = React;

function Logo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="10" stroke="var(--ink)" strokeWidth="1.4" />
        <path d="M3 11 Q 11 4, 19 11" stroke="var(--pos)" strokeWidth="1.4" fill="none" />
        <path d="M3 11 Q 11 18, 19 11" stroke="var(--neg)" strokeWidth="1.4" fill="none" />
        <circle cx="11" cy="11" r="1.6" fill="var(--ink)" />
      </svg>
      <span style={{ fontWeight: 600, letterSpacing: "-0.01em", fontSize: 17 }}>
        Sentiscan
      </span>
    </div>
  );
}

function NavBar() {
  return (
    <nav style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "22px 56px",
      borderBottom: "1px solid var(--line)",
      background: "var(--bg)",
      position: "sticky",
      top: 0,
      zIndex: 50,
    }}>
      <Logo />
      <div style={{ display: "flex", gap: 32, fontSize: 14, color: "var(--ink-2)" }}>
        <a href="#produk" style={navLink}>Produk</a>
        <a href="#alur" style={navLink}>Cara kerja</a>
        <a href="#algoritma" style={navLink}>Algoritma</a>
        <a href="#docs" style={navLink}>Dokumentasi</a>
      </div>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <a href="login.html" style={{ ...navLink, fontSize: 14 }}>Masuk</a>
        <a href="register.html" style={{
          fontSize: 14,
          padding: "9px 16px",
          background: "var(--ink)",
          color: "var(--bg)",
          textDecoration: "none",
          borderRadius: 3,
          fontWeight: 500,
        }}>
          Daftar gratis
        </a>
      </div>
    </nav>
  );
}

const navLink = {
  color: "var(--ink-2)",
  textDecoration: "none",
  fontSize: 14,
};

function Hero() {
  return (
    <section style={{
      position: "relative",
      padding: "72px 56px 96px",
      display: "grid",
      gridTemplateColumns: "1.05fr 1fr",
      gap: 72,
      alignItems: "start",
      minHeight: "calc(100vh - 70px)",
      overflow: "hidden",
    }}>
      {/* Background grid */}
      <BackdropGrid />

      {/* LEFT: copy */}
      <div style={{ position: "relative", zIndex: 2, paddingTop: 32 }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          padding: "6px 12px 6px 8px",
          background: "rgba(20,17,13,0.04)",
          border: "1px solid var(--line)",
          borderRadius: 999,
          marginBottom: 28,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: "50%", background: "var(--pos)",
          }}></span>
          <span className="mono" style={{ fontSize: 11, letterSpacing: "0.06em", color: "var(--ink-2)" }}>
            v1.0 · Naïve Bayes + KNN
          </span>
        </div>

        <h1 style={{
          fontFamily: "'Geist', sans-serif",
          fontSize: "clamp(48px, 5.6vw, 84px)",
          lineHeight: 0.98,
          letterSpacing: "-0.035em",
          fontWeight: 500,
          margin: 0,
          marginBottom: 28,
          color: "var(--ink)",
          textWrap: "balance",
        }}>
          Baca jutaan<br />
          ulasan,<br />
          dapatkan{" "}
          <span style={{
            fontFamily: "'Instrument Serif', serif",
            fontStyle: "italic",
            fontWeight: 400,
            color: "var(--ink)",
            position: "relative",
            paddingRight: 4,
          }}>
            satu kesimpulan
            <svg
              viewBox="0 0 320 14"
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: "-6px",
                width: "100%",
                height: 14,
                overflow: "visible",
              }}
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path d="M2 8 Q 80 2, 160 7 T 318 6" stroke="var(--pos)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            </svg>
          </span>.
        </h1>

        <p style={{
          fontSize: 19,
          lineHeight: 1.55,
          color: "var(--ink-2)",
          maxWidth: 520,
          margin: 0,
          marginBottom: 36,
          textWrap: "pretty",
        }}>
          Sentiscan menganalisis ulasan smartphone di Tokopedia, mengklasifikasikan tiap kalimat ke <span style={{ color: "var(--pos)", fontWeight: 500 }}>positif</span> atau <span style={{ color: "var(--neg)", fontWeight: 500 }}>negatif</span>, lalu membandingkan kinerja Naïve Bayes vs KNN — untuk calon pembeli, penjual, dan peneliti.
        </p>

        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 48 }}>
          <a href="register.html" style={{
            fontSize: 15,
            padding: "14px 22px",
            background: "var(--ink)",
            color: "var(--bg)",
            textDecoration: "none",
            borderRadius: 3,
            fontWeight: 500,
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
          }}>
            Mulai analisis
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
          <a href="#contoh" style={{
            fontSize: 15,
            padding: "14px 20px",
            background: "transparent",
            color: "var(--ink)",
            textDecoration: "none",
            borderRadius: 3,
            fontWeight: 500,
            border: "1px solid var(--line-strong)",
          }}>
            Lihat contoh
          </a>
        </div>

        {/* Stat strip */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 0,
          maxWidth: 540,
          borderTop: "1px solid var(--line)",
          paddingTop: 24,
        }}>
          {[
            { k: "92.4%", v: "Akurasi rata-rata Naïve Bayes pada data uji" },
            { k: "6 tahap", v: "Praproses: cleaning, stemming, stopword (Sastrawi)" },
            { k: "CSV / URL", v: "Input dari scraping atau unggahan langsung" },
          ].map((s, i) => (
            <div key={i} style={{
              paddingRight: 18,
              borderRight: i < 2 ? "1px solid var(--line)" : "none",
              paddingLeft: i > 0 ? 18 : 0,
            }}>
              <div style={{
                fontSize: 24,
                fontWeight: 500,
                letterSpacing: "-0.02em",
                marginBottom: 4,
                color: "var(--ink)",
              }}>
                {s.k}
              </div>
              <div style={{
                fontSize: 12,
                lineHeight: 1.4,
                color: "var(--muted)",
              }}>
                {s.v}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT: animation */}
      <div style={{
        position: "relative",
        zIndex: 2,
        minHeight: 580,
        display: "flex",
        flexDirection: "column",
      }}>
        <SentimentScanner />
      </div>

      {/* Bottom ticker */}
      <div style={{
        position: "absolute",
        left: 0, right: 0, bottom: 0,
        borderTop: "1px solid var(--line)",
        background: "var(--bg)",
        padding: "14px 56px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        zIndex: 3,
      }}>
        <span className="mono" style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted)" }}>
          dipakai oleh peneliti & UMKM
        </span>
        <div style={{ display: "flex", gap: 36, color: "var(--muted)", fontSize: 13, alignItems: "center" }}>
          <span style={brandPlaceholder}>Univ. Indonesia</span>
          <span style={brandPlaceholder}>Telkom DDS</span>
          <span style={brandPlaceholder}>Bukalapak Lab</span>
          <span style={brandPlaceholder}>Kominfo Riset</span>
          <span style={brandPlaceholder}>Tokopedia Care</span>
        </div>
      </div>
    </section>
  );
}

const brandPlaceholder = {
  fontFamily: "'Instrument Serif', serif",
  fontSize: 17,
  fontStyle: "italic",
  color: "var(--ink-2)",
  opacity: 0.65,
};

function BackdropGrid() {
  return (
    <div aria-hidden="true" style={{
      position: "absolute",
      inset: 0,
      pointerEvents: "none",
      backgroundImage: `
        linear-gradient(to right, rgba(20,17,13,0.04) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(20,17,13,0.04) 1px, transparent 1px)
      `,
      backgroundSize: "56px 56px",
      maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.6), rgba(0,0,0,0.15) 70%, transparent)",
      WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0.6), rgba(0,0,0,0.15) 70%, transparent)",
    }}></div>
  );
}

window.Hero = Hero;
window.NavBar = NavBar;
