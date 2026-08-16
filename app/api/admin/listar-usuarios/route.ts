import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    console.log('Iniciando requisição...');
    const supabase = createAdminClient();
    console.log('Admin client criado');

    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, nome, email, is_admin')
      .limit(100);

    console.log('Resposta do Supabase:', { data: profiles, error });

    if (error) {
      console.error('Erro na query:', error);
      return NextResponse.json({ error: JSON.stringify(error) }, { status: 500 });
    }

    return NextResponse.json({ profiles, total: profiles?.length || 0 });
  } catch (error) {
    console.error('Erro catch:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
