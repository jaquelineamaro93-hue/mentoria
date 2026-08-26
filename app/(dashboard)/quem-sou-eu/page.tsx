import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import QuemSouEuClient from './QuemSouEuClient';
import type { BussolaPosicionamento, MapaEssencia, Profile, QuemSouEuResposta } from '@/lib/types';

export default async function QuemSouEuPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>();

  const { data: respostas } = await supabase
    .from('quem_sou_eu_respostas')
    .select('*')
    .eq('user_id', user.id)
    .returns<QuemSouEuResposta[]>();

  const { data: mapas } = await supabase
    .from('mapa_essencia')
    .select('*')
    .eq('user_id', user.id)
    .order('gerado_em', { ascending: false })
    .limit(1)
    .returns<MapaEssencia[]>();

  const { data: bussolas } = await supabase
    .from('bussola_posicionamento')
    .select('*')
    .eq('user_id', user.id)
    .order('gerado_em', { ascending: false })
    .limit(1)
    .returns<BussolaPosicionamento[]>();

  return (
    <QuemSouEuClient
      profile={profile}
      userId={user.id}
      respostasIniciais={respostas ?? []}
      mapaInicial={mapas?.[0] ?? null}
      bussolaInicial={bussolas?.[0] ?? null}
    />
  );
}
