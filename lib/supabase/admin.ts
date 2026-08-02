import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Usa a service role key, que ignora RLS. Só deve ser usado em rotas de
// servidor de confiança (cron jobs), nunca exposto ao cliente.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY não configurada.');
  }

  return createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
