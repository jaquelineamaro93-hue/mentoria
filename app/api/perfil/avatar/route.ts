import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    const ext = file.name.split('.').pop() || 'jpg';
    const path = `avatars/${user.id}/avatar.${ext}`;

    const buffer = await file.arrayBuffer();

    const { error: uploadError, data: uploadData } = await supabase.storage
      .from('avatars')
      .upload(path, buffer, {
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      console.error('Upload error:', {
        message: uploadError.message,
        status: uploadError.status,
        path,
        fileSize: buffer.byteLength,
        contentType: file.type,
      });
      return NextResponse.json(
        { error: `Erro ao fazer upload: ${uploadError.message} (Verifique as permissões de acesso do Storage)` },
        { status: 500 }
      );
    }

    console.log('Upload successful:', { path, size: buffer.byteLength });

    const { data } = supabase.storage.from('avatars').getPublicUrl(path);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ foto_url: data.publicUrl })
      .eq('id', user.id);

    if (updateError) {
      console.error('Update error:', {
        message: updateError.message,
        userId: user.id,
        photoUrl: data.publicUrl,
      });
      return NextResponse.json(
        { error: `Erro ao atualizar perfil: ${updateError.message}` },
        { status: 500 }
      );
    }

    console.log('Profile updated successfully:', { userId: user.id });

    return NextResponse.json({
      success: true,
      foto_url: data.publicUrl,
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    return NextResponse.json(
      { error: 'Erro interno ao fazer upload' },
      { status: 500 }
    );
  }
}
