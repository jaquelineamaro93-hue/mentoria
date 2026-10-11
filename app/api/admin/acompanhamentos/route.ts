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
    const [diagnostico,diario,pdi,quem]=await Promise.all([
      admin.from('diagnostics').select('objetivos').eq('user_id',userId).order('created_at',{ascending:false}).limit(1).maybeSingle(),
      admin.from('journal_notes').select('id').eq('user_id',userId),
      admin.from('pdi_respostas').select('id,concluido').eq('user_id',userId),
      admin.from('quem_sou_eu_respostas').select('id').eq('user_id',userId)
    ]);
    const objetivo=String(diagnostico.data?.objetivos||'Objetivo ainda não preenchido').slice(0,1500);
    const diarioN=diario.data?.length||0,pdiN=pdi.data?.filter(x=>x.concluido).length||0,quemN=quem.data?.length||0;
    const progresso=`${quemN} respostas no Quem Sou Eu, ${pdiN} seções do PDI concluídas e ${diarioN} registros no diário (totais acumulados).`;
    const insight=objetivo==='Objetivo ainda não preenchido'?'Priorizar a definição do objetivo de desenvolvimento antes de propor metas.':'Relacionar o objetivo declarado com uma ação concreta no PDI; as contagens não comprovam evolução qualitativa.';
    const proxima_acao=objetivo==='Objetivo ainda não preenchido'?'Registrar o objetivo de carreira no diagnóstico.':'Escolher uma ação pequena e mensurável para avançar no objetivo nesta semana.';
    const primeiroNome=String(target.nome||'').split(' ')[0];
    const mensagem=`Oi, ${primeiroNome}! 💜 Como você está? Nesta semana, que tal ${proxima_acao.charAt(0).toLowerCase()+proxima_acao.slice(1)} Se quiser, me conte o que já conseguiu fazer e onde precisa de apoio. ✨`;
    const {data:registro,error}=await admin.from('acompanhamentos_semanais').upsert({user_id:userId,semana_inicio:week,objetivo,progresso,insight,proxima_acao,mensagem_whatsapp:mensagem,status:'rascunho',updated_at:new Date().toISOString()},{onConflict:'user_id,semana_inicio'}).select().single();
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
