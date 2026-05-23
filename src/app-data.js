// app-data.js — Generates ~1200 realistic Indonesian smartphone reviews
// Deterministic via seeded LCG so the dashboard is stable across reloads.

(function () {
  function rng(seed) {
    let s = seed >>> 0;
    return () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 0xffffffff;
    };
  }
  const r = rng(20260523);
  const pick = (arr) => arr[Math.floor(r() * arr.length)];
  const pickN = (arr, n) => {
    const c = [...arr];
    const out = [];
    for (let i = 0; i < n && c.length; i++) out.push(c.splice(Math.floor(r() * c.length), 1)[0]);
    return out;
  };

  const PRODUCTS = [
    { name: "iPhone 15 Pro Max 256GB", brand: "Apple", price: 21999000 },
    { name: "iPhone 14 128GB", brand: "Apple", price: 13499000 },
    { name: "Samsung Galaxy S24 Ultra", brand: "Samsung", price: 19999000 },
    { name: "Samsung Galaxy A55 5G 8/256", brand: "Samsung", price: 6299000 },
    { name: "Xiaomi Redmi Note 13 Pro", brand: "Xiaomi", price: 4499000 },
    { name: "Xiaomi 14 12/512", brand: "Xiaomi", price: 12999000 },
    { name: "POCO X6 Pro 5G", brand: "POCO", price: 4799000 },
    { name: "Realme 12 Pro+", brand: "Realme", price: 5999000 },
    { name: "OPPO Reno 11 5G", brand: "OPPO", price: 5499000 },
    { name: "OPPO A78 8/256", brand: "OPPO", price: 3299000 },
    { name: "Vivo V30 Pro 5G", brand: "Vivo", price: 6999000 },
    { name: "Vivo Y28 8/256", brand: "Vivo", price: 2799000 },
    { name: "Infinix Note 40 Pro", brand: "Infinix", price: 3399000 },
    { name: "Tecno Camon 30 Pro", brand: "Tecno", price: 3899000 },
    { name: "Nothing Phone (2a)", brand: "Nothing", price: 5499000 },
  ];

  // Positive snippets, varied
  const POS_OPENERS = [
    "Mantap, ", "Bagus banget, ", "Top markotop, ", "Sangat memuaskan, ", "Cocok, ",
    "Recommended, ", "Sesuai ekspektasi, ", "Worth it, ", "Lengkap, ", "",
  ];
  const POS_BODY = [
    "barang original sesuai deskripsi",
    "pengiriman cepat sekali",
    "kemasan rapi dan aman",
    "respon penjual ramah dan cepat",
    "kamera jernih hasil tajam",
    "baterai awet seharian dipakai",
    "performa lancar buat gaming",
    "layar terang warna mantap",
    "sinyal stabil tidak ada drop",
    "harga bersaing kualitas oke",
    "fast charging beneran cepat",
    "build quality terasa premium",
    "garansi resmi lengkap segel",
    "fitur AI berguna sekali",
    "speaker stereo enak didengar",
  ];
  const POS_CLOSERS = [
    ". Recommended seller!",
    ". Thanks min, sukses terus!",
    ". Pasti order lagi.",
    ". Lima bintang!",
    ". Top deh.",
    "!",
    ".",
    ". Mantap pokoknya.",
    ". Puas banget.",
    "",
  ];

  const NEG_OPENERS = [
    "Kecewa, ", "Mengecewakan, ", "Tidak sesuai, ", "Sayang sekali, ", "Parah, ",
    "Buruk, ", "Hati-hati, ", "Jelek, ", "",
  ];
  const NEG_BODY = [
    "baterai cepat habis bocor",
    "layar bergaris di pojok",
    "pengiriman lama sampai dua minggu",
    "barang sampai dalam keadaan rusak",
    "ternyata bukan original alias rekondisi",
    "panas berlebihan saat dipakai",
    "sering hang dan restart sendiri",
    "kamera blur hasilnya pecah",
    "sinyal lemot susah dapat 4G",
    "seller tidak responsif susah dihubungi",
    "kemasan rusak parah",
    "segel sudah terbuka mencurigakan",
    "fingerprint sering gagal",
    "speaker pecah suaranya kresek",
    "charger tidak berfungsi normal",
  ];
  const NEG_CLOSERS = [
    ". Tidak rekomen.",
    ". Mending cari toko lain.",
    ". Komplain dicuekin.",
    ". Bintang satu pun masih kebanyakan.",
    ". Refund please.",
    ".",
    "!",
    ". Sangat mengecewakan.",
    "",
  ];

  function genPositive() {
    const bits = pickN(POS_BODY, 1 + Math.floor(r() * 3));
    return (pick(POS_OPENERS) + bits.join(", ") + pick(POS_CLOSERS)).trim();
  }
  function genNegative() {
    const bits = pickN(NEG_BODY, 1 + Math.floor(r() * 3));
    return (pick(NEG_OPENERS) + bits.join(", ") + pick(NEG_CLOSERS)).trim();
  }
  // a couple noisy ones to make it feel real
  function genMixed() {
    return pick([
      "Barang sampai dengan selamat, tapi packing kurang bagus. Untungnya isinya aman.",
      "Awalnya ragu karena harga murah, ternyata kualitas oke punya.",
      "Pengiriman agak lama tapi seller informatif terus update.",
      "Speknya bagus, sayangnya warnanya tidak sesuai yang dipesan.",
      "Sudah dipakai 2 minggu, so far ok lah ya semoga awet.",
    ]);
  }

  // Build dataset: skewed slightly positive (real e-commerce bias)
  const TOTAL = 1247;
  const REVIEWS = [];
  for (let i = 0; i < TOTAL; i++) {
    const product = pick(PRODUCTS);
    const rand = r();
    let label, rating, text;
    if (rand < 0.62) {
      label = "positif";
      rating = r() < 0.45 ? 5 : 4;
      text = r() < 0.04 ? genMixed() : genPositive();
    } else if (rand < 0.95) {
      label = "negatif";
      rating = r() < 0.55 ? 1 : 2;
      text = r() < 0.04 ? genMixed() : genNegative();
    } else {
      // neutral (rating 3) — dropped per PRD
      label = null;
      rating = 3;
      text = genMixed();
    }

    const cleaned = label ? cleanText(text) : null;

    const daysAgo = Math.floor(r() * 180);
    const ts = new Date(Date.now() - daysAgo * 86400000);

    REVIEWS.push({
      id: i + 1,
      product_name: product.name,
      brand: product.brand,
      review_text: text,
      rating,
      label,
      clean_text: cleaned,
      created_at: ts.toISOString().slice(0, 10),
    });
  }

  // crude clean_text simulator
  function cleanText(t) {
    const stops = new Set(["yang", "dan", "di", "ke", "dari", "untuk", "dengan", "ini", "itu", "saya", "saja", "juga", "sudah", "tidak", "ada", "pada", "sangat", "banget", "sekali", "deh", "kok", "sih", "min", "ya", "nya", "punya", "kalau", "kalo", "tapi", "lagi", "lah", "pun", "dalam", "atau", "yg"]);
    return t
      .toLowerCase()
      .replace(/[^a-z\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w && !stops.has(w))
      .map((w) => stemId(w))
      .join(" ");
  }
  function stemId(w) {
    // very lightweight Sastrawi-ish stemmer mock
    return w
      .replace(/^(meng|mem|men|me|peng|pem|pen|ber|ter|di|ke|se)/, "")
      .replace(/(kan|an|i|nya|lah|kah)$/, "");
  }

  // Experiments history
  const EXPERIMENTS = [
    { id: 1, name: "Eksperimen 1 — baseline", date: "2026-04-12", test_size: 0.2, knn_k: 5, nb: { acc: 0.871, prec: 0.879, rec: 0.871, f1: 0.870 }, knn: { acc: 0.789, prec: 0.792, rec: 0.789, f1: 0.788 }, best: "naive_bayes" },
    { id: 2, name: "Eksperimen 2 — k=7", date: "2026-04-15", test_size: 0.2, knn_k: 7, nb: { acc: 0.882, prec: 0.886, rec: 0.882, f1: 0.881 }, knn: { acc: 0.812, prec: 0.816, rec: 0.812, f1: 0.811 }, best: "naive_bayes" },
    { id: 3, name: "Eksperimen 3 — test 0.3", date: "2026-04-22", test_size: 0.3, knn_k: 5, nb: { acc: 0.896, prec: 0.900, rec: 0.896, f1: 0.896 }, knn: { acc: 0.834, prec: 0.838, rec: 0.834, f1: 0.833 }, best: "naive_bayes" },
    { id: 4, name: "Eksperimen 4 — k=3", date: "2026-05-01", test_size: 0.2, knn_k: 3, nb: { acc: 0.901, prec: 0.904, rec: 0.901, f1: 0.901 }, knn: { acc: 0.798, prec: 0.803, rec: 0.798, f1: 0.797 }, best: "naive_bayes" },
    { id: 5, name: "Eksperimen 5 — final", date: "2026-05-18", test_size: 0.2, knn_k: 5, nb: { acc: 0.924, prec: 0.927, rec: 0.924, f1: 0.924, cm: [[472, 38], [29, 211]] }, knn: { acc: 0.847, prec: 0.852, rec: 0.847, f1: 0.847, cm: [[438, 72], [43, 197]] }, best: "naive_bayes" },
  ];

  // Word frequency for word cloud-ish display
  const TOP_POS_WORDS = [
    { w: "bagus", c: 412 }, { w: "mantap", c: 387 }, { w: "cepat", c: 365 }, { w: "rapi", c: 298 },
    { w: "original", c: 276 }, { w: "puas", c: 245 }, { w: "ramah", c: 198 }, { w: "lancar", c: 187 },
    { w: "awet", c: 162 }, { w: "jernih", c: 145 }, { w: "stabil", c: 132 }, { w: "premium", c: 118 },
    { w: "recommended", c: 109 }, { w: "tajam", c: 94 }, { w: "terang", c: 87 },
  ];
  const TOP_NEG_WORDS = [
    { w: "kecewa", c: 287 }, { w: "rusak", c: 234 }, { w: "lama", c: 213 }, { w: "habis", c: 198 },
    { w: "lemot", c: 167 }, { w: "panas", c: 154 }, { w: "hang", c: 142 }, { w: "bergaris", c: 121 },
    { w: "bocor", c: 113 }, { w: "rekondisi", c: 98 }, { w: "blur", c: 87 }, { w: "pecah", c: 76 },
    { w: "cuek", c: 65 }, { w: "gagal", c: 58 }, { w: "kresek", c: 43 },
  ];

  // Activity feed (last 14 days)
  const ACTIVITY = [];
  for (let i = 13; i >= 0; i--) {
    const date = new Date(Date.now() - i * 86400000);
    ACTIVITY.push({
      date: date.toISOString().slice(5, 10),
      pos: 25 + Math.floor(r() * 55),
      neg: 8 + Math.floor(r() * 30),
    });
  }

  window.AppData = {
    PRODUCTS, REVIEWS, EXPERIMENTS,
    TOP_POS_WORDS, TOP_NEG_WORDS, ACTIVITY,
    cleanText,
    fmtIDR(v) { return "Rp " + v.toLocaleString("id-ID"); },
  };
})();
