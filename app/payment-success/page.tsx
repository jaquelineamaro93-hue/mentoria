'use client';

import Link from 'next/link';

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-6">
      <div className="max-w-md mx-auto bg-white border-2 border-green-500 rounded-2xl p-8 text-center">
        <div className="text-5xl mb-4">✅</div>
        <h1 className="font-display text-2xl text-brown-deep mb-2">Pagamento Aprovado!</h1>
        <p className="text-sm text-ink-faint mb-6">
          Sua conta foi criada e você já pode acessar a mentoria.
        </p>
        <Link href="/dashboard" className="inline-block bg-brown-deep text-white px-6 py-3 rounded-lg font-medium hover:bg-brown">
          Ir para Dashboard
        </Link>
      </div>
    </div>
  );
}
