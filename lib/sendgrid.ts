interface EnviarEmailParams {
  para: string;
  assunto: string;
  html: string;
}

export async function enviarEmail({ para, assunto, html }: EnviarEmailParams): Promise<void> {
  const apiKey = process.env.SENDGRID_API_KEY;
  const remetente = process.env.SENDGRID_FROM_EMAIL ?? 'consultoria@camarocrm.com';

  if (!apiKey) {
    throw new Error('SENDGRID_API_KEY não configurada. Adicione essa variável de ambiente para habilitar o envio de e-mails.');
  }

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: para }] }],
      from: { email: remetente, name: 'Mentoria SOMA' },
      subject: assunto,
      content: [{ type: 'text/html', value: html }],
    }),
  });

  if (!response.ok) {
    const detalhe = await response.text();
    throw new Error(`Erro ao enviar e-mail via SendGrid: ${response.status} ${detalhe}`);
  }
}

export function templateInatividade(nome: string): string {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #362b21;">
      <h2 style="color: #3c2c1f;">Sentimos sua falta, ${nome.split(' ')[0]}</h2>
      <p>Faz um tempo que você não acessa o Portal da Mentoria SOMA. Sua jornada continua esperando por você.</p>
      <p>Entra quando puder para continuar de onde parou, seja no Mapa Quem Sou Eu, no Diário de Bordo ou no PDI.</p>
      <p style="margin-top: 24px;">Com carinho,<br>Jaque</p>
    </div>
  `;
}

export function templateLembreteEncontro(nome: string, tituloEncontro: string, dataEvento: string): string {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #362b21;">
      <h2 style="color: #3c2c1f;">Seu encontro está chegando, ${nome.split(' ')[0]}</h2>
      <p><strong>${tituloEncontro}</strong></p>
      <p>${dataEvento}</p>
      <p>Não esquece de dar uma olhada no Mural de Avisos do portal antes do encontro.</p>
      <p style="margin-top: 24px;">Até lá,<br>Jaque</p>
    </div>
  `;
}

export function templateOnboardingPendente(nome: string): string {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #362b21;">
      <h2 style="color: #3c2c1f;">Vamos marcar seu onboarding, ${nome.split(' ')[0]}?</h2>
      <p>Notei que você ainda não marcou sua sessão inicial na Mentoria SOMA.</p>
      <p>É rapidinho, 20 minutos para alinharmos seus objetivos logo no início da jornada.</p>
      <p style="margin-top: 24px;">Te espero por lá,<br>Jaque</p>
    </div>
  `;
}

export function templateBoasVindas(nome: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://mentoria-pi-taupe.vercel.app';
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #362b21;">
      <h2 style="color: #3c2c1f;">Bem-vinda à Mentoria SOMA, ${nome.split(' ')[0]}</h2>
      <p>Seu pagamento foi confirmado e o Portal do Mentorado já está liberado para você.</p>
      <p>É lá que você vai preencher o Mapa Quem Sou Eu, acompanhar seus encontros, registrar seu diário de bordo e muito mais.</p>
      <p style="margin: 24px 0;">
        <a href="${appUrl}/login" style="background: #6b4a35; color: #fbf8f2; padding: 12px 24px; border-radius: 999px; text-decoration: none; display: inline-block;">
          Acessar o portal
        </a>
      </p>
      <p>Qualquer dúvida, é só chamar.</p>
      <p style="margin-top: 24px;">Com carinho,<br>Jaque</p>
    </div>
  `;
}
