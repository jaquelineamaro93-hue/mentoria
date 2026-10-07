// Explicit production test: nullable user prevents granting paid benefits.
if (process.env.MP_CREATE_WEBHOOK_TEST !== '1') throw new Error('Explicit test flag required');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=representation' };
const orderResponse = await fetch(`${supabaseUrl}/rest/v1/mp_pedidos`, {
  method: 'POST', headers,
  body: JSON.stringify({ user_id: null, email: 'teste-tecnico@somamentoria.com', tipo: 'sessao_extra', forma_pagamento: 'teste_tecnico', valor: 0.01 }),
});
if (!orderResponse.ok) throw new Error(`Technical order failed HTTP ${orderResponse.status}`);
const [order] = await orderResponse.json();
const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
  method: 'POST',
  headers: { Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    items: [{ title: 'Teste técnico webhook SOMA - R$ 0,01', quantity: 1, currency_id: 'BRL', unit_price: 0.01 }],
    external_reference: order.id,
    notification_url: 'https://somamentoria.com/api/mercadopago/webhook',
  }),
});
const result = await response.json();
if (!response.ok) throw new Error(`Technical preference failed HTTP ${response.status}`);
const update = await fetch(`${supabaseUrl}/rest/v1/mp_pedidos?id=eq.${order.id}`, {
  method: 'PATCH', headers, body: JSON.stringify({ mp_resource_id: result.id }),
});
if (!update.ok) throw new Error(`Technical order link failed HTTP ${update.status}`);
console.log('MP_WEBHOOK_TEST', JSON.stringify({ order: order.id, init_point: result.init_point, notification_url: result.notification_url }));
