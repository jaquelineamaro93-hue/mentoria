'use client';

import { useState } from 'react';

type Modo = 'entrar' | 'cadastrar';

export default function AuthPage() {
  const [modo, setModo] = useState<Modo>('entrar');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [tipoPacote, setTipoPacote] = useState('online');

  async function handleEntrar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) throw new Error('Erro ao enviar link');
      setSucesso('Link de acesso enviado para seu email. Verifique sua caixa de entrada.');
      setEmail('');
    } catch (err) {
      setErro('Não conseguimos enviar o link. Verifique o email e tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCadastrar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setSucesso(null);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, senha, tipo_pacote: tipoPacote }),
      });

      if (!response.ok) throw new Error('Erro ao criar conta');
      setSucesso('Conta criada com sucesso! Verifique seu email para ativar o acesso.');
      setNome('');
      setEmail('');
      setSenha('');
    } catch (err) {
      setErro('Não conseguimos criar a conta. Tente novamente em alguns instantes.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-6 py-12 relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(75, 160, 180, 0.15), transparent)',
        }}
      />

      <div className="w-full max-w-sm relative">
        {/* Brand */}
        <div className="text-center mb-12">
          <p className="font-display text-5xl tracking-wide text-amber-900" style={{ color: '#6b4a35', fontStyle: 'italic' }}>
            Mentoria
          </p>
          <div className="h-px w-16 bg-blue-300 mx-auto my-4" style={{ backgroundColor: '#4A90A4' }} />
          <p className="text-xs uppercase tracking-widest text-gray-600">Portal de Desenvolvimento Profissional</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-200 bg-white/95 backdrop-blur-sm overflow-hidden shadow-lg">
          {/* Tabs */}
          <div className="grid grid-cols-2 border-b border-gray-200">
            <button
              onClick={() => {
                setModo('entrar');
                setErro(null);
                setSucesso(null);
              }}
              className={`py-4 px-6 text-sm font-medium tracking-wider transition-all ${
                modo === 'entrar'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-500 border-b border-gray-200 hover:text-gray-700'
              }`}
              style={{
                color: modo === 'entrar' ? '#4A90A4' : '#999',
                borderBottomColor: modo === 'entrar' ? '#4A90A4' : '#ddd',
                backgroundColor: modo === 'entrar' ? '#f0f7fc' : 'transparent',
              }}
            >
              Entrar
            </button>
            <button
              onClick={() => {
                setModo('cadastrar');
                setErro(null);
                setSucesso(null);
              }}
              className={`py-4 px-6 text-sm font-medium tracking-wider transition-all ${
                modo === 'cadastrar'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-500 border-b border-gray-200 hover:text-gray-700'
              }`}
              style={{
                color: modo === 'cadastrar' ? '#4A90A4' : '#999',
                borderBottomColor: modo === 'cadastrar' ? '#4A90A4' : '#ddd',
                backgroundColor: modo === 'cadastrar' ? '#f0f7fc' : 'transparent',
              }}
            >
              Criar Conta
            </button>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Entrar */}
            {modo === 'entrar' && (
              <form onSubmit={handleEntrar} className="flex flex-col gap-5">
                <label className="flex flex-col gap-2">
                  <span className="text-xs uppercase tracking-widest text-gray-600" style={{ color: '#4A90A4', fontWeight: '500' }}>
                    Email
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@email.com"
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-sm font-normal focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all"
                    style={{ borderColor: '#D2B48C', color: '#333' }}
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-xs uppercase tracking-widest text-gray-600" style={{ color: '#4A90A4', fontWeight: '500' }}>
                    Senha
                  </span>
                  <input
                    type="password"
                    required
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-sm font-normal focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all"
                    style={{ borderColor: '#D2B48C', color: '#333' }}
                  />
                </label>

                {erro && (
                  <div className="text-sm rounded-lg px-4 py-3 border bg-red-50 border-red-200 text-red-700">
                    {erro}
                  </div>
                )}

                {sucesso && (
                  <div className="text-sm rounded-lg px-4 py-3 border bg-green-50 border-green-200 text-green-700">
                    {sucesso}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 px-4 rounded-lg font-medium text-white text-sm tracking-wide transition-all"
                  style={{
                    background: '#4A90A4',
                    opacity: loading ? 0.7 : 1,
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                  onMouseEnter={(e) => !loading && (e.currentTarget.style.background = '#3A7A94')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#4A90A4')}
                >
                  {loading ? 'Entrando...' : 'Entrar'}
                </button>

                <button
                  type="button"
                  className="text-xs text-gray-500 hover:text-blue-600 transition-colors text-center mt-2 font-light"
                  style={{ color: '#8B7355' }}
                  onClick={() => setErro('Recuperação de senha será implementada em breve.')}
                >
                  Esqueci a senha
                </button>

                <p className="text-xs text-gray-500 text-center mt-4" style={{ color: '#8B7355', fontFamily: 'Times New Roman, serif', fontStyle: 'italic' }}>
                  Você receberá um link seguro para acessar o portal
                </p>
              </form>
            )}

            {/* Cadastrar */}
            {modo === 'cadastrar' && (
              <form onSubmit={handleCadastrar} className="flex flex-col gap-5">
                <label className="flex flex-col gap-2">
                  <span className="text-xs uppercase tracking-widest text-gray-600" style={{ color: '#4A90A4', fontWeight: '500' }}>
                    Nome completo
                  </span>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-sm font-normal focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all"
                    style={{ borderColor: '#D2B48C', color: '#333' }}
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-xs uppercase tracking-widest text-gray-600" style={{ color: '#4A90A4', fontWeight: '500' }}>
                    Email
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@email.com"
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-sm font-normal focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all"
                    style={{ borderColor: '#D2B48C', color: '#333' }}
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-xs uppercase tracking-widest text-gray-600" style={{ color: '#4A90A4', fontWeight: '500' }}>
                    Tipo de pacote
                  </span>
                  <select
                    value={tipoPacote}
                    onChange={(e) => setTipoPacote(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-sm font-normal focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all"
                    style={{ borderColor: '#D2B48C', color: '#333' }}
                  >
                    <option value="online">Online</option>
                    <option value="presencial">Presencial</option>
                  </select>
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-xs uppercase tracking-widest text-gray-600" style={{ color: '#4A90A4', fontWeight: '500' }}>
                    Senha
                  </span>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-sm font-normal focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all"
                    style={{ borderColor: '#D2B48C', color: '#333' }}
                  />
                </label>

                {erro && (
                  <div className="text-sm rounded-lg px-4 py-3 border bg-red-50 border-red-200 text-red-700">
                    {erro}
                  </div>
                )}

                {sucesso && (
                  <div className="text-sm rounded-lg px-4 py-3 border bg-green-50 border-green-200 text-green-700">
                    {sucesso}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 px-4 rounded-lg font-medium text-white text-sm tracking-wide transition-all"
                  style={{
                    background: '#4A90A4',
                    opacity: loading ? 0.7 : 1,
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                  onMouseEnter={(e) => !loading && (e.currentTarget.style.background = '#3A7A94')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#4A90A4')}
                >
                  {loading ? 'Criando conta...' : 'Cadastrar'}
                </button>

                <p className="text-xs text-gray-500 text-center mt-4" style={{ color: '#8B7355', fontFamily: 'Times New Roman, serif', fontStyle: 'italic' }}>
                  Suas informações são protegidas e confidenciais
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
