import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/security/require-admin';
import { createAdminClient } from '@/lib/supabase/admin';
import { isHelpId } from '@/lib/help-center/validation';
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return NextResponse.json({ error: 'Origem não permitida.' }, { status: 403 });
  if (Number(request.headers.get('content-length') ?? 0) > 4.2 * 1024 * 1024) return NextResponse.json({ error: 'Use uma imagem de até 4 MB.' }, { status: 413 });
  try {
    const form = await request.formData();
    const file = form.get('file'), articleId = form.get('article_id');
    if (!(file instanceof File) || !isHelpId(articleId) || file.size === 0 || file.size > 4 * 1024 * 1024) return NextResponse.json({ error: 'Escolha uma imagem de até 4 MB e um tutorial salvo.' }, { status: 400 });
    const bytes = Buffer.from(await file.arrayBuffer());
    // Detect formats by signature rather than trusting client-supplied MIME.
    const format = bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ? ['png', 'image/png']
      : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 ? ['jpg', 'image/jpeg']
      : bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP' ? ['webp', 'image/webp'] : null;
    if (!format) return NextResponse.json({ error: 'Use PNG, JPEG ou WebP.' }, { status: 400 });
    const db = createAdminClient();
    const { data: article, error: articleError } = await db.from('soma_help_articles').select('id').eq('id', articleId).maybeSingle();
    if (articleError || !article) return NextResponse.json({ error: 'Tutorial não encontrado.' }, { status: 404 });
    const id = randomUUID(), path = `${articleId}/${id}.${format[0]}`;
    const { error: uploadError } = await db.storage.from('soma-help-private').upload(path, bytes, { contentType: format[1], upsert: false });
    if (uploadError) throw uploadError;
    const { error } = await db.from('soma_help_media').insert({ id, article_id: articleId, path, mime: format[1] });
    if (error) { await db.storage.from('soma-help-private').remove([path]); throw error; }
    return NextResponse.json({ url: '/api/ajuda/midia/' + id }, { headers: { 'Cache-Control': 'no-store' } });
  } catch { return NextResponse.json({ error: 'Não foi possível enviar a imagem.' }, { status: 503 }); }
}
