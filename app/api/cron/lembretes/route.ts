import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  enviarEmail,
  templateInatividade,
  templateLembreteEncontro,
  templateOnboardingPendente,
} from '@/lib/sendgrid';

const DIAS_INATIVIDADE = 7;
const DIAS_ENTRE_LEMBRETES = 7;

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const resultado = { inatividade: 0, onboarding: 0, encontros: 0, erros: [] as string[] };

  // 1. Mentorados inativos há mais de DIAS_INATIVIDADE dias
  const limiteInatividade = new Date(
    Date.now() - DIAS_INATIVIDADE * 86400000
  ).toISOString();

  const { data: perfis } = await supabase
    .from('profiles')
    .select('id, nome, email, last_login_at, onboarding_concluido')
    .eq('is_admin', false);

  for (const perfil of perfis ?? []) {
    const inativo =
      !perfil.last_login_at || perfil.last_login_at < limiteInatividade;

    if (inativo) {
      const { data: ultimoEnvio } = await supabase
        .from('emails_enviados')
        .select('enviado_em')
        .eq('user_id', perfil.id)
        .eq('tipo', 'inatividade')
        .order('enviado_em', { ascending: false })
        .limit(1)
        .maybeSingle();

      const podeReenviar =
        !ultimoEnvio ||
        Date.now() - new Date(ultimoEnvio.enviado_em).getTime() >
          DIAS_ENTRE_LEMBRETES * 86400000;

      if (podeReenviar) {
        try {
          await enviarEmail({
            para: perfil.email,
            assunto: 'Sentimos sua falta na Mentoria SOMA',
            html: templateInatividade(perfil.nome),
          });
          await supabase
            .from('emails_enviados')
            .insert({ user_id: perfil.id, tipo: 'inatividade' });
          resultado.inatividade++;
        } catch (e) {
          resultado.erros.push(`inatividade ${perfil.email}: ${e}`);
        }
      }
    }

    // 2. Onboarding pendente
    if (!perfil.onboarding_concluido) {
      const { data: ultimoEnvioOnboarding } = await supabase
        .from('emails_enviados')
        .select('enviado_em')
        .eq('user_id', perfil.id)
        .eq('tipo', 'onboarding_pendente')
        .order('enviado_em', { ascending: false })
        .limit(1)
        .maybeSingle();

      const podeReenviarOnboarding =
        !ultimoEnvioOnboarding ||
        Date.now() - new Date(ultimoEnvioOnboarding.enviado_em).getTime() >
          DIAS_ENTRE_LEMBRETES * 86400000;

      if (podeReenviarOnboarding) {
        try {
          await enviarEmail({
            para: perfil.email,
            assunto: 'Vamos marcar seu onboarding?',
            html: templateOnboardingPendente(perfil.nome),
          });
          await supabase
            .from('emails_enviados')
            .insert({ user_id: perfil.id, tipo: 'onboarding_pendente' });
          resultado.onboarding++;
        } catch (e) {
          resultado.erros.push(`onboarding ${perfil.email}: ${e}`);
        }
      }
    }
  }

  // 3. Encontros que acontecem nas próximas 24 a 48 horas
  const agora = new Date();
  const em24h = new Date(agora.getTime() + 24 * 3600000).toISOString();
  const em48h = new Date(agora.getTime() + 48 * 3600000).toISOString();

  const { data: encontros } = await supabase
    .from('announcements')
    .select('id, titulo, data_evento')
    .gte('data_evento', em24h)
    .lte('data_evento', em48h);

  if (encontros && encontros.length > 0) {
    for (const encontro of encontros) {
      const { data: jaEnviados } = await supabase
        .from('emails_enviados')
        .select('user_id')
        .eq('tipo', 'lembrete_encontro')
        .eq('referencia_id', encontro.id);

      const idsJaEnviados = new Set((jaEnviados ?? []).map((e) => e.user_id));

      for (const perfil of perfis ?? []) {
        if (idsJaEnviados.has(perfil.id)) continue;

        try {
          await enviarEmail({
            para: perfil.email,
            assunto: `Lembrete: ${encontro.titulo}`,
            html: templateLembreteEncontro(
              perfil.nome,
              encontro.titulo,
              new Date(encontro.data_evento).toLocaleString('pt-BR')
            ),
          });
          await supabase.from('emails_enviados').insert({
            user_id: perfil.id,
            tipo: 'lembrete_encontro',
            referencia_id: encontro.id,
          });
          resultado.encontros++;
        } catch (e) {
          resultado.erros.push(`encontro ${perfil.email}: ${e}`);
        }
      }
    }
  }

  return NextResponse.json(resultado);
}
