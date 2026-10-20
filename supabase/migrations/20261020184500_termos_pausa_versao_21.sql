-- Nova versão do termo SOMA: preserva integralmente as cláusulas 1-12
-- e publica aditivo claro sobre pausa programada. Não altera aceites antigos.
DO $$
DECLARE
  v_original text;
  v_clause text := $clause$
### Cláusula 13. Da pausa programada e da retomada da mentoria

**13.1. Solicitação voluntária.** A pessoa participante com plano pago ativo e prazo de vigência registrado poderá solicitar, pela plataforma SOMA, pausa voluntária de sua participação por período escolhido de 1 a 60 dias corridos, respeitado o limite **acumulado de 60 dias por ciclo de plano contratado**. O teste gratuito não é elegível à pausa. A solicitação exige confirmação expressa e aceite desta versão das condições.

**13.2. Prazo e registro.** A SOMA registrará a data de início, a data prevista para retorno, a duração solicitada, os dias efetivamente utilizados e a nova data de vencimento. A contagem seguirá a data civil do fuso de Brasília. Caso o prazo de vigência não esteja identificado no cadastro, a equipe deverá confirmá-lo antes da solicitação.

**13.3. Vigência do plano.** O prazo final de acesso à mentoria será prorrogado exatamente pela quantidade de dias corridos **efetivamente pausados**, limitada aos 60 dias acumulados do ciclo. O cálculo será registrado quando a pausa terminar. A pessoa poderá retornar antes da data programada, por solicitação no portal, utilizando apenas os dias de pausa transcorridos. A retomada programada ocorrerá na data informada, sem necessidade de uma nova solicitação.

**13.4. Atividades e histórico.** Durante a pausa, ficam suspensos os lembretes de engajamento e os incentivos de continuidade, assim como a participação ativa nas atividades da mentoria, preservando-se o histórico, o progresso, as conquistas e os Impulsos já acumulados. Permanecem disponíveis as áreas de conta, privacidade, termos e gestão do plano. A organização de sessões eventualmente agendadas durante a pausa observará os direitos contratualmente assegurados e as condições de reagendamento aplicáveis, sem presumir renúncia automática a sessões já contratadas.

**13.5. Pagamentos.** A pausa programada **não suspende, cancela ou altera automaticamente cobranças, parcelas ou assinaturas recorrentes** contratadas com o provedor de pagamento. Qualquer alteração financeira dependerá de ajuste específico, observado o contrato de pagamento e a legislação aplicável. A prorrogação dos dias de acesso não representa crédito financeiro ou estorno.

**13.6. Comunicações sobre a pausa.** A SOMA poderá encaminhar e-mails transacionais para confirmar a solicitação, recordar a data de retomada e informar o novo vencimento. Notificações web push somente serão enviadas quando houver autorização específica do navegador e o canal estiver tecnicamente disponível. Durante a pausa, não serão enviados lembretes usuais de inatividade. O consentimento para comunicações não essenciais poderá ser revogado, respeitadas as informações necessárias à execução do contrato.

**13.7. Direitos anteriores.** Esta modalidade de pausa representa uma opção adicional, sem aplicação retroativa automática ou prejuízo aos direitos já constituídos. Pessoas que aceitaram versões anteriores podem manter suas condições contratuais originais sem solicitar a nova modalidade. A pausa passará a valer apenas quando solicitada e confirmada no sistema.

$clause$;
BEGIN
  IF EXISTS(SELECT 1 FROM public.termos_versoes WHERE versao='2.1') THEN
    RETURN;
  END IF;
  SELECT conteudo_markdown INTO v_original FROM public.termos_versoes
    WHERE versao='2.0' ORDER BY publicado_em DESC LIMIT 1;
  IF v_original IS NULL OR position('### Termo de aceite' in v_original)=0 THEN
    RAISE EXCEPTION 'Texto de origem 2.0 não encontrado. Nova versão não publicada.';
  END IF;
  UPDATE public.termos_versoes SET ativo=false WHERE ativo=true;
  INSERT INTO public.termos_versoes(versao,titulo,conteudo_markdown,ativo,publicado_em)
  VALUES('2.1','Termos da SOMA Mentoria · Atualização sobre pausas',
     replace(v_original,'### Termo de aceite',v_clause || E'\n### Termo de aceite'),
     true,now());
END;
$$;
