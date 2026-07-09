/**
 * Eduka professional PPTX generator.
 * Builds varied decks with generated SVG visuals, real-example callouts and speaker notes.
 */

const SLIDE = { w: 13.333, h: 7.5 };

const COLORS = {
  ink: "102033",
  navy: "071733",
  blue: "2563EB",
  blueDark: "1746A2",
  cyan: "06B6D4",
  gold: "F59E0B",
  red: "DC2626",
  paper: "F8FAFC",
  white: "FFFFFF",
  line: "D8E2F0",
  muted: "64748B",
  softBlue: "EAF2FF",
  softGold: "FFF7E6",
};

const FONT = {
  display: "Aptos Display",
  body: "Aptos",
  mono: "Aptos Mono",
};

function asArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (!value) return [];
  return [String(value)];
}

function cleanText(value, fallback = "") {
  return String(value || fallback).replace(/\s+/g, " ").trim();
}

function clampText(value, max = 120) {
  const text = cleanText(value);
  return text.length > max ? `${text.slice(0, max - 1)}...` : text;
}

function xmlEscape(value) {
  return cleanText(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function svgDataUri(svg) {
  const encoded = typeof window !== "undefined" && window.btoa
    ? window.btoa(unescape(encodeURIComponent(svg)))
    : globalThis.Buffer?.from(svg, "utf8").toString("base64");
  return `data:image/svg+xml;base64,${encoded}`;
}

function visualTheme(index) {
  const themes = [
    { bg: "#eaf2ff", accent: "#2563eb", accent2: "#06b6d4", ink: "#102033" },
    { bg: "#fff7e6", accent: "#f59e0b", accent2: "#2563eb", ink: "#2f2414" },
    { bg: "#ecfeff", accent: "#0891b2", accent2: "#1746a2", ink: "#12343b" },
    { bg: "#f8fafc", accent: "#dc2626", accent2: "#f59e0b", ink: "#172033" },
  ];
  return themes[index % themes.length];
}

function buildVisualSvg(slide, index) {
  const visual = slide.visual || {};
  const theme = visualTheme(index);
  const title = xmlEscape(visual.caption || visual.alt || slide.title || "Visual Eduka");
  const prompt = xmlEscape(visual.prompt || visual.query || "Mapa visual do conceito principal");
  const type = cleanText(visual.type || slide.layout || "diagram").toLowerCase();

  if (type.includes("timeline") || slide.layout === "timeline") {
    return `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="820" viewBox="0 0 1200 820">
  <rect width="1200" height="820" rx="42" fill="${theme.bg}"/>
  <path d="M120 412 H1080" stroke="${theme.accent}" stroke-width="12" stroke-linecap="round"/>
  ${[0, 1, 2, 3].map((n) => {
    const x = 170 + n * 280;
    const y = n % 2 ? 455 : 255;
    return `<circle cx="${x}" cy="412" r="34" fill="${theme.accent}"/>
      <rect x="${x - 88}" y="${y}" width="176" height="102" rx="22" fill="#ffffff" opacity="0.92"/>
      <text x="${x}" y="${y + 44}" text-anchor="middle" font-size="28" font-family="Arial" font-weight="700" fill="${theme.ink}">Etapa ${n + 1}</text>
      <text x="${x}" y="${y + 76}" text-anchor="middle" font-size="20" font-family="Arial" fill="#64748b">ponto-chave</text>`;
  }).join("")}
  <text x="74" y="90" font-size="42" font-family="Arial" font-weight="800" fill="${theme.ink}">${title}</text>
  <text x="74" y="750" font-size="26" font-family="Arial" fill="#64748b">${prompt}</text>
</svg>`;
  }

  if (type.includes("chart") || slide.layout === "data") {
    const bars = [68, 44, 82, 58, 73];
    return `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="820" viewBox="0 0 1200 820">
  <rect width="1200" height="820" rx="42" fill="${theme.bg}"/>
  <text x="80" y="88" font-size="42" font-family="Arial" font-weight="800" fill="${theme.ink}">${title}</text>
  <rect x="90" y="160" width="1020" height="520" rx="30" fill="#ffffff" opacity="0.92"/>
  ${bars.map((h, i) => {
    const x = 170 + i * 175;
    const height = h * 5;
    return `<rect x="${x}" y="${625 - height}" width="92" height="${height}" rx="18" fill="${i % 2 ? theme.accent2 : theme.accent}"/>
      <text x="${x + 46}" y="660" text-anchor="middle" font-size="22" font-family="Arial" fill="#64748b">D${i + 1}</text>`;
  }).join("")}
  <path d="M140 625 H1040" stroke="#d8e2f0" stroke-width="4"/>
  <text x="80" y="750" font-size="26" font-family="Arial" fill="#64748b">${prompt}</text>
</svg>`;
  }

  if (type.includes("quote") || slide.layout === "quote") {
    return `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="820" viewBox="0 0 1200 820">
  <rect width="1200" height="820" rx="42" fill="${theme.bg}"/>
  <circle cx="1020" cy="165" r="118" fill="${theme.accent}" opacity="0.16"/>
  <circle cx="160" cy="655" r="128" fill="${theme.accent2}" opacity="0.16"/>
  <text x="105" y="235" font-size="150" font-family="Georgia" fill="${theme.accent}">"</text>
  <text x="185" y="300" font-size="46" font-family="Arial" font-weight="800" fill="${theme.ink}">${title}</text>
  <foreignObject x="185" y="345" width="820" height="220">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:Arial;font-size:34px;line-height:1.35;color:${theme.ink}">${prompt}</div>
  </foreignObject>
</svg>`;
  }

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="820" viewBox="0 0 1200 820">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${theme.bg}"/>
      <stop offset="1" stop-color="#ffffff"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="820" rx="42" fill="url(#g)"/>
  <rect x="78" y="92" width="1044" height="636" rx="34" fill="#ffffff" opacity="0.78"/>
  <circle cx="280" cy="330" r="120" fill="${theme.accent}" opacity="0.18"/>
  <circle cx="700" cy="420" r="165" fill="${theme.accent2}" opacity="0.15"/>
  <path d="M250 476 C380 350 508 520 642 382 C750 270 862 335 970 230" fill="none" stroke="${theme.accent}" stroke-width="18" stroke-linecap="round"/>
  <rect x="170" y="560" width="240" height="78" rx="20" fill="${theme.accent}" opacity="0.9"/>
  <rect x="465" y="540" width="240" height="98" rx="20" fill="${theme.accent2}" opacity="0.9"/>
  <rect x="760" y="500" width="240" height="138" rx="20" fill="${theme.accent}" opacity="0.82"/>
  <text x="92" y="80" font-size="40" font-family="Arial" font-weight="800" fill="${theme.ink}">${title}</text>
  <text x="92" y="765" font-size="26" font-family="Arial" fill="#64748b">${prompt}</text>
</svg>`;
}

function addText(slide, text, options) {
  slide.addText(cleanText(text), {
    fontFace: FONT.body,
    color: COLORS.ink,
    margin: 0,
    fit: "shrink",
    breakLine: false,
    ...options,
  });
}

function addBrand(slide, current, total, light = true) {
  addText(slide, "Eduka IA", {
    x: 0.55,
    y: 7.05,
    w: 1.4,
    h: 0.22,
    fontSize: 7.5,
    bold: true,
    color: light ? COLORS.blue : COLORS.white,
    charSpace: 1,
  });
  addText(slide, `${current}/${total}`, {
    x: 12,
    y: 7.05,
    w: 0.75,
    h: 0.22,
    fontSize: 7.5,
    align: "right",
    color: light ? COLORS.muted : "D7E6FF",
  });
}

function addTopRule(slide, pres, color = COLORS.blue) {
  slide.addShape(pres.ShapeType.rect, {
    x: 0,
    y: 0,
    w: SLIDE.w,
    h: 0.07,
    fill: { color },
    line: { color },
  });
}

function addBullets(slide, bullets, x, y, w, h, color = COLORS.ink) {
  const items = asArray(bullets).slice(0, 5);
  if (!items.length) return;

  slide.addText(items.map((point) => ({
    text: clampText(point, 115),
    options: {
      bullet: { indent: 12 },
      hanging: 4,
      breakLine: false,
    },
  })), {
    x,
    y,
    w,
    h,
    fontFace: FONT.body,
    fontSize: items.length > 4 ? 14 : 15.5,
    color,
    breakLine: false,
    fit: "shrink",
    valign: "top",
    paraSpaceAfterPt: 8,
    lineSpacingMultiple: 1.08,
  });
}

function addVisual(slide, pres, data, index, x, y, w, h) {
  const svg = buildVisualSvg(data, index);
  slide.addImage({ data: svgDataUri(svg), x, y, w, h });
}

function addRealExample(slide, pres, example, x, y, w) {
  if (!example?.label && !example?.takeaway) return;
  slide.addShape(pres.ShapeType.roundRect, {
    x,
    y,
    w,
    h: 0.85,
    rectRadius: 0.08,
    fill: { color: COLORS.softGold },
    line: { color: "FAD89A", transparency: 15 },
  });
  addText(slide, clampText(example.label || "Exemplo real", 56), {
    x: x + 0.18,
    y: y + 0.12,
    w: w - 0.36,
    h: 0.22,
    fontSize: 9,
    bold: true,
    color: "7A4A00",
  });
  addText(slide, clampText(example.takeaway || example.source || "", 120), {
    x: x + 0.18,
    y: y + 0.38,
    w: w - 0.36,
    h: 0.34,
    fontSize: 8.5,
    color: "5F4A1D",
  });
}

function addCover(pres, data, total) {
  const slide = pres.addSlide();
  slide.background = { color: COLORS.navy };
  addTopRule(slide, pres, COLORS.gold);
  slide.addShape(pres.ShapeType.ellipse, {
    x: 8.7,
    y: -1.25,
    w: 4.8,
    h: 4.8,
    line: { color: COLORS.cyan, transparency: 100 },
    fill: { color: COLORS.cyan, transparency: 86 },
  });
  slide.addShape(pres.ShapeType.ellipse, {
    x: -1.5,
    y: 4.6,
    w: 4.2,
    h: 4.2,
    line: { color: COLORS.blue, transparency: 100 },
    fill: { color: COLORS.blue, transparency: 84 },
  });

  addText(slide, "Eduka IA", {
    x: 0.75,
    y: 0.55,
    w: 1.8,
    h: 0.35,
    fontSize: 12,
    bold: true,
    color: COLORS.white,
    charSpace: 1.5,
  });
  addText(slide, clampText(data.title || "Apresentacao", 72), {
    x: 0.75,
    y: 2.0,
    w: 7.6,
    h: 1.65,
    fontFace: FONT.display,
    fontSize: 34,
    bold: true,
    color: COLORS.white,
    breakLine: false,
    fit: "shrink",
  });
  addText(slide, clampText(data.subtitle || data.visual?.caption || "Apresentacao academica visual", 140), {
    x: 0.8,
    y: 3.8,
    w: 6.9,
    h: 0.65,
    fontSize: 15,
    color: "C7D8F6",
    fit: "shrink",
  });
  addVisual(slide, pres, data, 0, 8.15, 1.65, 4.15, 3.6);
  addText(slide, `${total} slides`, {
    x: 0.8,
    y: 5.45,
    w: 1.4,
    h: 0.25,
    fontSize: 9,
    color: "B6C8EA",
  });
  addBrand(slide, 1, total, false);
  return slide;
}

function addContentLayout(pres, data, current, total, index) {
  const slide = pres.addSlide();
  slide.background = { color: COLORS.paper };
  addTopRule(slide, pres, index % 3 === 0 ? COLORS.gold : COLORS.blue);
  addText(slide, clampText(data.title, 82), {
    x: 0.55,
    y: 0.48,
    w: 7.2,
    h: 0.7,
    fontFace: FONT.display,
    fontSize: 25,
    bold: true,
    color: COLORS.navy,
  });

  const visualLeft = data.layout === "visual-left" || data.layout === "timeline";
  const visualX = visualLeft ? 0.62 : 7.3;
  const textX = visualLeft ? 7.15 : 0.75;
  addVisual(slide, pres, data, index, visualX, 1.45, 5.35, 4.4);
  addBullets(slide, data.content, textX, 1.55, 5.25, 3.55);
  addRealExample(slide, pres, data.realExample, textX, 5.38, 5.25);
  addBrand(slide, current, total);
  return slide;
}

function addDataLayout(pres, data, current, total, index) {
  const slide = pres.addSlide();
  slide.background = { color: COLORS.white };
  addTopRule(slide, pres, COLORS.cyan);
  addText(slide, clampText(data.title, 80), {
    x: 0.65,
    y: 0.48,
    w: 8.2,
    h: 0.72,
    fontFace: FONT.display,
    fontSize: 24,
    bold: true,
    color: COLORS.navy,
  });
  addVisual(slide, pres, data, index, 0.8, 1.35, 7.2, 4.75);
  addBullets(slide, data.content, 8.35, 1.55, 4.05, 3.4);
  addRealExample(slide, pres, data.realExample, 8.35, 5.22, 4.05);
  addBrand(slide, current, total);
  return slide;
}

function addComparisonLayout(pres, data, current, total, index) {
  const slide = pres.addSlide();
  slide.background = { color: COLORS.paper };
  addTopRule(slide, pres, COLORS.blue);
  addText(slide, clampText(data.title, 84), {
    x: 0.65,
    y: 0.48,
    w: 10.5,
    h: 0.72,
    fontFace: FONT.display,
    fontSize: 24,
    bold: true,
    color: COLORS.navy,
  });

  const points = asArray(data.content);
  const mid = Math.ceil(points.length / 2);
  const left = points.slice(0, mid);
  const right = points.slice(mid);
  const cards = [
    { x: 0.8, title: "Antes / desafio", color: COLORS.softBlue, bullets: left },
    { x: 6.8, title: "Depois / resposta", color: COLORS.softGold, bullets: right.length ? right : left },
  ];

  cards.forEach((card) => {
    slide.addShape(pres.ShapeType.roundRect, {
      x: card.x,
      y: 1.55,
      w: 5.25,
      h: 4.4,
      rectRadius: 0.08,
      fill: { color: card.color },
      line: { color: COLORS.line },
    });
    addText(slide, card.title, {
      x: card.x + 0.35,
      y: 1.9,
      w: 4.5,
      h: 0.32,
      fontSize: 13,
      bold: true,
      color: COLORS.navy,
    });
    addBullets(slide, card.bullets, card.x + 0.35, 2.45, 4.45, 2.8);
  });

  addRealExample(slide, pres, data.realExample, 3.3, 6.12, 6.7);
  addBrand(slide, current, total);
  return slide;
}

function addSectionLayout(pres, data, current, total, index) {
  const slide = pres.addSlide();
  slide.background = { color: index % 2 ? COLORS.navy : COLORS.blueDark };
  addTopRule(slide, pres, COLORS.gold);
  addVisual(slide, pres, data, index, 8.4, 1.28, 3.8, 3.5);
  addText(slide, clampText(data.title, 70), {
    x: 0.85,
    y: 2.1,
    w: 7,
    h: 1.25,
    fontFace: FONT.display,
    fontSize: 31,
    bold: true,
    color: COLORS.white,
  });
  addBullets(slide, data.content, 0.92, 3.65, 6.35, 1.35, "DFEAFE");
  addBrand(slide, current, total, false);
  return slide;
}

function addSummaryLayout(pres, data, current, total, index) {
  const slide = pres.addSlide();
  slide.background = { color: COLORS.navy };
  addTopRule(slide, pres, COLORS.gold);
  addText(slide, clampText(data.title || "Conclusao", 70), {
    x: 0.75,
    y: 0.95,
    w: 7.5,
    h: 0.9,
    fontFace: FONT.display,
    fontSize: 30,
    bold: true,
    color: COLORS.white,
  });

  const items = asArray(data.content).slice(0, 4);
  items.forEach((item, i) => {
    const x = 0.85 + (i % 2) * 5.95;
    const y = 2.25 + Math.floor(i / 2) * 1.45;
    slide.addShape(pres.ShapeType.roundRect, {
      x,
      y,
      w: 5.25,
      h: 1.0,
      rectRadius: 0.06,
      fill: { color: i % 2 ? "10294E" : "0C2244" },
      line: { color: "2C4D82", transparency: 20 },
    });
    addText(slide, clampText(item, 90), {
      x: x + 0.28,
      y: y + 0.2,
      w: 4.65,
      h: 0.55,
      fontSize: 13,
      color: COLORS.white,
      fit: "shrink",
    });
  });
  addRealExample(slide, pres, data.realExample, 0.9, 5.65, 6.2);
  addVisual(slide, pres, data, index, 8.75, 4.35, 3.4, 2.0);
  addBrand(slide, current, total, false);
  return slide;
}

function normaliseSlide(slide, index, total) {
  const layout = cleanText(slide.layout || (index === 0 ? "cover" : index === total - 1 ? "summary" : "visual-right"));
  return {
    ...slide,
    title: cleanText(slide.title, index === 0 ? "Apresentacao" : `Slide ${index + 1}`),
    subtitle: cleanText(slide.subtitle),
    layout,
    content: asArray(slide.content).slice(0, 5),
    notes: cleanText(slide.notes),
    visual: slide.visual || {
      type: "diagram",
      prompt: slide.title,
      query: slide.title,
      caption: slide.title,
      alt: slide.title,
    },
    realExample: slide.realExample || null,
  };
}

export async function generateProfessionalPptx(slideData, filename = "Apresentacao-Eduka") {
  const pptx = await import("pptxgenjs");
  const PptxGenJS = pptx.default || pptx;
  const pres = new PptxGenJS();

  pres.layout = "LAYOUT_WIDE";
  pres.author = "Eduka IA";
  pres.company = "Eduka";
  pres.subject = "Apresentacao academica visual";
  pres.title = filename;
  pres.lang = "pt-AO";
  pres.theme = {
    headFontFace: FONT.display,
    bodyFontFace: FONT.body,
    lang: "pt-AO",
  };

  const slides = Array.isArray(slideData) && slideData.length
    ? slideData.map((slide, index) => normaliseSlide(slide, index, slideData.length))
    : [normaliseSlide({ title: "Apresentacao Eduka", content: ["Conteudo indisponivel"] }, 0, 1)];

  slides.forEach((slide, index) => {
    const current = index + 1;
    const total = slides.length;
    let pptSlide;

    if (index === 0 || slide.layout === "cover") {
      pptSlide = addCover(pres, slide, total);
    } else if (index === slides.length - 1 || slide.layout === "summary") {
      pptSlide = addSummaryLayout(pres, slide, current, total, index);
    } else if (slide.layout === "data") {
      pptSlide = addDataLayout(pres, slide, current, total, index);
    } else if (slide.layout === "comparison") {
      pptSlide = addComparisonLayout(pres, slide, current, total, index);
    } else if (slide.layout === "section" || slide.layout === "quote") {
      pptSlide = addSectionLayout(pres, slide, current, total, index);
    } else {
      pptSlide = addContentLayout(pres, slide, current, total, index);
    }

    if (pptSlide && slide.notes) {
      pptSlide.addNotes(slide.notes);
    }
  });

  return pres.writeFile({ fileName: `${filename}.pptx` });
}
