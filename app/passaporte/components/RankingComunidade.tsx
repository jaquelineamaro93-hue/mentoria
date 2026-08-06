'use client';

import { useEffect, useState } from 'react';
import { Zap, Loader } from 'lucide-react';
import { Panel, Eyebrow } from '@/components/Panel';

interface RankingItem {
  posicao: number;
  userId: string;
  nome: string;
  foto_url: string | null;
  pontos: number;
}

interface RankingData {
  ranking: RankingItem[];
  usuarioLogado: {
    userId: string;
    posicao: number | null;
  };
}

export default function RankingComunidade() {
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [usuarioLogado, setUsuarioLogado] = useState<{
    userId: string;
    posicao: number | null;
  } | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregarRanking() {
      try {
        const res = await fetch('/api/passaporte/ranking');
        const data: RankingData = await res.json();
        setRanking(data.ranking);
        setUsuarioLogado(data.usuarioLogado);
      } catch (erro) {
        console.error('Erro ao carregar ranking:', erro);
      } finally {
        setCarregando(false);
      }
    }

    carregarRanking();
  }, []);

  const getIniciais = (nome: string) => {
    return nome
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const top3 = ranking.slice(0, 3);
  const resto = ranking.slice(3);

  if (carregando) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-6 h-6 animate-spin text-brown-deep" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Eyebrow>
        <Zap size={14} />
        Ranking de Aceleração SOMA
      </Eyebrow>
      <p className="text-sm text-ink-soft mb-6">
        Mentores e mentorados mais engajados com a própria evolução.
      </p>

      {top3.length > 0 && (
        <div className="mb-8">
          <div className="flex items-flex-end justify-center gap-4 h-80">
            {top3[1] && (
              <div className="text-center">
                <div className="w-24 h-48 bg-gradient-to-b from-paper to-cream rounded-lg border-2 border-line flex flex-col items-center justify-start pt-4 shadow-md">
                  <span className="text-3xl mb-2">🥈</span>
                  {top3[1].foto_url ? (
                    <img
                      src={top3[1].foto_url}
                      alt={top3[1].nome}
                      className="w-12 h-12 rounded-full object-cover mb-2"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-brown text-white text-xs font-bold flex items-center justify-center mb-2">
                      {getIniciais(top3[1].nome)}
                    </div>
                  )}
                  <p className="text-xs font-bold text-brown-deep text-center px-2">
                    {top3[1].nome}
                  </p>
                  <p className="text-[10px] text-ink-faint mt-1 font-semibold">
                    {top3[1].pontos.toLocaleString('pt-BR')} Impulsos
                  </p>
                </div>
              </div>
            )}

            {top3[0] && (
              <div className="text-center">
                <div className="relative">
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-4xl">👑</div>
                  <div className="w-28 h-64 bg-gradient-to-b from-mustard-light to-paper rounded-lg border-4 border-brown-deep flex flex-col items-center justify-start pt-6 shadow-lg">
                    <span className="text-4xl mb-2">🥇</span>
                    {top3[0].foto_url ? (
                      <img
                        src={top3[0].foto_url}
                        alt={top3[0].nome}
                        className="w-14 h-14 rounded-full object-cover mb-2 border-2 border-brown-deep"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-brown-deep text-white text-sm font-bold flex items-center justify-center mb-2 border-2 border-brown">
                        {getIniciais(top3[0].nome)}
                      </div>
                    )}
                    <p className="text-sm font-bold text-brown-deep text-center px-2">
                      {top3[0].nome}
                    </p>
                    <p className="text-xs text-brown-deep mt-2 font-bold">
                      {top3[0].pontos.toLocaleString('pt-BR')} Impulsos
                    </p>
                  </div>
                </div>
              </div>
            )}

            {top3[2] && (
              <div className="text-center">
                <div className="w-24 h-40 bg-gradient-to-b from-paper to-cream rounded-lg border-2 border-line flex flex-col items-center justify-start pt-4 shadow-md">
                  <span className="text-3xl mb-2">🥉</span>
                  {top3[2].foto_url ? (
                    <img
                      src={top3[2].foto_url}
                      alt={top3[2].nome}
                      className="w-12 h-12 rounded-full object-cover mb-2"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-brown text-white text-xs font-bold flex items-center justify-center mb-2">
                      {getIniciais(top3[2].nome)}
                    </div>
                  )}
                  <p className="text-xs font-bold text-brown-deep text-center px-2">
                    {top3[2].nome}
                  </p>
                  <p className="text-[10px] text-ink-faint mt-1 font-semibold">
                    {top3[2].pontos.toLocaleString('pt-BR')} Impulsos
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {usuarioLogado?.posicao && usuarioLogado.posicao > 3 && (
        <Panel className="p-6 bg-sky-tint border-2 border-sky">
          <p className="text-sm text-sky-deep font-medium">Sua Posição</p>
          <p className="text-3xl font-display text-sky-deep mt-1">
            {usuarioLogado.posicao}º lugar
          </p>
        </Panel>
      )}

      {resto.length > 0 && (
        <div>
          <h3 className="font-medium text-brown-deep mb-4">Próximos Classificados</h3>
          <Panel className="p-0 overflow-hidden border border-line">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-cream border-b border-line">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-ink-soft uppercase tracking-wider">
                      Posição
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-ink-soft uppercase tracking-wider">
                      Mentorado
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-ink-soft uppercase tracking-wider">
                      Impulsos
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-line">
                  {resto.map((item, idx) => (
                    <tr
                      key={item.userId}
                      className={`transition ${
                        item.userId === usuarioLogado?.userId
                          ? 'bg-sky-tint border-l-4 border-sky'
                          : idx % 2 === 0
                            ? 'bg-white'
                            : 'bg-cream'
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-lg font-bold text-brown-deep">
                          {item.posicao}º
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {item.foto_url ? (
                            <img
                              src={item.foto_url}
                              alt={item.nome}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-brown text-white text-xs font-bold flex items-center justify-center">
                              {getIniciais(item.nome)}
                            </div>
                          )}
                          <span className="text-sm font-medium text-ink">
                            {item.nome}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <span className="text-lg font-bold text-brown-deep">
                          {item.pontos.toLocaleString('pt-BR')} Impulsos
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      )}

      <Panel className="p-4 bg-emerald-light border border-line">
        <p className="text-xs text-ink-soft mb-3 font-medium">
          Como ganhar Impulsos:
        </p>
        <ul className="space-y-1.5 text-xs text-ink">
          <li><span className="font-bold">+50 Impulsos</span> ao importar PDF do LinkedIn</li>
          <li><span className="font-bold">+20 Impulsos</span> por cada análise de fit realizada</li>
          <li><span className="font-bold">+100 Impulsos</span> por vaga em Entrevista Agendada</li>
          <li><span className="font-bold">+30 Impulsos</span> por anotação no Diário de Bordo</li>
          <li><span className="font-bold">+50 Impulsos</span> por participação em encontros</li>
        </ul>
      </Panel>
    </div>
  );
}
