import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SOMA Mentoria',
  description: 'Plataforma de mentoria de carreira.',
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
