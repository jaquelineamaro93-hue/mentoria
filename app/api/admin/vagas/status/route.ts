import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
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

    const admin = createAdminClient();

    // Buscar todas as vagas
    const { data: vagas, error: vagasError } = await admin
      .from('plano_vagas')
      .select('*')
      .order('plano_tipo');

    if (vagasError) {
      return NextResponse.json({ error: 'Erro ao buscar vagas' }, { status: 500 });
    }

    // Buscar inscrições ativas por plano
    const { data: inscricoes, error: inscricoeError } = await admin
      .from('inscricoes_vagas')
      .select('plano_tipo, status')
      .eq('status', 'ativa');

    if (inscricoeError) {
      return NextResponse.json({ error: 'Erro ao buscar inscrições' }, { status: 500 });
    }

    // Contar inscrições por plano
    const contagemPorPlano: Record<string, number> = {};
    inscricoes?.forEach((insc) => {
      contagemPorPlano[insc.plano_tipo] = (contagemPorPlano[insc.plano_tipo] || 0) + 1;
    });

    // Retornar com informações calculadas
    const vagasComStatus = vagas?.map((vaga) => ({
      ...vaga,
      vagas_ocupadas: contagemPorPlano[vaga.plano_tipo] || 0,
      vagas_disponiveis: (vaga.total_vagas - (contagemPorPlano[vaga.plano_tipo] || 0)),
      percentual_ocupado: Math.round(
        ((contagemPorPlano[vaga.plano_tipo] || 0) / vaga.total_vagas) * 100
      ),
    })) || [];

    return NextResponse.json({
      vagas: vagasComStatus,
      total_planos: vagasComStatus.length,
    });
  } catch (error) {
    console.error('🔴 [VAGAS-STATUS] Erro:', error);
    return NextResponse.json({ error: 'Erro ao processar' }, { status: 500 });
  }
}
