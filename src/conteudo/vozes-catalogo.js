'use strict';
const { MISSOES } = require('./missoes');
const { UNIDADES } = require('./biblioteca');
const { EXPRESSOES } = require('./brasil-mundo');
const { SONS } = require('./sons-ingles');

// Somente conteúdo fixo publicado. Nenhum material ou texto de aluno entra neste conjunto.
const REACOES = ['Vamos aprender juntos.', 'Falta só um ajuste!', 'Você tentou e conseguiu!', 'Boa sequência!', 'Boa! Você conseguiu!', 'Vamos entender juntos.'];
const CATALOGO_VOZ = new Set([...MISSOES, ...UNIDADES].flatMap(m => [
  ...m.vocab.flatMap(v => [v.en,v.pt,v.ex]),
  ...(m.exemplos || []).flatMap(e => typeof e === 'string' ? [e] : [e.en,e.pt]),
  ...m.exercicios.flatMap(e => [e.audio,e.frase]),
  typeof m.explicacao === 'string' ? m.explicacao : m.explicacao?.texto,
  m.texto,m.traducao,
]).concat(REACOES, SONS.flatMap(s => s.palavras.map(([en]) => en)), EXPRESSOES.flatMap(e => e.equivalentes.flatMap(v => [v.en,v.exemplo,v.pt,v.traducao]))).filter(t => typeof t === 'string' && t.trim() && t.length<=3000).map(t => t.trim()));
module.exports={CATALOGO_VOZ};
