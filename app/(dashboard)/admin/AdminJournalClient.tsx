'use client';

import { useMemo, useState } from 'react';
import { NotebookPen, Search, Sparkles } from 'lucide-react';

interface DiarioAdminItem {
  id: string;
  user_id: string;
  encontro_data: string;
  tipo_encontro: 'individual' | 'grupo' | 'pessoal' | null;
  anotacoes: string;
  ai_summary: string | null;
  created_at: string;
  profiles?: { nome: string } | { nome: string }[] | null;
}

function nomePerfil(profiles?: { nome: string } | { nome: string }[] | null) {
  if (!profiles) return 'Mentorado';
  return Array.isArray(profiles) ? profiles[0]?.nome || 'Mentorado' : profiles.nome;
}

function labelTipo(tipo: DiarioAdminItem['tipo_encontro']) {
  if (tipo === 'individual') return 'Sessão individual';
  if (tipo === 'grupo') return 'Encontro em grupo';
  if (tipo === 'pessoal') return 'Dia a dia';
  return 'Registro';
}

export default function AdminJournalClient({ entries }: { entries: DiarioAdminItem[] }) {
  const [mentoradoId, setMentoradoId] = useState('todos');
  const [tipo, setTipo] = useState('todos');
  const [busca, setBusca] = useState('');

  const mentorados = useMemo(() => {
    const mapa = new Map<string, string>();
    entries.forEach((entry) => mapa.set(entry.user_id, nomePerfil(entry.profiles)));
    return Array.from(mapa.entries()).sort((a, b) => a[1].localeCompare(b[1], 'pt-BR'));
  }, [entries]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase('pt-BR');
    return entries.filter((entry) => {
      if (mentoradoId !== 'todos' && entry.user_id !== mentoradoId) return false;
      if (tipo !== 'todos' && entry.tipo_encontro !== tipo) return false;
      if (!termo) return true;
      return (
        nomePerfil(entry.profiles).toLocaleLowerCase('pt-BR').includes(termo) ||
        entry.anotacoes.toLocaleLowerCase('pt-BR').includes(termo) ||
        entry.ai_summary?.toLocaleLowerCase('pt-BR').includes(termo)
      );
    });
  }, [entries, mentoradoId, tipo, busca]);

  return (
    <section className="mb-10">
      <div className="flex flex-col gap-1 mb-4">
        <div className="flex items-center gap-2">
          <NotebookPen size={18} className="text-mint-deep" />
          <h2 className="font-display text-xl text-black">Diário de Bordo dos mentorados</h2>
          <span className="text-xs px-2 py-1 rounded-full bg-mint-light border border-mint text-black">
            {entries.length}
          </span>
        </div>
        <p className="text-sm text-gray-text">
          Leia os registros antes de preparar o feedback e acompanhe mudanças de percepção, dúvidas e aprendizados ao longo da jornada.
        </p>
      </div>

      <div className="grid md:grid-cols-[1fr_220px_180px] gap-3 mb-4">
        <label className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-text" />
          <input
            type="search"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Buscar por mentorado, tema ou palavra..."
            className="w-full border border-gray-faint rounded-lg pl-9 pr-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-mint-deep/30"
          />
        </label>

        <select
          value={mentoradoId}
          onChange={(event) => setMentoradoId(event.target.value)}
          className="border border-gray-faint rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-mint-deep/30"
          aria-label="Filtrar por mentorado"
        >
          <option value="todos">Todos os mentorados</option>
          {mentorados.map(([id, nome]) => (
            <option key={id} value={id}>{nome}</option>
          ))}
        </select>

        <select
          value={tipo}
          onChange={(event) => setTipo(event.target.value)}
          className="border border-gray-faint rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-mint-deep/30"
          aria-label="Filtrar por tipo de registro"
        >
          <option value="todos">Todos os tipos</option>
          <option value="individual">Individual</option>
          <option value="grupo">Grupo</option>
          <option value="pessoal">Dia a dia</option>
        </select>
      </div>

      {filtrados.length === 0 ? (
        <div className="bg-white border border-gray-faint rounded-xl p-5 text-sm text-gray-text">
          Nenhum registro encontrado com esses filtros.
        </div>
      ) : (
        <div className="space-y-3">
          {filtrados.map((entry) => (
            <article key={entry.id} className="bg-white border border-gray-faint rounded-xl p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                <div>
                  <p className="text-sm font-medium text-black">{nomePerfil(entry.profiles)}</p>
                  <p className="text-xs text-gray-text mt-0.5">
                    {new Date(entry.encontro_data + 'T12:00:00').toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <span className="text-[11px] uppercase tracking-wide px-2.5 py-1 rounded-full bg-mint-light border border-mint text-black">
                  {labelTipo(entry.tipo_encontro)}
                </span>
              </div>

              <p className="text-sm text-black leading-relaxed whitespace-pre-wrap">{entry.anotacoes}</p>

              {entry.ai_summary && (
                <div className="mt-4 flex gap-2 rounded-lg bg-mint-light/60 border border-mint px-4 py-3">
                  <Sparkles size={15} className="text-mint-deep shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-gray-text mb-1">Síntese registrada</p>
                    <p className="text-sm text-black leading-relaxed">{entry.ai_summary}</p>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
