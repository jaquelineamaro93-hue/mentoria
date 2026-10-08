import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PDFParse } from 'pdf-parse';
import { consumeSecurityRateLimit } from '@/lib/security/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: user } = await supabase.auth.getUser();

    if (!user.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const allowed = await consumeSecurityRateLimit({
      request,
      scope: 'linkedin_pdf_import',
      identifier: user.user.id,
      limit: 10,
      windowSeconds: 60 * 60,
    });

    if (!allowed) {
      return NextResponse.json({ error: 'Muitas importações. Tente mais tarde.' }, { status: 429 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Arquivo PDF é obrigatório' },
        { status: 400 }
      );
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Apenas arquivos PDF são aceitos' },
        { status: 400 }
      );
    }

    if (file.size < 1 || file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'O PDF deve ter no máximo 10MB.' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const pdfParser = new PDFParse({ data: buffer });
    const pdfData = await pdfParser.getText();
    const extractedText = pdfData.text;

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json(
        { error: 'Não foi possível extrair texto do PDF' },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        raw_resume: extractedText.slice(0, 120000),
        linkedin_updated_at: new Date().toISOString(),
      })
      .eq('id', user.user.id);

    if (updateError) {
      console.error('[IMPORTAR-LINKEDIN] Erro ao salvar perfil:', updateError.message);
      return NextResponse.json(
        { error: 'Erro ao salvar o perfil do LinkedIn.' },
        { status: 500 }
      );
    }

    const { data: xpAwarded, error: xpError } = await supabase.rpc(
      'registrar_xp_linkedin_import'
    );

    if (xpError) {
      console.warn(
        '[IMPORTAR-LINKEDIN] PDF salvo, mas não foi possível registrar os Impulsos:',
        xpError.message
      );
    }

    return NextResponse.json({
      success: true,
      message: 'PDF do LinkedIn sincronizado com sucesso',
      profileUpdated: true,
      xpAwarded: xpError ? 0 : xpAwarded ? 50 : 0,
      alreadyAwarded: !xpError && !xpAwarded,
    });
  } catch (error) {
    console.error('🔴 [IMPORTAR-LINKEDIN] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao processar o PDF' },
      { status: 500 }
    );
  }
}
