import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { chamarClaudeJson } from '@/lib/ai-json';
import {
  montarPromptLinkedInContent,
  normalizarPostLinkedIn,
  type LinkedInContentAction,
} from '@/lib/prompts-linkedin-content';
import {
  classificarContextoLinkedIn,
  serializarContextoLinkedIn,
  type FragmentoContexto,
} from '@/lib/jev-linkedin-content';

export const maxDuration = 120;

type Body = {
  action: LinkedInContentAction;
  ideia?: string;
  objetivo?: string;
  audiencia?: string;
  formato?: string;
  angulo?: string;
  ctaTipo?: string;
  hook?: string;
  postAtual?: string;
  instrucaoRefino?: string;
  amostrasVoz?: string[];
};

function texto(valor: unknown) {
  if (typeof valor === 'string') return valor.trim();
  if (valor === null || valor === undefined) return '';
  try {
    return JSON.stringify(valor);
  } catch {
    return String(valor);
  }
}

function juntarBussola(bussola: any) {
  if (!bussola) return '';
  return [
    bussola.norte && `Norte: ${bussola.norte}`,
    bussola.sul && `Sul: ${bussola.sul}`,
    bussola.leste && `Leste: ${bussola.leste}`,
    bussola.oeste && `Oeste: ${bussola.oeste}`,
    bussola.centro && `Centro: ${bussola.centro}`,
  ]
    .filter(Boolean)
    .join('\n');
}

function limparResultado(resultado: Record<string, any>): Record<string, any> {
  if (typeof resultado.post === 'string') {
    resultado.post = normalizarPostLinkedIn(resultado.post);
  }
  if (typeof resultado.hook === 'string') {
    resultado.hook = normalizarPostLinkedIn(resultado.hook);
  }
  if (Array.isArray(resultado.hooks)) {
    resultado.hooks = resultado.hooks.map((item: any) => ({
      ...item,
      texto: normalizarPostLinkedIn(texto(item?.texto)),
    }));
  }
  return resultado;
}

async function carregarContexto(userId: string) {
  const supabase = await createClient();

  const [
    profileResp,
    resumoResp,
    mapaResp,
    bussolaResp,
    viaResp,
    pdiResp,
    journalResp,
    linkedinResp,
    diagnosticoResp,
    quemSouResp,
    vozResp,
  ] = await Promise.all([
    supabase.from('profiles').select('nome, tipo_pacote').eq('id', userId).maybeSingle(),
    supabase
      .from('resumo_perfil')
      .select('conteudo_markdown, gerado_em')
      .eq('user_id', userId)
      .order('gerado_em', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('mapa_essencia')
      .select('conteudo_markdown, gerado_em')
      .eq('user_id', userId)
      .order('gerado_em', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('bussola_posicionamento')
      .select('norte, sul, leste, oeste, centro, gerado_em')
      .eq('user_id', userId)
      .order('gerado_em', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('via_resultados')
      .select('forcas, analise_ia, data_teste')
      .eq('user_id', userId)
      .order('data_teste', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('pdi_respostas')
      .select('secao, dados, concluido, updated_at')
      .eq('user_id', userId)
      .eq('concluido', true)
      .order('updated_at', { ascending: false })
      .limit(12),
    supabase
      .from('journal_notes')
      .select('anotacoes, ai_summary, encontro_data')
      .eq('user_id', userId)
      .order('encontro_data', { ascending: false })
      .limit(4),
    supabase
      .from('soma_analises')
      .select('titulo, resultado_markdown, created_at')
      .eq('user_id', userId)
      .eq('ferramenta', 'linkedin')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('diagnostics')
      .select('momento_carreira, objetivos, habilidades, personality_results, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('quem_sou_eu_respostas')
      .select('bloco, resposta, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(16),
    supabase
      .from('linkedin_content_voice_profiles')
      .select('profile_json, sample_posts, updated_at')
      .eq('user_id', userId)
      .maybeSingle(),
  ]);

  const fragmentos: FragmentoContexto[] = [];

  if (profileResp.data?.nome) {
    fragmentos.push({
      codigo: 'perfil',
      titulo: 'Perfil básico',
      texto: `Nome: ${profileResp.data.nome}`,
      prioridade: 'alta',
    });
  }

  if (vozResp.data?.profile_json && Object.keys(vozResp.data.profile_json).length > 0) {
    fragmentos.push({
      codigo: 'voz',
      titulo: 'Perfil de voz treinado',
      texto: texto(vozResp.data.profile_json),
      prioridade: 'alta',
    });
  }

  if (resumoResp.data?.conteudo_markdown) {
    fragmentos.push({
      codigo: 'resumo_perfil',
      titulo: 'Resumo profissional consolidado',
      texto: resumoResp.data.conteudo_markdown,
      prioridade: 'alta',
    });
  }

  if (linkedinResp.data?.resultado_markdown) {
    fragmentos.push({
      codigo: 'linkedin_audit',
      titulo: 'Auditoria mais recente do LinkedIn',
      texto: linkedinResp.data.resultado_markdown,
      prioridade: 'alta',
    });
  }

  if (mapaResp.data?.conteudo_markdown) {
    fragmentos.push({
      codigo: 'mapa_essencia',
      titulo: 'Mapa Quem Sou Eu',
      texto: mapaResp.data.conteudo_markdown,
    });
  }

  const bussola = juntarBussola(bussolaResp.data);
  if (bussola) {
    fragmentos.push({
      codigo: 'bussola',
      titulo: 'Bússola de posicionamento',
      texto: bussola,
    });
  }

  if (viaResp.data) {
    fragmentos.push({
      codigo: 'via',
      titulo: 'Forças e leitura VIA',
      texto: `Forças: ${texto(viaResp.data.forcas)}\nAnálise: ${texto(viaResp.data.analise_ia)}`,
    });
  }

  if (diagnosticoResp.data) {
    fragmentos.push({
      codigo: 'diagnostico',
      titulo: 'Diagnóstico e objetivos de carreira',
      texto: [
        `Momento: ${texto(diagnosticoResp.data.momento_carreira)}`,
        `Objetivos: ${texto(diagnosticoResp.data.objetivos)}`,
        `Habilidades: ${texto(diagnosticoResp.data.habilidades)}`,
        `Personalidade: ${texto(diagnosticoResp.data.personality_results)}`,
      ].join('\n'),
    });
  }

  if (pdiResp.data?.length) {
    fragmentos.push({
      codigo: 'pdi',
      titulo: 'PDI e prioridades atuais',
      texto: pdiResp.data
        .map((item: any) => `${item.secao}: ${texto(item.dados)}`)
        .join('\n'),
    });
  }

  if (journalResp.data?.length) {
    fragmentos.push({
      codigo: 'diario',
      titulo: 'Aprendizados recentes do Diário de Bordo',
      texto: journalResp.data
        .map(
          (item: any) =>
            `${item.encontro_data}: ${texto(item.ai_summary || item.anotacoes)}`
        )
        .join('\n'),
    });
  }

  if (quemSouResp.data?.length && !resumoResp.data?.conteudo_markdown) {
    fragmentos.push({
      codigo: 'quem_sou_eu',
      titulo: 'Respostas do Mapa Quem Sou Eu',
      texto: quemSouResp.data
        .map((item: any) => `${item.bloco}: ${item.resposta}`)
        .join('\n'),
    });
  }

  return {
    fragmentos,
    vozAtual: vozResp.data?.profile_json ?? null,
  };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const body = (await request.json()) as Body;
    const action = body.action;

    if (!['ideas', 'hooks', 'post', 'refine', 'voice'].includes(action)) {
      return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 });
    }

    if (action === 'voice') {
      const amostras = (body.amostrasVoz || []).map((x) => x.trim()).filter(Boolean).slice(0, 5);
      if (amostras.length < 2) {
        return NextResponse.json(
          { error: 'Cole pelo menos 2 posts que realmente pareçam com você.' },
          { status: 400 }
        );
      }

      const { fragmentos } = await carregarContexto(user.id);
      const contextoCompacto = fragmentos
        .filter((f) => ['perfil', 'resumo_perfil', 'mapa_essencia', 'bussola'].includes(f.codigo))
        .slice(0, 4);

      const prompt = montarPromptLinkedInContent({
        action,
        amostrasVoz: amostras,
        contexto: serializarContextoLinkedIn(contextoCompacto),
      });

      const resultado = await chamarClaudeJson<Record<string, any>>(prompt, {
        maxTokens: 1800,
        descricao: 'perfil de voz LinkedIn',
      });

      const { error } = await supabase.from('linkedin_content_voice_profiles').upsert({
        user_id: user.id,
        sample_posts: amostras,
        profile_json: resultado,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      return NextResponse.json({ resultado });
    }

    if (!body.ideia?.trim() && action !== 'refine') {
      return NextResponse.json(
        { error: 'Escreva uma ideia, situação ou assunto para começar.' },
        { status: 400 }
      );
    }

    if (action === 'refine' && !body.postAtual?.trim()) {
      return NextResponse.json({ error: 'Não há post para refinar.' }, { status: 400 });
    }

    const { fragmentos } = await carregarContexto(user.id);
    const classificado = await classificarContextoLinkedIn(fragmentos);
    const contexto = serializarContextoLinkedIn(classificado.fragmentos);

    const prompt = montarPromptLinkedInContent({
      action,
      ideia: body.ideia,
      objetivo: body.objetivo,
      audiencia: body.audiencia,
      formato: body.formato,
      angulo: body.angulo,
      ctaTipo: body.ctaTipo,
      hook: body.hook,
      postAtual: body.postAtual,
      instrucaoRefino: body.instrucaoRefino,
      contexto,
    });

    const maxTokens =
      action === 'hooks' ? 1200 : action === 'ideas' ? 1800 : action === 'refine' ? 2200 : 3000;

    const resultado = limparResultado(
      await chamarClaudeJson<Record<string, any>>(prompt, {
        maxTokens,
        descricao: `Estúdio LinkedIn: ${action}`,
      })
    );

    return NextResponse.json({
      resultado,
      contexto: {
        metodo: classificado.metodo,
        selecionados: classificado.selecionados,
        charsAntes: classificado.charsAntes,
        charsDepois: classificado.charsDepois,
      },
    });
  } catch (error) {
    console.error('[LinkedIn Content Studio]', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Não foi possível gerar o conteúdo agora.',
      },
      { status: 500 }
    );
  }
}
