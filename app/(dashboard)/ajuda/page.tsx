import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getHelpAccess, listHelpArticles } from '@/lib/help-center/server';
import HelpCatalog from '@/components/help/HelpCatalog';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Central de Ajuda | SOMA', robots: { index: false, follow: false } };
export default async function HelpPage({ searchParams }: { searchParams: Promise<{ categoria?: string }> }) {
  const context = await getHelpAccess();
  if (!context) redirect('/login?next=/ajuda');
  const articles = await listHelpArticles(context);
  const requestedCategory = (await searchParams).categoria;
  const category = articles.some(article => article.category === requestedCategory) ? requestedCategory : undefined;
  return <div className="mx-auto max-w-7xl text-black">
    <p className="text-xs uppercase tracking-widest text-[#53685e]">Aprenda no seu ritmo</p>
    <h1 className="mt-2 font-display text-3xl text-[#183f37]">Como podemos ajudar?</h1>
    <p className="mb-5 mt-3 max-w-2xl text-sm leading-6 text-[#53685e]">Encontre o passo a passo das ferramentas disponíveis para você e conecte cada recurso ao seu momento de carreira.</p>
    <div className="mb-7 flex flex-wrap gap-4 text-sm font-semibold text-[#24594b]"><Link href="/novidades">Novidades da SOMA</Link>{context.admin && <Link href="/admin/ajuda">Gerenciar conteúdos e novidades</Link>}</div>
    <HelpCatalog initialCategory={category} articles={articles.map(({ id, slug, title, summary, category }) => ({ id, slug, title, summary, category }))} />
  </div>;
}
