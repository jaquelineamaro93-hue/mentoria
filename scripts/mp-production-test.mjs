// Run only explicitly: creates one standalone technical test preference.
if (process.env.MP_CREATE_TECHNICAL_TEST !== '1') throw new Error('Explicit test flag required');
const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
  method: 'POST',
  headers: { Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    items: [{ title: 'Teste técnico SOMA - R$ 0,01', quantity: 1, currency_id: 'BRL', unit_price: 0.01 }],
    external_reference: `teste-tecnico-${Date.now()}`,
  }),
});
const result = await response.json();
console.log('MP_TEST_RESULT', JSON.stringify({ status: response.status, init_point: result.init_point, message: result.message, error: result.error }));
