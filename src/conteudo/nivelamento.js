'use strict';
// Teste de nivelamento (15 perguntas, uns 8 minutos). Itens ordenados por nível dentro de cada habilidade.
// O resultado é uma ESTIMATIVA para montar o plano, não uma certificação (o app diz isso ao aluno).
// Escrita e fala são opcionais: entram no diagnóstico se o aluno fizer.

const NIVEIS = ['A1', 'A2', 'B1', 'B2', 'C1'];

const BANCO = [
  // ---- gramática
  { id: 'n-g1', habilidade: 'gramatica', nivel: 'A1', tipo: 'escolha', enunciado: 'She ___ a teacher.', opcoes: ['is', 'are', 'am', 'be'], resposta: 0, tag: 'terceira-pessoa' },
  { id: 'n-g2', habilidade: 'gramatica', nivel: 'A1', tipo: 'escolha', enunciado: '___ you like coffee?', opcoes: ['Do', 'Does', 'Are', 'Is'], resposta: 0, tag: 'perguntas-do' },
  { id: 'n-g3', habilidade: 'gramatica', nivel: 'A2', tipo: 'escolha', enunciado: 'Yesterday I ___ to the dentist.', opcoes: ['went', 'go', 'goed', 'have gone'], resposta: 0, tag: 'passado-irregular' },
  { id: 'n-g4', habilidade: 'gramatica', nivel: 'A2', tipo: 'escolha', enunciado: 'Where ___ you buy that jacket?', opcoes: ['did', 'do you', 'were', 'have'], resposta: 0, tag: 'perguntas-do' },
  { id: 'n-g5', habilidade: 'gramatica', nivel: 'B1', tipo: 'escolha', enunciado: "I've lived in this city ___ 2015.", opcoes: ['since', 'for', 'during', 'from'], resposta: 0, tag: 'tempo-desde' },
  { id: 'n-g6', habilidade: 'gramatica', nivel: 'B1', tipo: 'escolha', enunciado: 'If it ___ tomorrow, we will cancel the trip.', opcoes: ['rains', 'will rain', 'rained', 'would rain'], resposta: 0 },
  { id: 'n-g7', habilidade: 'gramatica', nivel: 'B2', tipo: 'escolha', enunciado: 'By the time we arrived, the meeting ___.', opcoes: ['had already started', 'already started', 'has already started', 'was already start'], resposta: 0 },
  { id: 'n-g8', habilidade: 'gramatica', nivel: 'B2', tipo: 'escolha', enunciado: 'I wish I ___ more time to study last year.', opcoes: ['had had', 'have had', 'had', 'would have'], resposta: 0 },
  { id: 'n-g9', habilidade: 'gramatica', nivel: 'C1', tipo: 'escolha', enunciado: 'Not only ___ the deadline, but he also exceeded expectations.', opcoes: ['did he meet', 'he met', 'he did meet', 'met he'], resposta: 0 },
  // ---- vocabulário
  { id: 'n-v1', habilidade: 'vocabulario', nivel: 'A1', tipo: 'escolha', enunciado: 'O que significa "tomorrow"?', opcoes: ['amanhã', 'ontem', 'hoje', 'semana'], resposta: 0 },
  { id: 'n-v2', habilidade: 'vocabulario', nivel: 'A2', tipo: 'escolha', enunciado: 'I need to ___ a question.', opcoes: ['ask', 'make', 'do', 'say'], resposta: 0, tag: 'make-do' },
  { id: 'n-v3', habilidade: 'vocabulario', nivel: 'A2', tipo: 'escolha', enunciado: 'O que significa "I\'m looking for a job"?', opcoes: ['Estou procurando um emprego', 'Estou olhando meu emprego', 'Estou gostando do emprego', 'Estou saindo do emprego'], resposta: 0 },
  { id: 'n-v4', habilidade: 'vocabulario', nivel: 'B1', tipo: 'escolha', enunciado: '"Actually" significa:', opcoes: ['na verdade', 'atualmente', 'eventualmente', 'exatamente'], resposta: 0, tag: 'falsos-cognatos' },
  { id: 'n-v5', habilidade: 'vocabulario', nivel: 'B1', tipo: 'escolha', enunciado: 'The project was ___ because of the budget cuts.', opcoes: ['postponed', 'pretended', 'pushed up', 'assisted'], resposta: 0 },
  { id: 'n-v6', habilidade: 'vocabulario', nivel: 'B2', tipo: 'escolha', enunciado: 'We need to ___ a decision by Friday.', opcoes: ['reach', 'do', 'take on', 'get up'], resposta: 0 },
  { id: 'n-v7', habilidade: 'vocabulario', nivel: 'C1', tipo: 'escolha', enunciado: 'Her explanation was so ___ that everyone understood immediately.', opcoes: ['lucid', 'lurid', 'livid', 'languid'], resposta: 0 },
  // ---- leitura
  { id: 'n-l1', habilidade: 'leitura', nivel: 'A2', tipo: 'leitura', texto: "Hi Leo, I can't go to the meeting at 3 today. My daughter is sick and I need to take her to the doctor. Can we meet tomorrow morning? Thanks, Nina", pergunta: 'Por que a Nina não vai à reunião?', opcoes: ['A filha está doente', 'Ela está doente', 'Ela tem outra reunião', 'O Leo cancelou'], resposta: 0 },
  { id: 'n-l2', habilidade: 'leitura', nivel: 'A2', tipo: 'leitura', texto: "Hi Leo, I can't go to the meeting at 3 today. My daughter is sick and I need to take her to the doctor. Can we meet tomorrow morning? Thanks, Nina", pergunta: 'O que ela propõe?', opcoes: ['Encontrar amanhã de manhã', 'Encontrar às 3 amanhã', 'Cancelar a reunião', 'Fazer por telefone hoje'], resposta: 0 },
  { id: 'n-l3', habilidade: 'leitura', nivel: 'B1', tipo: 'leitura', texto: 'Remote work has become common, but many companies are now asking employees to return to the office two or three days a week. Managers say it improves collaboration, while many workers argue that they are just as productive at home and save hours of commuting.', pergunta: 'Qual é o argumento de muitos trabalhadores?', opcoes: ['São igualmente produtivos em casa e economizam tempo de deslocamento', 'Colaboram melhor no escritório', 'Preferem ir ao escritório três dias', 'Os gestores trabalham menos'], resposta: 0 },
  { id: 'n-l4', habilidade: 'leitura', nivel: 'B2', tipo: 'leitura', texto: "Although the startup's revenue doubled last year, its founders remain cautious. Rapid growth, they note, has exposed weaknesses in customer support that could undermine the loyalty that made the company successful in the first place.", pergunta: 'Por que os fundadores estão cautelosos?', opcoes: ['O crescimento expôs falhas no suporte que podem afetar a fidelidade', 'A receita caiu pela metade', 'Os clientes já foram embora', 'Querem vender a empresa'], resposta: 0 },
  // ---- escuta (o navegador lê o áudio; o texto não aparece)
  { id: 'n-e1', habilidade: 'escuta', nivel: 'A1', tipo: 'escuta', audio: 'My name is Peter and I live in London.', pergunta: 'Onde o Peter mora?', opcoes: ['Londres', 'Lisboa', 'Los Angeles', 'Liverpool'], resposta: 0, velocidade: 0.9 },
  { id: 'n-e2', habilidade: 'escuta', nivel: 'A2', tipo: 'escuta', audio: "The train to Oxford leaves at a quarter past ten from platform four.", pergunta: 'A que horas sai o trem?', opcoes: ['10h15', '10h45', '4h10', '10h04'], resposta: 0, velocidade: 0.95 },
  { id: 'n-e3', habilidade: 'escuta', nivel: 'B1', tipo: 'escuta', audio: "I was going to call you yesterday, but my phone died, so I sent you an email instead.", pergunta: 'Por que a pessoa não ligou?', opcoes: ['O celular descarregou', 'Esqueceu', 'Não tinha o número', 'Preferiu mandar mensagem'], resposta: 0, velocidade: 1 },
  { id: 'n-e4', habilidade: 'escuta', nivel: 'B2', tipo: 'escuta', audio: "If we'd known about the delay earlier, we could have moved the launch and avoided most of the complaints.", pergunta: 'O que a pessoa quer dizer?', opcoes: ['Se soubessem antes, teriam evitado as reclamações', 'O lançamento foi um sucesso', 'Vão mudar o lançamento agora', 'Não houve atraso'], resposta: 0, velocidade: 1.05 },
  { id: 'n-e5', habilidade: 'escuta', nivel: 'C1', tipo: 'escuta', audio: "Frankly, the proposal's merits are outweighed by the logistical headaches it would create for the regional teams.", pergunta: 'Qual é a opinião?', opcoes: ['Os problemas de logística pesam mais que as vantagens', 'A proposta é ótima para as equipes regionais', 'As equipes regionais criaram a proposta', 'A logística já foi resolvida'], resposta: 0, velocidade: 1.05 },
];

// Teste de entrada: 15 perguntas (25 cansava). Cobre os 5 níveis em gramática e 4 em vocabulário, leitura e escuta.
// O resto fica como reserva para refazer o teste sem repetir as mesmas perguntas.
const ENTRADA = ['n-g1', 'n-g3', 'n-g5', 'n-g7', 'n-g9', 'n-v1', 'n-v4', 'n-v6', 'n-l1', 'n-l3', 'n-l4', 'n-e1', 'n-e2', 'n-e3', 'n-e4'];
const ITENS = BANCO.filter(i => ENTRADA.includes(i.id));
const RESERVA = BANCO.filter(i => !ENTRADA.includes(i.id));

// Tarefas abertas opcionais
const ABERTAS = {
  escrita: { id: 'n-escrita', habilidade: 'escrita', enunciado: 'Escreva de 3 a 5 frases em inglês: quem você é, o que você faz e por que quer melhorar seu inglês.', minPalavras: 15 },
  fala: { id: 'n-fala', habilidade: 'fala', enunciado: 'Leia em voz alta: "I usually work from home, but I go to the office on Tuesdays."', alvo: 'I usually work from home, but I go to the office on Tuesdays' },
};

module.exports = { NIVEIS, ITENS, RESERVA, ABERTAS };
