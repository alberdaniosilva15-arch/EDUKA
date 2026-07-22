"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { markdownToHtml, copyToClipboard, sanitizeHtml } from "@/lib/utils";
import ExportMenu from "@/components/ExportMenu";

const loadingMessages = [
  "A analisar o tema...",
  "A pesquisar referências...",
  "A estruturar o trabalho...",
  "A redigir introdução...",
  "A desenvolver conteúdo...",
  "A formatar conclusão...",
  "A compilar bibliografia...",
  "Quase pronto...",
];

export default function TrabalhoPage() {
  const [form, setForm] = useState({
    tema: "",
    curso: "",
    nivel: "universitario",
    paginas: "5",
    requisitos: "",
  });
  const [result, setResult] = useState("");
  const [rawResult, setRawResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    setResult("");
    setRawResult("");

    // Cycling loading messages
    let msgIdx = 0;
    setLoadingMsg(loadingMessages[0]);
    intervalRef.current = setInterval(() => {
      msgIdx = (msgIdx + 1) % loadingMessages.length;
      setLoadingMsg(loadingMessages[msgIdx]);
    }, 3000);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao gerar trabalho.");
      }

      setRawResult(data.result);
      setResult(sanitizeHtml(markdownToHtml(data.result)));
    } catch (err) {
      setError(err.message);
    } finally {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await copyToClipboard(rawResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // The handleDownload is not needed anymore since ExportMenu takes care of it

  return (
    <>
      <Navbar />
      <div className="tool-page">
        <div className="container">
          <div className="tool-header animate-fade-in-up">
            <Link href="/ferramentas" className="badge badge-blue" style={{ marginBottom: "var(--space-4)", display: "inline-flex", textDecoration: "none" }}>
              ← Voltar às ferramentas
            </Link>
            <h1>
              📝 Gerador de{" "}
              <span className="shader-text shader-red">Trabalhos</span>
            </h1>
            <p>
              Insere o tema e os detalhes. A IA gera um trabalho académico
              completo e estruturado.
            </p>
          </div>

          {!result && !loading && (
            <div className="tool-form-container animate-fade-in-up delay-2">
              <form
                className="tool-form glass-card"
                onSubmit={handleSubmit}
                id="form-trabalho"
              >
                <div className="form-group">
                  <label className="form-label" htmlFor="tema">
                    Tema do trabalho *
                  </label>
                  <input
                    className="form-input"
                    type="text"
                    id="tema"
                    name="tema"
                    placeholder="Ex: A importância da educação financeira em Angola"
                    value={form.tema}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="curso">
                      Curso
                    </label>
                    <input
                      className="form-input"
                      type="text"
                      id="curso"
                      name="curso"
                      placeholder="Ex: Economia"
                      value={form.curso}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="nivel">
                      Nível
                    </label>
                    <select
                      className="form-select"
                      id="nivel"
                      name="nivel"
                      value={form.nivel}
                      onChange={handleChange}
                    >
                      <option value="medio">Ensino Médio</option>
                      <option value="universitario">Universitário</option>
                      <option value="pos-graduacao">Pós-Graduação</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="paginas">
                    Número de páginas estimado
                  </label>
                  <select
                    className="form-select"
                    id="paginas"
                    name="paginas"
                    value={form.paginas}
                    onChange={handleChange}
                  >
                    <option value="3">3-5 páginas</option>
                    <option value="5">5-8 páginas</option>
                    <option value="10">10-15 páginas</option>
                    <option value="20">20+ páginas</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="requisitos">
                    Requisitos adicionais (opcional)
                  </label>
                  <textarea
                    className="form-textarea"
                    id="requisitos"
                    name="requisitos"
                    placeholder="Ex: Incluir um capítulo sobre legislação angolana, usar normas APA..."
                    value={form.requisitos}
                    onChange={handleChange}
                  ></textarea>
                </div>

                {error && (
                  <div style={{ color: "var(--error)", fontSize: "var(--fs-sm)" }}>
                    ⚠️ {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  id="submit-trabalho"
                  disabled={loading}
                  aria-busy={loading}
                >
                  {loading ? "A processar..." : "🚀 Gerar Trabalho"}
                </button>
              </form>
            </div>
          )}

          {loading && (
            <div className="loading-overlay glass-card animate-fade-in">
              <div className="spinner"></div>
              <h3>{loadingMsg}</h3>
              <div className="loading-progress">
                <div className="loading-progress-bar"></div>
              </div>
              <p className="loading-messages">
                Isto pode demorar 15-30 segundos dependendo da complexidade.
              </p>
            </div>
          )}

          {result && (
            <div className="result-container animate-fade-in-up">
              <div className="result-header">
                <div>
                  <span className="badge badge-green">✓ Concluído</span>
                  <h2 style={{ marginTop: "var(--space-2)" }}>
                    O teu trabalho sobre <em>&quot;{form.tema}&quot;</em>
                  </h2>
                </div>
                <div className="result-actions">
                  <button
                    className="btn btn-secondary"
                    onClick={handleCopy}
                    id="btn-copy"
                  >
                    {copied ? "✓ Copiado!" : "📋 Copiar"}
                  </button>
                  <ExportMenu markdown={rawResult} filename={`eduka-trabalho-${form.tema.slice(0, 30).replace(/\s+/g, '-')}`} />
                </div>
              </div>
              <div
                className="result-content glass-card"
                dangerouslySetInnerHTML={{ __html: result }}
              />
              <div style={{ textAlign: "center", marginTop: "var(--space-8)" }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setResult("");
                    setRawResult("");
                  }}
                  id="btn-novo"
                >
                  🔄 Gerar outro trabalho
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
