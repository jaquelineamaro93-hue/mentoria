
'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Panel, Eyebrow } from '@/components/Panel';
import type { Profile } from '@/lib/types';

interface Props {
  profile: Profile;
  usuarios: Profile[];
}

export default function UsuariosListaClient({ profile, usuarios }: Props) {
  return (
    <main className="flex-1 px-6 py-8 md:px-12 md:py-12 max-w-3xl mx-auto w-full">
      <Link href="/admin" className="text-sky-deep hover:text-brown-deep text-sm mb-6 inline-flex items-center gap-1">
        <ArrowLeft size={14} /> Voltar ao admin
      </Link>

      <Eyebrow>Gerenciar Acesso</Eyebrow>
      <h1 className="font-display text-3xl text-brown-deep mb-1">Controle de Permissões</h1>
      <p className="text-sm text-ink-faint mb-8">Clique em um usuário para editar suas permissões</p>

      <Panel className="p-6 border-line">
        <div className="space-y-2">
          {usuarios.map((user) => (
            <Link
              key={user.id}
              href={`/admin/usuarios-permissoes/${user.id}`}
              className="block p-4 rounded-lg border border-line hover:border-lotus-brown hover:bg-cream transition-all"
            >
              <p className="font-medium text-ink">{user.nome}</p>
              <p className="text-xs text-ink-faint">{user.email}</p>
              {user.is_admin && (
                <span className="inline-block mt-2 text-[10px] uppercase px-2 py-1 rounded bg-amber-100 text-amber-700 border border-amber-300">
                  Admin
                </span>
              )}
            </Link>
          ))}
        </div>
      </Panel>
    </main>
  );
}
