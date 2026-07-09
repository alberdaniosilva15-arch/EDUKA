"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { markdownToHtml, copyToClipboard, sanitizeHtml } from "@/lib/utils";
import ExportMenu from "@/components/ExportMenu";

export default function ExplicarPage() {
  const [form, setForm] = useState({
    tema: "",
    nivel: "universitario",
  });
  const [result, setResult] = useState("");
  const [rawResult, setRawResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult("");
    setRawResult("");

    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao explicar tema.");

      setRawResult(data.result);
      setResult(sanitizeHtml(markdownToHtml(data.result)));
    } catch (err) {
      setError(err.message);
    } finally {
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
              💡 Explicação{" "}
              <span className="gradient-text">Simples</span>
            </h1>
            <p>
              Insere um tema complexo e a IA explica de forma clara, com
              exemplos práticos e analogias.
            </p>
          </div>

          {!result && !loading && (
            <div className="tool-form-container animate-fade-in-up delay-2">
              <form
                className="tool-form glass-card"
                onSubmit={handleSubmit}
                id="form-explicar"
              >
                <div className="form-group">
                  <label className="form-label" htmlFor="tema">
                    Tema ou conceito *
                  </label>
                  <input
                    className="form-input"
                    type="text"
                    id="tema"
                    name="tema"
                    placeholder="Ex: Fotossíntese, Inflação, Teorema de Pitágoras..."
                    value={form.tema}
                    onChange={(e) =>
                      setForm({ ...form, tema: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="nivel">
                    O teu nível
                  </label>
                  <select
                    className="form-select"
                    id="nivel"
                    name="nivel"
                    value={form.nivel}
                    onChange={(e) =>
                      setForm({ ...form, nivel: e.target.value })
                    }
                  >
                    <option value="basico">Ensino Básico</option>
                    <option value="medio">Ensino Médio</option>
                    <option value="universitario">Universitário</option>
                    <option value="pos-graduacao">Pós-Graduação</option>
                  </select>
                </div>

                {error && (
                  <div
                    style={{
                      color: "var(--error)",
                      fontSize: "var(--fs-sm)",
                    }}
                  >
                    ⚠️ {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  id="submit-explicar"
                >
                  💡 Explicar Agora
                </button>
              </form>
            </div>
          )}

          {loading && (
            <div className="loading-overlay glass-card animate-fade-in">
              <div className="spinner"></div>
              <h3>A preparar a explicação...</h3>
              <div className="loading-progress">
                <div className="loading-progress-bar"></div>
              </div>
            </div>
          )}

          {result && (
            <div className="result-container animate-fade-in-up">
              <div className="result-header">
                <div>
                  <span className="badge badge-green">✓ Explicação pronta</span>
                  <h2 style={{ marginTop: "var(--space-2)" }}>
                    Sobre <em>&quot;{form.tema}&quot;</em>
                  </h2>
                </div>
                <div className="result-actions">
                  <button
                    className="btn btn-secondary"
                    onClick={handleCopy}
                    id="btn-copy-explicar"
                  >
                    {copied ? "✓ Copiado!" : "📋 Copiar"}
                  </button>
                  <ExportMenu markdown={rawResult} filename={`eduka-explicacao-${form.tema.slice(0, 30).replace(/\s+/g, '-')}`} />
                </div>
              </div>
              <div
                className="result-content glass-card"
                dangerouslySetInnerHTML={{ __html: result }}
              />
              <div
                style={{
                  textAlign: "center",
                  marginTop: "var(--space-8)",
                }}
              >
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setResult("");
                    setRawResult("");
                  }}
                  id="btn-novo-explicar"
                >
                  🔄 Explicar outro tema
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
