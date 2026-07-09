import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const tools = [
  {
    icon: "IA",
    title: "Chat Eduka",
    description:
      "Conversa livremente com modelos Groq gratuitos para estudar, escrever, rever ideias e tirar duvidas.",
    href: "/chat",
    available: true,
  },
  {
    icon: "📝",
    title: "Gerador de Trabalhos",
    description:
      "Insere o tema, curso e nivel. A IA gera um trabalho academico completo com introducao, desenvolvimento, conclusao e bibliografia.",
    href: "/ferramentas/trabalho",
    available: true,
  },
  {
    icon: "✨",
    title: "Melhorador de Texto",
    description:
      "Cola o teu texto e a IA melhora a clareza, gramatica, estrutura e apresentacao. Ve o antes e depois.",
    href: "/ferramentas/melhorar",
    available: true,
  },
  {
    icon: "💡",
    title: "Explicacao Simples",
    description:
      "A IA explica qualquer tema dificil numa linguagem simples, com exemplos praticos e analogias do dia-a-dia.",
    href: "/ferramentas/explicar",
    available: true,
  },
  {
    icon: "📅",
    title: "Plano de Estudo",
    description: "Informa o que precisas estudar e o tempo disponivel. A IA cria um cronograma personalizado com sessoes.",
    href: "/ferramentas/estudo",
    available: true,
  },
  {
    icon: "📄",
    title: "Estudar PDF",
    description: "Carrega 1+ PDFs e a IA analisa tudo: gera resumo estruturado, mapa conceptual, conceitos-chave e exercicios. Exporta para Word/PDF.",
    href: "/ferramentas/pdf",
    available: true,
  },
  {
    icon: "📊",
    title: "Gerador de Slides",
    description: "Transforma um tema ou trabalho numa apresentacao organizada. Exportavel para PPTX.",
    href: "/ferramentas/slides",
    available: true,
  },
];

export const metadata = {
  title: "Ferramentas — Eduka",
  description: "Escolhe a ferramenta de IA que precisas. Gera trabalhos, melhora textos e recebe explicacoes simples.",
};

export default function FerramentasPage() {
  return (
    <>
      <Navbar />
      <div className="tool-page">
        <div className="container">
          <div className="tool-header animate-fade-in-up">
            <span className="badge badge-blue" style={{ marginBottom: "var(--space-4)", display: "inline-block" }}>
              🤖 Powered by IA
            </span>
            <h1>
              As tuas <span className="gradient-text">ferramentas</span>
            </h1>
            <p>
              Escolhe a ferramenta que precisas. Cada uma e alimentada por um
              agente de IA especializado.
            </p>
          </div>

          <div className="tools-grid">
            {tools.map((tool, i) => (
              <Link
                key={i}
                href={tool.href}
                className={`tool-card glass-card animate-fade-in-up delay-${i + 1} ${
                  !tool.available ? "tool-card-disabled" : ""
                }`}
                id={`tool-${tool.title.toLowerCase().replace(/\s/g, "-")}`}
              >
                <div className="tool-card-icon">{tool.icon}</div>
                <h3>{tool.title}</h3>
                <p>{tool.description}</p>
                {tool.available ? (
                  <span className="tool-card-arrow">
                    Usar ferramenta <span>→</span>
                  </span>
                ) : (
                  <span className="badge badge-gold">Em breve</span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
