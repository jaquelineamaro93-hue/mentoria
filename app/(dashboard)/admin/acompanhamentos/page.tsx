import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import AcompanhamentosClient from './AcompanhamentosClient';

export default async function AcompanhamentosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: perfil } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
  if (!perfil?.is_admin) redirect('/dashboard');
  const admin = createAdminClient();
  const [{ data: mentorados }, { data: registros }] = await Promise.all([
    admin.from('profiles').select('id,nome,email,genero,whatsapp_numero,whatsapp_consentimento_em,whatsapp_validado_em,trial_status,last_activity_at,onboarding_concluido,is_admin').eq('is_admin', false).order('nome'),
    admin.from('acompanhamentos_semanais').select('id,user_id,semana_inicio,objetivo,progresso,insight,proxima_acao,mensagem_whatsapp,status').order('semana_inicio',{ascending:false}).limit(500)
  ]);
  return <AcompanhamentosClient mentorados={mentorados || []} registros={registros || []} />;
}
