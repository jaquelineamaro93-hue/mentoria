'use client';

import { useState, FormEvent } from 'react';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) throw new Error('Erro ao enviar link');
      setSent(true);
    } catch (err) {
      setError('Não conseguimos enviar o link. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #87CEEB 0%, #D2B48C 100%)' }}>
      <div className="w-full max-w-md" style={{ background: '#FFFAF0', borderRadius: '12px', padding: '48px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>

        <div className="text-center mb-12">
          <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#4A90A4', fontFamily: 'Poppins, sans-serif', margin: '0 0 16px 0' }}>
            Mentoria
          </h1>
          <p style={{ fontSize: '14px', color: '#8B7355', fontFamily: 'Times New Roman, serif', fontStyle: 'italic', margin: '0', lineHeight: '1.6' }}>
            Seu desenvolvimento profissional começa aqui
          </p>
        </div>

        {sent ? (
          <div className="space-y-4">
            <div style={{ background: '#F0FFF4', border: '1px solid #9AE6B4', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
              <p style={{ fontSize: '14px', fontWeight: '600', color: '#22543D', fontFamily: 'Poppins, sans-serif', margin: '0 0 8px 0' }}>
                Link enviado
              </p>
              <p style={{ fontSize: '13px', color: '#2F855A', fontFamily: 'Times New Roman, serif', margin: '0', lineHeight: '1.5' }}>
                Verifique seu email <strong>{email}</strong> e clique no link para continuar
              </p>
            </div>
            <p style={{ fontSize: '12px', color: '#8B7355', fontFamily: 'Times New Roman, serif', textAlign: 'center', margin: '16px 0 0 0' }}>
              O link funciona por 24 horas
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#4A90A4', fontFamily: 'Poppins, sans-serif', marginBottom: '8px' }}>
                Seu email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@email.com"
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #D2B48C',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: 'Poppins, sans-serif',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
                onFocus={(e) => e.target.style.borderColor = '#4A90A4'}
                onBlur={(e) => e.target.style.borderColor = '#D2B48C'}
              />
            </div>

            {error && (
              <div style={{ background: '#FFF5F5', border: '1px solid #FC8181', borderRadius: '6px', padding: '12px', textAlign: 'center' }}>
                <p style={{ fontSize: '13px', color: '#742A2A', fontFamily: 'Times New Roman, serif', margin: '0', lineHeight: '1.4' }}>
                  {error}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '12px',
                background: '#4A90A4',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                fontFamily: 'Poppins, sans-serif',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? '0.7' : '1',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => !isLoading && (e.currentTarget.style.background = '#3A7A94')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#4A90A4')}
            >
              {isLoading ? 'Enviando...' : 'Enviar link'}
            </button>

            <p style={{ fontSize: '12px', color: '#8B7355', fontFamily: 'Times New Roman, serif', textAlign: 'center', margin: '0', lineHeight: '1.5' }}>
              Você receberá um link seguro para acessar o portal
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
