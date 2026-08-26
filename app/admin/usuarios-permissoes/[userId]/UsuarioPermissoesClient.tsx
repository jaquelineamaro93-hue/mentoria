'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Panel, Eyebrow } from '@/components/Panel';
import { createClient } from '@/lib/supabase/client';
import { Tooltip } from '@/components/Tooltip';
import type { Profile } from '@/lib/types';

interface Props {
  usuario: Profile;
  permissoesIniciais: any[];
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

export default function UsuarioPermissoesClient({ usuario, permissoesIniciais }: Props) {
  const [salvando, setSalvando] = useState(false);
  const [permissoes, setPermissoes] = useState<Record<string, boolean>>(
    permissoesIniciais.reduce((acc, p) => ({ ...acc, [p.modulo]: p.ativo }), {})
  );
  const router = useRouter();
  const supabase = createClient();

  function togglePermissao(modulo: string) {
    setPermissoes((prev) => ({
      ...prev,
      [modulo]: !prev[modulo],
    }));
  }

  async function salvarPermissoes() {
    setSalvando(true);
    try {
      await supabase
        .from('admin_permissoes')
        .delete()
        .eq('user_id', usuario.id);

      const novasPerms = Object.entries(permissoes)
        .filter(([_, ativo]) => ativo)
        .map(([modulo]) => ({
          user_id: usuario.id,
          modulo,
          ativo: true,
          atualizado_em: new Date().toISOString(),
        }));

      if (novasPerms.length > 0) {
        await supabase.from('admin_permissoes').insert(novasPerms);
      }

      alert('✅ Permissões salvas!');
      router.push('/admin');
    } catch (err) {
      alert('❌ Erro: ' + (err instanceof Error ? err.message : 'desconhecido'));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="px-6 py-8 md:px-12 md:py-12 max-w-3xl mx-auto w-full">
      <Link href="/admin" className="text-mint hover:text-black text-sm mb-6 inline-flex items-center gap-1">
        <ArrowLeft size={14} /> Voltar
      </Link>

      <Eyebrow>Editar Permissões</Eyebrow>
      <h1 className="font-display text-3xl text-black mb-1">{usuario.nome}</h1>
      <p className="text-sm text-gray-text mb-8">{usuario.email}</p>

      <Panel className="p-6 border-gray-faint mb-6">
        <p className="text-xs uppercase tracking-wide text-gray-text font-medium mb-4">Módulos de acesso</p>
        <div className="space-y-3">
          {MODULOS.map((mod) => (
            <label key={mod.id} className="flex items-start gap-3 p-2 rounded hover:bg-white cursor-pointer">
              <input
                type="checkbox"
                checked={permissoes[mod.id] ?? false}
                onChange={() => togglePermissao(mod.id)}
                className="w-4 h-4 mt-0.5 accent-lotus-brown"
              />
              <div className="flex-1 text-sm">
                <p className="font-medium text-black">{mod.nome}</p>
                <p className="text-xs text-gray-text">{mod.descricao}</p>
              </div>
            </label>
          ))}
        </div>
      </Panel>

      <div className="flex gap-3">
        <button
          onClick={salvarPermissoes}
          disabled={salvando}
          className="flex-1 bg-lotus-brown hover:bg-lotus-brown/90 text-white px-4 py-2.5 rounded-lg transition-colors disabled:opacity-60 font-medium text-sm flex items-center justify-center gap-2"
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
        <Link
          href="/admin"
          className="px-4 py-2.5 rounded-lg border border-gray-faint hover:border-lotus-brown text-sm font-medium text-black hover:text-black transition-colors"
        >
          Cancelar
        </Link>
      </div>
    </div>
  );
}
