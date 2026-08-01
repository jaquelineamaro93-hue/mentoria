'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { posthog, identificarMentorado } from '@/lib/posthog';
import type { TipoPacote } from '@/lib/types';

type Modo = 'entrar' | 'cadastrar';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [modo, setModo] = useState<Modo>('entrar');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

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
    }

    router.push('/dashboard');
    router.refresh();
  }

  async function handleCadastrar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setSucesso(null);
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
    });

    if (error) {
      setLoading(false);
      posthog.capture('cadastro_falhou', { email });
      setErro('Não foi possível criar sua conta. Verifique os dados e tente novamente.');
      return;
    }

    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        nome,
        email,
        tipo_pacote: tipoPacote,
      });
      identificarMentorado(data.user.id, { email, nome, tipo_pacote: tipoPacote });
      posthog.capture('cadastro_realizado', { tipo_pacote: tipoPacote });
    }

    setLoading(false);
    setSucesso('Conta criada! Verifique seu e-mail para confirmar o acesso.');
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-6 py-12 relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(184,146,74,0.12), transparent)',
        }}
      />

      <div className="w-full max-w-md relative">
        <div className="text-center mb-10">
          <p className="font-display text-4xl tracking-wide text-gold-300">SOMA</p>
          <div className="h-px w-12 bg-gold-500/60 mx-auto my-3" />
          <p className="text-xs uppercase tracking-[0.25em] text-cream-faint">
            Portal do Mentorado
          </p>
        </div>

        <div className="rounded-xl border border-line-soft bg-panel-raised/70 backdrop-blur-sm overflow-hidden">
          <div className="grid grid-cols-2">
            <button
              onClick={() => {
                setModo('entrar');
                setErro(null);
                setSucesso(null);
              }}
              className={`py-4 text-sm tracking-wide transition-colors ${
                modo === 'entrar'
                  ? 'text-gold-300 border-b-2 border-gold-400 bg-gold-500/5'
                  : 'text-cream-faint border-b border-line-soft hover:text-cream-dim'
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
                  ? 'text-gold-300 border-b-2 border-gold-400 bg-gold-500/5'
                  : 'text-cream-faint border-b border-line-soft hover:text-cream-dim'
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
                  <input
                    type="password"
                    required
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="input"
                    placeholder="••••••••"
                  />
                </Field>

                {erro && <Alert tipo="erro">{erro}</Alert>}

                <button type="submit" disabled={loading} className="btn-primary mt-2">
                  {loading ? 'Entrando...' : 'Entrar'}
                </button>

                <button
                  type="button"
                  className="text-xs text-cream-faint hover:text-gold-300 transition-colors text-center mt-1"
                  onClick={() => setErro('Envio de recuperação de senha ainda não configurado neste MVP.')}
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
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="input"
                    placeholder="Mínimo 6 caracteres"
                  />
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
          background: var(--color-panel);
          border: 1px solid var(--color-line);
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 14px;
          color: var(--color-cream);
        }
        .input:focus {
          border-color: var(--color-gold-500);
        }
        .btn-primary {
          width: 100%;
          background: var(--color-gold-400);
          color: #100d12;
          font-weight: 600;
          font-size: 14px;
          padding: 11px 16px;
          border-radius: 8px;
          transition: background 0.15s ease;
        }
        .btn-primary:hover {
          background: var(--color-gold-300);
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
      <span className="text-xs uppercase tracking-wide text-cream-faint">{label}</span>
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
          ? 'bg-red-500/10 border-red-500/30 text-red-300'
          : 'bg-green-500/10 border-green-500/30 text-green-300'
      }`}
    >
      {children}
    </div>
  );
}
