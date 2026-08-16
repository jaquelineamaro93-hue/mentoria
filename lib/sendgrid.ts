import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

export async function sendEmail({
  to,
  subject,
  html,
  from = 'noreply@somamentoria.com',
}: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}) {
  try {
    await sgMail.send({
      to,
      from,
      subject,
      html,
    });
    console.log('✅ Email enviado para:', to);
    return true;
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error);
    return false;
  }
}
