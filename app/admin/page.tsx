import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AdminClient from './AdminClient';
import { BLOCOS_QUEM_SOU_EU } from '@/lib/prompts';
import type { Profile } from '@/lib/types';

export interface LinhaMentorado {
  profile: Profile;
  diagnosticos: number;
  anotacoesDiario: number;
  blocosQuemSouEu: number;
  secoesPdi: number;
  fezVia: boolean;
}

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: meuPerfil } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>();

  if (!meuPerfil?.is_admin) {
    redirect('/dashboard');
  }

  const [
    { data: perfis },
    { data: diagnosticos },
    { data: anotacoes },
    { data: quemSouEu },
    { data: pdi },
    { data: via },
    { data: secoesPdiTotal },
  ] = await Promise.all([
    supabase.from('profiles').select('*').order('nome'),
    supabase.from('diagnostics').select('user_id'),
    supabase.from('journal_notes').select('user_id'),
    supabase.from('quem_sou_eu_respostas').select('user_id'),
    supabase.from('pdi_respostas').select('user_id'),
    supabase.from('via_resultados').select('user_id'),
    supabase.from('pdi_guia_secoes').select('id'),
  ]);

  function contar(rows: { user_id: string }[] | null, userId: string) {
    return (rows ?? []).filter((r) => r.user_id === userId).length;
  }

  const linhas: LinhaMentorado[] = (perfis ?? [])
    .filter((p): p is Profile => !p.is_admin)
    .map((p) => ({
      profile: p,
      diagnosticos: contar(diagnosticos, p.id),
      anotacoesDiario: contar(anotacoes, p.id),
      blocosQuemSouEu: contar(quemSouEu, p.id),
      secoesPdi: contar(pdi, p.id),
      fezVia: (via ?? []).some((v) => v.user_id === p.id),
    }));

  return (
    <AdminClient
      profile={meuPerfil}
      linhas={linhas}
      totalBlocosQuemSouEu={BLOCOS_QUEM_SOU_EU.length}
      totalSecoesPdi={(secoesPdiTotal ?? []).length}
    />
  );
}
