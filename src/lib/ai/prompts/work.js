/**
 * Eduka — Work (Trabalho Académico) Prompts
 * Novo contrato com tese, argumentos, evidências, limitações e rubrica.
 */
import { WORK_SYSTEM } from "../systems/work";

/**
 * Rubrica de avaliação automática (0-2 por critério).
 */
export const WORK_RUBRIC = `
## Rubrica de Avaliação
Cada critério recebe 0 (fraco), 1 (aceitável) ou 2 (bom):

1. **Clareza da tese** (0-2): A tese é explícita, específica e testável.
2. **Coerência entre secções** (0-2): Cada secção apoia a tese. A estrutura é lógica.
3. **Evidência e exemplos** (0-2): Há dados, casos ou exemplos concretos. Pelo menos 2 reais.
4. **Pensamento crítico** (0-2): Contrapontos, limitações ou perspectivas alternativas estão presentes.
5. **Adequação ao nível** (0-2): Linguagem e profundidade correspondem ao nível indicado.
6. **Contexto local** (0-2): Pelo menos 2 exemplos relevantes a Angola/África lusófona.
7. **Política de fontes** (aprovado/reprovado): Nenhuma referência inventada. Dados não confirmados marcados.

Pontuação máxima: 12. Aceitável: ≥ 8. Reprovar: < 8.
`.trim();

/**
 * Contrato de saída para trabalhos académicos.
 */
const WORK_CONTRACT = `
## Estrutura obrigatória do trabalho

1. **Título** — específico e informativo.
2. **Pergunta central** — a questão que o trabalho responde.
3. **Tese** — afirmação argumentativa clara (1-2 frases).
4. **Introdução** — contexto, objectivo, método e estrutura do trabalho.
5. **Desenvolvimento** — dividido em 2-4 subcapítulos, cada um com:
   - Argumento central
   - Evidências (dados, exemplos, estudos)
   - Conexão com a tese
6. **Contraponto ou limitações** — pelo menos uma secção que discuta perspectivas alternativas ou limites.
7. **Conclusão** — retoma a tese, sintetiza achados, sugere implicações.
8. **Referências** — lista de fontes credíveis. NÃO inventar DOI, autor ou data.
   - Fontes verificadas: incluir autor, ano, título, fonte.
   - Fontes não verificadas: marcar como "[a confirmar]".
9. **(Opcional) Figuras e recursos visuais recomendados** — 3-5 sugestões com legenda e onde pesquisar.

## Regras
- Markdown puro, sem blocos de código.
- Cada parágrafo deve ter conteúdo substantivo (não apenas bullets).
- Inclui tabelas markdown quando fizer sentido.
- Usa caixas com "**Caso real:**", "**Nota crítica:**" ou "**Aplicação prática:**" quando ajudarem.
- Não uses emojis.
`.trim();

/**
 * Few-shot: parágrafo analítico bom vs mau.
 */
const WORK_FEW_SHOT = `
## Exemplo de parágrafo BOM

**Desenvolvimento económico pós-independência**

Angola atingiu a independência em 1975 com uma economia profundamente dependente da exportação de petróleo, que representava mais de 90% das receitas do Estado (Banco Mundial, 2020). Esta dependência monocultura criou uma vulnerabilidade estrutural: flutuações no preço do barril de Brent reflectem-se directamente no orçamento nacional. O caso da crise de 2014-2016 ilustra esta dinâmica — a queda do preço de petróleo de 115 para 30 dólares por barril levou a uma recessão de 2,5% do PIB em 2016, com inflação a atingir 40% (INE Angola, 2017). **Caso real:** O programa de diversificação económica "Angola 2025" visa reduzir a dependência petrolífera, mas a implementação tem enfrentado obstáculos burocráticos e de infraestrutura que merecem análise crítica.

## Exemplo de parágrafo MAU

Angola é um país africano que tem petróleo. O petróleo é muito importante para a economia. O governo quer diversificar a economia porque o petróleo pode acabar. É preciso fazer mais coisas para o país crescer. Há muitos problemas em Angola que precisam de ser resolvidos.

**Diferença:** O parágrafo bom tem dados concretos, fontes, análise de causalidade, caso real e limitação. O parágrafo mau é genérico, sem dados, sem argumentação e sem profundidade.
`.trim();

/**
 * Constrói o prompt completo para geração de trabalhos académicos.
 */
export function buildWorkPrompt({ tema, curso, nivel, paginas, requisitos }) {
  return `
${WORK_SYSTEM}

## TAREFA
Gera um trabalho académico completo sobre o tema indicado.

## DADOS DO PEDIDO
- Tema: ${tema}
- Curso: ${curso || "Não especificado"}
- Nível: ${nivel || "Universitário"}
- Tamanho estimado: ${paginas || "5-8"} páginas
- Requisitos adicionais: ${requisitos || "Nenhum"}

## CONTRATO DE SAÍDA
${WORK_CONTRACT}

## RUBRICA
${WORK_RUBRIC}

## FEW-SHOT
${WORK_FEW_SHOT}

## INSTRUÇÕES FINAIS
- Produz o trabalho completo em Markdown.
- Estrutura: Capa → Índice → Introdução → Desenvolvimento → Contraponto → Conclusão → Referências.
- Referências: apenas fontes credíveis. NUNCA inventar DOI, autor ou data.
- Se não tiveres certeza sobre um dado, marca como "[a confirmar]".
- Inclui pelo menos 2 exemplos ou estudos de caso relevantes a Angola/África lusófona.
- Não uses emojis. Não uses blocos de código.
`.trim();
}
