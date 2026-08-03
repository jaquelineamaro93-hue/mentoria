import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const supabase = createAdminClient();

    // Buscar Kariny por nome
    const { data: profiles, error: searchError } = await supabase
      .from('profiles')
      .select('id, nome, email')
      .ilike('nome', '%kariny%');

    if (searchError || !profiles || profiles.length === 0) {
      return NextResponse.json(
        { error: 'Kariny não encontrada', profiles },
        { status: 404 }
      );
    }

    const kariny = profiles[0];
    console.log(`Preenchendo dados para: ${kariny.nome} (ID: ${kariny.id})`);

    // Dados do Mapa da Essência
    let mapaMarkdown = '# Mapa de Quem Sou Eu - KARINY MORÉ\n\n';
    mapaMarkdown += '_Essência: síntese das 9 áreas exploradas._\n\n';

    const mapaDados: Record<number, { titulo: string; conteudo: string }> = {
      1: {
        titulo: 'Valores e crenças',
        conteudo: 'Inegociável: respeito, integridade e transparência — a base de tudo que acredito e ofereço. Crença profunda: fé em Deus e senso de missão, combinada com responsabilidade total pelas próprias escolhas. Motor invisível: a vontade de ser reconhecida, de vencer, de ser boa no que faz. Sombra: nunca estar satisfeita, querer sempre mais. Luz: não ser uma mulher acomodada — a mesma inquietação que limita também impulsiona. Ferida de valor: já traiu a empatia em nome da arrogância, num momento pontual movido pela pressa de vencer.'
      },
      2: {
        titulo: 'Momentos de potência',
        conteudo: 'Senti-se inteira: apresentando o TCC sozinha — autoria e autonomia total. Presença que mudou o ambiente: acordar a sobrinha com um café da manhã de aniversário, recebendo um abraço de pura felicidade. Perde a noção do tempo: estruturando um dashboard — imersão analítica e criativa. Padrão: a potência nasce da mistura entre autonomia técnica e cuidado intencional.'
      },
      3: {
        titulo: 'Feridas que viraram força',
        conteudo: 'Dor formadora: a força e a guerra da própria mãe. Sangrou e floresceu: a ausência do pai e rupturas de relacionamento — mas floresceu pelo amor da mãe e pela fé. A cicatriz fala: "o choro dura uma noite, mas a alegria vem pela manhã". Potência: idealizar sonhos, acreditar e agir mudando tudo. Herança: a resiliência da mãe virou manifestação ativa.'
      },
      4: {
        titulo: 'Ciclos e energia',
        conteudo: 'Mais produtiva e criativa: depois do treino ou à noite. Precisa de recolhimento: dias de TPM. Corpo pede e ela ignora: o sono — se obriga a acordar cedo mesmo cansada. Padrão: dificuldade de se permitir descansar de verdade.'
      },
      5: {
        titulo: 'Chamados esquecidos',
        conteudo: 'Desejo adormecido: ser mãe. Amava na infância: fazer poemas, escrever cartas. Perde a noção do tempo: estando com o namorado — imersão afetiva. Ideia guardada, nunca movida: criar um caderno customizado de receitas, como os cadernos antigos de vó.'
      },
      6: {
        titulo: 'Contribuição',
        conteudo: 'Tem a oferecer: a necessidade de ser útil — no trabalho, no relacionamento, nas amizades. O mundo precisa: amor e utilidade aos outros. Sua história transforma: porque prova que, não importa quantas vezes se caia no "tanque de tubarões", dá pra continuar sabendo de onde se veio. Dor superada que guia o outro: rupturas com o sexo oposto.'
      },
      7: {
        titulo: 'Paixões',
        conteudo: 'Acende a alma: ver o nascer do sol. Ama aprender: cozinhar. Faria sem ser paga: fazer pães. Temas que fascinam: culinária e a mente humana. Fio condutor: o sol que nasce e o pão que fermenta falam a mesma língua — tempo, paciência e recomeco.'
      },
      8: {
        titulo: 'Conhecimentos e habilidades',
        conteudo: 'Domina: campanhas completas no Marketing Cloud — Email, Push, SMS, WhatsApp, Jornadas. Diferencial: facilidade para planejar e organizar demandas e processos. O que sustenta hoje: gestão de CRM. Como ninguém: comunicar-se com clareza e organização entre as áreas.'
      },
      9: {
        titulo: 'Presença atual',
        conteudo: 'Sufocada: o desejo de aprender a parte técnica, sem saber ainda o caminho. Viva e pulsando: a vontade de aprender. Sem voz: a criatividade, travada pela falta de conhecimento técnico e pelo medo de errar.'
      }
    };

    Object.entries(mapaDados).forEach(([num, dados]) => {
      mapaMarkdown += `## ${num}. ${dados.titulo}\n\n${dados.conteudo}\n\n`;
    });

    mapaMarkdown += `## Lado Sombra\n\nO que puxa para baixo, o que trava, o que ainda pede cuidado — reunido num só lugar para ser encarado de frente, não escondido nos ramos do mapa.\n\n`;
    mapaMarkdown += `**1. Crença que limita:** O padrão: nunca estar satisfeita, sempre querer mais — mesmo diante de conquistas reais.\n\n`;
    mapaMarkdown += `**2. Valor já traído:** O que aconteceu: a empatia cedeu espaço à arrogância em um momento específico, puxada pela pressa e pela vontade de vencer.\n\n`;
    mapaMarkdown += `**3. Tensão entre paciência e impulsividade:** O padrão: sede de que as coisas aconteçam do seu jeito, dificuldade de se entregar ao processo — a mesma pressa que contrói também cobra demais.\n\n`;
    mapaMarkdown += `**4. Corpo ignorado:** O sinal ignorado: o sono. Mesmo cansada nos finais de semana, se obriga a acordar cedo, como se descansar não fosse permitido.\n\n`;
    mapaMarkdown += `**5. Presença sufocada:** O que trava: o desejo de aprender a parte técnica, sem saber ainda o caminho — e, junto disso, o medo de errar.\n\n`;
    mapaMarkdown += `**6. Criatividade sem voz:** O que cala: a criatividade existe e pulsa, mas fica em silêncio porque a falta de domínio técnico alimenta o medo de error.\n\n`;

    // Dados da Bussola
    const bussolaDados = {
      norte: 'Respeito, integridade e transparência são o chão que não se negocia — mesmo quando a vontade de vencer aperta, mesmo quando a impaciência grita. A mensagem tem um limite claro: pode ser ambiciosa, pode empurrar por resultado, mas nunca abre mão de tratar o outro com verdade. O tom é de alguém que age com fé e propósito, mas que também assume a responsabilidade total pelo controle — não é sorte, não é destino: é escolha, disciplina e integridade.',
      sul: 'A dor que ensinou tudo foi ver a própria mãe em guerra — e sobreviver a isso com fé e amor, mesmo sangrando com a ausência do pai e rupturas de relacionamento. Essa é a raiz do propósito: já atravessou o "tanque de tubarões" e sabe voltar inteira. O propósito é guiar quem está no meio de uma ruptura — profissional, afetiva, de identidade — mostrando que dor não é ponto final, apenas a noite antes da manhã. Faço o que faço porque precisa provar a si mesmo que, com propósito, nenhum objetivo é impossível.',
      leste: 'A energia nasce do movimento (treino) e da quietude (a noite) — dois extremos que se encontram. Os dias de TPM pedem recolhimento, e isso deveria ser respeitado, não ignorado. O ponto onde mais me perco é o sono: a cobrança de acordar cedo mesmo exausta é a mesma inquietação que nunca se satisfaz. Para o posicionamento profissional: entregas de alta exigência analítica (como dashboards) rendem mais à noite; decisões e comunicação rendem mais depois do movimento físico; os dias de baixa devem ser blindados como espaço de recolhimento, não de culpa.',
      oeste: 'Autoridade técnica real: domínio de campanhas multicanal em Marketing Cloud, capacidade de estruturar o caos (como no dashboard em que perdi a noção do tempo) e comunicar isso com clareza cristalina para qualquer área. Mas a emoção que sustenta essa autoridade vem de outro lugar: a paixão pelo tempo — o pão que nasce — e pela mente humana. A mensagem verdadeira não é "eu sou organizada em processos": é "eu sou transformadora do que parecia caótico em algo que funciona com paciência e verdade" — seja um dashboard, seja uma jornada de CRM, seja a vida de alguém.',
      centro: 'Hoje sou alguém que domina o operacional do CRM, mas sente a criatividade sufocada pelo medo de error no técnico — a mesma vontade de aprender que pulsa viva também trava por falta de caminho claro. Me recuso a ignorar essa fome de crescer, mesmo sem saber exatamente por onde. E estou resgatando, aos poucos, os chamados antigos: a escrita (poemas, cartas), o cuidado manual (o caderno de receitas de vó), o desejo de ser mãe — partes que ficaram em segundo plano enquanto a estrategista se firmava. O posicionamento de hoje não é fixo: é a estrategista técnica se permitindo, devagar, dar voz à artista e à cuidadora que sempre estiveram ali.'
    };

    // 1. Inserir/atualizar BussolaPosicionamento
    const { error: bussolaError } = await supabase
      .from('bussola_posicionamento')
      .upsert(
        {
          user_id: kariny.id,
          norte: bussolaDados.norte,
          sul: bussolaDados.sul,
          leste: bussolaDados.leste,
          oeste: bussolaDados.oeste,
          centro: bussolaDados.centro,
          gerado_em: new Date().toISOString()
        },
        { onConflict: 'user_id' }
      );

    if (bussolaError) {
      console.error('Erro ao inserir Bussola:', bussolaError);
      return NextResponse.json(
        { error: 'Erro ao preencher Bussola', details: bussolaError },
        { status: 500 }
      );
    }

    // 2. Inserir/atualizar MapaEssencia
    const { error: mapaError } = await supabase
      .from('mapa_essencia')
      .upsert(
        {
          user_id: kariny.id,
          conteudo_markdown: mapaMarkdown,
          gerado_em: new Date().toISOString()
        },
        { onConflict: 'user_id' }
      );

    if (mapaError) {
      console.error('Erro ao inserir Mapa:', mapaError);
      return NextResponse.json(
        { error: 'Erro ao preencher Mapa', details: mapaError },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: '✅ Dados da Kariny preenchidos com sucesso!',
      kariny: {
        id: kariny.id,
        nome: kariny.nome,
        email: kariny.email
      },
      preenchido: {
        bussola_posicionamento: 'Concluída',
        mapa_essencia: 'Concluída'
      }
    });
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao processar', details: String(error) },
      { status: 500 }
    );
  }
}
