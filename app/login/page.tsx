'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { posthog, identificarMentorado } from '@/lib/posthog';
import type { TipoPacote } from '@/lib/types';

type Modo = 'entrar' | 'cadastrar';

function traduzirErroCadastro(mensagem: string): string {
  const m = mensagem.toLowerCase();
  if (m.includes('already registered') || m.includes('already exists')) {
    return 'Esse e-mail já tem uma conta. Tenta entrar, ou usa "Esqueci a senha" se não lembrar.';
  }
  if (m.includes('invalid') && m.includes('email')) {
    return 'Esse e-mail parece inválido. Confere se digitou certo.';
  }
  if (m.includes('password') && (m.includes('weak') || m.includes('easy to guess'))) {
    return 'Essa senha é fácil demais de adivinhar. Escolhe uma senha diferente.';
  }
  if (m.includes('password') && m.includes('least')) {
    return 'A senha precisa ter pelo menos 6 caracteres.';
  }
  if (m.includes('rate limit') || m.includes('security purposes')) {
    return 'Muitas tentativas seguidas. Espera um minuto e tenta de novo.';
  }
  // Sem tradução conhecida: mostra o texto original em vez de esconder o
  // motivo real, pra não deixar a pessoa (ou o suporte) no escuro.
  return `Não consegui criar sua conta: ${mensagem}`;
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const codigoIndicacao = searchParams.get('ref');
  const supabase = createClient();

  const [modo, setModo] = useState<Modo>('entrar');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [tipoPacote, setTipoPacote] = useState<TipoPacote>('online');

  async function handleEntrar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });

    setLoading(false);
    if (error) {
      posthog.capture('login_falhou', { email });
      setErro('E-mail ou senha incorretos. Confira os dados e tente de novo.');
      return;
    }

    if (data.user) {
      identificarMentorado(data.user.id, { email: data.user.email });
      posthog.capture('login_realizado');
      await supabase
        .from('profiles')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', data.user.id);
    }

    router.push('/dashboard');
    router.refresh();
  }

  async function handleCadastrar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setSucesso(null);
    setLoading(true);

    let resultado;
    try {
      resultado = await supabase.auth.signUp({
        email,
        password: senha,
        options: {
          data: { nome, tipo_pacote: tipoPacote, codigo_indicacao_referencia: codigoIndicacao },
        },
      });
    } catch (excecao) {
      // Erro de rede (ex: conexão instável, bloqueio de firewall/ad-blocker
      // pro domínio do Supabase) faz o fetch falhar antes de sair do
      // navegador, então nunca chega a virar log no servidor.
      setLoading(false);
      const mensagem = excecao instanceof Error ? excecao.message : String(excecao);
      posthog.capture('cadastro_falhou', { email, motivo: mensagem, tipo: 'rede' });
      setErro(
        'Não consegui me conectar pra criar sua conta. Confere sua internet (ou desativa um ' +
          'bloqueador de anúncios/VPN, se tiver algum ativo) e tenta de novo.'
      );
      return;
    }

    const { data, error } = resultado;

    if (error) {
      setLoading(false);
      posthog.capture('cadastro_falhou', { email, motivo: error.message, status: error.status });
      setErro(traduzirErroCadastro(error.message));
      return;
    }

    // Quando o e-mail já está cadastrado, o Supabase não retorna erro (pra
    // não revelar se o e-mail existe), só devolve um usuário com
    // identities vazio. Nesse caso não é um cadastro novo de verdade.
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      setLoading(false);
      setErro('Esse e-mail já tem uma conta. Tenta entrar, ou usa "Esqueci a senha" se não lembrar.');
      return;
    }

    if (data.user) {
      // O perfil é criado automaticamente por um trigger no banco a partir
      // dos metadados enviados acima (nome, tipo_pacote), então não
      // precisamos (e não devemos) inserir manualmente aqui: se a sessão
      // ainda não estiver confirmada, esse insert falharia por RLS sem
      // que o usuário percebesse.
      identificarMentorado(data.user.id, { email, nome, tipo_pacote: tipoPacote });
      posthog.capture('cadastro_realizado', { tipo_pacote: tipoPacote });

      // Confirma o cadastro pelo servidor e já entra direto, em vez de
      // depender do envio do e-mail de confirmação (instável e já travou
      // cadastros legítimos várias vezes). Se por algum motivo essa etapa
      // falhar, cai pro fluxo antigo (pede pra checar o e-mail).
      try {
        const res = await fetch('/api/auth/confirmar-cadastro', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: data.user.id }),
        });

        if (res.ok) {
          const { error: erroLogin } = await supabase.auth.signInWithPassword({
            email,
            password: senha,
          });

          if (!erroLogin) {
            posthog.capture('login_realizado');
            setLoading(false);
            router.push('/dashboard');
            router.refresh();
            return;
          }
        }
      } catch {
        // segue pro fluxo de "verifique seu e-mail" abaixo
      }
    }

    setLoading(false);
    setSucesso('Conta criada! Verifique seu e-mail para confirmar o acesso.');
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-6 py-12 relative overflow-hidden">
      <div className="w-full max-w-md relative">
        <div className="text-center mb-10">
          <p className="font-display text-4xl tracking-wide text-brown-deep">
            SOMA <span className="text-sky-deep">MENTORIA</span>
          </p>
          <div className="h-px w-12 bg-brown mx-auto my-3" />
          <p className="text-xs uppercase tracking-[0.25em] text-ink-faint">
            Portal do Mentorado
          </p>
        </div>

        <div className="rounded-xl border border-line bg-paper overflow-hidden">
          <div className="grid grid-cols-2">
            <button
              onClick={() => {
                setModo('entrar');
                setErro(null);
                setSucesso(null);
              }}
              className={`py-4 text-sm tracking-wide transition-colors ${
                modo === 'entrar'
                  ? 'text-brown-deep border-b-2 border-brown bg-sky-tint'
                  : 'text-ink-faint border-b border-line hover:text-ink-soft'
              }`}
            >
              Entrar
            </button>
            <button
              onClick={() => {
                setModo('cadastrar');
                setErro(null);
                setSucesso(null);
              }}
              className={`py-4 text-sm tracking-wide transition-colors ${
                modo === 'cadastrar'
                  ? 'text-brown-deep border-b-2 border-brown bg-sky-tint'
                  : 'text-ink-faint border-b border-line hover:text-ink-soft'
              }`}
            >
              Criar Conta
            </button>
          </div>

          <div className="p-8">
            {modo === 'entrar' ? (
              <form onSubmit={handleEntrar} className="flex flex-col gap-4">
                <Field label="E-mail">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input"
                    placeholder="voce@email.com"
                  />
                </Field>
                <Field label="Senha">
                  <div className="relative">
                    <input
                      type={mostrarSenha ? 'text' : 'password'}
                      required
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      className="input"
                      style={{ paddingRight: 40 }}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarSenha(!mostrarSenha)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-brown-deep"
                    >
                      {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </Field>

                {erro && <Alert tipo="erro">{erro}</Alert>}

                <button type="submit" disabled={loading} className="btn-primary mt-2">
                  {loading ? 'Entrando...' : 'Entrar'}
                </button>

                <button
                  type="button"
                  className="text-xs text-ink-faint hover:text-brown transition-colors text-center mt-1"
                  onClick={() => router.push('/magic-login')}
                >
                  Esqueci a senha
                </button>
              </form>
            ) : (
              <form onSubmit={handleCadastrar} className="flex flex-col gap-4">
                <Field label="Nome completo">
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="input"
                    placeholder="Seu nome"
                  />
                </Field>
                <Field label="E-mail">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input"
                    placeholder="voce@email.com"
                  />
                </Field>
                <Field label="Tipo de pacote">
                  <select
                    value={tipoPacote}
                    onChange={(e) => setTipoPacote(e.target.value as TipoPacote)}
                    className="input"
                  >
                    <option value="online">Online</option>
                    <option value="presencial">Presencial</option>
                  </select>
                </Field>
                <Field label="Senha">
                  <div className="relative">
                    <input
                      type={mostrarSenha ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      className="input"
                      style={{ paddingRight: 40 }}
                      placeholder="Mínimo 6 caracteres"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarSenha(!mostrarSenha)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-brown-deep"
                    >
                      {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </Field>

                {erro && <Alert tipo="erro">{erro}</Alert>}
                {sucesso && <Alert tipo="sucesso">{sucesso}</Alert>}

                <button type="submit" disabled={loading} className="btn-primary mt-2">
                  {loading ? 'Criando conta...' : 'Cadastrar'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .input {
          width: 100%;
          background: var(--color-cream);
          border: 1px solid var(--color-line);
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 14px;
          color: var(--color-ink);
        }
        .input:focus {
          border-color: var(--color-sky-deep);
        }
        .btn-primary {
          width: 100%;
          background: var(--color-brown);
          color: var(--color-paper);
          font-weight: 600;
          font-size: 14px;
          padding: 11px 16px;
          border-radius: 8px;
          transition: background 0.15s ease;
        }
        .btn-primary:hover {
          background: var(--color-brown-deep);
        }
        .btn-primary:disabled {
          opacity: 0.6;
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs uppercase tracking-wide text-ink-faint">{label}</span>
      {children}
    </label>
  );
}

function Alert({ tipo, children }: { tipo: 'erro' | 'sucesso'; children: React.ReactNode }) {
  const isErro = tipo === 'erro';
  return (
    <div
      className={`text-sm rounded-md px-4 py-3 border ${
        isErro
          ? 'bg-red-50 border-red-300 text-red-700'
          : 'bg-green-50 border-green-300 text-green-700'
      }`}
    >
      {children}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center">
      <div className="text-center">
        <p className="text-ink-soft">Carregando...</p>
      </div>
    </div>
  );
}
