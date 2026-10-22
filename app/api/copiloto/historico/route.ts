import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

async function session() {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  return { db, user };
}

export async function GET() {
  const { db, user } = await session();
  if (!user) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 });
  const { data, error } = await db.from('soma_copilot_messages')
    .select('id,role,content,href,response_ref,created_at')
    .eq('user_id', user.id).order('created_at', { ascending: false })
    .limit(100);
  if (error) return NextResponse.json({ erro: 'Histórico indisponível.' }, { status: 503 });
  return NextResponse.json({ mensagens: (data ?? []).reverse().map(item => ({
    id: item.id, tipo: item.role, texto: item.content,
    href: item.href ?? undefined, respostaRef: item.response_ref ?? undefined,
  })) }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ erro: 'Origem não permitida.' }, { status: 403 });
  }
  const { db, user } = await session();
  if (!user) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 });
  let body: Record<string, unknown>;
  try { body = await request.json(); }
  catch { return NextResponse.json({ erro: 'JSON inválido.' }, { status: 400 }); }
  const id = typeof body.id === 'string' && /^[a-f0-9-]{36}$/i.test(body.id) ? body.id : '';
  const role = body.tipo === 'iris' || body.tipo === 'mentorado' ? body.tipo : '';
  const content = typeof body.texto === 'string' ? body.texto.trim() : '';
  if (!id || !role || !content || content.length > 4000) {
    return NextResponse.json({ erro: 'Mensagem inválida.' }, { status: 400 });
  }
  const href = typeof body.href === 'string' && /^\/[a-zA-Z0-9/?=&_-]{1,250}$/.test(body.href) ? body.href : null;
  const responseRef = role === 'iris' && typeof body.respostaRef === 'string' &&
    /^[a-f0-9-]{36}$/i.test(body.respostaRef) ? body.respostaRef : null;
  const { error } = await db.from('soma_copilot_messages').upsert({
    id, user_id: user.id, role, content, href, response_ref: responseRef,
  }, { onConflict: 'id', ignoreDuplicates: true });
  if (error) return NextResponse.json({ erro: 'Não foi possível salvar a mensagem.' }, { status: 503 });
  return NextResponse.json({ sucesso: true });
}
