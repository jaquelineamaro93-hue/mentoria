'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Indicacao {
  id: string;
  indicado_nome: string;
  indicado_email: string;
  status: string;
}

interface Linha {
  id: string;
  nome: string;
  email: string;
  indicacoes: Indicacao[];
  convertidas: number;
  liberadas: number;
  disponiveis: number;
}

export default function AdminIndicacoesClient({ linhas }: { linhas: Linha[] }) {
  const router = useRouter();
  const [processando, setProcessando] = useState<string | null>(null);

  async function resgatarSessao(mentoradoId: string) {
    setProcessando(mentoradoId);
    try {
      const res = await fetch('/api/indicacao/resgatar-sessao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mentoradoId }),
      });
      if (!res.ok) throw new Error('Falha ao registrar');
      router.refresh();
    } catch {
      alert('Não foi possível registrar o resgate agora.');
    }
    setProcessando(null);
  }

  return (
    <main className="px-6 py-8 md:px-12 md:py-12 max-w-5xl mx-auto w-full">
      <h1 className="font-display text-3xl text-brown-deep mb-1">Indicações</h1>
      <p className="text-sm text-ink-faint mb-8">
        A cada 2 amigos convertidos, o mentorado libera 1 sessão individual bônus.
      </p>

      {linhas.length === 0 ? (
        <p className="text-sm text-ink-faint">Ninguém indicou amigos ainda.</p>
      ) : (
        <div className="space-y-4">
          {linhas.map((linha) => (
            <div key={linha.id} className="bg-white border border-line rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                <div>
                  <p className="text-sm font-medium text-brown-deep">{linha.nome}</p>
                  <p className="text-xs text-ink-faint">{linha.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-ink-faint">
                    {linha.convertidas} convertidos · {linha.disponiveis} disponíveis
                  </span>
                  {linha.disponiveis > 0 && (
                    <button
                      onClick={() => resgatarSessao(linha.id)}
                      disabled={processando === linha.id}
                      className="text-xs bg-brown-deep text-white px-3 py-1.5 rounded-lg hover:bg-brown transition-colors disabled:opacity-50"
                    >
                      {processando === linha.id ? 'Registrando...' : 'Marcar sessão como usada'}
                    </button>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {linha.indicacoes.map((i) => (
                  <span
                    key={i.id}
                    className={`text-xs px-2.5 py-1 rounded-full ${
                      i.status === 'convertido'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {i.indicado_nome}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
