'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Circle, Loader2, TrendingUp } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Panel } from '@/components/Panel';
import { ReflexaoMensal } from '@/components/pdi/ReflexaoMensal';

interface Reflexao {
  id: string;
  plano_id: string;
  mes_referencia: string;
  energia: 'alta' | 'media' | 'baixa' | null;
  o_que_avancou: string | null;
  o_que_travou: string | null;
  ajuste_para_o_proximo_mes: string | null;
  criado_em: string;
}

interface Acao {
  id: string;
  concluida: boolean;
}

const NOMES_MES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

function mesAtualPrimeiroDia() {
  const agora = new Date();
  return `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-01`;
}

function nomeMes(valor: string) {
  const data = new Date(`${valor}T12:00:00`);
  return `${NOMES_MES[data.getMonth()]} de ${data.getFullYear()}`;
}

export default function PdiAcompanhamento({ userId }: { userId: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [planoId, setPlanoId] = useState<string | null>(null);
  const [reflexoes, setReflexoes] = useState<Reflexao[]>([]);
  const [acoes, setAcoes] = useState<Acao[]>([]);
  const [carregando, setCarregando] = useState(true);

  async function carregar() {
    setCarregando(true);

    const { data: plano } = await supabase
      .from('pdi_planos')
      .select('id')
      .eq('mentorado_id', userId)
      .eq('status', 'ativo')
      .order('gerado_em', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!plano?.id) {
      setPlanoId(null);
      setReflexoes([]);
      setAcoes([]);
      setCarregando(false);
      return;
    }

    setPlanoId(plano.id);

    const [{ data: reflexoesData }, { data: acoesData }] = await Promise.all([
      supabase
        .from('pdi_reflexoes_mensais')
        .select('*')
        .eq('plano_id', plano.id)
        .eq('mentorado_id', userId)
        .order('mes_referencia', { ascending: false }),
      supabase
        .from('pdi_acoes')
        .select('id, concluida')
        .eq('plano_id', plano.id)
        .eq('mentorado_id', userId),
    ]);

    setReflexoes((reflexoesData ?? []) as Reflexao[]);
    setAcoes((acoesData ?? []) as Acao[]);
    setCarregando(false);
  }

  useEffect(() => {
    void carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  if (carregando) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-text py-8">
        <Loader2 size={16} className="animate-spin" />
        Carregando acompanhamento...
      </div>
    );
  }

  if (!planoId) {
    return (
      <Panel className="p-6">
        <h2 className="font-display text-2xl text-black mb-2">Acompanhamento do plano</h2>
        <p className="text-sm text-gray-text">
          Gere seu plano primeiro. Depois esta área mostra o progresso das ações e abre uma reflexão mensal curta para ajustar o próximo ciclo.
        </p>
      </Panel>
    );
  }

  const totalAcoes = acoes.length;
  const concluidas = acoes.filter((acao) => acao.concluida).length;
  const percentual = totalAcoes ? Math.round((concluidas / totalAcoes) * 100) : 0;
  const referencia = mesAtualPrimeiroDia();
  const atual = reflexoes.find((item) => item.mes_referencia === referencia) ?? null;
  const historico = reflexoes.filter((item) => item.mes_referencia !== referencia);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.14em] text-mint-deep mb-1">Acompanhamento do PDI</p>
        <h2 className="font-display text-2xl text-black">Do plano para a prática</h2>
        <p className="text-sm text-gray-text mt-1 max-w-3xl">
          Esta área acompanha o avanço do seu plano. Ela é diferente do Diário de Bordo, que serve para reflexões livres,
          e de Avaliar a mentoria, que fala sobre sua experiência com a SOMA.
        </p>
      </div>

      <Panel className="p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-mint-light grid place-items-center">
              <TrendingUp size={18} className="text-mint-deep" />
            </div>
            <div>
              <p className="text-sm font-semibold text-black">Progresso das ações</p>
              <p className="text-xs text-gray-text">{concluidas} de {totalAcoes} ações concluídas</p>
            </div>
          </div>
          <span className="font-display text-2xl text-black">{percentual}%</span>
        </div>

        <div className="mt-4 h-2 rounded-full bg-line overflow-hidden">
          <div
            className="h-full bg-mint-deep transition-all duration-300"
            style={{ width: `${percentual}%` }}
          />
        </div>
      </Panel>

      <ReflexaoMensal
        planoId={planoId}
        mesReferencia={referencia}
        reflexaoExistente={atual}
        onSaved={carregar}
      />

      <div>
        <div className="flex items-center justify-between gap-3 mb-3">
          <h3 className="text-sm font-semibold text-black">Histórico de acompanhamento</h3>
          <span className="text-xs text-gray-text">{historico.length} registro{historico.length === 1 ? '' : 's'}</span>
        </div>

        {historico.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-faint bg-white px-6 py-8 text-center text-sm text-gray-text">
            Seus próximos check-ins mensais aparecerão aqui.
          </div>
        ) : (
          <div className="space-y-3">
            {historico.map((item) => (
              <article key={item.id} className="rounded-xl border border-gray-faint bg-white p-5">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <p className="text-sm font-semibold text-black capitalize">{nomeMes(item.mes_referencia)}</p>
                    <p className="text-xs text-gray-text">Energia: {item.energia === 'media' ? 'média' : item.energia || 'não informada'}</p>
                  </div>
                  <CheckCircle2 size={17} className="text-mint-deep" />
                </div>

                <div className="grid md:grid-cols-3 gap-3 text-sm">
                  <div className="rounded-lg bg-[#f8f9fa] p-3">
                    <p className="text-[10px] uppercase tracking-wide text-gray-text mb-1">Avançou</p>
                    <p className="text-black">{item.o_que_avancou || 'Não informado'}</p>
                  </div>
                  <div className="rounded-lg bg-[#f8f9fa] p-3">
                    <p className="text-[10px] uppercase tracking-wide text-gray-text mb-1">Travou</p>
                    <p className="text-black">{item.o_que_travou || 'Não informado'}</p>
                  </div>
                  <div className="rounded-lg bg-[#f8f9fa] p-3">
                    <p className="text-[10px] uppercase tracking-wide text-gray-text mb-1">Próximo ajuste</p>
                    <p className="text-black">{item.ajuste_para_o_proximo_mes || 'Não informado'}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
