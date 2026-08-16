import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

export async function sendEmail({
  to,
  para,
  subject,
  assunto,
  html,
  from = 'noreply@somamentoria.com',
}: {
  to?: string;
  para?: string;
  subject?: string;
  assunto?: string;
  html: string;
  from?: string;
}) {
  const email = to || para;
  const subj = subject || assunto;

  if (!email || !subj) {
    console.error('❌ Email ou assunto faltando');
    return false;
  }

  try {
    await sgMail.send({
      to: email,
      from,
      subject: subj,
      html,
    });
    console.log('✅ Email enviado para:', email);
    return true;
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error);
    return false;
  }
}

// Alias para compatibilidade
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
