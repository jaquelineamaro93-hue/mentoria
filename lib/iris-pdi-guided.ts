import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';

type Db = Awaited<ReturnType<typeof createClient>>;
type Body = Record<string, unknown>;
type Modo = 'pendentes' | 'revisar';
type Secao = { codigo: string; titulo: string; instrucoes: string | null };
type Resposta = { secao: string; dados: { texto?: string } | null; concluido: boolean };
type Rascunho = { secao: string; titulo: string; texto: string; anterior: string; modo: Modo };

const limite = (value: unknown, max: number) =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';
const modoValido = (value: unknown): Modo => value === 'revisar' ? 'revisar' : 'pendentes';
const hash = (value: string) => crypto.createHash('sha256').update(value).digest('hex');

function assinar(userId: string, rascunho: Rascunho, exp: number) {
  const segredo = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!segredo) throw new Error('Assinatura indisponível');
  return crypto.createHmac('sha256', segredo)
    .update(JSON.stringify(['iris-pdi-resposta-v1', userId, rascunho, exp]))
    .digest('hex');
}
function verificar(userId: string, rascunho: Rascunho, token: string) {
  const [prazo, assinatura] = token.split('.');
  const exp = Number(prazo);
  if (!Number.isSafeInteger(exp) || exp < Date.now() || exp > Date.now() + 10 * 60_000 ||
    !/^[a-f0-9]{64}$/.test(assinatura || '')) return false;
  const esperado = Buffer.from(assinar(userId, rascunho, exp), 'hex');
  const recebido = Buffer.from(assinatura, 'hex');
  return esperado.length === recebido.length && crypto.timingSafeEqual(esperado, recebido);
}

export function querPreencherPdi(mensagem: string) {
  return /(?:preencher|responder|revisar|atualizar|alterar|editar|refazer|completar|continuar)[\s\S]{0,65}(?:perguntas?[- ]guia|respostas? do pdi|meu pdi|o pdi|perguntas? do pdi)/i.test(mensagem) ||
    /(?:pdi|perguntas?[- ]guia)[\s\S]{0,55}(?:pela [íi]ris|com a [íi]ris|conversando|pergunta por pergunta)/i.test(mensagem);
}

export async function executarPdiGuiado(db: Db, userId: string, body: Body) {
  const acao = limite(body.acao, 40);
  const { data: acesso, error: erroAcesso } = await db.rpc('soma_has_module', { p_slug: 'desenvolvimento' });
  if (erroAcesso || acesso !== true) {
    return { status: 403, payload: { erro: 'O PDI não está disponível no seu plano.' } };
  }
  const [guia, registros] = await Promise.all([
    db.from('pdi_guia_secoes').select('codigo,titulo,instrucoes').order('ordem', { ascending: true }),
    db.from('pdi_respostas').select('secao,dados,concluido').eq('user_id', userId),
  ]);
  if (guia.error || registros.error || !guia.data?.length) {
    return { status: 503, payload: { erro: 'Não consegui carregar suas perguntas com segurança.' } };
  }
  const secoes = guia.data as Secao[];
  const respostas = new Map<string, Resposta>((registros.data as Resposta[] ?? []).map((r): [string, Resposta] => [r.secao, r]));
  const textoAtual = (codigo: string) => respostas.get(codigo)?.dados?.texto ?? '';
  const respondida = (codigo: string) => respostas.get(codigo)?.concluido === true && !!textoAtual(codigo).trim();
  const total = secoes.length;
  const concluidas = secoes.filter(s => respondida(s.codigo)).length;
  const modo = modoValido(body.modo);

  function pergunta(indice: number, modoAtual: Modo) {
    const secao = secoes[indice];
    return {
      secao: secao.codigo, titulo: secao.titulo, instrucoes: secao.instrucoes ?? '',
      atual: textoAtual(secao.codigo), numero: indice + 1, total, concluidas, modo: modoAtual,
    };
  }
  function proxima(apos: string | null, modoAtual: Modo) {
    const inicio = apos ? secoes.findIndex(s => s.codigo === apos) + 1 : 0;
    const indice = secoes.findIndex((s, i) => i >= inicio && (modoAtual === 'revisar' || !respondida(s.codigo)));
    return indice < 0 ? null : pergunta(indice, modoAtual);
  }
  if (acao === 'pdi_iniciar') {
    const primeira = proxima(null, modo);
    return { status: 200, payload: primeira
      ? { resposta: 'Vamos preencher seu PDI por conversa, uma pergunta de cada vez. Você poderá revisar antes de salvar. As respostas anteriores permanecem até sua confirmação.', pergunta_pdi: primeira }
      : { resposta: 'Todas as ' + total + ' seções estão preenchidas. Se quiser atualizá-las, escolha Revisar respostas. O plano de desenvolvimento só muda quando você solicitar uma nova geração.', pdi_completo: true } };
  }
  if (acao === 'pdi_proxima') {
    const codigo = limite(body.secao, 90);
    if (!secoes.some(s => s.codigo === codigo)) return { status: 400, payload: { erro: 'Pergunta inválida.' } };
    const seguinte = proxima(codigo, modo);
    return { status: 200, payload: seguinte
      ? { resposta: 'Tudo bem, podemos voltar a esta pergunta depois.', pergunta_pdi: seguinte }
      : { resposta: 'Chegamos ao final das perguntas. As respostas já confirmadas estão salvas no Meu PDI.', pdi_completo: true } };
  }
  if (acao === 'pdi_preparar') {
    const codigo = limite(body.secao, 90);
    const secao = secoes.find(s => s.codigo === codigo);
    const resposta = limite(body.mensagem, 4000);
    if (!secao || resposta.length < 3) return { status: 400, payload: { erro: 'Escolha uma pergunta e escreva uma resposta válida.' } };
    const rascunho: Rascunho = { secao: codigo, titulo: secao.titulo, texto: resposta, anterior: hash(textoAtual(codigo)), modo };
    const exp = Date.now() + 5 * 60_000;
    return { status: 200, payload: {
      resposta: 'Preparei sua resposta para ' + secao.titulo + '. Confira o texto antes de confirmar. Ainda não salvei nada.',
      rascunho_pdi: rascunho, token_pdi: exp + '.' + assinar(userId, rascunho, exp),
    } };
  }
  if (acao === 'pdi_confirmar') {
    const raw = body.rascunho as Partial<Rascunho> | undefined;
    const codigo = limite(raw?.secao, 90);
    const secao = secoes.find(s => s.codigo === codigo);
    const rascunho: Rascunho = {
      secao: codigo, titulo: limite(raw?.titulo, 200), texto: limite(raw?.texto, 4000),
      anterior: limite(raw?.anterior, 64), modo: modoValido(raw?.modo),
    };
    if (!secao || rascunho.titulo !== secao.titulo || rascunho.texto.length < 3 ||
      !/^[a-f0-9]{64}$/.test(rascunho.anterior) ||
      !verificar(userId, rascunho, limite(body.token_pdi, 110))) {
      return { status: 400, payload: { erro: 'Confirmação inválida ou expirada. Prepare novamente sua resposta.' } };
    }
    if (rascunho.anterior !== hash(textoAtual(codigo))) {
      return { status: 409, payload: { erro: 'Esta pergunta foi alterada em outra sessão. Reabra a pergunta antes de salvar.' } };
    }
    // A sessão autenticada e as políticas RLS limitam a gravação à própria conta.
    const { error: erroSalvar } = await db.from('pdi_respostas').upsert({
      user_id: userId, secao: codigo, dados: { texto: rascunho.texto },
      concluido: true, updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,secao' });
    if (erroSalvar) {
      return { status: 500, payload: { erro: 'Não consegui salvar sua resposta. Nenhuma confirmação foi registrada.' } };
    }
    const { error: erroEvento } = await db.from('product_events').insert({
      user_id: userId, event_name: 'iris_pdi_answer_confirmed',
      feature_key: 'iris-copiloto', path: '/api/copiloto',
      metadata: { secao: codigo, evento: 'resposta_confirmada' },
    });
    if (erroEvento) console.warn('[Íris PDI] auditoria não persistida', erroEvento.code);
    const seguinte = proxima(codigo, rascunho.modo);
    return { status: 200, payload: seguinte
      ? { resposta: 'Resposta salva no seu PDI. Vamos à próxima pergunta.', pergunta_pdi: seguinte, href: '/meu-pdi' }
      : { resposta: 'Resposta salva. Você chegou ao final desta rodada de perguntas. Pode abrir Meu PDI e gerar ou atualizar seu plano quando desejar.', pdi_completo: true, href: '/meu-pdi' } };
  }
  return { status: 400, payload: { erro: 'Operação do PDI não reconhecida.' } };
}
