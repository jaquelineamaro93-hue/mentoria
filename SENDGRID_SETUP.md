# 📧 Guia Completo: Configurar SendGrid para Emails

## ⏱️ Tempo Total: ~10 minutos

---

## PASSO 1: Criar Conta SendGrid (2 min)

1. Acesse [sendgrid.com](https://sendgrid.com)
2. Clique **"Sign Up"** ou **"Get Started"**
3. Preencha:
   - Email: `seu@email.com`
   - Password: Algo forte
   - Company: `Câmaro CRM` (ou seu nome)
4. Verifique email de confirmação
5. Login na conta

---

## PASSO 2: Verificar Domínio (3-5 min)

### Por que? 
Para não cair em spam, SendGrid precisa verificar que você é dono de `camarocrm.com`.

### Como fazer:

1. No dashboard SendGrid, vá para **Settings** → **Sender Authentication**
2. Clique **"Authenticate Your Domain"**
3. Escolha:
   - **Domain**: `camarocrm.com` (ou seu domínio)
   - **Subdomain** (opcional): `mail` (fica `mail.camarocrm.com`)
   - **Default Subdomain Settings**: Deixa como está
4. Clique **"Next"**
5. SendGrid vai mostrar 3 registros DNS pra adicionar:
   ```
   CNAME: mail.camarocrm.com → mXXXXXXXX.sendgrid.net
   CNAME: emailXXXX._domainkey.camarocrm.com → sXXXXXXXX.sendgridXXXX.com
   CNAME: sXXXXXXXX._domainkey.camarocrm.com → sXXXXXXXX.sendgridXXXX.com
   ```

### Adicionar os registros:

1. Acesse seu registrador de domínio (GoDaddy, Namecheap, etc)
2. Vá para **DNS Management**
3. Adicione os 3 registros CNAME que SendGrid forneceu
4. Aguarde 10-30 minutos para propagar
5. Volta em SendGrid e clica **"Verify"**

**Se você não tem acesso ao DNS**, peça para alguém com acesso ao domínio fazer essa parte.

---

## PASSO 3: Criar API Key (2 min)

1. No dashboard SendGrid, vá para **Settings** → **API Keys**
2. Clique **"Create API Key"**
3. Preencha:
   - **API Key Name**: `Mentoria Portal`
   - **API Key Permissions**: Selecione **"Restricted Access"**
4. Marque permissões:
   - ✅ Mail Send
   - ✅ Mail Settings Read
5. Clique **"Create & Copy"**
6. **Copie a chave** (ela aparece só uma vez!)
   ```
   SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

---

## PASSO 4: Adicionar ao Projeto (.env.local)

1. Abra `.env.local` na raiz do projeto
2. Adicione:
```env
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=consultoria@camarocrm.com
SENDGRID_FROM_NAME=Mentoria Câmaro
```

**⚠️ Importante**: Não commit `.env.local`! (já está em `.gitignore`)

---

## PASSO 5: Instalar SendGrid SDK

```bash
npm install @sendgrid/mail
```

---

## PASSO 6: Integrar no Código

Já criei o código! Só precisa descomentar.

### Arquivo: `app/api/auth/magic-link/route.ts`

Substitua a função POST por:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import sgMail from '@sendgrid/mail';

// Inicializar SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      );
    }

    // Verificar se usuário existe
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (user.length === 0) {
      // Por segurança, não revelamos se email existe ou não
      return NextResponse.json(
        { message: 'Se o email estiver cadastrado, receberá um link de acesso.' },
        { status: 200 }
      );
    }

    // Gerar token JWT
    const token = jwt.sign(
      { userId: user[0].id, email: user[0].email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    );

    // Construir link
    const verifyLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify?token=${token}`;

    // Enviar email via SendGrid
    await sgMail.send({
      to: email,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || 'consultoria@camarocrm.com',
        name: process.env.SENDGRID_FROM_NAME || 'Mentoria Câmaro',
      },
      subject: '🎯 Seu Link de Acesso - Mentoria de Carreira',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px; font-weight: bold;">🎯 Bem-vindo à Mentoria!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Sua jornada de desenvolvimento profissional começou</p>
          </div>

          <!-- Body -->
          <div style="background: #f9fafb; padding: 40px 20px; border-radius: 0 0 10px 10px;">
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              Oi <strong>${user[0].name}</strong>! 👋
            </p>

            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              Clique no botão abaixo para acessar seu portal de mentoria de carreira:
            </p>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verifyLink}" 
                 style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                🚀 Acessar Portal
              </a>
            </div>

            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0; text-align: center;">
              Ou copie este link: <br>
              <code style="background: #e5e7eb; padding: 8px 12px; border-radius: 4px; font-size: 12px; word-break: break-all;">
                ${verifyLink}
              </code>
            </p>

            <!-- Info Box -->
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px; margin: 30px 0;">
              <p style="color: #92400e; font-size: 14px; margin: 0;">
                <strong>⏰ Atenção:</strong> Este link expira em <strong>24 horas</strong>. Se não conseguir acessar, solicite um novo link.
              </p>
            </div>

            <!-- What's Next -->
            <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; border-radius: 4px; margin: 30px 0;">
              <p style="color: #1e40af; font-size: 14px; margin: 0 0 10px 0; font-weight: bold;">O que esperar:</p>
              <ul style="color: #1e40af; font-size: 14px; margin: 0; padding-left: 20px;">
                <li>Acesso ao seu Dashboard de Mentoria</li>
                <li>Mapa de Quem Sou Eu (9 blocos para autoconhecimento)</li>
                <li>Rastreamento de evolução profissional</li>
                <li>Sistema de pontos e achievements</li>
              </ul>
            </div>

            <!-- Footer -->
            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                Desenvolvido com ❤️ por Câmaro CRM <br>
                <a href="mailto:consultoria@camarocrm.com" style="color: #3b82f6; text-decoration: none;">consultoria@camarocrm.com</a>
              </p>
            </div>

          </div>

        </div>
      `,
      text: `Acesse seu portal: ${verifyLink}\n\nEste link expira em 24 horas.`,
    });

    return NextResponse.json({
      message: 'Link enviado com sucesso para seu email',
      success: true,
    });

  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: 'Erro ao processar autenticação' },
      { status: 500 }
    );
  }
}
```

---

## PASSO 7: Testar o Email

1. Rode o servidor:
   ```bash
   npm run dev
   ```

2. Acesse `http://localhost:3000/auth`

3. Digite um email de um mentorado cadastrado

4. Verifique o inbox (pode cair em spam, adicione em contatos confiáveis)

5. Clique no link → deve fazer login automático!

---

## ✅ Checklist de Configuração

- [ ] Conta SendGrid criada
- [ ] Domínio verificado (registros DNS adicionados)
- [ ] API Key gerada
- [ ] Variáveis adicionadas ao `.env.local`
- [ ] `@sendgrid/mail` instalado (`npm install`)
- [ ] Código atualizado com função de envio
- [ ] Testado localmente
- [ ] Email chegando corretamente

---

## 🔧 Troubleshooting

### "Erro: Invalid API Key"
- Verifique se a chave está correta em `.env.local`
- Não há espaços extras antes/depois

### "Email não chega ou vai para spam"
- Verifique se domínio foi verificado no SendGrid
- Adicione `consultoria@camarocrm.com` aos contatos confiáveis
- Verifique pasta "Spam/Lixo" do email

### "401 Unauthorized"
- API Key expirou ou é inválida
- Gere uma nova key no SendGrid

### "Domain not verified"
- Registros DNS ainda estão propagando (pode levar até 1 hora)
- Verifique se os registros CNAME foram adicionados corretamente
- Use `dig` para verificar: `dig mail.camarocrm.com`

---

## 📊 Monitorar Envios

Após configurar, no SendGrid você pode:

1. Ir para **Mail Send** → **Statistics**
2. Ver:
   - ✅ Emails enviados
   - ✅ Taxa de entrega
   - ✅ Taxa de abertura
   - ❌ Bounces (emails inválidos)
   - ❌ Spam reports

---

## 📝 Templates Futuros

Depois você pode criar templates para:
- Notificação de nova sessão
- Lembrete pré-sessão
- Parabéns por achievement desbloqueado
- Relatório semanal de progresso
- Convite para renovar pacote

---

**Desenvolvido por**: Claude
**Email de suporte**: consultoria@camarocrm.com
**Status**: Pronto para implementação
