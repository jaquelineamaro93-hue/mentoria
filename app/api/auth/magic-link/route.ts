import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

// SendGrid é opcional - tenta importar se disponível
let sgMail: any = null;
try {
  sgMail = require('@sendgrid/mail').default;
  if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  }
} catch (e) {
  // SendGrid não instalado - continua em modo dev
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      );
    }

    // Verificar se usuário existe (ele deve ser cadastrado manualmente)
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

    // Gerar token JWT com expiração de 24h
    const token = jwt.sign(
      { userId: user[0].id, email: user[0].email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    );

    const verifyLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify?token=${token}`;

    // Enviar email via SendGrid (se configurado)
    if (sgMail && process.env.SENDGRID_API_KEY) {
      try {
        await sgMail.send({
          to: email,
          from: {
            email: process.env.SENDGRID_FROM_EMAIL || 'consultoria@camarocrm.com',
            name: process.env.SENDGRID_FROM_NAME || 'Mentoria Câmaro',
          },
          subject: '🎯 Seu Link de Acesso - Mentoria de Carreira',
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="margin: 0; font-size: 28px; font-weight: bold;">🎯 Bem-vindo à Mentoria!</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Sua jornada de desenvolvimento profissional começou</p>
              </div>
              <div style="background: #f9fafb; padding: 40px 20px; border-radius: 0 0 10px 10px;">
                <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                  Oi <strong>${user[0].name}</strong>! 👋
                </p>
                <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                  Clique no botão abaixo para acessar seu portal de mentoria de carreira:
                </p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${verifyLink}" style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                    🚀 Acessar Portal
                  </a>
                </div>
                <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0; text-align: center;">
                  Ou copie este link: <br>
                  <code style="background: #e5e7eb; padding: 8px 12px; border-radius: 4px; font-size: 12px; word-break: break-all;">${verifyLink}</code>
                </p>
                <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px; margin: 30px 0;">
                  <p style="color: #92400e; font-size: 14px; margin: 0;">
                    <strong>⏰ Atenção:</strong> Este link expira em <strong>24 horas</strong>.
                  </p>
                </div>
                <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
                  <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                    Desenvolvido com ❤️ por Câmaro CRM<br>
                    <a href="mailto:consultoria@camarocrm.com" style="color: #3b82f6; text-decoration: none;">consultoria@camarocrm.com</a>
                  </p>
                </div>
              </div>
            </div>
          `,
        });
      } catch (emailError) {
        console.error('SendGrid error:', emailError);
      }
    }

    return NextResponse.json({
      message: 'Link enviado com sucesso',
      success: true,
      ...(process.env.NODE_ENV === 'development' && {
        devLink: verifyLink,
      }),
    });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: 'Erro ao processar autenticação' },
      { status: 500 }
    );
  }
}
