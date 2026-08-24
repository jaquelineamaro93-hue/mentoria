'use client';

import { useState, useEffect } from 'react';
import { Users, TrendingUp, Edit2, Save, X } from 'lucide-react';

interface Vaga {
  id: string;
  plano_tipo: string;
  total_vagas: number;
  vagas_ocupadas: number;
  vagas_disponiveis: number;
  preco: number;
  descricao: string;
  ativo: boolean;
  percentual_ocupado: number;
}

export default function VagasControlClient() {
  const [vagas, setVagas] = useState<Vaga[]>([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Vaga>>({});
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  useEffect(() => {
    carregarVagas();
  }, []);

  async function carregarVagas() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/vagas/status');
      const data = await res.json();

      if (data.vagas) {
        setVagas(data.vagas);
      }
    } catch (erro) {
      setMensagem({ tipo: 'erro', texto: 'Erro ao carregar vagas' });
    } finally {
      setLoading(false);
    }
  }

  async function salvarAlteracoes(vagaId: string) {
    setSalvando(true);

    try {
      const vagaAtual = vagas.find((v) => v.id === vagaId);
      if (!vagaAtual) return;

      const res = await fetch('/api/admin/vagas/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plano_tipo: vagaAtual.plano_tipo,
          total_vagas: formData.total_vagas || vagaAtual.total_vagas,
          preco: formData.preco || vagaAtual.preco,
          descricao: formData.descricao || vagaAtual.descricao,
          ativo: formData.ativo !== undefined ? formData.ativo : vagaAtual.ativo,
        }),
      });

      if (res.ok) {
        setMensagem({ tipo: 'sucesso', texto: 'Vaga atualizada com sucesso!' });
        setEditando(null);
        carregarVagas();
      } else {
        setMensagem({ tipo: 'erro', texto: 'Erro ao salvar alterações' });
      }
    } catch (erro) {
      setMensagem({ tipo: 'erro', texto: 'Erro ao salvar' });
    } finally {
      setSalvando(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Carregando vagas...</div>;
  }

  return (
    
<div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6"><a href="/admin" className="inline-flex items-center gap-2 text-sm text-gray-text hover:text-black transition-colors">← Voltar ao painel</a></div>
      <h1 className="text-3xl font-bold mb-8">Controle de Vagas</h1>

      {mensagem && (
        <div
          className={`p-4 mb-6 rounded ${
            mensagem.tipo === 'sucesso' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}
        >
          {mensagem.texto}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {vagas.map((vaga) => (
          <div
            key={vaga.id}
            className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-lg transition"
          >
            {editando === vaga.id ? (
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Descrição"
                  value={formData.descricao || vaga.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  className="w-full px-3 py-2 border rounded text-sm"
                />
                <input
                  type="number"
                  placeholder="Total de vagas"
                  value={formData.total_vagas || vaga.total_vagas}
                  onChange={(e) => setFormData({ ...formData, total_vagas: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded text-sm"
                />
                <input
                  type="number"
                  placeholder="Preço"
                  step="0.01"
                  value={formData.preco || vaga.preco}
                  onChange={(e) => setFormData({ ...formData, preco: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border rounded text-sm"
                />
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.ativo !== undefined ? formData.ativo : vaga.ativo}
                    onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                  />
                  <span className="text-sm">Ativo</span>
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => salvarAlteracoes(vaga.id)}
                    disabled={salvando}
                    className="flex-1 bg-green-600 text-white py-2 rounded text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Salvar
                  </button>
                  <button
                    onClick={() => setEditando(null)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded text-sm font-medium hover:bg-gray-400"
                  >
                    <X className="w-4 h-4 inline" />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-lg capitalize">{vaga.plano_tipo}</h3>
                    <p className="text-sm text-gray-600">{vaga.descricao}</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditando(vaga.id);
                      setFormData({
                        total_vagas: vaga.total_vagas,
                        preco: vaga.preco,
                        descricao: vaga.descricao,
                        ativo: vaga.ativo,
                      });
                    }}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Ocupação</span>
                      <span className="font-bold">{vaga.percentual_ocupado}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${vaga.percentual_ocupado}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-sm">
                    <div>
                      <div className="text-lg font-bold text-gray-900">{vaga.vagas_ocupadas}</div>
                      <div className="text-xs text-gray-600">Ocupadas</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-green-600">{vaga.vagas_disponiveis}</div>
                      <div className="text-xs text-gray-600">Disponíveis</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-gray-900">{vaga.total_vagas}</div>
                      <div className="text-xs text-gray-600">Total</div>
                    </div>
                  </div>

                  <div className="pt-2 border-t text-sm">
                    <div className="flex justify-between mb-1">
                      <span>Preço:</span>
                      <span className="font-bold">R$ {vaga.preco?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className={vaga.ativo ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                        {vaga.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="bg-gray-50 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Resumo Geral</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded">
            <div className="text-2xl font-bold text-blue-600">{vagas.length}</div>
            <div className="text-sm text-gray-600">Planos cadastrados</div>
          </div>
          <div className="bg-white p-4 rounded">
            <div className="text-2xl font-bold text-green-600">
              {vagas.reduce((acc, v) => acc + v.vagas_disponiveis, 0)}
            </div>
            <div className="text-sm text-gray-600">Vagas disponíveis</div>
          </div>
          <div className="bg-white p-4 rounded">
            <div className="text-2xl font-bold text-orange-600">
              {vagas.reduce((acc, v) => acc + v.vagas_ocupadas, 0)}
            </div>
            <div className="text-sm text-gray-600">Vagas ocupadas</div>
          </div>
          <div className="bg-white p-4 rounded">
            <div className="text-2xl font-bold text-purple-600">
              {vagas.reduce((acc, v) => acc + v.total_vagas, 0)}
            </div>
            <div className="text-sm text-gray-600">Total de vagas</div>
          </div>
        </div>
      </div>
    </div>
  );
}
