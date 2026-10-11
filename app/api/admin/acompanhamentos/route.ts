import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

function normalizar(numero: string) {
 const n=numero.replace(/\D/g,'');
 if (!n) return null;
 const v=n.startsWith('55')&&n.length>=12?n:'55'+n;
 return /^55[1-9][0-9]{9,10}$/.test(v)?v:null;
}
export async function POST(request:NextRequest) {
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return NextResponse.json({error:'Não autenticado'},{status:401});
 const {data:perfil}=await supabase.from('profiles').select('is_admin').eq('id',user.id).single();
 if(!perfil?.is_admin)return NextResponse.json({error:'Sem permissão'},{status:403});
 const admin=createAdminClient();
 try {
  const body=await request.json();
  if(body.action==='import') {
    if(!Array.isArray(body.rows)||body.rows.length>500)return NextResponse.json({error:'Limite de 500 linhas'},{status:400});
    let updated=0;
    for(const row of body.rows) {
      const email=String(row.email||'').trim().toLowerCase(),phone=normalizar(String(row.phone||''));
      if(!email||!phone)continue;
      const {data:target}=await admin.from('profiles').select('id,whatsapp_numero').eq('email',email).eq('is_admin',false).maybeSingle();
      if(!target)continue;
      const {error}=await admin.from('profiles').update({whatsapp_numero:phone,whatsapp_validado_em:target.whatsapp_numero===phone?undefined:null}).eq('id',target.id);
      if(!error)updated++;
    }
    return NextResponse.json({updated});
  }
  const userId=String(body.userId||'');
  if(!/^[0-9a-f-]{36}$/i.test(userId))return NextResponse.json({error:'ID inválido'},{status:400});
  const {data:target}=await admin.from('profiles').select('id,nome,whatsapp_numero,whatsapp_consentimento_em,trial_status').eq('id',userId).eq('is_admin',false).maybeSingle();
  if(!target)return NextResponse.json({error:'Mentorado não encontrado'},{status:404});
  if(body.action==='contact') {
    const phone=normalizar(String(body.phone||''));
    if(body.phone&&!phone)return NextResponse.json({error:'WhatsApp inválido'},{status:400});
    const {error}=await admin.from('profiles').update({whatsapp_numero:phone,whatsapp_validado_em:null,whatsapp_consentimento_em:null}).eq('id',userId);
    if(error)throw error;
    return NextResponse.json({ok:true});
  }
  const week=String(body.week||'');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(week))return NextResponse.json({error:'Semana inválida'},{status:400});
  if(body.action==='draft') {
    // Acompanhamento ancorado nas respostas reais e no histórico, sem presumir progresso.
    const {data:existente,error:erroExistente}=await admin.from('acompanhamentos_semanais').select('status').eq('user_id',userId).eq('semana_inicio',week).maybeSingle();
    if(erroExistente)throw erroExistente;
    if(existente?.status==='enviado')return NextResponse.json({error:'Mensagem já enviada: preserve o histórico e gere um novo acompanhamento na próxima semana.'},{status:409});
    if(existente?.status==='aprovado' && body.regenerate!==true)return NextResponse.json({error:'Confirme a regeneração do acompanhamento aprovado.'},{status:409});
    const [diagnostico, diario, pdi, quem, via, historico] = await Promise.all([
      admin.from('diagnostics').select('objetivos,momento_carreira,habilidades,updated_at').eq('user_id',userId).order('created_at',{ascending:false}).limit(1).maybeSingle(),
      admin.from('journal_notes').select('anotacoes,ai_summary,created_at').eq('user_id',userId).order('created_at',{ascending:false}).limit(5),
      admin.from('pdi_respostas').select('secao,dados,concluido,updated_at').eq('user_id',userId).order('updated_at',{ascending:false}).limit(20),
      admin.from('quem_sou_eu_respostas').select('bloco,resposta,updated_at').eq('user_id',userId).order('updated_at',{ascending:false}).limit(15),
      admin.from('via_resultados').select('forcas,analise_ia,created_at').eq('user_id',userId).order('created_at',{ascending:false}).limit(1).maybeSingle(),
      admin.from('acompanhamentos_semanais').select('semana_inicio,proxima_acao,mensagem_whatsapp,status').eq('user_id',userId).lt('semana_inicio',week).order('semana_inicio',{ascending:false}).limit(1).maybeSingle(),
    ]);
    const erros = [diagnostico.error,diario.error,pdi.error,quem.error,via.error,historico.error].filter(Boolean);
    if(erros.length) return NextResponse.json({error:'Não foi possível consultar o histórico completo. Nenhum rascunho foi gerado.'},{status:503});

    function resumo(valor: unknown, max=240): string {
      if (valor == null) return '';
      const texto = typeof valor === 'string' ? valor : typeof valor === 'object' && valor !== null && 'texto' in valor
        ? String((valor as {texto:unknown}).texto ?? '') : JSON.stringify(valor);
      return texto.replace(/\\n/g, ' ').replace(/\s+/g, ' ').trim().slice(0,max);
    }
    function relato(valor: unknown): string {
      const texto = resumo(valor,500);
      if (!texto || texto.includes('?') || /^\d+\.\s*o que /i.test(texto)) return '';
      return texto;
    }
    const objetivo=resumo(diagnostico.data?.objetivos,450);
    const momento=resumo(diagnostico.data?.momento_carreira,260);
    const anotacao=(diario.data||[]).map(x=>relato(x.anotacoes)||relato(x.ai_summary)).find(Boolean)||'';
    const pdiAtual=(pdi.data||[]).find(x=>resumo(x.dados).length>20);
    const quemAtual=(quem.data||[]).map(x=>relato(x.resposta)).find(Boolean)||'';
    const plano=resumo(pdiAtual?.dados,240);
    const anterior=historico.data;
    const acaoAnterior=resumo(anterior?.proxima_acao,180);
    const primeiroNome=String(target.nome||'mentorada').trim().split(' ')[0];
    const fontes=[
      objetivo && 'Objetivo: '+objetivo,
      momento && 'Momento de carreira: '+momento,
      anotacao && 'Reflexão no diário: '+anotacao,
      plano && 'Plano de desenvolvimento: '+plano,
      quemAtual && 'Autopercepção: '+quemAtual,
      acaoAnterior && 'Ação do acompanhamento anterior: '+acaoAnterior,
    ].filter(Boolean) as string[];
    const contexto=(objetivo+' '+momento+' '+plano+' '+quemAtual).toLowerCase();
    const tem=(re:RegExp)=>re.test(contexto);
    const recolocacao=tem(/recoloca|voltar ao mercado|nova oportunidade|emprego|vaga|entrevista/);
    const evolucao=tem(/nível pleno|nivel pleno|transição para.*pleno|junior.*pleno|júnior.*pleno/);
    const tecnico=tem(/ampscript|marketing cloud|arquitetura de dados|automações complexas/);
    const dados=tem(/interpretar dados|análise de dados|analisar dados|hipóteses|hipoteses/);
    const comunicacao=tem(/comunicaç|expressar|posicionamento/);
    const confianca=tem(/autoconfian|medo de errar|inseguran/);
    const lideranca=tem(/lideran|gestão|estratégi/);
    const tema=recolocacao?'recolocacao':evolucao?'evolucao':tecnico?'tecnico':dados?'dados':confianca?'confianca':comunicacao?'comunicacao':lideranca?'lideranca':'geral';
    const focos:Record<string,{contexto:string;pergunta:string}>={
      recolocacao:{contexto:'sua busca por uma nova oportunidade profissional',pergunta:'O que está mais difícil hoje: encontrar vagas alinhadas, se posicionar ou avançar nas entrevistas?'},
      evolucao:{contexto:'sua transição para o nível pleno',pergunta:dados?'Para avançar, você prefere começar por análise de dados ou pela definição de prioridades?':'Qual competência você gostaria de desenvolver primeiro para dar esse próximo passo?'},
      tecnico:{contexto:'seu desenvolvimento técnico',pergunta:'Qual habilidade você gostaria de praticar primeiro em uma situação real de trabalho?'},
      dados:{contexto:'seu desenvolvimento em análise de dados e tomada de decisões',pergunta:'Em qual situação do seu trabalho você gostaria de aplicar uma análise ou testar uma hipótese?'},
      confianca:{contexto:'seu objetivo de ganhar mais autoconfiança',pergunta:'Em qual situação concreta você gostaria de agir com mais segurança nesta semana?'},
      comunicacao:{contexto:'seu desenvolvimento em comunicação e posicionamento',pergunta:'Em qual situação profissional você gostaria de se expressar com mais clareza?'},
      lideranca:{contexto:'seu crescimento profissional e estratégico',pergunta:'Qual decisão ou responsabilidade você gostaria de assumir com mais autonomia?'},
      geral:{contexto:'seu desenvolvimento profissional',pergunta:'Qual é a principal prioridade da sua carreira nesta semana?'},
    };
    const escolhido=focos[tema];
    let insight='',proxima_acao='',mensagem='';
    if(!objetivo&&!momento&&!plano&&!quemAtual&&!acaoAnterior) {
      insight='Não há contexto suficiente para uma orientação individual. Solicitar a prioridade atual antes de sugerir um plano.';
      proxima_acao='Confirmar prioridade profissional.';
      mensagem='Oi, '+primeiroNome+'! 💜 Quero conhecer melhor seu momento para que o acompanhamento faça sentido para você. Qual é sua prioridade profissional agora? ✨';
    } else {
      insight='Foco identificado: '+escolhido.contexto+'.\\n'+(acaoAnterior?'Ação registrada anteriormente: '+acaoAnterior+'.\\n':'')+'Próxima conversa: validar a situação atual e definir uma ação concreta. Não há evidência suficiente para afirmar progresso.';
      proxima_acao=acaoAnterior?'Confirmar se a ação anterior foi realizada e qual foi o resultado.':escolhido.pergunta;
      const pergunta=acaoAnterior?'Você conseguiu avançar na ação que combinamos no último acompanhamento? O que aconteceu?':escolhido.pergunta;
      mensagem='Oi, '+primeiroNome+'! 💜\n\nQuero retomar '+escolhido.contexto+'.\n\n'+pergunta+'\n\nSua resposta vai nos ajudar a definir um próximo passo prático. ✨';
    }
    const progresso='Registros consultados: '+(diario.data?.length||0)+' anotações, '+(pdi.data?.length||0)+' seções do PDI e '+(quem.data?.length||0)+' reflexões. '+(anterior?'Existe acompanhamento anterior.':'Primeiro acompanhamento registrado.')+' Quantidade de registros não comprova progresso.';
    // Rascunho sempre exige revisão humana antes de aprovação e envio.
    const {data:registro,error}=await admin.from('acompanhamentos_semanais').upsert({
      user_id:userId,semana_inicio:week,objetivo:objetivo||'Não informado',
      progresso,insight,proxima_acao,mensagem_whatsapp:mensagem.slice(0,2000),
      status:'rascunho',updated_at:new Date().toISOString()
    },{onConflict:'user_id,semana_inicio'}).select().single();
    if(error)throw error;
    return NextResponse.json({registro});
  }
  if(body.action==='message') {
    if(!['rascunho','aprovado'].includes(body.status))return NextResponse.json({error:'Status inválido'},{status:400});
    if(body.status==='aprovado'&&(!target.whatsapp_numero||!target.whatsapp_consentimento_em))return NextResponse.json({error:'Contato sem consentimento'},{status:400});
    const message=String(body.message||'').replace(/\\n/g,'\n').slice(0,2000);
    const {data:registro,error}=await admin.from('acompanhamentos_semanais').update({mensagem_whatsapp:message,status:body.status,updated_at:new Date().toISOString()}).eq('user_id',userId).eq('semana_inicio',week).select().single();
    if(error)throw error;
    return NextResponse.json({registro});
  }
  return NextResponse.json({error:'Ação inválida'},{status:400});
 } catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Erro interno'},{status:500});}
}
