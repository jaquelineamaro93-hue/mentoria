import type { Metadata } from 'next';
import './globals.css';
import PostHogInit from '@/components/PostHogInit';

export const metadata: Metadata = {
  title: 'Portal do Mentorado | Mentoria SOMA',
  description: 'Sua jornada de desenvolvimento de carreira na Mentoria SOMA.',
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
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-ink text-cream">
        <PostHogInit />
        {children}
      </body>
    </html>
  );
}
