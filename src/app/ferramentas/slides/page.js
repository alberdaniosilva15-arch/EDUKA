"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { generateProfessionalPptx } from "@/lib/professional-slides-generator";
import { getFastModels, getEfficientModels } from "@/lib/free-models";

export default function SlidesPage() {
  const [topic, setTopic] = useState("");
  const [numSlides, setNumSlides] = useState(5);
  const [style, setStyle] = useState("académico formal");
  const [speed, setSpeed] = useState("eficiente");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generatedSlides, setGeneratedSlides] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const models = speed === "rapido" ? getFastModels() : getEfficientModels();
    const model = models[0];

    try {
      const res = await fetch("/api/slides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, numSlides, style, model: model.id }),
      });

      if (res.status === 401) {
        window.location.href = "/login?redirect=/ferramentas/slides";
        return;
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro ${res.status} na API`);
      }

      const data = await res.json();
      setGeneratedSlides(data.slides);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedSlides) return;
    try {
      await generateProfessionalPptx(generatedSlides, "Apresentacao_-_" + topic.substring(0, 15).replace(/\s+/g, '_'));
    } catch (err) {
      console.error(err);
      alert("Erro ao exportar PPTX.");
    }
  };

  return (
    <>
      <Navbar />
      <div className="tool-page animate-fade-in-up">
      <div className="tool-header">
        <div className="container">
          <Link href="/ferramentas" className="back-link">
            &larr; Voltar às ferramentas
          </Link>
          <div className="title-wrapper">
            <span className="tool-icon gradient-text">📊</span>
            <h1>Gerador de <span className="shader-text shader-red">Slides</span></h1>
          </div>
          <p>Transforma um tema numa apresentação clara, bem estruturada e pronta a exportar para PowerPoint.</p>
        </div>
      </div>

      <div className="container">
        <div className="tool-grid">
          {/* LADO ESQUERDO: Input */}
          <div className="tool-input-section glass-panel">
            <form onSubmit={handleSubmit} className="tool-form">
              <div className="form-group">
                <label className="form-label" htmlFor="topic">
                  Tema da Apresentação <span className="required">*</span>
                </label>
                <textarea
                  id="topic"
                  className="form-textarea"
                  placeholder="Ex: Inteligência Artificial na Educação Angolana..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="numSlides">
                    Número de Slides
                  </label>
                  <select
                    id="numSlides"
                    className="form-select"
                    value={numSlides}
                    onChange={(e) => setNumSlides(parseInt(e.target.value))}
                  >
                    <option value={3}>3 slides</option>
                    <option value={5}>5 slides</option>
                    <option value={10}>10 slides</option>
                    <option value={15}>15 slides</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="style">
                    Estilo
                  </label>
                  <select
                    id="style"
                    className="form-select"
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                  >
                    <option value="académico formal">Académico</option>
                    <option value="criativo">Criativo</option>
                    <option value="empresarial visual">Empresarial</option>
                  </select>
                </div>
              </div>

              {/* Speed selector — simples */}
              <div className="form-group">
                <label className="form-label">Velocidade</label>
                <div className="speed-options">
                  <button
                    type="button"
                    className={`speed-btn ${speed === "rapido" ? "active" : ""}`}
                    onClick={() => setSpeed("rapido")}
                  >
                    ⚡ Rápido
                  </button>
                  <button
                    type="button"
                    className={`speed-btn ${speed === "eficiente" ? "active" : ""}`}
                    onClick={() => setSpeed("eficiente")}
                  >
                    🧠 Eficiente
                  </button>
                </div>
              </div>

              {error && <div className="error-message">{error}</div>}

              <button
                type="submit"
                className="btn btn-primary w-100 generate-btn"
                disabled={loading || !topic}
              >
                {loading ? (
                  <>
                    <span className="spinner-small"></span>
                    A gerar slides...
                  </>
                ) : (
                  "Gerar Apresentação"
                )}
              </button>
            </form>
          </div>

          {/* LADO DIREITO: Output */}
          <div className="tool-output-section glass-panel">
            {!generatedSlides && !loading && (
              <div className="empty-state">
                <div className="empty-icon">📊</div>
                <h3>Resultados aqui</h3>
                <p>A tua apresentação aparecerá nesta secção.</p>
              </div>
            )}

            {loading && (
              <div className="loading-state">
                <div className="spinner"></div>
                <div className="loading-text">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                  A estruturar {numSlides} slides...
                </div>
              </div>
            )}

            {generatedSlides && !loading && (
              <div className="result-container animate-fade-in">
                <div className="result-header">
                  <h3>Pré-visualização</h3>
                  <button onClick={handleDownload} className="btn btn-primary">
                    Baixar .PPTX
                  </button>
                </div>

                <div className="slides-preview">
                  {generatedSlides.map((slide, index) => (
                    <div key={index} className="slide-card">
                      <div className="slide-number">Slide {index + 1}</div>
                      <div className="slide-meta">{slide.visual?.type || slide.layout || "visual"}</div>
                      <h4 className="slide-title">{slide.title}</h4>
                      {slide.keyMessage && <h5 className="slide-subtitle">{slide.keyMessage}</h5>}
                      {(slide.bullets || slide.content) && (
                        <ul className="slide-bullets">
                          {(slide.bullets || slide.content || []).map((point, i) => (
                            <li key={i}>{point}</li>
                          ))}
                        </ul>
                      )}
                      {slide.visual && (
                        <div className="visual-plan">
                          <strong>{slide.visual.type || "visual"}</strong>
                          <span>{slide.visual.caption || slide.visual.prompt}</span>
                        </div>
                      )}
                      {slide.evidence && (
                        <div className="example-box">
                          <strong>{slide.evidence.type}: {slide.evidence.source}</strong>
                          <span>{slide.evidence.text}</span>
                        </div>
                      )}
                    </div>
                  ))}
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
          margin-bottom: var(--space-8);
        }
        .back-link {
          display: inline-block;
          color: var(--slate-400);
          margin-bottom: var(--space-4);
          font-size: var(--fs-sm);
          transition: color 0.2s;
        }
        .back-link:hover {
          color: var(--text-main);
        }
        .title-wrapper {
          display: flex;
          align-items: center;
          gap: var(--space-4);
          margin-bottom: var(--space-2);
        }
        .tool-icon {
          font-size: var(--fs-4xl);
        }
        .tool-header h1 {
          font-size: var(--fs-3xl);
        }
        .tool-header p {
          max-width: 600px;
        }
        .tool-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-6);
          margin-bottom: var(--space-12);
        }
        @media(min-width: 992px) {
          .tool-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        .glass-panel {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-xl);
          padding: var(--space-6);
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-4);
        }
        .speed-options {
          display: flex;
          gap: var(--space-2);
        }
        .speed-btn {
          flex: 1;
          padding: var(--space-3) var(--space-4);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-md);
          background: transparent;
          color: var(--slate-400);
          font-size: var(--fs-sm);
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .speed-btn:hover {
          border-color: var(--blue-500);
          color: var(--text-main);
        }
        .speed-btn.active {
          background: rgba(37, 99, 235, 0.15);
          border-color: var(--blue-500);
          color: var(--blue-300);
        }
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
          color: var(--slate-500);
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
          margin-bottom: var(--space-6);
          padding-bottom: var(--space-4);
          border-bottom: 1px solid var(--glass-border);
        }
        .slides-preview {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
          max-height: 600px;
          overflow-y: auto;
          padding-right: var(--space-2);
        }
        .slide-card {
          background: rgba(0, 0, 0, 0.1);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-md);
          padding: var(--space-4);
          position: relative;
        }
        .slide-number {
          position: absolute;
          top: var(--space-2);
          right: var(--space-2);
          font-size: 0.7rem;
          color: var(--text-muted);
          background: var(--glass-bg);
          padding: 2px 6px;
          border-radius: var(--radius-sm);
        }
        .slide-meta {
          display: inline-flex;
          margin-bottom: var(--space-2);
          padding: 2px 8px;
          border-radius: var(--radius-sm);
          background: rgba(37, 99, 235, 0.15);
          color: var(--blue-300);
          font-size: var(--fs-xs);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .slide-title {
          font-size: var(--fs-lg);
          margin-bottom: var(--space-2);
          padding-right: 50px;
        }
        .slide-subtitle {
          color: var(--slate-400);
          font-weight: normal;
          margin-bottom: var(--space-3);
        }
        .slide-bullets {
          margin-left: var(--space-4);
          color: var(--slate-300);
          font-size: var(--fs-sm);
        }
        .slide-bullets li {
          margin-bottom: var(--space-1);
        }
        .visual-plan,
        .example-box {
          margin-top: var(--space-3);
          padding: var(--space-3);
          border-radius: var(--radius-md);
          border: 1px solid var(--glass-border);
          display: grid;
          gap: 2px;
          font-size: var(--fs-xs);
          color: var(--slate-300);
        }
        .visual-plan {
          background: rgba(37, 99, 235, 0.08);
        }
        .example-box {
          background: rgba(245, 158, 11, 0.08);
        }
        .visual-plan strong,
        .example-box strong {
          color: var(--text-main);
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
        .error-message {
          background: rgba(220, 38, 38, 0.12);
          border: 1px solid rgba(220, 38, 38, 0.3);
          color: #fca5a5;
          padding: var(--space-3) var(--space-4);
          border-radius: var(--radius-md);
          font-size: var(--fs-sm);
          margin-top: var(--space-3);
        }
      `}</style>
    </div>
    <Footer />
    </>
  );
}
