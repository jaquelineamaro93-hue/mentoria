'use client';
import { useLocale } from '@/components/LocaleProvider';
import { translateCopy } from '@/components/LocalizedText';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';

export default function ResetPasswordPage() {
  const { locale } = useLocale();
  const router = useRouter();
  const supabase = createClient();

  const [stage, setStage] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmaSenha, setConfirmaSenha] = useState('');
  const [mostraSenha, setMostraSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    const verificarSessao = async () => {
      const { data } = await supabase.auth.getSession();
      setStage(data?.session ? 'reset' : 'request');
    };
    verificarSessao();
  }, []);

  async function handleSolicitarEmail(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setSucesso(true);
      } else {
        setErro(translateCopy("Erro ao enviar",locale));
      }
    } catch (e) {
      setErro(translateCopy("Erro ao processar",locale));
    }
    setCarregando(false);
  }

  async function handleRedefinirSenha(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    if (novaSenha !== confirmaSenha) {
      setErro(translateCopy("Senhas não conferem",locale));
      setCarregando(false);
      return;
    }

    if (novaSenha.length < 8) {
      setErro(translateCopy("Mínimo 8 caracteres",locale));
      setCarregando(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password: novaSenha });
      if (error) {
        setErro(error.message);
      } else {
        setSucesso(true);
        setTimeout(() => router.push('/login'), 2000);
      }
    } catch (e) {
      setErro(translateCopy("Erro ao processar",locale));
    }
    setCarregando(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-white flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl text-black mb-2">SOMA Mentoria</h1>
          <p className="text-sm text-gray-text">{translateCopy("Portal do Mentorado",locale)}</p>
        </div>

        {stage === 'request' ? (
          <form onSubmit={handleSolicitarEmail} className="bg-white border-2 border-brown-light rounded-2xl p-8">
            <h2 className="font-display text-xl text-black mb-6">{translateCopy("Esqueci minha senha",locale)}</h2>

            {sucesso && (
              <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4 mb-6">
                <div className="flex gap-2">
                  <CheckCircle2 size={20} className="text-green-600 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-green-700">{translateCopy("Email enviado!",locale)}</p>
                    <p className="text-xs text-green-600">{translateCopy("Verifica sua caixa de entrada",locale)}</p>
                  </div>
                </div>
              </div>
            )}

            {erro && (
              <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4 mb-6">
                <div className="flex gap-2">
                  <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
                  <p className="text-xs text-red-600">{erro}</p>
                </div>
              </div>
            )}

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full px-4 py-3 border-2 border-gray-faint rounded-lg mb-6 focus:outline-none focus:border-brown-deep"
              disabled={carregando}
            />

            <button
              type="submit"
              disabled={carregando}
              className="w-full bg-brown-deep text-white py-3 rounded-lg font-medium hover:bg-brown transition-colors disabled:opacity-50"
            >
              {carregando ? translateCopy("Enviando...",locale) : translateCopy("Enviar link de reset",locale)}
            </button>
          </form>
        ) : sucesso ? (
          <div className="bg-white border-2 border-green-500 rounded-2xl p-8 text-center">
            <CheckCircle2 size={48} className="text-green-600 mx-auto mb-4" />
            <h2 className="font-display text-xl text-black mb-2">{translateCopy("Senha redefinida!",locale)}</h2>
            <p className="text-sm text-gray-text">{translateCopy("Redirecionando...",locale)}</p>
          </div>
        ) : (
          <form onSubmit={handleRedefinirSenha} className="bg-white border-2 border-brown-light rounded-2xl p-8">
            <h2 className="font-display text-xl text-black mb-6">{translateCopy("Redefinir senha",locale)}</h2>

            {erro && (
              <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4 mb-6">
                <div className="flex gap-2">
                  <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
                  <p className="text-xs text-red-600">{erro}</p>
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-xs font-medium text-black mb-2">{translateCopy("Nova senha",locale)}</label>
              <div className="relative">
                <input
                  type={mostraSenha ? 'text' : 'password'}
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-faint rounded-lg pr-10 focus:outline-none focus:border-brown-deep"
                  disabled={carregando}
                />
                <button
                  type="button"
                  onClick={() => setMostraSenha(!mostraSenha)}
                  className="absolute right-3 top-3 text-gray-text hover:text-black"
                >
                  {mostraSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-medium text-black mb-2">{translateCopy("Confirmar senha",locale)}</label>
              <input
                type="password"
                value={confirmaSenha}
                onChange={(e) => setConfirmaSenha(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-faint rounded-lg focus:outline-none focus:border-brown-deep"
                disabled={carregando}
              />
            </div>

            <button
              type="submit"
              disabled={carregando}
              className="w-full bg-brown-deep text-white py-3 rounded-lg font-medium hover:bg-brown transition-colors disabled:opacity-50"
            >
              {carregando ? translateCopy("Processando...",locale) : translateCopy("Redefinir senha",locale)}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
