'use strict';
// Missões = coisas reais que o aluno precisa conseguir fazer em inglês ("can-do").
// O plano é uma sequência de missões escolhidas pelo objetivo. Cada missão tem 3 partes de lição
// (entender, praticar, usar) e uma tarefa de produção que, feita sem ajuda, vira "aprendizado demonstrado".
// Os textos em inglês foram escritos para nível A2-B1; o motor ajusta dicas, tradução e velocidade do áudio pelo nível.
//
// Tipos de exercício: escolha | lacuna | ordenar | escuta | ditado | traduzir | leitura | detetive (caça ao erro)
// `oponente: { nome, fala }` numa escolha faz a pessoa do debate falar primeiro; o aluno escolhe a melhor resposta.
// habilidade: gramatica | vocabulario | leitura | escuta | escrita | fala

const M = [];

M.push({
  id: 'apresentar',
  titulo: 'Se apresentar com segurança',
  podeFazer: 'Consigo me apresentar e dizer o que faço em uns 30 segundos.',
  nivel: 'A1',
  tags: ['artigo-profissao', 'terceira-pessoa'],
  vocab: [
    { en: 'I work as a...', pt: 'Eu trabalho como...', ex: 'I work as a nurse at a public hospital.' },
    { en: "I'm responsible for...", pt: 'Sou responsável por...', ex: "I'm responsible for customer support." },
    { en: 'based in', pt: 'que mora / fica em', ex: "I'm based in Porto Alegre." },
    { en: 'background', pt: 'formação, trajetória', ex: 'I have a background in accounting.' },
    { en: 'currently', pt: 'atualmente', ex: "I'm currently looking for a new challenge." },
    { en: 'Nice to meet you.', pt: 'Prazer em te conhecer.', ex: "Hi, I'm Paula. Nice to meet you." },
  ],
  explicacao: {
    titulo: 'A apresentação em 3 blocos',
    texto: 'Uma boa apresentação em inglês é curta e tem ordem: quem você é, o que faz e um detalhe que puxa conversa. Use "I\'m a/an" + profissão (com artigo!) e "I work at/for" + empresa.',
    estrutura: ["Hi, I'm [nome].", "I'm a/an [profissão] / I work as a/an [profissão] at [empresa].", "I'm responsible for [o que você faz].", 'Currently, I [algo atual].'],
  },
  exemplos: [
    { en: "Hi, I'm Marcos. I'm a software developer at a fintech in Recife.", pt: 'Oi, sou o Marcos. Sou desenvolvedor de software numa fintech em Recife.' },
    { en: "I'm responsible for the mobile app.", pt: 'Sou responsável pelo aplicativo de celular.' },
    { en: 'I have a background in design, so I care a lot about the user experience.', pt: 'Tenho formação em design, então me importo muito com a experiência do usuário.' },
    { en: "Currently, I'm learning English to work with international clients.", pt: 'Atualmente estou aprendendo inglês para trabalhar com clientes de fora.' },
  ],
  exercicios: [
    { id: 'apresentar-1', tipo: 'escolha', habilidade: 'gramatica', tag: 'artigo-profissao', dif: 1, enunciado: 'Escolha a frase correta:', opcoes: ["I'm an accountant.", "I'm accountant.", 'I am accountant person.'], resposta: 0, explica: 'Profissão leva artigo: a/an. "An" porque accountant começa com som de vogal.' },
    { id: 'apresentar-2', tipo: 'lacuna', habilidade: 'vocabulario', dif: 1, frase: 'I work ___ a sales representative.', resposta: ['as'], explica: 'Work as + profissão.' },
    { id: 'apresentar-3', tipo: 'lacuna', habilidade: 'gramatica', tag: 'terceira-pessoa', dif: 2, frase: 'My company ___ (sell) software to hospitals.', resposta: ['sells'], explica: '"My company" = it, então o verbo leva -s.' },
    { id: 'apresentar-4', tipo: 'ordenar', habilidade: 'gramatica', dif: 2, palavras: ["I'm", 'responsible', 'for', 'the', 'marketing', 'team'], resposta: "I'm responsible for the marketing team", explica: 'Responsible for + o que você cuida.' },
    { id: 'apresentar-5', tipo: 'escuta', habilidade: 'escuta', dif: 1, vozFem: true, audio: "Hi, I'm Julia. I work as a project manager at a construction company in Florianópolis.", pergunta: 'O que a Julia faz?', opcoes: ['Gerente de projetos numa construtora', 'Engenheira numa empresa de software', 'Gerente de uma loja em Florianópolis'], resposta: 0 },
    { id: 'apresentar-6', tipo: 'ditado', habilidade: 'escuta', dif: 2, audio: "I'm based in Curitiba.", resposta: ["I'm based in Curitiba", 'I am based in Curitiba'], explica: '"Based in" = onde você mora ou trabalha.' },
    { id: 'apresentar-7', tipo: 'traduzir', habilidade: 'escrita', tag: 'artigo-profissao', dif: 2, pt: 'Eu sou enfermeira e trabalho num hospital.', aceitas: ["I'm a nurse and I work at a hospital", 'I am a nurse and I work at a hospital', "I'm a nurse and I work in a hospital", 'I am a nurse and I work in a hospital'] },
    { id: 'apresentar-8', tipo: 'leitura', habilidade: 'leitura', dif: 2, texto: "Hello everyone, I'm Rafael. I'm a data analyst, and I've been at the company for two years. Before that, I worked in a bank. Outside work, I love cycling.", pergunta: 'Onde o Rafael trabalhava antes?', opcoes: ['Num banco', 'Numa loja de bicicletas', 'Na mesma empresa, em outra área'], resposta: 0 },
  ],
  tarefa: {
    enunciado: 'Apresente-se como no começo de uma entrevista ou reunião: nome, o que você faz e um detalhe atual.',
    minPalavras: 25,
    elementos: [
      { nome: 'seu nome', padroes: ["\\bmy name is\\b", "\\bi'?m [A-Z][a-z]+", '\\bi am [A-Z][a-z]+', "\\bthis is [A-Z]"] },
      { nome: 'o que você faz', padroes: ['\\bi work\\b', "\\bi'?m an? \\w+", '\\bi am an? \\w+', '\\bi study\\b', "\\bi'?m responsible\\b", '\\bmy job\\b'] },
      { nome: 'um detalhe atual', padroes: ['\\bcurrently\\b', "\\bi'?m (?:currently )?\\w+ing\\b", '\\bnow\\b', '\\bthese days\\b', '\\bi love\\b', '\\bi like\\b', '\\boutside work\\b'] },
    ],
    tagsChave: ['artigo-profissao', 'idade-have'],
    dicas: ["Hi, I'm ...", 'I work as a/an ... at ...', "I'm responsible for ...", "Currently, I'm ..."],
    modelo: "Hi, I'm Carla. I'm a pharmacist, and I work at a drugstore chain in Belo Horizonte. I'm responsible for the team in two stores. Currently, I'm learning English because I want to work for an international company.",
  },
  reteste: [
    'Você entrou numa chamada com um time de outro país. Apresente-se para eles em poucas frases.',
    'Você está num evento e alguém pergunta "So, what do you do?". Responda falando de você.',
  ],
  conversa: 'apresentacao',
});

M.push({
  id: 'trajetoria',
  titulo: 'Contar sua trajetória profissional',
  podeFazer: 'Consigo contar onde trabalhei, por quanto tempo e o que mudou.',
  nivel: 'A2',
  tags: ['tempo-desde', 'passado-irregular'],
  vocab: [
    { en: 'I started my career...', pt: 'Comecei minha carreira...', ex: 'I started my career as an intern in 2016.' },
    { en: 'I moved to...', pt: 'Mudei para (área/cidade)...', ex: 'Then I moved to the finance department.' },
    { en: 'I was promoted to...', pt: 'Fui promovido a...', ex: 'In 2021 I was promoted to team lead.' },
    { en: 'for ... years', pt: 'por/há ... anos', ex: "I've worked here for three years." },
    { en: 'since', pt: 'desde', ex: "I've been a nurse since 2018." },
    { en: 'previous job', pt: 'emprego anterior', ex: 'In my previous job, I worked with logistics.' },
  ],
  explicacao: {
    titulo: 'Passado fechado x desde quando',
    texto: 'Para algo que já acabou, use o passado: "I worked at a bank (2015-2019)". Para algo que começou e continua até hoje, use present perfect: "I have worked here since 2019" ou "for five years". É aqui que o português engana: dizemos "trabalho aqui há 5 anos" no presente.',
    estrutura: ['I started as a/an [cargo] at [empresa] in [ano].', 'After [tempo], I moved to [área/empresa].', "I've been at [empresa atual] since [ano] / for [tempo].", "Now I'm responsible for [o que faz]."],
  },
  exemplos: [
    { en: 'I started as a receptionist at a hotel in 2014.', pt: 'Comecei como recepcionista num hotel em 2014.' },
    { en: 'Two years later, I moved to the sales team.', pt: 'Dois anos depois, fui para o time de vendas.' },
    { en: "I've been a sales coordinator since 2020.", pt: 'Sou coordenadora de vendas desde 2020.' },
    { en: "I've worked with international clients for about three years.", pt: 'Trabalho com clientes internacionais há uns três anos.' },
  ],
  exercicios: [
    { id: 'trajetoria-1', tipo: 'escolha', habilidade: 'gramatica', tag: 'tempo-desde', dif: 1, enunciado: '"Sou professor há 10 anos."', opcoes: ["I've been a teacher for ten years.", "I'm a teacher since ten years.", 'I am teacher for ten years.'], resposta: 0, explica: 'Começou e continua: have been + for (duração).' },
    { id: 'trajetoria-2', tipo: 'lacuna', habilidade: 'gramatica', tag: 'tempo-desde', dif: 1, frase: "I've worked at this hospital ___ 2019.", resposta: ['since'], explica: 'Since + ponto de início.' },
    { id: 'trajetoria-3', tipo: 'lacuna', habilidade: 'gramatica', tag: 'passado-irregular', dif: 2, frase: 'In 2017 I ___ (leave) my first job and ___ (go) back to college.', resposta: ['left went', 'left, went'], explica: 'Passado fechado (2017): left, went.', multi: true },
    { id: 'trajetoria-4', tipo: 'escolha', habilidade: 'gramatica', dif: 2, enunciado: 'Qual frase fala de algo que JÁ ACABOU?', opcoes: ['I worked at a bank for four years.', "I've worked at a bank for four years.", "I've been working at a bank for four years."], resposta: 0, explica: 'Passado simples: o período terminou. As outras indicam que você ainda está lá.' },
    { id: 'trajetoria-5', tipo: 'escuta', habilidade: 'escuta', tag: 'tempo-desde', dif: 2, audio: "I started as an intern in 2018. Now I'm a senior analyst, and I've been in this role for two years.", pergunta: 'Há quanto tempo a pessoa está no cargo atual?', opcoes: ['Dois anos', 'Desde 2018', 'Ela ainda é estagiária'], resposta: 0 },
    { id: 'trajetoria-6', tipo: 'ditado', habilidade: 'escuta', dif: 2, audio: 'I was promoted to team lead last year.', resposta: ['I was promoted to team lead last year'] },
    { id: 'trajetoria-7', tipo: 'traduzir', habilidade: 'escrita', tag: 'tempo-desde', dif: 3, pt: 'Trabalho com vendas desde 2015.', aceitas: ["I've worked in sales since 2015", 'I have worked in sales since 2015', "I've been working in sales since 2015", 'I have been working in sales since 2015', "I've worked with sales since 2015"] },
    { id: 'trajetoria-8', tipo: 'ordenar', habilidade: 'gramatica', dif: 2, palavras: ['Two', 'years', 'later', 'I', 'moved', 'to', 'the', 'finance', 'team'], resposta: 'Two years later I moved to the finance team' },
  ],
  tarefa: {
    enunciado: 'Conte sua trajetória: onde começou, uma mudança importante e há quanto tempo está na situação atual.',
    minPalavras: 35,
    elementos: [
      { nome: 'como começou (passado)', padroes: ['\\bi started\\b', '\\bi began\\b', '\\bmy first job\\b', '\\bi worked\\b', '\\bi was an?\\b'] },
      { nome: 'uma mudança', padroes: ['\\bi moved\\b', '\\bi changed\\b', '\\bi was promoted\\b', '\\bthen\\b', '\\blater\\b', '\\bafter\\b'] },
      { nome: 'desde quando / há quanto tempo', padroes: ["\\bi(?:'ve| have) (?:been|worked|lived|studied)\\b", '\\bsince \\d{4}\\b', '\\bfor (?:\\w+ )?(?:years?|months?)\\b'] },
    ],
    tagsChave: ['tempo-desde', 'passado-irregular'],
    dicas: ['I started as a/an ... in ...', 'Then / After that, I moved to ...', "I've been at ... since ... / for ...", "Now I'm responsible for ..."],
    modelo: "I started my career as an intern at an accounting firm in 2016. After two years, I moved to a retail company, where I worked with budgets. I've been at my current company since 2021, and now I'm responsible for the monthly reports.",
  },
  reteste: [
    'Um recrutador pergunta: "Can you walk me through your resume?". Responda contando sua trajetória.',
    'Conte para um colega novo como você chegou na área em que está hoje.',
  ],
  conversa: 'entrevista-trajetoria',
});

M.push({
  id: 'projeto',
  titulo: 'Explicar um projeto que você fez',
  podeFazer: 'Consigo explicar um projeto: o problema, o que eu fiz e o resultado.',
  nivel: 'A2',
  tags: ['passado-irregular', 'sujeito-oculto'],
  vocab: [
    { en: 'the goal was to...', pt: 'o objetivo era...', ex: 'The goal was to reduce delivery time.' },
    { en: 'I was in charge of...', pt: 'Eu cuidava de / era responsável por...', ex: 'I was in charge of the testing phase.' },
    { en: 'we came up with', pt: 'nós criamos / tivemos a ideia de', ex: 'We came up with a simpler form.' },
    { en: 'as a result', pt: 'como resultado', ex: 'As a result, complaints dropped by 30%.' },
    { en: 'challenge', pt: 'desafio', ex: 'The biggest challenge was the deadline.' },
    { en: 'to deal with', pt: 'lidar com', ex: 'We had to deal with a tight budget.' },
  ],
  explicacao: {
    titulo: 'Situação, ação, resultado',
    texto: 'Recrutadores adoram respostas com começo, meio e fim. Situação (o problema), ação (o que VOCÊ fez, com "I") e resultado (o que mudou, de preferência com um número real). Tudo no passado. E lembre: frase em inglês sempre tem sujeito, então "Was difficult" vira "It was difficult".',
    estrutura: ['The problem was that [situação].', 'I was in charge of [sua parte].', 'I [ação no passado] and [ação].', 'As a result, [resultado].'],
  },
  exemplos: [
    { en: 'Our customers waited too long for answers.', pt: 'Nossos clientes esperavam demais por respostas.' },
    { en: 'I was in charge of organizing the support team.', pt: 'Eu era responsável por organizar o time de suporte.' },
    { en: 'We created a simple FAQ and changed the shifts.', pt: 'Criamos um FAQ simples e mudamos os turnos.' },
    { en: 'As a result, the waiting time went down from two days to six hours.', pt: 'Como resultado, a espera caiu de dois dias para seis horas.' },
  ],
  exercicios: [
    { id: 'projeto-1', tipo: 'escolha', habilidade: 'gramatica', tag: 'sujeito-oculto', dif: 1, enunciado: '"Foi difícil, mas deu certo."', opcoes: ['It was difficult, but it worked.', 'Was difficult, but worked.', 'Was difficult, but it worked.'], resposta: 0, explica: 'Em inglês, "foi" precisa de sujeito: it was.' },
    { id: 'projeto-2', tipo: 'lacuna', habilidade: 'vocabulario', dif: 1, frase: 'I was in ___ of the training program.', resposta: ['charge'], explica: 'In charge of = responsável por.' },
    { id: 'projeto-3', tipo: 'lacuna', habilidade: 'gramatica', tag: 'passado-irregular', dif: 2, frase: 'We ___ (build) a new dashboard and ___ (teach) the team how to use it.', resposta: ['built taught', 'built, taught'], multi: true },
    { id: 'projeto-4', tipo: 'ordenar', habilidade: 'gramatica', dif: 2, palavras: ['As', 'a', 'result', 'sales', 'increased', 'by', 'fifteen', 'percent'], resposta: 'As a result sales increased by fifteen percent' },
    { id: 'projeto-5', tipo: 'escuta', habilidade: 'escuta', dif: 2, audio: 'The biggest challenge was the deadline. We had only three weeks, so I split the work into small tasks.', pergunta: 'Qual foi o maior desafio?', opcoes: ['O prazo curto', 'A falta de pessoas', 'O orçamento'], resposta: 0 },
    { id: 'projeto-6', tipo: 'escuta', habilidade: 'escuta', dif: 3, audio: 'As a result, we reduced the number of errors and the client renewed the contract.', pergunta: 'Qual foi o resultado?', opcoes: ['Menos erros e o contrato renovado', 'Mais clientes e mais erros', 'O cliente cancelou o contrato'], resposta: 0 },
    { id: 'projeto-7', tipo: 'traduzir', habilidade: 'escrita', tag: 'passado-irregular', dif: 3, pt: 'Nós tivemos que lidar com um orçamento pequeno.', aceitas: ['We had to deal with a small budget', 'We had to deal with a tight budget', 'We had to deal with a low budget', 'We had to work with a small budget'] },
    { id: 'projeto-8', tipo: 'leitura', habilidade: 'leitura', dif: 2, texto: 'Last year our clinic had a problem: patients missed many appointments. I suggested automatic reminders by text message. I tested them with one doctor first. After two months, missed appointments fell by almost half.', pergunta: 'O que a pessoa fez primeiro?', opcoes: ['Testou os lembretes com um médico', 'Contratou mais recepcionistas', 'Mudou os horários da clínica'], resposta: 0 },
  ],
  tarefa: {
    enunciado: 'Escolha um projeto ou situação de trabalho (ou estudo) e conte: o problema, o que você fez e o resultado.',
    minPalavras: 40,
    elementos: [
      { nome: 'o problema ou objetivo', padroes: ['\\bproblem\\b', '\\bthe goal\\b', '\\bchallenge\\b', '\\bwe needed\\b', '\\bissue\\b'] },
      { nome: 'o que você fez (com "I")', padroes: ['\\bi (?:\\w+ed|made|built|took|led|wrote|did|had|found|began|chose|gave|ran|sent|set|spoke|taught|thought|was in charge)\\b'] },
      { nome: 'o resultado', padroes: ['\\bas a result\\b', '\\bresult\\b', '\\bin the end\\b', '\\bafter that\\b', '\\bwe (?:reduced|increased|improved|saved)\\b', '\\d+ ?%'] },
    ],
    tagsChave: ['passado-irregular', 'sujeito-oculto'],
    dicas: ['The problem was that ...', 'I was in charge of ...', 'I ... and ...', 'As a result, ...'],
    modelo: 'In my last job, the problem was that the stock reports were always late. I was in charge of fixing that. I talked to the store managers and created a simple spreadsheet for them. As a result, the reports started to arrive on time every week.',
  },
  reteste: [
    'O entrevistador diz: "Tell me about a time you solved a problem at work." Responda com outro exemplo.',
    'Conte sobre um desafio que você enfrentou nos estudos ou num trabalho voluntário e como resolveu.',
  ],
  conversa: 'entrevista-projeto',
});

M.push({
  id: 'perguntas-entrevista',
  titulo: 'Entender as perguntas de entrevista',
  podeFazer: 'Consigo reconhecer as perguntas mais comuns de entrevista, ouvindo, e sei o que cada uma quer saber.',
  nivel: 'A2',
  tags: ['perguntas-do'],
  vocab: [
    { en: 'Tell me about yourself.', pt: 'Fale sobre você.', ex: "Let's start. Tell me about yourself." },
    { en: 'Why do you want to work here?', pt: 'Por que você quer trabalhar aqui?', ex: 'So, why do you want to work here?' },
    { en: 'What are your strengths?', pt: 'Quais são seus pontos fortes?', ex: 'What would you say are your strengths?' },
    { en: 'Where do you see yourself in five years?', pt: 'Onde você se vê daqui a 5 anos?', ex: 'Where do you see yourself in five years?' },
    { en: 'Why are you leaving your current job?', pt: 'Por que você está saindo do emprego atual?', ex: 'Why are you leaving your current job?' },
    { en: 'Do you have any questions for us?', pt: 'Você tem alguma pergunta para nós?', ex: 'Before we finish, do you have any questions for us?' },
  ],
  explicacao: {
    titulo: 'O que está por trás de cada pergunta',
    texto: 'As perguntas de entrevista se repetem muito. Se você reconhece a pergunta pelo som, ganha segundos preciosos para pensar. Repare na estrutura: quase todas usam "do/does" ou "did". E se não entender, pedir para repetir é normal e profissional: "Sorry, could you repeat the question?".',
    estrutura: ['Tell me about yourself → apresentação + trajetória curta', 'Why do you want to work here? → o que te atrai na empresa', 'What are your strengths? → 1 ou 2 pontos fortes com exemplo', 'Do you have any questions? → sempre tenha uma pergunta pronta'],
  },
  exemplos: [
    { en: 'What do you know about our company?', pt: 'O que você sabe sobre a nossa empresa?' },
    { en: 'How did you hear about this position?', pt: 'Como você soube desta vaga?' },
    { en: 'What did you like most about your last job?', pt: 'Do que você mais gostava no último emprego?' },
    { en: 'Sorry, could you repeat the question?', pt: 'Desculpe, pode repetir a pergunta?' },
  ],
  exercicios: [
    { id: 'perguntas-1', tipo: 'escuta', habilidade: 'escuta', dif: 1, audio: 'Tell me a little bit about yourself.', pergunta: 'O que o entrevistador pediu?', opcoes: ['Que você fale sobre você', 'Que você fale do salário', 'Que você conte um problema'], resposta: 0 },
    { id: 'perguntas-2', tipo: 'escuta', habilidade: 'escuta', dif: 2, audio: 'Why are you interested in this position?', pergunta: 'O que querem saber?', opcoes: ['Por que você se interessa pela vaga', 'Quando você pode começar', 'Qual é a sua posição atual'], resposta: 0 },
    { id: 'perguntas-3', tipo: 'escuta', habilidade: 'escuta', dif: 2, audio: 'Where do you see yourself in five years?', pergunta: 'O que querem saber?', opcoes: ['Seus planos para o futuro', 'Onde você morava há 5 anos', 'Se você pode viajar'], resposta: 0 },
    { id: 'perguntas-4', tipo: 'escuta', habilidade: 'escuta', tag: 'perguntas-do', dif: 3, audio: 'How did you deal with a difficult coworker?', pergunta: 'O que querem saber?', opcoes: ['Como você lidou com um colega difícil', 'Se você gosta de trabalhar em equipe', 'Quantos colegas você tinha'], resposta: 0 },
    { id: 'perguntas-5', tipo: 'escolha', habilidade: 'gramatica', tag: 'perguntas-do', dif: 1, enunciado: 'Qual pergunta está correta?', opcoes: ['Why do you want to work here?', 'Why you want to work here?', 'Why you wants to work here?'], resposta: 0, explica: 'Pergunta no presente precisa de "do".' },
    { id: 'perguntas-6', tipo: 'lacuna', habilidade: 'gramatica', tag: 'perguntas-do', dif: 2, frase: 'How ___ you hear about this job?', resposta: ['did'], explica: 'Passado (como você soube): did + verbo base.' },
    { id: 'perguntas-7', tipo: 'ditado', habilidade: 'escuta', dif: 3, audio: 'Do you have any questions for us?', resposta: ['Do you have any questions for us'], sufixo: '?' },
    { id: 'perguntas-8', tipo: 'traduzir', habilidade: 'escrita', dif: 2, pt: 'Desculpe, pode repetir a pergunta?', aceitas: ['Sorry, could you repeat the question', 'Sorry, can you repeat the question', 'Sorry, could you please repeat the question', 'Could you repeat the question, please'], sufixo: '?' },
  ],
  tarefa: {
    enunciado: 'Responda, por escrito, a "Why do you want to work here?" pensando numa empresa ou vaga real que te interessa.',
    minPalavras: 30,
    elementos: [
      { nome: 'o que te atrai', padroes: ['\\bbecause\\b', '\\bi (?:like|admire|love|believe)\\b', "\\bi'?m (?:interested|excited)\\b", '\\battract'] },
      { nome: 'como você contribui', padroes: ['\\bi can\\b', '\\bmy experience\\b', '\\bi could\\b', '\\bi would\\b', '\\bhelp\\b', '\\bcontribute\\b'] },
    ],
    tagsChave: ['preposicoes', 'sujeito-oculto'],
    dicas: ["I'm interested in this position because ...", 'I really like how your company ...', 'With my experience in ..., I can help ...'],
    modelo: "I'm interested in this position because I really like how your company uses data to make decisions. I've worked with reports for four years, so I think I can help the team with that. I also want to grow in an international environment.",
  },
  reteste: [
    'Agora responda a outra pergunta comum: "What are your strengths?". Dê um exemplo real.',
    'Responda: "Why are you looking for a new job?" de um jeito positivo.',
  ],
  conversa: 'entrevista-geral',
});

M.push({
  id: 'forcas',
  titulo: 'Falar de pontos fortes e do que está melhorando',
  podeFazer: 'Consigo falar de 2 pontos fortes com exemplo e de 1 ponto que estou desenvolvendo.',
  nivel: 'B1',
  tags: ['terceira-pessoa', 'make-do'],
  vocab: [
    { en: "I'm good at...", pt: 'Sou bom/boa em...', ex: "I'm good at explaining complex ideas." },
    { en: 'organized', pt: 'organizado(a)', ex: "I'm very organized with deadlines." },
    { en: 'reliable', pt: 'confiável', ex: 'My manager says I am reliable.' },
    { en: "I'm working on...", pt: 'Estou trabalhando para melhorar...', ex: "I'm working on my public speaking." },
    { en: 'For example,...', pt: 'Por exemplo,...', ex: 'For example, last month I organized a workshop.' },
    { en: 'to improve', pt: 'melhorar', ex: "I'm taking a course to improve my Excel skills." },
  ],
  explicacao: {
    titulo: 'Ponto forte com prova, ponto fraco com plano',
    texto: 'Ponto forte sozinho não convence: diga o ponto e dê um exemplo curto. Para o ponto a melhorar, escolha algo real que não seja essencial para a vaga e diga o que você está fazendo para evoluir. Atenção ao "good AT" e ao "take a course" (não "make a course").',
    estrutura: ["One of my strengths is [ponto]. For example, [exemplo].", "I'm also good at [ponto].", "Something I'm working on is [ponto]. I'm [o que está fazendo]."],
  },
  exemplos: [
    { en: 'One of my strengths is communication. For example, I train all the new employees.', pt: 'Um dos meus pontos fortes é a comunicação. Por exemplo, treino todos os funcionários novos.' },
    { en: "I'm good at solving problems under pressure.", pt: 'Sou bom em resolver problemas sob pressão.' },
    { en: "Something I'm working on is delegating more.", pt: 'Algo que estou desenvolvendo é delegar mais.' },
    { en: "I'm taking a course to improve my presentation skills.", pt: 'Estou fazendo um curso para melhorar minhas apresentações.' },
  ],
  exercicios: [
    { id: 'forcas-1', tipo: 'escolha', habilidade: 'vocabulario', tag: 'preposicoes', dif: 1, enunciado: '"Sou boa em negociar."', opcoes: ["I'm good at negotiating.", "I'm good in negotiate.", 'I am good on negotiating.'], resposta: 0 },
    { id: 'forcas-2', tipo: 'lacuna', habilidade: 'vocabulario', tag: 'make-do', dif: 2, frase: "I'm ___ an online course to improve my Excel skills.", resposta: ['taking', 'doing'], explica: 'Fazer um curso = take (ou do) a course, nunca make.' },
    { id: 'forcas-3', tipo: 'lacuna', habilidade: 'gramatica', tag: 'terceira-pessoa', dif: 2, frase: 'My manager always ___ (say) that I am very reliable.', resposta: ['says'] },
    { id: 'forcas-4', tipo: 'escuta', habilidade: 'escuta', dif: 2, audio: "Something I'm working on is public speaking. I volunteer to present in our team meetings every month.", pergunta: 'O que a pessoa faz para melhorar?', opcoes: ['Se oferece para apresentar nas reuniões', 'Faz um curso de teatro para perder a timidez', 'Evita apresentar e pede para outra pessoa falar'], resposta: 0 },
    { id: 'forcas-5', tipo: 'escolha', habilidade: 'leitura', dif: 3, enunciado: 'Qual resposta é melhor para "What is your weakness?"', opcoes: ["Sometimes I take on too many tasks. Now I use a planner and I've started to say no when it's necessary.", "I don't have any weaknesses, I am perfect for this job.", 'I am a perfectionist and I work too much, I never stop.'], resposta: 0, explica: 'A melhor resposta mostra consciência e um plano real.' },
    { id: 'forcas-6', tipo: 'ordenar', habilidade: 'gramatica', dif: 2, palavras: ['One', 'of', 'my', 'strengths', 'is', 'attention', 'to', 'detail'], resposta: 'One of my strengths is attention to detail' },
    { id: 'forcas-7', tipo: 'traduzir', habilidade: 'escrita', dif: 3, pt: 'Por exemplo, no mês passado eu organizei um treinamento para a equipe.', aceitas: ['For example, last month I organized a training for the team', 'For example, last month I organized a training session for the team', 'For example, last month I organised a training for the team', 'For example, last month I organized training for the team'] },
    { id: 'forcas-8', tipo: 'ditado', habilidade: 'escuta', dif: 2, audio: "I'm good at working with deadlines.", resposta: ["I'm good at working with deadlines", 'I am good at working with deadlines'] },
  ],
  tarefa: {
    enunciado: 'Responda a "What are your strengths and weaknesses?": dois pontos fortes com exemplo e um ponto que você está melhorando.',
    minPalavras: 40,
    elementos: [
      { nome: 'um ponto forte', padroes: ['\\bstrength', "\\bi'?m good at\\b", '\\bi am good at\\b', "\\bi'?m (?:very )?(?:organized|reliable|patient|creative|focused)\\b"] },
      { nome: 'um exemplo', padroes: ['\\bfor example\\b', '\\bfor instance\\b', '\\blast (?:month|year|week)\\b', '\\bonce\\b'] },
      { nome: 'o que está melhorando', padroes: ["\\bi'?m working on\\b", '\\bi am working on\\b', '\\bimprove\\b', '\\bweakness\\b', '\\bi need to\\b', "\\bi'?m learning\\b"] },
    ],
    tagsChave: ['make-do', 'preposicoes'],
    dicas: ['One of my strengths is ... For example, ...', "I'm also good at ...", "Something I'm working on is ... I'm ..."],
    modelo: "One of my strengths is organization. For example, I created the schedule that my whole team uses today. I'm also good at talking to clients. Something I'm working on is public speaking, so I'm taking a short course and presenting more in meetings.",
  },
  reteste: [
    'Um gestor pergunta: "What would your colleagues say about you?". Responda com dois pontos e um exemplo.',
    'Responda: "Tell me about something you are trying to improve."',
  ],
  conversa: 'entrevista-geral',
});

M.push({
  id: 'perguntar-empresa',
  titulo: 'Fazer boas perguntas no fim da entrevista',
  podeFazer: 'Consigo fazer 2 ou 3 perguntas claras sobre a vaga e a empresa.',
  nivel: 'A2',
  tags: ['perguntas-do', 'explicar-para'],
  vocab: [
    { en: 'What does a typical day look like?', pt: 'Como é um dia típico?', ex: 'What does a typical day look like in this role?' },
    { en: 'the team', pt: 'a equipe', ex: 'How big is the team?' },
    { en: 'next steps', pt: 'próximos passos', ex: 'What are the next steps in the process?' },
    { en: 'Could you tell me more about...?', pt: 'Pode me falar mais sobre...?', ex: 'Could you tell me more about the training?' },
    { en: 'success in this role', pt: 'sucesso nesta função', ex: 'What does success look like in this role?' },
    { en: 'remote / hybrid', pt: 'remoto / híbrido', ex: 'Is the position remote or hybrid?' },
  ],
  explicacao: {
    titulo: 'Pergunta de verdade: auxiliar + verbo base',
    texto: 'No fim da entrevista quase sempre vem "Do you have any questions for us?". Ter 2 perguntas prontas mostra interesse. Estruturas seguras: "Could you tell me more about...?" (educada), "What does... look like?" e "How do you...?". Lembre: "tell me" sim, "explain me" não.',
    estrutura: ['Could you tell me more about [assunto]?', 'What does a typical day look like?', 'How does the team [verbo]?', 'What are the next steps?'],
  },
  exemplos: [
    { en: 'Could you tell me more about the team I would work with?', pt: 'Pode me falar mais sobre a equipe com quem eu trabalharia?' },
    { en: 'How do you measure success in this role?', pt: 'Como vocês medem o sucesso nessa função?' },
    { en: 'What do you like most about working here?', pt: 'Do que você mais gosta de trabalhar aqui?' },
    { en: 'What are the next steps in the process?', pt: 'Quais são os próximos passos do processo?' },
  ],
  exercicios: [
    { id: 'perguntar-1', tipo: 'escolha', habilidade: 'gramatica', tag: 'explicar-para', dif: 1, enunciado: 'Qual pergunta é natural?', opcoes: ['Could you tell me more about the role?', 'Could you explain me the role?', 'Could you say me about the role?'], resposta: 0 },
    { id: 'perguntar-2', tipo: 'lacuna', habilidade: 'gramatica', tag: 'perguntas-do', dif: 1, frase: 'What ___ a typical day look like?', resposta: ['does'] },
    { id: 'perguntar-3', tipo: 'lacuna', habilidade: 'gramatica', tag: 'perguntas-do', dif: 2, frase: 'How ___ the team share information?', resposta: ['does'], explica: '"The team" = it, então does.' },
    { id: 'perguntar-4', tipo: 'ordenar', habilidade: 'gramatica', dif: 2, palavras: ['What', 'are', 'the', 'next', 'steps', 'in', 'the', 'process'], resposta: 'What are the next steps in the process', sufixo: '?' },
    { id: 'perguntar-5', tipo: 'escuta', habilidade: 'escuta', dif: 2, audio: "That's a great question. The team has six people, and we meet every Monday to plan the week.", pergunta: 'Quantas pessoas tem a equipe?', opcoes: ['Seis', 'Dez', 'Duas'], resposta: 0 },
    { id: 'perguntar-6', tipo: 'escuta', habilidade: 'escuta', dif: 3, audio: "The position is hybrid. You'd come to the office twice a week, usually on Tuesdays and Thursdays.", pergunta: 'Como é o formato?', opcoes: ['Híbrido, 2 dias no escritório', 'Totalmente remoto, de qualquer cidade', 'Presencial, cinco dias por semana'], resposta: 0 },
    { id: 'perguntar-7', tipo: 'traduzir', habilidade: 'escrita', tag: 'perguntas-do', dif: 2, pt: 'Como vocês medem o sucesso nesta função?', aceitas: ['How do you measure success in this role', 'How do you measure success in this position', 'How do you measure success in this job'], sufixo: '?' },
    { id: 'perguntar-8', tipo: 'ditado', habilidade: 'escuta', dif: 2, audio: 'Is the position remote or hybrid?', resposta: ['Is the position remote or hybrid'], sufixo: '?' },
  ],
  tarefa: {
    enunciado: 'Escreva 3 perguntas que você faria no fim de uma entrevista para a vaga que você quer.',
    minPalavras: 18,
    elementos: [
      { nome: 'pelo menos 2 perguntas', padroes: ['\\?[^?]*\\?'] },
      { nome: 'uma pergunta educada', padroes: ['\\bcould you\\b', '\\bcan you tell\\b', '\\bwould you\\b'] },
    ],
    tagsChave: ['perguntas-do', 'explicar-para'],
    dicas: ['Could you tell me more about ...?', 'What does ... look like?', 'How do you ...?', 'What are the next steps?'],
    modelo: 'Could you tell me more about the team I would work with? What does a typical week look like in this role? What are the next steps in the process?',
  },
  reteste: [
    'Você vai conversar com um possível cliente. Escreva 3 perguntas para entender o que ele precisa.',
    'Num primeiro dia de trabalho, escreva 3 perguntas para o seu gestor sobre como a equipe funciona.',
  ],
  conversa: 'entrevista-geral',
});

M.push({
  id: 'reunioes',
  titulo: 'Dar opinião e concordar em reuniões',
  podeFazer: 'Consigo dar minha opinião, concordar, discordar com educação e sugerir algo numa reunião.',
  nivel: 'A2',
  tags: ['concordar', 'preposicoes'],
  vocab: [
    { en: 'I think...', pt: 'Eu acho...', ex: 'I think we should wait for the data.' },
    { en: 'I agree.', pt: 'Concordo.', ex: 'I agree with Ana.' },
    { en: "I see your point, but...", pt: 'Entendo seu ponto, mas...', ex: 'I see your point, but the deadline is too short.' },
    { en: 'What if we...?', pt: 'E se a gente...?', ex: 'What if we test it with one client first?' },
    { en: 'It depends on...', pt: 'Depende de...', ex: 'It depends on the budget.' },
    { en: 'to follow up', pt: 'dar seguimento', ex: "I'll follow up by email." },
  ],
  explicacao: {
    titulo: 'Opinião sem medo, discordância com educação',
    texto: 'Em reuniões em inglês, frases curtas funcionam melhor que frases perfeitas. "I agree" já é completo: o "am" sobra. Para discordar com educação, reconheça o ponto do outro antes: "I see your point, but...". Para sugerir, "What if we...?" é leve e natural. E é "depend ON", não "of".',
    estrutura: ['I think / In my opinion, [opinião].', 'I agree with [pessoa]. / I see your point, but [ressalva].', 'What if we [sugestão]?', "I'll follow up on [assunto]."],
  },
  exemplos: [
    { en: 'In my opinion, the second option is safer.', pt: 'Na minha opinião, a segunda opção é mais segura.' },
    { en: "I agree with Pedro. Let's start next week.", pt: 'Concordo com o Pedro. Vamos começar semana que vem.' },
    { en: "I see your point, but I don't think we have enough time.", pt: 'Entendo seu ponto, mas não acho que temos tempo suficiente.' },
    { en: 'What if we split the project into two phases?', pt: 'E se a gente dividir o projeto em duas fases?' },
  ],
  exercicios: [
    { id: 'reunioes-1', tipo: 'escolha', habilidade: 'gramatica', tag: 'concordar', dif: 1, enunciado: '"Concordo com você."', opcoes: ['I agree with you.', 'I am agree with you.', 'I agree you.'], resposta: 0 },
    { id: 'reunioes-2', tipo: 'lacuna', habilidade: 'vocabulario', tag: 'preposicoes', dif: 1, frase: 'It depends ___ the client.', resposta: ['on'] },
    { id: 'reunioes-3', tipo: 'escolha', habilidade: 'vocabulario', dif: 2, enunciado: 'Qual é a forma mais educada de discordar?', opcoes: ["I see your point, but I think it's risky.", "You're wrong.", 'No, this is a bad idea.'], resposta: 0 },
    { id: 'reunioes-4', tipo: 'lacuna', habilidade: 'gramatica', dif: 2, frase: 'What ___ we test it with a small group first?', resposta: ['if'] },
    { id: 'reunioes-5', tipo: 'escuta', habilidade: 'escuta', dif: 2, audio: "I see your point, but I'm worried about the budget. What if we start with just one city?", pergunta: 'O que a pessoa sugere?', opcoes: ['Começar com uma cidade só', 'Cancelar o projeto', 'Aumentar o orçamento'], resposta: 0 },
    { id: 'reunioes-6', tipo: 'escuta', habilidade: 'escuta', dif: 3, audio: "Let's discuss the timeline on Thursday. Carla, can you follow up with the supplier?", pergunta: 'O que a Carla precisa fazer?', opcoes: ['Falar com o fornecedor', 'Marcar a reunião de quinta', 'Preparar o cronograma'], resposta: 0 },
    { id: 'reunioes-7', tipo: 'traduzir', habilidade: 'escrita', tag: 'concordar', dif: 2, pt: 'Eu não concordo, mas entendo seu ponto.', aceitas: ["I don't agree, but I see your point", "I don't agree, but I understand your point", 'I do not agree, but I see your point', 'I disagree, but I see your point', 'I disagree, but I understand your point'] },
    { id: 'reunioes-8', tipo: 'ditado', habilidade: 'escuta', dif: 2, audio: "I'll follow up by email.", resposta: ["I'll follow up by email", 'I will follow up by email'] },
  ],
  tarefa: {
    enunciado: 'Seu time está decidindo se lança um produto agora ou daqui a um mês. Escreva o que você diria: sua opinião, concordando ou discordando de alguém, e uma sugestão.',
    minPalavras: 30,
    elementos: [
      { nome: 'sua opinião', padroes: ['\\bi think\\b', '\\bin my opinion\\b', '\\bi believe\\b', '\\bi feel\\b'] },
      { nome: 'concordar ou discordar', padroes: ['\\bi (?:totally |partly )?agree\\b', "\\bi don'?t agree\\b", '\\bi disagree\\b', '\\bi see your point\\b'] },
      { nome: 'uma sugestão', padroes: ['\\bwhat if\\b', "\\blet'?s\\b", '\\bwe should\\b', '\\bmaybe we\\b', '\\bwe could\\b'] },
    ],
    tagsChave: ['concordar', 'preposicoes', 'sujeito-oculto'],
    dicas: ['I think ...', 'I agree with ... / I see your point, but ...', 'What if we ...?'],
    modelo: "I see your point, Bruno, but I think it's risky to launch now. We still have some bugs. What if we launch to a small group of clients first and wait for their feedback?",
  },
  reteste: [
    'Numa reunião, alguém propõe trabalhar todo sábado para entregar antes. Responda com sua opinião e uma alternativa.',
    'Seu gestor pergunta o que você acha de mudar o horário das reuniões semanais. Responda.',
  ],
  conversa: 'reuniao',
});

M.push({
  id: 'emails',
  titulo: 'Escrever e-mails curtos de trabalho',
  podeFazer: 'Consigo escrever um e-mail curto e claro pedindo, confirmando ou avisando algo.',
  nivel: 'A2',
  tags: ['incontaveis', 'make-do'],
  vocab: [
    { en: 'I hope you are well.', pt: 'Espero que esteja bem.', ex: 'Hi Mark, I hope you are well.' },
    { en: "I'm writing to...", pt: 'Escrevo para...', ex: "I'm writing to confirm our meeting." },
    { en: 'Could you please...?', pt: 'Você poderia, por favor...?', ex: 'Could you please send me the invoice?' },
    { en: 'attached', pt: 'em anexo', ex: 'Please find the report attached.' },
    { en: 'Let me know if...', pt: 'Me avise se...', ex: 'Let me know if you have any questions.' },
    { en: 'Best regards,', pt: 'Atenciosamente,', ex: 'Best regards, Fernanda' },
  ],
  explicacao: {
    titulo: 'Saudação, motivo, pedido, fechamento',
    texto: 'E-mail profissional em inglês é mais direto que em português. Uma linha de saudação, uma de motivo ("I\'m writing to..."), o pedido ou a informação e um fechamento. Cuidado com palavras que não vão para o plural: information, feedback e advice.',
    estrutura: ['Hi [nome],', "I'm writing to [motivo].", 'Could you please [pedido]?', 'Let me know if you have any questions.', 'Best regards, [seu nome]'],
  },
  exemplos: [
    { en: "I'm writing to confirm our meeting on Tuesday at 10 a.m.", pt: 'Escrevo para confirmar nossa reunião de terça às 10h.' },
    { en: 'Could you please send me more information about the price?', pt: 'Poderia me enviar mais informações sobre o preço?' },
    { en: 'Please find the presentation attached.', pt: 'Segue a apresentação em anexo.' },
    { en: 'Thanks for your feedback.', pt: 'Obrigado pelo retorno.' },
  ],
  exercicios: [
    { id: 'emails-1', tipo: 'escolha', habilidade: 'vocabulario', tag: 'incontaveis', dif: 1, enunciado: '"Pode me mandar mais informações?"', opcoes: ['Could you send me more information?', 'Could you send me more informations?', 'Could you send me an informations?'], resposta: 0 },
    { id: 'emails-2', tipo: 'lacuna', habilidade: 'vocabulario', dif: 1, frase: "I'm ___ to confirm the delivery date.", resposta: ['writing'] },
    { id: 'emails-3', tipo: 'lacuna', habilidade: 'vocabulario', dif: 2, frase: 'Please find the contract ___.', resposta: ['attached'] },
    { id: 'emails-4', tipo: 'ordenar', habilidade: 'gramatica', dif: 2, palavras: ['Let', 'me', 'know', 'if', 'you', 'have', 'any', 'questions'], resposta: 'Let me know if you have any questions' },
    { id: 'emails-5', tipo: 'leitura', habilidade: 'leitura', dif: 2, texto: "Hi Ana, I hope you are well. I'm writing because the delivery will be two days late. The truck had a problem on the road. The new date is Friday. Sorry for the inconvenience. Best regards, Tom", pergunta: 'Qual é a notícia principal do e-mail?', opcoes: ['A entrega vai atrasar dois dias', 'O caminhão foi vendido', 'A reunião mudou para sexta'], resposta: 0 },
    { id: 'emails-6', tipo: 'escuta', habilidade: 'escuta', dif: 2, audio: 'Could you please send me the final version by Thursday?', pergunta: 'O que a pessoa pede?', opcoes: ['A versão final até quinta', 'Uma reunião na quinta', 'A primeira versão hoje'], resposta: 0 },
    { id: 'emails-7', tipo: 'traduzir', habilidade: 'escrita', tag: 'incontaveis', dif: 2, pt: 'Obrigada pelo feedback.', aceitas: ['Thanks for the feedback', 'Thank you for the feedback', 'Thanks for your feedback', 'Thank you for your feedback'] },
    { id: 'emails-8', tipo: 'escolha', habilidade: 'leitura', dif: 3, enunciado: 'Qual fechamento combina com um e-mail profissional?', opcoes: ['Best regards,', 'Kisses,', 'Bye bye,'], resposta: 0 },
  ],
  tarefa: {
    enunciado: 'Escreva um e-mail curto para um cliente ou colega estrangeiro pedindo um documento até uma data.',
    minPalavras: 30,
    elementos: [
      { nome: 'saudação', padroes: ['^\\s*(?:hi|hello|dear|good morning)\\b'] },
      { nome: 'motivo', padroes: ["\\bi'?m writing\\b", '\\bi am writing\\b', '\\bi would like\\b', "\\bi'?d like\\b"] },
      { nome: 'pedido educado', padroes: ['\\bcould you\\b', '\\bcan you\\b', '\\bwould you\\b', '\\bplease\\b'] },
      { nome: 'fechamento', padroes: ['\\bbest\\b', '\\bregards\\b', '\\bthanks\\b', '\\bthank you\\b', '\\bsincerely\\b'] },
    ],
    tagsChave: ['incontaveis', 'sujeito-oculto'],
    dicas: ['Hi ...,', "I'm writing to ...", 'Could you please ... by ...?', 'Best regards,'],
    modelo: "Hi John,\nI hope you are well. I'm writing about the new contract. Could you please send me the signed version by Friday? Let me know if you have any questions.\nBest regards,\nLuana",
  },
  reteste: [
    'Escreva um e-mail avisando que você vai se atrasar para entregar um trabalho e propondo uma nova data.',
    'Escreva um e-mail agradecendo uma entrevista e dizendo que continua interessado(a) na vaga.',
  ],
  conversa: 'reuniao',
});

M.push({
  id: 'pedir-repetir',
  titulo: 'Pedir para repetir e confirmar',
  podeFazer: 'Quando não entendo, consigo pedir para repetir, falar mais devagar ou confirmar o que entendi.',
  nivel: 'A1',
  tags: ['explicar-para'],
  vocab: [
    { en: 'Sorry, could you repeat that?', pt: 'Desculpe, pode repetir?', ex: "Sorry, could you repeat that? I didn't catch it." },
    { en: "I didn't catch that.", pt: 'Não peguei / não entendi.', ex: "Sorry, I didn't catch your name." },
    { en: 'Could you speak more slowly?', pt: 'Pode falar mais devagar?', ex: 'Could you speak a bit more slowly, please?' },
    { en: 'Just to confirm,...', pt: 'Só para confirmar,...', ex: 'Just to confirm, the meeting is at three?' },
    { en: 'Do you mean...?', pt: 'Você quer dizer...?', ex: 'Do you mean next Monday or this Monday?' },
    { en: 'How do you spell that?', pt: 'Como se escreve?', ex: 'How do you spell your last name?' },
  ],
  explicacao: {
    titulo: 'Não entender faz parte. Saber pedir é a habilidade.',
    texto: 'Mesmo nativos pedem para repetir o tempo todo. Ter 3 frases prontas tira o medo de travar. Use "Could you...?" para pedir com educação e "Just to confirm,..." para checar se entendeu. Em vez de "explain me", use "Could you explain that again?".',
    estrutura: ["Sorry, I didn't catch that.", 'Could you repeat that, please?', 'Could you speak more slowly?', 'Just to confirm, [o que você entendeu]?'],
  },
  exemplos: [
    { en: "Sorry, I didn't catch the last part.", pt: 'Desculpe, não entendi a última parte.' },
    { en: 'Could you explain that again, please?', pt: 'Pode explicar de novo, por favor?' },
    { en: 'Just to confirm, you need the report by Friday?', pt: 'Só para confirmar, você precisa do relatório até sexta?' },
    { en: 'Do you mean the new client or the old one?', pt: 'Você quer dizer o cliente novo ou o antigo?' },
  ],
  exercicios: [
    { id: 'repetir-1', tipo: 'escolha', habilidade: 'vocabulario', tag: 'explicar-para', dif: 1, enunciado: 'Você quer que a pessoa explique de novo.', opcoes: ['Could you explain that again?', 'Could you explain me again?', 'Can you say me again?'], resposta: 0 },
    { id: 'repetir-2', tipo: 'lacuna', habilidade: 'vocabulario', dif: 1, frase: "Sorry, I didn't ___ that.", resposta: ['catch', 'get', 'understand', 'hear'] },
    { id: 'repetir-3', tipo: 'escuta', habilidade: 'escuta', dif: 1, audio: 'Could you speak a little more slowly, please?', pergunta: 'O que a pessoa pediu?', opcoes: ['Para falar mais devagar', 'Para falar mais alto', 'Para repetir o nome'], resposta: 0 },
    { id: 'repetir-4', tipo: 'escuta', habilidade: 'escuta', dif: 2, audio: 'Just to confirm, the call is tomorrow at four, right?', pergunta: 'O que a pessoa está confirmando?', opcoes: ['A ligação amanhã às 4', 'A reunião hoje às 4', 'O endereço do escritório'], resposta: 0 },
    { id: 'repetir-5', tipo: 'ordenar', habilidade: 'gramatica', dif: 2, palavras: ['How', 'do', 'you', 'spell', 'your', 'last', 'name'], resposta: 'How do you spell your last name', sufixo: '?' },
    { id: 'repetir-6', tipo: 'ditado', habilidade: 'escuta', dif: 2, audio: "Sorry, I didn't catch your name.", resposta: ["Sorry, I didn't catch your name", 'Sorry I did not catch your name', "Sorry I didn't catch your name"] },
    { id: 'repetir-7', tipo: 'traduzir', habilidade: 'escrita', dif: 2, pt: 'Você quer dizer na próxima semana?', aceitas: ['Do you mean next week', 'You mean next week'], sufixo: '?' },
  ],
  tarefa: {
    enunciado: 'Numa chamada, o cliente falou rápido e você entendeu só parte. Escreva o que você diria para pedir para repetir e confirmar a data que entendeu.',
    minPalavras: 15,
    elementos: [
      { nome: 'pedido para repetir', padroes: ['\\brepeat\\b', "\\bdidn'?t catch\\b", '\\bmore slowly\\b', '\\bagain\\b'] },
      { nome: 'confirmação', padroes: ['\\bjust to confirm\\b', '\\bdo you mean\\b', '\\bright\\?', '\\bso,? (?:the|you)\\b', '\\bconfirm\\b'] },
    ],
    tagsChave: ['explicar-para'],
    dicas: ["Sorry, I didn't catch ...", 'Could you ...?', 'Just to confirm, ...?'],
    modelo: "Sorry, I didn't catch the last part. Could you repeat that, please? Just to confirm, the delivery is next Wednesday, right?",
  },
  reteste: [
    'Na recepção de um hotel, o atendente disse o número do quarto e o horário do café rápido demais. Escreva o que você diria.',
    'Numa entrevista, você não entendeu a pergunta. Escreva como pediria para reformular.',
  ],
  conversa: 'apresentacao',
});

M.push({
  id: 'atender',
  titulo: 'Receber e ajudar um cliente',
  podeFazer: 'Consigo cumprimentar um cliente, entender o que ele precisa e oferecer ajuda.',
  nivel: 'A2',
  tags: ['sujeito-oculto', 'terceira-pessoa'],
  vocab: [
    { en: 'How can I help you?', pt: 'Como posso ajudar?', ex: 'Good morning! How can I help you?' },
    { en: 'Let me check.', pt: 'Deixa eu verificar.', ex: 'Let me check that for you.' },
    { en: 'available', pt: 'disponível', ex: 'This model is available in blue and black.' },
    { en: 'Would you like...?', pt: 'Você gostaria de...?', ex: 'Would you like to see the menu?' },
    { en: 'It takes...', pt: 'Leva / demora...', ex: 'Delivery takes about three days.' },
    { en: "Here's...", pt: 'Aqui está...', ex: "Here's your receipt." },
  ],
  explicacao: {
    titulo: 'Educação em inglês mora no "would" e no "could"',
    texto: 'No atendimento, o tom importa tanto quanto a gramática. "Would you like...?" e "Could you...?" soam gentis. Para dizer que algo existe, use "there is/are" (não "have"): "There is a parking lot behind the store". E frases como "É grátis" precisam de sujeito: "It\'s free".',
    estrutura: ['Hi, how can I help you?', 'Let me check that for you.', 'There is / There are [o que existe].', 'Would you like [oferta]?'],
  },
  exemplos: [
    { en: 'Good afternoon! How can I help you today?', pt: 'Boa tarde! Como posso ajudar hoje?' },
    { en: 'There are two sizes: medium and large.', pt: 'Tem dois tamanhos: médio e grande.' },
    { en: "It's free for orders over 200 reais.", pt: 'É grátis para pedidos acima de 200 reais.' },
    { en: 'Would you like me to send it by email?', pt: 'Quer que eu envie por e-mail?' },
  ],
  exercicios: [
    { id: 'atender-1', tipo: 'escolha', habilidade: 'gramatica', tag: 'sujeito-oculto', dif: 1, enunciado: '"Tem estacionamento atrás da loja."', opcoes: ["There's a parking lot behind the store.", 'Have a parking lot behind the store.', 'Has parking behind the store.'], resposta: 0 },
    { id: 'atender-2', tipo: 'lacuna', habilidade: 'gramatica', tag: 'sujeito-oculto', dif: 1, frase: "___'s free for students.", resposta: ['It'] },
    { id: 'atender-3', tipo: 'lacuna', habilidade: 'vocabulario', dif: 2, frase: '___ you like to try a different size?', resposta: ['Would'] },
    { id: 'atender-4', tipo: 'escuta', habilidade: 'escuta', dif: 2, audio: "Hi, I bought this jacket yesterday, but it's too small. Can I exchange it?", pergunta: 'O que o cliente quer?', opcoes: ['Trocar a jaqueta por ser pequena', 'Comprar outra jaqueta igual', 'Devolver porque não gostou da cor'], resposta: 0 },
    { id: 'atender-5', tipo: 'escuta', habilidade: 'escuta', dif: 3, audio: 'Do you deliver to other cities? And how long does it take?', pergunta: 'O que o cliente pergunta?', opcoes: ['Se entregam em outras cidades e quanto tempo leva', 'Quanto custa o produto e como pagar', 'Onde fica a loja e qual o horário'], resposta: 0 },
    { id: 'atender-6', tipo: 'traduzir', habilidade: 'escrita', dif: 2, pt: 'Deixa eu verificar para você.', aceitas: ['Let me check that for you', 'Let me check for you', 'Let me check it for you'] },
    { id: 'atender-7', tipo: 'ordenar', habilidade: 'gramatica', dif: 2, palavras: ['Delivery', 'takes', 'about', 'three', 'business', 'days'], resposta: 'Delivery takes about three business days' },
    { id: 'atender-8', tipo: 'ditado', habilidade: 'escuta', dif: 2, audio: 'How can I help you today?', resposta: ['How can I help you today'], sufixo: '?' },
  ],
  tarefa: {
    enunciado: 'Um turista entra no seu negócio (ou te escreve no WhatsApp) perguntando se vocês têm um produto e se entregam. Escreva sua resposta.',
    minPalavras: 25,
    elementos: [
      { nome: 'cumprimento ou oferta de ajuda', padroes: ['\\bhow can i help\\b', '\\bhi\\b', '\\bhello\\b', '\\bgood (?:morning|afternoon|evening)\\b', '\\bthanks for\\b'] },
      { nome: 'informação clara', padroes: ['\\bthere (?:is|are)\\b', "\\bthere'?s\\b", "\\bit'?s\\b", '\\bit takes\\b', '\\bwe (?:have|deliver|open)\\b'] },
      { nome: 'oferta educada', padroes: ['\\bwould you like\\b', '\\bcan i\\b', '\\bi can\\b', '\\blet me\\b'] },
    ],
    tagsChave: ['sujeito-oculto', 'terceira-pessoa'],
    dicas: ['Hi! Thanks for your message.', 'Yes, we have ... / There are ...', 'Delivery takes ...', 'Would you like ...?'],
    modelo: "Hi! Thanks for your message. Yes, we have that model in black and white. We deliver to the whole city, and it takes about two days. It's free for orders over 150 reais. Would you like me to reserve one for you?",
  },
  reteste: [
    'Um cliente estrangeiro liga perguntando o horário de funcionamento e se precisa agendar. Escreva sua resposta.',
    'Uma pessoa pede uma recomendação de produto ou serviço para um presente. Responda oferecendo duas opções.',
  ],
  conversa: 'cliente',
});

M.push({
  id: 'reclamacao',
  titulo: 'Resolver uma reclamação com calma',
  podeFazer: 'Consigo ouvir uma reclamação, pedir desculpas e propor uma solução.',
  nivel: 'B1',
  tags: ['passado-irregular', 'perguntas-do'],
  vocab: [
    { en: "I'm sorry to hear that.", pt: 'Sinto muito por isso.', ex: "I'm sorry to hear that your order was late." },
    { en: 'I understand.', pt: 'Entendo.', ex: 'I understand. That must be frustrating.' },
    { en: 'Could you give me your order number?', pt: 'Pode me passar o número do pedido?', ex: 'Could you give me your order number, please?' },
    { en: "I'll...", pt: 'Eu vou... (promessa agora)', ex: "I'll send a new one today." },
    { en: 'refund', pt: 'reembolso', ex: 'We can give you a full refund.' },
    { en: 'replacement', pt: 'substituição, troca', ex: 'We can send a replacement tomorrow.' },
  ],
  explicacao: {
    titulo: 'Escutar, reconhecer, resolver',
    texto: 'Em reclamação, primeiro reconheça o sentimento ("I\'m sorry to hear that"), depois entenda o que aconteceu (perguntas com "did": "When did you receive it?") e por fim diga o que você vai fazer com "I\'ll...". O "will" contraído em "I\'ll" é a forma natural de prometer uma ação.',
    estrutura: ["I'm sorry to hear that.", 'Could you tell me what happened? / When did you [verbo]?', "I'll [solução] / We can [opção] or [opção].", 'Is there anything else I can help with?'],
  },
  exemplos: [
    { en: "I'm really sorry about the delay.", pt: 'Sinto muito pelo atraso.' },
    { en: 'When did you place the order?', pt: 'Quando você fez o pedido?' },
    { en: "I'll check with the warehouse and call you back in an hour.", pt: 'Vou verificar com o estoque e te ligo em uma hora.' },
    { en: 'We can send a replacement or give you a refund. Which do you prefer?', pt: 'Podemos enviar outro ou reembolsar. O que você prefere?' },
  ],
  exercicios: [
    { id: 'reclamacao-1', tipo: 'escolha', habilidade: 'vocabulario', dif: 1, enunciado: 'Primeira frase ideal para uma reclamação:', opcoes: ["I'm sorry to hear that.", "It's not my fault.", 'Calm down.'], resposta: 0 },
    { id: 'reclamacao-2', tipo: 'lacuna', habilidade: 'gramatica', tag: 'perguntas-do', dif: 2, frase: 'When ___ you receive the package?', resposta: ['did'] },
    { id: 'reclamacao-3', tipo: 'escolha', habilidade: 'gramatica', tag: 'perguntas-do', dif: 2, enunciado: 'Qual pergunta está certa?', opcoes: ['What happened when you opened the box?', 'What did happened when you opened the box?', 'What happen when you opened the box?'], resposta: 0, explica: 'Quando a pergunta é sobre o próprio sujeito ("o que aconteceu"), não usa did: What happened?' },
    { id: 'reclamacao-4', tipo: 'escuta', habilidade: 'escuta', dif: 2, audio: 'I ordered a blue chair, but you sent a red one. And it arrived a week late.', pergunta: 'Quais são os problemas?', opcoes: ['Cor errada e atraso', 'Cadeira quebrada', 'Cobrança duplicada'], resposta: 0 },
    { id: 'reclamacao-5', tipo: 'escuta', habilidade: 'escuta', dif: 3, audio: "I'm really sorry about that. I'll send the right color tomorrow, and you don't need to return the red one.", pergunta: 'Qual foi a solução?', opcoes: ['Enviar a cor certa e o cliente fica com a outra', 'Reembolso total do valor pago', 'Desconto na próxima compra na loja'], resposta: 0 },
    { id: 'reclamacao-6', tipo: 'traduzir', habilidade: 'escrita', dif: 3, pt: 'Vou verificar e te ligo de volta em uma hora.', aceitas: ["I'll check and call you back in an hour", 'I will check and call you back in an hour', "I'll check and call you back in one hour", "I'll check it and call you back in an hour"] },
    { id: 'reclamacao-7', tipo: 'lacuna', habilidade: 'vocabulario', dif: 2, frase: 'We can send a ___ or give you a full refund.', resposta: ['replacement', 'new one'] },
    { id: 'reclamacao-8', tipo: 'ditado', habilidade: 'escuta', dif: 2, audio: "I'm sorry to hear that.", resposta: ["I'm sorry to hear that", 'I am sorry to hear that'] },
  ],
  tarefa: {
    enunciado: 'Um cliente escreveu: "My order arrived broken and nobody answered my emails." Escreva sua resposta: reconheça, pergunte o que precisa e proponha uma solução.',
    minPalavras: 35,
    elementos: [
      { nome: 'reconhecer o problema', padroes: ["\\bi'?m (?:so |really |very )?sorry\\b", '\\bi apologi[sz]e\\b', '\\bi understand\\b'] },
      { nome: 'uma pergunta', padroes: ['\\?'] },
      { nome: 'solução com "I\'ll" ou "we can"', padroes: ["\\bi'?ll\\b", '\\bi will\\b', '\\bwe can\\b', "\\bwe'?ll\\b", '\\bwe will\\b'] },
    ],
    tagsChave: ['perguntas-do', 'passado-irregular', 'sujeito-oculto'],
    dicas: ["I'm really sorry about ...", 'Could you send me ...?', "I'll ... / We can ... or ...", 'Thank you for your patience.'],
    modelo: "Hi Mr. Lee, I'm really sorry to hear that, and I apologize for the late answer. Could you send me a photo of the product and your order number? I'll send a new one today, or we can give you a full refund. Which do you prefer?",
  },
  reteste: [
    'Um hóspede reclama que o quarto não foi limpo. Escreva sua resposta.',
    'Um colega de outro país reclama que você não respondeu o e-mail dele a tempo. Responda com calma.',
  ],
  conversa: 'cliente',
});

M.push({
  id: 'viagem-chegada',
  titulo: 'Aeroporto e hotel',
  podeFazer: 'Consigo passar pela imigração, fazer check-in no hotel e resolver um problema simples.',
  nivel: 'A1',
  tags: ['perguntas-do', 'idade-have'],
  vocab: [
    { en: 'What is the purpose of your visit?', pt: 'Qual o motivo da sua visita?', ex: 'What is the purpose of your visit? / Tourism.' },
    { en: "I'm here on vacation / for work.", pt: 'Estou de férias / a trabalho.', ex: "I'm here on vacation for ten days." },
    { en: 'I have a reservation under...', pt: 'Tenho uma reserva em nome de...', ex: 'I have a reservation under Souza.' },
    { en: 'check-in / check-out', pt: 'entrada / saída', ex: 'What time is check-out?' },
    { en: 'luggage', pt: 'bagagem', ex: 'Can I leave my luggage here?' },
    { en: "doesn't work", pt: 'não funciona', ex: "The air conditioning doesn't work." },
  ],
  explicacao: {
    titulo: 'Respostas curtas e perguntas com "Can I...?"',
    texto: 'Na imigração, responda curto e claro. No hotel, "Can I...?" e "Could you...?" resolvem quase tudo. Para dizer que algo não funciona: "The shower doesn\'t work" (doesn\'t, porque é "it").',
    estrutura: ["I'm here on vacation / for a conference.", "I'm staying at [hotel] for [tempo].", 'I have a reservation under [sobrenome].', 'Can I [pedido]? / The [coisa] doesn\'t work.'],
  },
  exemplos: [
    { en: "I'm here for a conference. I'm staying for five days.", pt: 'Estou aqui para uma conferência. Fico cinco dias.' },
    { en: 'I have a reservation under Oliveira.', pt: 'Tenho uma reserva em nome de Oliveira.' },
    { en: 'Can I leave my luggage here after check-out?', pt: 'Posso deixar minha bagagem aqui depois do check-out?' },
    { en: "The Wi-Fi doesn't work in my room.", pt: 'O Wi-Fi não funciona no meu quarto.' },
  ],
  exercicios: [
    { id: 'viagem1-1', tipo: 'escuta', habilidade: 'escuta', dif: 1, audio: 'What is the purpose of your visit?', pergunta: 'O que o agente perguntou?', opcoes: ['O motivo da viagem', 'Quanto dinheiro você tem', 'Onde você trabalha'], resposta: 0 },
    { id: 'viagem1-2', tipo: 'escuta', habilidade: 'escuta', dif: 2, audio: 'How long are you staying, and where are you staying?', pergunta: 'Quais são as duas perguntas?', opcoes: ['Quanto tempo você fica e onde vai ficar', 'Quando você chegou e com quem', 'Se é a primeira vez e por quê'], resposta: 0 },
    { id: 'viagem1-3', tipo: 'lacuna', habilidade: 'gramatica', tag: 'terceira-pessoa', dif: 1, frase: "The shower ___ work.", resposta: ["doesn't", 'does not'] },
    { id: 'viagem1-4', tipo: 'escolha', habilidade: 'vocabulario', dif: 1, enunciado: '"Tenho uma reserva em nome de Lima."', opcoes: ['I have a reservation under Lima.', 'I have a reserve in name of Lima.', 'I am a reservation for Lima.'], resposta: 0 },
    { id: 'viagem1-5', tipo: 'ordenar', habilidade: 'gramatica', dif: 2, palavras: ['Can', 'I', 'leave', 'my', 'luggage', 'here'], resposta: 'Can I leave my luggage here', sufixo: '?' },
    { id: 'viagem1-6', tipo: 'escuta', habilidade: 'escuta', dif: 3, audio: "Breakfast is served from seven to ten on the second floor. Check-out is at noon.", pergunta: 'Até que horas é o check-out?', opcoes: ['Meio-dia', 'Dez horas', 'Sete horas'], resposta: 0 },
    { id: 'viagem1-7', tipo: 'traduzir', habilidade: 'escrita', dif: 2, pt: 'Estou aqui de férias por duas semanas.', aceitas: ["I'm here on vacation for two weeks", 'I am here on vacation for two weeks', "I'm here on holiday for two weeks", 'I am here on holiday for two weeks'] },
    { id: 'viagem1-8', tipo: 'ditado', habilidade: 'escuta', dif: 2, audio: 'What time is check-out?', resposta: ['What time is check-out', 'What time is checkout', 'What time is check out'], sufixo: '?' },
  ],
  tarefa: {
    enunciado: 'Você chegou ao hotel, mas o ar-condicionado do quarto não funciona e você quer saber o horário do café. Escreva o que diria na recepção.',
    minPalavras: 20,
    elementos: [
      { nome: 'o problema', padroes: ["\\bdoesn'?t work\\b", '\\bdoes not work\\b', '\\bbroken\\b', '\\bproblem\\b', "\\bisn'?t working\\b"] },
      { nome: 'uma pergunta', padroes: ['\\?'] },
    ],
    tagsChave: ['terceira-pessoa', 'sujeito-oculto'],
    dicas: ["Hi, I'm in room ...", "The ... doesn't work.", 'Could you ...?', 'What time is ...?'],
    modelo: "Hi, I'm in room 512. The air conditioning doesn't work. Could you send someone to check it, please? Also, what time is breakfast?",
  },
  reteste: [
    'Sua mala não chegou no aeroporto. Escreva o que você diria no balcão da companhia aérea.',
    'Você quer trocar de quarto porque o seu é muito barulhento. Escreva o pedido.',
  ],
  conversa: 'viagem',
});

M.push({
  id: 'viagem-cidade',
  titulo: 'Pedir comida e informações na rua',
  podeFazer: 'Consigo pedir comida, perguntar o caminho e entender a resposta.',
  nivel: 'A1',
  tags: ['sujeito-oculto', 'preposicoes'],
  vocab: [
    { en: "I'd like...", pt: 'Eu gostaria de...', ex: "I'd like the chicken salad, please." },
    { en: 'Could I have the check?', pt: 'Pode trazer a conta?', ex: 'Excuse me, could I have the check, please?' },
    { en: 'How do I get to...?', pt: 'Como chego em...?', ex: 'How do I get to the train station?' },
    { en: 'turn left / right', pt: 'vire à esquerda / direita', ex: 'Turn left at the bank.' },
    { en: "It's ... minutes away.", pt: 'Fica a ... minutos.', ex: "It's ten minutes away on foot." },
    { en: 'Is there a ... near here?', pt: 'Tem um(a) ... aqui perto?', ex: 'Is there a pharmacy near here?' },
  ],
  explicacao: {
    titulo: '"I\'d like" para pedir, "Is there" para procurar',
    texto: '"I\'d like..." é a forma educada de pedir (I would like). Para saber se algo existe por perto, use "Is there a... near here?" e não "Have a...?". Na resposta do caminho, preste atenção em left/right, straight e nos números.',
    estrutura: ["I'd like [prato/bebida], please.", 'Could I have [the check / some water]?', 'Excuse me, is there a [lugar] near here?', 'How do I get to [lugar]?'],
  },
  exemplos: [
    { en: "I'd like a coffee with milk, please.", pt: 'Eu gostaria de um café com leite, por favor.' },
    { en: 'Is there a supermarket near here?', pt: 'Tem um mercado aqui perto?' },
    { en: 'Go straight and turn right at the second light.', pt: 'Siga reto e vire à direita no segundo semáforo.' },
    { en: "It's about five minutes away on foot.", pt: 'Fica a uns cinco minutos a pé.' },
  ],
  exercicios: [
    { id: 'viagem2-1', tipo: 'escolha', habilidade: 'gramatica', tag: 'sujeito-oculto', dif: 1, enunciado: '"Tem uma farmácia aqui perto?"', opcoes: ['Is there a pharmacy near here?', 'Have a pharmacy near here?', 'Has pharmacy near here?'], resposta: 0 },
    { id: 'viagem2-2', tipo: 'lacuna', habilidade: 'vocabulario', dif: 1, frase: "I'd ___ the soup of the day, please.", resposta: ['like', 'have'] },
    { id: 'viagem2-3', tipo: 'escuta', habilidade: 'escuta', dif: 2, audio: 'Go straight for two blocks and turn left. The museum is on your right.', pergunta: 'Como chegar ao museu?', opcoes: ['Reto duas quadras, virar à esquerda, fica à direita', 'Virar à direita e seguir reto por três quadras', 'Reto uma quadra, o museu fica à esquerda'], resposta: 0 },
    { id: 'viagem2-4', tipo: 'escuta', habilidade: 'escuta', dif: 2, audio: "That's twenty-four fifty. Would you like to pay by card?", pergunta: 'Quanto deu a conta?', opcoes: ['24,50', '42,50', '20,45'], resposta: 0 },
    { id: 'viagem2-5', tipo: 'ordenar', habilidade: 'gramatica', dif: 1, palavras: ['How', 'do', 'I', 'get', 'to', 'the', 'station'], resposta: 'How do I get to the station', sufixo: '?' },
    { id: 'viagem2-6', tipo: 'traduzir', habilidade: 'escrita', dif: 2, pt: 'Pode trazer a conta, por favor?', aceitas: ['Could I have the check, please', 'Can I have the check, please', 'Could I have the bill, please', 'Can I have the bill, please', 'Could we have the check, please', 'Could we have the bill, please'], sufixo: '?' },
    { id: 'viagem2-7', tipo: 'ditado', habilidade: 'escuta', dif: 2, audio: "It's ten minutes away on foot.", resposta: ["It's ten minutes away on foot", 'It is ten minutes away on foot', "It's 10 minutes away on foot"] },
    { id: 'viagem2-8', tipo: 'lacuna', habilidade: 'gramatica', tag: 'sujeito-oculto', dif: 2, frase: "___ very cold today. Let's take a taxi.", resposta: ["It's", 'It is'] },
  ],
  tarefa: {
    enunciado: 'Você está num café em outro país. Peça algo para comer e beber e pergunte como chegar a um ponto turístico.',
    minPalavras: 20,
    elementos: [
      { nome: 'um pedido educado', padroes: ["\\bi'?d like\\b", '\\bi would like\\b', '\\bcould i have\\b', '\\bcan i have\\b', "\\bi'?ll have\\b"] },
      { nome: 'pergunta de caminho', padroes: ['\\bhow do i get\\b', '\\bhow can i get\\b', '\\bis there\\b', '\\bwhere is\\b', '\\bhow far\\b'] },
    ],
    tagsChave: ['sujeito-oculto', 'perguntas-do'],
    dicas: ["I'd like ..., please.", 'Could I have ...?', 'Excuse me, how do I get to ...?'],
    modelo: "Hi! I'd like a cheese sandwich and an orange juice, please. Excuse me, how do I get to the old town from here? Is it far?",
  },
  reteste: [
    'Você está perdido(a) e precisa achar uma farmácia e voltar para o hotel. Escreva o que perguntaria.',
    'No restaurante, você quer saber se um prato tem amendoim porque tem alergia. Escreva sua pergunta e o pedido.',
  ],
  conversa: 'viagem',
});

M.push({
  id: 'fim-de-semana',
  titulo: 'Contar como foi seu fim de semana',
  podeFazer: 'Consigo contar uma experiência recente no passado e fazer perguntas sobre a do outro.',
  nivel: 'A2',
  tags: ['passado-irregular', 'perguntas-do'],
  vocab: [
    { en: 'How was your weekend?', pt: 'Como foi seu fim de semana?', ex: 'Hey! How was your weekend?' },
    { en: 'It was...', pt: 'Foi...', ex: 'It was really relaxing.' },
    { en: 'We went to...', pt: 'Nós fomos a...', ex: "We went to my parents' house." },
    { en: 'I stayed home.', pt: 'Fiquei em casa.', ex: 'I stayed home and watched a series.' },
    { en: 'What did you do?', pt: 'O que você fez?', ex: 'What about you? What did you do?' },
    { en: 'Sounds fun!', pt: 'Parece divertido!', ex: 'A barbecue? Sounds fun!' },
  ],
  explicacao: {
    titulo: 'Contar no passado e devolver a pergunta',
    texto: 'O papo de segunda-feira é a conversa mais comum entre colegas. Você conta no passado (went, had, saw, stayed) e devolve: "What about you?" / "What did you do?". Lembre: com "did", o verbo volta para a forma base: "What did you DO?", "Where did you GO?".',
    estrutura: ['It was [adjetivo].', 'On Saturday I [passado] and [passado].', 'On Sunday we [passado].', 'What about you? What did you do?'],
  },
  exemplos: [
    { en: 'It was great! On Saturday I went to a friend\'s birthday party.', pt: 'Foi ótimo! No sábado fui ao aniversário de um amigo.' },
    { en: 'On Sunday I stayed home and cooked lasagna.', pt: 'No domingo fiquei em casa e fiz lasanha.' },
    { en: 'We saw a really funny movie.', pt: 'Vimos um filme muito engraçado.' },
    { en: 'What about you? Did you do anything special?', pt: 'E você? Fez algo especial?' },
  ],
  exercicios: [
    { id: 'fds-1', tipo: 'lacuna', habilidade: 'gramatica', tag: 'passado-irregular', dif: 1, frase: 'On Saturday I ___ (go) to the beach.', resposta: ['went'] },
    { id: 'fds-2', tipo: 'escolha', habilidade: 'gramatica', tag: 'perguntas-do', dif: 1, enunciado: 'Pergunta correta:', opcoes: ['What did you do on Sunday?', 'What did you did on Sunday?', 'What you did on Sunday?'], resposta: 0 },
    { id: 'fds-3', tipo: 'lacuna', habilidade: 'gramatica', tag: 'passado-irregular', dif: 2, frase: 'We ___ (have) a barbecue and ___ (see) some old friends.', resposta: ['had saw', 'had, saw'], multi: true },
    { id: 'fds-4', tipo: 'escuta', habilidade: 'escuta', tag: 'passado-irregular', dif: 2, audio: 'It was quiet. I stayed home on Saturday, but on Sunday I took my kids to the park.', pergunta: 'O que a pessoa fez no domingo?', opcoes: ['Levou os filhos ao parque', 'Ficou em casa descansando o dia todo', 'Foi a uma festa de aniversário'], resposta: 0 },
    { id: 'fds-5', tipo: 'escuta', habilidade: 'escuta', dif: 3, audio: "We drove to the mountains, but it rained all day, so we spent most of the time in a café.", pergunta: 'Por que ficaram no café?', opcoes: ['Choveu o dia todo', 'O carro quebrou', 'Estava muito frio para andar'], resposta: 0 },
    { id: 'fds-6', tipo: 'ordenar', habilidade: 'gramatica', tag: 'perguntas-do', dif: 2, palavras: ['Where', 'did', 'you', 'go', 'last', 'weekend'], resposta: 'Where did you go last weekend', sufixo: '?' },
    { id: 'fds-7', tipo: 'traduzir', habilidade: 'escrita', tag: 'passado-irregular', dif: 2, pt: 'No sábado eu fiquei em casa e assisti a uma série.', aceitas: ['On Saturday I stayed home and watched a series', 'On Saturday I stayed at home and watched a series', 'On Saturday I stayed home and watched a show', 'On Saturday I stayed home and watched a TV series'] },
    { id: 'fds-8', tipo: 'ditado', habilidade: 'escuta', dif: 2, audio: 'How was your weekend?', resposta: ['How was your weekend'], sufixo: '?' },
  ],
  tarefa: {
    enunciado: 'Um colega pergunta "How was your weekend?". Conte o que você fez (pelo menos 3 coisas) e devolva a pergunta.',
    minPalavras: 30,
    elementos: [
      { nome: 'como foi', padroes: ['\\bit was\\b', "\\bit'?s been\\b"] },
      { nome: 'ações no passado', padroes: ['\\bi (?:went|had|saw|stayed|watched|visited|cooked|played|took|made|met|ate|bought|spent|did|read|slept|walked)\\b', '\\bwe (?:went|had|saw|stayed|watched|visited|cooked|played|took|made|met|ate|bought|spent|did)\\b'] },
      { nome: 'devolver a pergunta', padroes: ['\\bwhat about you\\b', '\\bwhat did you do\\b', '\\bhow about you\\b', '\\band you\\b', '\\bhow was yours\\b', '\\bdid you\\b'] },
    ],
    tagsChave: ['passado-irregular', 'perguntas-do'],
    dicas: ['It was ...', 'On Saturday I ...', 'On Sunday we ...', 'What about you?'],
    modelo: "It was really nice! On Saturday I went to the farmers' market with my wife, and in the evening we had dinner with friends. On Sunday I stayed home and watched a football game. What about you? What did you do?",
  },
  reteste: [
    'Conte como foram suas últimas férias ou um feriado: onde foi, o que fez e o que mais gostou.',
    'Conte o que aconteceu num dia de trabalho ou estudo que foi diferente do normal.',
  ],
  conversa: 'fim-de-semana',
});

M.push({
  id: 'rotina',
  titulo: 'Falar da sua rotina e do que você gosta',
  podeFazer: 'Consigo descrever minha rotina e meus interesses e perguntar sobre os da outra pessoa.',
  nivel: 'A1',
  tags: ['terceira-pessoa', 'falsos-cognatos'],
  vocab: [
    { en: 'usually', pt: 'normalmente', ex: 'I usually wake up at 6:30.' },
    { en: 'on weekdays', pt: 'nos dias de semana', ex: 'On weekdays I work from home.' },
    { en: 'I enjoy...', pt: 'Eu gosto de...', ex: 'I enjoy cooking for my friends.' },
    { en: 'in my free time', pt: 'no meu tempo livre', ex: 'In my free time, I play the guitar.' },
    { en: 'sometimes', pt: 'às vezes', ex: 'Sometimes I go running before work.' },
    { en: 'What do you do for fun?', pt: 'O que você faz para se divertir?', ex: 'So, what do you do for fun?' },
  ],
  explicacao: {
    titulo: 'Presente simples para rotina',
    texto: 'Rotina usa o presente simples: "I work", "I wake up". Ao falar de outra pessoa (she, he, my wife), o verbo ganha -s: "She works at night". Palavras de frequência (usually, sometimes, always) vêm antes do verbo. E cuidado: "eventualmente" (de vez em quando) é "sometimes" ou "occasionally".',
    estrutura: ['On weekdays, I usually [verbo].', 'In my free time, I enjoy [verbo-ing].', 'My [pessoa] [verbo com -s].', 'What do you do for fun?'],
  },
  exemplos: [
    { en: 'On weekdays I usually start work at eight.', pt: 'Nos dias de semana normalmente começo a trabalhar às oito.' },
    { en: 'My husband works at night, so we have dinner late.', pt: 'Meu marido trabalha à noite, então jantamos tarde.' },
    { en: 'In my free time, I enjoy hiking and cooking.', pt: 'No meu tempo livre, gosto de fazer trilha e cozinhar.' },
    { en: 'Sometimes I go to the gym after work.', pt: 'Às vezes vou à academia depois do trabalho.' },
  ],
  exercicios: [
    { id: 'rotina-1', tipo: 'lacuna', habilidade: 'gramatica', tag: 'terceira-pessoa', dif: 1, frase: 'My sister ___ (live) in Canada.', resposta: ['lives'] },
    { id: 'rotina-2', tipo: 'escolha', habilidade: 'vocabulario', tag: 'falsos-cognatos', dif: 2, enunciado: '"De vez em quando eu viajo a trabalho."', opcoes: ['Sometimes I travel for work.', 'Eventually I travel for work.', 'Actually I travel for work.'], resposta: 0 },
    { id: 'rotina-3', tipo: 'ordenar', habilidade: 'gramatica', dif: 1, palavras: ['I', 'usually', 'wake', 'up', 'at', 'seven'], resposta: 'I usually wake up at seven' },
    { id: 'rotina-4', tipo: 'escuta', habilidade: 'escuta', dif: 1, audio: 'I usually work from home on Mondays and Fridays.', pergunta: 'Quando a pessoa trabalha de casa?', opcoes: ['Segundas e sextas', 'Todos os dias', 'Só nos fins de semana'], resposta: 0 },
    { id: 'rotina-5', tipo: 'escuta', habilidade: 'escuta', tag: 'terceira-pessoa', dif: 2, audio: 'My wife teaches math, and she goes to school very early, so I take the kids to school.', pergunta: 'Quem leva as crianças à escola?', opcoes: ['A pessoa que está falando', 'A esposa', 'Os avós'], resposta: 0 },
    { id: 'rotina-6', tipo: 'traduzir', habilidade: 'escrita', dif: 2, pt: 'No meu tempo livre, eu gosto de ler.', aceitas: ['In my free time, I like reading', 'In my free time, I like to read', 'In my free time, I enjoy reading', 'In my free time I like reading', 'In my free time I enjoy reading'] },
    { id: 'rotina-7', tipo: 'lacuna', habilidade: 'gramatica', tag: 'terceira-pessoa', dif: 2, frase: "He ___ (not / work) on weekends.", resposta: ["doesn't work", 'does not work'] },
    { id: 'rotina-8', tipo: 'ditado', habilidade: 'escuta', dif: 2, audio: 'What do you do for fun?', resposta: ['What do you do for fun'], sufixo: '?' },
  ],
  tarefa: {
    enunciado: 'Descreva um dia normal seu, o que você gosta de fazer no tempo livre e pergunte sobre a rotina da outra pessoa.',
    minPalavras: 30,
    elementos: [
      { nome: 'sua rotina', padroes: ['\\bi (?:usually|always|often|normally)\\b', '\\bon weekdays\\b', '\\bevery (?:day|morning)\\b', '\\bi wake up\\b', '\\bi start\\b'] },
      { nome: 'algo que você gosta', padroes: ['\\bi (?:enjoy|like|love)\\b', '\\bin my free time\\b'] },
      { nome: 'uma pergunta', padroes: ['\\?'] },
    ],
    tagsChave: ['terceira-pessoa', 'falsos-cognatos'],
    dicas: ['On weekdays, I usually ...', 'In my free time, I enjoy ...', 'What about you? What do you ...?'],
    modelo: 'On weekdays I usually wake up at six and go to the office by bus. I finish work at five. In my free time, I enjoy playing soccer and watching documentaries. What about you? What do you do for fun?',
  },
  reteste: [
    'Descreva a rotina de alguém da sua família (use he ou she).',
    'Um novo colega quer saber como é a rotina no seu trabalho. Explique um dia típico.',
  ],
  conversa: 'fim-de-semana',
});

M.push({
  id: 'planos',
  titulo: 'Falar de planos e objetivos',
  podeFazer: 'Consigo falar dos meus planos e objetivos de curto e longo prazo.',
  nivel: 'A2',
  tags: ['falsos-cognatos', 'make-do'],
  vocab: [
    { en: "I'm going to...", pt: 'Eu vou... (plano)', ex: "I'm going to start a new course in March." },
    { en: 'I plan to...', pt: 'Eu pretendo...', ex: 'I plan to move to the finance area.' },
    { en: 'My goal is to...', pt: 'Meu objetivo é...', ex: 'My goal is to lead a team.' },
    { en: 'in the long term', pt: 'a longo prazo', ex: 'In the long term, I want to open my own business.' },
    { en: "I'd like to...", pt: 'Eu gostaria de...', ex: "I'd like to work abroad for a few years." },
    { en: 'to grow', pt: 'crescer', ex: 'I want to grow in this company.' },
  ],
  explicacao: {
    titulo: 'Planos: going to, plan to, would like to',
    texto: 'Para planos já decididos, use "I\'m going to...". Para intenções, "I plan to..." ou "I\'d like to...". Aqui mora um falso cognato famoso: "pretender" NÃO é "pretend" (fingir). E "fazer um curso" é "take a course". Na entrevista, "Where do you see yourself in five years?" pede exatamente isso.',
    estrutura: ["In the short term, I'm going to [plano].", 'My goal is to [objetivo].', 'In the long term, I plan to / I\'d like to [plano].'],
  },
  exemplos: [
    { en: "Next year I'm going to take a project management course.", pt: 'Ano que vem vou fazer um curso de gestão de projetos.' },
    { en: 'I plan to apply for a senior position.', pt: 'Pretendo me candidatar a uma vaga sênior.' },
    { en: 'My goal is to work with international clients.', pt: 'Meu objetivo é trabalhar com clientes internacionais.' },
    { en: "In five years, I'd like to lead my own team.", pt: 'Em cinco anos, gostaria de liderar minha própria equipe.' },
  ],
  exercicios: [
    { id: 'planos-1', tipo: 'escolha', habilidade: 'vocabulario', tag: 'falsos-cognatos', dif: 1, enunciado: '"Pretendo mudar de área."', opcoes: ['I plan to change careers.', 'I pretend to change careers.', 'I pretend change careers.'], resposta: 0 },
    { id: 'planos-2', tipo: 'lacuna', habilidade: 'gramatica', dif: 1, frase: "I'm ___ to start the new job in May.", resposta: ['going'] },
    { id: 'planos-3', tipo: 'lacuna', habilidade: 'vocabulario', tag: 'make-do', dif: 2, frase: "I'm going to ___ a course in data analysis.", resposta: ['take', 'do'] },
    { id: 'planos-4', tipo: 'escuta', habilidade: 'escuta', dif: 2, audio: 'In the short term, I want to improve my English. In the long term, I plan to work in Canada.', pergunta: 'Qual é o plano de longo prazo?', opcoes: ['Trabalhar no Canadá', 'Melhorar o inglês', 'Mudar de empresa no Brasil'], resposta: 0 },
    { id: 'planos-5', tipo: 'ordenar', habilidade: 'gramatica', dif: 2, palavras: ['My', 'goal', 'is', 'to', 'lead', 'a', 'team'], resposta: 'My goal is to lead a team' },
    { id: 'planos-6', tipo: 'traduzir', habilidade: 'escrita', tag: 'falsos-cognatos', dif: 3, pt: 'Eu pretendo fazer um mestrado no exterior.', aceitas: ["I plan to do a master's degree abroad", "I intend to do a master's degree abroad", "I plan to do a master's abroad", "I plan to study for a master's degree abroad", "I'm planning to do a master's degree abroad"] },
    { id: 'planos-7', tipo: 'escuta', habilidade: 'escuta', dif: 3, audio: "Honestly, I'd like to grow here. In five years, I see myself leading the analytics team.", pergunta: 'Onde a pessoa se vê em 5 anos?', opcoes: ['Liderando o time de análise na empresa', 'Em outra empresa, numa área diferente', 'Morando fora do país com a família'], resposta: 0 },
    { id: 'planos-8', tipo: 'ditado', habilidade: 'escuta', dif: 2, audio: "I'd like to work abroad.", resposta: ["I'd like to work abroad", 'I would like to work abroad'] },
  ],
  tarefa: {
    enunciado: 'Responda a "Where do you see yourself in five years?" com um plano de curto prazo e um de longo prazo.',
    minPalavras: 30,
    elementos: [
      { nome: 'plano de curto prazo', padroes: ["\\bi'?m going to\\b", '\\bi am going to\\b', '\\bnext (?:year|month)\\b', '\\bshort term\\b', '\\bfirst\\b'] },
      { nome: 'objetivo de longo prazo', padroes: ['\\bmy goal\\b', '\\bi plan to\\b', "\\bi'?d like to\\b", '\\bi would like to\\b', '\\blong term\\b', '\\bin (?:five|5|ten|10) years\\b', '\\bi see myself\\b'] },
    ],
    tagsChave: ['falsos-cognatos', 'make-do'],
    dicas: ["In the short term, I'm going to ...", 'My goal is to ...', "In five years, I'd like to ..."],
    modelo: "In the short term, I'm going to finish my certification in cloud computing. My goal is to become a specialist in this area. In five years, I'd like to lead a small team and help new developers grow.",
  },
  reteste: [
    'Conte para um amigo estrangeiro seus planos para o próximo ano (pessoais ou profissionais).',
    'Explique por que você está estudando inglês e o que pretende fazer quando estiver mais confiante.',
  ],
  conversa: 'entrevista-geral',
});

require('./missoes-extra').MISSOES_EXTRA.forEach(m => M.push(m));
require('./missoes-cotidiano').MISSOES_COTIDIANO.forEach(m => M.push(m));
require('./trilha-zero').TRILHA_ZERO.forEach(m => M.push(m));
require('./trilha-debate').TRILHA_DEBATE.forEach(m => M.push(m));
// "Caça ao erro": um exercício de detetive por missão antiga (as missões de debate trazem os seus)
const { detetivesDe } = require('./detetives');
for (const m of M) m.exercicios.push(...detetivesDe(m.id));
const { EXPLICACOES_ZERO } = require('./explicacoes-zero');
for (const m of M) for (const e of m.exercicios) if (!e.explica && EXPLICACOES_ZERO[e.id]) e.explica = EXPLICACOES_ZERO[e.id];

// Uma frase para falar em voz alta por missão: o exemplo mais curto (3 a 8 palavras) que não termina em pergunta longa.
for (const m of M) {
  if (m.exercicios.some(e => e.tipo === 'fala')) continue;
  const cand = m.exemplos.filter(x => { const n = x.en.trim().split(/\s+/).length; return n >= 3 && n <= 8; }).sort((a, b) => a.en.length - b.en.length)[0];
  if (cand) m.exercicios.push({ id: `${m.id}-fala`, tipo: 'fala', habilidade: 'fala', dif: m.nivel === 'A1' ? 1 : 2, frase: cand.en, audio: cand.en, pt: cand.pt });
}

const POR_ID = Object.fromEntries(M.map(m => [m.id, m]));
const TODOS_EXERCICIOS = Object.fromEntries(M.flatMap(m => m.exercicios.map(e => [e.id, { ...e, missao: m.id }])));

module.exports = { MISSOES: M, POR_ID, TODOS_EXERCICIOS };
