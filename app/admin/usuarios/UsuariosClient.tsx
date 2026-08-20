'use client';

import { useEffect, useState } from 'react';
import { Users, Shield, CheckCircle2, Circle } from 'lucide-react';

interface User {
  id: string;
  nome: string;
  email: string;
  is_admin: boolean;
  onboarding_concluido: boolean;
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

  async function toggleOnboarding(userId: string, atual: boolean) {
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      await supabase
        .from('profiles')
        .update({ onboarding_concluido: !atual })
        .eq('id', userId);
      setUsuarios(prev => prev.map(u => u.id === userId ? { ...u, onboarding_concluido: !atual } : u));
    } catch (error) {
      console.error('Erro ao atualizar onboarding:', error);
    }
  }

  async function marcarTodosOnboarding() {
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const ids = usuarios.filter(u => !u.is_admin && !u.onboarding_concluido).map(u => u.id);
      if (ids.length === 0) return;
      await supabase.from('profiles').update({ onboarding_concluido: true }).in('id', ids);
      setUsuarios(prev => prev.map(u => ids.includes(u.id) ? { ...u, onboarding_concluido: true } : u));
    } catch (error) {
      console.error('Erro:', error);
    }
  }

  const mentoradas = usuarios.filter(u => !u.is_admin);
  const totalOnboarding = mentoradas.filter(u => u.onboarding_concluido).length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-display text-brown-deep flex items-center gap-2">
            <Users size={24} />
            Gerenciar Usuários
          </h1>
          <p className="text-sm text-ink-faint mt-1">
            {totalOnboarding} de {mentoradas.length} mentoradas fizeram o onboarding inicial
          </p>
        </div>
        {mentoradas.some(u => !u.onboarding_concluido) && (
          <button
            onClick={marcarTodosOnboarding}
            className="text-sm px-4 py-2 rounded-lg bg-brown-deep text-white hover:bg-brown transition-colors"
          >
            Marcar todas como concluído
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-8 text-ink-faint">Carregando...</div>
      ) : (
        <div className="bg-white rounded-xl border border-line overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-line">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-ink-faint uppercase tracking-wide">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-ink-faint uppercase tracking-wide">Email</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-ink-faint uppercase tracking-wide">Sessão Inicial</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-ink-faint uppercase tracking-wide">Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {usuarios.map((user) => (
                <tr key={user.id} className="hover:bg-cream/50">
                  <td className="px-6 py-4 text-sm text-ink">{user.nome}</td>
                  <td className="px-6 py-4 text-sm text-ink-faint">{user.email}</td>
                  <td className="px-6 py-4 text-center">
                    {!user.is_admin && (
                      <button
                        onClick={() => toggleOnboarding(user.id, user.onboarding_concluido)}
                        className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border transition-colors"
                        style={{
                          background: user.onboarding_concluido ? '#f0fdf4' : '#fafaf9',
                          borderColor: user.onboarding_concluido ? '#86efac' : '#ded4c3',
                          color: user.onboarding_concluido ? '#16a34a' : '#9c8f7e',
                        }}
                      >
                        {user.onboarding_concluido
                          ? <><CheckCircle2 size={13} /> Feito</>
                          : <><Circle size={13} /> Pendente</>
                        }
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => toggleAdmin(user.id, user.is_admin)}
                      className={`inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                        user.is_admin
                          ? 'bg-sky-tint border-sky text-sky-deep'
                          : 'border-line text-ink-faint hover:border-brown-deep hover:text-brown-deep'
                      }`}
                    >
                      <Shield size={13} />
                      {user.is_admin ? 'Admin' : 'Comum'}
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
