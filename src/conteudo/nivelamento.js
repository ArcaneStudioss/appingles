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

function paraPublico(faixa = 'adulto') {
  if (faixa === 'adulto') return { itens: ITENS, abertas: ABERTAS };
  const { POR_UNIDADE } = require('./biblioteca');
  const a2 = POR_UNIDADE[faixa === 'crianca' ? 'crianca-brincadeiras' : 'adolescente-projeto'];
  const b1 = POR_UNIDADE[faixa === 'crianca' ? 'crianca-natureza' : 'adolescente-tecnologia'];
  const b2 = faixa === 'crianca'
    ? { texto: 'The school library introduced a quiet reading corner, expecting students to borrow more books. Although book borrowing did increase, the librarian noticed something else: students began recommending stories to one another and discussing characters during breaks. She concluded that the corner was useful not only because it provided a calm space, but because it gave students a reason to share their ideas.', pergunta: 'O que a bibliotecária percebeu além do aumento nos empréstimos?', opcoes: ['Os alunos passaram a compartilhar e discutir histórias', 'Os alunos deixaram de conversar', 'A biblioteca passou a emprestar menos livros'] }
    : { texto: 'A student council proposed banning phones throughout the school day to improve concentration. While some students welcomed the idea, others pointed out that phones were also used for research and accessibility. The council eventually recommended clear rules for specific situations instead of a complete ban. Its report argued that understanding when and why a tool is useful can be more effective than simply removing it.', pergunta: 'Por que o conselho preferiu regras por situação?', opcoes: ['Os celulares também têm usos úteis, como pesquisa e acessibilidade', 'Queria liberar os celulares em toda aula', 'Nenhum aluno tinha dificuldade para se concentrar'] };
  const ajustes = {
    'n-g1': { enunciado: 'She ___ my friend.' },
    'n-g3': { enunciado: 'Yesterday I ___ to the park.' },
    'n-g5': { enunciado: "I've studied English ___ 2023." },
    'n-g7': { enunciado: 'By the time we arrived, the game ___.' },
    'n-g9': { enunciado: 'Not only ___ the puzzle, but she also helped her friends.', opcoes: ['did she solve', 'she solved', 'she did solve', 'solved she'] },
    'n-v6': { enunciado: 'We need to ___ a decision about our school project.' },
    'n-l1': { texto: a2.texto, pergunta: a2.perguntas[0][0], opcoes: a2.perguntas[0][1] },
    'n-l3': { texto: b1.texto, pergunta: b1.perguntas[1][0], opcoes: b1.perguntas[1][1] },
    'n-l4': b2,
    'n-e4': { audio: "If we'd known about the rain earlier, we could have moved the school event indoors and avoided most of the problems.", pergunta: 'O que a pessoa quer dizer?', opcoes: ['Se soubessem da chuva antes, teriam levado o evento para dentro', 'O evento aconteceu sem problemas', 'Não choveu durante o evento', 'Vão cancelar todos os eventos da escola'] },
  };
  const alvo = faixa === 'crianca' ? 'I like stories and I read with my friends' : 'I like music and I study with my friends after school';
  return { itens: ITENS.map(i => ({ ...i, ...ajustes[i.id] })), abertas: { escrita: { ...ABERTAS.escrita, enunciado: 'Escreva algumas frases sobre você: seus interesses, algo de que gosta e o que quer aprender.' }, fala: { ...ABERTAS.fala, alvo, enunciado: `Leia em voz alta: "${alvo}."` } } };
}
module.exports = { NIVEIS, ITENS, RESERVA, ABERTAS, paraPublico };
