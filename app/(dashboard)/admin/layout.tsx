import { requireAdmin } from '@/lib/security/require-admin';
import { redirect } from 'next/navigation';
import AdminNavigation from '@/components/AdminNavigation';
export default async function Layout({ children }: { children: React.ReactNode }) {
  const authorization=await requireAdmin();
  if(!authorization.ok)redirect(authorization.response.status===401?'/login':'/dashboard');
  return <><AdminNavigation/>{children}</>;
}
