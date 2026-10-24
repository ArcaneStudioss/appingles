'use strict';
// Leituras originais para reconhecer sentido e escolher registro.
const UNIDADES_INGLES = [
  {
    "id": "adolescente-ingles-codigos",
    "faixa": "adolescente",
    "nivel": "B1",
    "colecao": "ingles-real",
    "tema": "Expressões em inglês",
    "titulo": "Números numa conversa: o sentido vem do contexto",
    "imagem": "💬",
    "cultura": [
      "whats-your-20",
      "whats-the-411",
      "back-to-square-one"
    ],
    "vocab": [
      {
        "en": "What's your 20?",
        "pt": "Onde você está?"
      },
      {
        "en": "What's the 411?",
        "pt": "Quais são os detalhes?"
      },
      {
        "en": "back to square one",
        "pt": "de volta à estaca zero"
      },
      {
        "en": "entrance",
        "pt": "entrada"
      }
    ],
    "texto": "Mia and Leo are meeting at a school club. Leo jokes, \"What's your 20?\" Mia knows the radio expression and replies, \"I'm by the entrance.\" Mia asks, \"What's the 411 on the club?\" Leo explains the activities. Their first plan does not work, so they are back to square one. They make a new plan together.",
    "traducao": "Mia e Leo vão se encontrar em um clube da escola. Leo brinca: “Onde você está?” Mia conhece a expressão de rádio e responde: “Estou perto da entrada.” Mia pergunta: “Quais são os detalhes sobre o clube?” Leo explica as atividades. O primeiro plano deles não funciona, então estão de volta à estaca zero. Eles fazem um novo plano juntos.",
    "perguntas": [
      [
        "O que Leo quer saber com “What’s your 20?”?",
        [
          "Onde Mia está",
          "Quantos anos Mia tem",
          "Quanto custa o clube"
        ],
        "A resposta by the entrance indica localização. O código de rádio pergunta onde a pessoa está."
      ],
      [
        "Por que eles estão “back to square one”?",
        [
          "O primeiro plano falhou e precisam recomeçar",
          "Todos esqueceram como falar inglês",
          "Precisam responder uma conta de matemática"
        ],
        "A expressão descreve o recomeço do plano. Não significa que perderam tudo que aprenderam."
      ]
    ],
    "lacuna": {
      "frase": "I'm by the ___.",
      "resposta": [
        "entrance"
      ],
      "explica": "Entrance é entrada. Mia usa um lugar para responder à pergunta sobre localização."
    },
    "explicacao": "Primeiro leia os exemplos. What’s your 20? pede localização; What’s the 411? pede informações. São referências informais associadas aos EUA, e nem todo mundo as usa. Para perguntar de modo neutro, use Where are you? e What should I know about it?"
  },
  {
    "id": "adulto-ingles-impasses",
    "faixa": "adulto",
    "nivel": "B1",
    "colecao": "ingles-real",
    "tema": "Expressões em inglês",
    "titulo": "Catch-22 ou estaca zero?",
    "imagem": "💬",
    "cultura": [
      "catch-22",
      "back-to-square-one",
      "whats-the-411",
      "whats-your-20"
    ],
    "vocab": [
      {
        "en": "a Catch-22",
        "pt": "um impasse com condições que se bloqueiam"
      },
      {
        "en": "back to square one",
        "pt": "de volta à estaca zero"
      },
      {
        "en": "experience",
        "pt": "experiência"
      },
      {
        "en": "requirement",
        "pt": "exigência"
      }
    ],
    "texto": "Rafa needs experience to get a job, but needs a job to get experience. \"It's a Catch-22,\" Rafa says. Later, a friend explains a different problem: \"Our event plan failed. We're back to square one.\" The event team can start again with a new plan. Rafa's problem has requirements that block each other. A colleague asks, \"What's the 411 on the event?\" The friend explains what happened.",
    "traducao": "Rafa precisa de experiência para conseguir um emprego, mas precisa de um emprego para ganhar experiência. “É um impasse circular”, diz Rafa. Depois, uma amiga explica outro problema: “Nosso plano para o evento falhou. Estamos de volta à estaca zero.” A equipe do evento pode recomeçar com um novo plano. O problema de Rafa tem exigências que bloqueiam uma à outra. Um colega pergunta: “Quais são as informações sobre o evento?” A amiga explica o que aconteceu.",
    "perguntas": [
      [
        "Por que o problema de Rafa é um Catch-22?",
        [
          "As exigências de emprego e experiência bloqueiam uma à outra",
          "Toda tarefa demorada é um Catch-22",
          "Rafa precisa completar 22 tarefas"
        ],
        "O sentido ensinado é um impasse circular. A experiência exige emprego e o emprego exige experiência."
      ],
      [
        "Qual frase neutra comunica o problema da equipe do evento?",
        [
          "We have to start again.",
          "We are at address number one.",
          "We have no skills."
        ],
        "Back to square one indica que o plano precisa recomeçar; não avalia a capacidade das pessoas."
      ]
    ],
    "lacuna": {
      "frase": "I need ___ to get a job.",
      "resposta": [
        "experience"
      ],
      "explica": "Experience é experiência. Na história, a exigência faz parte do impasse circular."
    },
    "explicacao": "Compare dois problemas: Catch-22 é um impasse com exigências que se bloqueiam; back to square one é precisar começar de novo. Uma tarefa ser difícil não basta para exemplificar Catch-22. What’s the 411? pede informações; What’s your 20? pede localização."
  },
  {
    "id": "adulto-ingles-aparencia",
    "faixa": "adulto",
    "nivel": "B1",
    "colecao": "ingles-real",
    "tema": "Expressões em inglês",
    "titulo": "Entender uma expressão e escolher como falar",
    "imagem": "💬",
    "cultura": [
      "shes-a-ten"
    ],
    "vocab": [
      {
        "en": "She's a ten",
        "pt": "Ela é muito atraente (avaliação subjetiva)"
      },
      {
        "en": "attractive",
        "pt": "atraente"
      },
      {
        "en": "comment",
        "pt": "comentário"
      },
      {
        "en": "context",
        "pt": "contexto"
      }
    ],
    "texto": "In a film, an adult character says, \"She's a ten.\" Here, ten is a subjective rating of an adult woman's appearance, not her age. Jo asks about the comment. A friend explains, \"It means the speaker finds her very attractive.\" Jo understands the line but does not have to use it. Rating people can make them uncomfortable. Even a neutral comment about appearance needs an appropriate context.",
    "traducao": "Em um filme, uma personagem adulta diz: “Ela é nota dez.” Aqui, dez é uma avaliação subjetiva da aparência de uma mulher adulta, não sua idade. Jo pergunta sobre o comentário. Uma amiga explica: “Isso significa que quem fala a acha muito atraente.” Jo entende a fala, mas não precisa usá-la. Dar notas a pessoas pode deixá-las desconfortáveis. Mesmo um comentário neutro sobre aparência precisa de um contexto apropriado.",
    "perguntas": [
      [
        "Neste diálogo, “She’s a ten” significa o quê?",
        [
          "Quem fala acha a mulher muito atraente",
          "A mulher tem dez anos",
          "A mulher acertou dez exercícios"
        ],
        "A ten é uma avaliação subjetiva de atração neste contexto. Não indica a idade nem a capacidade da pessoa."
      ],
      [
        "O que Jo aprende sobre o uso?",
        [
          "Pode reconhecer a expressão sem dar notas às pessoas",
          "A expressão é adequada em qualquer reunião de trabalho",
          "Toda pessoa gosta de receber uma nota"
        ],
        "Entender uma fala não obriga você a repeti-la. Comentários sobre aparência dependem de contexto e podem constranger."
      ]
    ],
    "lacuna": {
      "frase": "The speaker finds her very ___.",
      "resposta": [
        "attractive"
      ],
      "explica": "Attractive é atraente. A frase descreve a opinião de quem fala, não uma medida objetiva."
    },
    "explicacao": "Reconheça o sentido antes de escolher usar. She’s a ten comenta aparência e pode soar objetificante. She’s attractive é uma alternativa sem nota, mas também exige um contexto apropriado. Este capítulo usa personagens adultos e não pede que você avalie pessoas."
  }
];
module.exports = { UNIDADES_INGLES };
