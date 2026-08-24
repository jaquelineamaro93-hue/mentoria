'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

interface ForgotPasswordProps {
  onBack: () => void;
}

export function ForgotPassword({ onBack }: ForgotPasswordProps) {
  const [email, setEmail] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setSucesso(false);

    if (!email) {
      setErro('Digite seu email');
      return;
    }

    setCarregando(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setSucesso(true);
        setEmail('');
      } else {
        const data = await res.json();
        setErro(data.error || 'Erro ao enviar email');
      }
    } catch (e) {
      console.error(e);
      setErro('Erro ao processar. Tenta de novo.');
    }
    setCarregando(false);
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="font-display text-3xl text-black mb-2">SOMA Mentoria</h1>
        <p className="text-sm text-gray-text">Portal do Mentorado</p>
      </div>

      <div className="bg-white border-2 border-gray-faint rounded-2xl p-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-black hover:text-orange mb-6 font-medium"
        >
          <ArrowLeft size={16} />
          Voltar ao login
        </button>

        <h2 className="font-display text-xl text-black mb-1">Esqueci a Senha</h2>
        <p className="text-sm text-gray-text mb-6">
          Digite seu email e enviaremos um link para redefinir sua senha
        </p>

        {sucesso ? (
          <div className="flex gap-3 bg-green-50 border border-green-200 rounded-lg p-4">
            <CheckCircle2 size={16} className="text-green-700 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-700">Email enviado!</p>
              <p className="text-xs text-green-600 mt-1">
                Verifique sua caixa de entrada (e spam) para o link de reset
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            {erro && (
              <div className="flex gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
                <AlertCircle size={16} className="text-red-700 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-700">{erro}</p>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-black mb-2">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                className="w-full px-4 py-3 border border-gray-faint rounded-lg focus:outline-none focus:border-brown-deep transition-colors"
                disabled={carregando}
              />
            </div>

            <button
              type="submit"
              disabled={carregando}
              className="w-full bg-brown-deep text-white py-3 rounded-lg font-medium hover:bg-brown transition-colors disabled:opacity-50"
            >
              {carregando ? 'Enviando...' : 'Enviar Link de Reset'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
