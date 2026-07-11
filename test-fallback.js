// test-fallback.js
import 'dotenv/config';
import { generateContent } from './src/lib/ai-provider.js';

async function runTests() {
  console.log("=== Testando Cadeia de Fallback Eduka ===");
  
  // Teste 1: Roteamento basico (gemini)
  console.log("\n[Teste 1] Teste basico Gemini");
  try {
    const resGemini = await generateContent("Qual e a capital de Angola? (Responde apenas 1 palavra)", { provider: "gemini" });
    console.log("Gemini Success! Response:", resGemini.trim());
  } catch (e) {
    console.error("Gemini Error:", e.message);
  }

  // Teste 2: Modelo invalido no Groq/OpenRouter (isto ira provocar 400 no OpenRouter se enviado, mas na atual cadeia ele vai cair no fallback e usar default do NVIDIA ou Groq)
  // Como e dificil simular falha no OpenRouter externamente no script sem corromper a rede,
  // vamos simplesmente ver o mapeamento injetando um monkey-patching basico se possivel, ou rodando.
  console.log("\n[Teste 2] Teste OpenRouter c/ fallback simulado...");
  try {
    // modelo intencionalmente quebrado para OpenRouter
    const resBroken = await generateContent("Olá de luanda", { provider: "openrouter", model: "model_que_nao_existe_123" });
    console.log("Fallback Success! A rede resolveu para uma resposta:", resBroken.substring(0, 50), "...");
  } catch (e) {
    console.error("Error expected se todos falharem, actual:", e.message);
  }

  console.log("\n=== Testes Concluidos ===");
}

runTests();
