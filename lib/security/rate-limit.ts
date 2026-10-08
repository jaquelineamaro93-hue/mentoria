import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';

function getClientIp(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown';

  return request.headers.get('x-real-ip')?.trim() || 'unknown';
}

function hmac(value: string) {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY ausente.');
  }

  return crypto.createHmac('sha256', secret).update(value).digest('hex');
}

export function hashSecurityValue(value: string) {
  return hmac(`security-value|${value}`);
}

export async function consumeSecurityRateLimit(input: {
  request: Request;
  scope: string;
  identifier?: string;
  limit: number;
  windowSeconds: number;
}) {
  const ip = getClientIp(input.request);
  const keyHash = hmac(
    [
      input.scope,
      ip,
      input.identifier?.trim().toLowerCase() || '',
    ].join('|')
  );

  const admin = createAdminClient();
  const { data, error } = await admin.rpc('consume_security_rate_limit', {
    p_scope: input.scope,
    p_key_hash: keyHash,
    p_limit: input.limit,
    p_window_seconds: input.windowSeconds,
  });

  if (error) {
    console.error('[SECURITY-RATE-LIMIT] Falha ao consultar limite:', error.message);
    // Fail closed on public abuse-sensitive endpoints.
    return false;
  }

  return data === true;
}
