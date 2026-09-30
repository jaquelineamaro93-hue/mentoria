import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import MeuPdiClient from './MeuPdiClient';
import type { PdiGuiaSecao, PdiResposta, Profile } from '@/lib/types';

export default async function MeuPdiPage({
  searchParams,
}: {
  searchParams: Promise<{ aba?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const params = await searchParams;
  const initialTab =
    params.aba === 'plano' || params.aba === 'documentos' || params.aba === 'feedbacks'
      ? params.aba
      : 'perguntas';

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>();

  const { data: secoes } = await supabase
    .from('pdi_guia_secoes')
    .select('*')
    .order('ordem', { ascending: true })
    .returns<PdiGuiaSecao[]>();

  const { data: respostas } = await supabase
    .from('pdi_respostas')
    .select('*')
    .eq('user_id', user.id)
    .returns<PdiResposta[]>();

  return (
    <div className="flex">
      
      <main className="flex-1 overflow-auto">
        <MeuPdiClient
          userId={user.id}
          profile={profile}
          secoes={secoes ?? []}
          respostasIniciais={respostas ?? []}
          initialTab={initialTab}
        />
      </main>
    </div>
  );
}
