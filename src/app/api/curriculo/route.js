import { NextResponse } from "next/server";
import { generateContent } from "@/lib/ai";
import { sanitizeInput } from "@/lib/utils";
import { authenticateAndRateLimit, validateSchema, withRateLimitHeaders } from "@/lib/api-helpers";
import { curriculoSchema } from "@/lib/api-schemas";

const CURRICULO_SYSTEM = `Tu és o CV Builder Expert da Eduka. Geras currículos profissionais para estudantes e profissionais angolanos.

## REGRAS
- Markdown limpo e profissional
- Estrutura: Dados Pessoais → Objetivo → Formação → Habilidades → Experiência → Idiomas → Informações Adicionais
- Linguagem formal e concisa
- Destacar competências relevantes para a vaga
- Formatação limpa sem emojis
- Referências bibliográficas apenas quando aplicável
- Adaptar o conteúdo ao tipo de vaga pretendida
- Incluir apenas informações fornecidas pelo utilizador`;

function buildCurriculoPrompt(data) {
  const hasExperiencia = data.experiencia && data.experiencia !== "Estudante";
  
  return `
## TAREFA
Gera um currículo profissional completo e bem formatado.

## DADOS DO UTILIZADOR

### Dados Pessoais
- Nome: ${data.nome_completo}
- Email: ${data.email || "Não fornecido"}
- Telefone: ${data.telefone || "Não fornecido"}
- Província: ${data.provincia || "Não fornecido"}
- LinkedIn: ${data.Linkedin || "Não fornecido"}

### Objetivo Profissional
- Tipo de vaga: ${data.tipo_vaga}
- Empresa alvo: ${data.empresa_alvo || "Não especificada"}
- Setor: ${data.setor_empresa || "Não especificado"}
- Objetivo: ${data.objetivo_profissional}

### Formação Académica
- Nível: ${data.nivel_educacao}
- Curso: ${data.formacao || "Não especificado"}
- Instituição: ${data.instituicao || "Não especificado"}
- Ano de conclusão: ${data.ano_conclusao || "Não especificado"}

### Experiência Profissional
- Nível: ${data.experiencia || "Estudante"}

### Competências
- Habilidades: ${data.habilidades}
- Idiomas: ${data.idiomas || "Português (nativo)"}
- Cursos complementares: ${data.cursos_complementares || "Nenhum"}

### Informações Adicionais
- Disponibilidade: ${data.disponibilidade || "A combinar"}
- Pretensão salarial: ${data.pretensao_salarial || "A combinar"}
- Outras informações: ${data.informacoes_adicionais || "Nenhuma"}

## ESTRUTURA DO CV

# ${data.nome_completo}

## Dados de Contacto
- Email: [email]
- Telefone: [telefone]
- Localização: [província]
- LinkedIn: [link]

## Objetivo Profissional
[2-3 frases a descrever o perfil e o que procura]

## Formação Académica
**[Curso]** — [Instituição]
*[Ano de conclusão ou "Em curso"]*

## Habilidades e Competências
- **Técnicas:** [lista]
- **Soft Skills:** [lista]

## Idiomas
- Português: [nível]
- Inglês: [nível]

${hasExperiencia ? `## Experiência Profissional
**[Cargo]** — [Empresa]
*[Período]*
- [Responsabilidade/realização]

` : ""}## Cursos e Certificações
- [Curso 1]
- [Curso 2]

## Informações Adicionais
- Disponibilidade: [valor]
- Pretensão Salarial: [valor]

## Referências
[Solicitar ao final ou "Disponíveis a pedido"]

## INSTRUÇÕES
- Produz o currículo completo em Markdown
- Mantém o formato limpo e profissional
- Adapta as competências ao tipo de vaga
- Não inventar informações — usar apenas o fornecido
- Se falta informação essencial, indicar "A completar"
`.trim();
}

export async function POST(request) {
  try {
    const { user, error: authError, rateLimit } = await authenticateAndRateLimit(request);
    if (authError) return authError;

    const raw = await request.json();
    
    // Sanitizar todos os campos string
    const sanitized = {};
    for (const [key, value] of Object.entries(raw)) {
      sanitized[key] = typeof value === "string" ? sanitizeInput(value) : value;
    }

    // Validar com Zod schema
    const { valid, data, error: validationError } = validateSchema(curriculoSchema, sanitized);
    if (!valid) return validationError;

    // Gerar CV com Groq (rápido)
    const prompt = buildCurriculoPrompt(data);
    const result = await generateContent(prompt, {
      provider: "groq",
      model: "llama-3.3-70b-versatile",
      capability: "text",
      system: CURRICULO_SYSTEM,
      temperature: 0.6,
      maxTokens: 4096,
    });

    console.log("[CV] Gerado:", { model: result.model, latencyMs: result.latencyMs, creditsUsed: rateLimit?.cost || 2 });

    const response = NextResponse.json({
      curriculo: result.text,
      meta: {
        provider: result.provider,
        model: result.model,
        latencyMs: result.latencyMs,
      },
    });

    return withRateLimitHeaders(response, rateLimit);
  } catch (error) {
    console.error("[API /curriculo] Erro:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao gerar currículo." },
      { status: 500 }
    );
  }
}
