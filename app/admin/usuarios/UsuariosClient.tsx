'use client';

import { useEffect, useState } from 'react';
import { Shield, Search, Loader, AlertCircle } from 'lucide-react';
import { Panel, Eyebrow } from '@/components/Panel';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  is_admin: boolean;
  created_at: string;
}

export default function UsuariosClient() {
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
      const res = await fetch('/api/admin/usuarios');
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

  async function toggleAdmin(userId: string, currentAdmin: boolean) {
    setAtualizando(userId);
    try {
      const res = await fetch('/api/admin/usuarios', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isAdmin: !currentAdmin }),
      });

      if (!res.ok) throw new Error('Erro ao atualizar');

      setUsuarios(
        usuarios.map((u) =>
          u.id === userId ? { ...u, is_admin: !currentAdmin } : u
        )
      );
    } catch (e) {
      setErro('Erro ao atualizar admin');
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
          <Shield size={14} />
          Gerenciamento de Usuários
        </Eyebrow>
        <p className="text-sm text-ink-soft mt-2">
          Controle de perfis e permissões de administrador
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
          placeholder="Buscar por nome ou email..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-line bg-white text-ink placeholder:text-ink-faint focus:outline-none focus:border-sky focus:ring-1 focus:ring-sky/30"
        />
      </div>

      <Panel className="p-0 overflow-hidden border border-line">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-cream border-b border-line">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-ink-soft uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-ink-soft uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-ink-soft uppercase tracking-wider">
                  Membro desde
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-ink-soft uppercase tracking-wider">
                  Admin
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-line">
              {usuariosFiltrados.map((usuario, idx) => (
                <tr
                  key={usuario.id}
                  className={idx % 2 === 0 ? 'bg-white' : 'bg-cream'}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-medium text-ink">{usuario.nome}</span>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-ink-soft">{usuario.email}</span>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-ink-faint">
                      {new Date(usuario.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => toggleAdmin(usuario.id, usuario.is_admin)}
                      disabled={atualizando === usuario.id}
                      className={`px-3 py-1.5 rounded-full text-sm font-semibold transition ${
                        usuario.is_admin
                          ? 'bg-green-tint border border-green text-green-deep hover:bg-green-light'
                          : 'bg-gray-100 border border-line text-ink-soft hover:bg-gray-200'
                      } ${atualizando === usuario.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {atualizando === usuario.id ? (
                        <Loader size={14} className="inline animate-spin" />
                      ) : usuario.is_admin ? (
                        'Admin'
                      ) : (
                        'Usuário'
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel className="p-4 bg-blue-tint border border-line">
        <p className="text-xs text-ink-soft font-medium mb-2">ℹ️ Informação:</p>
        <p className="text-sm text-ink">
          Clique no botão "Admin" para conceder ou remover permissões de administrador.
          Admins têm acesso a todas as ferramentas de gerenciamento.
        </p>
      </Panel>

      <Panel className="p-4 bg-cream border border-line">
        <p className="text-xs text-ink-soft font-medium mb-2">Total de usuários:</p>
        <p className="text-2xl font-display text-brown-deep">{usuariosFiltrados.length}</p>
      </Panel>
    </div>
  );
}
