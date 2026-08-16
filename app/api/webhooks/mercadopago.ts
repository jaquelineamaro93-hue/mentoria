import { createClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/sendgrid';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    console.log('🔔 Webhook recebido:', { action: body.action, id: body.data?.id });

    // Validar assinatura secreta
    const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    const xSignature = request.headers.get('x-signature');
    const xRequestId = request.headers.get('x-request-id');

    if (!validateSignature(body, xSignature || '', xRequestId || '', secret || '')) {
      console.error('❌ Assinatura inválida');
      return Response.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Só processa pagamentos
    if (body.type !== 'payment') {
      return Response.json({ ok: true });
    }

    const paymentId = body.data?.id;
    if (!paymentId) {
      return Response.json({ error: 'No payment ID' }, { status: 400 });
    }

    // Consulta dados do pagamento no MP
    const paymentData = await getPaymentFromMP(paymentId);
    
    if (!paymentData) {
      console.error('❌ Pagamento não encontrado no MP');
      return Response.json({ error: 'Payment not found' }, { status: 404 });
    }

    console.log('💳 Pagamento:', {
      id: paymentData.id,
      status: paymentData.status,
      email: paymentData.payer?.email,
      amount: paymentData.transaction_amount,
    });

    // Se aprovado
    if (paymentData.status === 'approved') {
      const email = paymentData.payer?.email;
      const externalReference = paymentData.external_reference;

      if (!email) {
        console.error('❌ Email não encontrado no pagamento');
        return Response.json({ error: 'No email' }, { status: 400 });
      }

      // Cria conta do usuário
      const user = await createUserAccount(email);
      
      if (user) {
        console.log('✅ Usuário criado:', email);
        
        // Envia email de boas-vindas
        await sendWelcomeEmail(email);
        console.log('📧 Email enviado para:', email);
      }
    }

    return Response.json({ ok: true, processed: true });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

// Validar assinatura
function validateSignature(
  data: any,
  xSignature: string,
  xRequestId: string,
  secret: string
): boolean {
  const manifestString = `id=${data.data?.id};request-id=${xRequestId};`;
  const hash = crypto
    .createHmac('sha256', secret)
    .update(manifestString)
    .digest('hex');
  return hash === xSignature;
}

// Consultar pagamento no MP
async function getPaymentFromMP(paymentId: string) {
  try {
    const response = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
        },
      }
    );
    return await response.json();
  } catch (error) {
    console.error('Erro ao consultar MP:', error);
    return null;
  }
}

// Criar conta do usuário
async function createUserAccount(email: string) {
  try {
    const supabase = await createClient();
    
    // Cria usuário via admin
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        created_via: 'payment',
        payment_date: new Date().toISOString(),
      },
    });

    if (error) {
      console.error('Erro ao criar usuário:', error);
      return null;
    }

    console.log('✅ Usuário criado no Supabase:', data.user?.id);
    return data.user;
  } catch (error) {
    console.error('Erro:', error);
    return null;
  }
}

// Enviar email
async function sendWelcomeEmail(email: string) {
  try {
    await sendEmail({
      to: email,
      subject: 'Bem-vindo ao SOMA Mentoria! 🎉',
      html: `
        <h2>Pagamento Aprovado!</h2>
        <p>Sua conta foi criada com sucesso.</p>
        <p><a href="https://somamentoria.com/dashboard">Acessar Dashboard</a></p>
      `,
    });
  } catch (error) {
    console.error('Erro ao enviar email:', error);
  }
}
