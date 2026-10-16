/** TopSend automation webhook. It acknowledges a trigger, not WhatsApp delivery.
 * Secrets and the generated URL must never be exposed to the browser.
 */
import { createAdminClient } from '@/lib/supabase/admin';

type Admin = ReturnType<typeof createAdminClient>;
export type TopSendTurno = {
  id: string; user_id: string; origem_id: string; status: string;
  resposta_gerada: string | null; insight: string | null; proximo_passo: string | null;
};
export function topsendConfigurado(): boolean {
  return process.env.TOPSEND_AUTOMATION_ENABLED === 'true' &&
    Boolean(process.env.TOPSEND_AUTOMATION_WEBHOOK_URL?.trim());
}
export function topsendRetornoConfigurado(): boolean {
  return Boolean(process.env.TOPSEND_INBOUND_SECRET &&
    process.env.TOPSEND_INBOUND_SECRET.length >= 24);
}

function validarWebhook(): URL {
  if (!topsendConfigurado()) throw new Error('Gatilho TopSend não configurado na SOMA.');
  let url: URL;
  try { url = new URL(process.env.TOPSEND_AUTOMATION_WEBHOOK_URL!); }
  catch { throw new Error('URL da automação TopSend inválida.'); }
  if (url.protocol !== 'https:' || !(url.hostname === 'topsend.io' || url.hostname.endsWith('.topsend.io')) ||
      url.username || url.password || url.port) {
    throw new Error('A URL do webhook precisa pertencer ao domínio HTTPS oficial da TopSend.');
  }
  return url;
}
function normalizarNumero(raw: string): string {
  const digits = raw.replace(/\D/g,'');
  const numero = digits.startsWith('55') ? digits : '55'+digits;
  if (!/^55[1-9]\d{9,10}$/.test(numero)) throw new Error('Telefone inválido para a automação TopSend.');
  return numero;
}
function primeiroNome(nome: string | null): string {
  return (nome || 'Você').trim().split(/\s+/)[0].slice(0,50);
}

/** Check the actual latest inbound interaction from either Meta, TopSend or
 * a verified-by-admin historical transcription. No arbitrary 24-hour reset.
 */
export async function ultimaEntradaWhatsApp(db: Admin,userId: string): Promise<string | null> {
  const [meta,ts,manual]=await Promise.all([
    db.from('whatsapp_respostas_mentoria').select('recebido_em')
      .eq('user_id',userId).order('recebido_em',{ascending:false}).limit(1).maybeSingle(),
    db.from('topsend_eventos_recebidos').select('recebido_em')
      .eq('user_id',userId).order('recebido_em',{ascending:false}).limit(1).maybeSingle(),
    db.from('iris_mensagens_importadas').select('ocorrido_em')
      .eq('user_id',userId).eq('direcao','entrada').order('ocorrido_em',{ascending:false}).limit(1).maybeSingle(),
  ]);
  if(meta.error || ts.error || manual.error) throw new Error('Não foi possível validar a janela de atendimento.');
  return [meta.data?.recebido_em,ts.data?.recebido_em,manual.data?.ocorrido_em]
    .filter((x): x is string=>typeof x==='string'&&!!x)
    .sort((a,b)=>Date.parse(b)-Date.parse(a))[0]||null;
}

export async function validarEnvioTopSend(db:Admin, turno:TopSendTurno) {
  const {data:p,error:profileError}=await db.from('profiles')
    .select('id,nome,whatsapp_numero,whatsapp_consentimento_em,iris_ia_consentimento_em,is_admin,status_assinatura,trial_status')
    .eq('id',turno.user_id).maybeSingle();
  const {data:estado,error:estadoError}=await db.from('iris_estado').select('pausado')
    .eq('user_id',turno.user_id).maybeSingle();
  if(profileError||estadoError) throw new Error('Falha ao consultar autorização do contato.');
  if(!p || p.is_admin || !p.whatsapp_consentimento_em || !p.iris_ia_consentimento_em ||
    estado?.pausado || (p.status_assinatura!=='ativo' && p.trial_status!=='active'))
    throw new Error('Contato sem autorização ou com acompanhamento pausado.');
  const telefone=normalizarNumero(p.whatsapp_numero||'');
  const msg=turno.resposta_gerada?.trim()||'';
  if(msg.length<20 || msg.length>600)throw new Error('Mensagem fora dos limites do acompanhamento.');
  const ultima=await ultimaEntradaWhatsApp(db,turno.user_id);
  const delta=ultima?Date.now()-Date.parse(ultima):Infinity;
  if(!Number.isFinite(delta)||delta<0||delta>23*3600000)
    throw new Error('Janela de conversa encerrada. A TopSend precisará usar um template aprovado para iniciar novo contato.');
  return {telefone,nome:primeiroNome(p.nome),mensagem:msg};
}

/** Atomic local reservation prevents accidental double send, even after timeout.
 * All ambiguous results go to manual review, without an automatic retry.
 */
export async function dispararTurnoTopSend(db:Admin, turno:TopSendTurno):
  Promise<{status:'acionado';detalhe:string}> {
  const url=validarWebhook();
  const contato=await validarEnvioTopSend(db,turno);
  if(!['pronto','revisao'].includes(turno.status))throw new Error('Turno não está disponível para disparo.');
  if(turno.status==='revisao'&&!turno.origem_id.startsWith('manual-rascunho-iris-'))
    throw new Error('Este turno requer revisão humana antes de ser liberado.');

  const referencia='SOMA_IRIS_'+turno.id.replace(/-/g,'');
  const {error:reserveError}=await db.from('topsend_despachos').insert({
    user_id:turno.user_id,turno_id:turno.id,referencia,status:'reservado',
    mensagem:contato.mensagem,
  });
  if(reserveError) {
    if(reserveError.code==='23505')
      throw new Error('Este rascunho já foi acionado ou reservado. Confira o histórico antes de tentar novamente.');
    throw new Error('Falha ao reservar disparo. Nada foi enviado.');
  }

  const {error:turnoError}=await db.from('iris_turnos').update({
    status:'enviando',atualizado_em:new Date().toISOString(),
  }).eq('id',turno.id).eq('status',turno.status);
  if(turnoError){
    await db.from('topsend_despachos').update({status:'incerto',observacao:'Falha ao registrar reserva.'})
      .eq('turno_id',turno.id);
    throw new Error('Falha ao reservar o turno. Nenhum reenvio automático.');
  }

  const payload={
    nome:contato.nome,
    telefone:contato.telefone,
    mensagem:contato.mensagem,
    referencia_soma:referencia,
    origem:'soma_mentoria',
    tipo:'acompanhamento_iris',
  };
  try{
    const res=await fetch(url.toString(),{
      method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},
      body:JSON.stringify(payload),redirect:'error',cache:'no-store',
      signal:AbortSignal.timeout(14000),
    });
    if(!res.ok)throw new Error('TopSend HTTP '+res.status);
    // HTTP 2xx only confirms the webhook trigger; not WhatsApp delivery.
    const momento=new Date().toISOString();
    const {error:dispatchError}=await db.from('topsend_despachos').update({
      status:'acionado',acionado_em:momento,atualizado_em:momento,
      observacao:'Webhook acionado; entrega WhatsApp ainda não confirmada.',
    }).eq('turno_id',turno.id);
    const {error:updateError}=await db.from('iris_turnos').update({
      status:'disparado',atualizado_em:momento,erro_resumido:null,
    }).eq('id',turno.id);
    if(dispatchError||updateError)throw new Error('TopSend recebeu o evento, mas a gravação do estado falhou.');
    const {data:state}=await db.from('iris_estado')
      .select('user_id').eq('user_id',turno.user_id).maybeSingle();
    const insightUpdate:Record<string,unknown>={updated_at:momento,
      proximo_passo:turno.proximo_passo,insight_atual:turno.insight};
    if(state) await db.from('iris_estado').update(insightUpdate).eq('user_id',turno.user_id);
    else await db.from('iris_estado').insert({user_id:turno.user_id,...insightUpdate});
    const {data:passo}=await db.from('iris_proximos_passos')
      .select('id').eq('turno_id',turno.id).limit(1).maybeSingle();
    if(!passo&&turno.proximo_passo){
      await db.from('iris_proximos_passos').insert({
        user_id:turno.user_id,turno_id:turno.id,insight:turno.insight,acao:turno.proximo_passo,
      });
    }
    return {status:'acionado',detalhe:'TopSend recebeu o gatilho. Entrega ainda não confirmada.'};
  }catch{
    await db.from('topsend_despachos').update({
      status:'incerto',atualizado_em:new Date().toISOString(),
      observacao:'Resposta incerta do webhook ou gravação incompleta; conferir na TopSend antes de reenviar.',
    }).eq('turno_id',turno.id);
    await db.from('iris_turnos').update({
      status:'revisao',erro_resumido:'Disparo TopSend incerto: verificar na plataforma antes de reenviar.',
    }).eq('id',turno.id);
    throw new Error('O resultado do gatilho TopSend ficou incerto. Confira o fluxo antes de tentar novamente.');
  }
}
