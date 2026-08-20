'use client';

import { useState } from 'react';
import { Shield, Check, X } from 'lucide-react';

const ROLES = [
  { id: 'mentora', label: 'Mentora', descricao: 'Acesso total à plataforma', color: 'bg-purple-50 border-purple-300 text-purple-700' },
  { id: 'admin', label: 'Administrador', descricao: 'Acesso total exceto financeiro', color: 'bg-sky-50 border-sky-300 text-sky-700' },
  { id: 'mentorada', label: 'Mentorada', descricao: 'Acesso padrão', color: 'bg-green-50 border-green-300 text-green-700' },
];

const MODULOS = [
  { categoria: 'Plataforma', itens: [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'onboarding', label: 'Onboarding' },
    { id: 'pdi', label: 'PDI & Trilha' },
    { id: 'diario', label: 'Diário de Bordo' },
    { id: 'feedback_pares', label: 'Feedback entre Colegas' },
    { id: 'gravacoes', label: 'Gravações' },
    { id: 'simulador_cv', label: 'Simulador de CV' },
    { id: 'passaporte', label: 'Passaporte' },
    { id: 'vagas', label: 'Vagas' },
    { id: 'network', label: 'Círculos de Influência' },
  ]},
  { categoria: 'Administração', itens: [
    { id: 'admin_painel', label: 'Painel Admin' },
    { id: 'admin_usuarios', label: 'Gerenciar Usuários' },
    { id: 'admin_feedbacks', label: 'Feedbacks' },
    { id: 'admin_financeiro', label: 'Financeiro' },
    { id: 'admin_permissoes', label: 'Permissões' },
  ]},
];

const DEFAULT_PERMISSIONS: Record<string, Record<string, boolean>> = {
  mentora: { dashboard: true, onboarding: true, pdi: true, diario: true, feedback_pares: true, gravacoes: true, simulador_cv: true, passaporte: true, vagas: true, network: true, admin_painel: true, admin_usuarios: true, admin_feedbacks: true, admin_financeiro: true, admin_permissoes: true },
  admin: { dashboard: true, onboarding: true, pdi: true, diario: true, feedback_pares: true, gravacoes: true, simulador_cv: true, passaporte: true, vagas: true, network: true, admin_painel: true, admin_usuarios: true, admin_feedbacks: true, admin_financeiro: false, admin_permissoes: false },
  mentorada: { dashboard: true, onboarding: true, pdi: true, diario: true, feedback_pares: true, gravacoes: true, simulador_cv: true, passaporte: true, vagas: true, network: true, admin_painel: false, admin_usuarios: false, admin_feedbacks: false, admin_financeiro: false, admin_permissoes: false },
};

export default function PermissoesClient() {
  const [roleAtiva, setRoleAtiva] = useState('admin');
  const [permissoes, setPermissoes] = useState(DEFAULT_PERMISSIONS);
  const [salvo, setSalvo] = useState(false);

  function togglePermissao(modulo: string) {
    if (roleAtiva === 'mentora') return;
    setPermissoes(prev => ({ ...prev, [roleAtiva]: { ...prev[roleAtiva], [modulo]: !prev[roleAtiva][modulo] } }));
    setSalvo(false);
  }

  function salvarPermissoes() {
    setSalvo(true);
    setTimeout(() => setSalvo(false), 2000);
  }

  const role = ROLES.find(r => r.id === roleAtiva)!;
  const permsAtivas = permissoes[roleAtiva] || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display text-brown-deep flex items-center gap-2">
          <Shield size={24} /> Gerenciar Permissões
        </h1>
        <p className="text-sm text-ink-faint mt-1">Controle o acesso de cada papel na plataforma</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ROLES.map(r => (
          <button key={r.id} onClick={() => setRoleAtiva(r.id)}
            className={`p-4 rounded-xl border-2 text-left transition-all ${roleAtiva === r.id ? r.color : 'bg-white border-line hover:border-brown-deep/30'}`}>
            <p className="font-medium text-sm">{r.label}</p>
            <p className="text-xs text-ink-faint mt-1">{r.descricao}</p>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-line overflow-hidden">
        <div className="px-6 py-4 border-b border-line flex items-center justify-between">
          <div>
            <h2 className="font-medium text-brown-deep">{role.label}</h2>
            <p className="text-xs text-ink-faint mt-0.5">{role.descricao}</p>
          </div>
          <button onClick={salvarPermissoes} className="bg-brown-deep text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brown transition-colors">
            {salvo ? '✓ Salvo!' : 'Salvar'}
          </button>
        </div>

        {MODULOS.map(cat => (
          <div key={cat.categoria}>
            <div className="px-6 py-2 bg-cream/50 border-b border-line">
              <p className="text-xs font-medium text-ink-faint uppercase tracking-wide">{cat.categoria}</p>
            </div>
            {cat.itens.map(mod => (
              <div key={mod.id} className="flex items-center justify-between px-6 py-3 border-b border-line/50 hover:bg-cream/30">
                <p className="text-sm text-ink">{mod.label}</p>
                <button onClick={() => togglePermissao(mod.id)} disabled={roleAtiva === 'mentora'}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${permsAtivas[mod.id] ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-red-50 text-red-400 hover:bg-red-100'}`}>
                  {permsAtivas[mod.id] ? <Check size={16} /> : <X size={16} />}
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
