import { createHmac, timingSafeEqual } from 'node:crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

function validToken(id:string, token:string) {
  const secret=process.env.CRON_SECRET;
  if(!secret || !/^[a-f0-9-]{36}$/i.test(id) || !/^[a-f0-9]{64}$/i.test(token)) return false;
  const expected=createHmac('sha256',secret).update(id).digest('hex');
  return timingSafeEqual(Buffer.from(expected),Buffer.from(token.toLowerCase()));
}
function page(id:string,token:string) {
  return `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Preferências SOMA</title><body style="max-width:540px;margin:64px auto;padding:20px;font:16px Arial,sans-serif;color:#24382d"><h1>Comunicações SOMA</h1><p>Deseja parar de receber mensagens comerciais sobre o período de teste? Isso não altera sua assinatura nem mensagens essenciais de serviço.</p><form method="POST"><input type="hidden" name="u" value="${id}"><input type="hidden" name="sig" value="${token}"><button style="background:#276b52;color:white;border:0;padding:14px;border-radius:8px;cursor:pointer">Cancelar comunicações comerciais</button></form></body></html>`;
}
export async function GET(request:Request) {
 const url=new URL(request.url),id=url.searchParams.get('u')||'',sig=url.searchParams.get('sig')||'';
 if(!validToken(id,sig)) return new Response('Link inválido.',{status:400});
 return new Response(page(id,sig),{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}});
}
export async function POST(request:Request) {
 const data=await request.formData(),id=String(data.get('u')||''),sig=String(data.get('sig')||'');
 if(!validToken(id,sig)) return NextResponse.json({error:'Link inválido'},{status:400});
 const db=createAdminClient();
 const {error}=await db.from('trial_growth_opt_out').upsert({user_id:id,opted_out_at:new Date().toISOString()},{onConflict:'user_id'});
 if(error) return new Response('Não foi possível atualizar suas preferências. Tente novamente.',{status:503});
 return new Response('<!doctype html><html lang="pt-BR"><meta charset="utf-8"><body style="font:16px Arial;padding:40px"><h2>Preferências atualizadas</h2><p>Você não receberá novos e-mails comerciais da régua de trial SOMA.</p></body></html>',{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}});
}
