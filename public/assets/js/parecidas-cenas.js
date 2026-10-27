// Desenhos das palavras parecidas: bola, caixa e carro. SVG fixo e confiável (sem dados do aluno), com fundo próprio para ler em qualquer tema.
const BOLA = (x, y, r = 11) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#E5383B" stroke="#9D1D20" stroke-width="2"/><circle cx="${x - r / 3}" cy="${y - r / 3}" r="${r / 4}" fill="#fff" opacity=".7"/>`;
const CAIXA = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="#C98B4B" stroke="#8A5A27" stroke-width="2"/><rect x="${x + w * .3}" y="${y}" width="${w * .4}" height="5" fill="#E8B77A"/>`;
const CARRO = (x, y) => `<g transform="translate(${x} ${y})"><rect x="0" y="8" width="46" height="16" rx="5" fill="#2F6FDE" stroke="#1B3F86" stroke-width="2"/><path d="M10 8 L16 -2 H32 L38 8 Z" fill="#8FB8FF" stroke="#1B3F86" stroke-width="2" stroke-linejoin="round"/><circle cx="11" cy="25" r="5.5" fill="#333"/><circle cx="35" cy="25" r="5.5" fill="#333"/></g>`;
const SETA = (d, tracejada = true) => `<path d="${d}" fill="none" stroke="#1F2A44" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" ${tracejada ? 'stroke-dasharray="2 7"' : ''} marker-end="url(#ponta)"/>`;
const CHAO = '<rect x="0" y="100" width="200" height="20" fill="#9ED89B"/>';
const MESA = '<rect x="58" y="48" width="84" height="9" rx="3" fill="#8A5A27"/><rect x="64" y="57" width="7" height="43" fill="#8A5A27"/><rect x="129" y="57" width="7" height="43" fill="#8A5A27"/>';
const GARAGEM = '<path d="M104 52 L145 28 L186 52 V100 H104 Z" fill="#F4C95D" stroke="#B48A1E" stroke-width="2" stroke-linejoin="round"/><rect x="118" y="64" width="54" height="36" fill="#3B2F2F"/>';
const ESTRADA = '<rect x="0" y="84" width="200" height="22" fill="#6B7280"/><path d="M0 95 H200" stroke="#fff" stroke-width="2" stroke-dasharray="12 10"/>';

export const CENAS = {
  in: CHAO + `<rect x="76" y="58" width="48" height="42" rx="4" fill="#A9733A"/>${BOLA(100, 68, 12)}<rect x="76" y="76" width="48" height="24" rx="4" fill="#C98B4B" stroke="#8A5A27" stroke-width="2"/>`,
  on: CHAO + CAIXA(78, 66, 44, 34) + BOLA(100, 55),
  under: CHAO + MESA + BOLA(100, 88),
  over: CHAO + CAIXA(78, 70, 44, 30) + SETA('M52 66 Q100 -6 148 66') + BOLA(100, 30),
  above: CHAO + CAIXA(78, 80, 44, 20) + BOLA(100, 28) + '<path d="M100 44 V74" stroke="#1F2A44" stroke-width="2" stroke-dasharray="3 5"/>',
  behind: CHAO + BOLA(122, 82, 16) + CAIXA(56, 62, 56, 38),
  'in front of': CHAO + CAIXA(56, 60, 56, 40) + BOLA(98, 86, 15),
  beside: CHAO + CAIXA(40, 64, 46, 36) + BOLA(130, 89),
  between: CHAO + CAIXA(22, 62, 44, 38) + CAIXA(134, 62, 44, 38) + BOLA(100, 89),
  among: CHAO + CAIXA(52, 40, 30, 28) + CAIXA(52, 72, 30, 28) + CAIXA(118, 40, 30, 28) + CAIXA(118, 72, 30, 28) + CAIXA(14, 72, 26, 28) + CAIXA(160, 72, 26, 28) + BOLA(100, 70, 12),
  through: '<path d="M26 100 V62 Q26 26 100 26 Q174 26 174 62 V100 Z" fill="#8EA95B" stroke="#5A6F31" stroke-width="2"/><path d="M62 100 V68 Q62 46 100 46 Q138 46 138 68 V100 Z" fill="#2B2B2B"/><rect x="0" y="100" width="200" height="20" fill="#6B7280"/>' + CARRO(77, 78) + SETA('M6 88 H194'),
  across: '<rect x="0" y="74" width="200" height="46" fill="#7CC3F2"/><rect x="0" y="66" width="44" height="54" fill="#9ED89B"/><rect x="156" y="66" width="44" height="54" fill="#9ED89B"/><rect x="30" y="62" width="140" height="8" rx="3" fill="#8A5A27"/>' + CARRO(77, 36) + SETA('M20 28 H180'),
  along: '<rect x="0" y="96" width="200" height="24" fill="#9ED89B"/>' + ESTRADA + CARRO(30, 58) + SETA('M82 82 H186') + '<circle cx="40" cy="104" r="0"/>',
  around: '<rect x="0" y="100" width="200" height="20" fill="#9ED89B"/><circle cx="100" cy="62" r="20" fill="#7DBE6D" stroke="#4E8A42" stroke-width="2"/><circle cx="100" cy="62" r="40" fill="none" stroke="#6B7280" stroke-width="14"/>' + CARRO(77, 6) + SETA('M146 40 A48 48 0 0 1 100 112'),
  into: CHAO + GARAGEM + CARRO(20, 76) + SETA('M72 90 H114'),
  'out of': CHAO + GARAGEM + CARRO(20, 76) + SETA('M114 90 H72'),
  towards: CHAO + '<rect x="150" y="40" width="4" height="60" fill="#8A5A27"/><path d="M154 40 L186 52 L154 64 Z" fill="#E5383B"/>' + CARRO(20, 76) + SETA('M76 90 H136'),
};

export const svgDe = id => `<svg class="parecidas__cena" viewBox="0 0 200 120" role="img" focusable="false"><defs><marker id="ponta" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="#1F2A44"/></marker></defs><rect width="200" height="120" fill="#FFF6DD"/>${CENAS[id]}</svg>`;

// grupos de palavras que se confundem. frase: exemplo com objeto infantil; dica: o que separa uma da outra
export const GRUPOS = [
  { id: 'lugar', titulo: 'Dentro, em cima ou embaixo', pergunta: 'Onde está a bola?', itens: [
    { id: 'in', en: 'in', pt: 'dentro de', frase: 'The ball is in the box.', fraseTr: 'A bola está dentro da caixa.', dica: '"In" é dentro de algo com bordas, como uma caixa.' },
    { id: 'on', en: 'on', pt: 'em cima de, encostado', frase: 'The ball is on the box.', fraseTr: 'A bola está em cima da caixa.', dica: '"On" é em cima, encostando na superfície.' },
    { id: 'under', en: 'under', pt: 'embaixo de', frase: 'The ball is under the table.', fraseTr: 'A bola está embaixo da mesa.', dica: '"Under" é embaixo, com algo por cima.' } ] },
  { id: 'altura', titulo: 'Em cima: on, above e over', pergunta: 'Onde está a bola?', itens: [
    { id: 'on', en: 'on', pt: 'em cima, encostado', frase: 'The ball is on the box.', fraseTr: 'A bola está em cima da caixa.', dica: '"On" encosta. A bola está apoiada na caixa.' },
    { id: 'above', en: 'above', pt: 'acima, sem encostar', frase: 'The ball is above the box.', fraseTr: 'A bola está acima da caixa.', dica: '"Above" é mais alto, mas sem encostar.' },
    { id: 'over', en: 'over', pt: 'por cima, de um lado ao outro', frase: 'The ball goes over the box.', fraseTr: 'A bola passa por cima da caixa.', dica: '"Over" é passar por cima, com movimento de um lado ao outro.' } ] },
  { id: 'perto', titulo: 'Atrás, na frente e ao lado', pergunta: 'Onde está a bola?', itens: [
    { id: 'behind', en: 'behind', pt: 'atrás de', frase: 'The ball is behind the box.', fraseTr: 'A bola está atrás da caixa.', dica: '"Behind" é atrás: a caixa esconde um pedaço da bola.' },
    { id: 'in front of', en: 'in front of', pt: 'na frente de', frase: 'The ball is in front of the box.', fraseTr: 'A bola está na frente da caixa.', dica: '"In front of" é na frente, escondendo a caixa.' },
    { id: 'beside', en: 'beside', pt: 'ao lado de', frase: 'The ball is beside the box.', fraseTr: 'A bola está ao lado da caixa.', dica: '"Beside" é do lado, na mesma linha. Também vale "next to".' } ] },
  { id: 'meio', titulo: 'Entre e no meio de', pergunta: 'Onde está a bola?', itens: [
    { id: 'between', en: 'between', pt: 'entre duas coisas', frase: 'The ball is between two boxes.', fraseTr: 'A bola está entre duas caixas.', dica: '"Between" é entre DUAS coisas.' },
    { id: 'among', en: 'among', pt: 'no meio de várias', frase: 'The ball is among the boxes.', fraseTr: 'A bola está no meio das caixas.', dica: '"Among" é no meio de VÁRIAS coisas, cercada.' } ] },
  { id: 'caminho', titulo: 'Carros: atravessar, passar e contornar', pergunta: 'O que o carro faz?', itens: [
    { id: 'through', en: 'through', pt: 'através de, por dentro', frase: 'The car goes through the tunnel.', fraseTr: 'O carro passa pelo túnel.', dica: '"Through" é atravessar por dentro, como num túnel.' },
    { id: 'across', en: 'across', pt: 'de um lado ao outro', frase: 'The car goes across the bridge.', fraseTr: 'O carro atravessa a ponte.', dica: '"Across" é cruzar de um lado ao outro de uma superfície.' },
    { id: 'along', en: 'along', pt: 'ao longo de', frase: 'The car goes along the road.', fraseTr: 'O carro anda ao longo da estrada.', dica: '"Along" é seguir a linha de algo, como uma estrada.' },
    { id: 'around', en: 'around', pt: 'em volta de', frase: 'The car goes around the circle.', fraseTr: 'O carro dá a volta na rotatória.', dica: '"Around" é girar em volta de algo.' } ] },
  { id: 'entrar', titulo: 'Carros: entrar, sair e ir em direção a', pergunta: 'O que o carro faz?', itens: [
    { id: 'into', en: 'into', pt: 'para dentro de', frase: 'The car goes into the garage.', fraseTr: 'O carro entra na garagem.', dica: '"Into" é entrar: de fora para dentro.' },
    { id: 'out of', en: 'out of', pt: 'para fora de', frase: 'The car comes out of the garage.', fraseTr: 'O carro sai da garagem.', dica: '"Out of" é sair: de dentro para fora.' },
    { id: 'towards', en: 'towards', pt: 'na direção de', frase: 'The car goes towards the flag.', fraseTr: 'O carro vai em direção à bandeira.', dica: '"Towards" é ir na direção de algo, sem chegar ainda.' } ] },
];
