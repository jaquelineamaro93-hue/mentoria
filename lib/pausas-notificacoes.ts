import { createAdminClient } from '@/lib/supabase/admin';
import { enviarEmail } from '@/lib/sendgrid';

type Tipo='inicio'|'retorno_7d'|'retorno_1d'|'retomada';
type Pausa={
  id:string;user_id:string;inicio_em:string;fim_previsto_em:string;
  status:'ativa'|'finalizada';finalizado_em:string|null;
  dias_utilizados:number;vencimento_depois:string|null;atualizado_em:string;
};
const html=(s:string)=>s.replace(/[&<>"']/g,ch=>({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;',
}[ch]??ch));
const datePt=(date:string)=>date.split('-').reverse().join('/');
const url='https://somamentoria.com/meu-plano';
const dateSP=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',
  year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
function daysBetween(a:string,b:string):number{
  return Math.round((Date.parse(b+'T12:00:00Z')-Date.parse(a+'T12:00:00Z'))/86400000);
}
function emailFor(nome:string,tipo:Tipo,p:Pausa) {
  const primeiro=html(nome.trim().split(/\s+/)[0]||'Mentorado');
  const textos:Record<Tipo,{assunto:string;conteudo:string}>={
    inicio:{
      assunto:'Sua pausa da SOMA Mentoria foi programada',
      conteudo:'Sua pausa está confirmada até <strong>'+datePt(p.fim_previsto_em)+
        '</strong>. Nesse período, os lembretes de participação ficam suspensos e suas conquistas permanecem guardadas. O vencimento será prorrogado pelos dias efetivamente utilizados. Se quiser voltar antes, basta acessar Meu Plano.',
    },
    retorno_7d:{
      assunto:'Sua mentoria retorna em breve',
      conteudo:'Sua pausa na SOMA está perto do fim. O retorno está previsto para <strong>'+
        datePt(p.fim_previsto_em)+'</strong>. Você não precisa tomar nenhuma providência para reativar na data programada. Se quiser antecipar, há essa opção em Meu Plano.',
    },
    retorno_1d:{
      assunto:'Amanhã sua jornada na SOMA será retomada',
      conteudo:'Passando para lembrar que a sua mentoria volta em <strong>'+
        datePt(p.fim_previsto_em)+'</strong>. Sua próxima ação pode ser pequena: retomar o PDI, praticar inglês ou rever uma meta de carreira.',
    },
    retomada:{
      assunto:'Sua mentoria SOMA está novamente ativa',
      conteudo:'Seu ciclo de mentoria foi retomado. Os dias de pausa utilizados foram acrescidos ao prazo do programa.'+
        (p.vencimento_depois?' Seu novo vencimento é <strong>'+datePt(p.vencimento_depois)+'</strong>.':'')+
        ' Suas conquistas, histórico e Impulsos continuam com você.',
    },
  };
  const entry=textos[tipo];
  return {
    assunto:entry.assunto,
    corpo:'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"></head>'+
      '<body style="margin:0;background:#f5f7f5;font-family:Arial,sans-serif;color:#29332e">'+
      '<table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="padding:24px">'+
      '<tr><td align="center"><table role="presentation" width="600" style="width:100%;max-width:600px;background:#fff;border-radius:16px"><tr><td style="padding:32px">'+
      '<h1 style="font-size:23px;margin:0 0 22px;color:#2b5140">SOMA Mentoria</h1>'+
      '<p style="font-size:16px;line-height:1.6">Oi, '+primeiro+'.</p>'+
      '<p style="font-size:16px;line-height:1.7">'+entry.conteudo+'</p>'+
      '<p style="margin:28px 0"><a href="'+url+'" style="background:#345b46;color:#fff;text-decoration:none;border-radius:10px;padding:14px 22px">Acessar Meu Plano</a></p>'+
      '<p style="font-size:12px;line-height:1.6;color:#6d7871">Mensagem sobre sua participação na SOMA Mentoria. A pausa não suspende automaticamente cobranças de parcelas ou assinaturas recorrentes.</p>'+
      '</td></tr></table></td></tr></table></body></html>',
  };
}

export async function enviarEmailPausa(pausaId:string,tipo:Tipo):Promise<{enviado:boolean;motivo?:string}> {
  const db=createAdminClient();
  const {data:p,error}=await db.from('mentoria_pausas')
    .select('id,user_id,inicio_em,fim_previsto_em,status,finalizado_em,dias_utilizados,vencimento_depois,atualizado_em')
    .eq('id',pausaId).maybeSingle();
  if(error||!p)return {enviado:false,motivo:'Pausa não encontrada'};
  if(tipo==='retomada' && p.status!=='finalizada')return{enviado:false,motivo:'Pausa ainda ativa'};
  if(tipo!=='retomada' && p.status!=='ativa')return{enviado:false,motivo:'Pausa já encerrada'};
  const {data:perfil,error:errPerfil}=await db.from('profiles')
    .select('id,email,nome').eq('id',p.user_id).maybeSingle();
  if(errPerfil||!perfil?.email)return {enviado:false,motivo:'Destinatário não encontrado'};
  const {error:reserveError}=await db.from('mentoria_pausa_avisos').insert({
    pausa_id:p.id,canal:'email',tipo,status:'reservado',
  });
  if(reserveError) {
    if(reserveError.code==='23505')return{enviado:false,motivo:'Aviso reservado ou enviado anteriormente'};
    return{enviado:false,motivo:'Não foi possível reservar o envio'};
  }
  const template=emailFor(perfil.nome||'Mentorado',tipo,p as Pausa);
  const ok=await enviarEmail({para:perfil.email,assunto:template.assunto,html:template.corpo});
  if(!ok)return{enviado:false,motivo:'Falha de envio. Verifique a reserva e o provedor para evitar duplicidade.'};
  const {error:updated}=await db.from('mentoria_pausa_avisos').update({
    status:'enviado',enviado_em:new Date().toISOString(),
  }).eq('pausa_id',pausaId).eq('canal','email').eq('tipo',tipo);
  if(updated)return{enviado:false,motivo:'E-mail aceito; atualização do status ficou incerta'};
  return{enviado:true};
}

export async function executarPausasProgramadas() {
  const db=createAdminClient();
  const today=dateSP();
  const resumo={finalizadas:0,emails:0,erros:[] as string[]};
  const {data:terminando,error:queryError}=await db.from('mentoria_pausas')
    .select('id').eq('status','ativa').lte('fim_previsto_em',today).limit(200);
  if(queryError)resumo.erros.push('Falha ao consultar pausas programadas');
  for(const p of terminando??[]) {
    const {error}=await db.rpc('finalizar_pausa_mentoria',{
      p_pausa_id:p.id,p_antecipada:false,
    });
    if(error)resumo.erros.push('Não foi possível retomar a pausa '+p.id);
    else resumo.finalizadas++;
  }

  const [{data:ativas,error:erroAtivas},{data:concluidas,error:erroConcluidas}]=await Promise.all([
    db.from('mentoria_pausas').select('id,criado_em,fim_previsto_em')
      .eq('status','ativa').limit(500),
    db.from('mentoria_pausas').select('id,atualizado_em')
      .eq('status','finalizada')
      .gte('atualizado_em',new Date(Date.now()-7*86400000).toISOString())
      .limit(500),
  ]);
  if(erroAtivas||erroConcluidas){
    resumo.erros.push('Falha ao consultar avisos programados');
    return resumo;
  }
  for(const p of ativas??[]) {
    const dif=daysBetween(today,p.fim_previsto_em);
    const tipo:Tipo[]= [];
    if(Date.now()-Date.parse(p.criado_em)<3*86400000)tipo.push('inicio');
    if(dif>1 && dif<=7)tipo.push('retorno_7d');
    if(dif===1)tipo.push('retorno_1d');
    for(const t of tipo) {
      const resultado=await enviarEmailPausa(p.id,t);
      if(resultado.enviado)resumo.emails++;
      else if(resultado.motivo && !resultado.motivo.includes('anteriormente'))
        resumo.erros.push(p.id+': '+resultado.motivo);
    }
  }
  for(const p of concluidas??[]) {
    const result=await enviarEmailPausa(p.id,'retomada');
    if(result.enviado)resumo.emails++;
    else if(result.motivo&&!result.motivo.includes('anteriormente'))
      resumo.erros.push(p.id+': '+result.motivo);
  }
  return resumo;
}
