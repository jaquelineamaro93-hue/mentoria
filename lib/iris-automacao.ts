import { createAdminClient } from '@/lib/supabase/admin';
import {
  anonimizarContextoIris, consultarRespostaIris, enviarParaIris, enviarWhatsAppTemplate,
  enviarWhatsAppTexto, instrucoesDaIris, irisAutomacaoConfigurada, obterTarefaDaIris,
} from '@/lib/iris-integracoes';

type Turno = {
  id: string; user_id: string; origem_id: string; origem_tipo: string;
  status: string; manus_task_id: string | null; manus_marcador: string | null;
  manus_enviado_em: string | null; resposta_gerada: string | null;
  insight: string | null; proximo_passo: string | null; criado_em: string;
};
const pausa = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));
const riscoAlto = (texto: string) =>
  /\b(suicid|tirar minha vida|me matar|automutila|ameaça de morte|violência imediata)\b/i.test(texto);

async function acessoPermitido(admin: ReturnType<typeof createAdminClient>, userId: string) {
  const [{ data: perfil }, { data: estado }] = await Promise.all([
    admin.from('profiles').select('id,nome,whatsapp_numero,whatsapp_consentimento_em,iris_ia_consentimento_em,is_admin,trial_status,status_assinatura')
      .eq('id', userId).maybeSingle(),
    admin.from('iris_estado').select('pausado,objetivo_atual,proximo_passo,ultimo_envio_em')
      .eq('user_id', userId).maybeSingle(),
  ]);
  const permitido = !!perfil && !perfil.is_admin &&
    !!perfil.whatsapp_numero && !!perfil.whatsapp_consentimento_em &&
    !!perfil.iris_ia_consentimento_em && !estado?.pausado &&
    (perfil.status_assinatura === 'ativo' ||
      perfil.trial_status === 'active');
  return { perfil, estado, permitido };
}

async function atualizarTurno(admin: ReturnType<typeof createAdminClient>, id: string, update: Record<string, unknown>) {
  const { error } = await admin.from('iris_turnos')
    .update({ ...update, atualizado_em: new Date().toISOString() }).eq('id', id);
  if (error) throw new Error('Não foi possível salvar o estado do turno Íris.');
}

async function registrarEnvio(admin: ReturnType<typeof createAdminClient>, turno: Turno, texto: string, messageId: string, tipo: 'texto'|'template') {
  const { error } = await admin.from('iris_mensagens_enviadas').insert({
    user_id: turno.user_id, turno_id: turno.id,
    meta_message_id: messageId, conteudo: texto, tipo,
  });
  if (error) throw new Error('Envio confirmado, mas o histórico não foi salvo. Revisão manual necessária.');
  const agora = new Date().toISOString();
  // Um convite de template não pode apagar o insight ou a ação anterior.
  const estadoUpdate: Record<string, unknown> = {
    user_id: turno.user_id, ultimo_envio_em: agora, ultima_interacao_em: agora, updated_at: agora,
  };
  if (tipo === 'texto') {
    estadoUpdate.proximo_passo = turno.proximo_passo;
    estadoUpdate.insight_atual = turno.insight;
  }
  const { error: stateError } = await admin.from('iris_estado').upsert(
    estadoUpdate, { onConflict: 'user_id' });
  if (stateError) throw new Error('Histórico de mensagens salvo, mas não foi possível atualizar a jornada.');
  if (turno.proximo_passo?.trim()) {
    const { error: stepError } = await admin.from('iris_proximos_passos').insert({
      user_id: turno.user_id, turno_id: turno.id,
      insight: turno.insight, acao: turno.proximo_passo,
    });
    if (stepError) throw new Error('Histórico salvo, mas não foi possível registrar o próximo passo.');
  }
  await atualizarTurno(admin, turno.id, { status: 'enviado', meta_message_id: messageId, erro_resumido: null });
}

async function iniciarIris(admin: ReturnType<typeof createAdminClient>, turno: Turno, estado: { objetivo_atual?: string | null; proximo_passo?: string | null } | null) {
  const apiKey = process.env.MANUS_API_KEY!;
  const agentId = process.env.MANUS_AGENT_ID!;
  const { data: mensagens } = await admin.from('whatsapp_respostas_mentoria')
    .select('conteudo,recebido_em').eq('user_id', turno.user_id).order('recebido_em', { ascending: false }).limit(4);
  const ultimas = (mensagens ?? []).slice().reverse().map(m => m.conteudo);
  if (ultimas.some(riscoAlto)) {
    await atualizarTurno(admin, turno.id, { status: 'revisao', erro_resumido: 'Relato sensível. Acompanhamento humano necessário.' });
    return;
  }
  const { data: entrevistas } = await admin.from('entrevistas_iniciais').select('objetivo_principal')
    .eq('user_id', turno.user_id).limit(1).maybeSingle();
  const objetivo = estado?.objetivo_atual || entrevistas?.objetivo_principal || 'Ainda não informado';
  const marcador = 'SOMA_' + turno.id.replace(/-/g,'');
  const taskId = await obterTarefaDaIris(apiKey, agentId);
  const agora = new Date().toISOString();

  // Reserva ANTES da chamada externa: falha parcial não pode disparar segunda
  // mensagem para a mesma tarefa principal compartilhada.
  await atualizarTurno(admin, turno.id, {
    manus_task_id: taskId, manus_marcador: marcador, manus_enviado_em: agora,
  });
  const prompt = instrucoesDaIris(marcador, ultimas, objetivo, estado?.proximo_passo || '');
  try {
    await enviarParaIris(apiKey, taskId, prompt);
  } catch {
    await atualizarTurno(admin, turno.id, {
      status: 'revisao', erro_resumido: 'Não foi possível confirmar a análise Manus. Nenhum reenvio automático será feito.',
    });
  }
}

async function consultarEEnviar(admin: ReturnType<typeof createAdminClient>, turno: Turno) {
  if (turno.status === 'aguardando_agente') {
    if (!turno.manus_task_id || !turno.manus_marcador || !turno.manus_enviado_em) {
      // Estado em que uma solicitação externa pode estar em progresso.
      await atualizarTurno(admin, turno.id, {
        status: 'revisao', erro_resumido: 'Solicitação ao agente incompleta. Exige inspeção antes de tentar de novo.',
      });
      return 'revisao';
    }
    let leitura = null;
    for (let tentativa = 0; tentativa < 12; tentativa++) {
      leitura = await consultarRespostaIris(process.env.MANUS_API_KEY!, turno.manus_task_id,
        turno.manus_marcador, turno.manus_enviado_em);
      if (leitura) break;
      await pausa(3500);
    }
    if (!leitura) return 'aguardando_agente';
    if (leitura.encaminhar_humano) {
      await atualizarTurno(admin, turno.id, {
        status: 'revisao', insight: leitura.insight,
        proximo_passo: leitura.proximo_passo,
        erro_resumido: 'A Íris indicou que o contato precisa de acompanhamento humano.',
      });
      return 'revisao';
    }
    await atualizarTurno(admin, turno.id, {
      status: 'pronto', resposta_gerada: leitura.mensagem,
      insight: leitura.insight, proximo_passo: leitura.proximo_passo,
    });
    turno.status = 'pronto';
    turno.resposta_gerada = leitura.mensagem;
    turno.insight = leitura.insight;
    turno.proximo_passo = leitura.proximo_passo;
  }

  if (turno.status !== 'pronto') return turno.status;
  const { perfil, permitido } = await acessoPermitido(admin, turno.user_id);
  if (!permitido || !perfil?.whatsapp_numero) {
    await atualizarTurno(admin, turno.id, { status: 'cancelado', erro_resumido: 'Consentimento ou elegibilidade ausente.' });
    return 'cancelado';
  }
  const { data: ultima } = await admin.from('whatsapp_respostas_mentoria')
    .select('recebido_em').eq('user_id', turno.user_id).order('recebido_em', { ascending: false }).limit(1).maybeSingle();
  const dentroJanela = ultima?.recebido_em &&
    Date.now() - new Date(ultima.recebido_em).getTime() < 23 * 3600000 &&
    Date.now() >= new Date(ultima.recebido_em).getTime();
  if (!dentroJanela) {
    await atualizarTurno(admin, turno.id, { status: 'revisao',
      erro_resumido: 'Janela de atendimento WhatsApp encerrada. Exige template aprovado.' });
    return 'revisao';
  }
  const corpo = turno.resposta_gerada?.replace(/^\s*(?:oi|olá)[^\n]{0,45}(?:\n|$)/i, '').trim() || '';
  if (corpo.length < 20 || corpo.length > 600) {
    await atualizarTurno(admin, turno.id, { status: 'revisao', erro_resumido: 'Mensagem automática fora dos limites seguros.' });
    return 'revisao';
  }
  // Status 'enviando' é terminal para reprocessamento automático incerto:
  // não repetir mensagens se a Cloud API confirmou envio mas o DB falhou.
  await atualizarTurno(admin, turno.id, { status: 'enviando' });
  try {
    const id = await enviarWhatsAppTexto(perfil.whatsapp_numero, corpo);
    await registrarEnvio(admin, turno, corpo, id, 'texto');
    return 'enviado';
  } catch {
    await atualizarTurno(admin, turno.id, { status: 'revisao',
      erro_resumido: 'Envio de WhatsApp ou gravação incerto; revisar manualmente antes de reprocessar.' });
    return 'revisao';
  }
}

/**
 * Processador de uma conversa por vez, porque a Íris da Cue tem main task
 * compartilhada. O RPC impede cruzamento de sessões de mentorados da SOMA.
 * O job corre em pós-resposta do webhook e também no cron de recuperação.
 */
export async function processarFilaIris() {
  if (!irisAutomacaoConfigurada()) return { ativo: false, motivo: 'Aguardando credenciais da Meta e habilitação.' };
  const admin = createAdminClient();
  const { data: pendentes, error } = await admin.from('iris_turnos').select('*')
    .in('status', ['aguardando_agente','pronto','enviando']).order('criado_em').limit(1);
  if (error) return { ativo: true, erro: 'Falha ao consultar fila.' };
  if (pendentes?.[0]?.status === 'enviando') return { ativo: true, pendente: 'envio incerto exige revisão humana' };

  let turno = (pendentes?.[0] ?? null) as Turno | null;
  if (!turno) {
    const claim = await admin.rpc('iris_reivindicar_turno');
    if (claim.error) return { ativo: true, erro: 'Não foi possível reservar um turno.' };
    turno = (claim.data?.[0] ?? null) as Turno | null;
  }
  if (!turno) return { ativo: true, processado: 0 };
  const { estado, permitido } = await acessoPermitido(admin, turno.user_id);
  if (!permitido) {
    await atualizarTurno(admin, turno.id, { status: 'cancelado', erro_resumido: 'Automação sem consentimento ou pausada.' });
    return { ativo: true, cancelado: 1 };
  }
  try {
    if (!turno.manus_enviado_em) {
      await iniciarIris(admin, turno, estado);
      // Recupera o estado gravado; se houve falha não tenta novamente.
      const { data: atual } = await admin.from('iris_turnos').select('*').eq('id', turno.id).single();
      if (!atual || atual.status === 'revisao') return { ativo: true, revisao: 1 };
      turno = atual as Turno;
    }
    const result = await consultarEEnviar(admin, turno);
    return { ativo: true, resultado: result };
  } catch {
    await atualizarTurno(admin, turno.id, {
      status: 'revisao',
      erro_resumido: 'Falha na análise/consulta do agente. Revisão manual necessária, sem reenvio automático.',
    });
    return { ativo: true, revisao: 1 };
  }
}

/** Convite semanal usa SOMENTE template previamente aprovado pela Meta.
 * Nunca envia texto livre para iniciar uma conversa fora da janela de 24h.
 */
export async function enviarConvitesSemanaisIris() {
  if (!irisAutomacaoConfigurada() || !process.env.WHATSAPP_TEMPLATE_NAME) {
    return { habilitado: false, enviados: 0 };
  }
  const admin = createAdminClient();
  const { data: perfis, error } = await admin.from('profiles')
    .select('id,nome,whatsapp_numero,whatsapp_consentimento_em,iris_ia_consentimento_em,is_admin,trial_status,status_assinatura')
    .not('iris_ia_consentimento_em','is',null).eq('is_admin',false).limit(100);
  if (error) return { habilitado: true, enviados: 0, erro: 'Consulta de perfis indisponível.' };
  let enviados = 0;
  for (const pessoa of perfis ?? []) {
    if (enviados >= 5) break;
    const { permitido, estado } = await acessoPermitido(admin, pessoa.id);
    if (!permitido || !pessoa.whatsapp_numero) continue;
    const { data: ultimoEnvio } = await admin.from('iris_mensagens_enviadas')
      .select('enviado_em').eq('user_id',pessoa.id).order('enviado_em',{ascending:false}).limit(1).maybeSingle();
    if (ultimoEnvio && Date.now() - new Date(ultimoEnvio.enviado_em).getTime() < 7 * 86400000) continue;
    if (estado?.ultimo_envio_em && Date.now() - new Date(estado.ultimo_envio_em).getTime() < 7 * 86400000) continue;
    const semana = new Date().toISOString().slice(0,10);
    const origem_id = 'semanal:' + pessoa.id + ':' + semana;
    const { data: turno, error: erroTurno } = await admin.from('iris_turnos')
      .insert({ user_id: pessoa.id, origem_id, origem_tipo: 'semanal', status: 'enviando' }).select('*').single();
    if (erroTurno || !turno) continue;
    try {
      const metaId = await enviarWhatsAppTemplate(pessoa.whatsapp_numero, pessoa.nome?.trim().split(/\s+/)[0] || 'você');
      const descricao = 'Convite semanal da Íris (template aprovado pela Meta)';
      await registrarEnvio(admin, turno as Turno, descricao, metaId, 'template');
      enviados++;
    } catch {
      await atualizarTurno(admin, turno.id, { status: 'revisao',
        erro_resumido: 'Envio ou registro de template incerto; conferência manual necessária.' });
    }
  }
  return { habilitado: true, enviados };
}
