/**
 * Eduka — Slides Prompts
 * Novo contrato de slides com keyMessage, evidence, speakerNotes, sourceHints.
 */
import { buildSystemWithPersona } from "../systems/base";

const SLIDES_PERSONA = `
## Persona: Designer Instrucional
- Cria apresentações académicas modernas, visuais e pedagógicas.
- Prioriza clareza visual: pouco texto no slide, profundidade nas notas do apresentador.
- Cada slide tem uma ideia principal. Evita listas longas.
- Exemplos reais e dados verificáveis quando disponíveis.
- Dados e citações não verificados: marca como "a confirmar".
- Contexto angolano ou africano lusófono quando relevante, sem forçar em temas sem caso local.
- Capa, agenda e transições NÃO precisam de exemplo local.
- Conclusão responde aos objetivos iniciais da apresentação.
`.trim();

export const SLIDES_SYSTEM = buildSystemWithPersona(SLIDES_PERSONA);

/**
 * Contrato de saída para slides.
 * Cada slide contém: title, purpose, keyMessage, bullets, evidence,
 * localContext, visual, speakerNotes, sourceHints.
 */
export const SLIDE_SCHEMA_DESCRIPTION = `
O output DEVE ser EXATAMENTE um array JSON com ${"{numSlides}"} objetos.
Cada objeto representa um slide e DEVE conter:

{
  "title": "Título específico do slide (até 90 caracteres)",
  "purpose": "O que o estudante deve compreender com este slide",
  "keyMessage": "Uma ideia central em frase completa — a mensagem principal",
  "bullets": ["bullet 1 (informação concreta)", "bullet 2", "bullet 3"],
  "evidence": { "type": "dado|exemplo|caso|estudo", "text": "descrição verificável", "source": "fonte ou 'a confirmar'" } | null,
  "localContext": { "text": "relação com Angola/África lusófona", "relevance": "alto|médio" } | null,
  "visual": { "type": "photo|diagram|chart|timeline|map|icon", "description": "descrição do visual", "caption": "legenda", "alt": "texto alternativo acessível" },
  "speakerNotes": "Explicação de 80-180 palavras para apresentação oral. Aqui vai a profundidade.",
  "sourceHints": ["fonte fornecida ou item a verificar"]
}

## Regras obrigatórias
1. Array com EXATAMENTE ${"{numSlides}"} objetos.
2. Todos os campos são obrigatórios exceto evidence e localContext (podem ser null).
3. title: curto e específico. Não genérico.
4. keyMessage: frase completa que sintetiza o slide.
5. bullets: 2 a 4 pontos, cada um com informação concreta. Máximo 20 palavras por bullet.
6. speakerNotes: 80-180 palavras de explicação aprofundada.
7. Pelo menos 2 slides no total devem ter localContext não nulo.
8. Dados e citações não verificados devem ter source: "a confirmar".
9. JSON puro. Nada antes, nada depois. Sem markdown.
10. layout removido — usar apenas o tipo de visual para indicar disposição.
`.trim();

/**
 * Few-shot example: slide bom vs slide mau.
 */
const SLIDE_FEW_SHOT = `
## Exemplo de slide BOM

{
  "title": "Expansão do Ensino Secundário em Angola",
  "purpose": "Compreender o crescimento e desafios da educação secundária",
  "keyMessage": "A expansão do ensino secundário aumenta a base de candidatos ao ensino superior, mas exige investimento paralelo em professores, laboratórios e conectividade.",
  "bullets": [
    "Matrículas no secundário cresceram 40% desde 2015 segundo o MINEDU",
    "Déficit de professores qualificados atinge 30% nas províncias",
    "Laboratórios de ciências existem em apenas 25% das escolas",
    "Conectividade digital alcance 15% das instituições"
  ],
  "evidence": { "type": "dado", "text": "Crescimento de 40% nas matrículas desde 2015", "source": "MINEDU — a confirmar" },
  "localContext": { "text": "Angola tem vindo a expandir o ensino secundário como parte da política de universalização da educação", "relevance": "alto" },
  "visual": { "type": "chart", "description": "Gráfico de barras comparando matrículas 2015 vs 2024", "caption": "Evolução das matrículas no ensino secundário", "alt": "Gráfico mostra aumento de 40% nas matrículas" },
  "speakerNotes": "A expansão do ensino secundário em Angola é um dos maiores avanços das últimas décadas. Segundo dados do MINEDU, as matrículas cresceram cerca de 40% desde 2015. No entanto, este crescimento rápido trouxe desafios significativos: o déficit de professores qualificados atinge aproximadamente 30% nas províncias do interior, e apenas 25% das escolas dispõem de laboratórios de ciências funcionais. A conectividade digital, essencial para o ensino moderno, alcança apenas 15% das instituições. Estes dados sugerem que o investimento precisa de se focar não apenas na infraestrutura física, mas também na formação docente e na digitalização.",
  "sourceHints": ["MINEDU relatório estatístico", "UNESCO Institute for Statistics"]
}

## Exemplo de slide MAU

{
  "title": "Educação",
  "purpose": "Saber mais",
  "keyMessage": "A educação é importante.",
  "bullets": ["A educação é importante para o desenvolvimento", "É preciso investir mais", "Os alunos devem estudar mais"],
  "evidence": null,
  "localContext": null,
  "visual": { "type": "photo", "description": "escola", "caption": "Escola", "alt": "Escola" },
  "speakerNotes": "A educação é muito importante para Angola.",
  "sourceHints": []
}

Note a diferença: o slide mau tem título genérico, keyMessage vaga, bullets sem informação concreta, notas curtas e sem profundidade. O slide bom tem título específico, argumento central completo, dados verificáveis, notas detalhadas e contexto local relevante.
`.trim();

/**
 * Constrói o prompt completo para geração de slides.
 */
export function buildSlidesPrompt({ topic, numSlides, style }) {
  return `
${SLIDES_SYSTEM}

## TAREFA
Gera o conteúdo estruturado para uma apresentação de ${numSlides} slides sobre "${topic}".
Estilo: ${style || "académico visual"}

## CONTRATO DE SAÍDA
${SLIDE_SCHEMA_DESCRIPTION.replace(/\$\{"\{numSlides\}"\}/g, String(numSlides))}

## FEW-SHOT
${SLIDE_FEW_SHOT}

## INSTRUÇÕES FINAIS
- Produz EXATAMENTE ${numSlides} slides.
- O primeiro slide deve ser capa (título + subtítulo da apresentação).
- O último slide deve ser resumo/conclusão.
- Não inventes referências. Marca dados não confirmados.
- JSON puro, sem markdown, sem comentários.
`.trim();
}
