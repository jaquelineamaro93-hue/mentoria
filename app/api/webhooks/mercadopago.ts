export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const paymentId = body.data?.id;
    const action = body.action;

    console.log('🔔 MercadoPago Webhook:', { action, paymentId });

    if (action === 'payment.created') {
      console.log('✅ Pagamento recebido:', paymentId);
      // Aqui cria a conta do usuário via webhook
    }

    return Response.json({ ok: true, received: true });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
