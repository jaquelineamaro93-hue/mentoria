import { NextResponse } from 'next/server';
import { enviarConvitesSemanaisIris, processarFilaIris } from '@/lib/iris-automacao';

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function GET(request: Request) {
  const segredo = process.env.CRON_SECRET;
  if (!segredo || request.headers.get('authorization') !== 'Bearer ' + segredo)
    return NextResponse.json({error:'Não autorizado'},{status:401});
  const fila = await processarFilaIris();
  const convites = await enviarConvitesSemanaisIris();
  return NextResponse.json({fila, convites}, {headers:{'Cache-Control':'no-store'}});
}
