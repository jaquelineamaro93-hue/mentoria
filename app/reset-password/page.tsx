'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [novaSenha, setNovaSenha] = useState('');
  const [confirmaSenha, setConfirmaSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);
  const [tokenValido, setTokenValido] = useState(false);

  // Verifica se o token está na URL
  useEffect(() => {
    const verificarToken = async () => {
      const { data } = await supabase.auth.getSession();
      
      if (data?.session) {
        setTokenValido(true);
      } else {
        setErro('Link inválido ou expirado. Solicite um novo link de reset.');
      }
    };

    verificarToken();
  }, []);

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

        {sucesso ? (
          <div className="bg-white border-2 border-green-500 rounded-2xl p-8 text-center">
            <CheckCircle2 size={48} className="text-green-600 mx-auto mb-4" />
            <h2 className="font-display text-xl text-brown-deep mb-2">Senha redefinida com sucesso!</h2>
            <p className="text-sm text-ink-faint">Redirecionando para login...</p>
          </div>
        ) : !tokenValido ? (
          <div className="bg-white border-2 border-red-500 rounded-2xl p-8">
            <div className="flex gap-3 mb-6">
              <AlertCircle size={20} className="text-red-700 flex-shrink-0" />
              <div>
                <h2 className="font-display text-lg text-red-700 mb-1">Link Inválido</h2>
                <p className="text-sm text-red-600">{erro}</p>
              </div>
            </div>

            <a
              href="/login"
              className="block text-center bg-brown-deep text-white py-3 rounded-lg font-medium hover:bg-brown transition-colors"
            >
              Voltar ao Login
            </a>
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
                disabled={carregando}
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
