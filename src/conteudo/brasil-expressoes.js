'use strict';
// Ampliação editorial: equivalências aproximadas, exemplos próprios e fontes por ficha.
const NOVAS_EXPRESSOES = [
  {
    "id": "egua",
    "titulo": "Égua! O espanto vai além do animal",
    "categoria": "regional",
    "nivel": "A2",
    "regioes": [
      "norte"
    ],
    "contextos": [
      "familia",
      "amigos"
    ],
    "aliases": [
      "égua",
      "egua",
      "nossa"
    ],
    "resumo": "Isso é surpreendente: escolha a expressão pelo sentido e pela situação.",
    "brasil": "No Pará e em outros lugares, égua pode ser uma reação de surpresa. O tom mostra se a surpresa foi boa ou ruim.",
    "equivalentes": [
      {
        "en": "wow",
        "pt": "nossa!; reação de admiração",
        "uso": "Para uma surpresa positiva.",
        "exemplo": "Wow, your drawing is beautiful!",
        "traducao": "Égua, teu desenho ficou lindo!"
      },
      {
        "en": "oh no",
        "pt": "ah, não!; surpresa desagradável",
        "uso": "Quando algo dá errado.",
        "exemplo": "Oh no, I missed the bus!",
        "traducao": "Égua, perdi o ônibus!"
      }
    ],
    "cuidado": "Mare é a fêmea do cavalo, não a reação. Nenhuma exclamação inglesa cobre todos os tons de égua.",
    "alternativaNeutra": {
      "en": "That is surprising.",
      "pt": "Isso é surpreendente"
    },
    "fontes": [
      {
        "titulo": "Ufopa / Gelopa: expressões de Santarém e seus contextos",
        "url": "https://comunicacao.ufopa.edu.br/comunicacao/comunica/jornalismo/ufopa-na-midia-2/2023/junho/egua-do-linguajar-expressoes-usadas-por-santarenos-sao-quase-uma-assinatura-bora-espiar/"
      },
      {
        "titulo": "Priberam: égua",
        "url": "https://dicionario.priberam.org/égua"
      },
      {
        "titulo": "Cambridge Dictionary: wow",
        "url": "https://dictionary.cambridge.org/dictionary/english/wow"
      }
    ],
    "registro": "Conversa informal: observe o tom e a situação"
  },
  {
    "id": "pai-degua",
    "titulo": "Pai d’égua, massa, arretado: que bom!",
    "categoria": "regional",
    "nivel": "A2",
    "regioes": [
      "norte",
      "nordeste"
    ],
    "contextos": [
      "familia",
      "amigos",
      "lazer"
    ],
    "aliases": [
      "pai d’égua",
      "pai d'égua",
      "massa",
      "arretado",
      "legal",
      "da hora"
    ],
    "resumo": "Isso é muito bom: escolha a expressão pelo sentido e pela situação.",
    "brasil": "Pai d’égua pode elogiar no Pará; massa e arretado também podem elogiar, com destaque para usos nordestinos. Os termos circulam além dessas regiões.",
    "equivalentes": [
      {
        "en": "awesome",
        "pt": "muito legal; excelente",
        "uso": "Elogio informal para uma experiência.",
        "exemplo": "The concert was awesome!",
        "traducao": "O show foi pai d’égua!"
      },
      {
        "en": "great",
        "pt": "ótimo; muito bom",
        "uso": "Alternativa ampla para um elogio.",
        "exemplo": "Your idea is great.",
        "traducao": "Sua ideia é massa."
      }
    ],
    "cuidado": "Arretado tem outros sentidos conforme a frase. Aqui o assunto é elogiar. Massa também pode ser alimento: não traduza o elogio como dough.",
    "alternativaNeutra": {
      "en": "That is very good.",
      "pt": "Isso é muito bom"
    },
    "fontes": [
      {
        "titulo": "Ufopa / Gelopa: expressões de Santarém e seus contextos",
        "url": "https://comunicacao.ufopa.edu.br/comunicacao/comunica/jornalismo/ufopa-na-midia-2/2023/junho/egua-do-linguajar-expressoes-usadas-por-santarenos-sao-quase-uma-assinatura-bora-espiar/"
      },
      {
        "titulo": "Priberam: arretado",
        "url": "https://dicionario.priberam.org/arretado"
      },
      {
        "titulo": "Cambridge Dictionary: awesome",
        "url": "https://dictionary.cambridge.org/dictionary/english/awesome"
      }
    ],
    "registro": "Conversa informal: observe o tom e a situação"
  },
  {
    "id": "olha-ja",
    "titulo": "Olha já! Negação, surpresa ou descrença?",
    "categoria": "regional",
    "nivel": "B1",
    "regioes": [
      "norte"
    ],
    "contextos": [
      "familia",
      "amigos"
    ],
    "aliases": [
      "olha já",
      "olha ja",
      "mas quando"
    ],
    "resumo": "Estou surpreso ou surpresa: escolha a expressão pelo sentido e pela situação.",
    "brasil": "Pesquisas do Gelopa em Santarém mostram que olha já pode negar, surpreender ou expressar descrença. O sentido não é a soma de olha e já.",
    "equivalentes": [
      {
        "en": "really?",
        "pt": "é mesmo?",
        "uso": "Uma possibilidade quando há surpresa ou dúvida.",
        "exemplo": "Really? You finished the whole book?",
        "traducao": "Olha já! Tu terminaste o livro todo?"
      },
      {
        "en": "that is not what happened",
        "pt": "não foi isso que aconteceu",
        "uso": "Uma explicação para contestar um relato.",
        "exemplo": "That is not what happened. I was at home.",
        "traducao": "Olha já, não foi assim. Eu estava em casa."
      }
    ],
    "cuidado": "Look now não transmite automaticamente essa função. Pergunte o que a pessoa quis dizer antes de escolher a equivalência.",
    "alternativaNeutra": {
      "en": "I am surprised.",
      "pt": "Estou surpreso ou surpresa"
    },
    "fontes": [
      {
        "titulo": "Ufopa / Gelopa: expressões de Santarém e seus contextos",
        "url": "https://comunicacao.ufopa.edu.br/comunicacao/comunica/jornalismo/ufopa-na-midia-2/2023/junho/egua-do-linguajar-expressoes-usadas-por-santarenos-sao-quase-uma-assinatura-bora-espiar/"
      },
      {
        "titulo": "Cambridge Dictionary: really",
        "url": "https://dictionary.cambridge.org/dictionary/english/really"
      }
    ],
    "registro": "Conversa informal: observe o tom e a situação"
  },
  {
    "id": "mana",
    "titulo": "Mana, mano, amiga: como chamar alguém?",
    "categoria": "regional",
    "nivel": "A2",
    "regioes": [
      "norte",
      "sudeste"
    ],
    "contextos": [
      "amigos",
      "familia"
    ],
    "aliases": [
      "mana",
      "manazinha",
      "mano",
      "meu",
      "amiga"
    ],
    "resumo": "Oi, Alex!: escolha a expressão pelo sentido e pela situação.",
    "brasil": "Mana pode chamar alguém de modo próximo no Pará; mano circula em diferentes grupos. Podem marcar proximidade sem indicar parentesco.",
    "equivalentes": [
      {
        "en": "hey",
        "pt": "ei; oi",
        "uso": "Chamada curta, sem definir gênero ou parentesco.",
        "exemplo": "Hey, do you want to join us?",
        "traducao": "Mana, quer vir com a gente?"
      },
      {
        "en": "sis",
        "pt": "mana; amiga próxima",
        "uso": "Muito informal, em grupos que compartilham esse tratamento.",
        "exemplo": "Thanks, sis!",
        "traducao": "Valeu, mana!"
      }
    ],
    "cuidado": "Sis, bro, mate e dude não são intercambiáveis em todos os grupos. Use o nome da pessoa quando não souber como ela prefere ser chamada.",
    "alternativaNeutra": {
      "en": "Hi, Alex!",
      "pt": "Oi, Alex!"
    },
    "fontes": [
      {
        "titulo": "Ufopa / Gelopa: expressões de Santarém e seus contextos",
        "url": "https://comunicacao.ufopa.edu.br/comunicacao/comunica/jornalismo/ufopa-na-midia-2/2023/junho/egua-do-linguajar-expressoes-usadas-por-santarenos-sao-quase-uma-assinatura-bora-espiar/"
      },
      {
        "titulo": "Cambridge Dictionary: sis",
        "url": "https://dictionary.cambridge.org/dictionary/english/sis"
      },
      {
        "titulo": "Cambridge Dictionary: hey",
        "url": "https://dictionary.cambridge.org/dictionary/english/hey"
      }
    ],
    "registro": "Conversa informal: observe o tom e a situação"
  },
  {
    "id": "oxente",
    "titulo": "Oxente, oxe: o tom muda a resposta",
    "categoria": "regional",
    "nivel": "A2",
    "regioes": [
      "nordeste"
    ],
    "contextos": [
      "familia",
      "amigos"
    ],
    "aliases": [
      "oxente",
      "oxe",
      "ôxe"
    ],
    "resumo": "Você pode explicar?: escolha a expressão pelo sentido e pela situação.",
    "brasil": "Oxente e oxe podem expressar surpresa, estranhamento ou contestação em usos associados ao Nordeste, sem exclusividade regional.",
    "equivalentes": [
      {
        "en": "huh?",
        "pt": "hã?; como assim?",
        "uso": "Pode mostrar que você não entendeu.",
        "exemplo": "Huh? I thought we were meeting tomorrow.",
        "traducao": "Oxe? Achei que a gente fosse se encontrar amanhã."
      },
      {
        "en": "well",
        "pt": "bem; ora",
        "uso": "Pode introduzir uma resposta, conforme o tom.",
        "exemplo": "Well, I did tell you yesterday.",
        "traducao": "Oxente, eu te avisei ontem."
      }
    ],
    "cuidado": "Huh? pode soar brusco. Para pedir esclarecimento com delicadeza, use Could you explain? Não há uma tradução fixa para toda ocorrência.",
    "alternativaNeutra": {
      "en": "Could you explain?",
      "pt": "Você pode explicar?"
    },
    "fontes": [
      {
        "titulo": "Priberam: oxente",
        "url": "https://dicionario.priberam.org/oxente"
      },
      {
        "titulo": "Cambridge Dictionary: huh",
        "url": "https://dictionary.cambridge.org/dictionary/english/huh"
      },
      {
        "titulo": "Cambridge Dictionary: well",
        "url": "https://dictionary.cambridge.org/dictionary/english/well"
      }
    ],
    "registro": "Conversa informal: observe o tom e a situação"
  },
  {
    "id": "aperreado",
    "titulo": "Aperreado: preocupação tem tradução",
    "categoria": "regional",
    "nivel": "A2",
    "regioes": [
      "nordeste"
    ],
    "contextos": [
      "familia",
      "amigos",
      "trabalho"
    ],
    "aliases": [
      "aperreado",
      "aperreada",
      "aperreio"
    ],
    "resumo": "Estou preocupado ou preocupada: escolha a expressão pelo sentido e pela situação.",
    "brasil": "Aperreado pode comunicar aflição ou preocupação. Antes de traduzir, veja se o motivo é um problema específico ou acúmulo de tarefas.",
    "equivalentes": [
      {
        "en": "worried",
        "pt": "preocupado ou preocupada",
        "uso": "Quando há uma preocupação definida.",
        "exemplo": "I am worried about the exam.",
        "traducao": "Estou aperreada com a prova."
      },
      {
        "en": "stressed out",
        "pt": "muito estressado ou estressada",
        "uso": "Conversa informal sobre tensão.",
        "exemplo": "I am stressed out today.",
        "traducao": "Hoje estou aperreado."
      }
    ],
    "cuidado": "Não trate todo desconforto como um diagnóstico. Worried descreve uma preocupação sem presumir uma condição de saúde.",
    "alternativaNeutra": {
      "en": "I am worried.",
      "pt": "Estou preocupado ou preocupada"
    },
    "fontes": [
      {
        "titulo": "Priberam: aperreado",
        "url": "https://dicionario.priberam.org/aperreado"
      },
      {
        "titulo": "Cambridge Dictionary: worried",
        "url": "https://dictionary.cambridge.org/dictionary/english/worried"
      },
      {
        "titulo": "Cambridge Dictionary: stressed out",
        "url": "https://dictionary.cambridge.org/dictionary/english/stressed-out"
      }
    ],
    "registro": "Conversa informal: observe o tom e a situação"
  },
  {
    "id": "uai",
    "titulo": "Uai, ué: surpresa ou pergunta?",
    "categoria": "regional",
    "nivel": "A2",
    "regioes": [
      "sudeste",
      "centro-oeste"
    ],
    "contextos": [
      "familia",
      "amigos"
    ],
    "aliases": [
      "uai",
      "ué",
      "ue",
      "uai sô"
    ],
    "resumo": "Por que isso?: escolha a expressão pelo sentido e pela situação.",
    "brasil": "Uai é associado a Minas Gerais e também aparece em Goiás e outros lugares. Pode marcar surpresa, dúvida ou uma resposta que parece óbvia a quem fala.",
    "equivalentes": [
      {
        "en": "oh",
        "pt": "ah!; reação de descoberta ou surpresa",
        "uso": "Para reagir a uma informação nova.",
        "exemplo": "Oh, you are already here!",
        "traducao": "Uai, você já chegou!"
      },
      {
        "en": "how come?",
        "pt": "como assim?; por quê?",
        "uso": "Pergunta informal sobre um motivo inesperado.",
        "exemplo": "How come you are leaving so early?",
        "traducao": "Uai, por que você vai embora tão cedo?"
      }
    ],
    "cuidado": "Why pode ser uma alternativa mais neutra. A entonação e a frase inteira fazem diferença; não substitua todo uai por uma palavra só.",
    "alternativaNeutra": {
      "en": "Why is that?",
      "pt": "Por que isso?"
    },
    "fontes": [
      {
        "titulo": "Priberam: uai",
        "url": "https://dicionario.priberam.org/uai"
      },
      {
        "titulo": "O Povo: exemplos de gírias nos estados brasileiros",
        "url": "https://www.opovo.com.br/agencia/flipar/2025/03/23/as-girias-de-cada-estado-do-brasil.html"
      },
      {
        "titulo": "Cambridge Dictionary: how come",
        "url": "https://dictionary.cambridge.org/dictionary/english/how-come"
      }
    ],
    "registro": "Conversa informal: observe o tom e a situação"
  },
  {
    "id": "trem",
    "titulo": "Esse trem, esse negócio, essa coisa",
    "categoria": "regional",
    "nivel": "A1",
    "regioes": [
      "sudeste",
      "centro-oeste",
      "norte"
    ],
    "contextos": [
      "familia",
      "amigos",
      "servicos"
    ],
    "aliases": [
      "trem",
      "treco",
      "negócio",
      "troço",
      "bagulho"
    ],
    "resumo": "Que objeto é este?: escolha a expressão pelo sentido e pela situação.",
    "brasil": "Em usos encontrados em Minas Gerais, Goiás e Tocantins, trem pode se referir a uma coisa. O contexto mostra se o assunto é um objeto ou um transporte.",
    "equivalentes": [
      {
        "en": "thing",
        "pt": "coisa; objeto não nomeado",
        "uso": "Útil para um objeto específico.",
        "exemplo": "What is this thing?",
        "traducao": "Que trem é esse?"
      },
      {
        "en": "stuff",
        "pt": "coisas; material em geral",
        "uso": "Coletivo informal, sem plural em -s nesse sentido.",
        "exemplo": "Put your stuff here.",
        "traducao": "Ponha suas coisas aqui."
      }
    ],
    "cuidado": "Train só serve quando trem é o transporte. Em um pedido importante, dizer o nome do objeto costuma ser mais claro.",
    "alternativaNeutra": {
      "en": "What is this object?",
      "pt": "Que objeto é este?"
    },
    "fontes": [
      {
        "titulo": "Dicio: trem e usos regionais",
        "url": "https://www.dicio.com.br/trem/"
      },
      {
        "titulo": "Cambridge Dictionary: thing",
        "url": "https://dictionary.cambridge.org/dictionary/english/thing"
      },
      {
        "titulo": "Cambridge Dictionary: stuff",
        "url": "https://dictionary.cambridge.org/dictionary/english/stuff"
      }
    ],
    "registro": "Conversa informal: observe o tom e a situação"
  },
  {
    "id": "bah-tri",
    "titulo": "Bah, que tri! Reação e intensidade",
    "categoria": "regional",
    "nivel": "A2",
    "regioes": [
      "sul"
    ],
    "contextos": [
      "familia",
      "amigos",
      "lazer"
    ],
    "aliases": [
      "bah",
      "tri",
      "tri legal",
      "tri massa"
    ],
    "resumo": "Isso é muito legal: escolha a expressão pelo sentido e pela situação.",
    "brasil": "Bah pode marcar reações diversas; tri pode intensificar um elogio em usos do Sul, especialmente gaúchos. A região reúne muitos outros jeitos de falar.",
    "equivalentes": [
      {
        "en": "wow",
        "pt": "nossa!; admiração",
        "uso": "Uma possibilidade para bah de surpresa boa.",
        "exemplo": "Wow, what a view!",
        "traducao": "Bah, que vista!"
      },
      {
        "en": "really cool",
        "pt": "muito legal",
        "uso": "Transmite o elogio de tri legal.",
        "exemplo": "Your bike is really cool.",
        "traducao": "Tua bicicleta é tri legal."
      }
    ],
    "cuidado": "Tri não vira three nesse uso. Bah em inglês também existe, mas pode expressar desprezo: copiar a forma não garante o mesmo tom.",
    "alternativaNeutra": {
      "en": "That is very nice.",
      "pt": "Isso é muito legal"
    },
    "fontes": [
      {
        "titulo": "Priberam: bah",
        "url": "https://dicionario.priberam.org/bah"
      },
      {
        "titulo": "O Povo: exemplos de gírias nos estados brasileiros",
        "url": "https://www.opovo.com.br/agencia/flipar/2025/03/23/as-girias-de-cada-estado-do-brasil.html"
      },
      {
        "titulo": "Cambridge Dictionary: cool",
        "url": "https://dictionary.cambridge.org/dictionary/english/cool"
      }
    ],
    "registro": "Conversa informal: observe o tom e a situação"
  },
  {
    "id": "guri-pia",
    "titulo": "Guri, guria, piá: falando de crianças",
    "categoria": "regional",
    "nivel": "A1",
    "regioes": [
      "sul",
      "centro-oeste"
    ],
    "contextos": [
      "familia",
      "escola",
      "amigos"
    ],
    "aliases": [
      "guri",
      "guria",
      "piá",
      "pia",
      "gurizada",
      "menino",
      "menina"
    ],
    "resumo": "As crianças estão brincando: escolha a expressão pelo sentido e pela situação.",
    "brasil": "Guri, guria e piá são encontrados em diferentes áreas, com destaque para usos do Sul. O Atlas Linguístico do Brasil estuda essa variação, sem tratar um nome como superior.",
    "equivalentes": [
      {
        "en": "kid",
        "pt": "criança; menino ou menina, conforme o contexto",
        "uso": "Informal e sem gênero marcado.",
        "exemplo": "The kids are playing outside.",
        "traducao": "A gurizada está brincando lá fora."
      },
      {
        "en": "child",
        "pt": "criança",
        "uso": "Mais neutro; o plural é children.",
        "exemplo": "Every child can join the game.",
        "traducao": "Toda criança pode participar da brincadeira."
      }
    ],
    "cuidado": "Kid não quer dizer automaticamente menino: pode se referir a qualquer criança. Use boy ou girl apenas quando esse detalhe fizer parte da mensagem.",
    "alternativaNeutra": {
      "en": "The children are playing.",
      "pt": "As crianças estão brincando"
    },
    "fontes": [
      {
        "titulo": "ALFA / ALiB: menino, guri ou piá",
        "url": "https://www.scielo.br/j/alfa/a/TcCD6snwgfPc5x39KhpQ87z/?lang=pt"
      },
      {
        "titulo": "Priberam: piá",
        "url": "https://dicionario.priberam.org/piá"
      },
      {
        "titulo": "Cambridge Dictionary: kid",
        "url": "https://dictionary.cambridge.org/dictionary/english/kid"
      }
    ],
    "registro": "Conversa informal: observe o tom e a situação"
  },
  {
    "id": "rensga",
    "titulo": "Rensga! Uma surpresa de Goiás",
    "categoria": "regional",
    "nivel": "A2",
    "regioes": [
      "centro-oeste"
    ],
    "contextos": [
      "familia",
      "amigos"
    ],
    "aliases": [
      "rensga",
      "nossa senhora"
    ],
    "resumo": "Isso é surpreendente!: escolha a expressão pelo sentido e pela situação.",
    "brasil": "Rensga é registrada em repertórios de expressões goianas como uma reação de espanto. Quem mora em Goiás não precisa usar a expressão para pertencer à região.",
    "equivalentes": [
      {
        "en": "wow",
        "pt": "nossa!; surpresa",
        "uso": "Para uma reação de admiração.",
        "exemplo": "Wow, that cake is huge!",
        "traducao": "Rensga, esse bolo é enorme!"
      }
    ],
    "cuidado": "Se o espanto for ruim, oh no pode combinar melhor. A equivalência depende da emoção e não reproduz toda a identidade da expressão.",
    "alternativaNeutra": {
      "en": "That is surprising!",
      "pt": "Isso é surpreendente!"
    },
    "fontes": [
      {
        "titulo": "O Povo: exemplos de gírias nos estados brasileiros",
        "url": "https://www.opovo.com.br/agencia/flipar/2025/03/23/as-girias-de-cada-estado-do-brasil.html"
      },
      {
        "titulo": "Cambridge Dictionary: wow",
        "url": "https://dictionary.cambridge.org/dictionary/english/wow"
      }
    ],
    "registro": "Conversa informal: observe o tom e a situação"
  },
  {
    "id": "arredar",
    "titulo": "Arreda um pouquinho, por favor",
    "categoria": "regional",
    "nivel": "A2",
    "regioes": [
      "norte",
      "sudeste",
      "centro-oeste"
    ],
    "contextos": [
      "familia",
      "escola",
      "servicos"
    ],
    "aliases": [
      "arredar",
      "arreda",
      "te arreda",
      "dá licença",
      "dar espaço"
    ],
    "resumo": "Você pode dar um pouco de espaço, por favor?: escolha a expressão pelo sentido e pela situação.",
    "brasil": "Arredar pode pedir que alguém ou alguma coisa se afaste. Aparece em diferentes regiões e situações.",
    "equivalentes": [
      {
        "en": "move over",
        "pt": "afastar-se um pouco; dar espaço",
        "uso": "Para abrir espaço ao lado.",
        "exemplo": "Could you move over a little, please?",
        "traducao": "Você pode arredar um pouquinho, por favor?"
      }
    ],
    "cuidado": "Move! sozinho pode soar como uma ordem dura. Acrescente please e diga o que precisa, especialmente com desconhecidos.",
    "alternativaNeutra": {
      "en": "Could you make some room, please?",
      "pt": "Você pode dar um pouco de espaço, por favor?"
    },
    "fontes": [
      {
        "titulo": "Priberam: arredar",
        "url": "https://dicionario.priberam.org/arredar"
      },
      {
        "titulo": "Ufopa / Gelopa: expressões de Santarém e seus contextos",
        "url": "https://comunicacao.ufopa.edu.br/comunicacao/comunica/jornalismo/ufopa-na-midia-2/2023/junho/egua-do-linguajar-expressoes-usadas-por-santarenos-sao-quase-uma-assinatura-bora-espiar/"
      },
      {
        "titulo": "Cambridge Dictionary: move over",
        "url": "https://dictionary.cambridge.org/dictionary/english/move-over"
      }
    ],
    "registro": "Conversa informal: observe o tom e a situação"
  },
  {
    "id": "mainha",
    "titulo": "Mainha, painho: carinho em família",
    "categoria": "regional",
    "nivel": "A1",
    "regioes": [
      "nordeste"
    ],
    "contextos": [
      "familia"
    ],
    "aliases": [
      "mainha",
      "painho",
      "mamãe",
      "papai"
    ],
    "resumo": "Minha mãe está aqui: escolha a expressão pelo sentido e pela situação.",
    "brasil": "Mainha e painho são formas afetivas encontradas em famílias nordestinas e também fora da região. Adultos podem continuar usando formas carinhosas.",
    "equivalentes": [
      {
        "en": "mom",
        "pt": "mãe; mamãe",
        "uso": "Grafia comum no inglês dos Estados Unidos.",
        "exemplo": "I am visiting my mom today.",
        "traducao": "Vou visitar mainha hoje."
      },
      {
        "en": "mum",
        "pt": "mãe; mamãe",
        "uso": "Grafia comum no inglês britânico.",
        "exemplo": "My mum likes this song.",
        "traducao": "Mainha gosta dessa música."
      }
    ],
    "cuidado": "Dad pode servir para pai ou painho. Essas palavras não reproduzem todo o carinho de cada família. Você pode manter o apelido e explicar quem é a pessoa.",
    "alternativaNeutra": {
      "en": "My mother is here.",
      "pt": "Minha mãe está aqui"
    },
    "fontes": [
      {
        "titulo": "Dicio: mainha",
        "url": "https://www.dicio.com.br/mainha/"
      },
      {
        "titulo": "Cambridge Dictionary: mom",
        "url": "https://dictionary.cambridge.org/dictionary/english/mom"
      },
      {
        "titulo": "Cambridge Dictionary: mum",
        "url": "https://dictionary.cambridge.org/dictionary/english/mum"
      }
    ],
    "registro": "Conversa informal: observe o tom e a situação"
  },
  {
    "id": "merenda",
    "titulo": "Merenda: lanche ou refeição da escola?",
    "categoria": "cotidiano",
    "nivel": "A1",
    "regioes": [],
    "contextos": [
      "escola",
      "familia"
    ],
    "aliases": [
      "merenda",
      "lanche",
      "lancheira",
      "recreio"
    ],
    "resumo": "É hora de comer: escolha a expressão pelo sentido e pela situação.",
    "brasil": "Merenda pode ser um lanche ou uma refeição servida na escola. O conteúdo da refeição ajuda a escolher a palavra em inglês.",
    "equivalentes": [
      {
        "en": "snack",
        "pt": "lanche pequeno",
        "uso": "Para uma pequena porção entre refeições.",
        "exemplo": "I have fruit for a snack.",
        "traducao": "Tenho fruta para o lanche."
      },
      {
        "en": "school meal",
        "pt": "refeição da escola",
        "uso": "Para falar da alimentação escolar sem presumir o tamanho ou o horário.",
        "exemplo": "We have a school meal at eleven.",
        "traducao": "A gente come a merenda da escola às onze."
      }
    ],
    "cuidado": "Snack não descreve bem toda refeição completa. Lunch pode servir se for o almoço. Nenhuma opção define o valor da comida da família.",
    "alternativaNeutra": {
      "en": "It is time to eat.",
      "pt": "É hora de comer"
    },
    "fontes": [
      {
        "titulo": "Priberam: merenda",
        "url": "https://dicionario.priberam.org/merenda"
      },
      {
        "titulo": "Cambridge Dictionary: snack",
        "url": "https://dictionary.cambridge.org/dictionary/english/snack"
      },
      {
        "titulo": "Cambridge Dictionary: meal",
        "url": "https://dictionary.cambridge.org/dictionary/english/meal"
      }
    ]
  },
  {
    "id": "pega-pega",
    "titulo": "Pega-pega, pique-pega: bora brincar?",
    "categoria": "cotidiano",
    "nivel": "A1",
    "regioes": [],
    "contextos": [
      "escola",
      "lazer",
      "amigos"
    ],
    "aliases": [
      "pega-pega",
      "pique-pega",
      "pique",
      "brincar"
    ],
    "resumo": "Vamos brincar juntos: escolha a expressão pelo sentido e pela situação.",
    "brasil": "Brincadeiras podem ter nomes e regras diferentes até entre escolas da mesma cidade. Explique como a sua funciona.",
    "equivalentes": [
      {
        "en": "tag",
        "pt": "pega-pega; brincadeira de tocar para passar a vez",
        "uso": "Para a brincadeira em que alguém tenta tocar outra pessoa.",
        "exemplo": "Do you want to play tag?",
        "traducao": "Quer brincar de pega-pega?"
      }
    ],
    "cuidado": "Tag também é etiqueta ou marcação em rede social. Aqui o verbo play e a situação de brincadeira deixam o sentido claro.",
    "alternativaNeutra": {
      "en": "Let's play together.",
      "pt": "Vamos brincar juntos"
    },
    "fontes": [
      {
        "titulo": "Priberam: pega-pega",
        "url": "https://dicionario.priberam.org/pega-pega"
      },
      {
        "titulo": "Cambridge Dictionary: tag",
        "url": "https://dictionary.cambridge.org/dictionary/english/tag"
      }
    ]
  },
  {
    "id": "foi-mal",
    "titulo": "Foi mal! Pequeno erro, pedido de desculpa",
    "categoria": "cotidiano",
    "nivel": "A2",
    "regioes": [],
    "contextos": [
      "amigos",
      "escola",
      "trabalho"
    ],
    "aliases": [
      "foi mal",
      "vacilei",
      "desculpa",
      "erro meu"
    ],
    "resumo": "Peço desculpas pelo erro: escolha a expressão pelo sentido e pela situação.",
    "brasil": "Foi mal pode reconhecer um erro pequeno entre pessoas próximas. A gravidade do ocorrido muda a resposta adequada.",
    "equivalentes": [
      {
        "en": "my bad",
        "pt": "foi mal; erro meu",
        "uso": "Bem informal, para um deslize pequeno.",
        "exemplo": "My bad, I sent the wrong link.",
        "traducao": "Foi mal, mandei o link errado."
      },
      {
        "en": "sorry",
        "pt": "desculpe; sinto muito, conforme a situação",
        "uso": "Mais amplo, podendo precisar de uma explicação ou reparo.",
        "exemplo": "Sorry, I sent the wrong file.",
        "traducao": "Desculpe, enviei o arquivo errado."
      }
    ],
    "cuidado": "My bad pode parecer pouco cuidadoso diante de um dano sério. Em contexto profissional, reconheça o erro e explique como vai corrigi-lo.",
    "alternativaNeutra": {
      "en": "I am sorry about the mistake.",
      "pt": "Peço desculpas pelo erro"
    },
    "fontes": [
      {
        "titulo": "Cambridge Dictionary: my bad",
        "url": "https://dictionary.cambridge.org/dictionary/english/my-bad"
      },
      {
        "titulo": "Cambridge Dictionary: sorry",
        "url": "https://dictionary.cambridge.org/dictionary/english/sorry"
      }
    ]
  },
  {
    "id": "shippar",
    "titulo": "Shippar: torcida por um casal de ficção",
    "categoria": "internet",
    "nivel": "B1",
    "regioes": [],
    "contextos": [
      "redes",
      "amigos"
    ],
    "aliases": [
      "shippar",
      "shippo",
      "shipp",
      "fandom",
      "casal"
    ],
    "resumo": "Torço para esses personagens virarem um casal: escolha a expressão pelo sentido e pela situação.",
    "brasil": "Em fandoms, shippar pode ser torcer para personagens formarem um casal. A palavra veio do inglês, mas ship tem outros sentidos.",
    "equivalentes": [
      {
        "en": "ship",
        "pt": "torcer por um casal, no contexto de fandom",
        "uso": "Gíria usada por quem conhece esse contexto.",
        "exemplo": "I ship these two characters.",
        "traducao": "Eu shippo esses dois personagens."
      }
    ],
    "cuidado": "Ship também pode ser navio ou enviar mercadoria. Para uma conversa fora do fandom, explique que gostaria de ver os personagens juntos.",
    "alternativaNeutra": {
      "en": "I hope these characters become a couple.",
      "pt": "Torço para esses personagens virarem um casal"
    },
    "fontes": [
      {
        "titulo": "Dictionary.com: shipping no contexto de fandom",
        "url": "https://www.dictionary.com/browse/shipping"
      },
      {
        "titulo": "Cambridge Dictionary: ship",
        "url": "https://dictionary.cambridge.org/dictionary/english/ship"
      }
    ],
    "faixas": [
      "adolescente",
      "adulto"
    ]
  },
  {
    "id": "cringe",
    "titulo": "Cringe, vergonha alheia: descreva a sensação",
    "categoria": "internet",
    "nivel": "B1",
    "regioes": [],
    "contextos": [
      "redes",
      "amigos",
      "escola"
    ],
    "aliases": [
      "cringe",
      "vergonha alheia",
      "mico",
      "pagar mico"
    ],
    "resumo": "Aquilo me deixou com vergonha: escolha a expressão pelo sentido e pela situação.",
    "brasil": "Cringe aparece em comentários brasileiros e ingleses sobre algo constrangedor. Também é um verbo relacionado a sentir constrangimento.",
    "equivalentes": [
      {
        "en": "cringeworthy",
        "pt": "que dá vergonha alheia; constrangedor",
        "uso": "Descreve uma situação que provoca constrangimento.",
        "exemplo": "That scene was cringeworthy.",
        "traducao": "Aquela cena deu vergonha alheia."
      }
    ],
    "cuidado": "Não use o rótulo para diminuir pessoas por idade, sotaque ou gostos. Pode dizer que uma situação deixou você desconfortável sem atacar ninguém.",
    "alternativaNeutra": {
      "en": "That made me feel embarrassed.",
      "pt": "Aquilo me deixou com vergonha"
    },
    "fontes": [
      {
        "titulo": "Cambridge Dictionary: cringe",
        "url": "https://dictionary.cambridge.org/dictionary/english/cringe"
      },
      {
        "titulo": "Cambridge Dictionary: cringeworthy",
        "url": "https://dictionary.cambridge.org/dictionary/english/cringeworthy"
      },
      {
        "titulo": "British Council: gírias, público e mudança da língua",
        "url": "https://learnenglishteens.britishcouncil.org/study-break/magazine-zone/slang"
      }
    ],
    "faixas": [
      "adolescente",
      "adulto"
    ]
  },
  {
    "id": "delulu",
    "titulo": "Delulu: brincando com uma expectativa irreal",
    "categoria": "internet",
    "nivel": "B1",
    "regioes": [],
    "contextos": [
      "redes",
      "amigos"
    ],
    "aliases": [
      "delulu",
      "iludido",
      "iludida",
      "viajei"
    ],
    "resumo": "Essa expectativa era irrealista: escolha a expressão pelo sentido e pela situação.",
    "brasil": "Delulu é uma gíria que pode aparecer como brincadeira sobre acreditar no que se deseja, mesmo sem evidência. Não é uma forma de avaliar a saúde de alguém.",
    "equivalentes": [
      {
        "en": "delulu",
        "pt": "iludido ou iludida, em uso brincalhão de internet",
        "uso": "Reconheça o tom e o grupo antes de usar.",
        "exemplo": "I thought I could finish ten books today. I was being delulu.",
        "traducao": "Achei que dava para terminar dez livros hoje. Viajei na expectativa."
      }
    ],
    "cuidado": "Não é equivalente a todo uso de sonhador, viajando ou iludido. Evite usá-la para rotular outra pessoa; a versão neutra esclarece o que foi irreal.",
    "alternativaNeutra": {
      "en": "That expectation was unrealistic.",
      "pt": "Essa expectativa era irrealista"
    },
    "fontes": [
      {
        "titulo": "Cambridge Dictionary: delulu",
        "url": "https://dictionary.cambridge.org/dictionary/english/delulu"
      },
      {
        "titulo": "British Council: gírias, público e mudança da língua",
        "url": "https://learnenglishteens.britishcouncil.org/study-break/magazine-zone/slang"
      }
    ],
    "faixas": [
      "adolescente",
      "adulto"
    ]
  },
  {
    "id": "rizz",
    "titulo": "Rizz: o que a pessoa chama de charme?",
    "categoria": "internet",
    "nivel": "B1",
    "regioes": [],
    "contextos": [
      "redes",
      "amigos"
    ],
    "aliases": [
      "rizz",
      "charme",
      "ter papo",
      "lábia"
    ],
    "resumo": "O personagem é charmoso: escolha a expressão pelo sentido e pela situação.",
    "brasil": "Rizz pode indicar charme ou habilidade de atrair interesse romântico. Aproxima-se de ter charme ou ter papo nesse contexto específico.",
    "equivalentes": [
      {
        "en": "rizz",
        "pt": "charme ou habilidade de despertar interesse romântico",
        "uso": "Gíria informal que não é conhecida por todo falante.",
        "exemplo": "The character has rizz.",
        "traducao": "O personagem tem charme."
      }
    ],
    "cuidado": "Não substitui qualquer uso de lábia ou carisma profissional. Respeito e consentimento continuam fazendo parte das interações; ninguém precisa usar essa gíria.",
    "alternativaNeutra": {
      "en": "The character is charming.",
      "pt": "O personagem é charmoso"
    },
    "fontes": [
      {
        "titulo": "Cambridge Dictionary: rizz",
        "url": "https://dictionary.cambridge.org/dictionary/english/rizz"
      },
      {
        "titulo": "British Council: gírias, público e mudança da língua",
        "url": "https://learnenglishteens.britishcouncil.org/study-break/magazine-zone/slang"
      }
    ],
    "faixas": [
      "adolescente",
      "adulto"
    ]
  },
  {
    "id": "ghosting",
    "titulo": "Sumiu do contato: foi ghosting?",
    "categoria": "internet",
    "nivel": "B1",
    "regioes": [],
    "contextos": [
      "redes",
      "amigos"
    ],
    "aliases": [
      "ghosting",
      "deu ghost",
      "vácuo",
      "deixou no vácuo",
      "sumiu"
    ],
    "resumo": "Ainda não recebi resposta: escolha a expressão pelo sentido e pela situação.",
    "brasil": "Ghosting descreve interromper o contato de repente, sem explicação. Uma demora isolada para responder não prova que isso aconteceu.",
    "equivalentes": [
      {
        "en": "ghosting",
        "pt": "corte repentino de contato sem explicação",
        "uso": "Nomeia um padrão de comportamento, não uma resposta atrasada.",
        "exemplo": "The article explains ghosting in online friendships.",
        "traducao": "O artigo explica o sumiço sem explicação em amizades online."
      }
    ],
    "cuidado": "Vácuo pode ser apenas uma mensagem sem resposta. Para não presumir intenção, diga que ainda não recebeu resposta.",
    "alternativaNeutra": {
      "en": "I have not heard back yet.",
      "pt": "Ainda não recebi resposta"
    },
    "fontes": [
      {
        "titulo": "Cambridge Dictionary: ghosting",
        "url": "https://dictionary.cambridge.org/dictionary/english/ghosting"
      },
      {
        "titulo": "Oxford: usos de ghosting",
        "url": "https://learningenglishwithoxford.oup.com/2020/10/23/ghosting/"
      }
    ],
    "faixas": [
      "adolescente",
      "adulto"
    ]
  },
  {
    "id": "fofoca",
    "titulo": "Conta o babado: spill the tea?",
    "categoria": "internet",
    "nivel": "B1",
    "regioes": [],
    "contextos": [
      "redes",
      "amigos"
    ],
    "aliases": [
      "fofoca",
      "babado",
      "conta o chá",
      "spill the tea"
    ],
    "resumo": "Conte o que aconteceu: escolha a expressão pelo sentido e pela situação.",
    "brasil": "Conta o babado pode pedir novidades ou fofoca. Spill the tea combina com o sentido de revelar informação interessante ou privada, em conversa informal.",
    "equivalentes": [
      {
        "en": "spill the tea",
        "pt": "contar a fofoca; revelar o babado",
        "uso": "Gíria de uso social, não um pedido literal de chá.",
        "exemplo": "In the story, a character says, \"Spill the tea!\"",
        "traducao": "Na história, um personagem diz: \"Conta o babado!\""
      }
    ],
    "cuidado": "Nem toda novidade é fofoca. A expressão tem história em comunidades negras e LGBTQIA+; não nasceu simplesmente de uma geração. Preserve a privacidade de pessoas reais.",
    "alternativaNeutra": {
      "en": "Tell me what happened.",
      "pt": "Conte o que aconteceu"
    },
    "fontes": [
      {
        "titulo": "Cambridge Dictionary: spill the tea",
        "url": "https://dictionary.cambridge.org/dictionary/english/spill-the-tea"
      },
      {
        "titulo": "Dictionary.com: tea, uso e história",
        "url": "https://www.dictionary.com/culture/slang/tea"
      }
    ],
    "faixas": [
      "adolescente",
      "adulto"
    ]
  },
  {
    "id": "ranco",
    "titulo": "Peguei ranço: incômodo, não rancidez",
    "categoria": "internet",
    "nivel": "B1",
    "regioes": [],
    "contextos": [
      "redes",
      "amigos"
    ],
    "aliases": [
      "ranço",
      "ranco",
      "peguei ranço",
      "me irrita"
    ],
    "resumo": "Não gosto muito disso: escolha a expressão pelo sentido e pela situação.",
    "brasil": "Pegar ranço pode expressar uma antipatia ou irritação persistente. A frase inglesa deve deixar claro se você não gostou ou se algo incomoda repetidamente.",
    "equivalentes": [
      {
        "en": "get on my nerves",
        "pt": "me irritar; me incomodar",
        "uso": "Para algo que provoca irritação.",
        "exemplo": "That repeated sound gets on my nerves.",
        "traducao": "Peguei ranço desse som que não para."
      }
    ],
    "cuidado": "Rancid descreve comida ou gordura estragada e não transmite esse uso. Para uma opinião menos forte, use I do not really like it.",
    "alternativaNeutra": {
      "en": "I do not really like it.",
      "pt": "Não gosto muito disso"
    },
    "fontes": [
      {
        "titulo": "Priberam: ranço",
        "url": "https://dicionario.priberam.org/ranço"
      },
      {
        "titulo": "Cambridge Dictionary: nerve",
        "url": "https://dictionary.cambridge.org/dictionary/english/nerve"
      }
    ],
    "faixas": [
      "adolescente",
      "adulto"
    ]
  },
  {
    "id": "perrengue",
    "titulo": "Passei um perrengue: conte a dificuldade",
    "categoria": "cotidiano",
    "nivel": "A2",
    "regioes": [],
    "contextos": [
      "viagem",
      "trabalho",
      "familia"
    ],
    "aliases": [
      "perrengue",
      "aperto",
      "sufoco",
      "situação difícil"
    ],
    "resumo": "Tivemos um problema: escolha a expressão pelo sentido e pela situação.",
    "brasil": "Perrengue pode ser um aperto, uma dificuldade ou uma situação complicada. Não é restrito a uma idade, região ou condição econômica.",
    "equivalentes": [
      {
        "en": "a tough time",
        "pt": "um período ou situação difícil",
        "uso": "Expressão ampla para uma dificuldade.",
        "exemplo": "We had a tough time finding the station.",
        "traducao": "Passamos um perrengue para achar a estação."
      }
    ],
    "cuidado": "Trouble também pode ajudar: We had trouble finding the station. Não traduza aperto automaticamente como squeeze.",
    "alternativaNeutra": {
      "en": "We had a problem.",
      "pt": "Tivemos um problema"
    },
    "fontes": [
      {
        "titulo": "Priberam: perrengue",
        "url": "https://dicionario.priberam.org/perrengue"
      },
      {
        "titulo": "Cambridge Dictionary: tough",
        "url": "https://dictionary.cambridge.org/dictionary/english/tough"
      },
      {
        "titulo": "Cambridge Dictionary: trouble",
        "url": "https://dictionary.cambridge.org/dictionary/english/trouble"
      }
    ]
  },
  {
    "id": "quebrar-galho",
    "titulo": "Quebrar um galho: ajuda ou improviso?",
    "categoria": "cotidiano",
    "nivel": "A2",
    "regioes": [],
    "contextos": [
      "trabalho",
      "familia",
      "amigos",
      "comunidade"
    ],
    "aliases": [
      "quebrar um galho",
      "quebra um galho",
      "dar uma força",
      "desenrolar",
      "dar um jeito"
    ],
    "resumo": "Você pode me ajudar, por favor?: escolha a expressão pelo sentido e pela situação.",
    "brasil": "Uma pessoa quebra um galho quando ajuda. Um objeto quebra um galho quando resolve temporariamente uma necessidade.",
    "equivalentes": [
      {
        "en": "help out",
        "pt": "ajudar; dar uma força",
        "uso": "Para a ajuda de uma pessoa.",
        "exemplo": "Could you help me out with this box?",
        "traducao": "Pode me quebrar um galho com esta caixa?"
      },
      {
        "en": "do for now",
        "pt": "servir por enquanto",
        "uso": "Para uma solução temporária.",
        "exemplo": "This small table will do for now.",
        "traducao": "Esta mesinha quebra um galho por enquanto."
      }
    ],
    "cuidado": "Break a branch descreve quebrar um galho de árvore. Diga o tipo de ajuda ou solução para não perder o sentido.",
    "alternativaNeutra": {
      "en": "Could you help me, please?",
      "pt": "Você pode me ajudar, por favor?"
    },
    "fontes": [
      {
        "titulo": "Cambridge Dictionary: help out",
        "url": "https://dictionary.cambridge.org/dictionary/english/help-out"
      },
      {
        "titulo": "Cambridge Dictionary: do",
        "url": "https://dictionary.cambridge.org/dictionary/english/do"
      }
    ]
  },
  {
    "id": "bico",
    "titulo": "Fazer um bico: trabalho também tem contextos",
    "categoria": "cotidiano",
    "nivel": "B1",
    "regioes": [],
    "contextos": [
      "trabalho",
      "servicos"
    ],
    "aliases": [
      "bico",
      "bicos",
      "trabalho extra",
      "freela",
      "diária"
    ],
    "resumo": "Faço trabalhos ocasionais: escolha a expressão pelo sentido e pela situação.",
    "brasil": "Bico pode indicar trabalho eventual para ganhar dinheiro. O tipo de serviço define uma boa descrição; não informa sozinho contrato ou direitos.",
    "equivalentes": [
      {
        "en": "odd jobs",
        "pt": "serviços ocasionais, frequentemente pequenos",
        "uso": "Para tarefas variadas, como pequenos reparos.",
        "exemplo": "I do odd jobs around the neighborhood.",
        "traducao": "Faço bicos aqui pela vizinhança."
      },
      {
        "en": "extra work",
        "pt": "trabalho extra",
        "uso": "Alternativa ampla quando não se trata de pequenos serviços.",
        "exemplo": "I am looking for some extra work.",
        "traducao": "Estou procurando um trabalho extra."
      }
    ],
    "cuidado": "Gig pode caber em alguns trabalhos, mas não descreve toda atividade eventual. Evite traduzir bico por beak, que é a parte da ave.",
    "alternativaNeutra": {
      "en": "I do occasional work.",
      "pt": "Faço trabalhos ocasionais"
    },
    "fontes": [
      {
        "titulo": "Priberam: bico",
        "url": "https://dicionario.priberam.org/bico"
      },
      {
        "titulo": "Cambridge Dictionary: odd jobs",
        "url": "https://dictionary.cambridge.org/dictionary/english/odd-jobs"
      }
    ],
    "faixas": [
      "adulto"
    ]
  },
  {
    "id": "vaquinha",
    "titulo": "Fazer uma vaquinha: juntar contribuições",
    "categoria": "cotidiano",
    "nivel": "A2",
    "regioes": [],
    "contextos": [
      "comunidade",
      "familia",
      "amigos",
      "trabalho"
    ],
    "aliases": [
      "vaquinha",
      "fazer uma vaquinha",
      "arrecadação",
      "cota",
      "contribuir"
    ],
    "resumo": "Estamos juntando contribuições: escolha a expressão pelo sentido e pela situação.",
    "brasil": "Fazer uma vaquinha pode ser juntar pequenas contribuições para uma compra ou uma causa. A forma de arrecadação muda a descrição.",
    "equivalentes": [
      {
        "en": "chip in",
        "pt": "contribuir com uma parte",
        "uso": "Para combinar contribuições em grupo.",
        "exemplo": "We can all chip in for a new bench.",
        "traducao": "Podemos fazer uma vaquinha para um banco novo."
      },
      {
        "en": "fundraiser",
        "pt": "arrecadação ou evento para levantar fundos",
        "uso": "Quando há uma ação organizada para uma causa.",
        "exemplo": "The community is organizing a fundraiser.",
        "traducao": "A comunidade está organizando uma arrecadação."
      }
    ],
    "cuidado": "Crowdfunding costuma indicar financiamento coletivo, muitas vezes por plataforma; não é obrigatório para uma vaquinha entre amigos. Little cow seria literal e perderia a intenção.",
    "alternativaNeutra": {
      "en": "We are collecting contributions.",
      "pt": "Estamos juntando contribuições"
    },
    "fontes": [
      {
        "titulo": "Priberam: vaquinha",
        "url": "https://dicionario.priberam.org/vaquinha"
      },
      {
        "titulo": "Cambridge Dictionary: chip in",
        "url": "https://dictionary.cambridge.org/dictionary/english/chip-in"
      },
      {
        "titulo": "Cambridge Dictionary: fundraiser",
        "url": "https://dictionary.cambridge.org/dictionary/english/fundraiser"
      }
    ]
  },
  {
    "id": "saudade",
    "titulo": "Saudade: inglês também comunica esse sentimento",
    "categoria": "cotidiano",
    "nivel": "A2",
    "regioes": [],
    "contextos": [
      "familia",
      "amigos",
      "viagem"
    ],
    "aliases": [
      "saudade",
      "saudades",
      "sentir falta",
      "nostalgia"
    ],
    "resumo": "Queria que você estivesse aqui: escolha a expressão pelo sentido e pela situação.",
    "brasil": "Você pode comunicar saudade em inglês escolhendo uma frase sobre de quem ou do que sente falta. Não precisa haver uma palavra única que cubra toda experiência.",
    "equivalentes": [
      {
        "en": "I miss you",
        "pt": "estou com saudade de você",
        "uso": "Para dizer que sente falta de uma pessoa.",
        "exemplo": "I miss you. Can we talk this weekend?",
        "traducao": "Estou com saudade de você. Podemos conversar neste fim de semana?"
      },
      {
        "en": "I miss home",
        "pt": "estou com saudade de casa",
        "uso": "Para sentir falta de casa e do convívio familiar.",
        "exemplo": "I like the trip, but I miss home.",
        "traducao": "Estou gostando da viagem, mas sinto saudade de casa."
      }
    ],
    "cuidado": "Nostalgia costuma envolver lembranças do passado; não substitui toda saudade. Pergunte qual sentimento a pessoa quer expressar.",
    "alternativaNeutra": {
      "en": "I wish you were here.",
      "pt": "Queria que você estivesse aqui"
    },
    "fontes": [
      {
        "titulo": "Priberam: saudade",
        "url": "https://dicionario.priberam.org/saudade"
      },
      {
        "titulo": "Cambridge Dictionary: miss",
        "url": "https://dictionary.cambridge.org/dictionary/english/miss"
      },
      {
        "titulo": "Cambridge Dictionary: nostalgia",
        "url": "https://dictionary.cambridge.org/dictionary/english/nostalgia"
      }
    ]
  },
  {
    "id": "cair-ficha",
    "titulo": "Caiu a ficha! Agora entendi",
    "categoria": "cotidiano",
    "nivel": "B1",
    "regioes": [],
    "contextos": [
      "escola",
      "trabalho",
      "familia"
    ],
    "aliases": [
      "caiu a ficha",
      "cair a ficha",
      "me toquei",
      "me dei conta"
    ],
    "resumo": "Finalmente entendi: escolha a expressão pelo sentido e pela situação.",
    "brasil": "Cair a ficha pode descrever perceber algo depois de um tempo. O inglês pode usar outra imagem ou explicar a percepção.",
    "equivalentes": [
      {
        "en": "it dawned on me",
        "pt": "percebi; me dei conta",
        "uso": "Para uma percepção que se torna clara.",
        "exemplo": "It dawned on me that I had the wrong date.",
        "traducao": "Caiu a ficha de que eu estava com a data errada."
      }
    ],
    "cuidado": "Não traduza ficha por token nessa expressão. Para uma frase direta, diga I finally understood.",
    "alternativaNeutra": {
      "en": "I finally understood.",
      "pt": "Finalmente entendi"
    },
    "fontes": [
      {
        "titulo": "Cambridge Dictionary: dawn on",
        "url": "https://dictionary.cambridge.org/dictionary/english/dawn-on"
      }
    ]
  },
  {
    "id": "custar-caro",
    "titulo": "Custou os olhos da cara!",
    "categoria": "ditados",
    "nivel": "B1",
    "regioes": [],
    "contextos": [
      "servicos",
      "viagem",
      "familia"
    ],
    "aliases": [
      "os olhos da cara",
      "custar caro",
      "custa os olhos",
      "caríssimo"
    ],
    "resumo": "Foi muito caro: escolha a expressão pelo sentido e pela situação.",
    "brasil": "Uma expressão brasileira pode usar olhos e uma inglesa usar braço e perna para dizer que algo custou muito.",
    "equivalentes": [
      {
        "en": "cost an arm and a leg",
        "pt": "custar os olhos da cara; custar muito caro",
        "uso": "Expressão figurada e informal sobre preço alto.",
        "exemplo": "The repair cost an arm and a leg.",
        "traducao": "O conserto custou os olhos da cara."
      }
    ],
    "cuidado": "Não há partes do corpo envolvidas na compra. Em um orçamento ou atendimento, very expensive costuma ser mais claro.",
    "alternativaNeutra": {
      "en": "It was very expensive.",
      "pt": "Foi muito caro"
    },
    "fontes": [
      {
        "titulo": "Cambridge Dictionary: cost an arm and a leg",
        "url": "https://dictionary.cambridge.org/dictionary/english/cost-an-arm-and-a-leg"
      }
    ]
  },
  {
    "id": "pratica",
    "titulo": "A prática leva à perfeição? Um incentivo",
    "categoria": "ditados",
    "nivel": "A2",
    "regioes": [],
    "contextos": [
      "escola",
      "lazer",
      "trabalho"
    ],
    "aliases": [
      "a prática leva à perfeição",
      "praticar",
      "persistência"
    ],
    "resumo": "Praticar nos ajuda a melhorar: escolha a expressão pelo sentido e pela situação.",
    "brasil": "O ditado valoriza praticar com frequência. Pode incentivar a continuar tentando, sem prometer que alguém ficará perfeito.",
    "equivalentes": [
      {
        "en": "practice makes perfect",
        "pt": "a prática leva à perfeição",
        "uso": "Ditado usado para incentivar a prática.",
        "exemplo": "Keep trying. Practice makes perfect!",
        "traducao": "Continue tentando. A prática leva à perfeição!"
      }
    ],
    "cuidado": "É um ditado, não uma garantia de resultado. Para acolher quem está aprendendo, diga que a prática ajuda a melhorar.",
    "alternativaNeutra": {
      "en": "Practice helps us improve.",
      "pt": "Praticar nos ajuda a melhorar"
    },
    "fontes": [
      {
        "titulo": "Cambridge Dictionary: practice makes perfect",
        "url": "https://dictionary.cambridge.org/dictionary/english/practice-makes-perfect"
      }
    ]
  }
];
module.exports = { NOVAS_EXPRESSOES };
