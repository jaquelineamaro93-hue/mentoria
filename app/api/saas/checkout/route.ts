import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { consumeSecurityRateLimit } from '@/lib/security/rate-limit';
import { criarAssinaturaSaasMercadoPago } from '@/lib/mercadopago';
import { calcularPrecoSaas, CATALOGO_SAAS, type PlanoSaas } from '@/lib/soma-saas-pricing';
import { modulosPermitidosNoPlano, resolverAcessoSaas } from '@/lib/soma-saas-entitlements';

export const runtime = 'nodejs';

const json = (val: object, status=200) =>
  NextResponse.json(val, {status, headers:{'Cache-Control':'private, no-store'}});

export async function POST(request: NextRequest) {
  // O checkout SaaS NÃO pode ser liberado antes de RLS, direitos de acesso,
  // consumo de IA, testes com duas contas e webhook assinados homologados.
  if (process.env.SOMA_SAAS_CHECKOUT_GATES_READY !== 'true') {
    return json({ error: 'A contratação automática da Plataforma não está disponível neste momento.' }, 503);
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return json({ error: 'Entre na sua conta para contratar.' }, 401);
  if (!await consumeSecurityRateLimit({
    request, scope:'saas_subscription_start', identifier:user.id, limit:5, windowSeconds:900,
  })) return json({ error:'Muitas tentativas de pagamento.' },429);
  let body: unknown;
  try { body=await request.json(); } catch { return json({ error:'Pedido inválido.' },400); }
  if (!body || typeof body!=='object') return json({ error:'Pedido inválido.' },400);
  const b=body as Record<string,unknown>;
  const plano=b.plano;
  if (plano!=='avulso' && plano!=='essencial' && plano!=='pro') {
    return json({ error:'Plano SaaS inválido.' },400);
  }
  if (typeof b.iris!=='boolean' || typeof b.whatsapp!=='boolean' ||
    b.aceite!==true || b.kitOnboarding===true) {
    return json({ error:'Confirme o plano e os termos. O Kit Onboarding é uma compra única separada.' },400);
  }
  const moduleSlug=plano==='avulso' && typeof b.modulo==='string' ? b.modulo : null;
  if (!modulosPermitidosNoPlano(plano,moduleSlug).length ||
    (plano!=='avulso' && b.modulo != null)) {
    return json({ error:'Módulo inválido.' },400);
  }
  const admin=createAdminClient();
  if (plano==='avulso') {
    const { data: module, error } = await admin.from('soma_modules')
      .select('slug,enabled,purchasable,enforce_access').eq('slug',moduleSlug).maybeSingle();
    if (error || !module?.enabled || !module.purchasable || !module.enforce_access)
      return json({ error:'Esse módulo ainda não está disponível para assinatura independente.' },409);
  }
  const acesso=await resolverAcessoSaas(user.id);
  if (acesso.temMentoria) {
    return json({ error:'Sua mentoria está ativa. Verifique os direitos já incluídos antes de contratar novamente.' },409);
  }
  const { data: active, error: activeErr } = await admin.from('soma_saas_orders')
    .select('id,status').eq('user_id',user.id)
    .in('status',['PENDING','AUTHORIZED','ACTIVE']).limit(1);
  if (activeErr) return json({ error:'Não foi possível verificar sua assinatura.' },503);
  if (active?.length) return json({ error:'Você já tem uma contratação SaaS em andamento ou ativa.' },409);

  const mensal=calcularPrecoSaas(plano as PlanoSaas,{iris:b.iris,whatsapp:b.whatsapp});
  const valor=mensal.total/100;
  const { data:order,error:orderError } = await admin.from('soma_saas_orders')
    .insert({
      user_id:user.id,plan_code:plano,module_slug:moduleSlug,
      iris_enabled:b.iris,whatsapp_enabled:b.whatsapp,
      amount:valor,terms_version:'saas-v1',terms_accepted_at:new Date().toISOString(),
    }).select('id').single();
  if (orderError?.code==='23505') return json({ error:'Você já possui uma contratação em andamento.' },409);
  if (orderError || !order) return json({ error:'Não foi possível preparar o pagamento.' },503);
  try {
    const result=await criarAssinaturaSaasMercadoPago({
      email:user.email,valorMensal:valor,
      titulo:'SOMA Plataforma '+CATALOGO_SAAS[plano].nome+' mensal',
      externalReference:order.id,
    });
    const {error} = await admin.from('soma_saas_orders')
      .update({ provider_subscription_id:result.id,updated_at:new Date().toISOString() })
      .eq('id',order.id).eq('status','PENDING');
    if (error) throw new Error('Falha de vínculo com o pagamento.');
    return json({ init_point:result.init_point, pedido_id:order.id });
  } catch {
    await admin.from('soma_saas_orders').update({
      status:'CANCELED',updated_at:new Date().toISOString(),
    }).eq('id',order.id).eq('status','PENDING');
    return json({ error:'Não foi possível iniciar o pagamento no Mercado Pago.' },503);
  }
}
