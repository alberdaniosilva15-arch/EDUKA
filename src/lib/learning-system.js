import { createAdminClient } from "@/lib/supabase/admin";

// Initialize Supabase admin client for backend operations
let supabase = null;
try {
  supabase = createAdminClient();
} catch {
  // Service role key não disponível — funcionalidades de tracking desactivadas
}

/**
 * Tracks user interactions with the platform to build a personalized learning profile
 * 
 * @param {string} userId - The user's ID
 * @param {string} actionType - 'generate', 'improve', 'explain', 'slides'
 * @param {string} topic - The topic the user interacted with
 * @param {object} metadata - Additional context (course, level, etc.)
 */
export async function trackUserInteraction(userId, actionType, topic, metadata = {}) {
  if (!supabase) return false;
  if (!userId) return false;

  try {
    const { error } = await supabase
      .from('user_interactions')
      .insert([
        {
          user_id: userId,
          action_type: actionType,
          topic: topic,
          metadata: metadata
        }
      ]);

    if (error) {
      console.warn("Failed to track interaction (ensure user_interactions table exists):", error.message);
      return false;
    }
    
    return true;
  } catch (err) {
    console.warn("Exception tracking interaction:", err);
    return false;
  }
}

/**
 * Retrieves the user's recent interactions to shape the AI's persona
 * 
 * @param {string} userId - The user's ID
 * @returns {Array} List of recent topics and contexts
 */
export async function getUserLearningContext(userId) {
  if (!supabase || !userId) return [];

  try {
    const { data, error } = await supabase
      .from('user_interactions')
      .select('topic, action_type, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error || !data) return [];
    
    return data;
  } catch (err) {
    return [];
  }
}

/**
 * Generates an adaptive system prompt based on user history
 * 
 * @param {string} userId - The user's ID
 * @param {string} basePrompt - The default system prompt
 * @returns {string} Enhanced system prompt
 */
export async function getAdaptiveSystemPrompt(userId, basePrompt) {
  const history = await getUserLearningContext(userId);
  
  if (!history || history.length === 0) {
    return basePrompt;
  }

  const topics = history.map(h => h.topic).join(', ');
  
  const adaptiveAddition = `
\\n\\n[NOTA DE CONTEXTO DO ESTUDANTE]
O utilizador tem demonstrado interesse recentemente nos seguintes tópicos: ${topics}. 
Se for relevante para o pedido atual, podes usar analogias ou fazer referências subtis a estes temas para facilitar a aprendizagem.`;

  return basePrompt + adaptiveAddition;
}
