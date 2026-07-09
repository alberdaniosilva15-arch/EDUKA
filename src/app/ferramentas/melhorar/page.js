"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { markdownToHtml, copyToClipboard, sanitizeHtml } from "@/lib/utils";
import ExportMenu from "@/components/ExportMenu";

export default function MelhorarPage() {
  const [form, setForm] = useState({
    texto: "",
    tipo: "geral",
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
      const res = await fetch("/api/improve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao melhorar texto.");

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
              ✨ Melhorador de{" "}
              <span className="gradient-text">Texto</span>
            </h1>
            <p>
              Cola o teu texto e a IA melhora a gramática, clareza e
              estrutura. Vê a diferença.
            </p>
          </div>

          {!result && !loading && (
            <div className="tool-form-container animate-fade-in-up delay-2">
              <form
                className="tool-form glass-card"
                onSubmit={handleSubmit}
                id="form-melhorar"
              >
                <div className="form-group">
                  <label className="form-label" htmlFor="texto">
                    O teu texto *
                  </label>
                  <textarea
                    className="form-textarea"
                    id="texto"
                    name="texto"
                    placeholder="Cola aqui o teu texto para melhoria..."
                    value={form.texto}
                    onChange={(e) =>
                      setForm({ ...form, texto: e.target.value })
                    }
                    required
                    style={{ minHeight: "220px" }}
                  ></textarea>
                  <span
                    style={{
                      fontSize: "var(--fs-xs)",
                      color: "var(--text-muted)",
                    }}
                  >
                    {form.texto.length} caracteres
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="tipo">
                    Tipo de melhoria
                  </label>
                  <select
                    className="form-select"
                    id="tipo"
                    name="tipo"
                    value={form.tipo}
                    onChange={(e) =>
                      setForm({ ...form, tipo: e.target.value })
                    }
                  >
                    <option value="geral">
                      Geral (gramática + clareza + estrutura)
                    </option>
                    <option value="gramatica">Apenas gramática</option>
                    <option value="academico">
                      Tornar mais académico
                    </option>
                    <option value="clareza">Melhorar clareza</option>
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
                  id="submit-melhorar"
                >
                  ✨ Melhorar Texto
                </button>
              </form>
            </div>
          )}

          {loading && (
            <div className="loading-overlay glass-card animate-fade-in">
              <div className="spinner"></div>
              <h3>A melhorar o teu texto...</h3>
              <div className="loading-progress">
                <div className="loading-progress-bar"></div>
              </div>
            </div>
          )}

          {result && (
            <div className="result-container animate-fade-in-up">
              <div className="result-header">
                <div>
                  <span className="badge badge-green">✓ Texto melhorado</span>
                </div>
                <div className="result-actions">
                  <button
                    className="btn btn-secondary"
                    onClick={handleCopy}
                    id="btn-copy-melhorar"
                  >
                    {copied ? "✓ Copiado!" : "📋 Copiar"}
                  </button>
                  <ExportMenu markdown={rawResult} filename="eduka-texto-melhorado" />
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
                  id="btn-novo-melhorar"
                >
                  🔄 Melhorar outro texto
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
