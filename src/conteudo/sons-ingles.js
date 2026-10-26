'use strict';
// Guia de sons do inglês para quem está começando: os pontos em que quem fala português mais tropeça.
// Cada grupo traz palavras reais para ouvir (as vozes oficiais) e uma dica curta em português.
const SONS = [
  { id: 'th', titulo: 'TH: língua entre os dentes', dica: 'Coloque a ponta da língua entre os dentes e sopre de leve. Não é "t" nem "f".', palavras: [['thank', 'thénk'], ['three', 'thrí'], ['think', 'thínk'], ['mother', 'mâ-dher']] },
  { id: 'r', titulo: 'R: não é o "rr" do português', dica: 'No começo da palavra, arredonde os lábios e levante a língua sem encostar no céu da boca. Não solte o "r" forte nem o "h".', palavras: [['red', 'réd'], ['right', 'ráit'], ['run', 'rân'], ['room', 'rum']] },
  { id: 'h', titulo: 'H: um sopro leve', dica: 'Solte o ar como se estivesse embaçando um vidro. O "h" inglês é suave, bem diferente do "r" de "rato".', palavras: [['hello', 'ré-lou'], ['home', 'rôum'], ['house', 'ráus'], ['happy', 'ré-pi']] },
  { id: 'i', titulo: 'I curto e I longo', dica: 'Em "ship" o som é curto e relaxado. Em "sheep" ele é mais longo e esticado. Ouça os dois seguidos.', palavras: [['ship', 'chip'], ['sheep', 'chíip'], ['bit', 'bit'], ['beat', 'bíit']] },
  { id: 's', titulo: 'S no começo: sem "e" antes', dica: 'Em português dizemos "escola". Em inglês não existe o "e" na frente: é "school", direto no "s".', palavras: [['school', 'scul'], ['street', 'strít'], ['small', 'smól'], ['speak', 'spík']] },
  { id: 'final', titulo: 'Final seco: sem "i" no fim', dica: 'Termine a palavra na consoante. É "dog", não "dogui"; é "bed", não "bédi".', palavras: [['dog', 'dóg'], ['cat', 'quét'], ['bed', 'béd'], ['bag', 'bég']] },
  { id: 'ed', titulo: 'Final -ed: soa como T ou D', dica: 'Em "worked" o som é "t". Em "played" é "d". Não diga "worquêd".', palavras: [['worked', 'uérkt'], ['played', 'plêid'], ['asked', 'ésk-t'], ['called', 'cóld']] },
  { id: 'w', titulo: 'W: lábios em "u"', dica: 'Comece com os lábios arredondados, como quem vai dizer "u", e abra rápido para a vogal seguinte.', palavras: [['water', 'uó-ter'], ['we', 'uí'], ['work', 'uérk'], ['one', 'uân']] },
];
// Nome de cada letra, escrito como se lê em português.
const LETRAS = [['A', 'êi'], ['B', 'bí'], ['C', 'sí'], ['D', 'dí'], ['E', 'í'], ['F', 'éf'], ['G', 'djí'], ['H', 'êitch'], ['I', 'ái'], ['J', 'djêi'], ['K', 'quêi'], ['L', 'él'], ['M', 'ém'], ['N', 'én'], ['O', 'ôu'], ['P', 'pí'], ['Q', 'quiú'], ['R', 'ár'], ['S', 'és'], ['T', 'tí'], ['U', 'iú'], ['V', 'ví'], ['W', 'dâ-bol-iú'], ['X', 'éks'], ['Y', 'uái'], ['Z', 'zí']];
module.exports = { SONS, LETRAS };
