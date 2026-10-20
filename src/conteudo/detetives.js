'use strict';
// "Caça ao erro": o aluno vê uma frase com uma palavra errada e toca nela. É reconhecimento (como escolha), mas parece um jogo
// de detetive, e treina o olho para os erros que ele mesmo comete. O gabarito (`erro`, `correcao`) nunca vai ao navegador.
//
// det(id, frase, errada, certa, explica, extra): a palavra errada tem de aparecer uma única vez na frase (dividida por espaços,
// com a pontuação colada à palavra, como em "informations."). Se aparecer duas vezes, o carregamento falha de propósito.

function det(id, frase, errada, certa, explica, extra = {}) {
  const tokens = frase.split(' ');
  const achados = tokens.reduce((n, t, i) => (t === errada ? n.concat(i) : n), []);
  if (achados.length !== 1) throw new Error(`detetive ${id}: "${errada}" aparece ${achados.length} vezes em "${frase}"`);
  return { id, tipo: 'detetive', habilidade: 'gramatica', dif: 2, tokens, erro: achados[0], correcao: certa, explica, ...extra };
}

// Uma frase por missão antiga (a trilha de debate traz as suas dentro do próprio arquivo).
const BANCO = {
  'apresentar': [det('apresentar-d1', 'I have 30 years and I work at a hospital.', 'have', "am (I'm 30)", 'Idade usa o verbo "to be": I am 30, não "I have 30 years".', { tag: 'idade-have' })],
  'trajetoria': [det('trajetoria-d1', 'I work here since 2019.', 'work', "have worked (I've worked here since 2019)", 'Começou no passado e continua: present perfect com since.', { tag: 'tempo-desde' })],
  'projeto': [det('projeto-d1', 'Last month I buyed a new laptop for the project.', 'buyed', 'bought', '"Buy" é irregular: buy, bought, bought.', { tag: 'passado-irregular' })],
  'perguntas-entrevista': [det('perguntas-entrevista-d1', 'Did you went to the interview yesterday?', 'went', 'go', 'Depois de "did", o verbo volta ao infinitivo: Did you go...?', { tag: 'perguntas-do' })],
  'forcas': [det('forcas-d1', 'He have a great team spirit.', 'have', 'has', 'He/she/it pede "has" (terceira pessoa).', { tag: 'terceira-pessoa' })],
  'perguntar-empresa': [det('perguntar-empresa-d1', 'Can you explain me the benefits?', 'me', 'to me (explain the benefits to me)', 'Em inglês se explica algo "to" alguém: explain the benefits to me.', { tag: 'explicar-para' })],
  'reunioes': [det('reunioes-d1', 'I am agree with your proposal.', 'am', 'remova (I agree)', '"Agree" já é verbo: I agree, sem "am".', { tag: 'concordar' })],
  'emails': [det('emails-d1', 'Thanks for the informations.', 'informations.', 'information', '"Information" não tem plural.', { tag: 'incontaveis' })],
  'pedir-repetir': [det('pedir-repetir-d1', 'Sorry, I no understand.', 'no', "don't", 'Negativa: I don\'t understand.')],
  'atender': [det('atender-d1', 'How can I helps you today?', 'helps', 'help', 'Depois de "can", o verbo fica no infinitivo, sem -s.')],
  'reclamacao': [det('reclamacao-d1', 'The product arrive broken yesterday.', 'arrive', 'arrived', '"Yesterday" pede passado: arrived.')],
  'viagem-chegada': [det('viagem-chegada-d1', 'Can I make a question about the hotel?', 'make', 'ask', 'Pergunta se "faz" com ask: ask a question.', { tag: 'make-do' })],
  'viagem-cidade': [det('viagem-cidade-d1', 'It depends of the weather, so take an umbrella.', 'of', 'on', 'Depend on, não "depend of".', { tag: 'preposicoes' })],
  'fim-de-semana': [det('fim-de-semana-d1', 'On Saturday I goed to the beach with friends.', 'goed', 'went', '"Go" é irregular: go, went, gone.', { tag: 'passado-irregular' })],
  'rotina': [det('rotina-d1', 'She wake up at six every day.', 'wake', 'wakes', 'She/he/it leva -s no presente.', { tag: 'terceira-pessoa' })],
  'planos': [det('planos-d1', 'I pretend to change careers next year.', 'pretend', 'plan', 'Falso amigo: "pretend" é fingir. "Pretendo" = I plan to / I intend to.', { tag: 'falsos-cognatos' })],
  'zero-oi-tchau': [det('zero-oi-tchau-d1', 'Good morning! How is you?', 'is', 'are', 'Com "you" usamos "are": How are you?', { dif: 1 })],
  'zero-nome-origem': [det('zero-nome-origem-d1', 'My name are Ana and I am from Brazil.', 'are', 'is', '"My name" é uma coisa só: is.', { dif: 1 })],
  'zero-numeros': [det('zero-numeros-d1', 'I have twenty years.', 'have', 'am (I am twenty)', 'Idade usa "to be": I am twenty.', { dif: 1, tag: 'idade-have' })],
  'zero-to-be': [det('zero-to-be-d1', 'She are my sister.', 'are', 'is', 'She = is. Com she/he/it usamos "is".', { dif: 1 })],
  'zero-familia': [det('zero-familia-d1', 'This is my mother. He name is Rita.', 'He', 'Her', 'Mulher: her name. Homem: his name.', { dif: 1 })],
  'zero-cores-casa': [det('zero-cores-casa-d1', 'There is three chairs in the kitchen.', 'is', 'are', 'Mais de um: there are.', { dif: 1 })],
  'zero-rotina': [det('zero-rotina-d1', 'I wakes up at seven.', 'wakes', 'wake', 'Com "I", o verbo não leva -s.', { dif: 1 })],
  'zero-comida': [det('zero-comida-d1', 'Can I have a orange juice?', 'a', 'an', '"An" antes de som de vogal: an orange.', { dif: 1 })],
  'zero-lugares': [det('zero-lugares-d1', 'The bank is next at the park.', 'at', 'to', 'Next to = ao lado de.', { dif: 1 })],
  'zero-gostos': [det('zero-gostos-d1', 'I like play football on Sundays.', 'play', 'playing / to play', 'Depois de "like", use -ing ou to + verbo.', { dif: 1 })],
  'zero-conversa': [det('zero-conversa-d1', 'My name is Leo and I am live in Recife.', 'am', 'remova (I live in Recife)', '"Live" já é o verbo. Não precisa de "am".', { dif: 1 })],
};

const detetivesDe = id => (BANCO[id] || []).map(e => ({ ...e }));

module.exports = { det, detetivesDe };
