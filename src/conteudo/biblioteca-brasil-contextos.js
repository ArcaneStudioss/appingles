'use strict';
// Leituras originais: idade adapta a situação; perguntas praticam sentido e registro.
const UNIDADES_CONTEXTOS = [
  {
    "id": "crianca-brasil-convivio",
    "faixa": "crianca",
    "nivel": "A1",
    "tema": "Brincadeiras e convivência",
    "titulo": "Uma brincadeira, muitos nomes",
    "imagem": "🛝",
    "cultura": [
      "pega-pega",
      "guri-pia",
      "merenda",
      "foi-mal"
    ],
    "explicacao": "Pega-pega pode ser tag em inglês. Kid é um jeito informal de dizer criança, e children é o plural de child. Ao pedir ajuda ou brincar, use palavras gentis. Cada turma pode chamar a brincadeira de um jeito.",
    "vocab": [
      {
        "en": "tag",
        "pt": "pega-pega"
      },
      {
        "en": "children",
        "pt": "crianças"
      },
      {
        "en": "snack",
        "pt": "lanche pequeno"
      },
      {
        "en": "sorry",
        "pt": "desculpe"
      }
    ],
    "texto": "The children are in the park. Jo says, \"Do you want to play tag?\" Bia calls the game pique-pega. They explain the rules. Jo drops a ball near Bia. \"Sorry!\" Jo says. After the game, they eat a small snack. Everyone can join.",
    "traducao": "As crianças estão no parque. Jo diz: \"Quer brincar de pega-pega?\" Bia chama a brincadeira de pique-pega. Eles explicam as regras. Jo deixa uma bola cair perto de Bia. \"Desculpe!\", diz Jo. Depois da brincadeira, comem um pequeno lanche. Todo mundo pode participar.",
    "perguntas": [
      [
        "Bia chama a brincadeira de pique-pega. Como começam a brincar juntos?",
        [
          "Explicam as regras para todos entenderem",
          "Dizem que só um nome é certo",
          "Deixam Bia fora da brincadeira"
        ],
        "Eles explicam as regras. Conhecer nomes diferentes ajuda a brincar junto."
      ],
      [
        "O que “Sorry!” comunica quando Jo deixa a bola cair?",
        [
          "Um pedido de desculpa",
          "Um convite para comer",
          "O fim do parque"
        ],
        "Sorry pode ser desculpe. Jo usa a palavra para reconhecer o pequeno acidente."
      ]
    ],
    "lacuna": {
      "frase": "Do you want to play ___?",
      "resposta": [
        "tag"
      ],
      "explica": "Tag é pega-pega neste convite. A frase convida alguém para brincar."
    }
  },
  {
    "id": "crianca-brasil-familia",
    "faixa": "crianca",
    "nivel": "A2",
    "tema": "Família e jeitos do Brasil",
    "titulo": "O que sua família quer dizer?",
    "imagem": "🏡",
    "cultura": [
      "egua",
      "uai",
      "mainha",
      "saudade"
    ],
    "explicacao": "Uma exclamação pode mostrar surpresa sem falar de um animal ou objeto. Wow pode servir para uma surpresa boa. I miss you comunica saudade de alguém. Famílias usam nomes carinhosos diferentes; você pode contar como é na sua.",
    "vocab": [
      {
        "en": "wow",
        "pt": "nossa!; surpresa boa"
      },
      {
        "en": "mom",
        "pt": "mãe ou mamãe, comum nos Estados Unidos"
      },
      {
        "en": "miss",
        "pt": "sentir falta; ter saudade"
      },
      {
        "en": "surprised",
        "pt": "surpreso ou surpresa"
      }
    ],
    "texto": "Lia visits her aunt. Her aunt sees a big drawing and says, \"Égua!\" Lia explains to Sam, \"She is surprised. You can say wow!\" Lia calls her mother mainha. \"I call my mother mom,\" Sam says. Later, Lia phones her grandpa. \"I miss you,\" she tells him. They plan to meet on Sunday.",
    "traducao": "Lia visita a tia. Sua tia vê um desenho grande e diz: \"Égua!\" Lia explica a Sam: \"Ela ficou surpresa. Você pode dizer wow!\" Lia chama a mãe de mainha. \"Eu chamo minha mãe de mom\", diz Sam. Depois, Lia liga para o avô. \"Estou com saudade de você\", diz a ele. Eles combinam de se encontrar no domingo.",
    "perguntas": [
      [
        "Ao ver o desenho, a tia de Lia está falando de um animal?",
        [
          "Não, ela está mostrando surpresa",
          "Sim, está procurando um cavalo",
          "Sim, é sempre o único sentido de égua"
        ],
        "A situação é uma reação ao desenho. Wow transmite essa surpresa boa; mare seria o animal."
      ],
      [
        "Como Lia diz ao avô que sente saudade dele?",
        [
          "I miss you.",
          "I have a horse.",
          "I am a drawing."
        ],
        "I miss you comunica que Lia sente falta de estar com o avô. O inglês pode expressar saudade com uma frase."
      ]
    ],
    "lacuna": {
      "frase": "I ___ you. Can we meet on Sunday?",
      "resposta": [
        "miss"
      ],
      "explica": "I miss you é estou com saudade de você. O convite dá continuidade à conversa."
    }
  },
  {
    "id": "adolescente-brasil-regioes",
    "faixa": "adolescente",
    "nivel": "A2",
    "tema": "Regiões e amizades",
    "titulo": "Do trem ao chat: explica aí",
    "imagem": "🗺️",
    "cultura": [
      "trem",
      "pai-degua",
      "bah-tri",
      "uai"
    ],
    "explicacao": "Trem pode ser uma coisa, não um transporte. Massa e tri legal podem elogiar. Em inglês, thing ajuda a falar de uma coisa e really cool pode transmitir um elogio. Perguntar o sentido é uma boa estratégia; ninguém conhece todas as expressões.",
    "vocab": [
      {
        "en": "thing",
        "pt": "coisa"
      },
      {
        "en": "really cool",
        "pt": "muito legal"
      },
      {
        "en": "mean",
        "pt": "significar; querer dizer"
      },
      {
        "en": "explain",
        "pt": "explicar"
      }
    ],
    "texto": "A school group is planning a music video. Bia writes, \"Que trem é esse?\" Sam asks if she means a train. Bia explains, \"No, I mean this thing on the screen.\" Jo says the video idea is massa. Alex says it is tri legal. \"You both think it is really cool,\" Sam says. They ask about each expression instead of guessing where everyone comes from.",
    "traducao": "Um grupo da escola está planejando um clipe. Bia escreve: \"Que trem é esse?\" Sam pergunta se ela quer dizer um trem de transporte. Bia explica: \"Não, quero dizer esta coisa na tela.\" Jo diz que a ideia do vídeo é massa. Alex diz que é tri legal. \"Vocês dois acham que é muito legal\", diz Sam. Eles perguntam sobre cada expressão em vez de adivinhar de onde cada um vem.",
    "perguntas": [
      [
        "Por que “train” não transmite o que Bia quer dizer?",
        [
          "Ela está falando de uma coisa na tela",
          "Train sempre significa música",
          "Bia está escolhendo um transporte"
        ],
        "O contexto mostra que trem é uma coisa. Thing preserva esse sentido; train indicaria transporte."
      ],
      [
        "O que fazer ao encontrar uma expressão que você não conhece?",
        [
          "Perguntar o sentido naquele contexto",
          "Adivinhar a origem de quem falou e insistir",
          "Considerar errado todo jeito diferente do seu"
        ],
        "Perguntar What do you mean? ou pedir uma explicação ajuda a entender sem julgar a pessoa ou a região."
      ]
    ],
    "lacuna": {
      "frase": "The video idea is really ___. We like it!",
      "resposta": [
        "cool"
      ],
      "explica": "Really cool é muito legal. É uma aproximação para um elogio como massa ou tri legal."
    }
  },
  {
    "id": "adolescente-brasil-fandom",
    "faixa": "adolescente",
    "nivel": "B1",
    "tema": "Fandoms e redes sociais",
    "titulo": "Um comentário muda de sentido",
    "imagem": "🎬",
    "cultura": [
      "shippar",
      "cringe",
      "ghosting",
      "delulu"
    ],
    "explicacao": "Em fandoms, ship pode ser torcer por um casal. Fora desse assunto, pode ser navio ou enviar. Cringeworthy descreve algo constrangedor. Nem toda mensagem sem resposta é ghosting, e uma gíria vista na internet não precisa fazer parte do seu jeito de falar.",
    "vocab": [
      {
        "en": "ship",
        "pt": "torcer por um casal, no contexto de fandom"
      },
      {
        "en": "cringeworthy",
        "pt": "constrangedor; que dá vergonha alheia"
      },
      {
        "en": "reply",
        "pt": "resposta; responder"
      },
      {
        "en": "context",
        "pt": "contexto"
      }
    ],
    "texto": "Jo and Sam discuss a series in a fan group. \"I ship these characters,\" Jo writes. Sam understands that Jo hopes they become a couple, not that Jo is sending a package. A scene makes Sam feel embarrassed, so Sam calls the scene cringeworthy. Later, a friend does not reply for two hours. Jo avoids calling it ghosting: the friend may simply be busy. In class, they explain the same ideas with full sentences for people who do not follow the group.",
    "traducao": "Jo e Sam conversam sobre uma série em um grupo de fãs. \"Eu shippo esses personagens\", escreve Jo. Sam entende que Jo torce para eles virarem um casal, e não que esteja enviando um pacote. Uma cena deixa Sam com vergonha, então Sam diz que a cena é constrangedora. Depois, um amigo fica duas horas sem responder. Jo evita chamar isso de ghosting: o amigo pode apenas estar ocupado. Na aula, explicam as mesmas ideias com frases completas para quem não acompanha o grupo.",
    "perguntas": [
      [
        "O que Jo quer dizer com “I ship these characters”?",
        [
          "Torço para esses personagens formarem um casal",
          "Estou enviando os personagens pelo correio",
          "Os personagens precisam comprar um navio"
        ],
        "No grupo de fãs, ship tem o sentido de torcer por um casal. O contexto evita a tradução literal."
      ],
      [
        "Por que Jo evita concluir que houve ghosting?",
        [
          "Uma demora isolada não prova um corte de contato",
          "Toda pessoa precisa responder imediatamente",
          "A palavra significa que o celular virou um fantasma"
        ],
        "Ghosting descreve interromper contato sem explicação. Duas horas sem resposta não mostram, por si só, esse comportamento."
      ]
    ],
    "lacuna": {
      "frase": "A reply can change meaning depending on the ___.",
      "resposta": [
        "context"
      ],
      "explica": "Context é contexto. O assunto e quem participa ajudam a entender o comentário."
    }
  },
  {
    "id": "adulto-brasil-cotidiano",
    "faixa": "adulto",
    "nivel": "A2",
    "tema": "Trabalho e situações do dia a dia",
    "titulo": "Pode me quebrar um galho?",
    "imagem": "🧰",
    "cultura": [
      "quebrar-galho",
      "bico",
      "perrengue",
      "foi-mal"
    ],
    "explicacao": "Quebrar um galho pode ser ajudar alguém: help out. Para uma solução temporária, do for now é outra possibilidade. Trabalho eventual pode ser odd jobs se forem pequenos serviços variados; descreva sua atividade sem reduzir toda ocupação a uma gíria.",
    "vocab": [
      {
        "en": "help out",
        "pt": "ajudar; dar uma força"
      },
      {
        "en": "extra work",
        "pt": "trabalho extra"
      },
      {
        "en": "for now",
        "pt": "por enquanto"
      },
      {
        "en": "a tough time",
        "pt": "uma situação ou período difícil"
      }
    ],
    "texto": "Rafa repairs furniture and is looking for some extra work. A neighbor asks, \"Could you help me out with this chair?\" Rafa agrees. The neighbor has a small table that will do for now. They had a tough time finding a repair shop, so they are glad to meet someone nearby. Rafa sends a clear message with the price and the time needed. With friends, Rafa calls the situation a perrengue; with a customer, Rafa explains the problem directly.",
    "traducao": "Rafa conserta móveis e procura trabalho extra. Uma pessoa da vizinhança pergunta: \"Você pode me dar uma força com esta cadeira?\" Rafa aceita. A pessoa tem uma mesa pequena que serve por enquanto. Foi difícil encontrar uma oficina, então ficou contente por conhecer alguém por perto. Rafa envia uma mensagem clara com o preço e o tempo necessário. Com amigos, Rafa chama a situação de perrengue; com um cliente, explica o problema diretamente.",
    "perguntas": [
      [
        "Qual frase pede ajuda com a cadeira?",
        [
          "Could you help me out with this chair?",
          "Could you break a branch?",
          "Could you send me a bird?"
        ],
        "Help me out pede uma ajuda. Break a branch falaria literalmente de quebrar um galho de árvore."
      ],
      [
        "Por que Rafa explica o problema diretamente ao cliente?",
        [
          "Para deixar o serviço e as condições claros",
          "Porque o jeito de falar dos amigos é inferior",
          "Porque adultos nunca usam gírias"
        ],
        "O público e a finalidade mudam a escolha. Ser claro com um cliente é adequar a mensagem, sem desvalorizar a conversa informal."
      ]
    ],
    "lacuna": {
      "frase": "This small table will do for ___.",
      "resposta": [
        "now"
      ],
      "explica": "For now é por enquanto. A mesa atende à necessidade temporariamente."
    }
  },
  {
    "id": "adulto-brasil-comunidade",
    "faixa": "adulto",
    "nivel": "B1",
    "tema": "Família, comunidade e gerações",
    "titulo": "A conversa que cabe em cada encontro",
    "imagem": "🤝",
    "cultura": [
      "vaquinha",
      "saudade",
      "cair-ficha",
      "custar-caro"
    ],
    "explicacao": "Linguagem informal também faz parte da vida adulta e de pessoas mais velhas. Chip in pode explicar uma vaquinha; I miss you comunica saudade. Evite presumir gostos, profissão ou intimidade pela idade. Uma alternativa neutra ajuda quando o grupo não compartilha a expressão.",
    "vocab": [
      {
        "en": "chip in",
        "pt": "contribuir com uma parte"
      },
      {
        "en": "fundraiser",
        "pt": "arrecadação ou evento para levantar fundos"
      },
      {
        "en": "miss",
        "pt": "sentir falta; ter saudade"
      },
      {
        "en": "expensive",
        "pt": "caro ou cara"
      }
    ],
    "texto": "Lucia is seventy and helps organize a neighborhood fundraiser. She invites younger and older neighbors to chip in for books. Everyone chooses whether and how to contribute. The group decides that a new shelf is too expensive and asks for donated furniture instead. In a family call, Lucia tells her niece, \"I miss you.\" Later, her niece explains a new online expression. Lucia shares a saying she likes. They ask questions without assuming that age determines how someone speaks.",
    "traducao": "Lucia tem setenta anos e ajuda a organizar uma arrecadação na vizinhança. Convida pessoas mais jovens e mais velhas a contribuírem para livros. Cada um escolhe se vai contribuir e como. O grupo decide que uma estante nova é cara demais e pede móveis doados. Em uma chamada de família, Lucia diz à sobrinha: \"Estou com saudade de você.\" Depois, a sobrinha explica uma expressão nova da internet. Lucia compartilha um ditado de que gosta. Elas fazem perguntas sem presumir que a idade determina como alguém fala.",
    "perguntas": [
      [
        "Neste projeto, o que significa “chip in”?",
        [
          "Contribuir para a compra de livros",
          "Comprar uma vaca para o bairro",
          "Enviar um aparelho eletrônico"
        ],
        "Chip in comunica dar uma contribuição. É uma equivalência natural para participar de uma vaquinha, sem falar literalmente de animais."
      ],
      [
        "O que Lucia e a sobrinha fazem ao trocar expressões?",
        [
          "Explicam sentidos e aprendem uma com a outra",
          "Concluem que só uma geração fala corretamente",
          "Evitam conversar por terem idades diferentes"
        ],
        "Cada pessoa conhece experiências e palavras diferentes. Perguntar e explicar permite a troca entre gerações sem estereótipos."
      ]
    ],
    "lacuna": {
      "frase": "The community organized a ___ to buy books.",
      "resposta": [
        "fundraiser"
      ],
      "explica": "Fundraiser é uma arrecadação ou evento para levantar fundos. Aqui o objetivo é comprar livros."
    }
  }
];
module.exports = { UNIDADES_CONTEXTOS };
