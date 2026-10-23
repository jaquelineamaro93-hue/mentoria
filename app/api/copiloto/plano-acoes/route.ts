import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { chamarClaudeJson } from '@/lib/ai-json';
import { consumeIdentifierRateLimit } from '@/lib/security/rate-limit';
import { montarPromptPlanoIris, planoIrisValido } from '@/lib/iris-mentoria-voz';
import type { RascunhoPlanoIris, EtapaIris } from '@/lib/iris-mentoria-voz';
import { validConversationId } from '@/lib/iris-web-history';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const TEMAS = ['transicao','recolocacao','crescimento','monetizacao','entrevistas','outro'] as const;
type Tema = typeof TEMAS[number];
const limpo = (v: unknown, max: number) => typeof v === 'string' ? v.trim().slice(0, max) : '';
const resposta = (body: object, status = 200) =>
  NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
const temaValido = (v: unknown): v is Tema => TEMAS.some(t => t === v);
function mesmaOrigem(request: NextRequest) {
  const origin = request.headers.get('origin');
  return !origin || origin === new URL(request.url).origin;
}

// Todos os verbos verificam sessão, assinatura/trial, pausa e versão aceita
// dos termos. O mesmo portão do Copilot, sem depender de estado do front-end.
async function autenticarMentorado() {
  const db = await createClient();
  const { data: { user }, error } = await db.auth.getUser();
  if (error || !user) return { erro: resposta({ erro: 'Entre na SOMA para usar seus planos.' }, 401) };
  const { data: perfil, error: erroPerfil } = await db.from('profiles')
    .select('nome,is_admin,status_assinatura,trial_status,trial_ends_at,data_fim_acesso')
    .eq('id', user.id).maybeSingle();
  if (erroPerfil || !perfil) return { erro: resposta({ erro: 'Perfil indisponível.' }, 403) };
  const hoje = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
  const assinante = perfil.status_assinatura === 'ativo' &&
    (!perfil.data_fim_acesso || perfil.data_fim_acesso >= hoje);
  const trial = perfil.trial_status === 'active' && !!perfil.trial_ends_at &&
    Date.parse(perfil.trial_ends_at) > Date.now();
  if (!perfil.is_admin && !assinante && !trial)
    return { erro: resposta({ erro: 'Seu acesso à mentoria está inativo.' }, 403) };
  const [pausa, versao] = await Promise.all([
    db.from('mentoria_pausas').select('id').eq('user_id', user.id)
      .eq('status','ativa').limit(1).maybeSingle(),
    db.from('termos_versoes').select('id').eq('ativo',true)
      .order('publicado_em', { ascending:false }).limit(1).maybeSingle(),
  ]);
  if (pausa.error || versao.error || !versao.data)
    return { erro: resposta({ erro: 'Não foi possível validar as permissões.' }, 503) };
  if (pausa.data) return { erro: resposta({ erro: 'Sua mentoria está pausada.' }, 403) };
  const { data: aceite, error: erroAceite } = await db.from('termos_aceites')
    .select('id').eq('user_id', user.id).eq('termo_id', versao.data.id).limit(1).maybeSingle();
  if (erroAceite) return { erro: resposta({ erro: 'Não foi possível validar seus termos.' }, 503) };
  if (!aceite) return { erro: resposta({ erro: 'Aceite os termos vigentes para continuar.' }, 403) };
  return { db, user, perfil };
}

async function lerBody(request: NextRequest): Promise<Record<string, unknown> | null> {
  try {
    const data: unknown = await request.json();
    return data && typeof data === 'object' && !Array.isArray(data)
      ? data as Record<string, unknown> : null;
  } catch { return null; }
}

function etapasNormalizadas(items: EtapaIris[], preservarEstado = false) {
  return items.map(e => ({
    titulo: e.titulo.trim().slice(0, 130),
    descricao: e.descricao.trim().slice(0, 700),
    evidencia: e.evidencia.trim().slice(0, 300),
    horizonte: e.horizonte.trim().slice(0, 75),
    concluida: preservarEstado && 'concluida' in e && e.concluida === true,
  }));
}

export async function GET() {
  const a = await autenticarMentorado();
  if ('erro' in a) return a.erro;
  const { data, error } = await a.db.from('iris_action_plans')
    .select('id,tema,titulo,diagnostico,objetivo,foco,etapas,created_at,updated_at')
    .eq('user_id', a.user.id).order('updated_at', { ascending: false }).limit(25);
  if (error) return resposta({ erro: 'Não consegui carregar seus Planos de Ações da Íris.' }, 503);
  return resposta({ planos: data ?? [], nome: limpo(a.perfil.nome, 80).split(/\s+/)[0] });
}

export async function POST(request: NextRequest) {
  if (!mesmaOrigem(request)) return resposta({ erro: 'Origem inválida.' }, 403);
  const a = await autenticarMentorado();
  if ('erro' in a) return a.erro;
  const body = await lerBody(request);
  if (!body) return resposta({ erro: 'Pedido inválido.' }, 400);
  if (body.acao === 'gerar') {
    const tema = temaValido(body.tema) ? body.tema : 'outro';
    const objetivoFornecido = limpo(body.objetivo, 600);
    const limite = await consumeIdentifierRateLimit({
      scope: 'iris_action_plan_generate', identifier: a.user.id, limit: 8, windowSeconds: 3600,
    });
    if (!limite) return resposta({ erro: 'Limite de propostas atingido. Retome depois.' }, 429);
    const [entrevista, bussola] = await Promise.all([
      a.db.from('entrevistas_iniciais').select(
        'objetivo_principal,momento_profissional,maior_desafio,prioridade_90_dias,comunicacao_preferida'
      ).eq('user_id', a.user.id).maybeSingle(),
      a.db.from('bussola_posicionamento').select('norte,centro')
        .eq('user_id', a.user.id).order('gerado_em', {ascending:false}).limit(1).maybeSingle(),
    ]);
    if (entrevista.error || bussola.error)
      return resposta({ erro: 'Não consegui consultar sua jornada agora.' }, 503);
    const objetivo = objetivoFornecido || limpo(entrevista.data?.objetivo_principal, 400);
    if (!objetivo || objetivo.length < 5)
      return resposta({ erro: 'Conte em uma frase o objetivo deste plano.' }, 400);
    const prompt = montarPromptPlanoIris({
      tema, objetivo,
      nome: limpo(a.perfil.nome, 70).split(/\s+/)[0],
      hojeSP: new Date().toLocaleDateString('en-CA',{ timeZone:'America/Sao_Paulo' }),
      contexto: {
        momento: limpo(entrevista.data?.momento_profissional, 370),
        objetivo_cadastrado: limpo(entrevista.data?.objetivo_principal, 400),
        desafio: limpo(entrevista.data?.maior_desafio, 400),
        prioridade: limpo(entrevista.data?.prioridade_90_dias, 380),
        preferencia_de_conversa: limpo(entrevista.data?.comunicacao_preferida, 140),
        norte_profissional: limpo(bussola.data?.norte, 400),
        centro: limpo(bussola.data?.centro, 300),
      },
    });
    try {
      const gerado = await chamarClaudeJson<RascunhoPlanoIris>(prompt, {
        maxTokens: 2300, validar: planoIrisValido,
        descricao: 'rascunho de plano de ações da Íris',
      });
      // Até salvar explicitamente, este conteúdo só é devolvido ao browser.
      return resposta({ rascunho: {
        titulo: gerado.titulo.trim(), diagnostico: gerado.diagnostico.trim(),
        objetivo: gerado.objetivo.trim(), foco: gerado.foco.trim(),
        etapas: etapasNormalizadas(gerado.etapas),
      }, tema });
    } catch {
      return resposta({ erro: 'Não consegui organizar o plano agora. Tente novamente ou ajuste o objetivo.' }, 503);
    }
  }
  if (body.acao === 'salvar') {
    if (body.confirmar !== true || !temaValido(body.tema) || !planoIrisValido(body.rascunho))
      return resposta({ erro: 'Revise o plano e confirme o salvamento.' }, 400);
    const limite = await consumeIdentifierRateLimit({
      scope: 'iris_action_plan_save', identifier: a.user.id, limit: 15, windowSeconds: 3600,
    });
    if (!limite) return resposta({ erro: 'Limite temporário de planos atingido.' }, 429);
    const admin = createAdminClient();
    const { count, error: countError } = await admin.from('iris_action_plans')
      .select('id', { count:'exact', head:true }).eq('user_id',a.user.id);
    if (countError) return resposta({ erro: 'Não foi possível verificar seus planos.' }, 503);
    if ((count ?? 0) >= 20) return resposta({ erro: 'Você já tem 20 planos. Revise os anteriores antes de salvar outro.' }, 409);
    const rascunho = body.rascunho as RascunhoPlanoIris;
    const { data, error } = await admin.from('iris_action_plans')
      .insert({
        user_id: a.user.id, tema: body.tema,
        titulo: rascunho.titulo.trim(), diagnostico: rascunho.diagnostico.trim(),
        objetivo: rascunho.objetivo.trim(), foco: rascunho.foco.trim(),
        etapas: etapasNormalizadas(rascunho.etapas),
      }).select('id').single();
    if (error || !data) return resposta({ erro: 'Não foi possível salvar seu plano.' }, 503);
    return resposta({ sucesso:true, id:data.id });
  }
  return resposta({ erro: 'Ação não reconhecida.' }, 400);
}

export async function PATCH(request: NextRequest) {
  if (!mesmaOrigem(request)) return resposta({ erro:'Origem inválida.' }, 403);
  const a = await autenticarMentorado();
  if ('erro' in a) return a.erro;
  const b = await lerBody(request);
  if (!b || !validConversationId(b.id) || !Number.isInteger(b.indice) ||
    (b.indice as number) < 0 || (b.indice as number) > 5 || typeof b.concluida !== 'boolean')
    return resposta({ erro:'Etapa inválida.' }, 400);
  const admin = createAdminClient();
  const { data, error } = await admin.from('iris_action_plans')
    .select('id,etapas').eq('id',b.id).eq('user_id',a.user.id).maybeSingle();
  if (error || !data) return resposta({ erro:'Plano não encontrado.' }, 404);
  const etapas = data.etapas as Array<EtapaIris & {concluida:boolean}>;
  if (!Array.isArray(etapas) || !etapas[b.indice as number])
    return resposta({ erro:'Etapa não encontrada.' }, 404);
  const atualizadas = etapas.map((e,i) => i === b.indice
    ? {...e,concluida:b.concluida as boolean} : e);
  const { error: updateError } = await admin.from('iris_action_plans')
    .update({ etapas:atualizadas, updated_at:new Date().toISOString() })
    .eq('id',data.id).eq('user_id',a.user.id);
  if (updateError) return resposta({ erro:'Não consegui atualizar sua etapa.' }, 503);
  return resposta({ sucesso:true, etapas:atualizadas });
}

export async function DELETE(request: NextRequest) {
  if (!mesmaOrigem(request)) return resposta({ erro:'Origem inválida.' }, 403);
  const a = await autenticarMentorado();
  if ('erro' in a) return a.erro;
  const b = await lerBody(request);
  if (!b || !validConversationId(b.id) || b.confirmar !== true)
    return resposta({ erro:'Confirmação inválida.' }, 400);
  const admin = createAdminClient();
  const { data, error } = await admin.from('iris_action_plans')
    .delete().eq('id',b.id).eq('user_id',a.user.id).select('id').maybeSingle();
  if (error) return resposta({ erro:'Não foi possível excluir o plano.' }, 503);
  if (!data) return resposta({ erro:'Plano não encontrado.' }, 404);
  return resposta({ sucesso:true });
}
