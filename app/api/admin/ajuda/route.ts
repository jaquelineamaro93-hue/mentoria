import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/security/require-admin';
import { createAdminClient } from '@/lib/supabase/admin';
import { isHelpId, parseHelpArticle, parseHelpRelease } from '@/lib/help-center/validation';

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return NextResponse.json({ error: 'Origem não permitida.' }, { status: 403 });
  if (Number(request.headers.get('content-length') ?? 0) > 100000) return NextResponse.json({ error: 'Conteúdo muito grande.' }, { status: 413 });
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ error: 'Solicitação inválida.' }, { status: 400 });
  const db = createAdminClient();
  try {
    if (body.action === 'release') {
      const release = parseHelpRelease(body);
      const { data: article, error } = await db.from('soma_help_articles').select('id,status,published_at').eq('id', release.article_id).maybeSingle();
      if (error) throw new Error('Não foi possível validar o tutorial.');
      if (!article || article.status !== 'published' || !article.published_at || Date.parse(article.published_at) > Date.now()) {
        return NextResponse.json({ error: 'Publique o tutorial antes de anunciar a novidade.' }, { status: 400 });
      }
      const { error: writeError } = await db.from('soma_help_releases').insert({ ...release, created_by: auth.userId });
      if (writeError) throw new Error('Não foi possível publicar a novidade.');
      return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
    }
    if (body.action === 'archive-release') {
      if (!isHelpId(body.id)) return NextResponse.json({ error: 'Novidade inválida.' }, { status: 400 });
      const { error } = await db.from('soma_help_releases').update({ archived: true }).eq('id', body.id);
      if (error) throw new Error('Não foi possível arquivar a novidade.');
      return NextResponse.json({ ok: true });
    }
    if (body.action !== 'article') return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 });
    const article = parseHelpArticle(body);
    const now = new Date().toISOString();
    if (body.id) {
      if (!isHelpId(body.id) || typeof body.updated_at !== 'string') return NextResponse.json({ error: 'Tutorial inválido.' }, { status: 400 });
      const { data: current, error } = await db.from('soma_help_articles').select('published_at').eq('id', body.id).maybeSingle();
      if (error || !current) return NextResponse.json({ error: 'Tutorial não encontrado.' }, { status: 404 });
      const { data, error: writeError } = await db.from('soma_help_articles').update({ ...article,
        updated_at: now, updated_by: auth.userId,
        published_at: article.status === 'published' ? current.published_at ?? now : current.published_at,
      }).eq('id', body.id).eq('updated_at', body.updated_at).select('id').maybeSingle();
      if (writeError) throw new Error(writeError.code === '23505' ? 'Esse endereço já está em uso.' : 'Não foi possível salvar o tutorial.');
      if (!data) return NextResponse.json({ error: 'Este artigo mudou em outra sessão. Recarregue antes de editar.' }, { status: 409 });
    } else {
      const { error } = await db.from('soma_help_articles').insert({ ...article, updated_by: auth.userId,
        published_at: article.status === 'published' ? now : null });
      if (error) throw new Error(error.code === '23505' ? 'Esse endereço já está em uso.' : 'Não foi possível salvar o tutorial.');
    }
    return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Não foi possível salvar.' }, { status: 400 });
  }
}
