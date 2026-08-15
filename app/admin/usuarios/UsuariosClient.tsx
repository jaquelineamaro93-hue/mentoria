'use client';

import { useEffect, useState } from 'react';
import { Users, Shield } from 'lucide-react';

interface User {
  id: string;
  nome: string;
  email: string;
  is_admin: boolean;
  created_at: string;
}

export function UsuariosClient() {
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarUsuarios();
  }, []);

  async function carregarUsuarios() {
    try {
      const response = await fetch('/api/admin/usuarios');
      const data = await response.json();
      setUsuarios(data || []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleAdmin(userId: string, currentAdmin: boolean) {
    try {
      await fetch(`/api/admin/usuarios/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_admin: !currentAdmin }),
      });
      carregarUsuarios();
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-brown-deep flex items-center gap-2">
          <Users size={32} />
          Gerenciar Usuários
        </h1>
        <p className="text-gray-600 mt-2">
          Visualize e gerencie todos os usuários da plataforma
        </p>
      </div>

      {loading ? (
        <div className="text-center py-8">Carregando...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                  Email
                </th>
                <th className="px-6 py-3 text-center text-sm font-medium text-gray-700">
                  Admin
                </th>
                <th className="px-6 py-3 text-center text-sm font-medium text-gray-700">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {usuarios.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{user.nome}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                  <td className="px-6 py-4 text-center">
                    {user.is_admin ? (
                      <Shield size={18} className="mx-auto text-brown-deep" />
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => toggleAdmin(user.id, user.is_admin)}
                      className="text-sm px-3 py-1 rounded border border-brown-deep text-brown-deep hover:bg-brown-deep/10"
                    >
                      {user.is_admin ? 'Remover Admin' : 'Fazer Admin'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
