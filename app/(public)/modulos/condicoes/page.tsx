import Link from 'next/link';

export const metadata={
 title:'Condições da assinatura modular | SOMA',
 description:'Condições da contratação de módulos independentes de carreira da SOMA.',
};

export default function CondicoesModulares(){
 return <main className="mx-auto max-w-3xl px-4 py-12">
  <Link href="/modulos" className="text-sm text-mint-deep underline">← Voltar aos módulos</Link>
  <h1 className="mt-5 font-display text-3xl text-lotus-brown">Condições da assinatura modular</h1>
  <p className="mt-2 text-sm text-gray-text">Versão modular-1.0 · SOMA Mentoria</p>
  <div className="mt-8 space-y-7 text-sm leading-7 text-black">
   <section>
    <h2 className="text-lg font-semibold">1. Objeto da contratação</h2>
    <p>Você pode contratar, separadamente, o acesso a um ou mais módulos digitais da SOMA.
     Cada módulo contratado concede apenas o uso das funcionalidades nele identificadas,
     durante o período pago e enquanto a assinatura permanecer ativa.</p>
   </section>
   <section>
    <h2 className="text-lg font-semibold">2. Preço e cobrança recorrente</h2>
    <p>O valor mensal de cada módulo é informado antes da contratação. A cobrança é
     recorrente, realizada pelo Mercado Pago, e acontece por módulo contratado.
     Novos módulos não são adicionados automaticamente à sua cobrança: precisam de
     contratação própria.</p>
   </section>
   <section>
    <h2 className="text-lg font-semibold">3. Confirmação do pagamento</h2>
    <p>A criação ou autorização de uma assinatura não garante acesso imediato.
     A liberação depende da confirmação do pagamento pela operadora. Pagamentos
     recusados, estornados ou contestados podem interromper o acesso ao módulo
     relacionado, sem afetar outros módulos adimplentes.</p>
   </section>
   <section>
    <h2 className="text-lg font-semibold">4. Cancelamento</h2>
    <p>Você pode solicitar o cancelamento de cada assinatura separadamente no catálogo
     de módulos. A SOMA encaminhará o cancelamento ao Mercado Pago e revogará o acesso
     ao módulo cancelado após a confirmação da operadora. O cancelamento interrompe
     cobranças futuras relativas àquela assinatura, sem produzir automaticamente
     estorno de valores já pagos. Pedidos de reembolso e direitos legais aplicáveis
     continuam sujeitos à legislação de defesa do consumidor.</p>
   </section>
   <section>
    <h2 className="text-lg font-semibold">5. Mentoria completa e trial</h2>
    <p>Quem possui plano de Mentoria SOMA vigente tem acesso completo aos módulos
     disponíveis e futuros, sem cobranças modulares adicionais. O período de teste
     gratuito segue as condições específicas apresentadas na plataforma; após seu
     término, o acesso a módulos protegidos exige assinatura ativa ou Mentoria vigente.</p>
   </section>
   <section>
    <h2 className="text-lg font-semibold">6. Dados e segurança</h2>
    <p>Os dados de acesso e as confirmações financeiras são processados para executar
     a contratação e prevenir fraudes. A SOMA armazena identificadores de pedidos
     e situações de pagamento, sem armazenar dados completos de cartão.
     O tratamento de dados também observa a política de privacidade aplicável.</p>
   </section>
   <section>
    <h2 className="text-lg font-semibold">7. Planos já contratados</h2>
    <p>Esta modalidade não modifica automaticamente a vigência, preços,
     benefícios nem condições de contratos de Mentoria anteriores. Os termos
     próprios da Mentoria continuam aplicáveis aos respectivos planos.</p>
   </section>
  </div>
 </main>;
}
