import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    const { perfil_profissional, objetivos, cargos_desejados, vaga_input, empresa, cargo, pontos_fortes, gaps } = await request.json();
    if (!perfil_profissional || !vaga_input) return NextResponse.json({ error: 'Perfil e descrição da vaga são obrigatórios' }, { status: 400 });
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const prompt = `Você é um especialista em transição de carreira. Baseado no perfil do candidato e na vaga, gere uma versão ADAPTADA do currículo.

PERFIL DO CANDIDATO:
${perfil_profissional}

OBJETIVOS:
${objetivos || 'Não preenchido'}

CARGOS DESEJADOS:
${cargos_desejados || 'Não preenchido'}

VAGA:
${vaga_input}

PONTOS FORTES (que deve destacar):
${pontos_fortes?.join('\n') || 'Não preenchido'}

GAPS (que deve contornar ou mitigar):
${gaps?.map((g) => `- ${g.titulo}: ${g.descricao}`).join('\n') || 'Não preenchido'}

Gere um currículo adaptado que:
1. Destaque os pontos fortes relacionados à vaga
2. Reorganize a experiência para mostrar relevância
3. Ajuste a linguagem para keywords da vaga (ATS-friendly)
4. Mitigue gaps de forma estratégica
5. Mantenha autenticidade mas seja estratégico

Retorne APENAS este JSON (sem markdown):
{
  "titulo": "Currículo Adaptado - [Cargo] em [Empresa]",
  "corpo": "Texto completo do currículo adaptado em markdown",
  "resumo_executivo": "Resumo de 2-3 linhas para Linkedin",
  "palavras_chave": ["palavra1", "palavra2"],
  "dicas_entrevista": ["dica1", "dica2", "dica3"]
}`;
    const message = await anthropic.messages.create({ model: 'claude-3-5-sonnet-20241022', max_tokens: 3000, messages: [{ role: 'user', content: prompt }] });
    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    let curriculo;
    try {
      curriculo = JSON.parse(responseText);
    } catch {
      console.error('Erro ao parsear resposta:', responseText);
      return NextResponse.json({ error: 'Erro ao processar currículo' }, { status: 500 });
    }
    return NextResponse.json({ success: true, curriculo, empresa: empresa || 'Empresa', cargo: cargo || 'Cargo' });
  } catch (error) {
    console.error('Gerar currículo error:', error);
    return NextResponse.json({ error: 'Erro ao gerar currículo adaptado' }, { status: 500 });
  }
}
