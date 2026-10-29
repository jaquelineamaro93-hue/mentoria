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
  base: {
    ativosConsiderados: number;
    nuncaAcessaram: number;
    inativos7dias: number;
    onboardingPendentes: number;
    cooldownInatividade: number;
    cooldownOnboarding: number;
  };
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
    base: {
      ativosConsiderados: 0,
      nuncaAcessaram: 0,
      inativos7dias: 0,
      onboardingPendentes: 0,
      cooldownInatividade: 0,
      cooldownOnboarding: 0,
    },
  };

  const limiteInatividade = new Date(Date.now() - DIAS_INATIVIDADE * 86400000).toISOString();

  const { data: perfis } = await supabase
    .from('profiles')
    .select('id, nome, email, last_login_at, last_activity_at, onboarding_concluido, tipo_pacote, status_assinatura')
    .eq('is_admin', false);

  const {data:pausas,error:pausaError}=await supabase.from('mentoria_pausas')
    .select('user_id,status,atualizado_em')
    .or('status.eq.ativa,atualizado_em.gte.'+
      new Date(Date.now()-7*86400000).toISOString()+')');
  if(pausaError){
    // Nunca enviar lembretes durante a pausa se não for possível
    // confirmar os estados: falhar de forma conservadora.
    resultado.erros.push('Não foi possível validar as pausas. Lembretes suspensos nesta execução.');
    return resultado;
  }
  const usuariosPausados=new Set((pausas??[]).filter(p=>p.status==='ativa').map(p=>p.user_id));
  const retomadosRecentes=new Set((pausas??[]).filter(p=>
    p.status==='finalizada'&&Date.parse(p.atualizado_em)>Date.now()-7*86400000
  ).map(p=>p.user_id));
  const perfisAtivos=(perfis??[]).filter(perfil=>
    perfil.status_assinatura==='ativo' &&
    !usuariosPausados.has(perfil.id)&&!retomadosRecentes.has(perfil.id));
  resultado.base.ativosConsiderados=perfisAtivos.length;

  for (const perfil of perfisAtivos) {
    const ultimaAtividade = perfil.last_activity_at ?? perfil.last_login_at;

    if (!ultimaAtividade) {
      resultado.base.nuncaAcessaram++;
    }

    const inativo = !!ultimaAtividade && ultimaAtividade < limiteInatividade;

    if (inativo) {
      resultado.base.inativos7dias++;
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

      if (!podeReenviar) {
        resultado.base.cooldownInatividade++;
      }

      if (podeReenviar) {
        try {
          const envio=await enviarEmail({
            para: perfil.email,
            assunto: 'Sua carreira continua no seu ritmo, dentro da SOMA',
            html: templateInatividade(perfil.nome),
          });
          if(!envio)throw new Error('Envio rejeitado pelo provedor');
          await supabase.from('emails_enviados').insert({ user_id: perfil.id, tipo: 'inatividade' });
          resultado.inatividade++;
        } catch (e) {
          resultado.erros.push(`inatividade ${perfil.email}: ${e}`);
        }
      }
    }

    if (!perfil.onboarding_concluido) {
      resultado.base.onboardingPendentes++;

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

      if (!podeReenviarOnboarding) {
        resultado.base.cooldownOnboarding++;
      }

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
      const { data: jaEnviados, error: erroConsultaEnvios } = await supabase
        .from('emails_enviados')
        .select('user_id')
        .eq('tipo', 'lembrete_encontro')
        .eq('referencia_id', encontro.id);

      if (erroConsultaEnvios) {
        resultado.erros.push('Não foi possível verificar os lembretes deste encontro.');
        continue;
      }

      const idsJaEnviados = new Set((jaEnviados ?? []).map((e) => e.user_id));

      for (const perfil of perfisAtivos) {
        if (idsJaEnviados.has(perfil.id)) continue;

        try {
          const enviado = await enviarEmail({
            para: perfil.email,
            assunto: `Lembrete: ${encontro.titulo}`,
            html: templateLembreteEncontro(
              perfil.nome,
              encontro.titulo,
              new Date(encontro.data_evento).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) + ' (horário de Brasília)'
            ),
          });
          if (!enviado) throw new Error('Envio rejeitado pelo provedor');
          const { error: erroRegistro } = await supabase.from('emails_enviados').insert({
            user_id: perfil.id,
            tipo: 'lembrete_encontro',
            referencia_id: encontro.id,
          });
          if (erroRegistro) throw new Error('Falha ao registrar o lembrete enviado');
          resultado.encontros++;
        } catch (e) {
          resultado.erros.push(`encontro ${perfil.email}: ${e}`);
        }
      }
    }
  }

  // Votação de encontro presencial pendente: manda uma vez para quem ainda
  // não votou (sem cooldown de repetição, já que é uma janela curta e única).
  // Só conta voto do encontro presencial: quem votou no online continua
  // recebendo o convite do presencial, e vice-versa.
  const { data: quemJaVotou } = await supabase
    .from('votos_encontro')
    .select('user_id')
    .eq('tipo', 'presencial');
  const idsJaVotaram = new Set((quemJaVotou ?? []).map((v) => v.user_id));

  for (const perfil of perfisAtivos) {
    // O encontro é presencial: só alunos ativos desse plano recebem o convite.
    if (perfil.tipo_pacote !== 'presencial') continue;
    if (perfil.status_assinatura !== 'ativo') continue;
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
