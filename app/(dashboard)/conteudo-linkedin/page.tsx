import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import LinkedinContentStudioClient from './LinkedinContentStudioClient';

export default async function ConteudoLinkedInPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const [
    profile,
    mapa,
    bussola,
    via,
    pdi,
    linkedin,
    resumo,
    voz,
    ideiasSalvas,
    drafts,
  ] = await Promise.all([
    supabase.from('profiles').select('nome').eq('id', user.id).maybeSingle(),
    supabase.from('mapa_essencia').select('id').eq('user_id', user.id).limit(1),
    supabase.from('bussola_posicionamento').select('id').eq('user_id', user.id).limit(1),
    supabase.from('via_resultados').select('id').eq('user_id', user.id).limit(1),
    supabase
      .from('pdi_respostas')
      .select('id')
      .eq('user_id', user.id)
      .eq('concluido', true)
      .limit(1),
    supabase
      .from('soma_analises')
      .select('id')
      .eq('user_id', user.id)
      .eq('ferramenta', 'linkedin')
      .limit(1),
    supabase.from('resumo_perfil').select('id').eq('user_id', user.id).limit(1),
    supabase
      .from('linkedin_content_voice_profiles')
      .select('profile_json, updated_at')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('linkedin_content_idea_banks')
      .select('pilares, ideias, updated_at')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('linkedin_content_drafts')
      .select(
        'id, titulo, ideia, objetivo, audiencia, formato, angulo, cta_tipo, hook_escolhido, conteudo, resultado_json, status, created_at, updated_at'
      )
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(20),
  ]);

  return (
    <LinkedinContentStudioClient
      userId={user.id}
      nome={profile.data?.nome || 'Você'}
      contextoStatus={{
        mapa: Boolean(mapa.data?.length),
        bussola: Boolean(bussola.data?.length),
        via: Boolean(via.data?.length),
        pdi: Boolean(pdi.data?.length),
        linkedin: Boolean(linkedin.data?.length),
        resumo: Boolean(resumo.data?.length),
      }}
      vozInicial={(voz.data?.profile_json as Record<string, unknown> | null) ?? null}
      pilaresIniciais={(ideiasSalvas.data?.pilares as any[]) ?? []}
      ideiasIniciais={(ideiasSalvas.data?.ideias as any[]) ?? []}
      historicoInicial={(drafts.data ?? []) as any[]}
    />
  );
}
