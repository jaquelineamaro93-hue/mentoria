import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ferramentas de carreira | SOMA Mentoria',
  description: 'Conheça as opções de acesso à SOMA Mentoria e explore ferramentas de currículo, LinkedIn, Gupy e desenvolvimento de carreira.',
  openGraph: {
    title: 'LinkedIn, currículo e Gupy em um só lugar | SOMA Mentoria',
    description: 'Conheça as ferramentas de carreira e explore as opções de acesso à SOMA',
    url: 'https://somamentoria.com/planos',
    siteName: 'SOMA Mentoria',
    locale: 'pt_BR',
    type: 'website',
    images: [{ url: '/planos/opengraph-image', width: 1200, height: 630, alt: 'SOMA Mentoria com os quatro mascotes oficiais' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ferramentas de carreira | SOMA Mentoria',
    description: 'LinkedIn, currículo, Gupy e desenvolvimento profissional',
    images: ['/planos/opengraph-image'],
  },
};

export default function PlanosLayout({ children }: { children: React.ReactNode }) { return children; }
