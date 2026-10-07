const response = await fetch('https://api.mercadopago.com/v1/payments/181799298661', {
  headers: { Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}` },
});
const payment = await response.json();
console.log('MP_VERIFY_RESULT', JSON.stringify({
  http: response.status, id: payment.id, status: payment.status,
  amount: payment.transaction_amount, currency: payment.currency_id,
  reference: payment.external_reference, notification_url: payment.notification_url,
}));
if (!response.ok) throw new Error('Payment verification failed');
