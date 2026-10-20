import { CheckCircle2, Crown, LockKeyhole, Sparkles } from 'lucide-react';

export type ModuleCardStatus='mentor'|'trial'|'owned'|'pending'|'locked'|'legacy';
export function ModuleAccessBadge({status}:{status:ModuleCardStatus}) {
 const label={
  mentor:'Incluso na Mentoria',
  trial:'Acesso de teste',
  owned:'Módulo ativo',
  pending:'Pagamento pendente',
  locked:'Assinatura necessária',
  legacy:'Disponível agora',
 }[status];
 const Icon=status==='mentor'?Crown:status==='owned'?CheckCircle2:status==='locked'?LockKeyhole:Sparkles;
 return <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d7e2dc] bg-[#f1f8f3] px-2.5 py-1 text-xs font-medium text-[#315a48]">
  <Icon size={13} aria-hidden="true"/>{label}
 </span>;
}
