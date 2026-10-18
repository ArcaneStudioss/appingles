'use strict';
// Conversa sem IA: roteiro do cenário + correção pelos detectores. Honesta sobre o limite:
// ela não entende o conteúdo da resposta, só conduz e aponta padrões de erro conhecidos.
const { CENARIOS } = require('../conteudo/cenarios');
const { detectar } = require('../conteudo/dificuldades');
const { palavras } = require('./util');

const REACOES = ['Okay, thanks for sharing.', 'Got it.', 'Interesting!', 'Nice.', 'I see.', 'That makes sense.'];

function turnoOffline(cenarioId, historico, textoAluno) {
  const c = CENARIOS[cenarioId];
  const perguntasFeitas = historico.filter(m => m.papel === 'tutor').length;  // a abertura conta como a 1ª
  const n = palavras(textoAluno);
  const achados = detectar(textoAluno);
  let resposta;
  if (n < 3) resposta = "Could you tell me a little more? Try a full sentence. It's okay to make mistakes.";
  else {
    const prox = c.roteiro[perguntasFeitas - 1];
    resposta = prox ? `${REACOES[perguntasFeitas % REACOES.length]} ${prox}` : 'Thanks, that was a great conversation! Let\'s stop here. Check the notes on the side to see what to practice next.';
  }
  const encerrar = n >= 3 && perguntasFeitas - 1 >= c.roteiro.length;
  return {
    resposta,
    correcoes: achados.map(a => ({ trecho: a.trecho, sugestao: a.sugestao, explicacao: a.explicacao, tag: a.tag, confianca: a.confianca })),
    encerrar,
    modo: 'roteiro',
  };
}

module.exports = { turnoOffline };
