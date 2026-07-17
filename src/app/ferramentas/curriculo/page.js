"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const experienceLevels = [
  "Estudante",
  "Recém-formado",
  "1-3 anos de experiência",
  "3-5 anos de experiência",
  "5+ anos de experiência",
];

const educationLevels = [
  "Ensino Médio",
  "Técnico Médio",
  "Licenciatura",
  "Mestrado",
  "Doutorado",
];

export default function CurriculoPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [curriculo, setCurriculo] = useState(null);

  const [formData, setFormData] = useState({
    nome_completo: "",
    email: "",
    telefone: "",
    provincia: "",
   Linkedin: "",
    objetivo_profissional: "",
    tipo_vaga: "",
    empresa_alvo: "",
    setor_empresa: "",
    experiencia: "",
    nivel_educacao: "",
    formacao: "",
    instituicao: "",
    ano_conclusao: "",
    habilidades: "",
    idiomas: "",
    cursos_complementares: "",
    disponibilidade: "",
    pretensao_salarial: "",
    informacoes_adicionais: "",
  });

  function updateField(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/curriculo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Erro ao gerar currículo.");
      }

      setCurriculo(data.curriculo);
      setStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setStep(1);
    setCurriculo(null);
    setError("");
  }

  function downloadCurriculo() {
    if (!curriculo) return;
    
    const blob = new Blob([curriculo], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `curriculo-${formData.nome_completo.replace(/\s+/g, "-").toLowerCase() || "eduka"}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <Navbar />
      <main className="curriculo-page">
        <div className="container">
          <div className="curriculo-header animate-fade-in-up">
            <Link href="/ferramentas" className="back-link">← Voltar às Ferramentas</Link>
            <span className="badge badge-blue">Gerador de CV</span>
            <h1>
              Cria o teu <span className="shader-text shader-red">currículo</span>
            </h1>
            <p>
              A IA faz perguntas para entender o teu perfil e gera um currículo
              profissional adaptado à vaga que procuras.
            </p>
          </div>

          {/* Progresso */}
          <div className="progress-steps">
            <div className={`step ${step >= 1 ? "active" : ""}`}>1. Dados Pessoais</div>
            <div className={`step ${step >= 2 ? "active" : ""}`}>2. Perfil Profissional</div>
            <div className={`step ${step >= 3 ? "active" : ""}`}>3. Resultado</div>
          </div>

          {error && <div className="error-box">{error}</div>}

          {/* Passo 1: Dados Pessoais */}
          {step === 1 && (
            <form className="curriculo-form animate-fade-in-up" onSubmit={(e) => { e.preventDefault(); setStep(2); }}>
              <div className="form-section">
                <h2>Dados Pessoais</h2>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Nome Completo *</label>
                    <input
                      type="text"
                      value={formData.nome_completo}
                      onChange={(e) => updateField("nome_completo", e.target.value)}
                      placeholder="Ex: Maria da Silva Santos"
                      required
                    />
                  </div>
                </div>

                <div className="form-row two-cols">
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      placeholder="exemplo@email.com"
                    />
                  </div>
                  <div className="form-group">
                    <label>Telefone</label>
                    <input
                      type="tel"
                      value={formData.telefone}
                      onChange={(e) => updateField("telefone", e.target.value)}
                      placeholder="+244 9XX XXX XXX"
                    />
                  </div>
                </div>

                <div className="form-row two-cols">
                  <div className="form-group">
                    <label>Província</label>
                    <input
                      type="text"
                      value={formData.provincia}
                      onChange={(e) => updateField("provincia", e.target.value)}
                      placeholder="Ex: Luanda"
                    />
                  </div>
                  <div className="form-group">
                    <label>LinkedIn (opcional)</label>
                    <input
                      type="url"
                      value={formData.Linkedin}
                      onChange={(e) => updateField("Linkedin", e.target.value)}
                      placeholder="linkedin.com/in/seu-perfil"
                    />
                  </div>
                </div>
              </div>

              <button type="submit" className="btn-primary" disabled={!formData.nome_completo.trim()}>
                Próximo →
              </button>
            </form>
          )}

          {/* Passo 2: Perfil Profissional */}
          {step === 2 && (
            <form className="curriculo-form animate-fade-in-up" onSubmit={handleSubmit}>
              <div className="form-section">
                <h2>Perfil Profissional</h2>
                
                <div className="form-group">
                  <label>Objetivo Profissional *</label>
                  <textarea
                    value={formData.objetivo_profissional}
                    onChange={(e) => updateField("objetivo_profissional", e.target.value)}
                    placeholder="Ex: Estágio em Marketing Digital, Emprego como Desenvolvedor Web Júnior..."
                    rows={2}
                    required
                  />
                </div>

                <div className="form-row two-cols">
                  <div className="form-group">
                    <label>Tipo de Vaga *</label>
                    <input
                      type="text"
                      value={formData.tipo_vaga}
                      onChange={(e) => updateField("tipo_vaga", e.target.value)}
                      placeholder="Ex: Estágio, Emprego, Freelance"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Empresa Alvo (opcional)</label>
                    <input
                      type="text"
                      value={formData.empresa_alvo}
                      onChange={(e) => updateField("empresa_alvo", e.target.value)}
                      placeholder="Ex: Unitel, Banco BAI"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Setor da Empresa (opcional)</label>
                  <input
                    type="text"
                    value={formData.setor_empresa}
                    onChange={(e) => updateField("setor_empresa", e.target.value)}
                    placeholder="Ex: Telecomunicações, Banca, Educação"
                  />
                </div>
              </div>

              <div className="form-section">
                <h2>Formação e Experiência</h2>
                
                <div className="form-row two-cols">
                  <div className="form-group">
                    <label>Nível de Educação *</label>
                    <select
                      value={formData.nivel_educacao}
                      onChange={(e) => updateField("nivel_educacao", e.target.value)}
                      required
                    >
                      <option value="">Selecionar...</option>
                      {educationLevels.map((level) => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Nível de Experiência</label>
                    <select
                      value={formData.experiencia}
                      onChange={(e) => updateField("experiencia", e.target.value)}
                    >
                      <option value="">Selecionar...</option>
                      {experienceLevels.map((level) => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row two-cols">
                  <div className="form-group">
                    <label>Formação / Curso</label>
                    <input
                      type="text"
                      value={formData.formacao}
                      onChange={(e) => updateField("formacao", e.target.value)}
                      placeholder="Ex: Engenharia Informática"
                    />
                  </div>
                  <div className="form-group">
                    <label>Instituição</label>
                    <input
                      type="text"
                      value={formData.instituicao}
                      onChange={(e) => updateField("instituicao", e.target.value)}
                      placeholder="Ex: Universidade Agostinho Neto"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Habilidades / Competências *</label>
                  <textarea
                    value={formData.habilidades}
                    onChange={(e) => updateField("habilidades", e.target.value)}
                    placeholder="Ex: JavaScript, React, Node.js, Photoshop, Excel avançado, comunicação..."
                    rows={3}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Idiomas</label>
                  <input
                    type="text"
                    value={formData.idiomas}
                    onChange={(e) => updateField("idiomas", e.target.value)}
                    placeholder="Ex: Português (nativo), Inglês (avançado), Espanhol (básico)"
                  />
                </div>

                <div className="form-group">
                  <label>Cursos Complementares / Certificações</label>
                  <textarea
                    value={formData.cursos_complementares}
                    onChange={(e) => updateField("cursos_complementares", e.target.value)}
                    placeholder="Ex: Google Analytics Certification, Curso de UX Design..."
                    rows={2}
                  />
                </div>
              </div>

              <div className="form-section">
                <h2>Informações Adicionais</h2>
                
                <div className="form-row two-cols">
                  <div className="form-group">
                    <label>Disponibilidade</label>
                    <input
                      type="text"
                      value={formData.disponibilidade}
                      onChange={(e) => updateField("disponibilidade", e.target.value)}
                      placeholder="Ex: Tempo integral, Meio período, Remoto"
                    />
                  </div>
                  <div className="form-group">
                    <label>Pretensão Salarial</label>
                    <input
                      type="text"
                      value={formData.pretensao_salarial}
                      onChange={(e) => updateField("pretensao_salarial", e.target.value)}
                      placeholder="Ex: A combinar, 150.000 Kz"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Informações Adicionais</label>
                  <textarea
                    value={formData.informacoes_adicionais}
                    onChange={(e) => updateField("informacoes_adicionais", e.target.value)}
                    placeholder="Ex: Disponível para viagens, Habilitação de conducção, Voluntariado..."
                    rows={2}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setStep(1)}>
                  ← Anterior
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? "A gerar currículo..." : "Gerar Currículo"}
                </button>
              </div>
            </form>
          )}

          {/* Passo 3: Resultado */}
          {step === 3 && curriculo && (
            <div className="curriculo-result animate-fade-in-up">
              <div className="result-header">
                <h2>Currículo Gerado</h2>
                <div className="result-actions">
                  <button className="btn-secondary" onClick={handleReset}>
                    Criar Novo
                  </button>
                  <button className="btn-primary" onClick={downloadCurriculo}>
                    Descarregar .md
                  </button>
                </div>
              </div>
              
              <div className="curriculo-preview">
                <pre>{curriculo}</pre>
              </div>
              
              <div className="result-tip">
                <strong>Dica:</strong> Copia o conteúdo e cola no Word ou Google Docs para formatar.
                Podes também usar conversores online de Markdown para DOCX.
              </div>
            </div>
          )}
        </div>

        <style jsx>{`
          .curriculo-page {
            min-height: 100vh;
            padding: 120px 0 80px;
            background: var(--bg-main);
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 0 24px;
          }
          .curriculo-header {
            text-align: center;
            margin-bottom: 48px;
          }
          .back-link {
            display: inline-block;
            color: var(--text-muted);
            text-decoration: none;
            margin-bottom: 16px;
            font-size: 14px;
          }
          .back-link:hover {
            color: var(--text-main);
          }
          .badge {
            display: inline-block;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 600;
            margin-bottom: 16px;
          }
          .badge-blue {
            background: rgba(37, 99, 235, 0.15);
            color: var(--blue-400);
          }
          h1 {
            font-size: clamp(32px, 5vw, 48px);
            font-weight: 800;
            margin: 0 0 16px;
          }
          .gradient-text {
            background: var(--gradient-text);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          .curriculo-header p {
            color: var(--text-muted);
            font-size: 18px;
            max-width: 600px;
            margin: 0 auto;
          }
          .progress-steps {
            display: flex;
            justify-content: center;
            gap: 24px;
            margin-bottom: 40px;
          }
          .step {
            padding: 10px 20px;
            border-radius: 10px;
            background: var(--glass-bg);
            color: var(--text-muted);
            font-size: 14px;
            font-weight: 600;
          }
          .step.active {
            background: rgba(37, 99, 235, 0.2);
            color: var(--blue-400);
          }
          .error-box {
            padding: 14px 18px;
            border-radius: 12px;
            background: rgba(220, 38, 38, 0.12);
            border: 1px solid rgba(248, 113, 113, 0.2);
            color: #fca5a5;
            margin-bottom: 24px;
          }
          .curriculo-form {
            display: flex;
            flex-direction: column;
            gap: 32px;
          }
          .form-section {
            background: var(--glass-bg);
            border: 1px solid var(--glass-border);
            border-radius: 16px;
            padding: 28px;
          }
          .form-section h2 {
            font-size: 20px;
            font-weight: 700;
            margin: 0 0 24px;
            color: var(--text-main);
          }
          .form-row {
            display: flex;
            gap: 16px;
            margin-bottom: 16px;
          }
          .form-row.two-cols {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
          }
          .form-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-bottom: 16px;
          }
          .form-row .form-group {
            margin-bottom: 0;
          }
          label {
            font-size: 14px;
            font-weight: 600;
            color: var(--text-main);
          }
          input, select, textarea {
            padding: 12px 16px;
            border-radius: 10px;
            border: 1px solid var(--glass-border);
            background: rgba(255, 255, 255, 0.03);
            color: var(--text-main);
            font: inherit;
            font-size: 15px;
            transition: border-color 0.2s;
          }
          input:focus, select:focus, textarea:focus {
            outline: none;
            border-color: var(--blue-500);
          }
          textarea {
            resize: vertical;
            min-height: 80px;
          }
          select {
            cursor: pointer;
          }
          .form-actions {
            display: flex;
            gap: 16px;
            justify-content: flex-end;
          }
          .btn-primary, .btn-secondary {
            padding: 14px 28px;
            border-radius: 12px;
            font: inherit;
            font-weight: 700;
            font-size: 15px;
            cursor: pointer;
            border: none;
            transition: all 0.2s;
          }
          .btn-primary {
            background: var(--gradient-button);
            color: white;
          }
          .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(37, 99, 235, 0.3);
          }
          .btn-primary:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
          }
          .btn-secondary {
            background: var(--glass-bg);
            color: var(--text-main);
            border: 1px solid var(--glass-border);
          }
          .btn-secondary:hover {
            background: var(--glass-border);
          }
          .curriculo-result {
            background: var(--glass-bg);
            border: 1px solid var(--glass-border);
            border-radius: 16px;
            padding: 32px;
          }
          .result-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
          }
          .result-header h2 {
            margin: 0;
            font-size: 24px;
          }
          .result-actions {
            display: flex;
            gap: 12px;
          }
          .curriculo-preview {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 12px;
            padding: 24px;
            max-height: 500px;
            overflow: auto;
          }
          .curriculo-preview pre {
            margin: 0;
            font-family: var(--font-mono);
            font-size: 14px;
            line-height: 1.6;
            color: var(--text-main);
            white-space: pre-wrap;
          }
          .result-tip {
            margin-top: 20px;
            padding: 16px;
            background: rgba(37, 99, 235, 0.1);
            border-radius: 10px;
            font-size: 14px;
            color: var(--blue-300);
          }
          @media (max-width: 600px) {
            .form-row.two-cols {
              grid-template-columns: 1fr;
            }
            .progress-steps {
              flex-direction: column;
              gap: 8px;
            }
            .result-header {
              flex-direction: column;
              gap: 16px;
              text-align: center;
            }
            .form-actions {
              flex-direction: column;
            }
          }
        `}</style>
      </main>
      <Footer />
    </>
  );
}
