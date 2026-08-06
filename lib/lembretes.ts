import { createAdminClient } from '@/lib/supabase/admin';
import {
  enviarEmail,
  templateInatividade,
  templateLembreteEncontro,
  templateOnboardingPendente,
  templateVotacaoPendente,
} from '@/lib/sendgrid';

const DIAS_INATIVIDADE = 7;
const DIAS_ENTRE_LEMBRETES = 7;

export interface ResultadoLembretes {
  inatividade: number;
  onboarding: number;
  encontros: number;
  votacao: number;
  erros: string[];
}

// Roda toda a lógica de lembretes automáticos: inatividade, onboarding
// pendente, encontros próximos e votação de encontro presencial pendente.
// Usada tanto pelo cron diário (app/api/cron/lembretes) quanto pelo botão
// manual "Enviar lembretes agora" no painel admin.
export async function executarLembretes(): Promise<ResultadoLembretes> {
  const supabase = createAdminClient();
  const resultado: ResultadoLembretes = {
    inatividade: 0,
    onboarding: 0,
    encontros: 0,
    votacao: 0,
    erros: [],
  };

  const limiteInatividade = new Date(Date.now() - DIAS_INATIVIDADE * 86400000).toISOString();

  const { data: perfis } = await supabase
    .from('profiles')
    .select('id, nome, email, last_login_at, onboarding_concluido')
    .eq('is_admin', false);

  for (const perfil of perfis ?? []) {
    const inativo = !perfil.last_login_at || perfil.last_login_at < limiteInatividade;

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
        Date.now() - new Date(ultimoEnvio.enviado_em).getTime() > DIAS_ENTRE_LEMBRETES * 86400000;

      if (podeReenviar) {
        try {
          await enviarEmail({
            para: perfil.email,
            assunto: 'Sentimos sua falta na Mentoria SOMA',
            html: templateInatividade(perfil.nome),
          });
          await supabase.from('emails_enviados').insert({ user_id: perfil.id, tipo: 'inatividade' });
          resultado.inatividade++;
        } catch (e) {
          resultado.erros.push(`inatividade ${perfil.email}: ${e}`);
        }
      }
    }

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

  // Encontros nas próximas 48 horas. A janela começa em "agora" (e não em
  // +24h) para não depender do cron cair exatamente 24-48h antes do evento:
  // o controle de duplicidade é feito por emails_enviados (tipo + referencia_id),
  // então rodar o cron todo dia dentro dessa janela mais larga é seguro e
  // garante que um evento cadastrado em cima da hora ainda gere lembrete.
  const agora = new Date();
  const em48h = new Date(agora.getTime() + 48 * 3600000).toISOString();

  const { data: encontros } = await supabase
    .from('announcements')
    .select('id, titulo, data_evento')
    .gte('data_evento', agora.toISOString())
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

  // Votação de encontro presencial pendente: manda uma vez para quem ainda
  // não votou (sem cooldown de repetição, já que é uma janela curta e única).
  const { data: quemJaVotou } = await supabase.from('votos_encontro').select('user_id');
  const idsJaVotaram = new Set((quemJaVotou ?? []).map((v) => v.user_id));

  for (const perfil of perfis ?? []) {
    if (idsJaVotaram.has(perfil.id)) continue;

    const { data: jaEnviadoVotacao } = await supabase
      .from('emails_enviados')
      .select('id')
      .eq('user_id', perfil.id)
      .eq('tipo', 'votacao_pendente')
      .maybeSingle();

    if (jaEnviadoVotacao) continue;

    try {
      await enviarEmail({
        para: perfil.email,
        assunto: 'Falta seu voto para o próximo encontro presencial',
        html: templateVotacaoPendente(perfil.nome),
      });
      await supabase.from('emails_enviados').insert({ user_id: perfil.id, tipo: 'votacao_pendente' });
      resultado.votacao++;
    } catch (e) {
      resultado.erros.push(`votacao ${perfil.email}: ${e}`);
    }
  }

  return resultado;
}
