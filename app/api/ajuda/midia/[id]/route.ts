import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getHelpAccess, getHelpArticle } from '@/lib/help-center/server';
import { isHelpId } from '@/lib/help-center/validation';
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const context = await getHelpAccess();
    if (!context) return NextResponse.json({ error: 'Faça login.' }, { status: 401 });
    const { id } = await params;
    if (!isHelpId(id)) return new Response(null, { status: 404 });
    const db = createAdminClient();
    const { data: media, error } = await db.from('soma_help_media').select('article_id,path,mime').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!media || !await getHelpArticle(context, 'id', media.article_id)) return new Response(null, { status: 404 });
    const { data, error: storageError } = await db.storage.from('soma-help-private').download(media.path);
    if (storageError || !data) throw storageError;
    return new Response(data, { headers: { 'Content-Type': media.mime, 'Cache-Control': 'private, no-store',
      'Content-Disposition': 'inline', 'X-Content-Type-Options': 'nosniff', 'X-Robots-Tag': 'noindex, noarchive' } });
  } catch { return NextResponse.json({ error: 'Imagem indisponível.' }, { status: 503 }); }
}
