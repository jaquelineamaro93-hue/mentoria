'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AuthPage() {
  const router = useRouter();
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
      setError('Erro ao processar. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Mentoria+
          </h1>
          <p className="text-gray-600 mt-2">Seu portal de desenvolvimento profissional</p>
        </div>

        {sent ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-900 font-semibold">Link enviado!</p>
              <p className="text-green-800 text-sm mt-2">
                Verifique seu email <span className="font-bold">{email}</span> para acessar o portal.
              </p>
            </div>
            <p className="text-gray-600 text-sm text-center">
              O link expira em 24 horas.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-900 text-sm">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Enviando...' : 'Receber Link de Acesso'}
            </Button>

            <p className="text-center text-gray-600 text-sm">
              Você receberá um link de acesso seguro no seu email.
            </p>
          </form>
        )}
      </Card>
    </div>
  );
}
