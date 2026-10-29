import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import LearningLibrary from './LearningLibrary';
import { LESSON_COLUMNS } from '@/lib/learning/types';
import type { Profile, Recording } from '@/lib/types';

export default async function GravacoesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>();

  const { data: gravacoes } = await supabase
    .from('recordings')
    .select('*')
    .order('data_encontro', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .returns<Recording[]>();

  const [courses,lessons,progress] = await Promise.all([
    supabase.from('soma_learning_courses').select('*').eq('published',true).order('position'),
    supabase.from('soma_learning_lessons').select(LESSON_COLUMNS).eq('published',true).order('position'),
    supabase.from('soma_learning_progress').select('lesson_id,position_seconds,reflection,completed_at,updated_at').eq('user_id',user.id),
  ]);
  if(courses.error||lessons.error||progress.error) return <div role="alert" className="rounded-xl border bg-white p-6 text-sm">Não foi possível carregar a biblioteca. Recarregue para tentar novamente.</div>;
  return <LearningLibrary courses={courses.data??[]} lessons={lessons.data??[]} progress={progress.data??[]} profile={profile} recordings={gravacoes??[]} />;
}
