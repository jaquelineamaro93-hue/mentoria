import AppShell from '@/components/AppShell';
import TermosGate from '@/components/TermosGate';
import { createClient } from '@/lib/supabase/server';
import type { Profile } from '@/lib/types';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: access } = user ? await supabase.rpc('soma_saas_state') : { data: null };
  let initialProfile: Profile | null = null;
  let copilotoLiberado = false;

  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single<Profile>();

    initialProfile = data ?? null;
    if (initialProfile) {
      const agora = new Date();
      const hojeSP = agora.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
      const planoAtivo = initialProfile.status_assinatura === 'ativo' &&
        (!initialProfile.data_fim_acesso || initialProfile.data_fim_acesso >= hojeSP);
      const trialAtivo = initialProfile.trial_status === 'active' &&
        !!initialProfile.trial_ends_at && new Date(initialProfile.trial_ends_at).getTime() > agora.getTime();
      const elegivel = access?.saas && !access.mentorship ? access.iris : initialProfile.is_admin || planoAtivo || trialAtivo;

      if (elegivel) {
        const [pausa, termo] = await Promise.all([
          supabase.from('mentoria_pausas').select('id').eq('user_id', user.id)
            .eq('status', 'ativa').limit(1).maybeSingle(),
          supabase.from('termos_versoes').select('id').eq('ativo', true)
            .order('publicado_em', { ascending: false }).limit(1).maybeSingle(),
        ]);
        if (!pausa.error && (!pausa.data || (access?.saas && access.iris)) && !termo.error && termo.data) {
          const { data: aceite, error: aceiteError } = await supabase
            .from('termos_aceites').select('id').eq('user_id', user.id)
            .eq('termo_id', termo.data.id).limit(1).maybeSingle();
          copilotoLiberado = !aceiteError && (!!aceite || (access?.saas && access.iris));
        }
      }
    }
  }

  return (
    <AppShell initialProfile={initialProfile} copilotoLiberado={copilotoLiberado} access={access}>
      {(!access?.saas || access.mentorship) && <TermosGate />}
      {children}
    </AppShell>
  );
}
