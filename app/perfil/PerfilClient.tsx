'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import StandardLayout from '@/components/StandardLayout';
import { Eye, EyeOff, Upload, LogOut, Compass } from 'lucide-react';
import type { Profile, PlanoMentoria } from '@/lib/types';
import TourPortal from '@/components/TourPortal';

export default function PerfilClient({
  perfil,
  plano,
}: {
  perfil: Profile | null;
  plano: PlanoMentoria | null;
}) {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nome, setNome] = useState(perfil?.nome || '');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmaSenha, setConfirmaSenha] = useState('');
  const [mostraSenha, setMostraSenha] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [verTour, setVerTour] = useState(false);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  async function handleSalvarPerfil() {
    setSalvando(true);
    setMensagem('');

    try {
      const updateData: any = {};

      if (nome !== perfil?.nome) {
        updateData.nome = nome;
      }

      if (novaSenha) {
        if (novaSenha !== confirmaSenha) {
          setMensagem('As senhas não conferem');
          setSalvando(false);
          return;
        }
        if (novaSenha.length < 6) {
          setMensagem('A senha deve ter no mínimo 6 caracteres');
          setSalvando(false);
          return;
        }

        const { error } = await supabase.auth.updateUser({ password: novaSenha });
        if (error) {
          setMensagem('Erro ao atualizar senha');
          setSalvando(false);
          return;
        }
      }

      if (Object.keys(updateData).length > 0) {
        await supabase.from('profiles').update(updateData).eq('id', perfil?.id);
      }

      setMensagem('Perfil atualizado com sucesso!');
      setNovaSenha('');
      setConfirmaSenha('');
    } catch (e) {
      console.error(e);
      setMensagem('Erro ao salvar perfil');
    }
    setSalvando(false);
  }

  async function handleUploadFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMensagem('Por favor, selecione um arquivo de imagem válido');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMensagem('Arquivo muito grande. Máximo permitido é 5MB');
      return;
    }

    setSalvando(true);
    try {
      const ext = file.name.split('.').pop();
    if (!perfil) return;
      const path = `${perfil.id}/perfil.${ext}`;

      // O bucket se chama "avatar". upsert evita o erro de "já existe"
      // quando a pessoa troca a foto uma segunda vez.
      const { error: uploadError } = await supabase.storage
        .from('avatar')
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) {
        setMensagem(`Erro ao enviar foto: ${uploadError.message}`);
      } else {
        const { data } = supabase.storage.from('avatar').getPublicUrl(path);
        // O caminho é sempre o mesmo, então sem o sufixo o navegador
        // continuaria mostrando a foto antiga do cache.
        const urlComVersao = `${data.publicUrl}?v=${Date.now()}`;
        await supabase.from('profiles').update({ foto_url: urlComVersao }).eq('id', perfil.id);
        setMensagem('Foto atualizada com sucesso!');
        router.refresh();
      }
    } catch (e) {
      console.error(e);
      setMensagem('Erro ao atualizar foto');
    }
    setSalvando(false);
  }

  return (
    <StandardLayout profile={perfil} onSignOut={handleSignOut}>
        <div className="flex items-start justify-between gap-4 mb-8">
          <h1 className="font-display text-3xl text-black">Meu Perfil</h1>
          {perfil && (
            <button
              onClick={() => setVerTour(true)}
              className="flex items-center gap-1.5 text-sm font-medium text-black bg-mint-light border border-mint rounded-lg px-3 py-2 hover:bg-mint-light/70 transition shrink-0"
            >
              <Compass size={15} />
              Rever tour do portal
            </button>
          )}
        </div>

        {perfil && verTour && (
          <TourPortal
            userId={perfil.id}
            aberturaAutomatica={false}
            aberto={verTour}
            onFechar={() => setVerTour(false)}
          />
        )}

        {mensagem && (
          <div className={`mb-6 p-4 rounded-lg ${mensagem.includes('sucesso') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {mensagem}
          </div>
        )}

        {/* Foto de Perfil */}
        <div className="bg-white border border-gray-faint rounded-2xl p-8 mb-8">
          <h2 className="font-display text-xl text-black mb-4">Foto de Perfil</h2>
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-mint-deep flex items-center justify-center text-white text-3xl font-display">
              {perfil?.nome?.[0]?.toUpperCase() || 'U'}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={salvando}
              className="flex items-center gap-2 bg-brown-deep text-white px-4 py-2 rounded-lg hover:bg-brown transition-colors disabled:opacity-50"
            >
              <Upload size={16} />
              Enviar Foto
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleUploadFoto}
              className="hidden"
            />
          </div>
        </div>

        {/* Informações Pessoais */}
        <div className="bg-white border border-gray-faint rounded-2xl p-8 mb-8">
          <h2 className="font-display text-xl text-black mb-6">Informações Pessoais</h2>

          <div className="mb-6">
            <label className="block text-xs font-medium text-black mb-2">Nome</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-4 py-3 border border-gray-faint rounded-lg focus:outline-none focus:border-brown-deep"
            />
          </div>

          <div className="mb-6">
            <label className="block text-xs font-medium text-black mb-2">Email</label>
            <input
              type="email"
              value={perfil?.email || ''}
              disabled
              className="w-full px-4 py-3 border border-gray-faint rounded-lg bg-white text-gray-text"
            />
          </div>

          {/* Senha */}
          <div className="border-t border-gray-faint pt-6">
            <h3 className="font-medium text-black mb-4">Redefinir Senha</h3>

            <div className="mb-4">
              <label className="block text-xs font-medium text-black mb-2">Nova Senha</label>
              <div className="relative">
                <input
                  type={mostraSenha ? 'text' : 'password'}
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="Deixe em branco para não alterar"
                  className="w-full px-4 py-3 border border-gray-faint rounded-lg focus:outline-none focus:border-brown-deep pr-10"
                />
                <button
                  type="button"
                  onClick={() => setMostraSenha(!mostraSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-text hover:text-black"
                >
                  {mostraSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-black mb-2">Confirmar Senha</label>
              <input
                type={mostraSenha ? 'text' : 'password'}
                value={confirmaSenha}
                onChange={(e) => setConfirmaSenha(e.target.value)}
                placeholder="Confirme a nova senha"
                className="w-full px-4 py-3 border border-gray-faint rounded-lg focus:outline-none focus:border-brown-deep"
              />
            </div>
          </div>
        </div>

        {/* Meu Plano */}
        {plano && (
          <div className="bg-white border border-gray-faint rounded-2xl p-8 mb-8">
            <h2 className="font-display text-xl text-black mb-4">Meu Plano</h2>
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium text-black">{plano.nome}</span>
              </p>
              <p className="text-gray-text">
                Duração: {plano.duracao_meses} meses
              </p>
              <p className="text-gray-text">
                Status: <span className="text-green-600 font-medium">Ativo</span>
              </p>
            </div>
          </div>
        )}

        {/* Termos */}
        <div className="bg-white border border-gray-faint rounded-2xl p-8 mb-8">
          <h2 className="font-display text-xl text-black mb-4">Documentos</h2>
          <a
            href="#"
            className="text-black hover:underline font-medium text-sm"
          >
            📄 Ler Termos de Mentoria
          </a>
        </div>

        {/* Botões */}
        <div className="flex gap-4">
          <button
            onClick={handleSalvarPerfil}
            disabled={salvando}
            className="bg-brown-deep text-white px-6 py-3 rounded-lg font-medium hover:bg-brown transition-colors disabled:opacity-50"
          >
            {salvando ? 'Salvando...' : 'Salvar Alterações'}
          </button>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 border-2 border-brown-deep text-black px-6 py-3 rounded-lg font-medium hover:bg-brown-deep/10 transition-colors"
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
    </StandardLayout>
  );
}
