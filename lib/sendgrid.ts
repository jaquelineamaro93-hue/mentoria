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

// Alias para compatibilidade com código existente
export const enviarEmail = sendEmail;

// Templates de email
export const templateBoasVindas = (nome: string) => `
  <h2>Bem-vindo ao SOMA Mentoria! 🎉</h2>
  <p>Olá ${nome},</p>
  <p>Seu pagamento foi aprovado e sua conta foi criada com sucesso!</p>
  <p><a href="https://somamentoria.com/dashboard">Acessar Dashboard</a></p>
`;

export const templateInatividade = (nome: string) => `
  <h2>Voltando ao SOMA? 👋</h2>
  <p>Olá ${nome},</p>
  <p>Não te vemos há alguns dias. Que tal voltar e continuar sua jornada?</p>
  <p><a href="https://somamentoria.com/dashboard">Acessar Dashboard</a></p>
`;

export const templateLembreteEncontro = (nome: string, encontro: string) => `
  <h2>Lembrete: ${encontro}</h2>
  <p>Olá ${nome},</p>
  <p>Você tem um encontro marcado!</p>
`;

export const templateOnboardingPendente = (nome: string) => `
  <h2>Complete seu Onboarding 📋</h2>
  <p>Olá ${nome},</p>
  <p>Faltam alguns passos para você começar!</p>
  <p><a href="https://somamentoria.com/onboarding">Completar Onboarding</a></p>
`;

export const templateVotacaoPendente = (nome: string) => `
  <h2>Sua Votação Está Pendente 🗳️</h2>
  <p>Olá ${nome},</p>
  <p>Não esqueça de votar!</p>
  <p><a href="https://somamentoria.com/votar">Votar Agora</a></p>
`;
