import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { executarLembretes } from '@/lib/lembretes';

// POST /api/admin/enviar-lembretes
// Dispara manualmente a mesma rotina do cron diário (inatividade, onboarding,
// encontros próximos, votação pendente). Só admin pode chamar.
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 });
  }

  const { data: perfil } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!perfil?.is_admin) {
    return NextResponse.json({ erro: 'Não autorizado.' }, { status: 403 });
  }

  const resultado = await executarLembretes();
  return NextResponse.json(resultado);
}
