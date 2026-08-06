'use client';

import { useEffect, useState } from 'react';
import { Zap, Loader } from 'lucide-react';
import { Panel, Eyebrow } from '@/components/Panel';

interface RankingItem {
  posicao: number;
  userId: string;
  nome: string;
  avatar_url: string | null;
  aplicacoes: number;
  entrevistas: number;
  fitMedio: number;
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

  const getIcone = (posicao: number) => {
    if (posicao === 1) return '🥇';
    if (posicao === 2) return '🥈';
    if (posicao === 3) return '🥉';
    return `${posicao}º`;
  };

  const getIniciais = (nome: string) => {
    return nome
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (carregando) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-6 h-6 animate-spin text-brown-deep" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {usuarioLogado?.posicao && (
        <Panel className="p-6 bg-sky-tint border border-sky">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-sky-deep font-medium">Sua Posição</p>
              <p className="text-3xl font-display text-sky-deep mt-1">
                {usuarioLogado.posicao}º lugar na turma
              </p>
            </div>
            <div className="text-5xl">
              {getIcone(usuarioLogado.posicao)}
            </div>
          </div>
        </Panel>
      )}

      <div>
        <Eyebrow>
          <Zap size={14} />
          Ranking da Comunidade SOMA
        </Eyebrow>

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
                  <th className="px-6 py-4 text-center text-xs font-semibold text-ink-soft uppercase tracking-wider">
                    Vagas Analisadas
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-ink-soft uppercase tracking-wider">
                    Entrevistas
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-ink-soft uppercase tracking-wider">
                    Fit Médio
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-ink-soft uppercase tracking-wider">
                    Pontos (XP)
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-line">
                {ranking.map((item, idx) => (
                  <tr
                    key={item.userId}
                    className={`transition ${
                      item.userId === usuarioLogado?.userId
                        ? 'bg-sky-tint'
                        : idx % 2 === 0
                          ? 'bg-white'
                          : 'bg-cream'
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-lg font-bold text-brown-deep">
                        {getIcone(item.posicao)}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {item.avatar_url ? (
                          <img
                            src={item.avatar_url}
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

                    <td className="px-6 py-4 text-center">
                      <span className="text-sm text-ink font-medium">
                        {item.aplicacoes}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span className="inline-block px-2.5 py-1 rounded-full bg-sky-tint text-sky-deep text-xs font-bold">
                        {item.entrevistas}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center">
                        <div className="w-12 h-1 rounded-full bg-line overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              item.fitMedio >= 70
                                ? 'bg-emerald-500'
                                : item.fitMedio >= 50
                                  ? 'bg-sky-deep'
                                  : 'bg-orange-500'
                            }`}
                            style={{ width: `${item.fitMedio}%` }}
                          />
                        </div>
                        <span className="ml-2 text-xs font-bold text-ink-soft">
                          {item.fitMedio}%
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <span className="text-lg font-bold text-brown-deep">
                        {item.pontos} pts
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {ranking.length === 0 && (
            <div className="p-8 text-center text-ink-faint">
              Nenhum mentorado encontrado ainda
            </div>
          )}
        </Panel>
      </div>

      <Panel className="p-4 bg-cream border border-line">
        <p className="text-xs text-ink-soft mb-3 font-medium">
          Como ganhar pontos:
        </p>
        <ul className="space-y-1.5">
          <li className="text-xs text-ink">
            <span className="font-bold">+50 pts</span> ao importar PDF do
            LinkedIn
          </li>
          <li className="text-xs text-ink">
            <span className="font-bold">+20 pts</span> por cada análise de fit
            realizada
          </li>
          <li className="text-xs text-ink">
            <span className="font-bold">+30 pts</span> por vaga movida para
            "Aplicada"
          </li>
          <li className="text-xs text-ink">
            <span className="font-bold">+100 pts</span> por vaga em "Entrevista
            Agendada"
          </li>
        </ul>
      </Panel>
    </div>
  );
}

