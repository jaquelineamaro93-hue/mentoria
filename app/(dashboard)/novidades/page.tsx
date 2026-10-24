import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getHelpAccess, listHelpReleases } from '@/lib/help-center/server';
import ReleaseList from '@/components/help/ReleaseList';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Novidades | SOMA', robots: { index: false, follow: false } };
export default async function NewsPage() {
  const context = await getHelpAccess();
  if (!context) redirect('/login?next=/novidades');
  const releases = await listHelpReleases(context);
  return <div className="mx-auto max-w-4xl text-black"><p className="text-xs uppercase tracking-widest text-[#53685e]">Conheça e experimente</p><h1 className="mt-2 font-display text-3xl text-[#183f37]">Novidades da SOMA</h1><p className="mb-4 mt-3 text-sm text-[#53685e]">O que chegou, o que melhorou e como usar na sua jornada.</p><Link href="/ajuda" className="mb-7 inline-block text-sm font-semibold text-[#24594b] underline">Todos os tutoriais</Link><ReleaseList items={releases} /></div>;
}
