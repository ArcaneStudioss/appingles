// Desenhos das palavras parecidas: bola, caixa e carro. SVG fixo e confiável (sem dados do aluno), com céu e grama próprios para ler em qualquer tema.
// Volume com degradês, brilho e sombra no chão; os degradês ficam em DEFS e valem para todos os desenhos.
const SOMBRA = (x, y, rx) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${Math.max(2.5, rx / 6)}" fill="#1B3A1B" opacity=".28"/>`;
const BOLA = (x, y, r = 11, sombra = 0) => (sombra ? SOMBRA(x, sombra, r * .95) : '') + `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#gBola)"/><path d="M${x - r * .9} ${y - r * .15} Q${x} ${y + r * .45} ${x + r * .9} ${y - r * .15}" fill="none" stroke="#fff" stroke-width="${r / 5}" opacity=".55"/><ellipse cx="${x - r * .38}" cy="${y - r * .45}" rx="${r * .28}" ry="${r * .18}" fill="#fff" opacity=".85" transform="rotate(-30 ${x - r * .38} ${y - r * .45})"/>`;
const TABUAS = (x, y, w, h) => [1, 2].map(k => `<path d="M${x + 2} ${y + h * k / 3} H${x + w - 2}" stroke="#7A4A1E" stroke-width="1.3" opacity=".55"/>`).join('');
const CAIXA = (x, y, w, h, sombra = true) => (sombra ? SOMBRA(x + w / 2 + 3, y + h, w * .58) : '') + `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="url(#gMadeira)" stroke="#7A4A1E" stroke-width="1.8"/>${TABUAS(x, y, w, h)}<rect x="${x + w * .36}" y="${y}" width="${w * .28}" height="${h}" fill="#F0D9A8" opacity=".75"/><rect x="${x}" y="${y}" width="${w}" height="4" rx="2" fill="#fff" opacity=".28"/>`;
const CARRO = (x, y) => `<g transform="translate(${x} ${y})">${SOMBRA(24, 31, 29)}<path d="M2 24 Q0 14 6 12 L12 11 Q16 0 24 0 H34 Q40 0 44 11 L48 13 Q51 16 50 24 Q50 27 47 27 H5 Q2 27 2 24 Z" fill="url(#gCarro)" stroke="#173C86" stroke-width="1.8" stroke-linejoin="round"/><path d="M15 11 Q18 3 24 3 H27 V11 Z M31 11 V3 H34 Q38 3 41 11 Z" fill="url(#gVidro)" stroke="#173C86" stroke-width="1.2"/><rect x="45" y="15" width="5" height="5" rx="2" fill="#FFE98A"/><rect x="1" y="16" width="4" height="4" rx="1.5" fill="#FF6B6B"/><path d="M6 17 H44" stroke="#fff" stroke-width="1.3" opacity=".4"/>${[13, 39].map(cx => `<circle cx="${cx}" cy="27" r="7" fill="#222"/><circle cx="${cx}" cy="27" r="3.6" fill="#C9CED6"/><circle cx="${cx}" cy="27" r="1.2" fill="#6B7280"/>`).join('')}</g>`;
const SETA = (d, tracejada = true) => `<path d="${d}" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".7"/><path d="${d}" fill="none" stroke="#1F2A44" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" ${tracejada ? 'stroke-dasharray="1 7"' : ''} marker-end="url(#ponta)"/>`;
const GRAMA = '<rect x="0" y="100" width="200" height="20" fill="url(#gGrama)"/><path d="M0 100 Q25 96 50 100 T100 100 T150 100 T200 100" fill="#7CC95B"/>';
const MESA = SOMBRA(100, 100, 46) + '<rect x="64" y="57" width="7" height="43" fill="#8A5A27"/><rect x="129" y="57" width="7" height="43" fill="#6E4520"/><rect x="56" y="47" width="88" height="11" rx="3" fill="url(#gMadeira)" stroke="#7A4A1E" stroke-width="1.8"/><rect x="56" y="47" width="88" height="3.5" rx="2" fill="#fff" opacity=".3"/>';
const GARAGEM = SOMBRA(146, 101, 44) + '<rect x="106" y="52" width="80" height="48" fill="#F2E3C2" stroke="#B59A63" stroke-width="2"/><path d="M100 54 L146 26 L192 54 Z" fill="url(#gTelhado)" stroke="#7C2F25" stroke-width="2" stroke-linejoin="round"/><rect x="118" y="64" width="56" height="36" fill="#2E2626"/><rect x="118" y="64" width="56" height="36" fill="url(#gSombraPorta)"/><path d="M118 64 H174 M118 70 H174" stroke="#8C7F7F" stroke-width="1.2" opacity=".5"/>';
const ESTRADA = '<rect x="0" y="82" width="200" height="26" fill="url(#gAsfalto)"/><path d="M0 94 H200" stroke="#fff" stroke-width="2.2" stroke-dasharray="12 9"/><rect x="0" y="80" width="200" height="3" fill="#D8D3C4"/>';
const ARVORE = (x, y) => `${SOMBRA(x, y, 11)}<rect x="${x - 2.5}" y="${y - 16}" width="5" height="16" fill="#7A4A1E"/><circle cx="${x}" cy="${y - 24}" r="12" fill="#3E9E4A"/><circle cx="${x - 5}" cy="${y - 28}" r="7" fill="#5CBA5F" opacity=".8"/>`;

export const CENAS = {
  in: GRAMA + SOMBRA(103, 100, 30) + '<rect x="76" y="58" width="48" height="42" rx="3" fill="#5E3A17"/>' + BOLA(100, 68, 12) + '<rect x="76" y="76" width="48" height="24" rx="3" fill="url(#gMadeira)" stroke="#7A4A1E" stroke-width="1.8"/>' + TABUAS(76, 76, 48, 24) + '<rect x="76" y="76" width="48" height="4" rx="2" fill="#fff" opacity=".28"/>',
  on: GRAMA + CAIXA(78, 68, 44, 32) + BOLA(100, 57, 11),
  under: GRAMA + MESA + BOLA(100, 88, 11, 100),
  over: GRAMA + CAIXA(78, 72, 44, 28) + SETA('M52 66 Q100 -6 148 66') + BOLA(100, 30),
  above: GRAMA + CAIXA(78, 82, 44, 18) + BOLA(100, 28) + '<path d="M100 44 V76" stroke="#1F2A44" stroke-width="2" stroke-dasharray="3 5"/>',
  behind: GRAMA + SOMBRA(124, 100, 17) + BOLA(122, 82, 16) + CAIXA(56, 62, 56, 38),
  'in front of': GRAMA + CAIXA(56, 60, 56, 40) + BOLA(98, 86, 15, 100),
  beside: GRAMA + CAIXA(40, 64, 46, 36) + BOLA(130, 89, 11, 100),
  between: GRAMA + CAIXA(22, 62, 44, 38) + CAIXA(134, 62, 44, 38) + BOLA(100, 89, 11, 100),
  among: GRAMA + CAIXA(14, 72, 26, 28) + CAIXA(160, 72, 26, 28) + CAIXA(52, 72, 30, 28) + CAIXA(118, 72, 30, 28) + CAIXA(52, 44, 30, 28, false) + CAIXA(118, 44, 30, 28, false) + BOLA(100, 78, 12, 100),
  through: '<rect x="0" y="100" width="200" height="20" fill="url(#gAsfalto)"/><path d="M14 100 V64 Q14 22 100 22 Q186 22 186 64 V100 Z" fill="url(#gMorro)" stroke="#4F6B2C" stroke-width="2"/><path d="M58 100 V70 Q58 42 100 42 Q142 42 142 70 V100 Z" fill="#1E1E1E" stroke="#8F8F8F" stroke-width="3"/><path d="M58 100 V70 Q58 42 100 42" fill="none" stroke="#B9B2A2" stroke-width="3"/>' + CARRO(77, 76) + SETA('M6 90 H194'),
  across: '<rect x="0" y="70" width="200" height="50" fill="url(#gRio)"/><path d="M52 96 q8 -4 16 0 t16 0 M110 106 q8 -4 16 0 t16 0" stroke="#fff" stroke-width="2" fill="none" opacity=".6"/><rect x="0" y="62" width="44" height="58" fill="url(#gGrama)"/><rect x="156" y="62" width="44" height="58" fill="url(#gGrama)"/><rect x="34" y="62" width="132" height="9" rx="3" fill="url(#gMadeira)" stroke="#7A4A1E" stroke-width="1.8"/><path d="M34 52 V62 M166 52 V62 M34 54 H166" stroke="#7A4A1E" stroke-width="2.2" stroke-linecap="round"/><rect x="74" y="71" width="6" height="22" fill="#6E4520"/><rect x="120" y="71" width="6" height="22" fill="#6E4520"/>' + CARRO(77, 28) + SETA('M20 22 H180'),
  along: '<rect x="0" y="100" width="200" height="20" fill="url(#gGrama)"/>' + ARVORE(168, 82) + ESTRADA + CARRO(28, 54) + SETA('M82 76 H186'),
  around: GRAMA + '<circle cx="100" cy="62" r="42" fill="url(#gAsfalto)" stroke="#D8D3C4" stroke-width="2"/><circle cx="100" cy="62" r="22" fill="url(#gGrama)" stroke="#D8D3C4" stroke-width="2"/><circle cx="100" cy="62" r="32" fill="none" stroke="#fff" stroke-width="1.5" stroke-dasharray="6 5"/>' + CARRO(77, 8) + SETA('M150 38 A50 50 0 0 1 100 112'),
  into: GRAMA + GARAGEM + CARRO(20, 74) + SETA('M72 90 H114'),
  'out of': GRAMA + GARAGEM + CARRO(20, 74) + SETA('M114 90 H72'),
  towards: GRAMA + ARVORE(176, 100) + '<rect x="146" y="40" width="3.5" height="60" fill="#8A5A27"/><path d="M149.5 40 L182 51 L149.5 62 Z" fill="#E5383B" stroke="#9D1D20" stroke-width="1.5" stroke-linejoin="round"/>' + CARRO(20, 74) + SETA('M76 90 H132'),
};

const NUVEM = (x, y, e = 1) => `<g transform="translate(${x} ${y}) scale(${e})" fill="#fff" opacity=".9"><ellipse cx="0" cy="0" rx="14" ry="6"/><ellipse cx="9" cy="-4" rx="9" ry="6"/><ellipse cx="-8" cy="-3" rx="7" ry="5"/></g>`;
const DEFS = '<defs><marker id="ponta" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="#1F2A44"/></marker>'
  + '<linearGradient id="gCeu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8FD3FF"/><stop offset="1" stop-color="#EAF8FF"/></linearGradient>'
  + '<linearGradient id="gGrama" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7FCB5B"/><stop offset="1" stop-color="#4E9E3A"/></linearGradient>'
  + '<radialGradient id="gBola" cx=".35" cy=".3" r=".85"><stop offset="0" stop-color="#FF8A80"/><stop offset=".45" stop-color="#E5383B"/><stop offset="1" stop-color="#8E1519"/></radialGradient>'
  + '<linearGradient id="gMadeira" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E2A95F"/><stop offset="1" stop-color="#B7773A"/></linearGradient>'
  + '<linearGradient id="gCarro" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6FA2FF"/><stop offset=".55" stop-color="#2F6FDE"/><stop offset="1" stop-color="#1B3F9A"/></linearGradient>'
  + '<linearGradient id="gVidro" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E4F3FF"/><stop offset="1" stop-color="#8DBBE8"/></linearGradient>'
  + '<linearGradient id="gAsfalto" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7B8190"/><stop offset="1" stop-color="#585E6C"/></linearGradient>'
  + '<linearGradient id="gRio" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7CCBF5"/><stop offset="1" stop-color="#3C93D1"/></linearGradient>'
  + '<linearGradient id="gMorro" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8FBF5A"/><stop offset="1" stop-color="#5F8E3A"/></linearGradient>'
  + '<linearGradient id="gTelhado" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D9604F"/><stop offset="1" stop-color="#A83A2E"/></linearGradient>'
  + '<linearGradient id="gSombraPorta" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".45"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient></defs>';

export const svgDe = id => `<svg class="parecidas__cena" viewBox="0 0 200 120" role="img" focusable="false">${DEFS}<rect width="200" height="120" fill="url(#gCeu)"/><circle cx="178" cy="16" r="9" fill="#FFE27A" opacity=".95"/>${NUVEM(30, 18)}${NUVEM(138, 30, .7)}${CENAS[id]}</svg>`;

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
