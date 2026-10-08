import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { consumeSecurityRateLimit } from '@/lib/security/rate-limit';

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const allowed = await consumeSecurityRateLimit({
      request,
      scope: 'avatar_upload',
      identifier: user.id,
      limit: 20,
      windowSeconds: 60 * 60,
    });

    if (!allowed) {
      return NextResponse.json({ error: 'Muitos uploads. Tente mais tarde.' }, { status: 429 });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    const ext = MIME_TO_EXT[file.type];
    if (!ext) {
      return NextResponse.json(
        { error: 'Use uma imagem JPG, PNG, WEBP ou GIF.' },
        { status: 400 }
      );
    }

    if (file.size < 1 || file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'A imagem deve ter no máximo 5MB.' }, { status: 400 });
    }

    const path = `${user.id}/perfil.${ext}`;
    const buffer = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from('avatar')
      .upload(path, buffer, {
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      console.error('[AVATAR-UPLOAD] Falha no storage:', uploadError.message);
      return NextResponse.json({ error: 'Erro ao fazer upload.' }, { status: 500 });
    }

    const { data } = supabase.storage.from('avatar').getPublicUrl(path);
    const fotoUrl = `${data.publicUrl}?v=${Date.now()}`;

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ foto_url: fotoUrl })
      .eq('id', user.id);

    if (updateError) {
      console.error('[AVATAR-UPLOAD] Falha ao atualizar perfil:', updateError.message);
      return NextResponse.json({ error: 'Erro ao atualizar perfil.' }, { status: 500 });
    }

    return NextResponse.json(
      { success: true, foto_url: fotoUrl },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error(
      '[AVATAR-UPLOAD] Falha inesperada:',
      error instanceof Error ? error.message : String(error)
    );
    return NextResponse.json({ error: 'Erro interno ao fazer upload' }, { status: 500 });
  }
}
