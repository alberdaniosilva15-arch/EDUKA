/**
 * Eduka — PDF Parser
 * Extrai texto de PDFs (browser-side com pdf.js)
 * Converte páginas para imagens base64 (para modelos vision)
 * 
 * Worker usa ficheiro local do pdfjs-dist instalado (sem CDN externa)
 */

let pdfjsLib = null;

async function getPdfJs() {
  if (!pdfjsLib) {
    pdfjsLib = await import("pdfjs-dist");
    // Worker local — garante match exato com a versão instalada do pdfjs-dist
    // Evita o mismatch CDN v4.0.379 vs pdfjs-dist ^4.10.38
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url
    ).toString();
  }
  return pdfjsLib;
}

/**
 * Extrai texto de todas as páginas de um PDF
 */
export async function extractPdfText(arrayBuffer) {
  const pdfjs = await getPdfJs();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const totalPages = pdf.numPages;
  const pageTexts = [];

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map((item) => item.str).join(" ");
    pageTexts.push(text);
  }

  return {
    text: pageTexts.join("\n\n"),
    pages: totalPages,
  };
}

/**
 * Converte páginas de PDF para imagens base64
 */
export async function pdfPagesToImages(arrayBuffer, maxPages = 10) {
  const pdfjs = await getPdfJs();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const totalPages = Math.min(pdf.numPages, maxPages);
  const images = [];

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");

    await page.render({ canvasContext: ctx, viewport }).promise;
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    images.push(dataUrl);
  }

  return images;
}

/**
 * Extrai texto de PDF via File API do browser
 */
export async function extractPdfTextFromFile(file) {
  const arrayBuffer = await file.arrayBuffer();
  return extractPdfText(arrayBuffer);
}

/**
 * Converte PDF File para imagens base64
 */
export async function pdfFileToImages(file, maxPages = 10) {
  const arrayBuffer = await file.arrayBuffer();
  return pdfPagesToImages(arrayBuffer, maxPages);
}
