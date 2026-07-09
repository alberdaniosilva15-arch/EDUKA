"use client";

import { markdownToHtml, sanitizeHtml } from "@/lib/utils";

const BRAND = {
  ink: "0F172A",
  muted: "64748B",
  blue: "2563EB",
  cyan: "06B6D4",
  gold: "F59E0B",
  paper: "F8FAFC",
  line: "CBD5E1",
};

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getDocumentTitle(markdown, fallback = "Documento Eduka") {
  const heading = markdown.match(/^#\s+(.+)$/m);
  if (heading?.[1]) return heading[1].replace(/[*_`]/g, "").trim();
  const firstLine = markdown.split("\n").find((line) => line.trim().length > 8);
  return firstLine ? firstLine.replace(/^#+\s*/, "").trim().slice(0, 90) : fallback;
}

function stripInlineMarkdown(text) {
  return String(text || "")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .trim();
}

function parseInlineFormatting(text, TextRun) {
  const runs = [];
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)|(\[(.+?)\]\((.+?)\))/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      runs.push(new TextRun({ text: text.slice(lastIndex, match.index), color: BRAND.ink, size: 22 }));
    }

    if (match[1]) {
      runs.push(new TextRun({ text: match[2], bold: true, color: BRAND.ink, size: 22 }));
    } else if (match[3]) {
      runs.push(new TextRun({ text: match[4], italics: true, color: BRAND.ink, size: 22 }));
    } else if (match[5]) {
      runs.push(new TextRun({ text: match[6], font: "Consolas", size: 20, color: BRAND.blue }));
    } else if (match[7]) {
      runs.push(new TextRun({ text: match[8], color: BRAND.blue, underline: {}, size: 22 }));
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    runs.push(new TextRun({ text: text.slice(lastIndex), color: BRAND.ink, size: 22 }));
  }

  return runs.length ? runs : [new TextRun({ text, color: BRAND.ink, size: 22 })];
}

function splitMarkdownRows(line) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => stripInlineMarkdown(cell));
}

export async function exportToPdf(markdown, filename) {
  const title = getDocumentTitle(markdown, filename);
  const bodyHtml = sanitizeHtml(markdownToHtml(markdown));
  const safeFilename = filename.replace(/[^a-zA-Z0-9_-]/g, "_");
  const date = new Date().toLocaleDateString("pt-AO");

  const printCSS = `
    @page { size: A4; margin: 1.8cm 1.7cm; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }
    body {
      font-family: Inter, Arial, sans-serif;
      color: #0f172a;
      line-height: 1.72;
      font-size: 11pt;
      background: white;
    }
    .cover {
      min-height: 88vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      border: 1px solid #dbeafe;
      padding: 34mm 24mm;
      position: relative;
      overflow: hidden;
      page-break-after: always;
    }
    .cover:before {
      content: "";
      position: absolute;
      inset: 0;
      background:
        linear-gradient(135deg, rgba(37,99,235,.10), transparent 45%),
        linear-gradient(315deg, rgba(245,158,11,.14), transparent 40%);
      z-index: 0;
    }
    .cover > * { position: relative; z-index: 1; }
    .brand { color: #2563eb; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; font-size: 10pt; }
    .cover h1 { font-family: Outfit, Arial, sans-serif; font-size: 31pt; line-height: 1.12; margin: 22px 0 18px; color: #0a1e5e; }
    .cover p { max-width: 52ch; color: #475569; margin: 0 0 10px; }
    .cover-line { width: 86px; height: 5px; background: #2563eb; margin-top: 28px; }
    main { counter-reset: h2; }
    h1, h2, h3 { font-family: Outfit, Arial, sans-serif; color: #0a1e5e; page-break-after: avoid; }
    main > h1:first-child { display: none; }
    h1 { font-size: 22pt; margin: 0 0 18px; }
    h2 {
      font-size: 16pt;
      margin: 28px 0 10px;
      padding-bottom: 6px;
      border-bottom: 1px solid #dbeafe;
    }
    h3 { font-size: 13pt; margin: 20px 0 8px; color: #1d4ed8; }
    p { margin: 0 0 9px; text-align: justify; }
    ul, ol { margin: 0 0 12px 20px; padding: 0; }
    li { margin: 0 0 4px; }
    blockquote {
      margin: 14px 0;
      padding: 12px 14px;
      border-left: 4px solid #2563eb;
      background: #eff6ff;
      color: #334155;
      font-style: normal;
    }
    table { width: 100%; border-collapse: collapse; margin: 14px 0 18px; page-break-inside: avoid; }
    th, td { border: 1px solid #cbd5e1; padding: 7px 9px; text-align: left; vertical-align: top; }
    th { background: #eff6ff; color: #0a1e5e; font-weight: 700; }
    img { max-width: 100%; height: auto; border: 1px solid #e2e8f0; border-radius: 8px; margin: 10px 0 4px; }
    code { background: #f1f5f9; padding: 1px 4px; border-radius: 4px; color: #1d4ed8; }
    pre { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; white-space: pre-wrap; }
    .doc-footer { margin-top: 28px; padding-top: 8px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 8pt; text-align: center; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      h2, h3, blockquote, table { page-break-inside: avoid; }
    }
  `;

  const htmlDoc = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <title>${escapeHtml(safeFilename)}</title>
    <style>${printCSS}</style>
  </head>
  <body>
    <section class="cover">
      <div class="brand">Eduka IA</div>
      <h1>${escapeHtml(title)}</h1>
      <p>Documento academico gerado e formatado para leitura, revisao e exportacao.</p>
      <p>${escapeHtml(date)}</p>
      <div class="cover-line"></div>
    </section>
    <main>${bodyHtml}</main>
    <div class="doc-footer">Gerado com Eduka IA</div>
  </body>
</html>`;

  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:none;opacity:0;pointer-events:none;";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow.document;
  doc.open();
  doc.write(htmlDoc);
  doc.close();

  await new Promise((resolve) => setTimeout(resolve, 500));

  try {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
  } finally {
    setTimeout(() => iframe.remove(), 2000);
  }
}

export async function exportToDocx(markdown, filename) {
  const {
    AlignmentType,
    BorderStyle,
    Document,
    Footer,
    Header,
    HeadingLevel,
    Packer,
    PageBreak,
    PageNumber,
    Paragraph,
    ShadingType,
    Table,
    TableCell,
    TableRow,
    TextRun,
    WidthType,
  } = await import("docx");
  const { saveAs } = await import("file-saver");

  const title = getDocumentTitle(markdown, filename);
  const children = [];
  const lines = markdown.split("\n");
  let tableBuffer = [];

  function flushTable() {
    if (tableBuffer.length < 2) {
      tableBuffer = [];
      return;
    }

    const rows = tableBuffer
      .filter((line) => !/^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line))
      .map((line, rowIndex) => {
        const cells = splitMarkdownRows(line);
        return new TableRow({
          children: cells.map((cell) => new TableCell({
            width: { size: Math.floor(100 / Math.max(cells.length, 1)), type: WidthType.PERCENTAGE },
            shading: rowIndex === 0 ? { type: ShadingType.CLEAR, color: "auto", fill: "EFF6FF" } : undefined,
            children: [
              new Paragraph({
                children: [new TextRun({ text: cell, bold: rowIndex === 0, color: rowIndex === 0 ? "0A1E5E" : BRAND.ink, size: 20 })],
              }),
            ],
          })),
        });
      });

    children.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows,
    }));
    children.push(new Paragraph({ text: "", spacing: { after: 180 } }));
    tableBuffer = [];
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (line.trim().startsWith("|") && line.includes("|")) {
      tableBuffer.push(line);
      continue;
    }

    flushTable();
    if (!line.trim()) continue;

    const imageMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
    if (imageMatch) {
      children.push(new Paragraph({
        children: [new TextRun({ text: `Figura recomendada: ${imageMatch[1] || "imagem"}`, bold: true, color: BRAND.blue, size: 22 })],
        spacing: { before: 160, after: 60 },
        border: { left: { style: BorderStyle.SINGLE, size: 6, color: BRAND.cyan, space: 8 } },
      }));
      children.push(new Paragraph({
        children: [new TextRun({ text: imageMatch[2], color: BRAND.muted, size: 18 })],
        spacing: { after: 160 },
      }));
      continue;
    }

    if (line.startsWith("### ")) {
      children.push(new Paragraph({
        children: [new TextRun({ text: stripInlineMarkdown(line.slice(4)), bold: true, color: BRAND.blue, size: 26 })],
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 220, after: 90 },
      }));
    } else if (line.startsWith("## ")) {
      children.push(new Paragraph({
        children: [new TextRun({ text: stripInlineMarkdown(line.slice(3)), bold: true, color: "0A1E5E", size: 30 })],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 320, after: 130 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "DBEAFE", space: 4 } },
      }));
    } else if (line.startsWith("# ")) {
      children.push(new Paragraph({
        children: [new TextRun({ text: stripInlineMarkdown(line.slice(2)), bold: true, color: "0A1E5E", size: 36 })],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 260, after: 180 },
      }));
    } else if (line.startsWith("> ")) {
      children.push(new Paragraph({
        children: parseInlineFormatting(line.slice(2), TextRun),
        shading: { type: ShadingType.CLEAR, color: "auto", fill: "EFF6FF" },
        border: { left: { style: BorderStyle.SINGLE, size: 8, color: BRAND.blue, space: 10 } },
        spacing: { before: 140, after: 140 },
        indent: { left: 240 },
      }));
    } else if (/^[-*+]\s+/.test(line)) {
      children.push(new Paragraph({
        children: parseInlineFormatting(line.replace(/^[-*+]\s+/, ""), TextRun),
        bullet: { level: 0 },
        spacing: { before: 50, after: 50 },
      }));
    } else if (/^\d+\.\s+/.test(line)) {
      children.push(new Paragraph({
        children: parseInlineFormatting(line.replace(/^\d+\.\s+/, ""), TextRun),
        numbering: { reference: "ordered-list", level: 0 },
        spacing: { before: 50, after: 50 },
      }));
    } else if (/^---+$/.test(line.trim())) {
      children.push(new Paragraph({
        children: [new TextRun({ text: "" })],
        border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: BRAND.line, space: 4 } },
        spacing: { before: 180, after: 180 },
      }));
    } else {
      children.push(new Paragraph({
        children: parseInlineFormatting(line, TextRun),
        spacing: { before: 65, after: 65 },
      }));
    }
  }
  flushTable();

  const cover = [
    new Paragraph({ text: "", spacing: { before: 2400 } }),
    new Paragraph({
      children: [new TextRun({ text: "Eduka IA", bold: true, color: BRAND.blue, size: 30, allCaps: true })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 160 },
    }),
    new Paragraph({
      children: [new TextRun({ text: title, bold: true, color: "0A1E5E", size: 46 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 260 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "Documento academico formatado para revisao e entrega", color: BRAND.muted, size: 24 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
    }),
    new Paragraph({
      children: [new TextRun({ text: new Date().toLocaleDateString("pt-AO"), color: BRAND.muted, size: 20 })],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({ children: [new PageBreak()] }),
  ];

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: "Aptos", size: 22, color: BRAND.ink },
          paragraph: { spacing: { line: 330 } },
        },
      },
    },
    numbering: {
      config: [
        {
          reference: "ordered-list",
          levels: [{ level: 0, format: "decimal", text: "%1.", alignment: AlignmentType.START }],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: { margin: { top: 1440, right: 1260, bottom: 1440, left: 1260 } },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [new TextRun({ text: "Eduka IA", color: BRAND.blue, bold: true, size: 16 })],
                alignment: AlignmentType.RIGHT,
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: "Pagina ", color: BRAND.muted, size: 16 }),
                  new TextRun({ children: [PageNumber.CURRENT], color: BRAND.muted, size: 16 }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        },
        children: [...cover, ...children],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${filename}.docx`);
}
