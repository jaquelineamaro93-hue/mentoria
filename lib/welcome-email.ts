/**
 * Boas-vindas transacionais da SOMA Mentoria.
 * O texto não contém resultados prometidos nem ofertas condicionais.
 * HTML simples com CSS inline para leitura em clientes de e-mail.
 */
const first = (name: string) => {
  const part = (name || '').trim().split(/\s+/)[0]?.slice(0, 60) || '';
  return part.replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[ch] || ch);
};

export function buildWelcomeEmail(name: string) {
  const recipient = first(name);
  const greeting = recipient ? `Olá, ${recipient}` : 'Olá';
  return {
    subject: 'Seu primeiro passo na SOMA',
    html: `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#fff;color:#101827;font:16px/1.7 Arial,Helvetica,sans-serif">
<div style="max-width:560px;margin:auto;padding:28px 20px">
<p>${greeting}.</p>
<p>Sua conta na SOMA foi criada.</p>
<p>Para começar, entre no portal e confira o acesso escolhido. Na mentoria, a entrevista inicial ajuda a organizar seu momento de carreira. Na Plataforma, você encontra as ferramentas do seu plano.</p>
<p><a style="color:#101827;text-decoration:underline" href="https://somamentoria.com/login?utm_source=sendgrid&amp;utm_medium=email&amp;utm_campaign=boas_vindas&amp;utm_content=primeiro_acesso">Acessar minha conta</a></p>
<p>Se algo impedir seu acesso, responda a este e-mail contando o que aconteceu.</p>
<p>Um abraço,<br>Jaqueline Amaro<br>SOMA Mentoria</p>
<p style="font-size:12px;color:#64748b">Você recebeu esta mensagem porque criou uma conta na SOMA. <a href="https://somamentoria.com/termos">Termos e privacidade</a>.</p>
</div></body></html>`,
  };
}
