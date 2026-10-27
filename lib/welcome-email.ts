/**
 * Boas-vindas transacionais da SOMA Mentoria.
 * O texto não contém resultados prometidos nem ofertas condicionais.
 * CSS inline e tabelas garantem legibilidade em clientes de e-mail.
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
  const steps = [
    {
      number: '1',
      title: 'Conte um pouco sobre você',
      description: 'Comece pela entrevista inicial. Sua história e o que você busca ajudam a dar direção à jornada',
    },
    {
      number: '2',
      title: 'Conheça sua jornada',
      description: 'Veja os caminhos e atividades pensados para o seu momento profissional, no seu ritmo',
    },
    {
      number: '3',
      title: 'Explore o portal e a Íris',
      description: 'Organize seus próximos passos, conheça as ferramentas e converse com a Íris, sua copiloto de carreira',
    },
  ];

  const rows = steps.map(item => `
    <tr>
      <td style="padding:10px 0;vertical-align:top;width:42px">
        <span style="display:inline-block;background:#D9EEE4;color:#164332;border-radius:50%;height:30px;width:30px;text-align:center;line-height:30px;font-size:14px;font-weight:700">${item.number}</span>
      </td>
      <td style="padding:8px 0 12px;vertical-align:top">
        <strong style="font-size:15px;color:#183128">${item.title}</strong>
        <p style="margin:4px 0 0;color:#566b61;font-size:14px;line-height:1.6">${item.description}</p>
      </td>
    </tr>`).join('');

  return {
    subject: 'Sua jornada na SOMA começa aqui',
    html: `<!doctype html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Boas-vindas à SOMA</title></head>
<body style="margin:0;padding:0;background-color:#f4f7f5;color:#183128;font-family:Arial,Helvetica,sans-serif">
  <div style="display:none;font-size:1px;color:#f4f7f5;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden">Conheça os primeiros passos da sua jornada na SOMA</div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f4f7f5">
    <tr><td align="center" style="padding:28px 16px">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:580px;background-color:#ffffff;border-radius:16px;overflow:hidden">
        <tr><td style="background-color:#183128;padding:25px 32px">
          <span style="font-size:24px;font-weight:700;letter-spacing:1px;color:#ffffff">SOMA</span>
          <span style="font-size:14px;letter-spacing:2px;color:#a6ddcb;margin-left:8px">MENTORIA</span>
        </td></tr>
        <tr><td style="padding:34px 32px 20px">
          <h1 style="margin:0 0 18px;font-size:25px;line-height:1.25;font-weight:700;color:#183128">${greeting}</h1>
          <p style="font-size:15px;line-height:1.75;color:#344f41;margin:0 0 16px">Que bom ter você na SOMA</p>
          <p style="font-size:15px;line-height:1.75;color:#344f41;margin:0 0 20px">Criei este espaço para quem quer entender seu momento profissional, organizar ideias e transformar planos em ações possíveis, com método e acompanhamento humano</p>
          <p style="font-size:15px;line-height:1.6;font-weight:700;margin:0 0 12px;color:#183128">Três passos para começar</p>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${rows}</table>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:22px">
            <tr><td style="background:#0D8071;border-radius:9px;text-align:center">
              <a href="https://somamentoria.com/onboarding?utm_source=sendgrid&amp;utm_medium=email&amp;utm_campaign=soma_boas_vindas" style="display:inline-block;padding:15px 25px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none">Começar minha jornada na SOMA</a>
            </td></tr>
          </table>
          <div style="border-top:1px solid #e3ece6;margin:30px 0 22px"></div>
          <p style="font-size:15px;line-height:1.75;color:#344f41;margin:0 0 12px"><strong>Quero te perguntar uma coisa</strong></p>
          <p style="font-size:15px;line-height:1.75;color:#344f41;margin:0 0 14px">O que fez você procurar a SOMA neste momento</p>
          <p style="font-size:15px;line-height:1.75;color:#344f41;margin:0">Pode responder diretamente a este e-mail. Vou gostar de conhecer sua história e entender o que você espera encontrar por aqui</p>
          <p style="font-size:14px;line-height:1.6;color:#52675a;margin:26px 0 6px">Nos vemos por lá</p>
          <p style="font-family:'Segoe Script','Brush Script MT','Lucida Handwriting',cursive;font-style:italic;font-size:30px;line-height:1.45;color:#1e6652;margin:4px 0">Jaqueline Amaro</p>
          <p style="font-size:13px;line-height:1.4;color:#52675a;margin:0">Fundadora da SOMA Mentoria</p>
        </td></tr>
        <tr><td style="background-color:#f7faf8;border-top:1px solid #e4ece7;padding:20px 32px">
          <p style="font-size:12px;line-height:1.6;color:#63766a;margin:0 0 8px">Você recebeu este e-mail porque criou uma conta na SOMA Mentoria</p>
          <a href="https://somamentoria.com" style="font-size:12px;color:#235f51;text-decoration:underline">Acessar a SOMA</a>
          <span style="color:#9aafa3;padding:0 8px">·</span>
          <a href="https://somamentoria.com/termos" style="font-size:12px;color:#235f51;text-decoration:underline">Termos e privacidade</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  };
}
