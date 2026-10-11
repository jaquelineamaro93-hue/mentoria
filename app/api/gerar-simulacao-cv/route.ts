import { NextResponse } from 'next/server';
import { consumeIdentifierRateLimit } from '@/lib/security/rate-limit';
import { createClient } from '@/lib/supabase/server';
import { chamarClaudeJson } from '@/lib/ai-json';
import { montarPromptSimuladorCV } from '@/lib/prompts';

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  const body = await request.json();
  const curriculo: string = body.curriculo?.trim();
  const vaga: string = body.vaga?.trim();

  if (!curriculo || !vaga) {
    return NextResponse.json(
      { error: 'Cole o currículo e a descrição da vaga antes de analisar.' },
      { status: 400 }
    );
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('creditos_simulacao_cv, is_admin')
    .eq('id', user.id)
    .single();

  // A conta de administração autorizada pode testar o simulador sem
  // consumir a cota mensal nem os créditos destinados aos alunos.
  // A exceção exige autenticação, e-mail verificado pelo Auth e papel admin.
  const acessoAdminTeste = profile?.is_admin === true &&
    user.email?.trim().toLowerCase() === 'jaqueline.amaro93@gmail.com';

  const aiAllowed = await consumeIdentifierRateLimit({
    scope: acessoAdminTeste ? 'ai_cv_admin_testes_v1' : 'ai_cv_simular',
    identifier: user.id,
    limit: acessoAdminTeste ? 300 : 30,
    windowSeconds: 60 * 60,
  });
  if (!aiAllowed) {
    return NextResponse.json({error:'Limite temporário de proteção atingido. Tente novamente mais tarde.'},{status:429});
  }

  const inicioDoMes = new Date();
  inicioDoMes.setDate(1);
  inicioDoMes.setHours(0, 0, 0, 0);

  const { count: usadasEsteMes } = await supabase
    .from('cv_simulacoes')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', inicioDoMes.toISOString());

  const LIMITE_GRATIS_MES = 3;
  const jaUsouGratis = (usadasEsteMes ?? 0) >= LIMITE_GRATIS_MES;
  const temCredito = (profile?.creditos_simulacao_cv ?? 0) > 0;

  if (!acessoAdminTeste && jaUsouGratis && !temCredito) {
    return NextResponse.json(
      {
        error: 'limite_atingido',
        mensagem: `Você já usou suas ${LIMITE_GRATIS_MES} simulações gratuitas deste mês. Cada simulação extra custa R$ 5.`,
      },
      { status: 402 }
    );
  }

  try {
    const prompt = montarPromptSimuladorCV(curriculo, vaga);
    const resultadoJson = await chamarClaudeJson<Record<string, any>>(prompt, {
      maxTokens: 8000,
      descricao: 'simulação de currículo',
      validar: (valor): valor is Record<string, any> => {
        if (!valor || typeof valor !== 'object' || Array.isArray(valor)) return false;
        const item = valor as Record<string, unknown>;
        return (
          typeof item.fit_percentual === 'number' &&
          Array.isArray(item.pontos_fortes) &&
          Array.isArray(item.pontos_atencao) &&
          typeof item.curriculo_final_markdown === 'string' &&
          typeof item.carta_apresentacao_markdown === 'string' &&
          Array.isArray(item.perguntas_entrevista)
        );
      },
    });

    // Não contabilizar uma simulação como concluída quando o currículo final
    // não contém as seções essenciais que a própria análise deveria produzir.
    const cvFinal = String(resultadoJson.curriculo_final_markdown ?? '').replace(/\\n/g, '\n');
    resultadoJson.curriculo_final_markdown = cvFinal;
    const secoesObrigatorias = [
      /(?:^|\n)#{1,3}\s*(?:resumo|perfil) profissional\b/im,
      /(?:^|\n)#{1,3}\s*(?:compet[eê]ncias|habilidades)(?:\s+(?:principais|chave|t[eé]cnicas))?\b/im,
      /(?:^|\n)#{1,3}\s*experi[eê]ncias? profissionais?\b/im,
      /(?:^|\n)#{1,3}\s*forma[cç][aã]o(?: acad[eê]mica)?\b/im,
    ];
    if (!secoesObrigatorias.every((secao) => secao.test(cvFinal))) {
      try {
        const reparo = await chamarClaudeJson<{curriculo_final_markdown:string}>(
          'Reescreva o currículo abaixo para a vaga, aplicando as correções dos sabotadores. ' +
          'Preserve fatos, datas, cargos e métricas. Não invente competências. A vaga não comprova competências do candidato. ' +
          'Não inclua ferramentas ou experiência sem evidência no currículo original, mesmo se citadas na versão a corrigir. ' +
          'Use a data atual de referência: ' + new Date().toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo'}) + '. ' +
          'Adapte concretamente o resumo e os bullets às responsabilidades da vaga usando somente evidências originais. ' +
          'Competências em texto corrido, separadas por vírgulas, sem ferramentas não comprovadas. ' +
          'Use obrigatoriamente os títulos Markdown ## Resumo profissional, ## Competências principais, ' +
          '## Experiência profissional e ## Formação acadêmica. Responda apenas JSON com a chave curriculo_final_markdown.\\n' +
          'Currículo original: ' + curriculo.slice(0,15000) + '\\nVaga: ' + vaga.slice(0,9000) +
          '\\nSabotadores: ' + JSON.stringify(resultadoJson.sabotadores ?? []).slice(0,4000) +
          '\\nCurrículo a corrigir: ' + cvFinal.slice(0,15000),
          {maxTokens:5500,descricao:'reparo de currículo ATS',validar:(valor):valor is {curriculo_final_markdown:string}=>
            !!valor && typeof valor==='object' && typeof (valor as {curriculo_final_markdown?:unknown}).curriculo_final_markdown==='string'}
        );
        const corrigido = reparo.curriculo_final_markdown.trim();
        if (secoesObrigatorias.every((secao) => secao.test(corrigido))) {
          resultadoJson.curriculo_final_markdown = corrigido;
        }
      } catch { /* Não consumir crédito em caso de falha na correção. */ }
    }
    if (!secoesObrigatorias.every((secao) => secao.test(resultadoJson.curriculo_final_markdown))) {
      // Preserve a análise já concluída sem contabilizar uso nem cobrar crédito.
      // O currículo permanece identificado como rascunho não validado para ATS.
      resultadoJson.aviso_curriculo = 'A IA gerou a análise, mas o currículo ainda não passou na revisão de estrutura ATS. Este resultado é uma prévia, não foi salvo nem cobrado. Revise antes de usar.';
      return NextResponse.json({simulacao:{id:'previa-nao-salva',created_at:new Date().toISOString(),resultado_json:resultadoJson,resultado_markdown:resultadoJson.curriculo_final_markdown},previa:true});
    }

    if (!acessoAdminTeste && jaUsouGratis && temCredito) {
      await supabase
        .from('profiles')
        .update({ creditos_simulacao_cv: (profile?.creditos_simulacao_cv ?? 1) - 1 })
        .eq('id', user.id);
    }

    const { data: simulacao, error } = await supabase
      .from('cv_simulacoes')
      .insert({
        user_id: user.id,
        curriculo_texto: curriculo,
        vaga_texto: vaga,
        resultado_markdown: resultadoJson.curriculo_final_markdown ?? '',
        resultado_json: resultadoJson,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ simulacao });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
