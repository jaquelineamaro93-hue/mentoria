'use client';

import { Suspense, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [stage, setStage] = useState<'email' | 'code' | 'password'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmaSenha, setConfirmaSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
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

      // Código verificado, agora pode redefinir senha
      setStage('password');
      setSucesso('');
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Código inválido');
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setLoading(true);

    try {
      if (novaSenha !== confirmaSenha) {
        throw new Error('As senhas não conferem');
      }

      if (novaSenha.length < 6) {
        throw new Error('A senha deve ter no mínimo 6 caracteres');
      }

      // Primeiro verifica o código novamente (no servidor)
      const verifyRes = await fetch('/api/auth/verify-magic-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      if (!verifyRes.ok) {
        throw new Error('Código expirado. Solicite um novo.');
      }

      const verifyData = await verifyRes.json();

      // Se o código foi verificado com sucesso, agora atualiza a senha
      if (verifyData.loginUrl) {
        // Extrai o session da resposta de verificação do código
        const { error } = await supabase.auth.updateUser({
          password: novaSenha,
        });

        if (error) {
          throw new Error(error.message || 'Erro ao redefinir senha');
        }

        setSucesso('Senha redefinida com sucesso! Redirecionando...');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao redefinir senha');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <p className="font-display text-4xl tracking-wide text-brown-deep">
            SOMA <span className="text-sky-deep">MENTORIA</span>
          </p>
          <div className="h-px w-12 bg-brown mx-auto my-3" />
          <p className="text-xs uppercase tracking-[0.25em] text-ink-faint">
            Redefinir Senha
          </p>
        </div>

        {sucesso && stage !== 'password' ? (
          <div className="bg-white border-2 border-green-500 rounded-2xl p-8 text-center">
            <CheckCircle2 size={48} className="text-green-600 mx-auto mb-4" />
            <h2 className="font-display text-xl text-brown-deep mb-2">Sucesso!</h2>
            <p className="text-sm text-ink-faint">{sucesso}</p>
          </div>
        ) : (
          <div className="bg-white border-2 border-line rounded-2xl p-8">
            {stage === 'email' ? (
              <>
                <h2 className="font-display text-xl text-brown-deep mb-1">Redefinir Senha</h2>
                <p className="text-sm text-ink-faint mb-6">
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
                    <label className="block text-xs font-medium text-brown-deep mb-2">
                      E-mail
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:border-brown-deep transition-colors"
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

                <p className="text-xs text-ink-faint text-center mt-6">
                  <a href="/login" className="text-brown-deep hover:underline font-medium">
                    Voltar ao login
                  </a>
                </p>
              </>
            ) : stage === 'code' ? (
              <>
                <h2 className="font-display text-xl text-brown-deep mb-1">Verificar Código</h2>
                <p className="text-sm text-ink-faint mb-6">
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
                    <label className="block text-xs font-medium text-brown-deep mb-2">
                      Código (6 dígitos)
                    </label>
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      maxLength={6}
                      className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:border-brown-deep transition-colors text-center text-2xl tracking-widest"
                      disabled={loading}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || code.length !== 6}
                    className="w-full bg-brown-deep text-white py-3 rounded-lg font-medium hover:bg-brown transition-colors disabled:opacity-50 mt-6"
                  >
                    {loading ? 'Verificando...' : 'Continuar'}
                  </button>
                </form>

                <p className="text-xs text-ink-faint text-center mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setStage('email');
                      setCode('');
                      setErro('');
                    }}
                    className="text-brown-deep hover:underline font-medium"
                  >
                    Usar outro email
                  </button>
                </p>
              </>
            ) : (
              <>
                <h2 className="font-display text-xl text-brown-deep mb-1">Nova Senha</h2>
                <p className="text-sm text-ink-faint mb-6">
                  Crie uma nova senha para sua conta
                </p>

                {erro && (
                  <div className="flex gap-3 bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <AlertCircle size={16} className="text-red-700 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-700">{erro}</p>
                  </div>
                )}

                {sucesso && (
                  <div className="flex gap-3 bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <CheckCircle2 size={16} className="text-green-700 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-green-700">{sucesso}</p>
                  </div>
                )}

                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-brown-deep mb-2">
                      Nova Senha
                    </label>
                    <input
                      type="password"
                      value={novaSenha}
                      onChange={(e) => setNovaSenha(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:border-brown-deep transition-colors"
                      disabled={loading}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-brown-deep mb-2">
                      Confirmar Senha
                    </label>
                    <input
                      type="password"
                      value={confirmaSenha}
                      onChange={(e) => setConfirmaSenha(e.target.value)}
                      placeholder="Confirme sua nova senha"
                      className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:border-brown-deep transition-colors"
                      disabled={loading}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-brown-deep text-white py-3 rounded-lg font-medium hover:bg-brown transition-colors disabled:opacity-50 mt-6"
                  >
                    {loading ? 'Processando...' : 'Redefinir Senha'}
                  </button>
                </form>

                <p className="text-xs text-ink-faint text-center mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setStage('email');
                      setEmail('');
                      setCode('');
                      setNovaSenha('');
                      setConfirmaSenha('');
                      setErro('');
                    }}
                    className="text-brown-deep hover:underline font-medium"
                  >
                    Recomeçar
                  </button>
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
