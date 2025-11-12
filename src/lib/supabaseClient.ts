// src/lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anon) {
  // ⚠️ Voir la console du navigateur si ça s’affiche
  console.error("❌ VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY manquantes au runtime.");
  console.error("VITE_SUPABASE_URL:", url);
  console.error(
    "VITE_SUPABASE_ANON_KEY:",
    anon ? `(présente, ${anon.length} chars)` : "absente"
  );
}

export const supabase = createClient(url ?? "", anon ?? "");
