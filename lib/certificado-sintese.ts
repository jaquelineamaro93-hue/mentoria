export type Acao = { dia: string; tipo: string };
export type Evidencia = { dia: string; fonte: string; tipo: string };

const nomes: Record<string,string> = {
  ingles:'Comunicação em inglês',curriculo:'Currículo e posicionamento',
  linkedin:'Presença profissional',networking:'Relacionamentos profissionais',
  candidatura:'Busca de oportunidades',entrevista:'Preparação para entrevistas',
  pdi:'Plano de desenvolvimento',aprendizado:'Aprendizado contínuo',
  reflexao:'Autoconhecimento',diario:'Reflexão profissional',
  pdi_acao:'Execução do plano',pdi_secao:'Planejamento de carreira',
  cv:'Análise de currículo',soar:'Análise estratégica'
};
export function sintetizarJornada(acoes:Acao[],evidencias:Evidencia[]) {
  const registros = [
    ...acoes.map(a=>({dia:a.dia,area:nomes[a.tipo]||'Desenvolvimento de carreira',fonte:'checkin'})),
    ...evidencias.map(e=>({dia:e.dia,area:nomes[e.fonte]||nomes[e.tipo]||'Desenvolvimento de carreira',fonte:e.fonte}))
  ];
  const dias = new Set(registros.map(r=>r.dia)).size;
  const frentes = [...new Set(registros.map(r=>r.area))];
  const automaticas = evidencias.length;
  const proximoFoco = frentes.some(f=>f.includes('Plano'))
    ? 'Transformar o planejamento em pequenas ações semanais e acompanhar sua execução.'
    : frentes.some(f=>f.includes('Currículo')||f.includes('oportunidades'))
      ? 'Revisar a aderência às oportunidades e priorizar candidaturas relevantes.'
      : 'Definir uma ação concreta no PDI e manter o registro de avanços durante o mês.';
  const resumo = dias >= 4
    ? 'O período reúne ações distribuídas em diferentes dias, indicando continuidade no desenvolvimento.'
    : 'O período apresenta movimentos documentados de desenvolvimento. O próximo passo é ampliar a constância.';
  return {dias,registros:registros.length,automaticas,frentes:frentes.slice(0,5),resumo,proximoFoco};
}
