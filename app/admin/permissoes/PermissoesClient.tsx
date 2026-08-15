'use client';

import { useEffect, useState } from 'react';
import { Shield, Lock, Search, Loader, AlertCircle, Check, X } from 'lucide-react';
import { Panel, Eyebrow } from '@/components/Panel';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  is_admin: boolean;
  pode_ver_dashboard: boolean;
  pode_editar_vagas: boolean;
  pode_editar_mentorados: boolean;
  pode_ver_financeiro: boolean;
  pode_editar_conteudo: boolean;
  created_at: string;
}

const PERMISSOES: Record<string, string> = {
  pode_ver_dashboard: 'Ver Dashboard',
  pode_editar_vagas: 'Editar Vagas',
  pode_editar_mentorados: 'Editar Mentorados',
  pode_ver_financeiro: 'Ver Financeiro',
  pode_editar_conteudo: 'Editar Conteúdo',
};

export default function PermissoesClient() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [atualizando, setAtualizando] = useState<string | null>(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    carregarUsuarios();
  }, []);

  async function carregarUsuarios() {
    try {
      const res = await fetch('/api/admin/permissoes');
      if (!res.ok) throw new Error('Erro ao carregar');
      const data = await res.json();
      setUsuarios(data.usuarios || []);
    } catch (e) {
      setErro('Erro ao carregar usuários');
      console.error(e);
    } finally {
      setCarregando(false);
    }
  }

  async function togglePermissao(
    userId: string,
    permissao: string
  ) {
    setAtualizando(userId);
    try {
      const usuario = usuarios.find((u) => u.id === userId);
      if (!usuario) return;

      const valorAtual = usuario[permissao as keyof Usuario];
      
      const res = await fetch('/api/admin/permissoes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          permissao,
          valor: !valorAtual,
        }),
      });

      if (!res.ok) throw new Error('Erro ao atualizar');

      setUsuarios(
        usuarios.map((u) =>
          u.id === userId ? { ...u, [permissao]: !valorAtual } : u
        )
      );
      setErro('');
    } catch (e) {
      setErro('Erro ao atualizar permissão');
      console.error(e);
    } finally {
      setAtualizando(null);
    }
  }

  const usuariosFiltrados = usuarios.filter((u) =>
    u.nome.toLowerCase().includes(busca.toLowerCase()) ||
    u.email.toLowerCase().includes(busca.toLowerCase())
  );

  if (carregando) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-6 h-6 animate-spin text-brown-deep" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Eyebrow>
          <Lock size={14} />
          Controle de Acesso e Permissões
        </Eyebrow>
        <p className="text-sm text-ink-soft mt-2">
          Gerencie quem pode fazer o quê na plataforma
        </p>
      </div>

      {erro && (
        <Panel className="p-4 bg-red-tint border border-red">
          <div className="flex gap-3">
            <AlertCircle size={20} className="text-red-deep flex-shrink-0" />
            <p className="text-sm text-red-deep">{erro}</p>
          </div>
        </Panel>
      )}

      <div className="relative">
        <Search className="absolute left-4 top-3.5 w-4 h-4 text-ink-faint" />
        <input
          type="text"
          placeholder="Buscar usuário..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-line bg-white text-ink placeholder:text-ink-faint focus:outline-none focus:border-sky focus:ring-1 focus:ring-sky/30"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {usuariosFiltrados.map((usuario) => (
          <Panel key={usuario.id} className="p-6 border border-line hover:border-sky transition">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-display text-lg text-brown-deep">{usuario.nome}</h3>
                  {usuario.is_admin && (
                    <span className="px-2 py-0.5 bg-yellow-tint border border-yellow text-yellow-deep text-xs font-semibold rounded-full">
                      ADMIN
                    </span>
                  )}
                </div>
                <p className="text-sm text-ink-soft">{usuario.email}</p>
                <p className="text-xs text-ink-faint mt-1">
                  Membro desde {new Date(usuario.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {Object.entries(PERMISSOES).map(([chave, label]) => {
                const permissaoAtiva = usuario[chave as keyof Usuario];
                return (
                  <button
                    key={chave}
                    onClick={() => togglePermissao(usuario.id, chave)}
                    disabled={atualizando === usuario.id}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition ${
                      permissaoAtiva
                        ? 'bg-green-tint border-green text-green-deep hover:bg-green-light'
                        : 'bg-gray-50 border-line text-ink-soft hover:bg-gray-100'
                    } ${atualizando === usuario.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span className="text-sm font-medium">{label}</span>
                    {permissaoAtiva ? (
                      <Check size={18} />
                    ) : (
                      <X size={18} />
                    )}
                  </button>
                );
              })}
            </div>
          </Panel>
        ))}
      </div>

      {usuariosFiltrados.length === 0 && (
        <Panel className="p-8 text-center border border-line">
          <p className="text-ink-soft">Nenhum usuário encontrado</p>
        </Panel>
      )}

      <Panel className="p-4 bg-blue-tint border border-line">
        <p className="text-xs text-ink-soft font-medium mb-2">ℹ️ Permissões Disponíveis:</p>
        <ul className="space-y-1 text-xs text-ink">
          <li>📊 <strong>Dashboard:</strong> Acesso ao painel principal</li>
          <li>💼 <strong>Vagas:</strong> Criar e editar vagas</li>
          <li>👥 <strong>Mentorados:</strong> Gerenciar dados de mentorados</li>
          <li>💰 <strong>Financeiro:</strong> Ver relatórios financeiros</li>
          <li>📝 <strong>Conteúdo:</strong> Editar conteúdo da plataforma</li>
        </ul>
      </Panel>
    </div>
  );
}
