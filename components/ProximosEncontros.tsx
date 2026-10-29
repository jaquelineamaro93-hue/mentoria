import { CalendarDays } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

export default async function ProximosEncontros() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  // A sessão e as políticas existentes limitam a consulta ao produto do usuário.
  const { data: encontros, error } = await supabase.from('announcements')
    .select('id,titulo,data_evento,link_url')
    .gte('data_evento', new Date().toISOString())
    .order('data_evento', { ascending: true }).limit(3);
  if (error || !encontros?.length) return null;
  return (
    <section aria-label="Próximas lives e encontros" className="mb-6 rounded-2xl border border-mint bg-mint-light p-5">
      <h2 className="flex items-center gap-2 text-base font-semibold text-black"><CalendarDays size={19} aria-hidden="true" />Próximas lives e encontros</h2>
      <p className="mt-1 text-xs text-gray-text">Reserve esse horário na sua agenda. Horários de Brasília.</p>
      <ul className="mt-3 space-y-3">
        {encontros.map(encontro => (
          <li key={encontro.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-mint pt-3">
            <div className="min-w-0 break-words">
              <p className="text-sm font-semibold text-black">{encontro.titulo}</p>
              <time dateTime={encontro.data_evento} className="text-sm text-gray-text">
                {new Date(encontro.data_evento).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'full', timeStyle: 'short' })}
              </time>
            </div>
            {encontro.link_url && /^https?:\/\//i.test(encontro.link_url) && <a href={encontro.link_url} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-mint-deep px-4 py-2 text-sm font-medium text-white">Ver encontro</a>}
          </li>
        ))}
      </ul>
    </section>
  );
}
