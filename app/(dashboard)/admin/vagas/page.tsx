import VagasControlClient from './VagasControlClient';
import { createClient } from '@/lib/supabase/server';

export default async function VagasPage() {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();

  if (!user.user) {
    return <div>Não autenticado</div>;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.user.id)
    .single();

  if (!profile?.is_admin) {
    return <div>Acesso negado</div>;
  }

  return <VagasControlClient />;
}
