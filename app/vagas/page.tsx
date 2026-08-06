import VagasClient from './VagasClient';
import { createClient } from '@/lib/supabase/server';
import type { Profile } from '@/lib/types';

export default async function VagasPage() {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();

  if (!user.user) {
    return <div className="p-8">Não autenticado</div>;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('nome, tipo_pacote, is_admin')
    .eq('id', user.user.id)
    .single<Pick<Profile, 'nome' | 'tipo_pacote' | 'is_admin'>>();

  return <VagasClient profile={profile} />;
}
