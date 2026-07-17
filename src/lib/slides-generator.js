/**
 * Eduka — Gerador de Slides PPTX
 * Gera apresentações profissionais com branding Eduka
 */

// Cores Eduka
const COLORS = {
  primary: "2563EB",     // Azul principal
  secondary: "06B6D4",   // Ciano
  dark: "0A1E5E",        // Azul escuro
  darker: "060E21",      // Fundo escuro
  white: "FFFFFF",
  lightGray: "F8FAFC",
  gray: "E2E8F0",
  muted: "64748B",
  gold: "F59E0B",
  accent: "3B82F6",
};

/**
 * Gera um ficheiro PPTX a partir de um array de slides (JSON)
 * @param {Array} slideData Array of objects com title, subtitle, content, notes
 * @param {String} filename Nome do arquivo
 */
export async function generatePptx(slideData, filename = "Apresentacao-Eduka") {
  const pptx = await import("pptxgenjs");
  const PptxGenJS = pptx.default || pptx;
  const pres = new PptxGenJS();
  
  pres.layout = "LAYOUT_16x9";
  pres.company = "Eduka Platform";
  pres.title = filename;
  pres.subject = "Apresentação gerada com IA";

  // Master slide — fundo escuro com barra azul superior
  pres.defineSlideMaster({
    title: "DARK_MASTER",
    background: { color: COLORS.darker },
    objects: [
      { rect: { x: 0, y: 0, w: "100%", h: 0.08, fill: { color: COLORS.primary } } },
      { text: { text: "Eduka IA", options: { x: 0.4, y: "92%", w: "30%", h: 0.4, color: COLORS.muted, fontSize: 9, fontFace: "Calibri" } } },
    ],
  });

  // Master slide — fundo claro
  pres.defineSlideMaster({
    title: "LIGHT_MASTER",
    background: { color: COLORS.lightGray },
    objects: [
      { rect: { x: 0, y: 0, w: "100%", h: 0.08, fill: { color: COLORS.primary } } },
      { text: { text: "Eduka IA", options: { x: 0.4, y: "92%", w: "30%", h: 0.4, color: COLORS.muted, fontSize: 9, fontFace: "Calibri" } } },
    ],
  });

  // Master slide — cover com gradiente
  pres.defineSlideMaster({
    title: "COVER_MASTER",
    background: { color: COLORS.darker },
    objects: [
      { rect: { x: 0, y: 0, w: "100%", h: 100, fill: { color: COLORS.darker, transparency: 0 } } },
      { rect: { x: 0, y: "45%", w: "100%", h: 0.06, fill: { color: COLORS.primary } } },
      { text: { text: "Eduka IA — Plataforma Académica", options: { x: 0.4, y: "88%", w: "50%", h: 0.4, color: COLORS.muted, fontSize: 10, fontFace: "Calibri" } } },
    ],
  });

  // Master slide — section divider
  pres.defineSlideMaster({
    title: "SECTION_MASTER",
    background: { color: COLORS.dark },
    objects: [
      { rect: { x: 0, y: "48%", w: "100%", h: 0.04, fill: { color: COLORS.secondary } } },
      { text: { text: "Eduka IA", options: { x: 0.4, y: "92%", w: "30%", h: 0.4, color: COLORS.muted, fontSize: 9, fontFace: "Calibri" } } },
    ],
  });

  // Normalise fields: map AI output (bullets/speakerNotes) to expected (content/notes)
  const normalisedData = slideData.map((slide) => ({
    ...slide,
    content: slide.content || slide.bullets || [],
    notes: slide.notes || slide.speakerNotes || "",
  }));

  const totalSlides = normalisedData.length;
  let slideNumber = 1;

  // Processar cada slide
  for (let i = 0; i < totalSlides; i++) {
    const slide = normalisedData[i];
    const isFirst = i === 0;
    const isLast = i === totalSlides - 1;
    
    if (isFirst) {
      // COVER SLIDE
      addCoverSlide(pres, slide, totalSlides);
    } else if (isLast) {
      // CONCLUSION SLIDE
      addConclusionSlide(pres, slide, slideNumber, totalSlides);
    } else if (slide.content && slide.content.length <= 3) {
      // SECTION DIVIDER (poucos pontos)
      addSectionSlide(pres, slide, slideNumber, totalSlides);
    } else {
      // CONTENT SLIDE (padrão)
      addContentSlide(pres, slide, slideNumber, totalSlides);
    }
    
    slideNumber++;
  }

  return pres.writeFile({ fileName: filename + ".pptx" });
}

/**
 * Slide de capa — título grande com branding
 */
function addCoverSlide(pres, slide, totalSlides) {
  const s = pres.addSlide({ masterName: "COVER_MASTER" });
  
  // Título principal
  s.addText(slide.title || "Apresentação", {
    x: 0.8, y: "28%", w: "84%", h: 1.5,
    fontSize: 44, color: COLORS.white, bold: true, align: "center",
    fontFace: "Calibri",
  });
  
  // Subtítulo
  if (slide.subtitle) {
    s.addText(slide.subtitle, {
      x: 1.5, y: "52%", w: "70%", h: 0.8,
      fontSize: 20, color: COLORS.accent, align: "center",
      fontFace: "Calibri",
    });
  }
  
  // Número de slides
  s.addText(`${totalSlides} slides`, {
    x: "40%", y: "65%", w: "20%", h: 0.5,
    fontSize: 12, color: COLORS.muted, align: "center",
    fontFace: "Calibri",
  });
}

/**
 * Slide de secção — título grande, fundo escuro
 */
function addSectionSlide(pres, slide, current, total) {
  const s = pres.addSlide({ masterName: "SECTION_MASTER" });
  
  s.addText(slide.title, {
    x: 0.8, y: "35%", w: "84%", h: 1.2,
    fontSize: 36, color: COLORS.white, bold: true, align: "center",
    fontFace: "Calibri",
  });
  
  // Conteúdo se existir (poucos pontos)
  if (slide.content && slide.content.length > 0) {
    const bullets = slide.content.map(text => ({
      text,
      options: { bullet: { code: "25CF" }, color: COLORS.gray, fontSize: 16, breakType: "none" }
    }));
    s.addText(bullets, {
      x: 1.5, y: "55%", w: "70%", h: "30%",
      fontFace: "Calibri", valign: "top", lineSpacingMultiple: 1.3,
    });
  }
  
  // Número de slide
  addSlideNumber(s, current, total);
}

/**
 * Slide de conteúdo — layout padrão com bullets
 */
function addContentSlide(pres, slide, current, total) {
  const s = pres.addSlide({ masterName: "DARK_MASTER" });
  
  // Título
  s.addText(slide.title, {
    x: 0.5, y: 0.35, w: "90%", h: 0.9,
    fontSize: 28, color: COLORS.white, bold: true,
    fontFace: "Calibri",
  });
  
  // Linha separadora sob o título
  s.addShape(pres.ShapeType.rect, {
    x: 0.5, y: 1.25, w: 1.5, h: 0.04,
    fill: { color: COLORS.primary },
  });
  
  // Conteúdo bullets
  if (slide.content && slide.content.length > 0) {
    const bullets = slide.content.map(text => ({
      text,
      options: {
        bullet: { code: "25B8" },
        color: COLORS.gray,
        fontSize: 16,
        breakType: "none",
      }
    }));
    
    s.addText(bullets, {
      x: 0.6, y: 1.6, w: "88%", h: "68%",
      fontFace: "Calibri", valign: "top",
      lineSpacingMultiple: 1.4,
      paraSpaceAfter: 6,
    });
  }
  
  // Notas do apresentador
  if (slide.notes) {
    s.addNotes(slide.notes);
  }
  
  // Número de slide
  addSlideNumber(s, current, total);
}

/**
 * Slide de conclusão — recapitulação e contacto
 */
function addConclusionSlide(pres, slide, current, total) {
  const s = pres.addSlide({ masterName: "COVER_MASTER" });
  
  s.addText(slide.title || "Conclusão", {
    x: 0.8, y: "25%", w: "84%", h: 1.2,
    fontSize: 38, color: COLORS.white, bold: true, align: "center",
    fontFace: "Calibri",
  });
  
  // Conteúdo resumo
  if (slide.content && slide.content.length > 0) {
    const bullets = slide.content.map(text => ({
      text,
      options: { bullet: { code: "2713" }, color: COLORS.gray, fontSize: 15, breakType: "none" }
    }));
    s.addText(bullets, {
      x: 1.5, y: "45%", w: "70%", h: "35%",
      fontFace: "Calibri", valign: "top", lineSpacingMultiple: 1.3,
    });
  }
  
  // Obrigado
  s.addText("Obrigado!", {
    x: "30%", y: "82%", w: "40%", h: 0.5,
    fontSize: 14, color: COLORS.accent, align: "center",
    fontFace: "Calibri", bold: true,
  });
  
  // Número de slide
  addSlideNumber(s, current, total);
}

/**
 * Adiciona número de canto no slide
 */
function addSlideNumber(slide, current, total) {
  slide.addText(`${current} / ${total}`, {
    x: "85%", y: "92%", w: "12%", h: 0.35,
    fontSize: 9, color: COLORS.muted, align: "right",
    fontFace: "Calibri",
  });
}
