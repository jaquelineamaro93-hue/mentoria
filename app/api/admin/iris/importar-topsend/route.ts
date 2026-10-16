import { createHash } from 'node:crypto';
import { NextRequest,NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime='nodejs';
export const maxDuration=30;
const headers={'Cache-Control':'private, no-store'};
const uuid=(v:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
type Linha={direcao?:unknown;conteudo?:unknown;ocorridoEm?:unknown};
type Entrada={userId?:unknown;mensagens?:unknown;insight?:unknown;proximoPasso?:unknown};

export async function POST(request:NextRequest) {
  const client=await createClient();
  const {data:{user},error:authError}=await client.auth.getUser();
  if(authError||!user)return NextResponse.json({error:'Não autenticado'},{status:401,headers});
  const {data:adminProfile,error:adminError}=await client.from('profiles')
    .select('is_admin').eq('id',user.id).maybeSingle();
  if(adminError||!adminProfile?.is_admin)
    return NextResponse.json({error:'Acesso restrito à administração'},{status:403,headers});

  const raw=await request.text();
  if(raw.length>240000)return NextResponse.json({error:'Transcrição muito grande'},{status:413,headers});
  let input:Entrada;
  try{input=JSON.parse(raw) as Entrada;}catch{
    return NextResponse.json({error:'Dados inválidos'},{status:400,headers});
  }
  if(!input||typeof input!=='object'||typeof input.userId!=='string'||!uuid(input.userId))
    return NextResponse.json({error:'Mentorado inválido'},{status:400,headers});
  if(!Array.isArray(input.mensagens)||input.mensagens.length<1||input.mensagens.length>50)
    return NextResponse.json({error:'Envie de 1 a 50 mensagens por importação'},{status:400,headers});
  const insight=typeof input.insight==='string'?input.insight.trim():'';
  const proximoPasso=typeof input.proximoPasso==='string'?input.proximoPasso.trim():'';
  if(insight.length>1000||proximoPasso.length>600)
    return NextResponse.json({error:'Insight ou próximo passo muito longo'},{status:400,headers});

  const db=createAdminClient();
  const {data:perfil,error:perfilError}=await db.from('profiles')
    .select('id,nome,whatsapp_numero,is_admin').eq('id',input.userId).maybeSingle();
  if(perfilError||!perfil||perfil.is_admin)
    return NextResponse.json({error:'Mentorado não encontrado'},{status:404,headers});
  if(!perfil.whatsapp_numero)
    return NextResponse.json({error:'Mentorado sem número de WhatsApp cadastrado'},{status:422,headers});

  const agora=Date.now();
  const linhas=[];
  const deduplicar=new Set<string>();
  for(const rawItem of input.mensagens as Linha[]) {
    if(!rawItem||typeof rawItem!=='object'||!['entrada','saida'].includes(String(rawItem.direcao))||
      typeof rawItem.conteudo!=='string'||typeof rawItem.ocorridoEm!=='string')
      return NextResponse.json({error:'Linha inválida. Informe autor, texto e data de cada mensagem.'},{status:422,headers});
    const conteudo=rawItem.conteudo.trim();
    const ocorridoEm=rawItem.ocorridoEm.trim();
    const data=Date.parse(ocorridoEm);
    if(!conteudo||conteudo.length>5000||!/[zZ]$|[+-]\d{2}:\d{2}$/.test(ocorridoEm)||
      !Number.isFinite(data)||data>agora+300000||data<agora-366*86400000)
      return NextResponse.json({error:'Revise os textos e datas. Aceitamos datas com fuso dos últimos 12 meses.'},{status:422,headers});
    const normalized=new Date(data).toISOString();
    const chave='topsend-manual-'+createHash('sha256')
      .update([input.userId,rawItem.direcao,normalized,conteudo].join('\u0000')).digest('hex');
    if(deduplicar.has(chave))continue;
    deduplicar.add(chave);
    linhas.push({
      user_id:input.userId,chave_origem:chave,canal:'topsend',
      direcao:rawItem.direcao,conteudo,ocorrido_em:normalized,
      registrado_por:'importacao_manual_topsend',
    });
  }
  if(!linhas.length)return NextResponse.json({error:'Nenhuma mensagem válida'},{status:422,headers});

  // There is no TopSend export/return API. Store the admin-transcribed history
  // as manual evidence, never as a verified event, nor trigger outbound sends.
  const {data:inseridas,error:erroInsert}=await db.from('iris_mensagens_importadas')
    .upsert(linhas,{onConflict:'chave_origem',ignoreDuplicates:true}).select('id');
  if(erroInsert)return NextResponse.json({error:'Não foi possível registrar a transcrição'},{status:503,headers});
  const novas=inseridas?.length??0;
  let evolucaoRegistrada=false;
  if(novas>0 && (insight||proximoPasso)) {
    const ultimoEm=linhas.reduce((m,x)=>Date.parse(x.ocorrido_em)>Date.parse(m)?x.ocorrido_em:m,linhas[0].ocorrido_em);
    const {data:estado,error:erroEstado}=await db.from('iris_estado')
      .select('ultima_interacao_em').eq('user_id',input.userId).maybeSingle();
    if(erroEstado)return NextResponse.json({error:'Mensagens salvas, mas a evolução não pôde ser consultada.',registradas:novas},{status:503,headers});
    // Nunca perder o status pausado nem retroceder a última interação do aluno.
    const ultima=estado?.ultima_interacao_em && Date.parse(estado.ultima_interacao_em)>Date.parse(ultimoEm)?
      estado.ultima_interacao_em:ultimoEm;
    const update:Record<string,unknown>={
      ultima_interacao_em:ultima,updated_at:new Date().toISOString(),
    };
    if(insight)update.insight_atual=insight;
    if(proximoPasso)update.proximo_passo=proximoPasso;
    const operacao=estado
      ? db.from('iris_estado').update(update).eq('user_id',input.userId)
      : db.from('iris_estado').insert({user_id:input.userId,...update});
    const {error:stateError}=await operacao;
    if(stateError)return NextResponse.json({error:'Mensagens salvas, mas falhou a atualização do acompanhamento. Confira o histórico antes de tentar novamente.',registradas:novas},{status:503,headers});
    if(proximoPasso) {
      const {error:stepError}=await db.from('iris_proximos_passos').insert({
        user_id:input.userId,turno_id:null,acao:proximoPasso,insight:insight||null,
        situacao:'proposto',
      });
      if(stepError)return NextResponse.json({error:'Mensagens salvas, mas o próximo passo não foi registrado.',registradas:novas},{status:503,headers});
    }
    evolucaoRegistrada=true;
  }
  return NextResponse.json({
    ok:true,registradas:novas,duplicadas:linhas.length-novas,
    evolucaoRegistrada,
    aviso:'Histórico importado manualmente da TopSend. Não representa sincronização automática nem comprovação de entrega.',
  },{headers});
}
