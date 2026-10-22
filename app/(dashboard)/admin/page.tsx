import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import AdminClient from './AdminClient';
import EnviarFeedbackClient from './EnviarFeedbackClient';
import { BLOCOS_QUEM_SOU_EU } from '@/lib/prompts';
import type { Profile } from '@/lib/types';

export interface LinhaMentorado {
  profile: Profile;
  diagnosticos: number;
  anotacoesDiario: number;
  blocosQuemSouEu: number;
  secoesPdi: number;
  fezVia: boolean;
  emailConfirmado: boolean;
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
    .select('*, is_admin:is_admin')
    .eq('id', user.id)
    .single<Profile>();

  if (!meuPerfil?.is_admin) {
    redirect('/dashboard');
  }

  const admin = createAdminClient();
  const [
    { data: perfis },
    { data: diagnosticos },
    { data: anotacoes },
    { data: quemSouEu },
    { data: pdi },
    { data: via },
    { data: secoesPdiTotal },
  ] = await Promise.all([
    admin
      .from('profiles')
      .select('*')
      .order('nome'),
    supabase.from('diagnostics').select('user_id'),
    supabase.from('journal_notes').select('user_id'),
    supabase.from('quem_sou_eu_respostas').select('user_id'),
    supabase.from('pdi_respostas').select('user_id'),
    supabase.from('via_resultados').select('user_id'),
    supabase.from('pdi_guia_secoes').select('id'),
  ]);

  // E-mail confirmado só dá pra ver com a service role (auth.users não é
  // exposto pelo client normal). Usamos isso pra avisar a admin ANTES da
  // mentorada travar tentando entrar, já que o envio de e-mail de
  // confirmação já mostrou ser instável.
  const emailsConfirmados = new Map<string, boolean>();
  try {
    const { data: authData } = await admin.auth.admin.listUsers({ perPage: 200 });
    for (const authUser of authData?.users ?? []) {
      emailsConfirmados.set(authUser.id, !!authUser.email_confirmed_at);
    }
  } catch {
    // Se isso falhar, a coluna some silenciosamente ao inves de quebrar o painel inteiro.
  }

  function contar(rows: { user_id: string }[] | null, userId: string) {
    return (rows ?? []).filter((r) => r.user_id === userId).length;
  }

  const linhas: LinhaMentorado[] = (perfis ?? [])
    // A conta administrativa de teste também precisa ser encontrável para
    // revisão da experiência. Outros administradores continuam fora da lista.
    .filter((p) => !p.is_admin || /^(jaque|jaqueline)\s+teste$/i.test(p.nome?.trim()??''))
    .map((p) => ({
      profile: p,
      diagnosticos: contar(diagnosticos, p.id),
      anotacoesDiario: contar(anotacoes, p.id),
      blocosQuemSouEu: contar(quemSouEu, p.id),
      secoesPdi: contar(pdi, p.id),
      fezVia: (via ?? []).some((v) => v.user_id === p.id),
      emailConfirmado: emailsConfirmados.get(p.id) ?? true,
    }));

  return (
    <>
      <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6">
        <Link href="/admin/copiloto" className="inline-flex min-h-11 items-center rounded-xl
          border border-[#b7d9cc] bg-[#e9f7f2] px-4 text-sm font-semibold text-[#135f50]
          hover:bg-[#dff2eb]">
          Central de Conversas da Íris
        </Link>
      </div>
      <AdminClient
        profile={meuPerfil}
        linhas={linhas}
        totalBlocosQuemSouEu={BLOCOS_QUEM_SOU_EU.length}
        totalSecoesPdi={(secoesPdiTotal ?? []).length}
      />
    </>
  );
}
