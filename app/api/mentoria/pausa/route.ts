import { NextRequest,NextResponse,after } from 'next/server';
import { enviarEmailPausa } from '@/lib/pausas-notificacoes';
import { createClient } from '@/lib/supabase/server';

export const runtime='nodejs';
const noStore={'Cache-Control':'private, no-store'};
type Input={acao?:string;dias?:number;confirmou?:boolean};

export async function GET() {
  const db=await createClient();
  const {data:{user}}=await db.auth.getUser();
  if(!user)return NextResponse.json({error:'Não autenticado'},{status:401,headers:noStore});
  const [{data:pausa,error:pausaError},{data:ciclos,error:ciclosError},
    {data:perfil,error:perfilError},{data:termo,error:termoError}]=await Promise.all([
    db.from('mentoria_pausas')
      .select('id,status,inicio_em,fim_previsto_em,finalizado_em,dias_solicitados,dias_utilizados,vencimento_antes,vencimento_depois')
      .eq('user_id',user.id).order('criado_em',{ascending:false}).limit(10),
    db.from('mentoria_pausa_ciclos')
      .select('id,plano_id,vencimento_base,vencimento_atual,dias_utilizados')
      .eq('user_id',user.id).order('criado_em',{ascending:false}).limit(10),
    db.from('profiles').select('plano_id,status_assinatura,is_admin,data_fim_acesso,origem_assinatura')
      .eq('id',user.id).maybeSingle(),
    db.from('termos_versoes').select('id,versao').eq('ativo',true)
      .order('publicado_em',{ascending:false}).limit(1).maybeSingle(),
  ]);
  if(pausaError||ciclosError||perfilError||termoError)
    return NextResponse.json({error:'Não foi possível consultar a situação da mentoria'},{status:503,headers:noStore});
  const recente=(ciclos??[]).find(c=>c.plano_id===perfil?.plano_id &&
    c.vencimento_atual===perfil?.data_fim_acesso);
  const {data:aceite,error:aceiteError}=termo?.id
    ?await db.from('termos_aceites').select('id').eq('user_id',user.id).eq('termo_id',termo.id).limit(1).maybeSingle()
    :{data:null,error:null};
  if(aceiteError)return NextResponse.json({error:'Falha ao consultar o aceite do termo'},{status:503,headers:noStore});
  const {data:careerContract,error:careerError}=await db.rpc('soma_has_career_contract');
  if(careerError)return NextResponse.json({error:'Falha ao consultar seu contrato'},{status:503,headers:noStore});
  const ativa=(pausa??[]).find(p=>p.status==='ativa')??null;
  const disponiveis=60-(recente?.dias_utilizados??0);
  return NextResponse.json({
    pausaAtiva:ativa,pausas:pausa??[],diasDisponiveis:disponiveis,
    vencimento:perfil?.data_fim_acesso??null,
    assinaturaRecorrente:perfil?.origem_assinatura==='mercadopago',
    elegivel:!perfil?.is_admin&&perfil?.status_assinatura==='ativo'&&!!perfil?.data_fim_acesso &&
      perfil.data_fim_acesso>=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()),
    termoAtualizado:careerContract===true||termo?.versao==='2.1',termoAceito:careerContract===true||!!aceite,
  },{headers:noStore});
}

export async function POST(request:NextRequest) {
  const db=await createClient();
  const {data:{user}}=await db.auth.getUser();
  if(!user)return NextResponse.json({error:'Não autenticado'},{status:401,headers:noStore});
  const input=(await request.json().catch(()=>null)) as Input|null;
  if(!input||typeof input!=='object')
    return NextResponse.json({error:'Dados inválidos'},{status:400,headers:noStore});
  if(input.acao==='solicitar'){
    if(!Number.isInteger(input.dias)||input.dias!<1||input.dias!>60||input.confirmou!==true)
      return NextResponse.json({error:'Confirme de 1 a 60 dias de pausa'},{status:400,headers:noStore});
    const {data,error}=await db.rpc('solicitar_pausa_mentoria',{
      p_dias:input.dias,p_confirmou:true,
    });
    if(error)return NextResponse.json({error:error.message},{status:409,headers:noStore});
    const nova=data as {id?:string}|null;
    if(nova?.id)after(async()=>{await enviarEmailPausa(nova.id!,'inicio');});
    return NextResponse.json({ok:true,pausa:data},{headers:noStore});
  }
  if(input.acao==='retomar'){
    const {data:pausa,error:findError}=await db.from('mentoria_pausas')
      .select('id').eq('user_id',user.id).eq('status','ativa').maybeSingle();
    if(findError||!pausa)
      return NextResponse.json({error:'Nenhuma pausa ativa para concluir'},{status:409,headers:noStore});
    const {data,error}=await db.rpc('finalizar_pausa_mentoria',{
      p_pausa_id:pausa.id,p_antecipada:true,
    });
    if(error)return NextResponse.json({error:error.message},{status:409,headers:noStore});
    after(async()=>{await enviarEmailPausa(pausa.id,'retomada');});
    return NextResponse.json({ok:true,retomada:data},{headers:noStore});
  }
  return NextResponse.json({error:'Ação não reconhecida'},{status:400,headers:noStore});
}
