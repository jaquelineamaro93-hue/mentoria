import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Percepcao360Client from './Percepcao360Client';
import type {
  Feedback360Answer,
  Feedback360Question,
  Feedback360Respondent,
  Feedback360Round,
  Feedback360Summary,
} from '@/lib/types';

export default async function Percepcao360Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const [
    { data: rounds },
    { data: questions },
    { data: respondents },
    { data: answers },
    { data: summaries },
  ] = await Promise.all([
    supabase
      .from('feedback_360_rounds')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .returns<Feedback360Round[]>(),
    supabase
      .from('feedback_360_questions')
      .select('*')
      .eq('user_id', user.id)
      .order('ordem')
      .returns<Feedback360Question[]>(),
    supabase
      .from('feedback_360_respondents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at')
      .returns<Feedback360Respondent[]>(),
    supabase
      .from('feedback_360_answers')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at')
      .returns<Feedback360Answer[]>(),
    supabase
      .from('feedback_360_summaries')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .returns<Feedback360Summary[]>(),
  ]);

  return (
    <Percepcao360Client
      userId={user.id}
      rounds={rounds ?? []}
      questions={questions ?? []}
      respondents={respondents ?? []}
      answers={answers ?? []}
      summaries={summaries ?? []}
    />
  );
}
