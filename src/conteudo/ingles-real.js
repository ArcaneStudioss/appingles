'use strict';
// Sentidos e exemplos próprios; fontes e contexto por expressão.
const EXPRESSOES_INGLES = [
  {
    "id": "whats-your-20",
    "titulo": "What’s your 20? Onde você está?",
    "categoria": "ingles-real",
    "nivel": "B1",
    "resumo": "O número indica localização neste código de conversa.",
    "brasil": "A pergunta pode equivaler a onde você está? ou qual é sua localização? Vem do código de rádio 10-20, ligado à localização, e aparece também em diálogos de filmes e brincadeiras com rádio.",
    "registro": "Código de rádio e uso informal: referência associada ao inglês dos EUA",
    "contextos": [
      "amigos",
      "viagem"
    ],
    "equivalentes": [
      {
        "en": "What's your 20?",
        "pt": "Onde você está?",
        "uso": "Reconheça a expressão inteira; 20 não pergunta a idade.",
        "exemplo": "What's your 20? I'm by the entrance.",
        "traducao": "Onde você está? Estou perto da entrada."
      }
    ],
    "alternativaNeutra": {
      "en": "Where are you?",
      "pt": "Onde você está?"
    },
    "cuidado": "Não é uma pergunta universal do cotidiano. Fora de um grupo que conheça o código, Where are you? costuma ser mais claro. Não use gíria de filmes como protocolo de emergência.",
    "fontes": [
      {
        "titulo": "Dictionary.com: What’s your 20?",
        "url": "https://www.dictionary.com/culture/slang/whats-your-20"
      }
    ],
    "aliases": [
      "what's your 20",
      "what’s your 20",
      "your twenty",
      "10-20",
      "localização"
    ],
    "faixas": [
      "adolescente",
      "adulto"
    ]
  },
  {
    "id": "whats-the-411",
    "titulo": "What’s the 411? Me conta o que rolou",
    "categoria": "ingles-real",
    "nivel": "B1",
    "resumo": "411 pode significar informações, novidades ou detalhes.",
    "brasil": "No inglês informal dos EUA, 411 pode representar as informações sobre um assunto. A referência é ao número de assistência telefônica 411. Em português, me conta o que rolou ou quais são os detalhes? podem funcionar melhor que qual é a atualização?, dependendo da conversa.",
    "registro": "Gíria dos EUA: informal, referência cultural que pode soar retrô",
    "contextos": [
      "amigos",
      "redes"
    ],
    "equivalentes": [
      {
        "en": "What's the 411?",
        "pt": "Quais são as novidades ou os detalhes?",
        "uso": "Para pedir informações numa conversa descontraída; não exige que algo tenha mudado.",
        "exemplo": "What's the 411 on the new club?",
        "traducao": "Quais são os detalhes sobre o novo clube?"
      }
    ],
    "alternativaNeutra": {
      "en": "What should I know about it?",
      "pt": "O que devo saber sobre isso?"
    },
    "cuidado": "Não presuma que todo falante reconheça 411. Pode soar retrô ou brincalhão. Em trabalho, prefira pedir a informação específica de que precisa.",
    "fontes": [
      {
        "titulo": "Merriam-Webster: 411",
        "url": "https://www.merriam-webster.com/dictionary/411"
      }
    ],
    "aliases": [
      "what's the 411",
      "what’s the 411",
      "four one one",
      "novidades"
    ],
    "faixas": [
      "adolescente",
      "adulto"
    ]
  },
  {
    "id": "shes-a-ten",
    "titulo": "She’s a 10: atração e contexto",
    "categoria": "ingles-real",
    "nivel": "B1",
    "resumo": "A ten pode avaliar alguém como muito atraente.",
    "brasil": "Ao comentar a aparência de uma pessoa adulta, she’s a ten pode corresponder a ela é muito atraente ou ela é nota dez. A nota representa uma avaliação subjetiva de atração, não a idade, o valor ou a capacidade da pessoa.",
    "registro": "Gíria e julgamento de aparência: conversa informal entre adultos",
    "contextos": [
      "amigos",
      "redes"
    ],
    "equivalentes": [
      {
        "en": "She's a ten",
        "pt": "Ela é muito atraente (avaliação subjetiva)",
        "uso": "Conteúdo para reconhecer a expressão em conversas e mídia, sem incentivar avaliações de pessoas.",
        "exemplo": "In the film, an adult character says, \"She's a ten.\"",
        "traducao": "No filme, uma personagem adulta diz: “Ela é muito atraente.”"
      }
    ],
    "alternativaNeutra": {
      "en": "She's attractive.",
      "pt": "Ela é atraente."
    },
    "cuidado": "Dar notas à aparência pode constranger e soar objetificante. A alternativa neutra também é um comentário sobre aparência: observe consentimento e contexto, especialmente no trabalho. He’s a ten também existe; a nota não define a pessoa.",
    "fontes": [
      {
        "titulo": "Merriam-Webster: ten, sentido de pessoa atraente",
        "url": "https://www.merriam-webster.com/dictionary/ten"
      }
    ],
    "aliases": [
      "she's a 10",
      "she's a ten",
      "she’s a 10",
      "he's a ten",
      "atraente",
      "nota dez"
    ],
    "faixas": [
      "adulto"
    ]
  },
  {
    "id": "catch-22",
    "titulo": "Catch-22: um impasse circular",
    "categoria": "ingles-real",
    "nivel": "B1",
    "resumo": "Uma condição impede justamente o que seria necessário para atendê-la.",
    "brasil": "O sentido central é um impasse com condições que se bloqueiam. Por exemplo: precisar de experiência para conseguir um emprego, mas precisar de um emprego para ganhar experiência. Não é apenas qualquer problema difícil.",
    "registro": "Expressão idiomática: conversas, notícias e situações de trabalho",
    "contextos": [
      "escola",
      "trabalho",
      "comunidade"
    ],
    "equivalentes": [
      {
        "en": "a Catch-22",
        "pt": "um impasse com condições que se bloqueiam",
        "uso": "Use quando as condições formam um círculo que impede a saída.",
        "exemplo": "I need experience to get a job, but I need a job to get experience. It's a Catch-22.",
        "traducao": "Preciso de experiência para conseguir um emprego, mas preciso de um emprego para ganhar experiência. É um impasse circular."
      }
    ],
    "alternativaNeutra": {
      "en": "Each requirement prevents me from meeting the other.",
      "pt": "Cada exigência me impede de cumprir a outra."
    },
    "cuidado": "Uma tarefa trabalhosa, por si só, não exemplifica esse sentido. A expressão vem do título do romance de Joseph Heller; o número não indica uma regra matemática.",
    "fontes": [
      {
        "titulo": "Merriam-Webster: Catch-22",
        "url": "https://www.merriam-webster.com/dictionary/catch-22"
      }
    ],
    "aliases": [
      "catch 22",
      "catch-22",
      "catch twenty two",
      "impasse"
    ],
    "faixas": [
      "adolescente",
      "adulto"
    ]
  },
  {
    "id": "back-to-square-one",
    "titulo": "Back to square one: de volta à estaca zero",
    "categoria": "ingles-real",
    "nivel": "B1",
    "resumo": "Voltar ao começo depois de uma tentativa que não funcionou.",
    "brasil": "De volta à estaca zero é uma equivalência natural para uma situação em que um plano falhou e precisa recomeçar. Square one não é um endereço nem um quadrado que precise ser traduzido palavra por palavra.",
    "registro": "Expressão idiomática: cotidiano, projetos e trabalho",
    "contextos": [
      "escola",
      "jogos",
      "trabalho"
    ],
    "equivalentes": [
      {
        "en": "back to square one",
        "pt": "de volta à estaca zero",
        "uso": "Para um recomeço após uma tentativa que falhou.",
        "exemplo": "Our plan didn't work. We're back to square one.",
        "traducao": "Nosso plano não funcionou. Estamos de volta à estaca zero."
      }
    ],
    "alternativaNeutra": {
      "en": "We have to start again.",
      "pt": "Temos que começar de novo."
    },
    "cuidado": "Não significa que a pessoa perdeu toda a capacidade ou que nada aprendeu. A expressão descreve o estado do plano ou da tentativa.",
    "fontes": [
      {
        "titulo": "Cambridge Dictionary: back to square one",
        "url": "https://dictionary.cambridge.org/dictionary/english/back-to-square-one"
      }
    ],
    "aliases": [
      "back to square 1",
      "back to square one",
      "estaca zero"
    ],
    "faixas": [
      "adolescente",
      "adulto"
    ]
  }
];
module.exports = { EXPRESSOES_INGLES };
