import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/security/require-admin';
import { createAdminClient } from '@/lib/supabase/admin';
import LibraryAdmin from './LibraryAdmin';
import LibraryNewsletter from './LibraryNewsletter';
export const dynamic='force-dynamic';
export default async function Page(){
 const auth=await requireAdmin();if(!auth.ok)redirect('/login');
 const db=createAdminClient();const [courses,lessons]=await Promise.all([db.from('soma_learning_courses').select('*').order('position'),db.from('soma_learning_lessons').select('*').order('position')]);
 if(courses.error||lessons.error)return <p role="alert">Não foi possível carregar a biblioteca. Tente novamente.</p>;
 return <><LibraryNewsletter/><LibraryAdmin courses={courses.data??[]} lessons={lessons.data??[]}/></>;
}
