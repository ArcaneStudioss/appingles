'use strict';
// Catálogo de dificuldades frequentes de quem fala português ao aprender inglês.
// "Frequente" não é "garantido": o motor só trata uma dificuldade como do aluno depois de vê-la nas respostas dele.
// Cada item traz: explicação curta, contraste com o português, várias abordagens (para quando a primeira não funciona),
// detectores (regex sobre o texto do aluno, usados sem IA) e exercícios focados.
//
// Detectores são conservadores: preferimos deixar passar um erro a acusar um acerto.
// Os de confiança 'baixa' viram pergunta ("se você quis dizer X...") e nunca contam como erro no modelo do aluno.

const NUM = '(?:\\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty|thirty|forty|fifty|sixty)';

const DIFICULDADES = [
  {
    tag: 'idade-have',
    nome: 'Dizer a idade (be, não have)',
    habilidade: 'gramatica',
    regra: 'Em inglês a idade usa o verbo "to be": a pessoa "é" 25 anos, não "tem".',
    contraste: { pt: 'Eu tenho 25 anos.', en: "I'm 25. / I'm 25 years old.", nota: '"I have 25 years" soa como "eu possuo 25 anos".' },
    abordagens: {
      regra: 'Idade = be + número. "I am 30", "She is 12", "How old are you?".',
      exemplos: ["I'm 28.", "My son is six years old.", 'How old is your manager?', "I'm 40, and I have 15 years of experience."],
      escuta: "Ouça e repare no verbo: \"I'm thirty-two.\"",
    },
    detectores: [
      { re: new RegExp(`\\bi have ${NUM} years(?: old)?\\b(?! of\\b| in\\b| working\\b| experience\\b| as\\b| at\\b)`, 'i'), sugestao: "I'm ... (years old)", confianca: 'alta' },
      { re: new RegExp(`\\b(?:he|she) has ${NUM} years(?: old)?\\b(?! of\\b| in\\b| working\\b| experience\\b)`, 'i'), sugestao: "He's / She's ... (years old)", confianca: 'alta' },
    ],
    exercicios: [
      { tipo: 'escolha', enunciado: 'Como dizer "Eu tenho 30 anos"?', opcoes: ["I'm 30 years old.", 'I have 30 years.', 'I have 30 years old.'], resposta: 0 },
      { tipo: 'lacuna', frase: 'My sister ___ 19 years old.', resposta: ['is', "'s"], dica: 'verbo "to be"' },
      { tipo: 'traduzir', pt: 'Eu tenho 27 anos e tenho 5 anos de experiência.', aceitas: ["I'm 27 and I have 5 years of experience", 'I am 27 and I have 5 years of experience', "I'm 27 years old and I have 5 years of experience", 'I am 27 years old and I have 5 years of experience', "I'm 27 and I have five years of experience", 'I am 27 and I have five years of experience'] },
    ],
  },
  {
    tag: 'tempo-desde',
    nome: 'Falar há quanto tempo (since/for)',
    habilidade: 'gramatica',
    regra: 'Para algo que começou no passado e continua até hoje, o inglês usa present perfect: "I have worked here since 2021" ou "I\'ve been working here for three years".',
    contraste: { pt: 'Trabalho aqui desde 2021. / Trabalho aqui há 3 anos.', en: "I've worked here since 2021. / I've been working here for three years.", nota: 'O português usa o presente; o inglês, não. "Since" vem com o ponto de partida (2021, January); "for", com a duração (3 years).' },
    abordagens: {
      regra: 'Começou no passado + continua agora = have + particípio (I have worked) ou have been + -ing (I have been working). Since + início; for + duração.',
      exemplos: ["I've lived in Curitiba since 2019.", "She's been working remotely for two years.", 'How long have you worked there?', "We've known each other since college."],
      escuta: "Ouça o \"'ve\" quase escondido: \"I've been working here for three years.\"",
      contraste: 'Compare: "I work here" (fato atual) x "I\'ve worked here for 3 years" (desde quando). Em entrevista, a segunda é a que responde "há quanto tempo?".',
    },
    detectores: [
      { re: /\bi(?:'m| am)? (?:work|working|live|living|study|studying) (?:here |there |at [a-z]+ |in [a-z]+ |as an? [a-z]+ )?(?:since\b|for (?:\d+|one|two|three|four|five|six|seven|eight|nine|ten|many|a few) (?:years?|months?|weeks?))/i, sugestao: "I've worked / I've been working ... since/for ...", confianca: 'alta' },
      { re: /\bsince (?:\d+|one|two|three|four|five|six|seven|eight|nine|ten) (?:years?|months?|weeks?|days?)\b/i, sugestao: 'for ... years (since é para o ponto de início)', confianca: 'alta' },
    ],
    exercicios: [
      { tipo: 'escolha', enunciado: '"Trabalho nessa empresa há 4 anos."', opcoes: ["I've worked at this company for four years.", 'I work at this company since four years.', 'I am working at this company for four years.'], resposta: 0 },
      { tipo: 'lacuna', frase: "I've been studying English ___ January.", resposta: ['since'], dica: 'ponto de início' },
      { tipo: 'lacuna', frase: "She's lived in Lisbon ___ six months.", resposta: ['for'], dica: 'duração' },
      { tipo: 'ordenar', palavras: ['I', 'have', 'been', 'working', 'here', 'for', 'two', 'years'], resposta: 'I have been working here for two years' },
    ],
  },
  {
    tag: 'concordar',
    nome: 'Concordar: I agree, sem am',
    habilidade: 'gramatica',
    regra: '"Agree" já é verbo: "I agree", "I don\'t agree". Não leva "am".',
    contraste: { pt: 'Eu concordo. / Estou de acordo.', en: "I agree. / I don't agree.", nota: '"I am agree" vem do "estou de acordo".' },
    abordagens: {
      regra: 'Agree funciona como "like" ou "think": I agree, she agrees, do you agree?',
      exemplos: ['I agree with you.', "I don't agree with that idea.", 'Do you agree?', 'I partly agree, but I think we need more data.'],
      escuta: 'Ouça: "I totally agree."',
    },
    detectores: [
      { re: /\b(?:i|we|they|you)(?:'m|'re| am| are) (?:totally |completely |not )?(?:agree|disagree)\b/i, sugestao: 'I agree / I disagree', confianca: 'alta' },
      { re: /\b(?:he|she)(?:'s| is) (?:not )?(?:agree|disagree)\b/i, sugestao: 'He agrees / She disagrees', confianca: 'alta' },
    ],
    exercicios: [
      { tipo: 'escolha', enunciado: 'Na reunião, você quer dizer que concorda.', opcoes: ['I agree with you.', 'I am agree with you.', 'I am agreeing with you.'], resposta: 0 },
      { tipo: 'lacuna', frase: "I ___ agree with that. It's too risky.", resposta: ["don't", 'do not'], dica: 'negativa' },
      { tipo: 'traduzir', pt: 'Eu concordo em parte.', aceitas: ['I partly agree', 'I agree in part', 'I partially agree', 'I agree to some extent', 'I agree up to a point'] },
    ],
  },
  {
    tag: 'terceira-pessoa',
    nome: 'O "s" de he/she/it no presente',
    habilidade: 'gramatica',
    regra: 'No presente, com he, she, it (ou um nome no singular), o verbo ganha -s: she works, he has, it doesn\'t.',
    contraste: { pt: 'Ela trabalha. Ele não gosta.', en: "She works. He doesn't like it.", nota: 'No português o verbo muda para todo mundo; no inglês, só nessa pessoa. Por isso é fácil esquecer.' },
    abordagens: {
      regra: 'he/she/it + verbo + s. Negativa e pergunta: doesn\'t / does + verbo sem s (she doesn\'t work, does he like?).',
      exemplos: ['My manager works from home on Fridays.', 'She has two kids.', "He doesn't speak Spanish.", 'Does the hotel have parking?'],
      escuta: 'Ouça o "s" no fim: "She works in sales."',
      contraste: 'Leia em voz alta, exagerando o -s: I work / you work / she workSSS. O ouvido acostuma.',
    },
    detectores: [
      { re: /\b(?:he|she|it) (?:work|have|do|go|like|need|want|live|study|make|know|think|speak|use|help|manage|lead)\b(?! to\b)/i, sugestao: 'he/she/it + verbo com -s (works, has, does...)', confianca: 'media', excecao: /\b(?:can|will|would|should|could|must|might|may|did|does|to|let|make|help|see|watch|hear)\s+(?:he|she|it)\b|\b(?:does|did|doesn't|didn't|can|will|would|should|could)\b[^.?!]{0,20}\b(?:he|she|it) \w+\b/i },
      { re: /\b(?:he|she|it) don't\b/i, sugestao: "doesn't", confianca: 'alta' },
      { re: /\b(?:my|our|the) (?:boss|manager|company|wife|husband|brother|sister|mother|father|friend|son|daughter) (?:work|have|live|like|need|want)\b/i, sugestao: 'verbo com -s (works, has, lives...)', confianca: 'media' },
    ],
    exercicios: [
      { tipo: 'escolha', enunciado: 'Complete: "My team leader ___ in São Paulo."', opcoes: ['lives', 'live', 'living'], resposta: 0 },
      { tipo: 'lacuna', frase: 'She ___ (not / like) long meetings.', resposta: ["doesn't like", 'does not like'], dica: "doesn't + verbo" },
      { tipo: 'lacuna', frase: 'The company ___ (have) offices in three countries.', resposta: ['has'], dica: 'have vira has' },
      { tipo: 'traduzir', pt: 'Meu chefe trabalha de casa às sextas.', aceitas: ['My boss works from home on Fridays', 'My manager works from home on Fridays', 'My boss works at home on Fridays'] },
    ],
  },
  {
    tag: 'perguntas-do',
    nome: 'Perguntas com do/does/did',
    habilidade: 'gramatica',
    regra: 'Pergunta no presente e no passado precisa de auxiliar: Do you work...? Where did you go? Depois do "did", o verbo volta à forma base (go, não went).',
    contraste: { pt: 'Onde você foi? Você trabalha aqui?', en: 'Where did you go? Do you work here?', nota: 'No português a pergunta é a frase com entonação; no inglês entra o auxiliar.' },
    abordagens: {
      regra: '(palavra de pergunta) + do/does/did + pessoa + verbo base. "Did" já carrega o passado: did you go, did she see.',
      exemplos: ['Where did you go last weekend?', 'What do you do?', 'Did you finish the report?', 'How long did the project take?'],
      escuta: 'Ouça como "did you" vira quase "didja": "Where did you go?"',
      contraste: 'Monte em 3 peças: [Where] + [did you] + [go]. O passado mora no "did", não no verbo.',
    },
    detectores: [
      { re: /\bdid (?:you|he|she|they|we|i|it) (?:went|saw|did|made|had|took|came|got|bought|ate|was|were|met|spent|left|told|said|found|gave|knew|thought|wrote|spoke|worked|liked|wanted|finished|started|studied|played|visited|stayed|traveled|travelled)\b/i, sugestao: 'did + verbo na forma base (did you go, did she see...)', confianca: 'alta' },
      { re: /(?:^|[.!?]\s+)(?:where|what|when|why|how|who) (?:you|they|we) (?:went|go|did|do|like|work|live|saw|see|want|think)\b[^.!?]*\?/i, sugestao: 'Where did you go? / What do you do?', confianca: 'alta' },
      { re: /(?:^|[.!?]\s+)(?:where|what|when|why|how) (?:he|she) (?:went|goes|go|did|does|likes|works|lives)\b[^.!?]*\?/i, sugestao: 'Where did she go? / What does he do?', confianca: 'alta' },
    ],
    exercicios: [
      { tipo: 'escolha', enunciado: 'Como perguntar "O que você fez no fim de semana?"', opcoes: ['What did you do on the weekend?', 'What you did on the weekend?', 'What did you did on the weekend?'], resposta: 0 },
      { tipo: 'lacuna', frase: 'Where ___ you study?', resposta: ['did', 'do'], dica: 'auxiliar' },
      { tipo: 'ordenar', palavras: ['How', 'long', 'did', 'the', 'project', 'take'], resposta: 'How long did the project take', sufixo: '?' },
      { tipo: 'traduzir', pt: 'Você terminou o relatório?', aceitas: ['Did you finish the report', 'Have you finished the report'], sufixo: '?' },
    ],
  },
  {
    tag: 'passado-irregular',
    nome: 'Passado dos verbos irregulares',
    habilidade: 'gramatica',
    regra: 'Para contar o que aconteceu, o verbo vai para o passado. Os mais usados são irregulares: go → went, have → had, do → did, see → saw, make → made, take → took.',
    contraste: { pt: 'Ontem eu fui ao cinema.', en: 'Yesterday I went to the movies.', nota: 'Erros comuns: usar o presente ("yesterday I go") ou criar formas como "goed" e "buyed".' },
    abordagens: {
      regra: 'Marcou tempo passado (yesterday, last week, ago)? Verbo no passado. Decore os 15 irregulares mais usados primeiro; eles cobrem quase tudo numa conversa.',
      exemplos: ['Last weekend I went to the beach.', 'We had a long meeting yesterday.', 'I took the bus because it was raining.', 'She made a great presentation.'],
      escuta: 'Ouça uma pequena história no passado e marque os verbos: went, had, saw, took.',
      contraste: 'Treine em pares, em voz alta: go/went, have/had, do/did, see/saw, make/made, take/took, get/got, come/came, buy/bought, eat/ate.',
    },
    detectores: [
      { re: /\b(?:yesterday|last (?:week|weekend|night|month|year|monday|tuesday|wednesday|thursday|friday|saturday|sunday)|\w+ (?:days?|weeks?|years?) ago)\b[^.!?]{0,40}\b(?:i|we|they) (?:go|eat|see|have|do|make|take|buy|meet|come|get|spend|stay|watch|visit|play|work)\b/i, sugestao: 'verbo no passado (went, ate, saw, had, did...)', confianca: 'media' },
      { re: /\b(?:i|we|they) (?:go|eat|see|have|do|make|take|buy|meet|come|get|spend|stay|watch|visit|play|work)\b[^.!?]{0,40}\b(?:yesterday|last (?:week|weekend|night|month|year))\b/i, sugestao: 'verbo no passado (went, ate, saw, had, did...)', confianca: 'media' },
      { re: /\b(?:goed|buyed|eated|maked|teached|thinked|catched|bringed|speaked|writed|drinked|taked|seed|gived|comed|getted|meeted|spended|leaved|feeled|sleeped)\b/i, sugestao: 'forma irregular (went, bought, ate, made, taught...)', confianca: 'alta' },
    ],
    exercicios: [
      { tipo: 'escolha', enunciado: '"Ontem nós tivemos uma reunião longa."', opcoes: ['Yesterday we had a long meeting.', 'Yesterday we have a long meeting.', 'Yesterday we haved a long meeting.'], resposta: 0 },
      { tipo: 'lacuna', frase: 'Last Saturday I ___ (go) to my cousin\'s wedding.', resposta: ['went'] },
      { tipo: 'lacuna', frase: 'We ___ (take) a taxi to the airport.', resposta: ['took'] },
      { tipo: 'traduzir', pt: 'Eu comprei um livro e li no fim de semana.', aceitas: ['I bought a book and read it on the weekend', 'I bought a book and read it over the weekend', 'I bought a book and I read it on the weekend', 'I bought a book and read it at the weekend'] },
    ],
  },
  {
    tag: 'sujeito-oculto',
    nome: 'Frase sem sujeito (It is, There is)',
    habilidade: 'gramatica',
    regra: 'Em inglês toda frase precisa de sujeito. Quando não há um, usa-se "it" (It is important) ou "there" (There are many people).',
    contraste: { pt: 'É importante. Tem muita gente aqui.', en: "It's important. There are a lot of people here.", nota: 'O português permite tirar o sujeito; o inglês não.' },
    abordagens: {
      regra: '"É + adjetivo" → It is... "Tem/há + coisa" (existir) → There is (singular) / There are (plural).',
      exemplos: ["It's important to test everything.", "It's very hot today.", 'There are three people on my team.', 'There is a problem with my order.'],
      escuta: 'Ouça o "it\'s" no começo: "It\'s a good question."',
    },
    detectores: [
      { re: /(?:^|[.!?]\s+)(?:is|was) (?:very |so |really |too |a bit )?(?:important|good|nice|difficult|hard|easy|necessary|possible|impossible|cold|hot|great|interesting|expensive|cheap|better|true)\b/i, sugestao: "It's ... / It was ...", confianca: 'alta' },
      { re: /(?:^|[.!?,]\s*)(?:have|has|had) (?:a lot of|lots of|many|much|some|no|\d+|two|three|four|five) (?:people|problems?|options?|things?|places?|restaurants?|bugs?|tasks?|meetings?)\b/i, sugestao: 'There is / There are ...', confianca: 'media' },
    ],
    exercicios: [
      { tipo: 'escolha', enunciado: '"É importante chegar cedo."', opcoes: ["It's important to arrive early.", 'Is important to arrive early.', 'Important arrive early.'], resposta: 0 },
      { tipo: 'lacuna', frase: '___ are five people in my department.', resposta: ['There'], dica: 'existir' },
      { tipo: 'traduzir', pt: 'Tem um problema com o meu pedido.', aceitas: ["There's a problem with my order", 'There is a problem with my order', 'There is an issue with my order', "There's an issue with my order"] },
    ],
  },
  {
    tag: 'explicar-para',
    nome: 'Explain to me e tell me',
    habilidade: 'gramatica',
    regra: '"Explain" e "say" não recebem a pessoa direto: explain TO me, say TO me. Para "me diga", use "tell me".',
    contraste: { pt: 'Me explica isso? Me diga o horário.', en: 'Can you explain this to me? Tell me the time.', nota: 'Tell me / ask me / show me: ok. Explain me / say me: não.' },
    abordagens: {
      regra: 'tell/show/ask/give + pessoa. explain/say + (algo) + to + pessoa.',
      exemplos: ['Could you explain that to me again?', 'Can you tell me more about the role?', 'She said to me that the meeting was cancelled.', 'Let me explain how it works.'],
      escuta: 'Ouça: "Could you explain that to me?"',
    },
    detectores: [
      { re: /\bexplain (?:me|him|her|us|them)\b/i, sugestao: 'explain (it) to me / tell me', confianca: 'alta' },
      { re: /\bsay (?:me|him|her|us|them)\b/i, sugestao: 'tell me / say to me', confianca: 'alta' },
    ],
    exercicios: [
      { tipo: 'escolha', enunciado: 'Você quer que o entrevistador explique a vaga.', opcoes: ['Could you explain the role to me?', 'Could you explain me the role?', 'Could you say me the role?'], resposta: 0 },
      { tipo: 'lacuna', frase: 'Can you ___ me more about the team?', resposta: ['tell'], dica: 'me diga' },
    ],
  },
  {
    tag: 'preposicoes',
    nome: 'Preposições que não seguem o português',
    habilidade: 'vocabulario',
    regra: 'Algumas combinações mudam: depend ON (não of), married TO, ON Monday, AT night, discuss (sem about), think ABOUT.',
    contraste: { pt: 'Depende de você. Na segunda-feira. Discutir sobre o plano.', en: 'It depends on you. On Monday. Discuss the plan.', nota: 'Aprenda a dupla inteira (depend on), não a palavra solta.' },
    abordagens: {
      regra: 'Dias: on (on Friday). Horas: at (at 9). Meses/anos: in (in May). Verbos: depend on, focus on, interested in, good at, married to, discuss + coisa.',
      exemplos: ['It depends on the client.', "Let's discuss the budget on Monday.", "I'm interested in data analysis.", "She's good at negotiating."],
      escuta: 'Ouça a dupla junta: "It depends on the budget."',
    },
    detectores: [
      { re: /\bdepend(?:s|ed|ing)? of\b/i, sugestao: 'depend on', confianca: 'alta' },
      { re: /\bmarried with\b/i, sugestao: 'married to', confianca: 'alta' },
      { re: /\bdiscuss(?:ed|ing)? about\b/i, sugestao: 'discuss (sem about)', confianca: 'alta' },
      { re: /\bin (?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)s?\b/i, sugestao: 'on Monday / on Friday', confianca: 'alta' },
      { re: /\binterested (?:on|for|about)\b/i, sugestao: 'interested in', confianca: 'alta' },
      { re: /\bgood (?:in|on) (?:\w+ing|math|english|sales|people)\b/i, sugestao: 'good at', confianca: 'media' },
      { re: /\barrive(?:d)? (?:in|at) home\b/i, sugestao: 'arrive home / get home', confianca: 'alta' },
    ],
    exercicios: [
      { tipo: 'escolha', enunciado: '"Depende do prazo."', opcoes: ['It depends on the deadline.', 'It depends of the deadline.', 'Depends of the deadline.'], resposta: 0 },
      { tipo: 'lacuna', frase: "Let's meet ___ Thursday afternoon.", resposta: ['on'] },
      { tipo: 'lacuna', frase: "I'm really interested ___ this position.", resposta: ['in'] },
    ],
  },
  {
    tag: 'falsos-cognatos',
    nome: 'Falsos cognatos',
    habilidade: 'vocabulario',
    regra: 'Algumas palavras parecem português e significam outra coisa: pretend = fingir; actually = na verdade; assist = ajudar; push = empurrar; library = biblioteca.',
    contraste: { pt: 'Eu pretendo mudar de área. Atualmente trabalho com vendas.', en: 'I intend to / plan to change careers. Currently I work in sales.', nota: '"Atualmente" é currently / these days. "Pretender" é intend / plan.' },
    abordagens: {
      regra: 'pretender → plan to / intend to · atualmente → currently · assistir (filme) → watch · eventualmente → sometimes / occasionally · fábrica → factory (fabric é tecido).',
      exemplos: ['I plan to move abroad next year.', 'Currently, I work as a sales analyst.', 'We watched a movie last night.', 'Actually, I prefer the second option. (= na verdade)'],
      escuta: 'Ouça a diferença de sentido: "Actually, I\'m currently looking for a new job."',
    },
    detectores: [
      { re: /\bi (?:pretend|pretended) to\b/i, sugestao: 'plan to / intend to (se você quis dizer "pretender")', confianca: 'baixa' },
      { re: /\bassist(?:ed|ing)? (?:a|the|to)? ?(?:movie|film|game|series|show|tv|class|lecture)\b/i, sugestao: 'watch (assistir filme) / attend (assistir aula)', confianca: 'alta' },
      { re: /(?:^|[.!?]\s+)actually,? i (?:work|live|study|am working)\b/i, sugestao: 'currently (se você quis dizer "atualmente")', confianca: 'baixa' },
      { re: /\beventually i (?:go|travel|work|eat|visit)\b/i, sugestao: 'sometimes (se você quis dizer "de vez em quando")', confianca: 'baixa' },
    ],
    exercicios: [
      { tipo: 'escolha', enunciado: '"Atualmente eu trabalho com marketing."', opcoes: ['Currently, I work in marketing.', 'Actually, I work in marketing.', 'Actually, I am work in marketing.'], resposta: 0 },
      { tipo: 'escolha', enunciado: '"Eu pretendo fazer um mestrado."', opcoes: ["I plan to do a master's degree.", "I pretend to do a master's degree.", "I pretend do a master's degree."], resposta: 0 },
      { tipo: 'lacuna', frase: 'We ___ the game at a bar last night.', resposta: ['watched'], dica: 'assistir' },
    ],
  },
  {
    tag: 'people-plural',
    nome: 'People é plural',
    habilidade: 'gramatica',
    regra: '"People" já é plural: people are, people say, people have.',
    contraste: { pt: 'O pessoal é legal. As pessoas dizem...', en: 'People are nice. People say...', nota: 'Em português "a gente/o pessoal" é singular; em inglês "people" pede verbo no plural.' },
    abordagens: {
      regra: 'people + are/were/have/say (sem -s). Uma pessoa = a person.',
      exemplos: ['People here are very friendly.', 'Many people work remotely now.', 'The people on my team have different backgrounds.'],
      escuta: 'Ouça: "People are always asking about that."',
    },
    detectores: [
      { re: /\bpeople (?:is|was|has|says|likes|wants|needs|thinks|works|lives|doesn't)\b/i, sugestao: 'people are / were / have / say...', confianca: 'alta' },
    ],
    exercicios: [
      { tipo: 'escolha', enunciado: 'Complete: "The people in my city ___ very welcoming."', opcoes: ['are', 'is', 'be'], resposta: 0 },
      { tipo: 'lacuna', frase: 'People ___ (say) the food there is amazing.', resposta: ['say'] },
    ],
  },
  {
    tag: 'make-do',
    nome: 'Make, do, take, ask',
    habilidade: 'vocabulario',
    regra: 'O "fazer" do português vira verbos diferentes: ask a question, make a mistake, take a course, do homework, have a party.',
    contraste: { pt: 'Fazer uma pergunta, fazer um curso, cometer um erro.', en: 'Ask a question, take a course, make a mistake.', nota: 'Aprenda a combinação pronta.' },
    abordagens: {
      regra: 'ask a question · make a mistake / a decision / a plan · do a task / homework / your best · take a course / a break / a photo · have a meeting / a party.',
      exemplos: ['Can I ask a question?', 'I made a mistake in the report.', "I'm taking an online course.", "Let's take a break."],
      escuta: 'Ouça: "Can I ask you a quick question?"',
    },
    detectores: [
      { re: /\bmake (?:a |one |some |an )?(?:question|questions)\b/i, sugestao: 'ask a question', confianca: 'alta' },
      { re: /\b(?:make|made|making|do|did|doing) (?:a|an|the|some|one|my) (?:course|online course|break|photo|picture|shower)\b/i, sugestao: 'take a course / a break / a photo', confianca: 'alta' },
      { re: /\b(?:do|did|doing) (?:a|some|many|one) mistakes?\b/i, sugestao: 'make a mistake', confianca: 'alta' },
    ],
    exercicios: [
      { tipo: 'escolha', enunciado: '"Posso fazer uma pergunta?"', opcoes: ['Can I ask a question?', 'Can I make a question?', 'Can I do a question?'], resposta: 0 },
      { tipo: 'lacuna', frase: "I'm ___ a Python course online.", resposta: ['taking', 'doing'], dica: 'fazer um curso' },
      { tipo: 'lacuna', frase: 'Everyone ___ mistakes when they start.', resposta: ['makes'] },
    ],
  },
  {
    tag: 'incontaveis',
    nome: 'Palavras que não vão para o plural',
    habilidade: 'vocabulario',
    regra: 'Information, advice, feedback, software, equipment, knowledge e research não ganham -s.',
    contraste: { pt: 'informações, conselhos, softwares, feedbacks', en: 'information, advice, software, feedback', nota: 'Para contar: a piece of advice, some information, two software tools.' },
    abordagens: {
      regra: 'Incontável = sem -s e sem "a". Use some / a lot of / a piece of.',
      exemplos: ['Thanks for the information.', 'Can you give me some feedback?', 'We use a lot of software.', 'That was good advice.'],
      escuta: 'Ouça: "I got some great feedback from my manager."',
    },
    detectores: [
      { re: /\b(?:informations|advices|knowledges|equipments|softwares|feedbacks|researches|homeworks|furnitures|evidences)\b/i, sugestao: 'information / advice / software / feedback (sem -s)', confianca: 'alta' },
    ],
    exercicios: [
      { tipo: 'escolha', enunciado: 'Complete: "Thank you for all the ___."', opcoes: ['information', 'informations', 'an information'], resposta: 0 },
      { tipo: 'escolha', enunciado: '"Recebi vários feedbacks positivos."', opcoes: ['I got a lot of positive feedback.', 'I got many positive feedbacks.', 'I received many feedbacks positive.'], resposta: 0 },
    ],
  },
  {
    tag: 'artigo-profissao',
    nome: 'Artigo antes da profissão',
    habilidade: 'gramatica',
    regra: 'Em inglês a profissão leva "a/an": I\'m a developer, she\'s an engineer.',
    contraste: { pt: 'Eu sou desenvolvedor.', en: "I'm a developer.", nota: 'O português dispensa o artigo; o inglês, não.' },
    abordagens: {
      regra: 'I am / I work as + a/an + profissão. "An" antes de som de vogal: an engineer, an analyst.',
      exemplos: ["I'm a nurse.", 'I work as an accountant.', "She's a project manager.", "He's an intern at a law firm."],
      escuta: 'Ouça o "a" bem curtinho: "I\'m a designer."',
    },
    detectores: [
      { re: /\bi(?:'m| am) (?:developer|engineer|nurse|teacher|designer|manager|analyst|doctor|lawyer|student|programmer|accountant|architect|consultant|intern|salesperson|seller|technician|journalist|cook|chef|driver|dentist|psychologist|pharmacist)\b/i, sugestao: "I'm a/an ...", confianca: 'alta' },
      { re: /\bi work as (?:developer|engineer|nurse|teacher|designer|manager|analyst|doctor|lawyer|programmer|accountant|architect|consultant|intern|salesperson|seller|technician|journalist|cook|chef|driver|dentist|psychologist|pharmacist)\b/i, sugestao: 'I work as a/an ...', confianca: 'alta' },
    ],
    exercicios: [
      { tipo: 'escolha', enunciado: '"Eu sou analista financeiro."', opcoes: ["I'm a financial analyst.", "I'm financial analyst.", "I'm an financial analyst."], resposta: 0 },
      { tipo: 'lacuna', frase: 'She works as ___ engineer.', resposta: ['an'] },
    ],
  },
];

const POR_TAG = Object.fromEntries(DIFICULDADES.map(d => [d.tag, d]));

// Roda os detectores sobre um texto do aluno. Devolve achados sem repetição de tag+trecho.
function detectar(texto) {
  const achados = [];
  if (typeof texto !== 'string' || !texto.trim()) return achados;
  const t = texto.replace(/[’‘]/g, "'").slice(0, 4000);
  for (const d of DIFICULDADES) {
    for (const det of d.detectores) {
      const m = t.match(det.re);
      if (!m) continue;
      if (det.excecao && det.excecao.test(t.slice(Math.max(0, m.index - 30), m.index + m[0].length))) continue;
      const trecho = m[0].replace(/^[.!?,\s]+/, '').trim();
      if (achados.some(a => a.tag === d.tag && a.trecho.toLowerCase() === trecho.toLowerCase())) continue;
      achados.push({ tag: d.tag, nome: d.nome, trecho, sugestao: det.sugestao, explicacao: d.regra, confianca: det.confianca });
      break;   // um achado por dificuldade basta para o feedback
    }
  }
  return achados;
}

module.exports = { DIFICULDADES, POR_TAG, detectar };
