import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ferramentas de carreira | SOMA Mentoria',
  description: 'Conheça as opções de acesso à SOMA Mentoria e explore ferramentas de currículo, LinkedIn, Gupy e desenvolvimento de carreira.',
  alternates: { canonical: 'https://www.somamentoria.com/planos' },
  openGraph: {
    title: 'Novidades SOMA | LinkedIn, currículo, Gupy e Percepção 360',
    description: 'Explore as novidades da SOMA com os quatro mascotes, Percepção 360, Meu Passaporte e ferramentas de carreira',
    url: 'https://www.somamentoria.com/planos',
    siteName: 'SOMA Mentoria',
    locale: 'pt_BR',
    type: 'website',
    images: [{ url: 'https://www.somamentoria.com/api/social/planos?v=20261008-3', width: 1200, height: 630, alt: 'SOMA Mentoria com os quatro mascotes, Percepção 360 e novidades da plataforma' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ferramentas de carreira | SOMA Mentoria',
    description: 'LinkedIn, currículo, Gupy, Percepção 360 e Meu Passaporte',
    images: ['https://www.somamentoria.com/api/social/planos?v=20261008-3'],
  },
};

export default function PlanosLayout({ children }: { children: React.ReactNode }) { return children; }
