import { createAdminClient } from '@/lib/supabase/admin';
import PublicFeedback360Form, { type PublicFeedback360Data } from './PublicFeedback360Form';

export const dynamic = 'force-dynamic';

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export default async function PublicFeedback360Page({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  if (!isUuid(token)) {
    return <PublicFeedback360Form token={token} data={null} />;
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc('get_feedback_360_public', {
    p_token: token,
  });

  const publicData = !error && data ? (data as PublicFeedback360Data) : null;

  return <PublicFeedback360Form token={token} data={publicData} />;
}
