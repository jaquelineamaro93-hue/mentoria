import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getPostHogClient } from '@/lib/posthog-server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token não fornecido' },
        { status: 400 }
      );
    }

    // Verificar e decodificar token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'secret'
    ) as { userId: number; email: string };

    // Criar resposta com cookie seguro
    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/`
    );

    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 86400 * 7, // 7 dias
      path: '/',
    });

    response.cookies.set({
      name: 'auth_user_id',
      value: String(decoded.userId),
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 86400 * 7, // 7 dias
      path: '/',
    });

    const posthog = getPostHogClient();
    if (posthog) {
      posthog.capture({
        distinctId: String(decoded.userId),
        event: 'magic_link_verified',
      });
      await posthog.flush();
    }

    return response;
  } catch (error) {
    console.error('Verify error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth`);
  }
}
