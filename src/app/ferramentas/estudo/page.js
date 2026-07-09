"use client";

import { useState } from "react";
import Link from "next/link";
import ExportMenu from "@/components/ExportMenu";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { markdownToHtml, sanitizeHtml } from "@/lib/utils";

export default function EstudoPage() {
  const [topic, setTopic] = useState("");
  const [timeframe, setTimeframe] = useState("");
  const [course, setCourse] = useState("");
  const [difficulty, setDifficulty] = useState("média");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult("");

    try {
      const res = await fetch("/api/estudo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, timeframe, course, difficulty, model: "gemini" }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro na API");
      }

      const data = await res.json();
      setResult(data.markdown);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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
            <span className="tool-icon gradient-text">📅</span>
            <h1>Plano de Estudo</h1>
          </div>
          <p>Diz-nos o que precisas de aprender e quanto tempo tens. A IA criará um roteiro passo-a-passo para ti.</p>
        </div>
      </div>

      <div className="container">
        <div className="tool-grid">
          {/* LADO ESQUERDO: Input */}
          <div className="tool-input-section glass-panel">
            <form onSubmit={handleSubmit} className="tool-form">
              <div className="form-group">
                <label className="form-label" htmlFor="topic">
                  O que precisas estudar? <span className="required">*</span>
                </label>
                <input
                  id="topic"
                  type="text"
                  className="form-input"
                  placeholder="Ex: Anatomia Humana, Cálculo II, História Moderna..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="course">
                  Teu Curso (opcional)
                </label>
                <input
                  id="course"
                  type="text"
                  className="form-input"
                  placeholder="Ex: Medicina, Engenharia Informática..."
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="timeframe">
                    Tempo Disponível <span className="required">*</span>
                  </label>
                  <input
                    id="timeframe"
                    type="text"
                    className="form-input"
                    placeholder="Ex: 2 semanas ou 5 dias"
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="difficulty">
                    Profundidade
                  </label>
                  <select
                    id="difficulty"
                    className="form-select"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                  >
                    <option value="básica">Básica (Revisão rápida)</option>
                    <option value="média">Média (Bom entendimento)</option>
                    <option value="avançada">Avançada (Domínio total)</option>
                  </select>
                </div>
              </div>

              {error && <div className="error-message">{error}</div>}

              <button
                type="submit"
                className="btn btn-primary w-100 generate-btn"
                disabled={loading || !topic || !timeframe}
              >
                {loading ? (
                  <>
                    <span className="spinner-small"></span>
                    A planear o teu estudo...
                  </>
                ) : (
                  <>
                    <span className="btn-icon">✨</span>
                    Gerar Plano
                  </>
                )}
              </button>
            </form>
          </div>

          {/* LADO DIREITO: Output */}
          <div className="tool-output-section glass-panel">
            {!result && !loading && (
              <div className="empty-state">
                <div className="empty-icon">📅</div>
                <h3>Resultados aqui</h3>
                <p>O teu plano de estudo optimizado aparecerá nesta secção.</p>
              </div>
            )}

            {loading && (
              <div className="loading-state">
                <div className="spinner"></div>
                <div className="loading-text">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                  A distribuir a carga horária com a IA...
                </div>
              </div>
            )}

            {result && !loading && (
              <div className="result-container animate-fade-in">
                <div className="result-header">
                  <h3>O Teu Plano de Estudo</h3>
                  <ExportMenu markdown={result} filename={"Plano_Estudo_-_" + topic.replace(/\s+/g, "_")} />
                </div>
                <div className="result-content glass-card" dangerouslySetInnerHTML={{ __html: sanitizeHtml(markdownToHtml(result)) }}></div>
              </div>
            )}
          </div>
        </div>
      </div>
{/* SCSS/JSX configs identical to other tools to match Premium aspect */}
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
        }
        @media(min-width: 992px) {
          .tool-grid {
            grid-template-columns: 1fr 1.5fr;
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
          margin-bottom: var(--space-6);
          padding-bottom: var(--space-4);
          border-bottom: 1px solid var(--glass-border);
        }
        .result-content {
          padding-right: var(--space-4);
          max-height: 600px;
          overflow-y: auto;
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
      `}</style>
      </div>
      <Footer />
    </>
  );
}
