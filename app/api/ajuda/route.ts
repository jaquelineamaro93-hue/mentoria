import { NextRequest, NextResponse } from 'next/server';
import { getHelpAccess, listHelpArticles, listHelpReleases } from '@/lib/help-center/server';
import { searchHelpArticles } from '@/lib/help-center/access';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  try {
    const context = await getHelpAccess();
    if (!context) return NextResponse.json({ error: 'Faça login para acessar a ajuda.' }, { status: 401 });
    if (request.nextUrl.searchParams.get('view') === 'novidades') {
      return NextResponse.json({ releases: await listHelpReleases(context) }, { headers: { 'Cache-Control': 'private, no-store' } });
    }
    const articles = searchHelpArticles(await listHelpArticles(context), (request.nextUrl.searchParams.get('q') ?? '').slice(0, 180));
    // Only metadata is sent to the catalog. Bodies are protected separately.
    return NextResponse.json({ articles: articles.map(({ id, slug, title, summary, category }) => ({ id, slug, title, summary, category })) },
      { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ error: 'Não foi possível carregar a central.' }, { status: 503 });
  }
}
