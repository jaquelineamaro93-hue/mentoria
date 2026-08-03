'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [novaSenha, setNovaSenha] = useState('');
  const [confirmaSenha, setConfirmaSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);
  const [tokenInvalido, setTokenInvalido] = useState(false);

  useEffect(() => {
    const validarToken = async () => {
      const hash = window.location.hash;
      if (hash) {
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get('access_token');
        const type = params.get('type');

        if (accessToken && type === 'recovery') {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: params.get('refresh_token') || '',
          });

          if (error) {
            setTokenInvalido(true);
            setErro('Link de reset expirado ou inválido. Tente novamente.');
          }
        } else {
          setTokenInvalido(true);
          setErro('Link de reset incompleto. Verifique se você clicou no link completo do email.');
        }
      } else {
        setTokenInvalido(true);
        setErro('Link de reset não encontrado. Clique no link do email para continuar.');
      }
    };

    validarToken();
  }, [supabase.auth, searchParams]);

  async function handleResetPassword(e: React.FormEvent) {
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
      const { error } = await supabase.auth.updateUser({
        password: novaSenha,
      });

      if (error) {
        setErro(error.message || 'Erro ao redefinir senha');
      } else {
        setSucesso(true);
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    } catch (e) {
      console.error(e);
      setErro('Erro ao processar. Tenta de novo.');
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

        {tokenInvalido ? (
          <div className="bg-white border-2 border-red-500 rounded-2xl p-8 text-center">
            <AlertCircle size={48} className="text-red-600 mx-auto mb-4" />
            <h2 className="font-display text-xl text-brown-deep mb-2">Link inválido ou expirado</h2>
            <p className="text-sm text-ink-faint mb-6">{erro}</p>
            <a
              href="/login"
              className="inline-block bg-brown text-white px-6 py-2.5 rounded-lg font-medium hover:bg-brown-deep transition-colors"
            >
              Voltar ao login
            </a>
          </div>
        ) : sucesso ? (
          <div className="bg-white border-2 border-green-500 rounded-2xl p-8 text-center">
            <CheckCircle2 size={48} className="text-green-600 mx-auto mb-4" />
            <h2 className="font-display text-xl text-brown-deep mb-2">Senha redefinida com sucesso!</h2>
            <p className="text-sm text-ink-faint">Redirecionando para login...</p>
          </div>
        ) : (
          <div className="bg-white border-2 border-line rounded-2xl p-8">
            <h2 className="font-display text-xl text-brown-deep mb-1">Redefinir Senha</h2>
            <p className="text-sm text-ink-faint mb-6">Crie uma nova senha para sua conta</p>

            {erro && (
              <div className="flex gap-3 bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <AlertCircle size={16} className="text-red-700 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-700">{erro}</p>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-brown-deep mb-2">Nova Senha</label>
                <input
                  type="password"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:border-brown-deep transition-colors"
                  disabled={carregando}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-brown-deep mb-2">Confirmar Senha</label>
                <input
                  type="password"
                  value={confirmaSenha}
                  onChange={(e) => setConfirmaSenha(e.target.value)}
                  placeholder="Confirme sua nova senha"
                  className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:border-brown-deep transition-colors"
                  disabled={carregando}
                />
              </div>

              <button
                type="submit"
                disabled={carregando || tokenInvalido}
                className="w-full bg-brown-deep text-white py-3 rounded-lg font-medium hover:bg-brown transition-colors disabled:opacity-50 mt-6"
              >
                {carregando ? 'Processando...' : 'Redefinir Senha'}
              </button>
            </form>

            <p className="text-xs text-ink-faint text-center mt-6">
              Lembrou da senha?{' '}
              <a href="/login" className="text-brown-deep hover:underline font-medium">
                Voltar ao login
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p>Carregando...</p></div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
