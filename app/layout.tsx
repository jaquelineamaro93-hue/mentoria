import type { Metadata } from 'next';
import './globals.css';
import PostHogInit from '@/components/PostHogInit';
import TermosGate from '@/components/TermosGate';
import AcessoGate from '@/components/AcessoGate';

export const metadata: Metadata = {
  metadataBase: new URL('https://somamentoria.com'),
  openGraph: {
    title: 'SOMA Mentoria | Sua carreira em movimento',
    description: 'Autoconhecimento, estratégia e ferramentas práticas para sua carreira',
    url: 'https://somamentoria.com',
    siteName: 'SOMA Mentoria',
    locale: 'pt_BR',
    type: 'website',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'SOMA Mentoria com Lume, Norte, Brasa e Íris' }],
  },
  twitter: { card: 'summary_large_image', images: ['/opengraph-image'] },
  title: 'Portal do Mentorado | Mentoria SOMA',
  description: 'Sua jornada de desenvolvimento de carreira na Mentoria SOMA.',
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    shortcut: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Crimson+Text:ital@0;1&family=Poppins:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-white text-black">
        <PostHogInit />
        <AcessoGate />
        <TermosGate />
        {children}
      </body>
    </html>
  );
}
