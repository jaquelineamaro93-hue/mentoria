'use client';

import { Suspense, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, Mail } from 'lucide-react';

function MagicLoginContent() {
  const router = useRouter();
  const [stage, setStage] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/send-magic-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSucesso('Código enviado! Verifique seu email.');
      setStage('code');
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao enviar código');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify-magic-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSucesso('Código verificado! Redirecionando...');
      setTimeout(() => {
        if (data.loginUrl) {
          window.location.href = data.loginUrl;
        } else {
          router.push('/dashboard');
        }
      }, 1500);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Código inválido');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <p className="font-display text-4xl tracking-wide text-black">
            SOMA <span className="text-mint">MENTORIA</span>
          </p>
          <div className="h-px w-12 bg-brown mx-auto my-3" />
          <p className="text-xs uppercase tracking-[0.25em] text-gray-text">
            Entrar com código
          </p>
        </div>

        {sucesso && stage === 'code' && (
          <div className="bg-green-50 border-2 border-green-300 rounded-2xl p-6 text-center mb-6">
            <CheckCircle2 size={40} className="text-green-600 mx-auto mb-3" />
            <h2 className="font-display text-lg text-green-700 mb-1">Sucesso!</h2>
            <p className="text-sm text-green-600">{sucesso}</p>
          </div>
        )}

        <div className="bg-white border-2 border-gray-faint rounded-2xl p-8">
          {stage === 'email' ? (
            <>
              <h2 className="font-display text-xl text-black mb-1">Entrar</h2>
              <p className="text-sm text-gray-text mb-6">
                Digite seu email para receber um código
              </p>

              {erro && (
                <div className="flex gap-3 bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <AlertCircle size={16} className="text-red-700 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700">{erro}</p>
                </div>
              )}

              <form onSubmit={handleSendCode} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-black mb-2">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full px-4 py-3 border border-gray-faint rounded-lg focus:outline-none focus:border-brown-deep transition-colors"
                    disabled={loading}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brown-deep text-white py-3 rounded-lg font-medium hover:bg-brown transition-colors disabled:opacity-50 mt-6"
                >
                  {loading ? 'Enviando...' : 'Enviar código'}
                </button>
              </form>

              <p className="text-xs text-gray-text text-center mt-6">
                <a href="/login" className="text-black hover:underline font-medium">
                  Voltar ao login
                </a>
              </p>
            </>
          ) : (
            <>
              <h2 className="font-display text-xl text-black mb-1">Seu código</h2>
              <p className="text-sm text-gray-text mb-6">
                Enviamos um código para<br /><strong>{email}</strong>
              </p>

              {erro && (
                <div className="flex gap-3 bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <AlertCircle size={16} className="text-red-700 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700">{erro}</p>
                </div>
              )}

              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-black mb-2">
                    Código (6 dígitos)
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="w-full px-4 py-3 border border-gray-faint rounded-lg focus:outline-none focus:border-brown-deep transition-colors text-center text-2xl tracking-widest font-display"
                    disabled={loading}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="w-full bg-brown-deep text-white py-3 rounded-lg font-medium hover:bg-brown transition-colors disabled:opacity-50 mt-6"
                >
                  {loading ? 'Verificando...' : 'Confirmar código'}
                </button>
              </form>

              <div className="flex gap-3 mt-6 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setStage('email');
                    setSucesso('');
                    setErro('');
                    setCode('');
                  }}
                  className="flex-1 text-black hover:underline font-medium"
                >
                  Usar outro email
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setLoading(true);
                    setErro('');
                    try {
                      const res = await fetch('/api/auth/send-magic-code', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email }),
                      });
                      if (!res.ok) {
                        const data = await res.json();
                        throw new Error(data.error);
                      }
                      setSucesso('Novo código enviado!');
                      setCode('');
                    } catch (err) {
                      setErro(err instanceof Error ? err.message : 'Erro ao reenviar código');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  className="flex-1 text-black hover:underline font-medium disabled:opacity-50"
                >
                  Reenviar código
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MagicLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p>Carregando...</p></div>}>
      <MagicLoginContent />
    </Suspense>
  );
}
