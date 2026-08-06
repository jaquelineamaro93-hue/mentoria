import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: user } = await supabase.auth.getUser();

    if (!user.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Verificar se é admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { plano_tipo, total_vagas, preco, descricao, ativo } = await request.json();

    if (!plano_tipo || total_vagas === undefined) {
      return NextResponse.json(
        { error: 'plano_tipo e total_vagas são obrigatórios' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Atualizar plano
    const { error: updateError } = await admin
      .from('plano_vagas')
      .update({
        total_vagas,
        ...(preco !== undefined && { preco }),
        ...(descricao !== undefined && { descricao }),
        ...(ativo !== undefined && { ativo }),
        updated_at: new Date().toISOString(),
      })
      .eq('plano_tipo', plano_tipo);

    if (updateError) {
      return NextResponse.json(
        { error: 'Erro ao atualizar plano' },
        { status: 500 }
      );
    }

    // Registrar auditoria - ignorar se falhar
    try {
      await admin
        .from('admin_logs')
        .insert({
          admin_id: user.user.id,
          acao: 'atualizar_vagas',
          plano_tipo,
          dados: { total_vagas, preco, descricao, ativo },
        });
    } catch {
      // Ignorar erros de log
    }

    return NextResponse.json({
      success: true,
      message: `Vagas do plano ${plano_tipo} atualizadas`,
    });
  } catch (error) {
    console.error('🔴 [VAGAS-UPDATE] Erro:', error);
    return NextResponse.json({ error: 'Erro ao processar' }, { status: 500 });
  }
}
