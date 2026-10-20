import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

export async function sendEmail({
  to,
  para,
  subject,
  assunto,
  html,
  from = process.env.SENDGRID_FROM_EMAIL || 'consultoria@camarocrm.com',
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

export const enviarEmail = sendEmail;

export const templateBoasVindas = (nome: string) => `
  <h2>Bem-vindo ao SOMA Mentoria! 🎉</h2>
  <p>Olá ${nome},</p>
  <p>Seu pagamento foi aprovado e sua conta foi criada com sucesso!</p>
  <p><a href="https://somamentoria.com/dashboard">Acessar Dashboard</a></p>
`;

export const templateInatividade = (nome: string) => {
  const primeiro=nome.trim().split(/\s+/)[0].replace(/[&<>"']/g,(ch)=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;',
  }[ch]||ch));
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;color:#263c30">
      <h2>Sua carreira continua no seu ritmo</h2>
      <p>Oi, ${primeiro}.</p>
      <p>Faz alguns dias que você não acessa a SOMA. Sua trajetória profissional não precisa acontecer com pressa.
      Que tal dedicar alguns minutos a uma ação simples, como praticar inglês, atualizar seu currículo ou fazer networking?</p>
      <p><a href="https://somamentoria.com/passaporte">Retomar minha ofensiva de carreira</a></p>
      <p>Se estiver em um período mais corrido, também pode solicitar uma pausa programada da mentoria
      de até 60 dias, conforme as condições do seu plano e dos termos atualizados.</p>
      <p><a href="https://somamentoria.com/meu-plano">Conhecer a pausa programada</a></p>
      <p style="color:#6c7770;font-size:12px">Durante uma pausa confirmada, suspenderemos os lembretes de engajamento.</p>
    </div>
  `;
};

export const templateLembreteEncontro = (nome: string, titulo: string, data: string) => `
  <h2>Lembrete: ${titulo}</h2>
  <p>Olá ${nome},</p>
  <p>Você tem um encontro marcado em ${data}!</p>
  <p><a href="https://somamentoria.com/dashboard">Ver Detalhes</a></p>
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
