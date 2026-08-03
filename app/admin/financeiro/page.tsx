import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import FinanceiroClient from './FinanceiroClient';

export default async function FinanceiroPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: perfilAdmin } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!perfilAdmin?.is_admin) redirect('/dashboard');

  const { data: mentorados } = await supabase
    .from('profiles')
    .select('*')
    .eq('is_admin', false)
    .order('nome', { ascending: true });

  const { data: planos } = await supabase.from('planos_mentoria').select('*');

  return <FinanceiroClient profile={perfilAdmin} mentorados={mentorados || []} planos={planos || []} />;
}
