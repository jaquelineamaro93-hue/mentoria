import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function UsuariosPermissoesPage() {
  // Redirect para admin (lista está integrada na tabela "Ações da conta")
  redirect('/admin');
}
