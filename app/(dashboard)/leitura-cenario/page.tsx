import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import LeituraCenarioClient from './LeituraCenarioClient';

export default async function LeituraCenarioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: historico } = await supabase
    .from('soma_analises')
    .select('id, titulo, resultado_markdown, created_at')
    .eq('user_id', user.id)
    .eq('ferramenta', 'cenario')
    .order('created_at', { ascending: false })
    .limit(8);

  return <LeituraCenarioClient historicoInicial={historico ?? []} />;
}
