'use strict';
// Trilha "Debater em inglês": 6 missões para quem já está no B1 ou acima (B1, B2, B2, B2, C1, C1).
// Foco em argumentar, discordar com educação, escolher a palavra exata e mediar uma discussão.
// Mesma estrutura das outras missões (ver missoes.js). Tipos extras: "detetive" (caça ao erro) e
// `oponente` em escolhas (a pessoa do debate fala primeiro e o aluno escolhe a melhor resposta).
const { det } = require('./detetives');

const D = [];

// ---------- 1. Opinião + motivo + exemplo (B1) ----------
D.push({
  id: 'debate-opiniao',
  titulo: 'Dar sua opinião e justificar',
  podeFazer: 'Consigo dizer o que penso, explicar o motivo e dar um exemplo.',
  nivel: 'B1',
  tags: ['debate-expressoes'],
  vocab: [
    { en: 'In my opinion, ...', pt: 'Na minha opinião, ...', ex: 'In my opinion, small towns are calmer.' },
    { en: 'The way I see it, ...', pt: 'Do jeito que eu vejo, ...', ex: 'The way I see it, it depends on the budget.' },
    { en: 'I strongly believe that ...', pt: 'Acredito firmemente que ...', ex: 'I strongly believe that people need more free time.' },
    { en: 'The main reason is that ...', pt: 'O principal motivo é que ...', ex: 'The main reason is that it saves money.' },
    { en: 'For example, ...', pt: 'Por exemplo, ...', ex: 'For example, my team finished the project faster.' },
    { en: 'If you ask me, ...', pt: 'Se você quer saber a minha opinião, ...', ex: 'If you ask me, public transport should be cheaper.' },
  ],
  explicacao: {
    titulo: 'Opinião sozinha não convence: use o trio',
    texto: 'Num debate, "I like it" não basta. Use o trio opinião, motivo e exemplo. E um cuidado de brasileiro: para a SUA opinião diga "in my opinion" (nunca "according to me"). "According to" é só para fontes e outras pessoas: according to the report. Também é "make a point" e "make a decision", não "do".',
    estrutura: ['In my opinion, [sua posição].', 'The main reason is that [motivo].', 'For example, [exemplo real].', 'That is why I believe [conclusão].'],
  },
  exemplos: [
    { en: 'In my opinion, remote work is here to stay.', pt: 'Na minha opinião, o trabalho remoto veio para ficar.' },
    { en: 'The main reason is that people save two hours a day.', pt: 'O principal motivo é que as pessoas economizam duas horas por dia.' },
    { en: 'For example, my sister now has time to study at night.', pt: 'Por exemplo, minha irmã agora tem tempo para estudar à noite.' },
    { en: 'That is why I believe it works.', pt: 'É por isso que acredito que funciona.' },
  ],
  exercicios: [
    { id: 'debate-opiniao-1', tipo: 'escolha', habilidade: 'gramatica', tag: 'debate-expressoes', dif: 1, enunciado: 'Qual abertura funciona para dar a SUA opinião?', opcoes: ['In my opinion, remote work saves time.', 'According to me, remote work saves time.', 'Following my opinion, remote work saves time.'], resposta: 0, explica: '"In my opinion" é a forma natural. "According to" só vale para uma fonte (according to the report) ou outra pessoa.' },
    det('debate-opiniao-2', 'The way I see it, cities is more exciting than small towns.', 'is', 'are', '"Cities" é plural: cities are.', { dif: 1 }),
    { id: 'debate-opiniao-3', tipo: 'escolha', habilidade: 'fala', dif: 2, oponente: { nome: 'Dana', fala: 'I think life is easier in a big city. Do you agree?' }, enunciado: 'Qual resposta dá opinião E motivo?', opcoes: ['Not really. In my opinion, small towns are calmer, because there is less traffic.', 'Not really. I just prefer it.', 'Maybe yes, maybe no, whatever.'], resposta: 0, explica: 'Opinião (small towns are calmer) + motivo (because there is less traffic). É isso que torna a resposta forte.' },
    { id: 'debate-opiniao-4', tipo: 'lacuna', habilidade: 'gramatica', dif: 1, frase: 'The main reason ___ that it saves money.', resposta: ['is'], explica: '"The main reason is that..." introduz o motivo.' },
    { id: 'debate-opiniao-5', tipo: 'ordenar', habilidade: 'gramatica', dif: 2, palavras: ['In my opinion,', 'the biggest benefit', 'is', 'more free time'], resposta: 'In my opinion, the biggest benefit is more free time', explica: 'Opinião primeiro, depois o que você defende. Monte em blocos, como num argumento de verdade.' },
    { id: 'debate-opiniao-6', tipo: 'escuta', habilidade: 'escuta', dif: 2, audio: 'If you ask me, public transport should be free. The main reason is that it helps people with low income.', pergunta: 'Qual é o motivo da pessoa?', opcoes: ['Ajuda quem tem renda baixa', 'Reduz o trânsito', 'É mais rápido que o carro'], resposta: 0 },
    { id: 'debate-opiniao-7', tipo: 'ditado', habilidade: 'escuta', dif: 2, audio: 'The way I see it, it depends on the budget.', resposta: ['The way I see it, it depends on the budget', 'The way I see it it depends on the budget'] },
    { id: 'debate-opiniao-8', tipo: 'traduzir', habilidade: 'escrita', tag: 'debate-expressoes', dif: 2, pt: 'Na minha opinião, trabalhar em casa é mais produtivo.', aceitas: ['In my opinion, working from home is more productive', 'In my opinion, working at home is more productive', 'In my opinion, remote work is more productive', 'In my view, working from home is more productive'] },
    { id: 'debate-opiniao-9', tipo: 'leitura', habilidade: 'leitura', dif: 2, texto: "Some people say that social media brings friends closer. I disagree. In my view, it makes conversations shallow, because people react to posts instead of talking. For example, my cousin sends me emojis, but we never call.", pergunta: 'Por que a pessoa discorda?', opcoes: ['Acha que as conversas ficam superficiais', 'Acha que redes sociais são caras', 'Nunca usou redes sociais'], resposta: 0 },
  ],
  tarefa: {
    enunciado: 'Responda: "É melhor morar numa cidade grande ou numa cidade pequena?" Dê sua opinião, um motivo e um exemplo.',
    minPalavras: 35,
    elementos: [
      { nome: 'sua opinião', padroes: ['\\bin my (?:opinion|view)\\b', '\\bi (?:strongly )?(?:believe|think)\\b', '\\bthe way i see it\\b', '\\bif you ask me\\b'] },
      { nome: 'um motivo', padroes: ['\\bthe main reason\\b', '\\bbecause\\b', '\\bthat is why\\b', '\\bsince\\b'] },
      { nome: 'um exemplo', padroes: ['\\bfor (?:example|instance)\\b', '\\bsuch as\\b'] },
    ],
    tagsChave: ['debate-expressoes'],
    dicas: ['In my opinion, ...', 'The main reason is that ...', 'For example, ...', 'That is why I believe ...'],
    modelo: 'In my opinion, small towns are better for families. The main reason is that life is calmer and safer. For example, children can play outside without much traffic, and neighbors know each other. That is why I believe small towns offer a better quality of life.',
  },
  reteste: [
    'Um amigo pergunta: "Is it better to study at home or at a library?" Responda com opinião, motivo e exemplo.',
    'Alguém diz: "Everyone should learn a second language." Dê a sua opinião e justifique.',
  ],
  conversa: 'debate-opiniao',
});

// ---------- 2. Discordar com educação (B2) ----------
D.push({
  id: 'debate-discordar',
  titulo: 'Discordar sem brigar',
  podeFazer: 'Consigo discordar com educação, reconhecer o que é justo e propor um caminho.',
  nivel: 'B2',
  tags: ['conectores-contraste', 'debate-expressoes'],
  vocab: [
    { en: 'I see your point, but ...', pt: 'Entendo o seu ponto, mas ...', ex: 'I see your point, but I have doubts.' },
    { en: "That's fair. However, ...", pt: 'Justo. Porém, ...', ex: "That's fair. However, the cost is high." },
    { en: "I'm not convinced that ...", pt: 'Não estou convencido de que ...', ex: "I'm not convinced that it will work." },
    { en: "I'd push back on that.", pt: 'Eu discordaria disso (rebateria).', ex: "I'd push back on that timeline." },
    { en: "You've got a point there.", pt: 'Você tem razão nisso.', ex: "You've got a point there, honestly." },
    { en: 'I partly agree.', pt: 'Concordo em parte.', ex: 'I partly agree, but not fully.' },
  ],
  explicacao: {
    titulo: 'O sanduíche da discordância',
    texto: 'Em inglês, "You are wrong" soa como ataque. O truque é o sanduíche: reconheça uma parte, contraponha e justifique. Cuidado com dois erros comuns de brasileiro: "Although..., but..." (só um dos dois: Although it is expensive, it is worth it) e "despite of" (é só "despite" ou "in spite of").',
    estrutura: ['I see your point, [parte que você reconhece].', 'However, / But [seu contraponto].', 'The reason is that [motivo].', 'So maybe we could [proposta].'],
  },
  exemplos: [
    { en: 'I see your point, but not every topic fits an email.', pt: 'Entendo o seu ponto, mas nem todo assunto cabe num e-mail.' },
    { en: "That's fair. However, long meetings cost a lot.", pt: 'Justo. Porém, reuniões longas custam caro.' },
    { en: "I'm not convinced that this is the best solution.", pt: 'Não estou convencido de que essa seja a melhor solução.' },
    { en: 'You have a point.', pt: 'Você tem razão.' },
  ],
  exercicios: [
    { id: 'debate-discordar-1', tipo: 'escolha', habilidade: 'fala', dif: 2, oponente: { nome: 'Marcus', fala: 'Meetings are a waste of time. Everything could be an email.' }, enunciado: 'Qual resposta discorda com educação?', opcoes: ['I see your point, but some topics need a real conversation.', 'You are wrong. Meetings are great.', 'That is a stupid idea.'], resposta: 0, explica: 'Reconhece algo ("I see your point") e só depois contrapõe. O tom fica firme, mas respeitoso.' },
    det('debate-discordar-2', 'Although the idea is good, but we have no budget.', 'but', 'remova o "but"', '"Although" já faz o contraste. Não se usa "but" junto: Although the idea is good, we have no budget.', { tag: 'conectores-contraste' }),
    det('debate-discordar-3', 'Despite of the delay, we finished on time.', 'of', 'remova o "of"', '"Despite" não leva "of". Com "of" é "in spite of".', { tag: 'conectores-contraste' }),
    { id: 'debate-discordar-4', tipo: 'lacuna', habilidade: 'vocabulario', dif: 2, frase: "I'm not ___ that this is the best solution.", resposta: ['convinced'], explica: '"Not convinced" = não estou convencido. É uma forma educada de discordar.' },
    { id: 'debate-discordar-5', tipo: 'escolha', habilidade: 'gramatica', tag: 'conectores-contraste', dif: 2, enunciado: 'Complete: "___ the risks, the team decided to go ahead."', opcoes: ['Despite', 'Although', 'However'], resposta: 0, explica: 'Depois de "despite" vem um substantivo (the risks). "Although" pediria uma frase com verbo.' },
    { id: 'debate-discordar-6', tipo: 'ordenar', habilidade: 'gramatica', dif: 2, palavras: ["That's fair,", 'but', "I'd push back", 'on the timeline'], resposta: "That's fair, but I'd push back on the timeline", explica: 'Concordar em parte e rebater: o sanduíche em uma frase.' },
    { id: 'debate-discordar-7', tipo: 'escuta', habilidade: 'escuta', dif: 3, audio: 'I partly agree. Remote work is flexible, but new employees need more support.', pergunta: 'Qual é a posição da pessoa?', opcoes: ['Concorda em parte, mas vê um problema para os novatos', 'Discorda totalmente do trabalho remoto', 'Concorda totalmente'], resposta: 0 },
    { id: 'debate-discordar-8', tipo: 'ditado', habilidade: 'escuta', dif: 3, audio: "You've got a point there, but I'm not convinced.", resposta: ["You've got a point there, but I'm not convinced", 'You have got a point there, but I am not convinced', 'You have got a point there but I am not convinced'] },
    { id: 'debate-discordar-9', tipo: 'traduzir', habilidade: 'escrita', tag: 'debate-expressoes', dif: 3, pt: 'Entendo o seu ponto, mas não concordo.', aceitas: ['I see your point, but I disagree', "I see your point, but I don't agree", 'I understand your point, but I disagree', "I understand your point, but I don't agree"] },
  ],
  tarefa: {
    enunciado: 'Um colega diz: "Meetings are a waste of time." Reconheça uma parte, discorde e proponha uma solução.',
    minPalavras: 35,
    elementos: [
      { nome: 'reconhece o ponto dele', padroes: ['\\bi see your point\\b', "\\byou(?:'ve| have) got a point\\b", "\\bthat(?:'s| is) fair\\b", '\\bi partly agree\\b', '\\bi understand\\b'] },
      { nome: 'discorda', padroes: ['\\bhowever\\b', "\\bi(?:'m| am) not convinced\\b", '\\bpush back\\b', '\\bi disagree\\b', '\\bbut\\b'] },
      { nome: 'propõe uma solução', padroes: ['\\bwe could\\b', '\\bmaybe\\b', '\\bwhat if\\b', '\\bhow about\\b', '\\bone solution\\b'] },
    ],
    tagsChave: ['conectores-contraste', 'debate-expressoes'],
    dicas: ['I see your point, ...', "However, I'm not convinced that ...", 'Maybe we could ...'],
    modelo: "I see your point, and some meetings really are too long. However, I'm not convinced that everything can be an email, because complex decisions need a real conversation. Maybe we could keep meetings short, with a clear agenda, and send the rest by email.",
  },
  reteste: [
    'Um amigo diz: "Homework should be banned." Discorde com educação e proponha um meio-termo.',
    'Seu chefe diz: "We should work on Saturdays." Reconheça a preocupação dele e discorde sem ser ríspido.',
  ],
  conversa: 'debate-discordar',
});

// ---------- 3. Montar um argumento completo (B2) ----------
D.push({
  id: 'debate-argumento',
  titulo: 'Montar um argumento completo',
  podeFazer: 'Consigo defender uma posição com razões, exemplo, contraponto e conclusão.',
  nivel: 'B2',
  tags: ['debate-expressoes', 'conectores-contraste'],
  vocab: [
    { en: 'To begin with, ...', pt: 'Para começar, ...', ex: 'To begin with, it saves time.' },
    { en: 'On top of that, ...', pt: 'Além disso, ...', ex: 'On top of that, it saves money.' },
    { en: 'For instance, ...', pt: 'Por exemplo, ...', ex: 'For instance, a student can ask for help.' },
    { en: 'That said, ...', pt: 'Dito isso, ...', ex: 'That said, there are some risks.' },
    { en: 'Therefore, ...', pt: 'Portanto, ...', ex: 'Therefore, I support the idea.' },
    { en: 'In conclusion, ...', pt: 'Em conclusão, ...', ex: 'In conclusion, the benefits outweigh the costs.' },
  ],
  explicacao: {
    titulo: 'Afirmação, razões, exemplo, contraponto, fecho',
    texto: 'Um bom argumento tem cinco peças: afirmação, razão, razão extra com exemplo, contraponto (mostra que você viu o outro lado) e conclusão. Cada peça tem um conector que avisa o ouvinte onde você está. Repare em "On the other hand" (com "on", nunca "in the other hand").',
    estrutura: ['I believe that [afirmação].', 'To begin with, [razão 1]. On top of that, [razão 2].', 'For instance, [exemplo].', 'That said, [contraponto], but [resposta].', 'In conclusion, [fecho].'],
  },
  exemplos: [
    { en: 'I believe that schools should teach financial education.', pt: 'Acredito que as escolas deveriam ensinar educação financeira.' },
    { en: 'To begin with, it prepares students for adult life.', pt: 'Para começar, isso prepara os alunos para a vida adulta.' },
    { en: 'That said, some people think the school day is already full.', pt: 'Dito isso, algumas pessoas acham que o dia escolar já está cheio.' },
    { en: 'In conclusion, the benefits are clear.', pt: 'Em conclusão, os benefícios são claros.' },
  ],
  exercicios: [
    { id: 'debate-argumento-1', tipo: 'ordenar', habilidade: 'gramatica', dif: 2, palavras: ['I believe that', 'schools should teach', 'financial education', 'because it prepares students', 'for adult life'], resposta: 'I believe that schools should teach financial education because it prepares students for adult life', explica: 'Afirmação + "because" + razão: o esqueleto de qualquer argumento.' },
    { id: 'debate-argumento-2', tipo: 'escolha', habilidade: 'vocabulario', dif: 2, enunciado: 'Qual conector introduz um EXEMPLO?', opcoes: ['For instance,', 'Therefore,', 'That said,'], resposta: 0, explica: '"For instance" e "for example" apresentam um exemplo. "Therefore" mostra consequência; "that said" faz contraponto.' },
    { id: 'debate-argumento-3', tipo: 'escolha', habilidade: 'vocabulario', dif: 2, enunciado: 'Qual conector introduz um CONTRAPONTO?', opcoes: ['That said,', 'To begin with,', 'In conclusion,'], resposta: 0, explica: '"That said" = dito isso (mas...). Mostra que você considerou o outro lado.' },
    { id: 'debate-argumento-4', tipo: 'lacuna', habilidade: 'vocabulario', dif: 2, frase: 'To begin with, it saves time. On top of ___, it saves money.', resposta: ['that'], explica: '"On top of that" = além disso.' },
    det('debate-argumento-5', 'In the other hand, the plan has some risks.', 'In', 'On ("On the other hand")', 'A expressão é "on the other hand", com "on".', { tag: 'debate-expressoes' }),
    det('debate-argumento-6', 'Studies show that more people prefers flexible hours.', 'prefers', 'prefer', '"People" é plural: people prefer.'),
    { id: 'debate-argumento-7', tipo: 'escolha', habilidade: 'fala', dif: 3, oponente: { nome: 'Nora', fala: 'You say AI helps students learn. Give me ONE concrete example.' }, enunciado: 'Qual resposta dá um exemplo concreto?', opcoes: ['For instance, a student can ask an AI to explain a hard topic in simpler words.', 'AI is good because it is good.', 'Everybody knows that.'], resposta: 0, explica: 'Exemplo concreto = alguém fazendo algo específico. "Everybody knows" não prova nada.' },
    { id: 'debate-argumento-8', tipo: 'escuta', habilidade: 'escuta', dif: 3, audio: 'To begin with, public libraries are free. On top of that, they bring the community together. That said, they need more funding.', pergunta: 'Qual é o contraponto?', opcoes: ['Precisam de mais financiamento', 'São gratuitas', 'Unem a comunidade'], resposta: 0 },
    { id: 'debate-argumento-9', tipo: 'ditado', habilidade: 'escuta', dif: 3, audio: 'Therefore, I believe the benefits outweigh the costs.', resposta: ['Therefore, I believe the benefits outweigh the costs', 'Therefore I believe the benefits outweigh the costs'] },
    { id: 'debate-argumento-10', tipo: 'traduzir', habilidade: 'escrita', dif: 3, pt: 'Para começar, isso economiza tempo. Além disso, economiza dinheiro.', aceitas: ['To begin with, it saves time. On top of that, it saves money', 'To begin with, this saves time. On top of that, it saves money', 'To begin with, it saves time. Besides that, it saves money'] },
  ],
  tarefa: {
    enunciado: 'Defenda uma posição (ex.: "Escolas devem ensinar educação financeira"): afirmação, duas razões, um exemplo, um contraponto e uma conclusão.',
    minPalavras: 60,
    elementos: [
      { nome: 'sua posição', padroes: ['\\bi (?:strongly )?believe\\b', '\\bin my (?:opinion|view)\\b', '\\bi think\\b', '\\bi(?:\'m| am) convinced\\b'] },
      { nome: 'primeira razão', padroes: ['\\bto begin with\\b', '\\bfirst(?:ly)?\\b', '\\bthe main reason\\b'] },
      { nome: 'razão extra', padroes: ['\\bon top of that\\b', '\\bin addition\\b', '\\bmoreover\\b', '\\bbesides\\b', '\\bsecond(?:ly)?\\b'] },
      { nome: 'um contraponto', padroes: ['\\bthat said\\b', '\\bhowever\\b', '\\bon the other hand\\b', '\\bsome people (?:say|argue|think)\\b'] },
      { nome: 'conclusão', padroes: ['\\bin conclusion\\b', '\\btherefore\\b', '\\bto sum up\\b', '\\boverall\\b'] },
    ],
    tagsChave: ['debate-expressoes', 'conectores-contraste'],
    dicas: ['I believe that ...', 'To begin with, ... On top of that, ...', 'For instance, ...', 'That said, ...', 'In conclusion, ...'],
    modelo: 'I believe that schools should teach financial education. To begin with, it prepares students for adult life, because many young people start earning money without knowing how to manage it. On top of that, it helps families avoid debt. For instance, a student who learns about interest rates will think twice before using a credit card. That said, some people argue that schools already have too many subjects. However, a short weekly class would be enough. In conclusion, the benefits outweigh the costs.',
  },
  reteste: [
    'Defenda ou critique: "Cities should ban cars from the center." Use afirmação, razões, exemplo, contraponto e conclusão.',
    'Argumente sobre: "Companies should offer a four-day work week." Termine com uma conclusão.',
  ],
  conversa: 'debate-argumento',
});

// ---------- 4. Palavras certas para debater (B2) ----------
D.push({
  id: 'debate-palavras',
  titulo: 'As palavras certas para debater',
  podeFazer: 'Consigo escolher palavras precisas (vantagem, desvantagem, troca, impacto) e evitar falsos amigos.',
  nivel: 'B2',
  tags: ['falsos-cognatos', 'debate-expressoes'],
  vocab: [
    { en: 'outweigh', pt: 'pesar mais que, superar', ex: 'The benefits outweigh the risks.' },
    { en: 'drawback', pt: 'desvantagem, ponto negativo', ex: 'The main drawback is the price.' },
    { en: 'trade-off', pt: 'troca (ganhar uma coisa e perder outra)', ex: 'There is a trade-off between speed and quality.' },
    { en: 'undermine', pt: 'enfraquecer, minar', ex: 'These facts undermine the argument.' },
    { en: 'controversial', pt: 'polêmico', ex: 'It is a controversial topic.' },
    { en: 'rely on', pt: 'depender de, contar com', ex: 'Many people rely on public transport.' },
  ],
  explicacao: {
    titulo: 'Uma palavra precisa vale mais que dez vagas',
    texto: 'Em debate, "good" e "bad" dizem pouco. "Benefit", "drawback" e "trade-off" dizem muito mais. Atenção aos falsos amigos: "eventually" é "no fim" (não "eventualmente"), "support" é "apoiar" (não "suportar"), "pretend" é "fingir" (pretender = plan to) e "actually" é "na verdade". E lembre: "discuss" já traz o "sobre" (discuss the budget, não "discuss about").',
    estrutura: ['The main drawback is [problema].', 'The benefits outweigh the drawbacks.', 'There is a trade-off between [A] and [B].', '[Fato] undermines the idea that [ideia].'],
  },
  exemplos: [
    { en: 'The main drawback is the high cost.', pt: 'A principal desvantagem é o custo alto.' },
    { en: 'In my view, the benefits outweigh the risks.', pt: 'Na minha visão, os benefícios superam os riscos.' },
    { en: 'There is always a trade-off.', pt: 'Sempre há uma troca.' },
    { en: 'It is a controversial topic.', pt: 'É um tema polêmico.' },
  ],
  exercicios: [
    { id: 'debate-palavras-1', tipo: 'escolha', habilidade: 'vocabulario', tag: 'falsos-cognatos', dif: 2, enunciado: '"Eventually" quer dizer:', opcoes: ['no fim, depois de um tempo', 'às vezes (eventualmente)', 'por acaso'], resposta: 0, explica: 'Falso amigo: "eventualmente" em português é "às vezes" (occasionally). Eventually = no fim, com o tempo.' },
    { id: 'debate-palavras-2', tipo: 'escolha', habilidade: 'vocabulario', tag: 'falsos-cognatos', dif: 2, enunciado: '"I support this idea" significa:', opcoes: ['Eu apoio essa ideia.', 'Eu suporto (tolero) essa ideia.', 'Eu sustento o peso dessa ideia.'], resposta: 0, explica: 'Falso amigo: support = apoiar. Para "suportar/tolerar" use "stand" ou "put up with".' },
    { id: 'debate-palavras-3', tipo: 'lacuna', habilidade: 'vocabulario', dif: 2, frase: 'The main ___ of this plan is the high cost.', resposta: ['drawback'], explica: '"Drawback" = ponto negativo.' },
    { id: 'debate-palavras-4', tipo: 'lacuna', habilidade: 'vocabulario', dif: 2, frase: 'In my view, the benefits ___ the drawbacks.', resposta: ['outweigh'], explica: '"Outweigh" = pesar mais que.' },
    { id: 'debate-palavras-5', tipo: 'lacuna', habilidade: 'vocabulario', dif: 2, frase: 'There is a trade-___ between speed and quality.', resposta: ['off'], explica: '"Trade-off" = você ganha em uma coisa e perde em outra.' },
    det('debate-palavras-6', 'We need to discuss about the budget today.', 'about', 'remova o "about"', '"Discuss" já significa "falar sobre". Discuss the budget.', { tag: 'debate-expressoes' }),
    det('debate-palavras-7', 'She did a good point about the costs.', 'did', 'made', 'Ponto se "faz" com make: make a point.', { tag: 'debate-expressoes' }),
    { id: 'debate-palavras-8', tipo: 'escolha', habilidade: 'fala', dif: 3, oponente: { nome: 'Theo', fala: 'Electric cars are perfect. No drawbacks at all!' }, enunciado: 'Qual resposta rebate usando as palavras certas?', opcoes: ["I'd push back on that. The main drawback is the price, and charging stations are still rare.", 'No, they are bad.', 'Drawback is good for me.'], resposta: 0, explica: 'Usa "push back", "drawback" e dá dois motivos concretos.' },
    { id: 'debate-palavras-9', tipo: 'escuta', habilidade: 'escuta', dif: 3, audio: "It's a controversial topic. Some people rely on cars every day, so they say the trade-off is not worth it.", pergunta: 'Por que dizem que a troca não vale a pena?', opcoes: ['Porque dependem do carro todo dia', 'Porque o carro é barato', 'Porque não gostam de carros'], resposta: 0 },
    { id: 'debate-palavras-10', tipo: 'ditado', habilidade: 'escuta', dif: 3, audio: 'These new facts undermine the original argument.', resposta: ['These new facts undermine the original argument'] },
    { id: 'debate-palavras-12', tipo: 'ordenar', habilidade: 'gramatica', dif: 2, palavras: ['There is a trade-off', 'between', 'speed', 'and quality'], resposta: 'There is a trade-off between speed and quality', explica: 'Trade-off between A and B: a estrutura que aparece em quase todo debate sobre escolhas.' },
    { id: 'debate-palavras-11', tipo: 'traduzir', habilidade: 'escrita', dif: 3, pt: 'Os benefícios superam as desvantagens.', aceitas: ['The benefits outweigh the drawbacks', 'The advantages outweigh the disadvantages', 'The benefits outweigh the disadvantages', 'The advantages outweigh the drawbacks'] },
  ],
  tarefa: {
    enunciado: 'Fale de um tema polêmico (ex.: trabalho remoto ou carros elétricos). Cite uma vantagem, uma desvantagem e faça um balanço com "outweigh", "trade-off" ou "undermine".',
    minPalavras: 35,
    elementos: [
      { nome: 'uma vantagem', padroes: ['\\bbenefits?\\b', '\\badvantages?\\b', '\\bupsides?\\b'] },
      { nome: 'uma desvantagem', padroes: ['\\bdrawbacks?\\b', '\\bdownsides?\\b', '\\bdisadvantages?\\b'] },
      { nome: 'um balanço (outweigh, trade-off...)', padroes: ['\\boutweigh', '\\btrade-?off\\b', '\\bundermine'] },
    ],
    tagsChave: ['debate-expressoes', 'falsos-cognatos'],
    dicas: ['The main benefit is ...', 'The main drawback is ...', 'There is a trade-off between ...', 'The benefits outweigh ...'],
    modelo: 'Remote work is a controversial topic. The main benefit is flexibility, because people save time and can focus better. However, the main drawback is isolation, and there is a trade-off between freedom and teamwork. In my opinion, the benefits outweigh the drawbacks, but companies should not rely only on video calls.',
  },
  reteste: [
    'Fale de um tema polêmico da sua cidade (trânsito, turismo, preço de aluguel) com vantagem, desvantagem e um balanço.',
    'Compare duas opções (carro x transporte público) usando "trade-off" e "outweigh".',
  ],
  conversa: 'debate-palavras',
});

// ---------- 5. Mediar e resumir (C1) ----------
D.push({
  id: 'debate-mediar',
  titulo: 'Interromper, resumir e mediar',
  podeFazer: 'Consigo interromper com educação, resumir os dois lados e propor um meio-termo.',
  nivel: 'C1',
  tags: ['debate-expressoes'],
  vocab: [
    { en: 'If I may interrupt, ...', pt: 'Se me permite interromper, ...', ex: 'If I may interrupt, I have a question.' },
    { en: 'Let me finish my point.', pt: 'Deixe-me terminar meu raciocínio.', ex: 'Let me finish my point, and then you can reply.' },
    { en: "So what you're saying is ...", pt: 'Então o que você está dizendo é ...', ex: "So what you're saying is that we need more time." },
    { en: "Let's find a middle ground.", pt: 'Vamos achar um meio-termo.', ex: "Let's find a middle ground we can both accept." },
    { en: "Let's circle back to ...", pt: 'Vamos voltar a ...', ex: "Let's circle back to the budget." },
    { en: 'To sum up, ...', pt: 'Resumindo, ...', ex: 'To sum up, we agree on the goal.' },
  ],
  explicacao: {
    titulo: 'Quem conduz a conversa ajuda o debate',
    texto: 'Num debate real, ninguém espera a vez em silêncio. Existem fórmulas educadas para interromper, para parafrasear (provar que você entendeu) e para propor um meio-termo. Repare no verbo: "It sounds like" e "It seems", sempre com -s. E "discuss" não leva "about".',
    estrutura: ['If I may interrupt, [seu ponto].', "So what you're saying is [paráfrase].", 'It sounds like we agree on [ponto comum].', "Let's find a middle ground: [proposta]."],
  },
  exemplos: [
    { en: 'If I may interrupt, let us hear everyone.', pt: 'Se me permite interromper, vamos ouvir todos.' },
    { en: "So what you're saying is that the deadline is too tight.", pt: 'Então o que você diz é que o prazo está apertado.' },
    { en: 'It sounds like we agree on the goal.', pt: 'Parece que concordamos no objetivo.' },
    { en: 'To sum up, we need more time.', pt: 'Resumindo, precisamos de mais tempo.' },
  ],
  exercicios: [
    { id: 'debate-mediar-1', tipo: 'escolha', habilidade: 'fala', dif: 3, oponente: { nome: 'Raj', fala: 'Nobody is listening to me! Lena keeps talking over everyone.' }, enunciado: 'Como o mediador interrompe com educação?', opcoes: ["If I may interrupt, let's hear Lena's view too, and then we'll come back to you.", 'Be quiet, Raj.', 'Stop talking now.'], resposta: 0, explica: '"If I may interrupt" pede licença, e a frase seguinte garante a vez de quem estava falando.' },
    { id: 'debate-mediar-2', tipo: 'escolha', habilidade: 'gramatica', dif: 3, enunciado: 'Qual frase PARAFRASEIA o que a pessoa disse?', opcoes: ["So what you're saying is that the deadline is too tight.", "I don't care what you say.", "That's all for today."], resposta: 0, explica: 'Parafrasear mostra que você entendeu e dá chance de corrigir mal-entendidos.' },
    { id: 'debate-mediar-3', tipo: 'lacuna', habilidade: 'vocabulario', dif: 3, frase: "Let's find a middle ___ we can both accept.", resposta: ['ground'], explica: '"Middle ground" = meio-termo.' },
    { id: 'debate-mediar-4', tipo: 'lacuna', habilidade: 'vocabulario', dif: 3, frase: 'To ___ up, we agree on the goal but not on the date.', resposta: ['sum'], explica: '"To sum up" = resumindo.' },
    { id: 'debate-mediar-5', tipo: 'ordenar', habilidade: 'gramatica', dif: 3, palavras: ['If I may interrupt,', "I'd like to", 'hear from', 'the rest of the team'], resposta: "If I may interrupt, I'd like to hear from the rest of the team", explica: 'Licença + o que você quer: simples e educado.' },
    det('debate-mediar-6', 'Let us discuss about the next steps.', 'about', 'remova o "about"', '"Discuss" já inclui "sobre".', { tag: 'debate-expressoes' }),
    det('debate-mediar-7', 'It sound like we agree on the main goal.', 'sound', 'sounds', '"It" pede -s: it sounds like.', { tag: 'terceira-pessoa' }),
    { id: 'debate-mediar-8', tipo: 'escuta', habilidade: 'escuta', dif: 3, audio: "Let's circle back to the budget. So what you're saying is that we need more time, but not more money, right?", pergunta: 'O que a pessoa entendeu?', opcoes: ['Que precisam de mais tempo, mas não de mais dinheiro', 'Que precisam de mais dinheiro e menos tempo', 'Que o projeto deve ser cancelado'], resposta: 0 },
    { id: 'debate-mediar-9', tipo: 'ditado', habilidade: 'escuta', dif: 3, audio: "Let me finish my point, and then I'll listen to yours.", resposta: ["Let me finish my point, and then I'll listen to yours", "Let me finish my point and then I'll listen to yours", 'Let me finish my point, and then I will listen to yours'] },
    { id: 'debate-mediar-10', tipo: 'traduzir', habilidade: 'escrita', dif: 3, pt: 'Se me permite interromper, tenho uma sugestão.', aceitas: ['If I may interrupt, I have a suggestion', 'If I may interrupt, I have a proposal', "If you'll allow me to interrupt, I have a suggestion", 'If you allow me to interrupt, I have a suggestion'] },
  ],
  tarefa: {
    enunciado: 'Você é o mediador de uma discussão sobre um prazo (Lena quer manter, Raj quer adiar). Interrompa com educação, resuma os dois lados e proponha um meio-termo.',
    minPalavras: 40,
    elementos: [
      { nome: 'interrupção educada', padroes: ['\\bif i may\\b', '\\bsorry to interrupt\\b', '\\bexcuse me\\b', '\\blet me step in\\b'] },
      { nome: 'resumo dos dois lados', padroes: ["\\bso what you(?:'re| are) saying\\b", '\\bit sounds like\\b', '\\bto sum up\\b', '\\bon one hand\\b'] },
      { nome: 'proposta de meio-termo', padroes: ['\\bmiddle ground\\b', '\\bcompromise\\b', '\\bwhat if\\b', '\\bhow about\\b', '\\bmeet halfway\\b'] },
    ],
    tagsChave: ['debate-expressoes'],
    dicas: ['If I may interrupt, ...', "So what you're saying is ...", 'It sounds like we agree on ...', "Let's find a middle ground: ..."],
    modelo: "If I may interrupt, I think both of you have a fair point. So what you're saying, Lena, is that the deadline cannot move, and Raj, you're saying the team needs more time. It sounds like we agree on the quality of the work. Let's find a middle ground: what if we keep the date, but reduce the scope of the first release?",
  },
  reteste: [
    'Dois amigos discutem onde passar as férias (praia x montanha). Faça a mediação: interrompa, resuma e proponha um meio-termo.',
    'Numa reunião, duas áreas brigam por orçamento. Resuma o que cada uma quer e sugira um acordo.',
  ],
  conversa: 'debate-mediar',
});

// ---------- 6. Defender e rebater (C1) ----------
D.push({
  id: 'debate-final',
  titulo: 'Defender e rebater um tema polêmico',
  podeFazer: 'Consigo defender uma posição com cautela, reconhecer o que é justo no outro lado e rebater.',
  nivel: 'C1',
  tags: ['conectores-contraste', 'debate-expressoes'],
  vocab: [
    { en: 'arguably', pt: 'possivelmente, discutivelmente', ex: 'Arguably, this is the best option.' },
    { en: 'to a certain extent', pt: 'até certo ponto', ex: 'To a certain extent, I agree.' },
    { en: 'While it is true that ...', pt: 'Embora seja verdade que ...', ex: 'While it is true that costs fell, quality suffered.' },
    { en: "I'd concede that ...", pt: 'Admito que ...', ex: "I'd concede that the idea has merit." },
    { en: 'the evidence suggests', pt: 'as evidências sugerem', ex: 'The evidence suggests that it works.' },
    { en: "it's not that simple", pt: 'não é tão simples assim', ex: "It's not that simple, I'm afraid." },
  ],
  explicacao: {
    titulo: 'Cautela, concessão e rebatida',
    texto: 'No nível avançado, afirmações absolutas ("This is always wrong") perdem força. Quem debate bem usa "hedging" (arguably, to a certain extent, the evidence suggests) e a concessão: admite o que é justo e só então rebate. Cuidado com "Although..., but...": escolha um dos dois.',
    estrutura: ['While it is true that [ponto do outro lado], [seu contraponto].', 'Arguably, [sua afirmação com cautela].', 'The evidence suggests that [dado].', "To a certain extent I agree, but [limite]."],
  },
  exemplos: [
    { en: 'While it is true that some studies show gains, they cover small firms.', pt: 'Embora seja verdade que alguns estudos mostrem ganhos, eles cobrem empresas pequenas.' },
    { en: 'Arguably, a voluntary model is fairer.', pt: 'Possivelmente, um modelo voluntário é mais justo.' },
    { en: "It's not that simple.", pt: 'Não é tão simples assim.' },
    { en: 'I partly agree.', pt: 'Concordo em parte.' },
  ],
  exercicios: [
    { id: 'debate-final-1', tipo: 'escolha', habilidade: 'gramatica', dif: 3, enunciado: 'Qual frase usa "hedging" (afirmação com cautela)?', opcoes: ['Arguably, the four-day week improves well-being.', 'The four-day week is the best thing ever.', 'Everybody knows the four-day week works.'], resposta: 0, explica: '"Arguably" suaviza a afirmação e deixa o debate aberto. É mais difícil de rebater do que um absoluto.' },
    { id: 'debate-final-2', tipo: 'escolha', habilidade: 'fala', dif: 3, oponente: { nome: 'Ellis', fala: 'Studies show productivity went up in a four-day week. Your opposition is baseless.' }, enunciado: 'Qual resposta concede um ponto e rebate?', opcoes: ["While it is true that some studies show gains, they mostly cover small tech firms, so the results don't apply to everyone.", 'Those studies are lies.', "I don't read studies."], resposta: 0, explica: 'Primeiro admite o que é justo (while it is true that), depois rebate com um motivo.' },
    { id: 'debate-final-3', tipo: 'lacuna', habilidade: 'gramatica', dif: 3, frase: '___ it is true that costs fell, quality suffered.', resposta: ['While', 'Although', 'Though'], explica: 'Concessão: while/although it is true that..., + contraponto.' },
    { id: 'debate-final-4', tipo: 'lacuna', habilidade: 'vocabulario', dif: 3, frase: 'To a certain ___, I agree with you.', resposta: ['extent'], explica: '"To a certain extent" = até certo ponto.' },
    { id: 'debate-final-5', tipo: 'escolha', habilidade: 'vocabulario', tag: 'falsos-cognatos', dif: 3, enunciado: 'Complete: "I\'d ___ that the idea has merit, but it is not enough."', opcoes: ['concede', 'pretend', 'support'], resposta: 0, explica: '"Concede" = admitir. "Pretend" é fingir (falso amigo de "pretender").' },
    det('debate-final-6', 'Although the evidence is strong, but the sample is small.', 'but', 'remova o "but"', 'Com "although" não se usa "but".', { tag: 'conectores-contraste' }),
    det('debate-final-7', 'The evidence suggest that remote work is effective.', 'suggest', 'suggests', '"Evidence" é singular: suggests.', { tag: 'terceira-pessoa' }),
    { id: 'debate-final-8', tipo: 'ordenar', habilidade: 'gramatica', dif: 3, palavras: ['To a certain extent,', 'I agree,', 'but', "it's not that simple"], resposta: "To a certain extent, I agree, but it's not that simple", explica: 'Concordância parcial + limite: a forma clássica de concessão.' },
    { id: 'debate-final-9', tipo: 'escuta', habilidade: 'escuta', dif: 3, audio: "I'd concede that the policy has helped some families. However, the evidence suggests that it has not solved the main problem.", pergunta: 'O que a pessoa admite?', opcoes: ['Que a política ajudou algumas famílias', 'Que a política resolveu tudo', 'Que não existem evidências'], resposta: 0 },
    { id: 'debate-final-10', tipo: 'leitura', habilidade: 'leitura', dif: 3, texto: 'Supporters of the four-day week point to higher morale and fewer sick days. Critics, on the other hand, warn that hospitals, schools and factories cannot simply close for a day. Arguably, both sides are right: the policy may work well in offices, but it is not that simple in every sector.', pergunta: 'Qual é a conclusão do texto?', opcoes: ['A política pode funcionar em escritórios, mas não em todos os setores', 'A política funciona em qualquer setor', 'A política deve ser abandonada nos escritórios'], resposta: 0 },
    { id: 'debate-final-11', tipo: 'traduzir', habilidade: 'escrita', dif: 3, pt: 'Até certo ponto, concordo com você.', aceitas: ['To a certain extent, I agree with you', 'To a certain degree, I agree with you', 'To some extent, I agree with you', 'To a certain extent I agree with you'] },
  ],
  tarefa: {
    enunciado: 'Moção: "A semana de trabalho de quatro dias deveria ser obrigatória." Posicione-se a favor ou contra, admita um ponto do outro lado, rebata e use uma expressão de cautela.',
    minPalavras: 60,
    elementos: [
      { nome: 'sua posição', padroes: ['\\bi (?:strongly |firmly )?(?:believe|think|oppose|support|argue)\\b', '\\bin my (?:opinion|view)\\b', "\\bi(?:'m| am) (?:in favou?r|against)\\b"] },
      { nome: 'uma concessão', padroes: ['\\bwhile it is true\\b', '\\bit is true that\\b', "\\bi(?:'d| would) concede\\b", '\\bi admit\\b', '\\bto a certain extent\\b', '\\bto some extent\\b'] },
      { nome: 'uma rebatida', padroes: ['\\bhowever\\b', '\\bbut\\b', '\\bnevertheless\\b', '\\bthat said\\b', '\\bnot that simple\\b'] },
      { nome: 'cautela (hedging)', padroes: ['\\barguably\\b', '\\bto a certain extent\\b', '\\bto some extent\\b', '\\bthe evidence suggests\\b', '\\bit seems\\b', '\\bperhaps\\b', '\\bmay\\b', '\\bmight\\b'] },
    ],
    tagsChave: ['conectores-contraste', 'debate-expressoes'],
    dicas: ['I believe that ...', 'While it is true that ..., ...', 'Arguably, ...', 'In conclusion, ...'],
    modelo: 'I believe the four-day week should not be mandatory. While it is true that some studies show higher productivity, most of them cover small offices, so the results do not apply to every sector. Hospitals, schools and factories cannot simply close for a day. Arguably, a voluntary model is fairer, because each company can test it first. To a certain extent I understand the appeal, but a law for everyone is not the answer. In conclusion, flexibility should be a choice, not an obligation.',
  },
  reteste: [
    'Moção: "Social media does more harm than good." Escolha um lado, admita um ponto do outro lado e rebata com cautela.',
    'Moção: "Cities should ban private cars downtown." Defenda ou ataque, com concessão e rebatida.',
  ],
  conversa: 'debate-final',
});

module.exports = { TRILHA_DEBATE: D };
