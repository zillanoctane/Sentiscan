/* global React, ReactDOM, NavBar, Hero, TweaksPanel, TweakSection, TweakColor, TweakRadio, useTweaks */
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "palette": ["#2a7a52", "#b53a2a"],
  "background": "#f4f1ea",
  "headlineStyle": "balanced"
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // Live-apply palette as CSS vars
  React.useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--pos", t.palette[0]);
    root.style.setProperty("--neg", t.palette[1]);
    root.style.setProperty("--bg", t.background);
    // derive soft tints
    root.style.setProperty("--pos-soft", hexToSoft(t.palette[0]));
    root.style.setProperty("--neg-soft", hexToSoft(t.palette[1]));
  }, [t.palette, t.background]);

  return (
    <React.Fragment>
      <NavBar />
      <Hero />

      <TweaksPanel title="Tweaks">
        <TweakSection title="Sentiment palette">
          <TweakColor
            label="Pos / Neg"
            value={t.palette}
            onChange={(v) => setTweak("palette", v)}
            options={[
              ["#2a7a52", "#b53a2a"],
              ["#1d5fc2", "#d96a1f"],
              ["#2f6cab", "#a83258"],
              ["#3b6d3b", "#7a2e2e"],
              ["#0f7374", "#c1413a"],
            ]}
          />
        </TweakSection>
        <TweakSection title="Background">
          <TweakColor
            label="Canvas"
            value={t.background}
            onChange={(v) => setTweak("background", v)}
            options={["#f4f1ea", "#f6f5f1", "#eeece4", "#fbf9f4", "#13110d"]}
          />
        </TweakSection>
      </TweaksPanel>
    </React.Fragment>
  );
}

function hexToSoft(hex) {
  // crude 18% tint over warm white
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  const mix = (v) => Math.round(v * 0.18 + 244 * 0.82);
  return `rgb(${mix(r)},${mix(g)},${mix(b)})`;
}

// Detect dark backgrounds and flip ink colors
function applyContrast() {
  const root = document.documentElement;
  const bg = getComputedStyle(root).getPropertyValue("--bg").trim();
  const c = bg.startsWith("#") ? bg.slice(1) : "";
  if (c.length === 6) {
    const r = parseInt(c.slice(0, 2), 16);
    const g = parseInt(c.slice(2, 4), 16);
    const b = parseInt(c.slice(4, 6), 16);
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    if (lum < 0.4) {
      root.style.setProperty("--ink", "#f4f1ea");
      root.style.setProperty("--ink-2", "#c8c2b3");
      root.style.setProperty("--muted", "#7a7466");
      root.style.setProperty("--line", "#2a2620");
      root.style.setProperty("--line-strong", "#3a3530");
      root.style.setProperty("--bg-2", "#1c1915");
    } else {
      root.style.setProperty("--ink", "#14110d");
      root.style.setProperty("--ink-2", "#3a342b");
      root.style.setProperty("--muted", "#847c6f");
      root.style.setProperty("--line", "#d9d2c3");
      root.style.setProperty("--line-strong", "#c4bba8");
      root.style.setProperty("--bg-2", "#ece8df");
    }
  }
}
// re-run on mutations
const obs = new MutationObserver(applyContrast);
obs.observe(document.documentElement, { attributes: true, attributeFilter: ["style"] });
applyContrast();

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
