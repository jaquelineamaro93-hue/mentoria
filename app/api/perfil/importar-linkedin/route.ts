import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PDFParse } from 'pdf-parse';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: user } = await supabase.auth.getUser();

    if (!user.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Arquivo PDF é obrigatório' },
        { status: 400 }
      );
    }

    if (!file.type.includes('pdf')) {
      return NextResponse.json(
        { error: 'Apenas arquivos PDF são aceitos' },
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

    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        raw_resume: extractedText,
        linkedin_updated_at: new Date().toISOString(),
      })
      .eq('id', user.user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Erro ao salvar perfil:', updateError);
      return NextResponse.json(
        { error: 'Erro ao salvar o perfil' },
        { status: 500 }
      );
    }

    try {
      await supabase
        .from('user_xp')
        .insert({
          user_id: user.user.id,
          action: 'linkedin_import',
          points: 50,
          created_at: new Date().toISOString(),
        });
    } catch (xpError) {
      console.warn('Aviso: Não foi possível registrar XP:', xpError);
    }

    return NextResponse.json({
      success: true,
      message: 'PDF do LinkedIn sincronizado com sucesso',
      profileUpdated: true,
      xpAwarded: 50,
    });
  } catch (error) {
    console.error('🔴 [IMPORTAR-LINKEDIN] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao processar o PDF' },
      { status: 500 }
    );
  }
}
