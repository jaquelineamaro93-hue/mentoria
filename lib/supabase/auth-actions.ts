'use server';

import { createClient } from '@/lib/supabase/server';

export async function exchangeCode(code: string) {
  const supabase = await createClient();
  
  try {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('❌ Erro no exchange:', error);
      return { success: false, error: error.message };
    }
    
    console.log('✅ Exchange bem-sucedido:', data.user?.email);
    return { success: true, user: data.user };
  } catch (e) {
    console.error('❌ Exception no exchange:', e);
    return { success: false, error: String(e) };
  }
}
