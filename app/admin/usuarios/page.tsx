import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Profile } from '@/lib/types';
import UsuariosClient from './UsuariosClient';

export const metadata = {
  title: 'Gerenciar Usuários - Admin',
};

export default async function UsuariosPage() {
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
      <div className="max-w-6xl mx-auto">
        <UsuariosClient />
      </div>
    </div>
  );
}
