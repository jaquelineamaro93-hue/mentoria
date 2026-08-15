import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Profile } from '@/lib/types';
import PermissoesClient from './PermissoesClient';

export const metadata = {
  title: 'Controle de Permissões - Admin',
};

export default async function PermissoesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: meuPerfil } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>();

  if (!meuPerfil?.is_admin) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-paper to-cream p-6">
      <div className="max-w-7xl mx-auto">
        <PermissoesClient />
      </div>
    </div>
  );
}
