'use client';

import { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';

interface Permission {
  id: string;
  user_id: string;
  user_name: string;
  permission: string;
  granted_at: string;
}

export function PermissoesClient() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarPermissoes();
  }, []);

  async function carregarPermissoes() {
    try {
      const response = await fetch('/api/admin/permissoes');
      const data = await response.json();
      setPermissions(data || []);
    } catch (error) {
      console.error('Erro ao carregar permissões:', error);
    } finally {
      setLoading(false);
    }
  }

  async function revogarPermissao(permissionId: string) {
    try {
      await fetch(`/api/admin/permissoes/${permissionId}`, {
        method: 'DELETE',
      });
      carregarPermissoes();
    } catch (error) {
      console.error('Erro ao revogar permissão:', error);
    }
  }

  const permissionLabels: Record<string, string> = {
    manage_users: 'Gerenciar Usuários',
    manage_mentors: 'Gerenciar Mentores',
    manage_content: 'Gerenciar Conteúdo',
    view_analytics: 'Visualizar Análises',
    manage_payments: 'Gerenciar Pagamentos',
    manage_voting: 'Gerenciar Votações',
  };

  return (
    
      <div className="mb-6">
        <a href="/admin" className="inline-flex items-center gap-2 text-sm text-ink-faint hover:text-brown-deep transition-colors"> ← Voltar ao painel
        </a>
      </div>
<div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-brown-deep flex items-center gap-2">
          <Lock size={32} />
          Controle de Permissões
        </h1>
        <p className="text-gray-600 mt-2">
          Gerencie as permissões de acesso dos usuários administradores
        </p>
      </div>

      {loading ? (
        <div className="text-center py-8">Carregando...</div>
      ) : permissions.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-600">
          Nenhuma permissão configurada ainda
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                  Usuário
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                  Permissão
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                  Concedida em
                </th>
                <th className="px-6 py-3 text-center text-sm font-medium text-gray-700">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {permissions.map((perm) => (
                <tr key={perm.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                    {perm.user_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {permissionLabels[perm.permission] || perm.permission}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(perm.granted_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => revogarPermissao(perm.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Revogar
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
