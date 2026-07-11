import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTables() {
  console.log("Verificando a tabela user_interactions...");
  const { data, error } = await supabase
    .from('user_interactions')
    .select('*')
    .limit(1);
    
  if (error) {
    console.error("Erro ou tabela nao existe (user_interactions):", error.message);
  } else {
    console.log("Tabela user_interactions existe!");
  }
}

checkTables();
