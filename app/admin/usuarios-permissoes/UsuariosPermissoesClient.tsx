'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Panel, Eyebrow } from '@/components/Panel';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/types';

interface Props {
  profile: Profile;
  usuarios: Profile[];
  permissoes: any[];
}

const MODULOS = [
  { id: 'dashboard', nome: 'Dashboard', descricao: 'Acesso ao painel principal' },
  { id: 'onboarding', nome: 'Onboarding', descricao: 'Gerenciar onboarding' },
  { id: 'pdi', nome: 'PDI & Trilha', descricao: 'Editar PDI' },
  { id: 'diario', nome: 'Diário de Bordo', descricao: 'Visualizar anotações' },
  { id: 'minha-trilha', nome: 'Minha Trilha', descricao: 'Checkins mensais' },
  { id: 'passos', nome: 'Passos', descricao: 'Acesso a passos e milhas' },
  { id: 'admin', nome: 'Painel Admin', descricao: 'Acesso completo a admin' },
];

export default function UsuariosPermissoesClient({ profile, usuarios, permissoes }: Props) {
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<Profile | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [permissoesUsuario, setPermissoesUsuario] = useState<Record<string, boolean>>({});
  const router = useRouter();
  const supabase = createClient();

  function selecionarUsuario(user: Profile) {
    setUsuarioSelecionado(user);
    const userPerms = permissoes
      .filter((p) => p.user_id === user.id)
      .reduce((acc, p) => ({ ...acc, [p.modulo]: p.ativo }), {});
    setPermissoesUsuario(userPerms);
  }

  function togglePermissao(modulo: string) {
    setPermissoesUsuario((prev) => ({
      ...prev,
      [modulo]: !prev[modulo],
    }));
  }

  async function salvarPermissoes() {
    if (!usuarioSelecionado) return;

    setSalvando(true);
    try {
      await supabase
        .from('admin_permissoes')
        .delete()
        .eq('user_id', usuarioSelecionado.id);

      const novasPerms = Object.entries(permissoesUsuario)
        .filter(([_, ativo]) => ativo)
        .map(([modulo]) => ({
          user_id: usuarioSelecionado.id,
          modulo,
          ativo: true,
          atualizado_em: new Date().toISOString(),
        }));

      if (novasPerms.length > 0) {
        await supabase.from('admin_permissoes').insert(novasPerms);
      }

      alert('✅ Permissões salvas com sucesso!');
      setUsuarioSelecionado(null);
      router.refresh();
    } catch (err) {
      alert('❌ Erro: ' + (err instanceof Error ? err.message : 'desconhecido'));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main className="flex-1 px-6 py-8 md:px-12 md:py-12 max-w-5xl mx-auto w-full">
      <Link href="/admin" className="text-sky-deep hover:text-brown-deep text-sm mb-6 inline-flex items-center gap-1">
        <ArrowLeft size={14} /> Voltar ao admin
      </Link>

      <Eyebrow>Gerenciar Acesso</Eyebrow>
      <h1 className="font-display text-3xl text-brown-deep mb-1">Controle de Permissões</h1>
      <p className="text-sm text-ink-faint mb-8">Configure o acesso de cada usuário aos módulos da plataforma</p>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Lista de usuários */}
        <Panel className="p-6 border-line">
          <p className="text-xs uppercase tracking-wide text-ink-faint font-medium mb-4">Selecione um usuário</p>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {usuarios.map((user) => (
              <button
                key={user.id}
                onClick={() => selecionarUsuario(user)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  usuarioSelecionado?.id === user.id
                    ? 'bg-lotus-brown text-paper border-lotus-brown'
                    : 'bg-white border-line hover:border-lotus-brown'
                }`}
              >
                <p className={`text-sm font-medium ${usuarioSelecionado?.id === user.id ? 'text-paper' : 'text-ink'}`}>
                  {user.nome}
                </p>
                <p className={`text-xs ${usuarioSelecionado?.id === user.id ? 'text-lotus-cream' : 'text-ink-faint'}`}>
                  {user.email}
                </p>
              </button>
            ))}
          </div>
        </Panel>

        {/* Permissões do usuário selecionado */}
        {usuarioSelecionado ? (
          <Panel className="p-6 border-line">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-wide text-ink-faint font-medium mb-1">Usuário selecionado</p>
              <p className="font-display text-lg text-brown-deep">{usuarioSelecionado.nome}</p>
              <p className="text-xs text-ink-faint">{usuarioSelecionado.email}</p>
              {usuarioSelecionado.is_admin && (
                <span className="inline-block mt-2 text-[10px] uppercase px-2 py-1 rounded bg-amber-100 text-amber-700 border border-amber-300">
                  Admin
                </span>
              )}
            </div>

            <div className="space-y-2 mb-6">
              <p className="text-xs uppercase tracking-wide text-ink-faint font-medium">Módulos de acesso</p>
              {MODULOS.map((mod) => (
                <label
                  key={mod.id}
                  className="flex items-start gap-3 p-2 rounded hover:bg-cream cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={permissoesUsuario[mod.id] ?? false}
                    onChange={() => togglePermissao(mod.id)}
                    className="w-4 h-4 mt-0.5 accent-lotus-brown"
                  />
                  <div className="flex-1 text-sm">
                    <p className="font-medium text-ink">{mod.nome}</p>
                    <p className="text-xs text-ink-faint">{mod.descricao}</p>
                  </div>
                </label>
              ))}
            </div>

            <button
              onClick={salvarPermissoes}
              disabled={salvando}
              className="w-full bg-lotus-brown hover:bg-lotus-brown/90 text-paper px-4 py-2.5 rounded-lg transition-colors disabled:opacity-60 font-medium text-sm flex items-center justify-center gap-2"
            >
              {salvando ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Permissões'
              )}
            </button>
          </Panel>
        ) : (
          <Panel className="p-6 border-line flex items-center justify-center min-h-96">
            <p className="text-center text-ink-faint text-sm">Selecione um usuário para configurar as permissões</p>
          </Panel>
        )}
      </div>
    </main>
  );
}
