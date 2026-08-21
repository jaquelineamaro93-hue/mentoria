"use client";

import Sidebar from "@/components/Sidebar";
import { useConfetti } from "@/components/useConfetti";

export default function Home() {
  const triggerConfetti = useConfetti();

  return (
    <div className="min-h-screen bg-canvas">
      {/* HERO */}
      <section className="min-h-screen bg-gradient-to-b from-brand-soft to-white flex flex-col items-center justify-center px-4 text-center">
        <h1 className="font-display text-6xl text-ink-deep mb-4 max-w-3xl">
          Sua Totalidade Integrada
        </h1>
        <p className="text-xl text-ink-faint max-w-2xl mb-10">
          Transforme sua carreira e vida pessoal com mentoria integral alinhada aos 4 pilares SOMA
        </p>
        <button
          onClick={triggerConfetti}
          className="bg-gradient-brand text-white px-8 py-4 rounded-lg font-semibold text-lg hover:shadow-lg transition-all"
        >
          Conheça o Programa
        </button>
      </section>

      {/* METODOLOGIA */}
      <section className="py-20 px-4 max-w-6xl mx-auto">
        <h2 className="font-display text-4xl text-ink-deep text-center mb-16">
          A Metodologia SOMA
        </h2>
        <div className="grid grid-cols-4 gap-6">
          {[
            { letter: "S", title: "Situação", desc: "Diagnóstico real onde você está" },
            { letter: "O", title: "Objetivo", desc: "Visão clara do que deseja" },
            { letter: "M", title: "Método", desc: "Plano estruturado de ação" },
            { letter: "A", title: "Acompanhamento", desc: "Suporte contínuo e evolução" },
          ].map((item) => (
            <div key={item.letter} className="bg-white p-6 rounded-2xl border border-line text-center">
              <div className="text-4xl font-bold text-brand mb-3">{item.letter}</div>
              <h3 className="font-semibold text-ink-deep mb-2">{item.title}</h3>
              <p className="text-sm text-ink-faint">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="py-20 px-4 bg-brand-soft">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-4xl text-ink-deep text-center mb-16">
            Como Funciona
          </h2>
          <div className="grid grid-cols-2 gap-12">
            <div>
              <h3 className="font-semibold text-ink-deep mb-4">Fase Online</h3>
              <ul className="space-y-3">
                {["Diagnóstico inicial dos 4 pilares", "Sessões de mentoria estruturadas", "Comunidade de apoio"].map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-brand">✓</span>
                    <span className="text-ink-soft">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-ink-deep mb-4">Fase Presencial</h3>
              <ul className="space-y-3">
                {["Encontros em grupo para networking", "Workshops de desenvolvimento", "Celebração de conquistas"].map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-brand">✓</span>
                    <span className="text-ink-soft">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* PLANOS */}
      <section className="py-20 px-4 max-w-4xl mx-auto">
        <h2 className="font-display text-4xl text-ink-deep text-center mb-16">
          Planos de Investimento
        </h2>
        <div className="grid grid-cols-2 gap-8">
          {[
            { months: "6 meses", price: "R$ 650", badge: false },
            { months: "12 meses", price: "R$ 850", badge: true },
          ].map((plan) => (
            <div key={plan.months} className="bg-white p-8 rounded-2xl border border-line relative">
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-brand text-white px-4 py-1 rounded-full text-sm font-semibold">
                  MAIS COMPLETO
                </div>
              )}
              <h3 className="font-semibold text-ink-deep text-lg mb-2">{plan.months}</h3>
              <div className="text-3xl font-bold text-brand mb-6">{plan.price}</div>
              <button className="w-full bg-brand text-white py-3 rounded-lg font-semibold hover:bg-brand-deep transition">
                💳 Mercado Pago
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* POR QUE SOMA */}
      <section className="py-20 px-4 bg-canvas max-w-4xl mx-auto">
        <h2 className="font-display text-4xl text-ink-deep text-center mb-16">
          Por Que SOMA?
        </h2>
        <div className="grid grid-cols-3 gap-6">
          {[
            { title: "Diagnóstico Real", desc: "Entendimento profundo de quem você é" },
            { title: "Comunidade", desc: "Conecte-se com outras mulheres em transformação" },
            { title: "Plano de Ação", desc: "Roadmap claro para suas metas" },
          ].map((card) => (
            <div key={card.title} className="bg-white p-6 rounded-2xl border border-line">
              <h3 className="font-semibold text-ink-deep mb-2">{card.title}</h3>
              <p className="text-sm text-ink-faint">{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* JAQUELINE */}
      <section className="py-20 px-4 bg-brand-soft max-w-4xl mx-auto">
        <div className="grid grid-cols-2 gap-12 items-center">
          <div>
            <div className="w-80 h-80 rounded-2xl border-4 border-brand bg-gradient-to-br from-brand-soft to-coral-soft overflow-hidden">
              <img src="/jaqueline.jpg" alt="Jaqueline" className="w-full h-full object-cover" />
            </div>
          </div>
          <div>
            <h2 className="font-display text-3xl text-ink-deep mb-4">Jaqueline Amaro</h2>
            <p className="text-ink-deep font-semibold mb-4">
              Mentora de Carreira & Facilitadora de Transformação
            </p>
            <p className="text-ink-soft leading-relaxed">
              Com mais de 15 anos de experiência em desenvolvimento pessoal e carreira, Jaqueline combina conhecimento técnico com inteligência emocional para guiar mulheres na jornada de integração dos 4 pilares SOMA.
            </p>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 px-4 bg-ink-deep text-white text-center">
        <h2 className="font-display text-4xl mb-4">
          É o momento de somar suas forças
        </h2>
        <p className="text-lg mb-8 max-w-2xl mx-auto opacity-90">
          Sua transformação começa aqui. Conecte-se com a comunidade SOMA e redesenhe sua vida.
        </p>
        <button
          onClick={triggerConfetti}
          className="bg-gradient-brand text-white px-8 py-4 rounded-lg font-semibold hover:shadow-lg transition-all"
        >
          Começar Agora
        </button>
      </section>

      {/* FOOTER */}
      <footer className="bg-black text-white py-12 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-12 mb-8">
          <div>
            <h4 className="font-semibold mb-4">Pagamento</h4>
            <p className="text-sm text-gray-300">Mercado Pago</p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Segurança</h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>✓ Dados protegidos</li>
              <li>✓ Privacidade garantida</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Redes Sociais</h4>
            <div className="flex gap-4">
              <a href="#" className="text-gray-300 hover:text-white">Instagram</a>
              <a href="#" className="text-gray-300 hover:text-white">LinkedIn</a>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-700 pt-8 text-center text-sm text-gray-400">
          © 2012–2026 SOMA. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
