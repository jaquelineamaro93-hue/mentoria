'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AlertCircle, CheckCircle2, Eye, EyeOff, Mail } from 'lucide-react';

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
  const [temSessao, setTemSessao] = useState(false);

  useEffect(() => {
    const verificarSessao = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session) {
        setTemSessao(true);
        setStage('reset');
      } else {
        setTemSessao(false);
        setStage('request');
      }
    };

    verificarSessao();
  }, []);

  async function handleSolicitarEmail(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setSucesso(false);

    if (!email) {
      setErro('Digite seu email');
      return;
    }

    setCarregando(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setSucesso(true);
        setEmail('');
      } else {
        setErro('Erro ao enviar email');
      }
    } catch (e) {
      setErro('Erro ao processar');
    }
    setCarregando(false);
  }

  async function handleRedefinirSenha(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setSucesso(false);

    if (!novaSenha || !confirmaSenha) {
      setErro('Preencha todos os campos');
      return;
    }

    if (novaSenha !== confirmaSenha) {
      setErro('As senhas não conferem');
      return;
    }

    if (novaSenha.length < 6) {
      setErro('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    setCarregando(true);

    try {
      const { error } = await supabase.auth.updateUser({ password: novaSenha });

      if (error) {
        setErro(error.message || 'Erro ao redefinir senha');
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
                <div className="flex gap-3">
                  <CheckCircle2 size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-700">Email enviado!</p>
                    <p className="text-sm text-green-600">Verifica sua caixa de entrada</p>
                  </div>
                </div>
              </div>
            )}

            {erro && (
              <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4 mb-6">
                <div className="flex gap-3">
                  <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{erro}</p>
                </div>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-brown-deep mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border-2 border-line rounded-lg focus:outline-none focus:border-brown-deep"
                placeholder="seu@email.com"
              />
            </div>

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
            <p className="text-sm text-ink-faint">Redirecionando para login...</p>
          </div>
        ) : (
          <form onSubmit={handleRedefinirSenha} className="bg-white border-2 border-brown-light rounded-2xl p-8">
            <h2 className="font-display text-xl text-brown-deep mb-6">Redefinir senha</h2>

            {erro && (
              <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4 mb-6">
                <div className="flex gap-3">
                  <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{erro}</p>
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-brown-deep mb-2">Nova senha</label>
              <div className="relative">
                <input
                  type={mostraSenha ? 'text' : 'password'}
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-line rounded-lg focus:outline-none focus:border-brown-deep pr-12"
                />
                <button
                  type="button"
                  onClick={() => setMostraSenha(!mostraSenha)}
                  className="absolute right-3 top-3 text-ink-faint hover:text-brown-deep"
                >
                  {mostraSenha ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-brown-deep mb-2">Confirmar senha</label>
              <input
                type="password"
                value={confirmaSenha}
                onChange={(e) => setConfirmaSenha(e.target.value)}
                className="w-full px-4 py-3 border-2 border-line rounded-lg focus:outline-none focus:border-brown-deep"
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
