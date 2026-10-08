import { NextResponse } from 'next/server';

// O fluxo legado confiava em identidade enviada pelo navegador e podia ser
// abusado para criar/vincular contas. Fica explicitamente desabilitado até
// existir OAuth Authorization Code + state/PKCE validado no servidor.
export async function POST() {
  return NextResponse.json(
    { error: 'Login com LinkedIn temporariamente indisponível.' },
    {
      status: 410,
      headers: { 'Cache-Control': 'no-store' },
    }
  );
}
