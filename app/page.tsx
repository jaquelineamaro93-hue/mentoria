import { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, Users, Zap, Calendar } from 'lucide-react';

export const metadata: Metadata = {
  title: 'SOMA Mentoria - Transforme sua Carreira',
  description: 'Programa de mentoria estruturado para desenvolvimento profissional com encontros individuais e coletivos.',
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cream to-white">
      {/* Header */}
      <header className="border-b border-line">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <h1 className="font-display text-2xl text-brown-deep">SOMA Mentoria</h1>
          <div className="space-x-4">
            <Link href="/login" className="text-brown-deep hover:underline font-medium">
              Entrar
            </Link>
            <Link
              href="/checkout"
              className="bg-brown-deep text-white px-6 py-2 rounded-lg font-medium hover:bg-brown transition-colors"
            >
              Começar
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <h2 className="font-display text-5xl text-brown-deep mb-6">
          Transforme sua Carreira com Mentoria Estruturada
        </h2>
        <p className="text-xl text-ink-faint mb-8 max-w-2xl mx-auto">
          SOMA é um programa completo de mentoria que combina sessões individuais, encontros coletivos presenciais e online para impulsionar seu desenvolvimento profissional.
        </p>
        <Link
          href="/checkout"
          className="inline-block bg-brown-deep text-white px-8 py-4 rounded-lg font-display text-lg hover:bg-brown transition-colors"
        >
          Ver Planos
        </Link>
      </section>

      {/* Planos */}
      <section className="bg-white py-20 border-t border-b border-line">
        <div className="max-w-6xl mx-auto px-6">
          <h3 className="font-display text-3xl text-brown-deep text-center mb-12">Escolha seu Plano</h3>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* 6 Meses */}
            <div className="border-2 border-line rounded-2xl p-8">
              <h4 className="font-display text-2xl text-brown-deep mb-2">SOMA Fluxo 6</h4>
              <p className="text-sm text-ink-faint mb-6">Imersão focada e intensiva</p>

              <div className="mb-8">
                <p className="font-display text-3xl text-brown-deep mb-2">R$ 650</p>
                <p className="text-xs text-ink-faint">à vista</p>
              </div>

              <div className="space-y-3 mb-8 text-sm text-ink-faint">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-green-600" />
                  <span>7 sessões individuais</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-green-600" />
                  <span>6 encontros presenciais</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-green-600" />
                  <span>6 encontros online coletivos</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-green-600" />
                  <span>Acesso ao portal 24/7</span>
                </div>
              </div>

              <Link
                href="/checkout"
                className="w-full block text-center bg-brown-deep/10 text-brown-deep px-6 py-3 rounded-lg font-medium hover:bg-brown-deep hover:text-white transition-colors"
              >
                Escolher Plano
              </Link>
            </div>

            {/* 12 Meses */}
            <div className="border-2 border-brown-deep rounded-2xl p-8 bg-brown-deep/5">
              <div className="mb-4">
                <span className="bg-brown-deep text-white text-xs font-medium px-3 py-1 rounded-full">
                  Mais Popular
                </span>
              </div>
              
              <h4 className="font-display text-2xl text-brown-deep mb-2">SOMA Fluxo 12</h4>
              <p className="text-sm text-ink-faint mb-6">Desenvolvimento profundo e contínuo</p>

              <div className="mb-8">
                <p className="font-display text-3xl text-brown-deep mb-2">R$ 850</p>
                <p className="text-xs text-ink-faint">à vista</p>
              </div>

              <div className="space-y-3 mb-8 text-sm text-ink-faint">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-green-600" />
                  <span>10 sessões individuais</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-green-600" />
                  <span>12 encontros presenciais</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-green-600" />
                  <span>12 encontros online coletivos</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-green-600" />
                  <span>Acesso ao portal 24/7</span>
                </div>
              </div>

              <Link
                href="/checkout"
                className="w-full block text-center bg-brown-deep text-white px-6 py-3 rounded-lg font-medium hover:bg-brown transition-colors"
              >
                Escolher Plano
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h3 className="font-display text-3xl text-brown-deep text-center mb-12">Por que SOMA?</h3>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <Users size={32} className="text-brown-deep mx-auto mb-4" />
              <h4 className="font-display text-lg text-brown-deep mb-2">Comunidade</h4>
              <p className="text-sm text-ink-faint">
                Conecte-se com outros profissionais em sua jornada de desenvolvimento
              </p>
            </div>

            <div className="text-center">
              <Zap size={32} className="text-brown-deep mx-auto mb-4" />
              <h4 className="font-display text-lg text-brown-deep mb-2">Transformação</h4>
              <p className="text-sm text-ink-faint">
                Estrutura comprovada que acelera seu crescimento profissional
              </p>
            </div>

            <div className="text-center">
              <Calendar size={32} className="text-brown-deep mx-auto mb-4" />
              <h4 className="font-display text-lg text-brown-deep mb-2">Flexibilidade</h4>
              <p className="text-sm text-ink-faint">
                Acesso 24/7 ao portal para trabalhar no seu próprio ritmo
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="bg-brown-deep text-white py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h3 className="font-display text-3xl mb-4">Comece sua Transformação Agora</h3>
          <p className="text-lg mb-8 opacity-90">
            Escolha o plano que melhor se encaixa na sua jornada
          </p>
          <Link
            href="/checkout"
            className="inline-block bg-white text-brown-deep px-8 py-4 rounded-lg font-display text-lg hover:bg-cream transition-colors"
          >
            Ver Planos e Começar
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line py-8 text-center text-sm text-ink-faint">
        <div className="max-w-6xl mx-auto px-6">
          <p>© 2026 SOMA Mentoria. Todos os direitos reservados.</p>
          <div className="mt-4 space-x-6">
            <Link href="#" className="hover:text-brown-deep">
              Termos
            </Link>
            <Link href="#" className="hover:text-brown-deep">
              Privacidade
            </Link>
            <Link href="#" className="hover:text-brown-deep">
              Contato
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
