'use strict';
// Álbum Brasil: dez missões temáticas, cada uma com a figurinha do assunto como prêmio (ver figurinhas.js).
// O inglês é o assunto; o tema (bichos ameaçados, gente que trabalha, terra e floresta) é o contexto.
// Mesmo formato de missoes-extra.js. Textos de ensino em português; exemplos em inglês simples.
// Tom: dignidade e honestidade, sem dramatizar. Estados de ameaça e afirmações factuais: conferir antes de publicar.

const B = [];
const x = (id, n, tipo, extra) => ({ id: `${id}-${n}`, tipo, ...extra });

// ---------- animais ----------
B.push({
  id: 'brasil-arara', figurinha: 'arara',
  titulo: 'Brasil: arara-azul-grande',
  podeFazer: 'Consigo descrever a arara-azul e dizer que ela está em perigo.',
  nivel: 'A1', tags: [],
  vocab: [
    { en: 'macaw', pt: 'arara', ex: 'The macaw is blue.' },
    { en: 'blue', pt: 'azul', ex: 'The sky is blue.' },
    { en: 'big', pt: 'grande', ex: 'It is a big bird.' },
    { en: 'bird', pt: 'pássaro', ex: 'A bird can fly.' },
    { en: 'forest', pt: 'floresta', ex: 'The forest is green.' },
    { en: 'in danger', pt: 'em perigo', ex: 'The macaw is in danger.' },
  ],
  explicacao: {
    titulo: 'Para descrever, use "is" e "are"',
    texto: 'Em inglês, para dizer como algo é, o verbo não pode faltar: "The macaw is blue." (is para um, are para vários: "The birds are big."). A arara-azul-grande é o maior papagaio do mundo e está em perigo porque perde o lugar onde vive e ainda é capturada para o comércio ilegal. Ao aprender estas frases, você aprende o bicho e o problema dele.',
    estrutura: ['The [animal] is [cor ou tamanho].', 'It is a big bird.', 'The birds are in danger.'],
  },
  exemplos: [
    { en: 'The macaw is blue.', pt: 'A arara é azul.' },
    { en: 'It is a big bird.', pt: 'É um pássaro grande.' },
    { en: 'The macaws live in the forest.', pt: 'As araras vivem na floresta.' },
    { en: 'The macaw is in danger.', pt: 'A arara está em perigo.' },
  ],
  exercicios: [
    x('brasil-arara', 1, 'escolha', { habilidade: 'vocabulario', dif: 1, enunciado: 'O que significa "macaw"?', opcoes: ['arara', 'papagaio pequeno', 'macaco'], resposta: 0, explica: 'Macaw = arara. Não é "macaco" (monkey).' }),
    x('brasil-arara', 2, 'escolha', { habilidade: 'gramatica', dif: 1, enunciado: 'Qual frase está certa?', opcoes: ['The macaw is blue.', 'The macaw blue.', 'The macaw are blue.'], resposta: 0, explica: 'Em inglês o verbo is não pode faltar: The macaw is blue.' }),
    x('brasil-arara', 3, 'lacuna', { habilidade: 'gramatica', dif: 1, frase: 'The macaw ___ a big bird.', resposta: ['is'], explica: 'Um só animal: is.' }),
    x('brasil-arara', 4, 'lacuna', { habilidade: 'gramatica', dif: 1, frase: 'The birds ___ in danger.', resposta: ['are'], explica: 'Vários animais: are.' }),
    x('brasil-arara', 5, 'escuta', { habilidade: 'escuta', dif: 1, audio: 'The macaw is in danger.', pergunta: 'O que a voz disse?', opcoes: ['A arara está em perigo', 'A arara é grande', 'A arara está na floresta'], resposta: 0, explica: '"In danger" é em perigo.' }),
    x('brasil-arara', 6, 'ditado', { habilidade: 'escuta', dif: 1, audio: 'The macaw is blue.', resposta: ['The macaw is blue'], explica: 'Macaw = arara, blue = azul.' }),
    x('brasil-arara', 7, 'ordenar', { habilidade: 'gramatica', dif: 1, palavras: ['It', 'is', 'a', 'big', 'bird'], resposta: 'It is a big bird', explica: 'It is a + adjetivo + substantivo.' }),
    x('brasil-arara', 8, 'traduzir', { habilidade: 'escrita', dif: 1, pt: 'A arara é azul.', aceitas: ['The macaw is blue', 'A macaw is blue'], explica: 'A arara é azul: The macaw is blue.' }),
    x('brasil-arara', 9, 'leitura', { habilidade: 'leitura', dif: 1, texto: 'The macaw is a big blue bird. It lives in the forest. It is in danger because the forest is getting smaller.', pergunta: 'Por que a arara está em perigo?', opcoes: ['A floresta onde vive está diminuindo', 'Ela não sabe voar', 'Ela vive só na água'], resposta: 0, explica: 'O texto diz que a floresta onde ela vive está ficando menor.' }),
  ],
  tarefa: {
    enunciado: 'Escreva 3 frases sobre a arara-azul: como ela é, onde vive e se está em perigo.',
    minPalavras: 12,
    elementos: [
      { nome: 'como ela é', padroes: ['\\bis (?:a )?(?:big|blue|beautiful)\\b', '\\bare (?:big|blue|beautiful)\\b'] },
      { nome: 'onde ela vive', padroes: ['\\blives? in\\b'] },
      { nome: 'que está em perigo', padroes: ['\\bin danger\\b'] },
    ],
    tagsChave: [],
    dicas: ['The macaw is ...', 'It lives in ...', 'It is in danger.'],
    modelo: 'The macaw is a big blue bird. It lives in the forest. The macaw is in danger.',
  },
  reteste: [
    'Descreva outro animal que você conhece: como ele é e onde vive.',
    'Explique em duas frases por que a arara-azul precisa da floresta.',
  ],
  conversa: 'zero-conhecer',
});

B.push({
  id: 'brasil-mico', figurinha: 'mico',
  titulo: 'Brasil: mico-leão-dourado',
  podeFazer: 'Consigo dizer onde o mico-leão-dourado vive e quem o protege.',
  nivel: 'A1', tags: ['preposicoes'],
  vocab: [
    { en: 'tamarin', pt: 'mico', ex: 'The tamarin is small and golden.' },
    { en: 'golden', pt: 'dourado', ex: 'It has golden fur.' },
    { en: 'tree', pt: 'árvore', ex: 'The tamarin lives in a tree.' },
    { en: 'lives in', pt: 'vive em', ex: 'It lives in the Atlantic Forest.' },
    { en: 'there are', pt: 'há (vários)', ex: 'There are many trees.' },
    { en: 'protect', pt: 'proteger', ex: 'People protect the forest.' },
  ],
  explicacao: {
    titulo: 'Onde vive? Use "lives in"',
    texto: 'Para dizer onde um animal vive, use "lives in" + o lugar: "It lives in the forest." Repare no -s depois de it. Para dizer que existem vários, use "there are": "There are many trees." O mico-leão-dourado só vive na Mata Atlântica, que perdeu a maior parte das árvores. Hoje ele está voltando, graças a quem protege a mata.',
    estrutura: ['It lives in [lugar].', 'There are [muitas] [coisas].', 'People protect the forest.'],
  },
  exemplos: [
    { en: 'The tamarin has golden fur.', pt: 'O mico tem pelo dourado.' },
    { en: 'It lives in the Atlantic Forest.', pt: 'Ele vive na Mata Atlântica.' },
    { en: 'There are many trees in the forest.', pt: 'Há muitas árvores na floresta.' },
    { en: 'People protect the forest, and the tamarin is coming back.', pt: 'As pessoas protegem a floresta, e o mico está voltando.' },
  ],
  exercicios: [
    x('brasil-mico', 1, 'escolha', { habilidade: 'vocabulario', dif: 1, enunciado: 'O que significa "golden"?', opcoes: ['dourado', 'grande', 'pequeno'], resposta: 0, explica: 'Golden = dourado, da cor do ouro.' }),
    x('brasil-mico', 2, 'escolha', { habilidade: 'gramatica', dif: 1, enunciado: 'Qual frase diz onde o mico vive?', opcoes: ['It lives in the forest.', 'It live in the forest.', 'It lives the forest.'], resposta: 0, explica: 'Com it, o verbo leva -s (lives) e depois vem in.' }),
    x('brasil-mico', 3, 'lacuna', { habilidade: 'gramatica', tag: 'preposicoes', dif: 1, frase: 'The tamarin lives ___ the Atlantic Forest.', resposta: ['in'], explica: 'Lugar grande (floresta, cidade, país) leva in.' }),
    x('brasil-mico', 4, 'lacuna', { habilidade: 'gramatica', dif: 1, frase: 'There ___ many trees.', resposta: ['are'], explica: 'Vários: there are.' }),
    x('brasil-mico', 5, 'escuta', { habilidade: 'escuta', dif: 1, audio: 'It lives in the Atlantic Forest.', pergunta: 'Onde ele vive?', opcoes: ['Na Mata Atlântica', 'No mar', 'Na cidade'], resposta: 0, explica: 'Atlantic Forest = Mata Atlântica.' }),
    x('brasil-mico', 6, 'ditado', { habilidade: 'escuta', dif: 1, audio: 'The tamarin has golden fur.', resposta: ['The tamarin has golden fur'], explica: 'Fur = pelo; golden fur = pelo dourado.' }),
    x('brasil-mico', 7, 'ordenar', { habilidade: 'gramatica', dif: 1, palavras: ['It', 'lives', 'in', 'a', 'tree'], resposta: 'It lives in a tree', explica: 'It lives in + lugar.' }),
    x('brasil-mico', 8, 'traduzir', { habilidade: 'escrita', dif: 1, pt: 'Ele vive na floresta.', aceitas: ['It lives in the forest', 'He lives in the forest'], explica: 'Ele vive na floresta: It lives in the forest.' }),
    x('brasil-mico', 9, 'leitura', { habilidade: 'leitura', dif: 1, texto: 'The golden tamarin lives only in the Atlantic Forest. The forest lost many trees, and the tamarin was in danger. Now people protect the forest, and there are more tamarins.', pergunta: 'O que ajudou o mico a voltar?', opcoes: ['Pessoas protegerem a floresta', 'Ele mudou de país', 'Ele aprendeu a viver na cidade'], resposta: 0, explica: 'O texto diz que as pessoas protegem a floresta e que há mais micos.' }),
  ],
  tarefa: {
    enunciado: 'Escreva 3 frases sobre o mico-leão-dourado: como ele é, onde vive e quem o ajuda.',
    minPalavras: 14,
    elementos: [
      { nome: 'o mico', padroes: ['\\btamarin\\b', '\\bmonkey\\b'] },
      { nome: 'onde ele vive', padroes: ['\\blives? in\\b'] },
      { nome: 'quem o ajuda', padroes: ['\\bprotect', '\\bhelp'] },
    ],
    tagsChave: ['preposicoes'],
    dicas: ['The tamarin is ...', 'It lives in ...', 'People protect ...'],
    modelo: 'The golden tamarin is small. It lives in the Atlantic Forest. People protect the forest and help the tamarin.',
  },
  reteste: [
    'Escreva onde vive um animal da sua região e como ele é.',
    'Explique em duas frases por que proteger a floresta ajuda os animais.',
  ],
  conversa: 'zero-conhecer',
});

B.push({
  id: 'brasil-onca', figurinha: 'onca',
  titulo: 'Brasil: onça-pintada',
  podeFazer: 'Consigo dizer do que a onça precisa e o que ameaça a floresta dela.',
  nivel: 'A2', tags: ['terceira-pessoa'],
  vocab: [
    { en: 'jaguar', pt: 'onça-pintada', ex: 'The jaguar is a strong cat.' },
    { en: 'space', pt: 'espaço', ex: 'It needs a lot of space.' },
    { en: 'need', pt: 'precisar', ex: 'The jaguar needs water.' },
    { en: 'fire', pt: 'fogo, queimada', ex: 'Fire can burn the forest.' },
    { en: 'farm', pt: 'fazenda', ex: 'A farm can cut the forest.' },
    { en: 'hunt', pt: 'caçar', ex: 'It hunts at night.' },
  ],
  explicacao: {
    titulo: 'Com he, she e it, o verbo ganha -s',
    texto: 'Quando o sujeito é um só (he, she, it ou "the jaguar"), o verbo no presente leva -s: "The jaguar needs space." "It hunts at night." Para dizer o que algo pode fazer, use can, que nunca leva -s: "Fire can burn the forest." A onça-pintada precisa de muito espaço, e queimadas e fazendas cortam a floresta dela em pedacinhos.',
    estrutura: ['The jaguar needs [coisa].', 'It [verbo]s at night.', 'Fire can [verbo] the forest.'],
  },
  exemplos: [
    { en: 'The jaguar needs a lot of space.', pt: 'A onça precisa de muito espaço.' },
    { en: 'It hunts at night.', pt: 'Ela caça à noite.' },
    { en: 'Fire can burn the forest.', pt: 'O fogo pode queimar a floresta.' },
    { en: 'A jaguar can swim very well.', pt: 'A onça nada muito bem.' },
  ],
  exercicios: [
    x('brasil-onca', 1, 'escolha', { habilidade: 'vocabulario', dif: 1, enunciado: 'O que significa "need"?', opcoes: ['precisar', 'ver', 'levar'], resposta: 0, explica: 'Need = precisar.' }),
    x('brasil-onca', 2, 'escolha', { habilidade: 'gramatica', dif: 2, enunciado: 'Qual frase está certa?', opcoes: ['The jaguar needs water.', 'The jaguar need water.', 'The jaguar needing water.'], resposta: 0, explica: 'Sujeito no singular: need vira needs.' }),
    x('brasil-onca', 3, 'lacuna', { habilidade: 'gramatica', tag: 'terceira-pessoa', dif: 2, frase: 'The jaguar ___ a lot of space.', resposta: ['needs'], explica: 'The jaguar é como it: o verbo leva -s.' }),
    x('brasil-onca', 4, 'lacuna', { habilidade: 'gramatica', dif: 2, frase: 'Fire ___ burn the forest.', resposta: ['can'], explica: 'Can não leva -s e vem antes do verbo.' }),
    x('brasil-onca', 5, 'escuta', { habilidade: 'escuta', dif: 2, audio: 'The jaguar hunts at night.', pergunta: 'Quando a onça caça?', opcoes: ['À noite', 'De manhã', 'No inverno'], resposta: 0, explica: 'At night = à noite.' }),
    x('brasil-onca', 6, 'ditado', { habilidade: 'escuta', dif: 2, audio: 'It needs a lot of space.', resposta: ['It needs a lot of space'], explica: 'A lot of = muito.' }),
    x('brasil-onca', 7, 'ordenar', { habilidade: 'gramatica', dif: 2, palavras: ['Fire', 'can', 'burn', 'the', 'forest'], resposta: 'Fire can burn the forest', explica: 'Sujeito + can + verbo + resto.' }),
    x('brasil-onca', 8, 'traduzir', { habilidade: 'escrita', dif: 2, pt: 'A onça precisa de espaço.', aceitas: ['The jaguar needs space', 'The jaguar needs a lot of space', 'A jaguar needs space'], explica: 'A onça precisa de espaço: The jaguar needs space.' }),
    x('brasil-onca', 9, 'leitura', { habilidade: 'leitura', dif: 2, texto: 'Jaguars live alone and need a big forest. Farms and fires cut the forest into small pieces. Then the jaguar cannot find food or a partner.', pergunta: 'Por que a onça tem problema?', opcoes: ['A floresta dela é cortada em pedaços', 'Ela não gosta de água', 'Ela caça de dia'], resposta: 0, explica: 'O texto diz que fazendas e queimadas cortam a floresta em pedaços.' }),
  ],
  tarefa: {
    enunciado: 'Escreva 3 frases sobre a onça-pintada: do que ela precisa, o que ela faz e o que ameaça a floresta dela.',
    minPalavras: 18,
    elementos: [
      { nome: 'do que ela precisa', padroes: ['\\bneeds?\\b'] },
      { nome: 'o que ela faz', padroes: ['\\b(?:hunts?|swims?|lives?|eats?)\\b'] },
      { nome: 'o que ameaça a floresta', padroes: ['\\bfires?\\b', '\\bfarms?\\b'] },
    ],
    tagsChave: ['terceira-pessoa'],
    dicas: ['The jaguar needs ...', 'It hunts ...', 'Fires and farms ...'],
    modelo: 'The jaguar needs a lot of space. It hunts at night and it swims very well. Fires and farms cut the forest into small pieces.',
  },
  reteste: [
    'Escreva três frases sobre um animal que você acha bonito: do que ele precisa e o que ele faz.',
    'Explique em duas frases por que animais grandes precisam de muito espaço.',
  ],
  conversa: 'small-talk',
});

B.push({
  id: 'brasil-peixeboi', figurinha: 'peixeboi',
  titulo: 'Brasil: peixe-boi-marinho',
  podeFazer: 'Consigo dizer o que o peixe-boi come e o que o machuca.',
  nivel: 'A2', tags: ['incontaveis'],
  vocab: [
    { en: 'manatee', pt: 'peixe-boi', ex: 'The manatee eats seagrass.' },
    { en: 'seagrass', pt: 'capim-marinho', ex: 'Seagrass grows in shallow water.' },
    { en: 'boat', pt: 'barco', ex: 'A boat can hurt a manatee.' },
    { en: 'net', pt: 'rede', ex: 'The manatee can get stuck in a net.' },
    { en: 'mangrove', pt: 'manguezal', ex: 'The mangrove is a home for many animals.' },
    { en: 'gentle', pt: 'manso', ex: 'The manatee is a gentle animal.' },
  ],
  explicacao: {
    titulo: 'Incontáveis: "a lot of" e "much", não "many"',
    texto: 'Palavras como water, food e seagrass são incontáveis: não têm plural e não usam "many". Diga "a lot of water" ou "some food", e use "much" nas frases negativas e nas perguntas: "There is not much clean water." Já os contáveis usam many: "many boats". O peixe-boi come muito capim-marinho, mas se machuca com barcos e redes, e perde os manguezais e a água rasa onde vive.',
    estrutura: ['It eats a lot of [incontável].', 'Many [contável no plural] hurt it.', 'There is not much [incontável].'],
  },
  exemplos: [
    { en: 'The manatee eats a lot of seagrass.', pt: 'O peixe-boi come muito capim-marinho.' },
    { en: 'There is not much clean water.', pt: 'Não há muita água limpa.' },
    { en: 'Many boats and nets hurt the manatee.', pt: 'Muitos barcos e redes machucam o peixe-boi.' },
    { en: 'The manatee is a gentle animal.', pt: 'O peixe-boi é um animal manso.' },
  ],
  exercicios: [
    x('brasil-peixeboi', 1, 'escolha', { habilidade: 'vocabulario', dif: 1, enunciado: 'O que significa "gentle"?', opcoes: ['manso', 'rápido', 'perigoso'], resposta: 0, explica: 'Gentle = manso, delicado.' }),
    x('brasil-peixeboi', 2, 'escolha', { habilidade: 'gramatica', dif: 2, enunciado: 'Qual frase está certa?', opcoes: ['The manatee eats a lot of seagrass.', 'The manatee eats many seagrass.', 'The manatee eats a seagrasses.'], resposta: 0, explica: 'Seagrass é incontável: use a lot of, não many.' }),
    x('brasil-peixeboi', 3, 'lacuna', { habilidade: 'gramatica', tag: 'incontaveis', dif: 2, frase: 'There are many ___ in the water.', resposta: ['boats'], explica: 'Contável no plural: many boats.' }),
    x('brasil-peixeboi', 4, 'lacuna', { habilidade: 'gramatica', tag: 'incontaveis', dif: 2, frase: 'There is not ___ clean water.', resposta: ['much'], explica: 'Incontável em frase negativa: much.' }),
    x('brasil-peixeboi', 5, 'escuta', { habilidade: 'escuta', dif: 2, audio: 'The manatee eats a lot of seagrass.', pergunta: 'O que o peixe-boi come?', opcoes: ['Capim-marinho', 'Peixes pequenos', 'Frutas'], resposta: 0, explica: 'Seagrass é o capim-marinho.' }),
    x('brasil-peixeboi', 6, 'ditado', { habilidade: 'escuta', dif: 2, audio: 'Many boats hurt the manatee.', resposta: ['Many boats hurt the manatee'], explica: 'Hurt = machucar.' }),
    x('brasil-peixeboi', 7, 'ordenar', { habilidade: 'gramatica', dif: 2, palavras: ['The', 'manatee', 'is', 'a', 'gentle', 'animal'], resposta: 'The manatee is a gentle animal', explica: 'Sujeito + is + a + adjetivo + substantivo.' }),
    x('brasil-peixeboi', 8, 'traduzir', { habilidade: 'escrita', dif: 2, pt: 'O peixe-boi come muito capim-marinho.', aceitas: ['The manatee eats a lot of seagrass', 'The manatee eats lots of seagrass'], explica: 'Muito + incontável: a lot of.' }),
    x('brasil-peixeboi', 9, 'leitura', { habilidade: 'leitura', dif: 2, texto: 'The manatee is slow and gentle. It lives in warm, shallow water and eats a lot of seagrass. Boats and fishing nets hurt many manatees.', pergunta: 'O que machuca o peixe-boi?', opcoes: ['Barcos e redes de pesca', 'O frio', 'Outros animais grandes'], resposta: 0, explica: 'O texto diz que barcos e redes de pesca machucam o peixe-boi.' }),
  ],
  tarefa: {
    enunciado: 'Escreva 3 frases: o que o peixe-boi come, como ele é e o que o machuca.',
    minPalavras: 18,
    elementos: [
      { nome: 'o que ele come', padroes: ['\\beats?\\b'] },
      { nome: 'como ele é', padroes: ['\\bgentle\\b', '\\bslow\\b', '\\bis an? \\w+'] },
      { nome: 'o que o machuca', padroes: ['\\bboats?\\b', '\\bnets?\\b'] },
    ],
    tagsChave: ['incontaveis'],
    dicas: ['The manatee eats a lot of ...', 'It is ...', 'Boats and nets ...'],
    modelo: 'The manatee eats a lot of seagrass. It is a gentle animal and it is very slow. Boats and fishing nets hurt many manatees.',
  },
  reteste: [
    'Escreva três frases sobre o que você come num dia: use "a lot of" e "many".',
    'Explique em duas frases como barcos e redes podem machucar um animal do mar.',
  ],
  conversa: 'small-talk',
});

B.push({
  id: 'brasil-tartaruga', figurinha: 'tartaruga',
  titulo: 'Brasil: tartaruga-de-pente',
  podeFazer: 'Consigo falar do que ameaça as tartarugas marinhas e de como as pessoas ajudam.',
  nivel: 'A2', tags: ['people-plural'],
  vocab: [
    { en: 'turtle', pt: 'tartaruga', ex: 'The sea turtle swims in the ocean.' },
    { en: 'plastic', pt: 'plástico', ex: 'Plastic is dangerous for turtles.' },
    { en: 'beach', pt: 'praia', ex: 'The turtle goes to the beach.' },
    { en: 'nest', pt: 'ninho', ex: 'The turtle makes a nest in the sand.' },
    { en: 'protect', pt: 'proteger', ex: 'Many people protect the nests.' },
    { en: 'trash', pt: 'lixo', ex: 'Please do not leave trash on the beach.' },
  ],
  explicacao: {
    titulo: '"People" é plural: use "are"',
    texto: 'Em inglês, people é plural: "People are on the beach", e não "People is". Também dizemos "Many people work to protect the nests." Para pedir com educação, use please e do not: "Please do not leave trash." A tartaruga-de-pente está em perigo porque o plástico, as redes de pesca e a perda de praias atrapalham a vida dela, mas muita gente trabalha para proteger os ninhos.',
    estrutura: ['People are [ação].', 'Many people [verbo].', 'Please do not [verbo].'],
  },
  exemplos: [
    { en: 'People are on the beach.', pt: 'As pessoas estão na praia.' },
    { en: 'Many people work to protect the nests.', pt: 'Muita gente trabalha para proteger os ninhos.' },
    { en: 'Plastic is dangerous for sea turtles.', pt: 'O plástico é perigoso para as tartarugas marinhas.' },
    { en: 'Please do not leave trash on the beach.', pt: 'Por favor, não deixe lixo na praia.' },
  ],
  exercicios: [
    x('brasil-tartaruga', 1, 'escolha', { habilidade: 'vocabulario', dif: 1, enunciado: 'O que significa "nest"?', opcoes: ['ninho', 'casco', 'onda'], resposta: 0, explica: 'Nest = ninho.' }),
    x('brasil-tartaruga', 2, 'escolha', { habilidade: 'gramatica', dif: 2, enunciado: 'Qual frase está certa?', opcoes: ['People are on the beach.', 'People is on the beach.', 'Peoples are on the beach.'], resposta: 0, explica: 'People é plural: are.' }),
    x('brasil-tartaruga', 3, 'lacuna', { habilidade: 'gramatica', tag: 'people-plural', dif: 2, frase: 'Many people ___ to protect the nests.', resposta: ['work'], explica: 'People é plural: o verbo fica sem -s.' }),
    x('brasil-tartaruga', 4, 'lacuna', { habilidade: 'gramatica', dif: 2, frase: 'Plastic ___ dangerous for sea turtles.', resposta: ['is'], explica: 'Plastic é singular: is.' }),
    x('brasil-tartaruga', 5, 'escuta', { habilidade: 'escuta', dif: 2, audio: 'Please do not leave trash on the beach.', pergunta: 'O que a voz pede?', opcoes: ['Para não deixar lixo na praia', 'Para limpar a casa', 'Para pegar a tartaruga'], resposta: 0, explica: '"Do not leave trash" é não deixe lixo.' }),
    x('brasil-tartaruga', 6, 'ditado', { habilidade: 'escuta', dif: 2, audio: 'People are on the beach.', resposta: ['People are on the beach'], explica: 'People are = as pessoas estão.' }),
    x('brasil-tartaruga', 7, 'ordenar', { habilidade: 'gramatica', dif: 2, palavras: ['Many', 'people', 'work', 'to', 'protect', 'the', 'nests'], resposta: 'Many people work to protect the nests', explica: 'Work to + verbo mostra a finalidade.' }),
    x('brasil-tartaruga', 8, 'traduzir', { habilidade: 'escrita', dif: 2, pt: 'O plástico é perigoso para as tartarugas.', aceitas: ['Plastic is dangerous for turtles', 'Plastic is dangerous for the turtles', 'Plastic is dangerous for sea turtles'], explica: 'O plástico é perigoso para as tartarugas: Plastic is dangerous for turtles.' }),
    x('brasil-tartaruga', 9, 'leitura', { habilidade: 'leitura', dif: 2, texto: 'The sea turtle goes to the beach to lay eggs. Plastic, fishing nets and lost beaches put it in danger. Many people work to protect the nests and clean the beaches.', pergunta: 'O que muita gente faz?', opcoes: ['Protege os ninhos e limpa as praias', 'Pesca tartarugas', 'Constrói casas na praia'], resposta: 0, explica: 'O texto diz que muita gente protege os ninhos e limpa as praias.' }),
  ],
  tarefa: {
    enunciado: 'Escreva 3 frases: o que põe a tartaruga em perigo, o que as pessoas fazem para ajudar e um pedido para quem vai à praia.',
    minPalavras: 20,
    elementos: [
      { nome: 'o que a põe em perigo', padroes: ['\\bplastic\\b', '\\bnets?\\b', '\\bdanger'] },
      { nome: 'o que as pessoas fazem', padroes: ['\\bpeople (?:are|work|protect|clean)\\b'] },
      { nome: 'um pedido', padroes: ['\\bplease\\b', '\\bdo not\\b', "\\bdon't\\b"] },
    ],
    tagsChave: ['people-plural'],
    dicas: ['Plastic and nets ...', 'Many people ...', 'Please do not ...'],
    modelo: 'Plastic and fishing nets put the sea turtle in danger. Many people work to protect the nests and clean the beaches. Please do not leave trash on the beach.',
  },
  reteste: [
    'Escreva três frases sobre o que as pessoas da sua cidade fazem para cuidar do lugar onde vivem.',
    'Escreva um pedido educado para quem vai a uma praia ou a um parque.',
  ],
  conversa: 'small-talk',
});

B.push({
  id: 'brasil-lobo', figurinha: 'lobo',
  titulo: 'Brasil: lobo-guará',
  podeFazer: 'Consigo descrever o lobo-guará e dizer por que o Cerrado importa.',
  nivel: 'A2', tags: ['terceira-pessoa'],
  vocab: [
    { en: 'maned wolf', pt: 'lobo-guará', ex: 'The maned wolf lives in the Cerrado.' },
    { en: 'leg', pt: 'perna', ex: 'It has very long legs.' },
    { en: 'tall', pt: 'alto', ex: 'It is taller than many dogs.' },
    { en: 'road', pt: 'estrada', ex: 'Cars hurt wolves on the road.' },
    { en: 'grass', pt: 'capim', ex: 'The grass is tall and golden.' },
    { en: 'smaller', pt: 'menor', ex: 'The Cerrado is getting smaller.' },
  ],
  explicacao: {
    titulo: 'Comparar com -er e "than"',
    texto: 'Para comparar, junte -er ao adjetivo curto e use than: "taller than", "smaller than" (tall vira taller, small vira smaller). Para falar de partes do corpo, use has: "It has long legs." (have vira has com he, she e it). O lobo-guará tem pernas muito longas e vive no Cerrado, que está encolhendo, e muitos são atropelados nas estradas.',
    estrutura: ['It has [parte do corpo].', 'It is [adjetivo]-er than [coisa].', 'Cars hurt wolves on the road.'],
  },
  exemplos: [
    { en: 'The maned wolf has very long legs.', pt: 'O lobo-guará tem pernas muito longas.' },
    { en: 'It is taller than many dogs.', pt: 'Ele é mais alto que muitos cachorros.' },
    { en: 'The Cerrado is getting smaller.', pt: 'O Cerrado está ficando menor.' },
    { en: 'Many maned wolves are hit by cars on the road.', pt: 'Muitos lobos-guará são atropelados nas estradas.' },
  ],
  exercicios: [
    x('brasil-lobo', 1, 'escolha', { habilidade: 'vocabulario', dif: 1, enunciado: 'O que significa "leg"?', opcoes: ['perna', 'cabeça', 'cauda'], resposta: 0, explica: 'Leg = perna.' }),
    x('brasil-lobo', 2, 'escolha', { habilidade: 'gramatica', dif: 2, enunciado: 'Qual frase está certa?', opcoes: ['The wolf has long legs.', 'The wolf have long legs.', 'The wolf haves long legs.'], resposta: 0, explica: 'Com he, she e it, have vira has.' }),
    x('brasil-lobo', 3, 'lacuna', { habilidade: 'gramatica', dif: 2, frase: 'It is ___ than many dogs.', resposta: ['taller'], explica: 'Adjetivo curto: tall + er + than.' }),
    x('brasil-lobo', 4, 'lacuna', { habilidade: 'gramatica', tag: 'terceira-pessoa', dif: 2, frase: 'The wolf ___ very long legs.', resposta: ['has'], explica: 'The wolf é como it: has.' }),
    x('brasil-lobo', 5, 'escuta', { habilidade: 'escuta', dif: 2, audio: 'The maned wolf has very long legs.', pergunta: 'O que a voz disse sobre o lobo?', opcoes: ['Ele tem pernas muito longas', 'Ele é muito pequeno', 'Ele vive no mar'], resposta: 0, explica: 'Very long legs = pernas muito longas.' }),
    x('brasil-lobo', 6, 'ditado', { habilidade: 'escuta', dif: 2, audio: 'Cars hurt many maned wolves.', resposta: ['Cars hurt many maned wolves'], explica: 'Cars = carros; hurt = machucar.' }),
    x('brasil-lobo', 7, 'ordenar', { habilidade: 'gramatica', dif: 2, palavras: ['The', 'wolf', 'has', 'very', 'long', 'legs'], resposta: 'The wolf has very long legs', explica: 'Sujeito + has + very + adjetivo + substantivo.' }),
    x('brasil-lobo', 8, 'traduzir', { habilidade: 'escrita', dif: 2, pt: 'O lobo tem pernas longas.', aceitas: ['The wolf has long legs', 'The maned wolf has long legs', 'It has long legs'], explica: 'O lobo tem pernas longas: The wolf has long legs.' }),
    x('brasil-lobo', 9, 'leitura', { habilidade: 'leitura', dif: 2, texto: 'The maned wolf lives in the Cerrado. It has long legs and it can see over the tall grass. But the Cerrado is getting smaller, and many wolves are hit by cars on the road.', pergunta: 'Por que o lobo corre perigo?', opcoes: ['O Cerrado diminui e há carros nas estradas', 'Ele não encontra água', 'Ele não sabe correr'], resposta: 0, explica: 'O texto diz que o Cerrado está diminuindo e que há carros nas estradas.' }),
  ],
  tarefa: {
    enunciado: 'Escreva 3 frases sobre o lobo-guará: como ele é, onde vive e qual é o perigo.',
    minPalavras: 18,
    elementos: [
      { nome: 'como ele é', padroes: ['\\bhas\\b', '\\blong\\b', '\\btall'] },
      { nome: 'onde ele vive', padroes: ['\\blives? in\\b', '\\bcerrado\\b'] },
      { nome: 'o perigo', padroes: ['\\bcars?\\b', '\\broads?\\b', '\\bsmaller\\b', '\\bdanger'] },
    ],
    tagsChave: ['terceira-pessoa'],
    dicas: ['The maned wolf has ...', 'It lives in ...', 'Cars ...'],
    modelo: 'The maned wolf has very long legs. It lives in the Cerrado. The Cerrado is getting smaller, and cars hurt many wolves on the road.',
  },
  reteste: [
    'Compare dois animais que você conhece: use "bigger than" ou "faster than".',
    'Explique em duas frases por que uma estrada pode ser perigosa para os animais.',
  ],
  conversa: 'small-talk',
});

// ---------- gente que faz o Brasil ----------
B.push({
  id: 'brasil-catadora', figurinha: 'catadora',
  titulo: 'Brasil: catadora de recicláveis',
  podeFazer: 'Consigo dizer a profissão de alguém e o que a pessoa faz todo dia.',
  nivel: 'A1', tags: ['terceira-pessoa', 'artigo-profissao'],
  vocab: [
    { en: 'recycling collector', pt: 'catador(a) de recicláveis', ex: 'She is a recycling collector.' },
    { en: 'recycle', pt: 'reciclar', ex: 'We recycle paper and glass.' },
    { en: 'paper', pt: 'papel', ex: 'She separates paper and plastic.' },
    { en: 'glass', pt: 'vidro', ex: 'This bottle is glass.' },
    { en: 'separate', pt: 'separar', ex: 'She separates the bottles.' },
    { en: 'clean', pt: 'limpo; limpar', ex: 'Her work keeps the city clean.' },
  ],
  explicacao: {
    titulo: 'Profissão leva "a" e o verbo leva -s',
    texto: 'Para dizer a profissão, use a (ou an antes de vogal): "She is a recycling collector." Em português dizemos só "ela é catadora", mas em inglês o a não pode faltar. Para dizer o que ela faz todo dia, o verbo ganha -s: "She separates paper and plastic." O trabalho de quem cata materiais recicláveis deixa as cidades mais limpas e merece respeito e pagamento justo.',
    estrutura: ['She is a [profissão].', 'She [verbo]s [coisa] every day.', 'Her work keeps the city clean.'],
  },
  exemplos: [
    { en: 'She is a recycling collector.', pt: 'Ela é catadora de recicláveis.' },
    { en: 'She separates paper, glass and plastic.', pt: 'Ela separa papel, vidro e plástico.' },
    { en: 'Her work keeps the city clean.', pt: 'O trabalho dela mantém a cidade limpa.' },
    { en: 'Her work deserves respect.', pt: 'O trabalho dela merece respeito.' },
  ],
  exercicios: [
    x('brasil-catadora', 1, 'escolha', { habilidade: 'vocabulario', dif: 1, enunciado: 'O que significa "recycle"?', opcoes: ['reciclar', 'recolher', 'reclamar'], resposta: 0, explica: 'Recycle = reciclar, dar nova vida ao material.' }),
    x('brasil-catadora', 2, 'escolha', { habilidade: 'gramatica', dif: 1, enunciado: 'Qual frase está certa?', opcoes: ['She is a recycling collector.', 'She is recycling collector.', 'She a recycling collector.'], resposta: 0, explica: 'Profissão leva a: She is a...' }),
    x('brasil-catadora', 3, 'lacuna', { habilidade: 'gramatica', tag: 'terceira-pessoa', dif: 1, frase: 'She ___ paper and plastic every day.', resposta: ['separates'], explica: 'Com she, o verbo leva -s: separates.' }),
    x('brasil-catadora', 4, 'lacuna', { habilidade: 'gramatica', tag: 'artigo-profissao', dif: 1, frase: 'She is ___ recycling collector.', resposta: ['a'], explica: 'Profissão leva a (an antes de vogal).' }),
    x('brasil-catadora', 5, 'escuta', { habilidade: 'escuta', dif: 1, audio: 'Her work keeps the city clean.', pergunta: 'O que a voz disse sobre o trabalho dela?', opcoes: ['Mantém a cidade limpa', 'É muito fácil', 'Acontece só à noite'], resposta: 0, explica: 'Keeps the city clean = mantém a cidade limpa.' }),
    x('brasil-catadora', 6, 'ditado', { habilidade: 'escuta', dif: 1, audio: 'She separates paper and glass.', resposta: ['She separates paper and glass'], explica: 'Separates = separa; glass = vidro.' }),
    x('brasil-catadora', 7, 'ordenar', { habilidade: 'gramatica', dif: 1, palavras: ['She', 'is', 'a', 'recycling', 'collector'], resposta: 'She is a recycling collector', explica: 'She is a + profissão.' }),
    x('brasil-catadora', 8, 'traduzir', { habilidade: 'escrita', dif: 1, pt: 'Ela é catadora de recicláveis.', aceitas: ['She is a recycling collector', 'She is a recycler', 'She is a waste picker'], explica: 'Ela é catadora: She is a recycling collector.' }),
    x('brasil-catadora', 9, 'leitura', { habilidade: 'leitura', dif: 1, texto: 'Maria is a recycling collector. Every day she separates paper, glass and plastic. Her work keeps the city clean, and it deserves respect.', pergunta: 'O que a Maria faz todo dia?', opcoes: ['Separa papel, vidro e plástico', 'Vende roupas', 'Dirige um ônibus'], resposta: 0, explica: 'O texto diz que ela separa papel, vidro e plástico todo dia.' }),
  ],
  tarefa: {
    enunciado: 'Escreva 3 frases sobre a catadora: a profissão dela, o que ela faz todo dia e por que o trabalho importa.',
    minPalavras: 16,
    elementos: [
      { nome: 'a profissão', padroes: ['\\bis an? (?:recycling )?(?:collector|recycler|worker)'] },
      { nome: 'o que ela faz', padroes: ['\\bseparates?\\b', '\\bcollects?\\b', '\\brecycles?\\b'] },
      { nome: 'por que importa', padroes: ['\\bclean\\b', '\\brespect\\b', '\\bimportant\\b'] },
    ],
    tagsChave: ['terceira-pessoa', 'artigo-profissao'],
    dicas: ['She is a ...', 'She separates ...', 'Her work ...'],
    modelo: 'She is a recycling collector. Every day she separates paper, glass and plastic. Her work keeps the city clean and deserves respect.',
  },
  reteste: [
    'Escreva três frases sobre uma profissão que você respeita: o que a pessoa faz todo dia.',
    'Explique em duas frases por que o trabalho dessa pessoa é importante.',
  ],
  conversa: 'zero-rotina-zero',
});

B.push({
  id: 'brasil-pescador', figurinha: 'pescador',
  titulo: 'Brasil: pescador artesanal',
  podeFazer: 'Consigo contar a rotina de um pescador, da hora em que acorda até a venda.',
  nivel: 'A1', tags: ['terceira-pessoa'],
  vocab: [
    { en: 'fisherman', pt: 'pescador', ex: 'He is a fisherman.' },
    { en: 'boat', pt: 'barco', ex: 'He goes to the sea in his boat.' },
    { en: 'net', pt: 'rede', ex: 'He mends the net every day.' },
    { en: 'fish', pt: 'peixe', ex: 'He catches fish in the sea.' },
    { en: 'sea', pt: 'mar', ex: 'The sea is dirty today.' },
    { en: 'sell', pt: 'vender', ex: 'He sells the fish at the market.' },
  ],
  explicacao: {
    titulo: 'A rotina em inglês: verbo com -s',
    texto: 'Para contar a rotina de alguém (he, she, it), o verbo leva -s: "He wakes up early." "He sells fish." Verbos que terminam em -ch, -sh ou -s levam -es: catches, washes. Para a hora, use at: "at four o\'clock". O pescador artesanal alimenta muitas famílias, mas hoje encontra um mar mais sujo e menos peixes.',
    estrutura: ['He wakes up at [hora].', 'He catches [peixe].', 'He sells the fish at the market.'],
  },
  exemplos: [
    { en: "He wakes up at four o'clock.", pt: 'Ele acorda às quatro horas.' },
    { en: 'He catches fish in the sea.', pt: 'Ele pega peixe no mar.' },
    { en: 'He sells the fish at the market.', pt: 'Ele vende o peixe no mercado.' },
    { en: 'Today there are fewer fish in the sea.', pt: 'Hoje há menos peixes no mar.' },
  ],
  exercicios: [
    x('brasil-pescador', 1, 'escolha', { habilidade: 'vocabulario', dif: 1, enunciado: 'O que significa "net"?', opcoes: ['rede', 'barco', 'mar'], resposta: 0, explica: 'Net = rede.' }),
    x('brasil-pescador', 2, 'escolha', { habilidade: 'gramatica', dif: 1, enunciado: 'Qual frase está certa?', opcoes: ['He catches fish.', 'He catch fish.', 'He catchs fish.'], resposta: 0, explica: 'Verbo terminado em -ch leva -es: catches.' }),
    x('brasil-pescador', 3, 'lacuna', { habilidade: 'gramatica', tag: 'terceira-pessoa', dif: 1, frase: 'He ___ fish in the sea.', resposta: ['catches'], explica: 'Com he, o verbo leva -s ou -es: catches.' }),
    x('brasil-pescador', 4, 'lacuna', { habilidade: 'gramatica', tag: 'preposicoes', dif: 1, frase: "He wakes up ___ four o'clock.", resposta: ['at'], explica: 'Hora leva at.' }),
    x('brasil-pescador', 5, 'escuta', { habilidade: 'escuta', dif: 1, audio: 'He sells the fish at the market.', pergunta: 'Onde ele vende o peixe?', opcoes: ['No mercado', 'Na praia', 'Em casa'], resposta: 0, explica: 'Market = mercado.' }),
    x('brasil-pescador', 6, 'ditado', { habilidade: 'escuta', dif: 1, audio: 'He wakes up very early.', resposta: ['He wakes up very early'], explica: 'Wakes up = acorda; early = cedo.' }),
    x('brasil-pescador', 7, 'ordenar', { habilidade: 'gramatica', dif: 1, palavras: ['He', 'catches', 'fish', 'every', 'day'], resposta: 'He catches fish every day', explica: 'Every day vem no fim da frase.' }),
    x('brasil-pescador', 8, 'traduzir', { habilidade: 'escrita', dif: 1, pt: 'Ele pega peixe todo dia.', aceitas: ['He catches fish every day', 'He fishes every day'], explica: 'Ele pega peixe todo dia: He catches fish every day.' }),
    x('brasil-pescador', 9, 'leitura', { habilidade: 'leitura', dif: 1, texto: "Jonas is a fisherman. He wakes up at four o'clock and goes to the sea in his boat. He catches fish and sells it at the market. Today the sea is dirtier, and there are fewer fish.", pergunta: 'O que mudou no mar?', opcoes: ['Está mais sujo e tem menos peixes', 'Está mais calmo', 'Está mais quente e tem mais peixes'], resposta: 0, explica: 'O texto diz que o mar está mais sujo e que há menos peixes.' }),
  ],
  tarefa: {
    enunciado: 'Escreva 3 frases sobre o dia do pescador: a hora em que acorda, o que ele faz e onde vende.',
    minPalavras: 16,
    elementos: [
      { nome: 'a hora', padroes: ['\\bat \\d', "\\bo.clock\\b", '\\bearly\\b'] },
      { nome: 'o que ele faz', padroes: ['\\bcatches\\b', '\\bfishes\\b', '\\bgoes\\b'] },
      { nome: 'onde ele vende', padroes: ['\\bsells?\\b', '\\bmarket\\b'] },
    ],
    tagsChave: ['terceira-pessoa'],
    dicas: ['He wakes up at ...', 'He catches ...', 'He sells ...'],
    modelo: "He wakes up at four o'clock. He catches fish in the sea. Then he sells the fish at the market.",
  },
  reteste: [
    'Conte a rotina de uma pessoa da sua família, da manhã até a noite, em quatro frases.',
    'Explique em duas frases o que muda quando o mar fica mais sujo.',
  ],
  conversa: 'zero-rotina-zero',
});

B.push({
  id: 'brasil-quilombola', figurinha: 'quilombola',
  titulo: 'Brasil: mulher quilombola',
  podeFazer: 'Consigo dizer de onde uma pessoa é e o que a comunidade dela planta e quer.',
  nivel: 'A2', tags: ['preposicoes'],
  vocab: [
    { en: 'community', pt: 'comunidade', ex: 'The community grows food.' },
    { en: 'land', pt: 'terra', ex: 'She grows cassava on the land.' },
    { en: 'cassava', pt: 'mandioca', ex: 'Cassava is a root.' },
    { en: 'grow', pt: 'plantar, cultivar', ex: 'They grow beans and corn.' },
    { en: 'family', pt: 'família', ex: 'Her family cares for the land.' },
    { en: 'legal title', pt: 'título legal (da terra)', ex: 'The community wants the legal title.' },
  ],
  explicacao: {
    titulo: 'De onde é e onde faz: from, in, on',
    texto: 'Para dizer de onde alguém é, use from: "She is from a quilombo." Para lugares grandes, in ("in the countryside"); para a terra onde se planta, on ("on the land"). Quilombos são comunidades formadas por descendentes de pessoas escravizadas que resistiram e criaram lugares de liberdade. Muitas famílias cuidam da mesma terra há gerações, e muitas comunidades ainda esperam o título legal dessa terra.',
    estrutura: ['She is from [lugar].', 'She grows [planta] on the land.', 'The community wants [coisa].'],
  },
  exemplos: [
    { en: 'She is from a quilombo in the countryside.', pt: 'Ela é de um quilombo no interior.' },
    { en: 'She grows cassava on the land.', pt: 'Ela planta mandioca na terra.' },
    { en: 'Her family cares for the land.', pt: 'A família dela cuida da terra.' },
    { en: 'The community wants the legal title to its land.', pt: 'A comunidade quer o título legal da sua terra.' },
  ],
  exercicios: [
    x('brasil-quilombola', 1, 'escolha', { habilidade: 'vocabulario', dif: 1, enunciado: 'O que significa "cassava"?', opcoes: ['mandioca', 'milho', 'cana'], resposta: 0, explica: 'Cassava = mandioca.' }),
    x('brasil-quilombola', 2, 'escolha', { habilidade: 'gramatica', dif: 2, enunciado: 'Qual frase está certa?', opcoes: ['She is from a quilombo.', 'She is of a quilombo.', 'She from a quilombo.'], resposta: 0, explica: 'Para dizer de onde alguém é: is from.' }),
    x('brasil-quilombola', 3, 'lacuna', { habilidade: 'gramatica', tag: 'preposicoes', dif: 2, frase: 'She grows cassava ___ the land.', resposta: ['on'], explica: 'Na terra, no terreno: on.' }),
    x('brasil-quilombola', 4, 'lacuna', { habilidade: 'gramatica', tag: 'preposicoes', dif: 2, frase: 'She is ___ a quilombo in the countryside.', resposta: ['from'], explica: 'De onde alguém é: from.' }),
    x('brasil-quilombola', 5, 'escuta', { habilidade: 'escuta', dif: 2, audio: 'Her family cares for the land.', pergunta: 'O que a família faz?', opcoes: ['Cuida da terra', 'Vende a terra', 'Muda de cidade'], resposta: 0, explica: 'Cares for = cuida de.' }),
    x('brasil-quilombola', 6, 'ditado', { habilidade: 'escuta', dif: 2, audio: 'She grows cassava on the land.', resposta: ['She grows cassava on the land'], explica: 'Grows = planta, cultiva.' }),
    x('brasil-quilombola', 7, 'ordenar', { habilidade: 'gramatica', dif: 2, palavras: ['She', 'is', 'from', 'a', 'quilombo'], resposta: 'She is from a quilombo', explica: 'She is from + lugar.' }),
    x('brasil-quilombola', 8, 'traduzir', { habilidade: 'escrita', dif: 2, pt: 'Ela planta mandioca.', aceitas: ['She grows cassava', 'She plants cassava'], explica: 'Ela planta mandioca: She grows cassava.' }),
    x('brasil-quilombola', 9, 'leitura', { habilidade: 'leitura', dif: 2, texto: 'Dona Ana is from a quilombo in the countryside. She grows cassava on the land, and her family cares for it. The community wants the legal title to its land.', pergunta: 'O que a comunidade quer?', opcoes: ['O título legal da terra', 'Vender a terra', 'Mudar de cidade'], resposta: 0, explica: 'O texto diz que a comunidade quer o título legal da terra.' }),
  ],
  tarefa: {
    enunciado: 'Escreva 3 frases sobre a mulher quilombola: de onde ela é, o que ela planta e o que a comunidade quer.',
    minPalavras: 18,
    elementos: [
      { nome: 'de onde ela é', padroes: ['\\bfrom\\b'] },
      { nome: 'o que ela planta', padroes: ['\\bgrows?\\b', '\\bplants?\\b', '\\bcassava\\b'] },
      { nome: 'o que a comunidade quer', padroes: ['\\bwants?\\b', '\\btitle\\b'] },
    ],
    tagsChave: ['preposicoes'],
    dicas: ['She is from ...', 'She grows ... on ...', 'The community wants ...'],
    modelo: 'She is from a quilombo in the countryside. She grows cassava on the land. The community wants the legal title to its land.',
  },
  reteste: [
    'Escreva três frases sobre uma pessoa da sua família: de onde ela é e o que ela faz.',
    'Explique em duas frases por que a terra é importante para uma comunidade.',
  ],
  conversa: 'small-talk',
});

B.push({
  id: 'brasil-indigena', figurinha: 'indigena',
  titulo: 'Brasil: mulher indígena',
  podeFazer: 'Consigo dizer o que uma pessoa faz e de quem são as coisas dela.',
  nivel: 'A2', tags: ['terceira-pessoa'],
  vocab: [
    { en: 'basket', pt: 'cesto', ex: 'Her baskets are beautiful.' },
    { en: 'weave', pt: 'tecer', ex: 'She weaves baskets from straw.' },
    { en: 'forest', pt: 'floresta', ex: 'They take care of the forest.' },
    { en: 'craft', pt: 'artesanato, ofício', ex: 'Weaving is an old craft.' },
    { en: 'her', pt: 'dela', ex: 'Her baskets are beautiful.' },
    { en: 'their', pt: 'deles, delas', ex: 'Their land is important.' },
  ],
  explicacao: {
    titulo: '"Her" e "their": de quem é?',
    texto: 'Para dizer de quem é algo, use her (dela), his (dele) e their (deles): "her basket", "their land". Não confunda she (ela, quem faz a ação) com her (dela, de quem é a coisa). Para dizer o que ela faz, o verbo leva -s: "She weaves baskets." Os povos indígenas cuidam da floresta, mantêm vivos ofícios antigos como a cestaria e seguem lutando pelo direito à sua terra.',
    estrutura: ['She weaves [coisa].', 'Her [coisa] is [adjetivo].', 'Their land is important.'],
  },
  exemplos: [
    { en: 'She weaves baskets from straw.', pt: 'Ela tece cestos de palha.' },
    { en: 'Her baskets are beautiful.', pt: 'Os cestos dela são bonitos.' },
    { en: 'Indigenous peoples take care of the forest.', pt: 'Os povos indígenas cuidam da floresta.' },
    { en: 'Their land is very important to them.', pt: 'A terra deles é muito importante para eles.' },
  ],
  exercicios: [
    x('brasil-indigena', 1, 'escolha', { habilidade: 'vocabulario', dif: 1, enunciado: 'O que significa "weave"?', opcoes: ['tecer', 'vender', 'plantar'], resposta: 0, explica: 'Weave = tecer, entrelaçar fios ou palha.' }),
    x('brasil-indigena', 2, 'escolha', { habilidade: 'gramatica', dif: 2, enunciado: 'Qual frase está certa?', opcoes: ['Her baskets are beautiful.', 'She baskets are beautiful.', 'Hers baskets are beautiful.'], resposta: 0, explica: 'Her + coisa = a coisa dela.' }),
    x('brasil-indigena', 3, 'lacuna', { habilidade: 'gramatica', tag: 'terceira-pessoa', dif: 2, frase: 'She ___ baskets from straw.', resposta: ['weaves'], explica: 'Com she, o verbo leva -s: weaves.' }),
    x('brasil-indigena', 4, 'lacuna', { habilidade: 'gramatica', dif: 2, frase: 'Indigenous peoples love ___ land.', resposta: ['their'], explica: 'De várias pessoas: their.' }),
    x('brasil-indigena', 5, 'escuta', { habilidade: 'escuta', dif: 2, audio: 'Her baskets are beautiful.', pergunta: 'O que a voz disse?', opcoes: ['Os cestos dela são bonitos', 'Ela vende cestos', 'Ela mora na floresta'], resposta: 0, explica: 'Her baskets = os cestos dela.' }),
    x('brasil-indigena', 6, 'ditado', { habilidade: 'escuta', dif: 2, audio: 'She weaves baskets from straw.', resposta: ['She weaves baskets from straw'], explica: 'Straw = palha.' }),
    x('brasil-indigena', 7, 'ordenar', { habilidade: 'gramatica', dif: 2, palavras: ['Their', 'land', 'is', 'very', 'important'], resposta: 'Their land is very important', explica: 'Their + substantivo + is + adjetivo.' }),
    x('brasil-indigena', 8, 'traduzir', { habilidade: 'escrita', dif: 2, pt: 'Os cestos dela são bonitos.', aceitas: ['Her baskets are beautiful', 'Her baskets are pretty'], explica: 'Os cestos dela são bonitos: Her baskets are beautiful.' }),
    x('brasil-indigena', 9, 'leitura', { habilidade: 'leitura', dif: 2, texto: 'Maria is an Indigenous woman. She weaves baskets from straw, like her grandmother. Her community takes care of the forest, and it fights for the right to its land.', pergunta: 'O que a comunidade faz?', opcoes: ['Cuida da floresta e luta pelo direito à terra', 'Vende a floresta', 'Foge para a cidade'], resposta: 0, explica: 'O texto diz que a comunidade cuida da floresta e luta pelo direito à terra.' }),
  ],
  tarefa: {
    enunciado: 'Escreva 3 frases sobre a mulher indígena: o que ela faz, como são as coisas dela e o que o povo dela cuida.',
    minPalavras: 16,
    elementos: [
      { nome: 'o que ela faz', padroes: ['\\bweaves?\\b', '\\bmakes?\\b'] },
      { nome: 'as coisas dela', padroes: ['\\bher \\w+'] },
      { nome: 'o que o povo cuida', padroes: ['\\bforest\\b', '\\btake care\\b', '\\btakes care\\b', '\\bland\\b'] },
    ],
    tagsChave: ['terceira-pessoa'],
    dicas: ['She weaves ...', 'Her ... are ...', 'Their ...'],
    modelo: 'She weaves baskets from straw. Her baskets are beautiful. Her people take care of the forest. Their land is very important to them.',
  },
  reteste: [
    'Escreva três frases sobre algo que uma pessoa que você conhece faz com as mãos.',
    'Explique em duas frases por que as coisas feitas à mão têm valor.',
  ],
  conversa: 'small-talk',
});

module.exports = { MISSOES_BRASIL: B };
