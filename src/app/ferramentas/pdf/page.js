"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ExportMenu from "@/components/ExportMenu";
import { markdownToHtml, sanitizeHtml } from "@/lib/utils";

// Importacao dinamica do pdf-parser (so funciona no browser)
const PdfParser = dynamic(
  () => import("@/lib/pdf-parser"),
  { ssr: false }
);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["application/pdf"];

export default function PdfStudyPage() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState("");
  const [resultTitle, setResultTitle] = useState("");
  const [mode, setMode] = useState("text"); // "text" | "vision"
  const [progress, setProgress] = useState("");
  const [showMap, setShowMap] = useState(true);
  const fileInputRef = useRef(null);

  const handleFileSelect = useCallback(async (e) => {
    const selected = Array.from(e.target.files || []);
    setError(null);

    // Validar
    const invalid = selected.find((f) => !ALLOWED_TYPES.includes(f.type));
    if (invalid) {
      setError("Apenas ficheiros PDF sao permitidos.");
      return;
    }
    const tooBig = selected.find((f) => f.size > MAX_FILE_SIZE);
    if (tooBig) {
      setError("Cada PDF deve ter no maximo 10MB.");
      return;
    }

    setFiles(selected);
    if (selected.length > 0) {
      setResultTitle(selected.length === 1 ? selected[0].name.replace(/\.pdf$/i, "") : `${selected.length} PDFs selecionados`);
    }
  }, []);

  const handleSubmit = async () => {
    if (files.length === 0) return;
    setLoading(true);
    setError(null);
    setResult("");
    setProgress("A extrair texto dos PDFs...");

    try {
      const parser = await PdfParser;
      let allText = "";
      let allImages = [];
      const fileNames = [];

      for (const file of files) {
        fileNames.push(file.name);
        setProgress(`A processar: ${file.name}...`);

        // Extrair texto
        const { text, pages } = await parser.extractPdfTextFromFile(file);
        allText += `--- ${file.name} (${pages} paginas) ---\n\n${text}\n\n`;

        // Se modo vision, converter para imagens
        if (mode === "vision") {
          const images = await parser.pdfFileToImages(file, 10);
          allImages.push(...images);
        }
      }

      setProgress("A analisar o conteudo com IA...");

      // Enviar para API
      const res = await fetch("/api/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: allText,
          images: mode === "vision" ? allImages : [],
          filename: fileNames.join(", "),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao analisar PDF.");
      }

      setResult(data.markdown);
      if (data.title) setResultTitle(data.title);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setProgress("");
    }
  };

  const handleReset = () => {
    setFiles([]);
    setResult("");
    setResultTitle("");
    setError(null);
    setProgress("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Parse do resultado para extrair o mapa conceptual
  const extractMapSection = (markdown) => {
    const mapMatch = markdown.match(/## Mapa Conceptual\n\n```([\s\S]*?)```/);
    return mapMatch ? mapMatch[1].trim() : null;
  };

  const extractSummarySection = (markdown) => {
    // Remove a seccao do mapa conceptual para mostrar o resto
    return markdown.replace(/## Mapa Conceptual\n\n```[\s\S]*?```\n\n/, "");
  };

  const mapContent = result ? extractMapSection(result) : null;
  const summaryContent = result ? extractSummarySection(result) : null;

  return (
    <>
      <Navbar />
      <div className="tool-page animate-fade-in-up">
        <div className="tool-header">
          <div className="container">
            <Link href="/ferramentas" className="back-link">
              &larr; Voltar as ferramentas
            </Link>
            <div className="title-wrapper">
              <span className="tool-icon gradient-text">📄</span>
              <h1>Estudar PDF</h1>
            </div>
            <p>Carrega um ou mais PDFs e a IA cria um resumo estruturado com mapa conceptual, conceitos-chave, detalhes e exercicios.</p>
          </div>
        </div>

        <div className="container">
          <div className="tool-grid">
            {/* LADO ESQUERDO: Upload */}
            <div className="tool-input-section glass-panel">
              <form className="tool-form" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                <div className="form-group">
                  <label className="form-label">
                    Carregar PDF(s) <span className="required">*</span>
                  </label>
                  <div
                    className="upload-zone"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const dt = e.dataTransfer;
                      if (dt.files) handleFileSelect({ target: { files: dt.files } });
                    }}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf"
                      multiple
                      onChange={handleFileSelect}
                      style={{ display: "none" }}
                    />
                    <div className="upload-icon">📂</div>
                    <p className="upload-text">
                      {files.length > 0
                        ? `${files.length} PDF(s) selecionado(s)`
                        : "Clique ou arraste PDFs aqui"}
                    </p>
                    <p className="upload-hint">Max 10MB cada, formato PDF</p>
                    {files.length > 0 && (
                      <div className="file-list">
                        {files.map((f, i) => (
                          <div key={i} className="file-item">
                            <span>📄 {f.name}</span>
                            <span className="file-size">{(f.size / 1024 / 1024).toFixed(1)}MB</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Modo de analise</label>
                  <div className="mode-toggle">
                    <button
                      type="button"
                      className={`mode-btn ${mode === "text" ? "active" : ""}`}
                      onClick={() => setMode("text")}
                    >
                      📝 Texto
                    </button>
                    <button
                      type="button"
                      className={`mode-btn ${mode === "vision" ? "active" : ""}`}
                      onClick={() => setMode("vision")}
                    >
                      👁️ Visao (recomendado)
                    </button>
                  </div>
                  <p className="form-hint">
                    {mode === "vision"
                      ? "Modo visao: usa IA para ver graficos, tabelas e imagens do PDF (mais preciso)"
                      : "Modo texto: extrai apenas texto do PDF (mais rapido)"}
                  </p>
                </div>

                {error && <div className="error-message">{error}</div>}

                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn btn-primary w-100 generate-btn"
                    disabled={loading || files.length === 0}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-small"></span>
                        {progress || "A analisar..."}
                      </>
                    ) : (
                      <>
                        <span className="btn-icon">✨</span>
                        Analisar PDF(s)
                      </>
                    )}
                  </button>
                  {result && (
                    <button
                      type="button"
                      className="btn btn-outline w-100"
                      onClick={handleReset}
                      style={{ marginTop: "var(--space-2)" }}
                    >
                      🔄 Novo PDF
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* LADO DIREITO: Resultado */}
            <div className="tool-output-section glass-panel">
              {!result && !loading && (
                <div className="empty-state">
                  <div className="empty-icon">📄</div>
                  <h3>Material de estudo aqui</h3>
                  <p>O resumo estruturado com mapa conceptual aparecera apos a analise.</p>
                </div>
              )}

              {loading && (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <div className="loading-text">
                    <span className="dot"></span>
                    <span className="dot"></span>
                    <span className="dot"></span>
                    {progress || "A processar..."}
                  </div>
                </div>
              )}

              {result && !loading && (
                <div className="result-container animate-fade-in">
                  <div className="result-header">
                    <h3>{resultTitle || "Analise do PDF"}</h3>
                    <div className="result-actions">
                      <button
                        className="btn btn-sm"
                        onClick={() => setShowMap(!showMap)}
                        title="Alternar mapa conceptual"
                      >
                        {showMap ? "📋 Mostrar resumo" : "🗺️ Mostrar mapa"}
                      </button>
                      <ExportMenu markdown={result} filename={"Estudo_PDF_-_" + resultTitle.replace(/[^a-zA-Z0-9_-]/g, "_")} />
                    </div>
                  </div>

                  <div className="result-tabs">
                    {showMap && mapContent && (
                      <div className="map-container glass-card">
                        <h4>🗺️ Mapa Conceptual</h4>
                        <pre className="concept-map">{mapContent}</pre>
                      </div>
                    )}
                    {(!showMap || !mapContent) && summaryContent && (
                      <div
                        className="result-content"
                        dangerouslySetInnerHTML={{
                          __html: sanitizeHtml(markdownToHtml(summaryContent)),
                        }}
                      ></div>
                    )}
                    {showMap && mapContent && summaryContent && (
                      <div className="result-content" style={{ marginTop: "var(--space-4)" }}>
                        <h4>📋 Resumo Detalhado</h4>
                        <div
                          dangerouslySetInnerHTML={{
                            __html: sanitizeHtml(markdownToHtml(summaryContent)),
                          }}
                        ></div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <style jsx>{`
          .tool-page {
            padding-top: var(--nav-height);
            min-height: 100vh;
            background: var(--bg-main);
          }
          .tool-header {
            padding: var(--space-8) 0;
            border-bottom: 1px solid var(--glass-border);
            margin-bottom: var(--space-12);
          }
          .back-link {
            display: inline-block;
            color: var(--slate-400);
            margin-bottom: var(--space-4);
            font-size: var(--fs-sm);
            transition: color 0.2s;
          }
          .back-link:hover { color: var(--text-main); }
          .title-wrapper {
            display: flex;
            align-items: center;
            gap: var(--space-4);
            margin-bottom: var(--space-2);
          }
          .tool-icon { font-size: var(--fs-4xl); }
          .tool-header h1 { font-size: var(--fs-3xl); }
          .tool-header p { max-width: 600px; }
          .tool-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: var(--space-6);
          }
          @media(min-width: 992px) {
            .tool-grid { grid-template-columns: 1fr 1.5fr; }
          }
          .glass-panel {
            background: var(--glass-bg);
            border: 1px solid var(--glass-border);
            border-radius: var(--radius-xl);
            padding: var(--space-6);
          }
          .upload-zone {
            border: 2px dashed var(--glass-border);
            border-radius: var(--radius-lg);
            padding: var(--space-8);
            text-align: center;
            cursor: pointer;
            transition: all 0.3s;
          }
          .upload-zone:hover {
            border-color: var(--accent);
            background: rgba(255,255,255,0.03);
          }
          .upload-icon { font-size: 3rem; margin-bottom: var(--space-3); }
          .upload-text { color: var(--text-main); font-weight: 600; margin-bottom: var(--space-1); }
          .upload-hint { color: var(--text-muted); font-size: var(--fs-sm); }
          .file-list {
            margin-top: var(--space-4);
            text-align: left;
          }
          .file-item {
            display: flex;
            justify-content: space-between;
            padding: var(--space-2);
            background: rgba(255,255,255,0.05);
            border-radius: var(--radius-md);
            margin-bottom: var(--space-1);
          }
          .file-size { color: var(--text-muted); font-size: var(--fs-sm); }
          .mode-toggle {
            display: flex;
            gap: var(--space-2);
            margin-bottom: var(--space-2);
          }
          .mode-btn {
            flex: 1;
            padding: var(--space-3);
            border: 1px solid var(--glass-border);
            border-radius: var(--radius-md);
            background: transparent;
            color: var(--text-main);
            cursor: pointer;
            font-family: var(--font-body);
            font-size: var(--fs-sm);
            transition: all 0.2s;
          }
          .mode-btn.active {
            background: var(--accent);
            color: var(--bg-main);
            border-color: var(--accent);
          }
          .form-hint { color: var(--text-muted); font-size: var(--fs-xs); margin-top: 0; }
          .generate-btn {
            margin-top: var(--space-4);
            padding: var(--space-4);
            font-size: var(--fs-lg);
          }
          .empty-state, .loading-state {
            height: 100%;
            min-height: 400px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            color: var(--text-muted);
          }
          .empty-icon {
            font-size: 4rem;
            opacity: 0.3;
            margin-bottom: var(--space-4);
          }
          .result-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: var(--space-4);
            padding-bottom: var(--space-4);
            border-bottom: 1px solid var(--glass-border);
            flex-wrap: wrap;
            gap: var(--space-2);
          }
          .result-header h3 { margin: 0; }
          .result-actions {
            display: flex;
            gap: var(--space-2);
            align-items: center;
          }
          .btn-sm {
            padding: var(--space-2) var(--space-3);
            font-size: var(--fs-sm);
            border: 1px solid var(--glass-border);
            border-radius: var(--radius-md);
            background: transparent;
            color: var(--text-main);
            cursor: pointer;
          }
          .btn-sm:hover { background: rgba(255,255,255,0.08); }
          .result-tabs { min-height: 300px; }
          .map-container {
            padding: var(--space-4);
            margin-bottom: var(--space-4);
          }
          .map-container h4 { margin: 0 0 var(--space-3); }
          .concept-map {
            font-family: "Courier New", monospace;
            font-size: var(--fs-sm);
            line-height: 1.6;
            color: var(--text-main);
            white-space: pre;
            overflow-x: auto;
            background: rgba(255,255,255,0.03);
            padding: var(--space-4);
            border-radius: var(--radius-md);
          }
          .result-content {
            max-height: 600px;
            overflow-y: auto;
            padding-right: var(--space-2);
          }
          .spinner-small {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 2px solid var(--glass-border);
            border-top-color: var(--text-main);
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          .form-actions { display: flex; flex-direction: column; }
        `}</style>
      </div>
      <Footer />
    </>
  );
}
