import { redirect } from 'next/navigation';

export default function LegacyCareerRoute() {
  redirect('/carreira?etapa=cv');
}
