/**
 * Eduka — Quality Rubrics
 * Avaliação determinística de qualidade da saída da IA.
 * Usado para decidir se é necessário pós-processamento seletivo.
 */

/**
 * Rubrica de slides — evaluate semântica da saída.
 * Retorna { passed, score, issues[], suggestions[] }
 */
export function evaluateSlidesQuality(slides) {
  const issues = [];
  const suggestions = [];
  let score = 0;
  const maxScore = 12;

  // 1. Contagem correta
  if (!Array.isArray(slides) || slides.length === 0) {
    issues.push("Output não é um array de slides válido");
    return { passed: false, score: 0, maxScore, issues, suggestions };
  }
  score += 2;

  // 2. Todos têm título
  const allHaveTitle = slides.every((s) => s.title && s.title.length > 3);
  if (allHaveTitle) {
    score += 1;
  } else {
    issues.push("Alguns slides não têm título válido");
  }

  // 3. Todos têm keyMessage
  const allHaveKeyMessage = slides.every((s) => s.keyMessage && s.keyMessage.length > 10);
  if (allHaveKeyMessage) {
    score += 2;
  } else {
    issues.push("Alguns slides não têm keyMessage ou é demasiado curta");
  }

  // 4. Bullets concretos
  const slidesWithGoodBullets = slides.filter(
    (s) => Array.isArray(s.bullets) && s.bullets.length >= 2 && s.bullets.every((b) => b.length > 10)
  );
  if (slidesWithGoodBullets.length >= slides.length * 0.6) {
    score += 2;
  } else {
    issues.push("Muitos slides com bullets vagos ou insuficientes");
    suggestions.push("Bullets devem ter informação concreta, mínimo 10 caracteres cada");
  }

  // 5. Speaker notes profundas
  const slidesWithGoodNotes = slides.filter((s) => {
    const wordCount = (s.speakerNotes || "").split(/\s+/).length;
    return wordCount >= 50;
  });
  if (slidesWithGoodNotes.length >= slides.length * 0.5) {
    score += 2;
  } else {
    issues.push("Muitos slides com notas do apresentador curtas");
    suggestions.push("Notas devem ter 80-180 palavras de explicação aprofundada");
  }

  // 6. Evidence presente
  const slidesWithEvidence = slides.filter((s) => s.evidence != null);
  if (slidesWithEvidence.length >= 1) {
    score += 1;
  } else {
    issues.push("Nenhum slide tem evidence (dado, exemplo ou caso)");
    suggestions.push("Pelo menos 1 slide deve ter evidence não nula");
  }

  // 7. Local context presente
  const slidesWithLocal = slides.filter((s) => s.localContext != null);
  if (slidesWithLocal.length >= 1) {
    score += 1;
  } else {
    issues.push("Nenhum slide tem localContext");
    suggestions.push("Pelo menos 1-2 slides devem ter contexto angolano/africano");
  }

  // 8. Visual definido
  const allHaveVisual = slides.every((s) => s.visual && s.visual.type && s.visual.description);
  if (allHaveVisual) {
    score += 1;
  } else {
    issues.push("Alguns slides não têm visual definido");
  }

  const passed = score >= 8 && issues.length <= 2;
  return { passed, score, maxScore, issues, suggestions };
}

/**
 * Rubrica de trabalho académico.
 */
export function evaluateWorkQuality(work) {
  const issues = [];
  const suggestions = [];
  let score = 0;
  const maxScore = 11;

  if (!work || typeof work !== "object") {
    return { passed: false, score: 0, maxScore, issues: ["Output inválido"], suggestions };
  }

  // 1. Título
  if (work.title && work.title.length > 5) {
    score += 1;
  } else {
    issues.push("Título ausente ou demasiado curto");
  }

  // 2. Tese
  if (work.thesis && work.thesis.length > 20) {
    score += 2;
  } else if (work.thesis && work.thesis.length > 10) {
    score += 1;
    suggestions.push("Tese deveria ser mais específica");
  } else {
    issues.push("Tese ausente ou demasiado vaga");
  }

  // 3. Estrutura
  const sections = ["introduction", "development", "conclusion"];
  const presentSections = sections.filter((s) => work[s] && work[s].length > 50);
  if (presentSections.length === sections.length) {
    score += 2;
  } else {
    issues.push(`Secções em falta: ${sections.filter((s) => !presentSections.includes(s)).join(", ")}`);
  }

  // 4. Desenvolvimento extenso
  if (work.development && work.development.length > 500) {
    score += 1;
  } else if (work.development && work.development.length > 200) {
    score += 1;
  } else {
    issues.push("Desenvolvimento demasiado curto");
  }

  // 5. Contraponto
  if (work.counterpoint && work.counterpoint.length > 50) {
    score += 2;
  } else if (work.counterpoint && work.counterpoint.length > 20) {
    score += 1;
  } else {
    issues.push("Contraponto ausente ou insuficiente");
    suggestions.push("Incluir pelo menos uma perspectiva alternativa ou limitação");
  }

  // 6. Referências
  if (Array.isArray(work.references) && work.references.length >= 3) {
    score += 1;
  } else {
    issues.push("Poucas ou nenhuma referência");
  }

  // 7. Evidências no texto
  const combined = [work.introduction, work.development, work.counterpoint].join(" ");
  const hasNumbers = /\d+|segundo|de acordo|estudo/i.test(combined);
  const hasLocal = /angola|angolano|africano|lusófono/i.test(combined);
  if (hasNumbers) score += 1;
  if (hasLocal) score += 1;

  // 8. Política de fontes
  const hasInvented = /10\.\d{4,}\//i.test(combined);
  if (hasInvented) {
    issues.push("Possíveis referências inventadas (DOI)");
    suggestions.push("Remover ou marcar como não verificadas");
  }

  const passed = score >= 8 && !hasInvented;
  return { passed, score, maxScore, issues, suggestions };
}

/**
 * Decidir se é necessário pós-processamento seletivo.
 * Retorna { needsRepair, needsRegenerate, fields }
 */
export function decidePostProcessing(slidesScore, workScore) {
  const result = {
    slides: { needsRepair: false, needsRegenerate: false, fields: [] },
    work: { needsRepair: false, needsRegenerate: false, fields: [] },
  };

  if (slidesScore) {
    if (!slidesScore.passed && slidesScore.score >= 5) {
      // Reparável: corrigir campos específicos
      result.slides.needsRepair = true;
      result.slides.fields = slidesScore.issues;
    } else if (!slidesScore.passed && slidesScore.score < 5) {
      // Demasiado mau: regenerar
      result.slides.needsRegenerate = true;
    }
  }

  if (workScore) {
    if (!workScore.passed && workScore.score >= 5) {
      result.work.needsRepair = true;
      result.work.fields = workScore.issues;
    } else if (!workScore.passed && workScore.score < 5) {
      result.work.needsRegenerate = true;
    }
  }

  return result;
}
