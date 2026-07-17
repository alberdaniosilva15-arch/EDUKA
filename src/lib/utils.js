/**
 * Eduka — Utilitários
 * sanitizeHtml funciona tanto em SSR como no browser (isomorphic)
 */
import DOMPurify from 'isomorphic-dompurify';
import { marked } from 'marked';

// Configurar marked para output limpo
marked.setOptions({
  breaks: true,
  gfm: true,
});

/**
 * Sanitiza HTML para prevenir XSS (funciona em SSR e browser)
 */
export function sanitizeHtml(html) {
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
  // NOTA: A defesa primária contra prompt injection é estrutural —
  // provider-router.js separa system de user. Este filtro é complementar.
  return input
    .replace(/<\|im_start\|>/g, '')   // ChatGPT/claude chat template
    .replace(/<\|im_end\|>/g, '')
    .replace(/\[INST\]/g, '')         // Llama instruction markers
    .replace(/\[\/INST\]/g, '')
    .replace(/<\|system\|>/g, '')     // Role injection markers
    .replace(/<\|user\|>/g, '')
    .replace(/<\|assistant\|>/g, '')
    .replace(/\n{3,}/g, '\n\n')      // Limita quebras de linha consecutivas
    .trim()
    .slice(0, 5000);
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
