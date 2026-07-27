import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

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

    // TODO: Enviar email com link contendo o token
    // Por enquanto, retornar o token para desenvolvimento

    return NextResponse.json({
      message: 'Link enviado com sucesso',
      // IMPORTANTE: Remover isso em produção - apenas para desenvolvimento
      token,
      link: `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify?token=${token}`,
    });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: 'Erro ao processar autenticação' },
      { status: 500 }
    );
  }
}
