'use client';

import { useState, FormEvent } from 'react';

type AuthTab = 'login' | 'signup';

export default function AuthPage() {
  const [tab, setTab] = useState<AuthTab>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail }),
      });

      if (!response.ok) throw new Error('Erro ao enviar link');
      setSuccess('Link de acesso enviado para seu email');
      setLoginEmail('');
    } catch (err) {
      setError('Não conseguimos enviar o link. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (signupPassword !== signupConfirm) {
      setError('As senhas não conferem');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: signupName,
          email: signupEmail,
          password: signupPassword,
        }),
      });

      if (!response.ok) throw new Error('Erro ao criar conta');
      setSuccess('Conta criada! Verifique seu email para ativar.');
      setSignupName('');
      setSignupEmail('');
      setSignupPassword('');
      setSignupConfirm('');
    } catch (err) {
      setError('Não conseguimos criar a conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #87CEEB 0%, #D2B48C 100%)' }}
    >
      <div
        className="w-full max-w-md"
        style={{
          background: '#FFFAF0',
          borderRadius: '16px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #4A90A4 0%, #6BA3B8 100%)',
            padding: '32px 24px',
            textAlign: 'center',
            color: 'white',
          }}
        >
          <h1 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 8px 0', fontFamily: 'Poppins, sans-serif' }}>
            Mentoria
          </h1>
          <p style={{ fontSize: '13px', margin: '0', opacity: '0.9', fontFamily: 'Times New Roman, serif', fontStyle: 'italic' }}>
            Seu desenvolvimento profissional começa aqui
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #D2B48C' }}>
          <button
            onClick={() => setTab('login')}
            style={{
              flex: 1,
              padding: '16px',
              background: tab === 'login' ? '#F5F5F5' : 'transparent',
              border: 'none',
              borderBottom: tab === 'login' ? '3px solid #4A90A4' : 'none',
              fontSize: '14px',
              fontWeight: '600',
              color: tab === 'login' ? '#4A90A4' : '#8B7355',
              cursor: 'pointer',
              fontFamily: 'Poppins, sans-serif',
              transition: 'all 0.3s',
            }}
          >
            Entrar
          </button>
          <button
            onClick={() => setTab('signup')}
            style={{
              flex: 1,
              padding: '16px',
              background: tab === 'signup' ? '#F5F5F5' : 'transparent',
              border: 'none',
              borderBottom: tab === 'signup' ? '3px solid #4A90A4' : 'none',
              fontSize: '14px',
              fontWeight: '600',
              color: tab === 'signup' ? '#4A90A4' : '#8B7355',
              cursor: 'pointer',
              fontFamily: 'Poppins, sans-serif',
              transition: 'all 0.3s',
            }}
          >
            Criar Conta
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '32px 24px' }}>
          {/* Alerts */}
          {error && (
            <div
              style={{
                background: '#FFF5F5',
                border: '1px solid #FC8181',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px',
                fontSize: '13px',
                color: '#742A2A',
                fontFamily: 'Times New Roman, serif',
                lineHeight: '1.5',
              }}
            >
              {error}
            </div>
          )}

          {success && (
            <div
              style={{
                background: '#F0FFF4',
                border: '1px solid #9AE6B4',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px',
                fontSize: '13px',
                color: '#22543D',
                fontFamily: 'Times New Roman, serif',
                lineHeight: '1.5',
              }}
            >
              {success}
            </div>
          )}

          {/* Login Tab */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#4A90A4',
                    marginBottom: '6px',
                    fontFamily: 'Poppins, sans-serif',
                  }}
                >
                  Email
                </label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="voce@email.com"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #D2B48C',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'Poppins, sans-serif',
                    boxSizing: 'border-box',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#4A90A4')}
                  onBlur={(e) => (e.target.style.borderColor = '#D2B48C')}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#4A90A4',
                    marginBottom: '6px',
                    fontFamily: 'Poppins, sans-serif',
                  }}
                >
                  Senha
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #D2B48C',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'Poppins, sans-serif',
                    boxSizing: 'border-box',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#4A90A4')}
                  onBlur={(e) => (e.target.style.borderColor = '#D2B48C')}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '11px',
                  background: '#4A90A4',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  fontFamily: 'Poppins, sans-serif',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? '0.7' : '1',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) =>
                  !loading && (e.currentTarget.style.background = '#3A7A94')
                }
                onMouseLeave={(e) => (e.currentTarget.style.background = '#4A90A4')}
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>

              <button
                type="button"
                style={{
                  padding: '10px',
                  background: 'transparent',
                  color: '#4A90A4',
                  border: '1px solid #D2B48C',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '500',
                  fontFamily: 'Poppins, sans-serif',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#F5F5F5';
                  e.currentTarget.style.borderColor = '#4A90A4';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = '#D2B48C';
                }}
              >
                Esqueci a senha
              </button>

              <p
                style={{
                  fontSize: '12px',
                  color: '#8B7355',
                  textAlign: 'center',
                  margin: '8px 0 0 0',
                  fontFamily: 'Times New Roman, serif',
                  lineHeight: '1.5',
                }}
              >
                Você receberá um link seguro para acessar o portal
              </p>
            </form>
          )}

          {/* Signup Tab */}
          {tab === 'signup' && (
            <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#4A90A4',
                    marginBottom: '6px',
                    fontFamily: 'Poppins, sans-serif',
                  }}
                >
                  Nome completo
                </label>
                <input
                  type="text"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  placeholder="Seu nome"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #D2B48C',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'Poppins, sans-serif',
                    boxSizing: 'border-box',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#4A90A4')}
                  onBlur={(e) => (e.target.style.borderColor = '#D2B48C')}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#4A90A4',
                    marginBottom: '6px',
                    fontFamily: 'Poppins, sans-serif',
                  }}
                >
                  Email
                </label>
                <input
                  type="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="voce@email.com"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #D2B48C',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'Poppins, sans-serif',
                    boxSizing: 'border-box',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#4A90A4')}
                  onBlur={(e) => (e.target.style.borderColor = '#D2B48C')}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#4A90A4',
                    marginBottom: '6px',
                    fontFamily: 'Poppins, sans-serif',
                  }}
                >
                  Senha
                </label>
                <input
                  type="password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #D2B48C',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'Poppins, sans-serif',
                    boxSizing: 'border-box',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#4A90A4')}
                  onBlur={(e) => (e.target.style.borderColor = '#D2B48C')}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#4A90A4',
                    marginBottom: '6px',
                    fontFamily: 'Poppins, sans-serif',
                  }}
                >
                  Confirme a senha
                </label>
                <input
                  type="password"
                  value={signupConfirm}
                  onChange={(e) => setSignupConfirm(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #D2B48C',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'Poppins, sans-serif',
                    boxSizing: 'border-box',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#4A90A4')}
                  onBlur={(e) => (e.target.style.borderColor = '#D2B48C')}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '11px',
                  background: '#4A90A4',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  fontFamily: 'Poppins, sans-serif',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? '0.7' : '1',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) =>
                  !loading && (e.currentTarget.style.background = '#3A7A94')
                }
                onMouseLeave={(e) => (e.currentTarget.style.background = '#4A90A4')}
              >
                {loading ? 'Criando conta...' : 'Cadastrar'}
              </button>

              <p
                style={{
                  fontSize: '12px',
                  color: '#8B7355',
                  textAlign: 'center',
                  margin: '4px 0 0 0',
                  fontFamily: 'Times New Roman, serif',
                  lineHeight: '1.5',
                }}
              >
                Suas informações são protegidas e confidenciais
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
