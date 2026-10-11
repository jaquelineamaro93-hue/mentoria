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
    if(existente?.status==='aprovado'||existente?.status==='enviado')return NextResponse.json({error:'Este acompanhamento já foi aprovado ou enviado. Não é permitido sobrescrevê-lo automaticamente.'},{status:409});
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

    function resumo(valor: unknown, max=170): string {
      if(valor==null)return '';
      const texto=typeof valor==='string'?valor:JSON.stringify(valor);
      return texto.replace(/\\s+/g,' ').trim().slice(0,max);
    }
    const objetivo=resumo(diagnostico.data?.objetivos,400);
    const momento=resumo(diagnostico.data?.momento_carreira,160);
    const diarioAtual=(diario.data||[]).find(x=>resumo(x.anotacoes||x.ai_summary).length>15);
    const pdiAtual=(pdi.data||[]).find(x=>resumo(x.dados).length>20);
    const quemAtual=(quem.data||[]).find(x=>resumo(x.resposta).length>20);
    const anterior=historico.data;
    const fontes=[
      objetivo&&'Objetivo registrado no diagnóstico: '+objetivo,
      momento&&'Momento de carreira: '+momento,
      diarioAtual&&'Última anotação no diário ('+new Date(diarioAtual.created_at).toLocaleDateString('pt-BR')+'): '+resumo(diarioAtual.anotacoes||diarioAtual.ai_summary,400),
      pdiAtual&&'PDI, seção '+resumo(pdiAtual.secao,60)+' ('+(pdiAtual.concluido?'concluída':'em andamento')+'): '+resumo(pdiAtual.dados,350),
      quemAtual&&'Quem Sou Eu, bloco '+resumo(quemAtual.bloco,60)+': '+resumo(quemAtual.resposta,350),
      via.data?.forcas&&'Forças VIA: '+resumo(via.data.forcas,180),
      anterior?.proxima_acao&&'Ação combinada na semana anterior: '+resumo(anterior.proxima_acao,200),
    ].filter(Boolean) as string[];
    const primeiroNome=String(target.nome||'mentorada').trim().split(' ')[0];
    const base=diarioAtual?resumo(diarioAtual.anotacoes||diarioAtual.ai_summary,140):
      pdiAtual?resumo(pdiAtual.dados,140):
      quemAtual?resumo(quemAtual.resposta,140):objetivo?resumo(objetivo,140):'';
    const acaoAnterior=resumo(anterior?.proxima_acao,160);
    let insight='',proxima_acao='',mensagem='';
    if(!base&&!acaoAnterior) {
      insight='Ainda não há informações qualitativas suficientes para acompanhar esta pessoa individualmente. Não inferir desafios ou evolução.';
      proxima_acao='Perguntar qual objetivo profissional é prioridade e qual ação já está em andamento.';
      mensagem=`Oi, ${primeiroNome}! 💜 Quero entender melhor seu momento para te acompanhar de forma útil. Qual objetivo profissional é mais importante para você agora? E o que você já tentou fazer para avançar nele?`;
    } else {
      insight=fontes.join('\\n')+'\\nObservação: registro existente não comprova execução de ações ou evolução; confirmar diretamente com a mentorada.';
      proxima_acao=acaoAnterior?
        'Retomar a ação combinada anteriormente e verificar o resultado antes de propor outra.':
        diarioAtual?'Retomar a situação descrita na última anotação e definir um próximo passo viável.':
        pdiAtual?'Retomar a seção do PDI em andamento e transformar a reflexão em uma ação verificável.':
        'Validar o objetivo declarado e definir uma primeira ação concreta com a mentorada.';
      const referencia=diarioAtual?'Na sua última anotação você trouxe:':
        pdiAtual?'No seu PDI você registrou:':
        quemAtual?'Na sua reflexão do Quem Sou Eu você escreveu:':'No seu diagnóstico você registrou este objetivo:';
      mensagem=`Oi, ${primeiroNome}! 💜 ${acaoAnterior?`No acompanhamento anterior, a ação que ficou registrada foi: “${acaoAnterior}”. Você conseguiu avançar? O que facilitou ou dificultou? `:''}${referencia} “${base}”. ${acaoAnterior?'Quero entender como isso se conecta ao que você viveu nesta semana.':'O que mudou desde que você escreveu isso e qual seria um próximo passo possível nesta semana?'} Estou aqui para construir esse passo com você.`;
    }
    const progresso=`Fontes individuais consultadas: ${fontes.length}. ${diario.data?.length||0} anotações recentes, ${pdi.data?.length||0} seções de PDI, ${quem.data?.length||0} reflexões; histórico anterior ${anterior?'encontrado':'não encontrado'}. Os números não representam avanço.`;
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
    const message=String(body.message||'').slice(0,2000);
    const {data:registro,error}=await admin.from('acompanhamentos_semanais').update({mensagem_whatsapp:message,status:body.status,updated_at:new Date().toISOString()}).eq('user_id',userId).eq('semana_inicio',week).select().single();
    if(error)throw error;
    return NextResponse.json({registro});
  }
  return NextResponse.json({error:'Ação inválida'},{status:400});
 } catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Erro interno'},{status:500});}
}
