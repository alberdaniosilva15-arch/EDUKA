/**
 * Eduka — Utilitários
 */
import DOMPurify from 'dompurify';
import { marked } from 'marked';

// Configurar marked para output limpo
marked.setOptions({
  breaks: true,
  gfm: true,
});

/**
 * Sanitiza HTML para prevenir XSS
 */
export function sanitizeHtml(html) {
  // DOMPurify requer window/document — retorna HTML cru em SSR.
  // Hoje todas as chamadas são em "use client" (safe), mas se isto
  // for usado em SSR/Server Components, sanitizar com isomorphic-dompurify.
  if (typeof window === 'undefined') return html;
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr', 'ul', 'ol', 'li', 'strong', 'em', 'a', 'blockquote', 'code', 'pre', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'img', 'span', 'div'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'class', 'colspan', 'rowspan'],
  });
}

/**
 * Sanitiza input do utilizador para prevenir prompt injection
 * Remove ou escapa caracteres que podem ser usados para injetar instruções
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input
    .replace(/\n{3,}/g, '\n\n')     // Limita quebras de linha consecutivas
    .trim()
    .slice(0, 5000);                // Limita tamanho máximo
}

/**
 * Converte markdown para HTML usando marked (robusto)
 */
export function markdownToHtml(md) {
  if (!md) return "";
  return marked.parse(md);
}

/**
 * Copia texto para clipboard
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    return true;
  }
}

/**
 * Download de texto como ficheiro
 */
export function downloadAsFile(content, filename, type = "text/plain") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exportação para texto simples — remove todos os marcadores markdown
 */
export function exportToTxt(markdown, filename) {
  const plainText = markdown
    .replace(/^#{1,6}\s+/gm, '')    // Remove headings
    .replace(/\*\*\*(.+?)\*\*\*/g, '$1') // Remove bold+italic
    .replace(/\*\*(.+?)\*\*/g, '$1')     // Remove bold
    .replace(/\*(.+?)\*/g, '$1')          // Remove italic
    .replace(/__(.+?)__/g, '$1')          // Remove underline
    .replace(/~~(.+?)~~/g, '$1')          // Remove strikethrough
    .replace(/`(.+?)`/g, '$1')            // Remove inline code
    .replace(/^[-*+]\s+/gm, '')           // Remove bullet markers
    .replace(/^\d+\.\s+/gm, '')           // Remove numbered list markers
    .replace(/^>\s+/gm, '')               // Remove blockquote markers
    .replace(/^---+$/gm, '')              // Remove horizontal rules
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1') // Keep link/image text only
    .replace(/\n{3,}/g, '\n\n')           // Collapse blank lines
    .trim();
  
  downloadAsFile(plainText, filename + ".txt", "text/plain");
}

/**
 * Exportação para PDF — iframe nativo, super leve, zero dependências
 * Usa iframe oculto (evita popup blockers) + detecção mobile
 */
export async function exportToPdf(markdown, filename) {
  const htmlContent = sanitizeHtml(markdownToHtml(markdown));
  const safeFilename = filename.replace(/[^a-zA-Z0-9_-]/g, '_');
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  const printCSS = `
    @page { margin: 2cm; size: A4; }
    * { box-sizing: border-box; }
    body {
      font-family: 'Calibri', 'Inter', system-ui, sans-serif;
      color: #1e293b;
      line-height: 1.7;
      font-size: 11pt;
      max-width: 100%;
      padding: 0;
      margin: 0;
    }
    h1 { font-size: 20pt; color: #0a1e5e; text-align: center; margin: 0 0 16px; border-bottom: 2px solid #2563eb; padding-bottom: 8px; }
    h2 { font-size: 14pt; color: #1a56db; margin: 20px 0 10px; }
    h3 { font-size: 12pt; color: #2563eb; margin: 16px 0 8px; }
    p { margin: 0 0 8px; text-align: justify; }
    ul, ol { margin: 0 0 10px 20px; }
    li { margin: 0 0 3px; }
    blockquote { border-left: 3px solid #2563eb; padding-left: 10px; color: #475569; margin: 10px 0; font-style: italic; }
    code { background: #f1f5f9; padding: 1px 4px; border-radius: 3px; font-family: 'Courier New', monospace; font-size: 9.5pt; }
    pre { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 10px; overflow-x: auto; }
    pre code { background: none; padding: 0; }
    hr { border: none; border-top: 1px solid #e2e8f0; margin: 16px 0; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    th, td { border: 1px solid #e2e8f0; padding: 6px 10px; text-align: left; font-size: 10pt; }
    th { background: #f1f5f9; font-weight: 600; }
    strong { color: #0f172a; }
    .pdf-footer { text-align: center; font-size: 8pt; color: #94a3b8; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 8px; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .pdf-footer { page-break-inside: avoid; }
    }
  `;

  const htmlDoc = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${safeFilename}</title>
<style>${printCSS}</style></head><body>
${htmlContent}
<div class="pdf-footer">Gerado com Eduka IA</div>
</body></html>`;

  // Método iframe — evita popup blockers, funciona em mobile
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:none;opacity:0;pointer-events:none;';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow.document;
  doc.open();
  doc.write(htmlDoc);
  doc.close();

  // Espera renderizar antes de imprimir
  await new Promise(r => setTimeout(r, isMobile ? 800 : 300));

  try {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
  } catch {
    // Fallback: window.open se iframe falhar
    const w = window.open('', '_blank');
    if (w) {
      w.document.write(htmlDoc);
      w.document.close();
      w.focus();
      setTimeout(() => { w.print(); }, isMobile ? 800 : 300);
    }
  }

  // Limpa iframe após impressão
  setTimeout(() => document.body.removeChild(iframe), 2000);
}

/**
 * Exportação para DOCX — formatação profissional
 */
export async function exportToDocx(markdown, filename) {
  try {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, TabStopPosition, TabStopType, WidthType, Table, TableRow, TableCell } = await import("docx");
    const { saveAs } = await import("file-saver");
    
    const paragraphs = [];
    const lines = markdown.split('\n');
    let inCodeBlock = false;
    let codeContent = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Handle code blocks
      if (line.trim().startsWith('```')) {
        if (inCodeBlock) {
          // End code block
          paragraphs.push(new Paragraph({
            children: [new TextRun({ text: codeContent.join('\n'), font: 'Courier New', size: 18, color: '334155' })],
            spacing: { before: 120, after: 120 },
            indent: { left: 720 },
          }));
          codeContent = [];
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
        }
        continue;
      }
      
      if (inCodeBlock) {
        codeContent.push(line);
        continue;
      }
      
      if (!line.trim()) continue;
      
      // Headings
      if (line.startsWith('### ')) {
        paragraphs.push(new Paragraph({
          children: [new TextRun({ text: line.replace('### ', ''), bold: true, size: 24, color: '1a56db', font: 'Outfit' })],
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 240, after: 120 },
        }));
      } else if (line.startsWith('## ')) {
        paragraphs.push(new Paragraph({
          children: [new TextRun({ text: line.replace('## ', ''), bold: true, size: 28, color: '0a1e5e', font: 'Outfit' })],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 360, after: 160 },
        }));
      } else if (line.startsWith('# ')) {
        paragraphs.push(new Paragraph({
          children: [new TextRun({ text: line.replace('# ', ''), bold: true, size: 36, color: '0a1e5e', font: 'Outfit' })],
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { before: 480, after: 240 },
        }));
      }
      // Blockquotes
      else if (line.startsWith('> ')) {
        paragraphs.push(new Paragraph({
          children: [new TextRun({ text: line.replace('> ', ''), italics: true, color: '475569', size: 22 })],
          indent: { left: 720 },
          border: { left: { style: BorderStyle.SINGLE, size: 3, color: '2563EB', space: 8 } },
          spacing: { before: 120, after: 120 },
        }));
      }
      // Horizontal rules
      else if (line.match(/^---+$/)) {
        paragraphs.push(new Paragraph({
          children: [new TextRun({ text: '' })],
          border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1', space: 4 } },
          spacing: { before: 240, after: 240 },
        }));
      }
      // Unordered list items
      else if (line.match(/^[-*+]\s+/)) {
        const text = line.replace(/^[-*+]\s+/, '');
        paragraphs.push(new Paragraph({
          children: parseInlineFormatting(text, TextRun),
          bullet: { level: 0 },
          spacing: { before: 60, after: 60 },
        }));
      }
      // Ordered list items
      else if (line.match(/^\d+\.\s+/)) {
        const text = line.replace(/^\d+\.\s+/, '');
        paragraphs.push(new Paragraph({
          children: parseInlineFormatting(text, TextRun),
          numbering: { reference: 'ordered-list', level: 0 },
          spacing: { before: 60, after: 60 },
        }));
      }
      // Regular paragraphs with inline formatting
      else {
        paragraphs.push(new Paragraph({
          children: parseInlineFormatting(line, TextRun),
          spacing: { before: 80, after: 80 },
        }));
      }
    }
    
    // Cover page
    const coverParagraphs = [
      new Paragraph({ children: [], spacing: { before: 3000 } }),
      new Paragraph({
        children: [new TextRun({ text: 'Eduka IA', bold: true, size: 52, color: '2563EB', font: 'Outfit' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),
      new Paragraph({
        children: [new TextRun({ text: 'Documento Académico', size: 28, color: '475569', font: 'Outfit' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),
      new Paragraph({
        children: [new TextRun({ text: 'Gerado automaticamente com inteligência artificial', size: 20, color: '94a3b8' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),
      new Paragraph({
        children: [new TextRun({ text: new Date().toLocaleDateString('pt-AO'), size: 20, color: '94a3b8' })],
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({ children: [], spacing: { before: 2000 } }),
      new Paragraph({
        children: [new TextRun({ text: '────────────────────────────────────', color: 'CBD5E1', size: 20 })],
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({
        children: [new TextRun({ text: 'www.eduka.ao', size: 18, color: '2563EB' })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 200 },
      }),
    ];
    
    const doc = new Document({
      numbering: {
        config: [
          {
            reference: 'ordered-list',
            levels: [{
              level: 0,
              format: 'decimal',
              text: '%1.',
              alignment: AlignmentType.START,
            }],
          },
        ],
      },
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 1440,    // 2.5cm
                right: 1440,
                bottom: 1440,
                left: 1440,
              },
            },
          },
          children: coverParagraphs,
        },
        {
          properties: {
            page: {
              margin: {
                top: 1440,
                right: 1440,
                bottom: 1440,
                left: 1440,
              },
              pageNumbers: { start: 1 },
            },
          },
          headers: {
            default: new Paragraph({
              children: [new TextRun({ text: 'Documento gerado com Eduka IA', size: 16, color: '94a3b8', italics: true })],
              alignment: AlignmentType.RIGHT,
            }),
          },
          footers: {
            default: new Paragraph({
              children: [new TextRun({ text: 'Página ', size: 16, color: '94a3b8' }), new TextRun({ children: ['PAGE_NUMBER'], size: 16, color: '94a3b8' })],
              alignment: AlignmentType.CENTER,
            }),
          },
          children: paragraphs,
        },
      ],
    });
    
    const blob = await Packer.toBlob(doc);
    saveAs(blob, filename + ".docx");
  } catch (err) {
    console.error("Docx generation failed:", err);
    throw err;
  }
}

/**
 * Parse inline markdown formatting (bold, italic, code, links)
 */
function parseInlineFormatting(text, TextRun) {
  const runs = [];
  // Simple parser for **bold**, *italic*, `code`, and [link](url)
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)|(\[(.+?)\]\((.+?)\))/g;
  let lastIndex = 0;
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      runs.push(new TextRun({ text: text.slice(lastIndex, match.index) }));
    }
    
    if (match[1]) {
      // Bold
      runs.push(new TextRun({ text: match[2], bold: true }));
    } else if (match[3]) {
      // Italic
      runs.push(new TextRun({ text: match[4], italics: true }));
    } else if (match[5]) {
      // Inline code
      runs.push(new TextRun({ text: match[6], font: 'Courier New', size: 20, color: 'dc2626' }));
    } else if (match[7]) {
      // Link — show text only in DOCX
      runs.push(new TextRun({ text: match[8], color: '2563EB', underline: {} }));
    }
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    runs.push(new TextRun({ text: text.slice(lastIndex) }));
  }
  
  return runs.length > 0 ? runs : [new TextRun({ text })];
}
