import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import PermissoesClient from './PermissoesClient';
import Sidebar from '@/components/Sidebar';

export default async function PermissoesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('nome, tipo_pacote, is_admin, foto_url')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) redirect('/dashboard');

  async function handleSignOut() {
    'use server';
    const sb = await createClient();
    await sb.auth.signOut();
    redirect('/login');
  }

  return (
    <div className="flex h-screen bg-cream">
      <Sidebar profile={profile} onSignOut={handleSignOut} />
      <main className="flex-1 overflow-auto px-6 py-8 md:px-12 md:py-12 max-w-5xl mx-auto w-full">
        <div className="mb-6">
          <a href="/admin" className="inline-flex items-center gap-2 text-sm text-ink-faint hover:text-brown-deep transition-colors">
            &larr; Voltar ao painel
          </a>
        </div>
        <PermissoesClient />
      </main>
    </div>
  );
}
