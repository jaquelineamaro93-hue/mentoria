import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/security/require-admin';
import { createAdminClient } from '@/lib/supabase/admin';
import LibraryAdmin from './LibraryAdmin';
import LibraryNewsletter from './LibraryNewsletter';
import LibrarySuggestions from '../../gravacoes/LibrarySuggestions';
export const dynamic='force-dynamic';
export default async function Page(){
 const auth=await requireAdmin();if(!auth.ok)redirect('/login');
 const db=createAdminClient();const [courses,lessons]=await Promise.all([db.from('soma_learning_courses').select('*').order('position'),db.from('soma_learning_lessons').select('*').order('position')]);
 if(courses.error||lessons.error)return <p role="alert">Não foi possível carregar a biblioteca. Tente novamente.</p>;
 return <><details className="mb-6 rounded-2xl border border-[#d5e4dc] bg-white p-5"><summary className="cursor-pointer font-semibold">Sugestões dos mentorados</summary><div className="mt-5"><LibrarySuggestions admin/></div></details><LibraryNewsletter kind="minigames"/><LibraryNewsletter/><LibraryAdmin courses={courses.data??[]} lessons={lessons.data??[]}/></>;
}
