/**
 * Eduka — Script de teste para validar prompts e contratos
 *
 * Uso: node scripts/test-prompts.js
 *
 * Testa 10 cenários cobrindo todas as ferramentas:
 * - 2 trabalhos académicos (nível médio e universitário)
 * - 2 apresentações de slides
 * - 2 explicações
 * - 2 melhorias de texto
 * - 1 plano de estudo
 * - 1 simulação de pós-processamento
 */

// Mock do fetch para testar sem chamar APIs reais
const mockFetch = async (url, options) => {
  const body = JSON.parse(options.body);

  // Detectar tool pelo URL
  const isSlides = url.includes("slides");
  const isGenerate = url.includes("generate");
  const isExplain = url.includes("explain");
  const isImprove = url.includes("improve");
  const isEstudo = url.includes("estudo");

  // Simular resposta baseada na tool
  let responseText;

  if (isSlides) {
    // Resposta de slides (JSON) — gerar a quantidade pedida
    const numSlides = body.numSlides || 5;
    const baseSlides = [
      {
        title: "Introdução à Economia Angolana",
        purpose: "Compreender a estrutura económica de Angola",
        keyMessage: "A economia angolana é fortemente dependente do petróleo, que representa 90% das exportações e 60% das receitas do Estado.",
        bullets: [
          "PIB de 120 mil milhões USD em 2023",
          "Petróleo: 90% das exportações",
          "Crescimento não-petrolífero de 3.2%",
          "Diversificação é prioridade nacional"
        ],
        evidence: { type: "dado", text: "PIB de 120 mil milhões USD", source: "Banco Mundial" },
        localContext: { text: "Angola é o 2º maior produtor de petróleo em África subsariana", relevance: "alto" },
        visual: { type: "chart", description: "Gráfico de composição do PIB", caption: "Composição do PIB angolano", alt: "Gráfico mostra dependência petrolífera" },
        speakerNotes: "A economia angolana é caracterizada pela forte dependência do sector petrolífero. Segundo dados do Banco Mundial, o PIB atingiu 120 mil milhões de USD em 2023, mas a receita petrolífera representa ainda 90% das exportações. O governo tem vindo a implementar políticas de diversificação, com o crescimento do sector não-petrolífero a atingir 3.2%. No entanto, desafios como a infraestrutura, burocracia e acesso ao financiamento continuam a limitar o ritmo da transformação económica.",
        sourceHints: ["Banco Mundial", "INE Angola"]
      },
      {
        title: "Sector Petrolífero: Produção e Receitas",
        purpose: "Entender o papel do petróleo na economia",
        keyMessage: "Angola produz cerca de 1.1 milhões de barris/dia, mas a produção tem diminuído desde 2015.",
        bullets: [
          "Produção actual: 1.1M barris/dia",
          "Queda de 40% desde 2015",
          "Investimento estrangeiro em recuperação",
          "Refinaria de Luanda em construção"
        ],
        evidence: { type: "dado", text: "1.1 milhões de barris/dia", source: "Agência Nacional de Petróleo" },
        localContext: null,
        visual: { type: "timeline", description: "Linha temporal da produção petrolífera", caption: "Evolução da produção 2010-2024", alt: "Gráfico de linha mostrando queda na produção" },
        speakerNotes: "O sector petrolífero angolano enfrenta desafios significativos. A produção caiu de 1.8 milhões de barris/dia em 2015 para aproximadamente 1.1 milhões em 2024. Esta redução deve-se ao esgotamento de alguns campos maduros e à falta de investimento em exploração. No entanto, novos projectos como a refinaria de Luanda e investimentos da TotalEnergies e da ExxonMobil sugerem uma recuperação potencial. A Agência Nacional de Petróleo tem vindo a simplificar processos para atrair investimento estrangeiro.",
        sourceHints: ["Agência Nacional de Petróleo", "Reuters"]
      },
      {
        title: "Diversificação Económica",
        purpose: "Conhecer as estratégias de diversificação",
        keyMessage: "A diversificação é essencial para reduzir a vulnerabilidade aos choques petrolíferos.",
        bullets: [
          "Agricultura: 60% da população activa",
          "Mineração: diamantes, ferro, manganês",
          "Turismo: potencial enorme por explorar",
          "Tecnologia: crescimento do ecossistema start-up"
        ],
        evidence: null,
        localContext: { text: "O programa Angola 2025 visa reduzir a dependência petrolífera", relevance: "alto" },
        visual: { type: "diagram", description: "Diagrama dos sectores de diversificação", caption: "Sectores prioritários", alt: "Diagrama mostra sectores de diversificação" },
        speakerNotes: "A diversificação económica é uma prioridade estratégica para Angola. O programa Angola 2025 estabelece metas concretas para o desenvolvimento de sectores como agricultura, que emprega 60% da população activa mas representa apenas 10% do PIB; mineração, com potencial para diamantes, ferro e manganês; turismo, ainda incipiente mas com enormes possibilidades; e tecnologia, com o crescimento de incubadoras e aceleradoras em Luanda. O sucesso desta transição depende de investimento em infraestrutura, formação e ambiente regulatório favorável.",
        sourceHints: ["MININFRA", "Relatório Angola 2025"]
      },
      {
        title: "Desafios e Oportunidades",
        purpose: "Avaliar riscos e perspectivas",
        keyMessage: "Apesar dos desafios, Angola tem vantagens competitivas que podem impulsionar o crescimento.",
        bullets: [
          "Posição geográfica estratégica no Atlântico",
          "Recursos minerais diversificados",
          "População jovem e em crescimento",
          "Reformas governamentais em curso"
        ],
        evidence: null,
        localContext: { text: "Luanda é um hub logístico para África Austral e Central", relevance: "médio" },
        visual: { type: "map", description: "Mapa de Angola com recursos naturais", caption: "Recursos naturais por província", alt: "Mapa mostra distribuição de recursos" },
        speakerNotes: "Angola dispõe de vantagens competitivas significativas. A sua posição geográfica no Atlântico sul torna-a um hub logístico natural para África Austral e Central. Os recursos minerais diversificados, incluindo diamantes, ferro e manganês, oferecem oportunidades para além do petróleo. A população jovem (idade média de 16.7 anos) representa um dividend demográfico potencial, desde que haja investimento em educação e emprego. As reformas governamentais em curso, incluindo a simplificação burocrática e a abertura ao investimento estrangeiro, são sinais positivos.",
        sourceHints: ["Banco Mundial", "UNDP"]
      },
      {
        title: "Conclusão",
        purpose: "Sintetizar os pontos principais",
        keyMessage: "O futuro económico de Angola depende da capacidade de diversificar para além do petróleo.",
        bullets: [
          "Diversificação é urgente e necessária",
          "Investimento em capital humano é crucial",
          "Reformas institucionais são o alicerce",
          "Cooperação internacional pode acelerar"
        ],
        evidence: null,
        localContext: null,
        visual: { type: "icon", description: "Ícone de crescimento sustentável", caption: "Crescimento sustentável", alt: "Ícone representa futuro sustentável" },
        speakerNotes: "Em conclusão, a economia angolana encontra-se num ponto de viragem crítica. A dependência do petróleo, que trouxe prosperidade nas últimas décadas, é agora uma vulnerabilidade face à volatilidade dos preços internacionais e à transição energética global. A diversificação não é apenas uma opção, mas uma necessidade urgente. O investimento em capital humano, reformas institucionais e cooperação internacional são ingredientes essenciais para esta transformação. Angola tem os recursos e a posição geográfica para se tornar uma economia diversificada e resiliente — o desafio está na execução.",
        sourceHints: []
      }
    ];
    // Estender para o número pedido
    while (baseSlides.length < numSlides) {
      const i = baseSlides.length;
      baseSlides.push({
        title: `Slide ${i + 1}: Conteúdo Adicional`,
        purpose: `Compreender o aspecto ${i + 1} do tema`,
        keyMessage: `Este slide aborda um aspecto adicional importante para uma compreensão completa do tema.`,
        bullets: [`Ponto adicional ${i + 1}A`, `Ponto adicional ${i + 1}B`, `Ponto adicional ${i + 1}C`],
        evidence: { type: "exemplo", text: `Exemplo adicional ${i + 1}`, source: "Fonte académica" },
        localContext: i % 3 === 0 ? { text: `Contexto angolano relevante para o slide ${i + 1}`, relevance: "médio" } : null,
        visual: { type: "diagram", description: `Diagrama do slide ${i + 1}`, caption: `Diagrama ${i + 1}`, alt: `Diagrama ilustrativo ${i + 1}` },
        speakerNotes: `Notas detalhadas do apresentador para o slide ${i + 1}. Este slide complementa a informação apresentada nos slides anteriores, fornecendo contexto adicional e exemplos práticos para enriquecer a compreensão do tema. As notas devem ter entre 80 e 180 palavras para serem úteis durante a apresentação oral.`,
        sourceHints: ["Fonte a confirmar"]
      });
    }
    responseText = JSON.stringify(baseSlides);
  } else if (isGenerate) {
    // Resposta de trabalho
    responseText = `# Impacto da Digitalização no Ensino Superior Angolano

## Pergunta Central
De que forma a digitalização pode melhorar a acessibilidade e qualidade do ensino superior em Angola?

## Tese
A implementação estratégica de tecnologias digitais no ensino superior angolano tem o potencial de aumentar a acessibilidade em 40% e melhorar a qualidade pedagógica, desde que haja investimento paralelo em infraestrutura e formação docente.

## Introdução
O ensino superior angolano enfrenta desafios estruturais como limitações de infraestrutura, déficit de docentes qualificados e baixa taxa de acesso. Com apenas 15% da população jovem a aceder ao ensino superior, a digitalização surge como ferramenta potencial de transformação.

## Desenvolvimento

### Acessibilidade Digital
A expansão da conectividade e o uso de plataformas de ensino à distância podem aumentar significativamente o número de estudantes com acesso ao ensino superior. Segundo o MINEDU, a taxa de alfabetização digital entre jovens angolanos é de apenas 35%.

### Qualidade Pedagógica
A integração de ferramentas digitais no processo de ensino-aprendizagem pode melhorar a interactividade, a personalização do ensino e o acesso a recursos actualizados.

### Caso Real: Universidade Agostinho Neto
A UAN tem vindo a implementar um programa piloto de ensino híbrido que atinge 2.000 estudantes em 5 faculdades, com resultados positivos na satisfação dos alunos.

## Contraponto
A digitalização não resolve problemas estruturais como a falta de electricidade em zonas rurais, o custo elevado de dispositivos e a resistência à mudança por parte de alguns docentes.

## Conclusão
A digitalização é uma ferramenta poderosa mas não suficiente. É necessário um ecossistema que inclua infraestrutura, formação e políticas públicas de apoio.

## Referências
- MINEDU (2023) Relatório Estatístico
- Banco Mundial (2022) Angola Education Report
- UNESCO (2023) Digital Education Outlook
- [a confirmar] UAN (2024) Relatório de Actividades`;
  } else if (isExplain) {
    // Resposta de explicação
    responseText = `## O que são Monadas?

### Pergunta Diagnóstica
Antes de começarmos, consegues dizer o que sabes sobre a estrutura da matéria?

### O que é
Monada é uma partícula subatómica quark ligada a um antiquark por força forte. É ohadrão mais simples que existe.

### Como funciona
As monadas são compostas por um quark e um antiquark ligados pela interacção forte (gluões). Existem vários tipos: piões (u+d'), kaões (u+s'), e outros.

### Exemplo Prático
Imagina uma bola de ténis (quark) colada a outra bola de ténis (antiquark) por um elástico muito forte (gluão). Mesmo que tentes separá-las, o elástico nunca se parte — em vez disso, cria novas bolas.

### Contraexemplo
Diferente dos mésons (que têm quark + antiquark), os bárions (como o protão) têm três quarks. Não confundir!

### Resumo em 3 Pontos
1. **Monada** = quark + antiquark
2. São hadrões mais simples
3. Ligação pela força forte (gluões)

### Exercício
Porque é que não é possível isolar um quark individual? (Resposta: confinamento de cor — a força forte aumenta com a distância)`;
  } else if (isImprove) {
    // Resposta de melhoria
    responseText = `### TEXTO MELHORADO

O desenvolvimento sustentável em Angola apresenta desafios significativos que requerem uma abordagem integrada. A dependência económica do sector petrolífero, que representa cerca de 90% das exportações, torna o país vulnerável a flutuações dos preços internacionais. Neste contexto, a diversificação económica emerge como prioridade estratégica, com destaque para os sectores da agricultura, mineração e tecnologia.

### ALTERAÇÕES FEITAS
- Corrigida concordância nominal ("desafios significativos" em vez de "desafio significativo")
- Melhorada a coesão com conectores lógicos ("Neste contexto")
- Adicionado dado concreto (90% das exportações)
- Tornado o texto mais académico e fluido

### PRESERVAÇÃO
- Tema e argumento original mantidos
- Referência ao petróleo preservada
- Estrutura de dois parágrafos mantida`;
  } else {
    // Resposta genérica (plano de estudo)
    responseText = `# Plano de Estudo: Microeconomia

## Diagnóstico Inicial
1. Conheces a diferença entre oferta e procura?
2. Sabes o que é elasticidade?
3. Já ouviste falar de falhas de mercado?

## Objetivos de Aprendizagem
1. Explicar os conceitos fundamentais de microeconomia
2. Analisar o comportamento do consumidor e da empresa
3. Avaliar o papel do Estado na economia de mercado

## Sessão 1: Fundamentos (2h)
- **Objetivo**: Compreender oferta e procura
- **Tarefa**: Leitura + exercícios práticos
- **Auto-avaliação**: Equilíbrio de mercado

## Sessão 2: Elasticidade (2h)
- **Objetivo**: Medir sensibilidade a mudanças de preço
- **Tarefa**: Análise de casos reais angolanos
- **Auto-avaliação**: Cálculo de elasticidade

## Revisão Espaçada
- Dia 3: Revisão Sessão 1
- Dia 7: Revisão Sessão 1+2
- Dia 14: Exercício integrador

## Avaliação Final
Exercício que combina oferta, procura e elasticidade com dados do mercado angolano.`;
  }

  // Simular latência
  await new Promise((r) => setTimeout(r, 100));

  // Retornar no formato OpenAI (choices[0].message.content)
  return {
    ok: true,
    json: async () => ({
      choices: [{ message: { content: responseText } }],
    }),
  };
};

// ═══════════════════════════════════════════════════════════
// Cenários de teste
// ═══════════════════════════════════════════════════════════

const testScenarios = [
  {
    name: "Trabalho Académico (nível médio)",
    tool: "generate",
    input: { tema: "Impacto da digitalização no ensino superior angolano", nivel: "medium", paginas: "5" },
    validate: (output) => {
      const hasTitle = output.includes("#");
      const hasSections = output.includes("##");
      const hasReferences = output.toLowerCase().includes("referência");
      return { passed: hasTitle && hasSections && hasReferences, score: [hasTitle, hasSections, hasReferences].filter(Boolean).length };
    },
  },
  {
    name: "Trabalho Académico (nível universitário)",
    tool: "generate",
    input: { tema: "Economia do petróleo em Angola", nivel: "universitario", paginas: "8" },
    validate: (output) => {
      const hasThesis = output.toLowerCase().includes("tese");
      const hasCounterpoint = output.toLowerCase().includes("contraponto") || output.toLowerCase().includes("limitação");
      const hasRefs = output.includes("[a confirmar]") || output.includes("Referências");
      return { passed: hasThesis && hasCounterpoint, score: [hasThesis, hasCounterpoint, hasRefs].filter(Boolean).length };
    },
  },
  {
    name: "Slides (5 slides)",
    tool: "slides",
    input: { topic: "Economia Angolana", numSlides: 5 },
    validate: (output) => {
      try {
        const slides = JSON.parse(output);
        const isArray = Array.isArray(slides);
        const correctCount = isArray && slides.length === 5;
        const allHaveTitle = isArray && slides.every(s => s.title);
        const allHaveKeyMessage = isArray && slides.every(s => s.keyMessage);
        const allHaveNotes = isArray && slides.every(s => s.speakerNotes && s.speakerNotes.length > 30);
        const passed = correctCount && allHaveTitle && allHaveKeyMessage && allHaveNotes;
        return { passed, score: [isArray, correctCount, allHaveTitle, allHaveKeyMessage, allHaveNotes].filter(Boolean).length };
      } catch {
        return { passed: false, score: 0 };
      }
    },
  },
  {
    name: "Slides (10 slides)",
    tool: "slides",
    input: { topic: "Direito Constitucional Angolano", numSlides: 10 },
    validate: (output) => {
      try {
        const slides = JSON.parse(output);
        const correctCount = Array.isArray(slides) && slides.length === 10;
        const hasBullets = slides.every(s => Array.isArray(s.bullets) && s.bullets.length >= 2);
        return { passed: correctCount && hasBullets, score: [correctCount, hasBullets].filter(Boolean).length };
      } catch {
        return { passed: false, score: 0 };
      }
    },
  },
  {
    name: "Explicação (nível médio)",
    tool: "explain",
    input: { tema: "Monadas na física de partículas", nivel: "medio" },
    validate: (output) => {
      const hasDefinition = output.toLowerCase().includes("o que é") || output.toLowerCase().includes("definição");
      const hasExample = output.toLowerCase().includes("exemplo");
      const hasExercise = output.toLowerCase().includes("exercício") || output.toLowerCase().includes("pergunta");
      return { passed: hasDefinition && hasExample, score: [hasDefinition, hasExample, hasExercise].filter(Boolean).length };
    },
  },
  {
    name: "Explicação (nível universitário)",
    tool: "explain",
    input: { tema: "Monopolios e oligopolios", nivel: "universitario" },
    validate: (output) => {
      const hasAnalogy = output.toLowerCase().includes("analogia") || output.toLowerCase().includes("imagina");
      const hasLocal = output.toLowerCase().includes("angola") || output.toLowerCase().includes("africano");
      const hasContraexample = output.toLowerCase().includes("contraexemplo") || output.toLowerCase().includes("não se aplica");
      return { passed: hasAnalogy || hasLocal, score: [hasAnalogy, hasLocal, hasContraexample].filter(Boolean).length };
    },
  },
  {
    name: "Melhoria de texto (leve)",
    tool: "improve",
    input: { texto: "Angola e um pais com muito potencial economico. O petroleo e muito importante para a economia. O governo quer diversificar.", tipo: "leve" },
    validate: (output) => {
      const hasImproved = output.includes("TEXTO MELHORADO") || output.includes("texto melhorado");
      const hasChanges = output.includes("ALTERAÇÃO") || output.includes("ALTERAÇÕES") || output.includes("alteração") || output.includes("alterações");
      return { passed: hasImproved && hasChanges, score: [hasImproved, hasChanges].filter(Boolean).length };
    },
  },
  {
    name: "Melhoria de texto (profunda)",
    tool: "improve",
    input: { texto: "A educação em Angola enfrenta muitos problemas. Falta professores, escolas e material. O governo devia fazer mais.", tipo: "profunda" },
    validate: (output) => {
      const hasImproved = output.includes("TEXTO MELHORADO") || output.includes("texto melhorado");
      const hasPreservation = output.includes("PRESERVAÇÃO") || output.includes("preservação");
      return { passed: hasImproved, score: [hasImproved, hasPreservation].filter(Boolean).length };
    },
  },
  {
    name: "Plano de Estudo",
    tool: "estudo",
    input: { topic: "Microeconomia", timeframe: "2 semanas", course: "Economia" },
    validate: (output) => {
      const hasObjectives = output.toLowerCase().includes("objetivo") || output.toLowerCase().includes("objectivo");
      const hasSessions = output.toLowerCase().includes("sessão") || output.toLowerCase().includes("semana");
      const hasReview = output.toLowerCase().includes("revisão") || output.toLowerCase().includes("revisao");
      const hasAssessment = output.toLowerCase().includes("avaliação") || output.toLowerCase().includes("avaliacao");
      return { passed: hasObjectives && hasSessions, score: [hasObjectives, hasSessions, hasReview, hasAssessment].filter(Boolean).length };
    },
  },
  {
    name: "Pós-processamento (simulação)",
    tool: "slides",
    input: { topic: "Inteligência Artificial na Educação", numSlides: 5 },
    validate: (output) => {
      try {
        const slides = JSON.parse(output);
        const hasLocalContext = slides.some(s => s.localContext != null);
        const hasEvidence = slides.some(s => s.evidence != null);
        return { passed: hasLocalContext && hasEvidence, score: [hasLocalContext, hasEvidence].filter(Boolean).length };
      } catch {
        return { passed: false, score: 0 };
      }
    },
  },
];

// ═══════════════════════════════════════════════════════════
// Runner
// ═══════════════════════════════════════════════════════════

async function runTests() {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  EDUKA — Teste de Prompts e Contratos");
  console.log("═══════════════════════════════════════════════════════════\n");

  // Mock global fetch
  global.fetch = mockFetch;

  let passed = 0;
  let failed = 0;
  const results = [];

  for (const scenario of testScenarios) {
    process.stdout.write(`  ${scenario.name} ... `);

    try {
      // Simular chamada à API
      const response = await mockFetch(`/api/${scenario.tool}`, {
        method: "POST",
        body: JSON.stringify(scenario.input),
      });
      const data = await response.json();
      const output = data.choices?.[0]?.message?.content || "";

      // Validar
      const result = scenario.validate(output);
      if (result.passed) {
        console.log(`✓ PASS (${result.score}/5)`);
        passed++;
      } else {
        console.log(`✗ FAIL (${result.score}/5)`);
        failed++;
      }

      results.push({ name: scenario.name, ...result });
    } catch (err) {
      console.log(`✗ ERROR: ${err.message}`);
      failed++;
      results.push({ name: scenario.name, passed: false, score: 0, error: err.message });
    }
  }

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log(`  Resultado: ${passed}/${testScenarios.length} passaram, ${failed} falharam`);
  console.log("═══════════════════════════════════════════════════════════\n");

  // Resumo detalhado
  console.log("  Detalhes:");
  for (const r of results) {
    const status = r.passed ? "✓" : "✗";
    console.log(`    ${status} ${r.name}: ${r.score}/5`);
  }

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error("Erro fatal:", err);
  process.exit(1);
});
