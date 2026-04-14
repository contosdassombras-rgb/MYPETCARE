import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Usamos Service Role para garantir que possasmos ler/escrever qualquer coisa
const supabase = createClient(supabaseUrl!, serviceKey!);

async function diagnose() {
  console.log("--- DIAGNOSTIC START ---");
  
  // 1. Verificar usuário
  const email = 'marcelolachi111@gmail.com';
  const { data: profiles, error: pError } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email);

  if (pError) {
    console.error("Error fetching profile:", pError);
  } else {
    console.log("Profiles found:", profiles);
    if (profiles.length > 0) {
      if (profiles[0].role !== 'admin') {
        console.log("UPGRADING USER TO ADMIN...");
        const { error: uError } = await supabase
          .from('profiles')
          .update({ role: 'admin' })
          .eq('email', email);
        if (uError) console.error("Update error:", uError);
        else console.log("SUCCESS: User is now admin.");
      }
    } else {
      console.log("User profile NOT FOUND in the database.");
    }
  }

  // 2. Verificar Tabelas
  const { error: tError } = await supabase.from('hotmart_events').select('count', { count: 'exact', head: true });
  if (tError) {
    console.warn("Table 'hotmart_events' might be missing:", tError.message);
  } else {
    console.log("Table 'hotmart_events' exists.");
  }

  console.log("--- DIAGNOSTIC END ---");
}

diagnose();
