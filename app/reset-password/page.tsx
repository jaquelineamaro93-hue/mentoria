'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';

export default function ResetPasswordPage() {
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
        setErro('Erro ao enviar');
      }
    } catch (e) {
      setErro('Erro ao processar');
    }
    setCarregando(false);
  }

  async function handleRedefinirSenha(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    if (novaSenha !== confirmaSenha) {
      setErro('Senhas não conferem');
      setCarregando(false);
      return;
    }

    if (novaSenha.length < 6) {
      setErro('Mínimo 6 caracteres');
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
      setErro('Erro ao processar');
    }
    setCarregando(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream to-white flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl text-brown-deep mb-2">SOMA Mentoria</h1>
          <p className="text-sm text-ink-faint">Portal do Mentorado</p>
        </div>

        {stage === 'request' ? (
          <form onSubmit={handleSolicitarEmail} className="bg-white border-2 border-brown-light rounded-2xl p-8">
            <h2 className="font-display text-xl text-brown-deep mb-6">Esqueci minha senha</h2>

            {sucesso && (
              <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4 mb-6">
                <div className="flex gap-2">
                  <CheckCircle2 size={20} className="text-green-600 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-green-700">Email enviado!</p>
                    <p className="text-xs text-green-600">Verifica sua caixa de entrada</p>
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
              className="w-full px-4 py-3 border-2 border-line rounded-lg mb-6 focus:outline-none focus:border-brown-deep"
              disabled={carregando}
            />

            <button
              type="submit"
              disabled={carregando}
              className="w-full bg-brown-deep text-white py-3 rounded-lg font-medium hover:bg-brown transition-colors disabled:opacity-50"
            >
              {carregando ? 'Enviando...' : 'Enviar link de reset'}
            </button>
          </form>
        ) : sucesso ? (
          <div className="bg-white border-2 border-green-500 rounded-2xl p-8 text-center">
            <CheckCircle2 size={48} className="text-green-600 mx-auto mb-4" />
            <h2 className="font-display text-xl text-brown-deep mb-2">Senha redefinida!</h2>
            <p className="text-sm text-ink-faint">Redirecionando...</p>
          </div>
        ) : (
          <form onSubmit={handleRedefinirSenha} className="bg-white border-2 border-brown-light rounded-2xl p-8">
            <h2 className="font-display text-xl text-brown-deep mb-6">Redefinir senha</h2>

            {erro && (
              <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4 mb-6">
                <div className="flex gap-2">
                  <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
                  <p className="text-xs text-red-600">{erro}</p>
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-xs font-medium text-brown-deep mb-2">Nova senha</label>
              <div className="relative">
                <input
                  type={mostraSenha ? 'text' : 'password'}
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-line rounded-lg pr-10 focus:outline-none focus:border-brown-deep"
                  disabled={carregando}
                />
                <button
                  type="button"
                  onClick={() => setMostraSenha(!mostraSenha)}
                  className="absolute right-3 top-3 text-ink-faint hover:text-brown-deep"
                >
                  {mostraSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-medium text-brown-deep mb-2">Confirmar senha</label>
              <input
                type="password"
                value={confirmaSenha}
                onChange={(e) => setConfirmaSenha(e.target.value)}
                className="w-full px-4 py-3 border-2 border-line rounded-lg focus:outline-none focus:border-brown-deep"
                disabled={carregando}
              />
            </div>

            <button
              type="submit"
              disabled={carregando}
              className="w-full bg-brown-deep text-white py-3 rounded-lg font-medium hover:bg-brown transition-colors disabled:opacity-50"
            >
              {carregando ? 'Processando...' : 'Redefinir senha'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
