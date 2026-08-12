'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { Panel, Eyebrow } from '@/components/Panel';
import { createClient } from '@/lib/supabase/client';
import { X, Plus, Edit2, Trash2, Check } from 'lucide-react';

interface Enquete {
  id: string;
  titulo: string;
  descricao: string | null;
  data_inicio: string;
  data_fim: string;
  tipo: 'online' | 'presencial';
  ativo: boolean;
  horario: string | null;
  local: string | null;
  permitir_multiplas?: boolean;
}

interface OpcaoEnquete {
  id?: string;
  texto: string;
  ordem: number;
}

export default function AdminEnquetesClient({ enquetes: enquetesIniciais }: { enquetes: Enquete[] }) {
  const supabase = createClient();
  const router = useRouter();
  const [enquetes, setEnquetes] = useState<Enquete[]>(enquetesIniciais);
  const [editando, setEditando] = useState<Enquete | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [deletando, setDeletando] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const [form, setForm] = useState<Partial<Enquete>>({
    titulo: '',
    descricao: '',
    data_inicio: new Date().toISOString().split('T')[0],
    data_fim: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    tipo: 'presencial',
    ativo: true,
    horario: '',
    local: '',
    permitir_multiplas: false,
  });
  const [opcoes, setOpcoes] = useState<OpcaoEnquete[]>([]);

  function iniciarNova() {
    setEditando({ id: '', titulo: '', descricao: null, data_inicio: '', data_fim: '', tipo: 'presencial', ativo: true, horario: null, local: null, permitir_multiplas: false });
    setForm({
      titulo: '',
      descricao: '',
      data_inicio: new Date().toISOString().split('T')[0],
      data_fim: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      tipo: 'presencial',
      ativo: true,
      horario: '',
      local: '',
      permitir_multiplas: false,
    });
    setOpcoes([{ texto: '', ordem: 0 }]);
    setErro(null);
  }

  async function iniciarEdicao(enquete: Enquete) {
    setEditando(enquete);
    setForm({
      titulo: enquete.titulo,
      descricao: enquete.descricao || '',
      data_inicio: enquete.data_inicio.split('T')[0],
      data_fim: enquete.data_fim.split('T')[0],
      tipo: enquete.tipo,
      ativo: enquete.ativo,
      horario: enquete.horario || '',
      local: enquete.local || '',
      permitir_multiplas: enquete.permitir_multiplas || false,
    });
    try {
      const { data } = await supabase.from('enquete_opcoes').select('*').eq('enquete_id', enquete.id).order('ordem');
      if (data) setOpcoes(data);
      else setOpcoes([{ texto: '', ordem: 0 }]);
    } catch {
      setOpcoes([{ texto: '', ordem: 0 }]);
    }
    setErro(null);
  }

  function adicionarOpcao() {
    setOpcoes((prev) => [...prev, { texto: '', ordem: prev.length }]);
  }

  function removerOpcao(index: number) {
    setOpcoes((prev) => prev.filter((_, i) => i !== index).map((op, i) => ({ ...op, ordem: i })));
  }

  function atualizarOpcao(index: number, texto: string) {
    setOpcoes((prev) => prev.map((op, i) => (i === index ? { ...op, texto } : op)));
  }

  async function handleSalvar() {
    if (!form.titulo?.trim()) {
      setErro('Título é obrigatório');
      return;
    }
    if (!form.data_inicio || !form.data_fim) {
      setErro('Datas são obrigatórias');
      return;
    }
    if (opcoes.filter((op) => op.texto.trim()).length === 0) {
      setErro('Adicione pelo menos uma opção');
      return;
    }
    setSalvando(true);
    try {
      const payload: Enquete = {
        id: '',
        titulo: form.titulo,
        descricao: form.descricao || null,
        data_inicio: form.data_inicio,
        data_fim: form.data_fim,
        tipo: form.tipo as 'online' | 'presencial',
        ativo: form.ativo !== false,
        horario: form.horario || null,
        local: form.local || null,
        permitir_multiplas: form.permitir_multiplas || false,
      };
      let enqueteId = editando?.id || '';
      if (editando && editando.id) {
        const { error } = await supabase.from('enquetes').update(payload).eq('id', editando.id);
        if (error) throw error;
        enqueteId = editando.id;
        await supabase.from('enquete_opcoes').delete().eq('enquete_id', editando.id);
        setEnquetes((prev) => prev.map((e) => (e.id === editando.id ? { ...e, ...payload } : e)));
      } else {
        const { data, error } = await supabase.from('enquetes').insert([payload]).select().single();
        if (error) throw error;
        if (!data?.id) throw new Error('ID da enquete não retornou do servidor');
        enqueteId = data.id;
        setEnquetes((prev) => [data, ...prev]);
      }

      if (!enqueteId) throw new Error('ID da enquete não foi definido');

      const opcoesPayload = opcoes.filter((op) => op.texto.trim()).map((op, i) => ({ enquete_id: enqueteId, texto: op.texto, ordem: i }));
      if (opcoesPayload.length > 0) {
        const { error } = await supabase.from('enquete_opcoes').insert(opcoesPayload);
        if (error) throw error;
      }
      setEditando(null);
      setForm({});
      setOpcoes([]);
      setErro(null);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSalvando(false);
    }
  }

  async function handleToggleAtivo(id: string, ativo: boolean) {
    try {
      const { error } = await supabase.from('enquetes').update({ ativo: !ativo }).eq('id', id);
      if (error) throw error;
      setEnquetes((prev) => prev.map((e) => (e.id === id ? { ...e, ativo: !ativo } : e)));
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao atualizar');
    }
  }

  async function handleDeletar(id: string) {
    if (!window.confirm('Tem certeza? Isso não pode ser desfeito.')) return;
    setDeletando(id);
    try {
      const { error } = await supabase.from('enquetes').delete().eq('id', id);
      if (error) throw error;
      setEnquetes((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao deletar');
    } finally {
      setDeletando(null);
    }
  }

  return (
    <div className="flex flex-row w-full">
      <Sidebar profile={null} onSignOut={() => {}} />
      <main className="flex-1 px-6 py-8 md:px-12 md:py-12 w-full">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-sky-deep mb-2">Área administrativa</p>
          <h1 className="font-display text-3xl text-brown-deep mb-4">Gerenciar votações</h1>
        </div>
        {erro && (
          <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-lg text-red-700 text-sm">{erro}</div>
        )}
        {editando !== null && (
          <Panel className="p-6 mb-8 border-sky">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl text-brown-deep">{editando ? 'Editar votação' : 'Nova votação'}</h2>
              <button onClick={() => setEditando(null)} className="text-ink-faint hover:text-brown-deep">
                <X size={20} />
              </button>
            </div>
            <div className="grid gap-4 mb-6">
              <div>
                <label className="block text-xs font-medium text-brown-deep mb-2">Título *</label>
                <input type="text" value={form.titulo || ''} onChange={(e) => setForm({ ...form, titulo: e.target.value })} className="w-full px-4 py-2 border border-line rounded-lg focus:outline-none focus:border-brown-deep" placeholder="ex: Qual é o melhor dia?" />
              </div>
              <div>
                <label className="block text-xs font-medium text-brown-deep mb-2">Descrição</label>
                <textarea value={form.descricao || ''} onChange={(e) => setForm({ ...form, descricao: e.target.value })} className="w-full px-4 py-2 border border-line rounded-lg focus:outline-none focus:border-brown-deep" rows={3} placeholder="ex: Vote no sábado que funciona melhor para você" />
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-brown-deep mb-2">Tipo *</label>
                  <select value={form.tipo || 'presencial'} onChange={(e) => setForm({ ...form, tipo: e.target.value as 'online' | 'presencial' })} className="w-full px-4 py-2 border border-line rounded-lg focus:outline-none focus:border-brown-deep">
                    <option value="presencial">Presencial</option>
                    <option value="online">Online</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-brown-deep mb-2">Escolhas</label>
                  <select value={form.permitir_multiplas ? 'multipla' : 'unica'} onChange={(e) => setForm({ ...form, permitir_multiplas: e.target.value === 'multipla' })} className="w-full px-4 py-2 border border-line rounded-lg focus:outline-none focus:border-brown-deep">
                    <option value="unica">Escolha única</option>
                    <option value="multipla">Múltiplas escolhas</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-brown-deep mb-2">Status</label>
                  <select value={form.ativo ? 'ativo' : 'inativo'} onChange={(e) => setForm({ ...form, ativo: e.target.value === 'ativo' })} className="w-full px-4 py-2 border border-line rounded-lg focus:outline-none focus:border-brown-deep">
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                  </select>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-brown-deep mb-2">Início *</label>
                  <input type="date" value={form.data_inicio || ''} onChange={(e) => setForm({ ...form, data_inicio: e.target.value })} className="w-full px-4 py-2 border border-line rounded-lg focus:outline-none focus:border-brown-deep" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-brown-deep mb-2">Fim *</label>
                  <input type="date" value={form.data_fim || ''} onChange={(e) => setForm({ ...form, data_fim: e.target.value })} className="w-full px-4 py-2 border border-line rounded-lg focus:outline-none focus:border-brown-deep" />
                </div>
              </div>
              {form.tipo === 'presencial' && (
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-brown-deep mb-2">Horário</label>
                    <input type="text" value={form.horario || ''} onChange={(e) => setForm({ ...form, horario: e.target.value })} className="w-full px-4 py-2 border border-line rounded-lg focus:outline-none focus:border-brown-deep" placeholder="ex: 11:30 às 17h" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-brown-deep mb-2">Local</label>
                    <input type="text" value={form.local || ''} onChange={(e) => setForm({ ...form, local: e.target.value })} className="w-full px-4 py-2 border border-line rounded-lg focus:outline-none focus:border-brown-deep" placeholder="ex: Pinheiros, São Paulo" />
                  </div>
                </div>
              )}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-xs font-medium text-brown-deep">Alternativas *</label>
                  <button onClick={adicionarOpcao} type="button" className="flex items-center gap-1 text-xs font-medium text-sky-deep hover:text-sky-dark">
                    <Plus size={14} />
                    Adicionar
                  </button>
                </div>
                <div className="space-y-2">
                  {opcoes.map((opcao, i) => (
                    <div key={i} className="flex gap-2">
                      <input type="text" value={opcao.texto} onChange={(e) => atualizarOpcao(i, e.target.value)} className="flex-1 px-4 py-2 border border-line rounded-lg focus:outline-none focus:border-brown-deep" placeholder={`Alternativa ${i + 1}`} />
                      <button onClick={() => removerOpcao(i)} type="button" className="text-ink-faint hover:text-red-600 transition p-2">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleSalvar} disabled={salvando} className="bg-brown-deep hover:bg-brown text-white font-medium px-6 py-2.5 rounded-lg transition-colors disabled:opacity-60">
                {salvando ? 'Salvando...' : editando ? 'Atualizar' : 'Criar'}
              </button>
              <button onClick={() => setEditando(null)} className="border border-brown-deep text-brown-deep hover:bg-brown-deep/10 font-medium px-6 py-2.5 rounded-lg transition-colors">
                Cancelar
              </button>
            </div>
          </Panel>
        )}
        <section>
          <div className="flex items-center justify-between mb-4">
            <Eyebrow>Votações cadastradas</Eyebrow>
            {editando === null && (
              <button onClick={iniciarNova} className="flex items-center gap-1.5 text-sm font-medium bg-brown-deep text-white px-4 py-2 rounded-lg hover:bg-brown transition-colors">
                <Plus size={16} />
                Nova votação
              </button>
            )}
          </div>
          <div className="space-y-3">
            {enquetes.length === 0 ? (
              <Panel className="p-6 text-center text-ink-faint">Nenhuma votação cadastrada</Panel>
            ) : (
              enquetes.map((enquete) => (
                <Panel key={enquete.id} className={`p-5 flex items-start justify-between gap-4 ${!enquete.ativo ? 'opacity-60' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="font-medium text-brown-deep">{enquete.titulo}</h3>
                      <span className={`text-[10px] font-medium px-2 py-1 rounded-full uppercase tracking-wide ${enquete.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {enquete.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                      <span className="text-[10px] font-medium px-2 py-1 rounded-full uppercase tracking-wide bg-sky-tint text-brown-deep">{enquete.tipo}</span>
                      <span className="text-[10px] font-medium px-2 py-1 rounded-full uppercase tracking-wide bg-purple-100 text-purple-700">
                        {enquete.permitir_multiplas ? 'Múltipla' : 'Única'}
                      </span>
                    </div>
                    {enquete.descricao && <p className="text-sm text-ink-soft mb-2">{enquete.descricao}</p>}
                    <div className="text-xs text-ink-faint space-y-1">
                      <p>📅 {new Date(enquete.data_inicio).toLocaleDateString('pt-BR')} até {new Date(enquete.data_fim).toLocaleDateString('pt-BR')}</p>
                      {enquete.tipo === 'presencial' && (
                        <>
                          {enquete.horario && <p>⏰ {enquete.horario}</p>}
                          {enquete.local && <p>📍 {enquete.local}</p>}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => iniciarEdicao(enquete)} className="text-ink-faint hover:text-brown-deep transition p-2" title="Editar">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleToggleAtivo(enquete.id, enquete.ativo)} className="text-ink-faint hover:text-brown-deep transition p-2" title={enquete.ativo ? 'Desativar' : 'Ativar'}>
                      <Check size={16} className={enquete.ativo ? 'text-green-600' : ''} />
                    </button>
                    <button onClick={() => handleDeletar(enquete.id)} disabled={deletando === enquete.id} className="text-ink-faint hover:text-red-600 transition p-2 disabled:opacity-60" title="Deletar">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </Panel>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
