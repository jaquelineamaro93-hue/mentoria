import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { consumeIdentifierRateLimit } from '@/lib/security/rate-limit';
import { carregarVagaPublicaGupy, validarLinkPublicoGupy } from '@/lib/gupy-public-job';

export const runtime = 'nodejs';
export const maxDuration = 40;

export async function POST(request: NextRequest) {
  const json = (body: object, status = 200) =>
    NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return json({ error: 'Origem não autorizada.' }, 403);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return json({ error: 'Entre na SOMA para utilizar as vagas por link.' }, 401);

  const { data: permitido, error: erroAcesso } = await supabase.rpc('soma_has_module', { p_slug: 'curriculo-ats' });
  if (erroAcesso) return json({ error: 'Não foi possível confirmar o acesso ao módulo.' }, 503);
  if (permitido !== true) return json({ error: 'Seu plano não possui acesso ao módulo Gupy & ATS.' }, 403);

  let payload: unknown;
  try { payload = await request.json(); } catch { return json({ error: 'Solicitação inválida.' }, 400); }
  const urls = (payload && typeof payload === 'object' && 'urls' in payload)
    ? (payload as { urls: unknown }).urls : null;
  if (!Array.isArray(urls) || urls.length < 1 || urls.length > 3 || urls.some(x => typeof x !== 'string')) {
    return json({ error: 'Envie de um a três links públicos da Gupy.' }, 400);
  }

  let normalizadas: string[];
  try {
    normalizadas = urls.map(x => validarLinkPublicoGupy(x));
    if (new Set(normalizadas).size !== normalizadas.length) throw new Error('Remova os links repetidos.');
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Links inválidos.' }, 400);
  }
  // Taxa por usuário e apenas 3 páginas por chamada. Não guardar HTML, cookies ou dados de candidatos.
  const allowed = await consumeIdentifierRateLimit({
    scope: 'gupy_public_job_fetch',
    identifier: user.id,
    limit: 12,
    windowSeconds: 3600,
  });
  if (!allowed) return json({ error: 'Limite de consultas atingido. Tente novamente mais tarde.' }, 429);

  const resultados = await Promise.all(normalizadas.map(async url => {
    try {
      const vaga = await carregarVagaPublicaGupy(url);
      return { url, ok: true as const, vaga };
    } catch (error) {
      return {
        url,
        ok: false as const,
        erro: error instanceof Error && !/fetch|timeout|abort/i.test(error.message)
          ? error.message : 'Não foi possível acessar publicamente esta vaga. Cole a descrição.',
      };
    }
  }));
  return json({ resultados });
}
