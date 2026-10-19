'use strict';
// Missões extras (19/10/2026): telefone e videochamada, e small talk. Mesmo formato de missoes.js.

const MISSOES_EXTRA = [
  {
    id: 'telefone',
    titulo: 'Telefone e videochamada',
    podeFazer: 'Consigo atender, pedir para falar com alguém, combinar um horário e resolver problemas de áudio.',
    nivel: 'A2',
    tags: ['preposicoes', 'perguntas-do'],
    vocab: [
      { en: 'this is... speaking', pt: 'aqui é... falando', ex: 'Hello, this is Ana speaking.' },
      { en: 'Can I speak to...?', pt: 'Posso falar com...?', ex: 'Can I speak to Mr. Davis, please?' },
      { en: 'Could you hold, please?', pt: 'Pode aguardar na linha?', ex: 'Could you hold, please? I will check.' },
      { en: "I'll call you back.", pt: 'Eu te ligo de volta.', ex: "I'll call you back in ten minutes." },
      { en: "You're on mute.", pt: 'Seu microfone está desligado.', ex: "Sorry, you're on mute. We can't hear you." },
      { en: 'Let me share my screen.', pt: 'Deixa eu compartilhar a tela.', ex: 'Let me share my screen and show you the numbers.' },
    ],
    explicacao: {
      titulo: 'Ao telefone, as frases são fixas e curtas',
      texto: 'Quem atende diz "This is [nome]", e não "I am". Para pedir alguém: "Can I speak to...?". Para marcar horário, lembre das preposições: "on Monday", "at 3 p.m.", "in the morning". Se o áudio falhar, não tenha vergonha: "Could you repeat that, please?" é normal até entre nativos.',
      estrutura: ['Hello, this is [nome].', 'Can I speak to [pessoa], please?', "I'm calling to [motivo].", 'Are you available on [dia] at [hora]?'],
    },
    exemplos: [
      { en: 'Good morning, this is Paula from Brazil. Can I speak to Mr. Johnson, please?', pt: 'Bom dia, aqui é a Paula, do Brasil. Posso falar com o Sr. Johnson?' },
      { en: "I'm calling to schedule a meeting about the new project.", pt: 'Estou ligando para marcar uma reunião sobre o projeto novo.' },
      { en: 'Are you available on Tuesday at 3 p.m.?', pt: 'Você está disponível na terça às 15h?' },
      { en: "Sorry, I think you're on mute.", pt: 'Desculpe, acho que seu microfone está desligado.' },
    ],
    exercicios: [
      { id: 'telefone-1', tipo: 'escolha', habilidade: 'vocabulario', dif: 1, enunciado: 'Como atender uma ligação dizendo seu nome?', opcoes: ['Hello, this is Ana speaking.', 'Hello, I am Ana.', 'Hello, here is Ana.'], resposta: 0, explica: 'Ao telefone o inglês usa "This is..." para dizer quem fala.' },
      { id: 'telefone-2', tipo: 'lacuna', habilidade: 'vocabulario', dif: 1, frase: 'Can I ___ to Mr. Davis, please?', resposta: ['speak'], explica: 'Can I speak to + pessoa é o jeito padrão de pedir alguém.' },
      { id: 'telefone-3', tipo: 'lacuna', habilidade: 'gramatica', tag: 'preposicoes', dif: 2, frase: "Let's talk ___ Monday at 3 p.m.", resposta: ['on'], explica: 'Dia da semana leva "on"; hora leva "at".' },
      { id: 'telefone-4', tipo: 'escuta', habilidade: 'escuta', dif: 2, audio: "Sorry, I can't hear you. I think you're on mute.", pergunta: 'Qual é o problema?', opcoes: ['O microfone de quem fala está desligado', 'A internet caiu', 'A pessoa está falando baixo'], resposta: 0, explica: '"On mute" é o microfone silenciado.' },
      { id: 'telefone-5', tipo: 'escuta', habilidade: 'escuta', dif: 3, audio: "Could you hold for a moment? I'll check if he is available.", pergunta: 'O que a pessoa pede?', opcoes: ['Que você espere na linha um instante', 'Que você ligue de novo mais tarde', 'Que você deixe um recado'], resposta: 0, explica: '"Hold" é esperar na linha.' },
      { id: 'telefone-6', tipo: 'traduzir', habilidade: 'escrita', dif: 2, pt: 'Posso falar com a Sarah, por favor?', aceitas: ['Can I speak to Sarah, please', 'Could I speak to Sarah, please', 'Can I speak with Sarah, please', 'May I speak to Sarah, please', 'Could I speak with Sarah, please', 'May I speak with Sarah, please'], explica: 'Can/Could/May I speak to + nome, please.' },
      { id: 'telefone-7', tipo: 'ordenar', habilidade: 'gramatica', dif: 2, palavras: ['Could', 'you', 'repeat', 'that', 'please'], resposta: 'Could you repeat that please', explica: 'Could you + verbo base é um pedido educado.' },
      { id: 'telefone-8', tipo: 'ditado', habilidade: 'escuta', dif: 2, audio: "I'll call you back in ten minutes.", resposta: ["I'll call you back in ten minutes", 'I will call you back in ten minutes'], explica: '"Call back" é ligar de volta.' },
    ],
    tarefa: {
      enunciado: 'Você liga para uma empresa estrangeira para marcar uma reunião. Escreva o que diria: quem é você, com quem quer falar e um horário.',
      minPalavras: 25,
      elementos: [
        { nome: 'quem você é', padroes: ['\\bthis is\\b', '\\bmy name is\\b'] },
        { nome: 'com quem quer falar', padroes: ['\\bcan i speak\\b', '\\bcould i speak\\b', '\\bmay i speak\\b', "\\bi'?d like to speak\\b", "\\bi'?m calling (?:to|for)\\b"] },
        { nome: 'um horário', padroes: ['\\b(?:on|at) (?:monday|tuesday|wednesday|thursday|friday)\\b', '\\bat \\d', "\\bo'clock\\b", '\\btomorrow\\b', '\\bnext week\\b'] },
      ],
      tagsChave: ['preposicoes'],
      dicas: ['Hello, this is ...', 'Could I speak to ..., please?', "I'm calling to ...", 'Are you available on ... at ...?'],
      modelo: "Hello, this is Paula from Brazil. Could I speak to Mr. Johnson, please? I'm calling to schedule a meeting about the new project. Are you available on Tuesday at 3 p.m.? If not, I can call you back tomorrow morning.",
    },
    reteste: [
      'Você está numa videochamada e ninguém ouve você. Explique o problema e peça para tentarem de novo.',
      'Alguém atende e diz que a pessoa que você procura saiu. Peça para deixar um recado e diga quando liga de volta.',
    ],
    conversa: 'telefone',
  },
  {
    id: 'small-talk',
    titulo: 'Conversa leve (small talk)',
    podeFazer: 'Consigo puxar assunto, responder com um detalhe e devolver a pergunta.',
    nivel: 'A2',
    tags: ['perguntas-do', 'terceira-pessoa'],
    vocab: [
      { en: "How's it going?", pt: 'Como vai?', ex: "Hi Alex! How's it going?" },
      { en: 'Not bad, thanks.', pt: 'Nada mal, obrigado.', ex: 'Not bad, thanks. A bit busy, but good.' },
      { en: 'How about you?', pt: 'E você?', ex: 'I went to the beach. How about you?' },
      { en: 'By the way...', pt: 'A propósito...', ex: 'By the way, did you see the game last night?' },
      { en: 'That sounds great!', pt: 'Parece ótimo!', ex: 'A trip to Salvador? That sounds great!' },
      { en: "I'd better get going.", pt: 'Já vou indo.', ex: "I'd better get going. I have a call at ten." },
    ],
    explicacao: {
      titulo: 'Pergunta, resposta com detalhe e devolve',
      texto: 'Small talk é conversa leve, e a regra é simples: responda com um detalhe (não só "fine") e devolva a pergunta com "How about you?". Para o passado, lembre do "did": "Did you do anything fun?". E reaja ao que ouviu: "Oh, really?", "That sounds nice!".',
      estrutura: ["How's it going?", 'Pretty good, thanks. [um detalhe]', 'How about you?', 'That sounds great!'],
    },
    exemplos: [
      { en: "Hi, how's it going? Did you do anything fun this weekend?", pt: 'Oi, como vai? Fez algo legal no fim de semana?' },
      { en: 'I went to the beach with my family. How about you?', pt: 'Fui à praia com minha família. E você?' },
      { en: 'Oh, really? That sounds nice!', pt: 'Ah, é? Parece legal!' },
      { en: "Nice weather today, isn't it?", pt: 'Tempo bom hoje, né?' },
    ],
    exercicios: [
      { id: 'small-talk-1', tipo: 'escolha', habilidade: 'vocabulario', dif: 1, enunciado: 'Alguém pergunta "How\'s it going?". Qual é a melhor resposta?', opcoes: ['Pretty good, thanks. How about you?', 'I am going to home.', 'It is going to the street.'], resposta: 0, explica: 'Responda bem e devolva a pergunta.' },
      { id: 'small-talk-2', tipo: 'lacuna', habilidade: 'vocabulario', dif: 1, frase: 'Not bad, thanks. And ___?', resposta: ['you'], explica: '"And you?" devolve a pergunta.' },
      { id: 'small-talk-3', tipo: 'lacuna', habilidade: 'gramatica', tag: 'perguntas-do', dif: 2, frase: '___ you do anything fun this weekend?', resposta: ['Did'], explica: 'Pergunta no passado usa "Did" + verbo base.' },
      { id: 'small-talk-4', tipo: 'escuta', habilidade: 'escuta', dif: 2, audio: "Nice weather today, isn't it? I hope it stays sunny for the weekend.", pergunta: 'Sobre o que a pessoa está falando?', opcoes: ['O tempo', 'O trânsito', 'A reunião'], resposta: 0, explica: '"Weather" é o tempo (clima).' },
      { id: 'small-talk-5', tipo: 'escuta', habilidade: 'escuta', dif: 3, audio: "I'd better get going. I have a call at ten, but it was great talking to you.", pergunta: 'Por que a pessoa está saindo?', opcoes: ['Tem uma ligação às dez', 'Está atrasada para o almoço', 'Não gostou da conversa'], resposta: 0, explica: '"I have a call at ten" é o motivo.' },
      { id: 'small-talk-6', tipo: 'traduzir', habilidade: 'escrita', dif: 2, pt: 'Como foi seu fim de semana?', aceitas: ['How was your weekend', 'How was the weekend'], explica: 'How was your weekend? é a pergunta clássica de segunda-feira.' },
      { id: 'small-talk-7', tipo: 'ordenar', habilidade: 'gramatica', dif: 2, palavras: ['That', 'sounds', 'like', 'a', 'great', 'plan'], resposta: 'That sounds like a great plan', explica: '"Sounds like" reage a uma ideia ou plano.' },
      { id: 'small-talk-8', tipo: 'ditado', habilidade: 'escuta', dif: 3, audio: 'By the way, did you see the game last night?', resposta: ['By the way, did you see the game last night', 'By the way did you see the game last night'], sufixo: '?', explica: '"By the way" muda de assunto com leveza.' },
    ],
    tarefa: {
      enunciado: 'Você encontra um colega novo na copa antes de uma reunião. Escreva uma conversa curta: cumprimente, pergunte do fim de semana e reaja à resposta.',
      minPalavras: 25,
      elementos: [
        { nome: 'cumprimento', padroes: ['\\bhi\\b', '\\bhello\\b', '\\bgood morning\\b', "\\bhow'?s it going\\b", '\\bhow are you\\b'] },
        { nome: 'pergunta sobre o fim de semana', padroes: ['\\bhow was your\\b', '\\bdid you\\b', '\\bwhat did you do\\b', '\\bhow about you\\b', '\\bwhat about you\\b'] },
        { nome: 'uma reação', padroes: ['\\bthat sounds\\b', '\\bnice\\b', '\\bgreat\\b', '\\bwow\\b', '\\breally\\b', '\\bcool\\b'] },
      ],
      tagsChave: ['perguntas-do'],
      dicas: ["Hi, how's it going?", 'Did you do anything fun this weekend?', 'How about you?', 'That sounds nice!'],
      modelo: "Hi, how's it going? Did you do anything fun this weekend? I went to the beach with my family, and it was great. How about you? Oh, really? That sounds nice. By the way, are you ready for the meeting?",
    },
    reteste: [
      'Você está no elevador com o diretor da empresa por 20 segundos. Puxe um assunto leve.',
      'Um colega conta que viajou no fim de semana. Reaja, faça uma pergunta e conte algo seu.',
    ],
    conversa: 'small-talk',
  },
];

module.exports = { MISSOES_EXTRA };
