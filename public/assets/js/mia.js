// Mia, a tutora: adolescente de tranças com miçangas, em peças separadas (cabeça grande e expressiva, olhos que piscam e seguem o dedo,
// tranças que balançam, braços com cotovelo e boca que fala). Cada ambiente escolhe uma pose: senta (em pé, relaxada), acena, aponta,
// comemora, ideia, consola, espia. Todo movimento é CSS (bloco "Mia viva" em app.css) e some com "reduzir movimento".
const NS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs = {}, ...filhos) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); e.append(...filhos); return e; };
const traco = (d, cor, larg, extra = {}) => el('path', { d, stroke: cor, 'stroke-width': larg, 'stroke-linecap': 'round', fill: 'none', ...extra });

const PELE = '#6B4430', PELE_SOMBRA = '#55351F', CABELO = '#1B1210', TINTA = '#1A0F0B', BOCA = '#2A130C', AZUL = '#2E73D9', AZUL_ESC = '#1F55A8', AZUL_CLARO = '#7FB0F5';
export const POSES_MIA = ['senta', 'acena', 'aponta', 'comemora', 'ideia', 'consola', 'espia'];

// viewBox 120 x 156: da cabeça à barra da camisa. Em tamanho pequeno o SVG corta e mostra só cabeça e ombros.
export function desenharMia(humor = 'oi', { tamanho = 120, rotulo = 'Mia, a tutora do Tuiuiú', pose = 'senta' } = {}) {
  if (!POSES_MIA.includes(pose)) pose = 'senta';
  const pequeno = tamanho <= 60, espia = pose === 'espia';
  const feliz = humor === 'feliz' || humor === 'festa';
  const largura = pequeno ? tamanho : Math.round(tamanho * 120 / 156);
  const alto = pequeno ? tamanho : espia ? Math.round(tamanho * 0.6) : tamanho;
  const s = el('svg', { viewBox: '0 0 120 156', width: largura, height: alto, preserveAspectRatio: pequeno || espia ? 'xMidYMin slice' : 'xMidYMid meet',
    class: `lou lou--mia lou--mia2 lou--${humor} m2--${pose}` + (pequeno ? ' lou--busto' : ''), role: rotulo ? 'img' : 'presentation', ...(rotulo ? { 'aria-label': rotulo } : { 'aria-hidden': 'true' }), focusable: 'false' });
  s.style.setProperty('--tui-atraso', `${-(Math.random() * 6).toFixed(2)}s`);
  const corpo = el('g', { class: 'lou__corpo' });
  const vida = el('g', { class: 'm2__vida' });   // respiração do tronco e dos braços
  corpo.append(vida);

  // pescoço e camisa azul solta, com colarinho, botões e bolso
  vida.append(el('rect', { x: 53.5, y: 64, width: 13, height: 20, rx: 4, fill: PELE_SOMBRA }),
    el('path', { d: 'M30 98 Q33 82 54 80 L66 80 Q87 82 90 98 L94 156 L26 156 Z', fill: AZUL }),
    el('path', { d: 'M60 80 L90 98 L94 156 L60 156 Z', fill: AZUL_ESC, opacity: 0.14 }),
    traco('M60 94 L60 156', AZUL_ESC, 1.2),
    el('path', { d: 'M53 79 L60 95 L51 98 L45 84 Z', fill: AZUL_CLARO }), el('path', { d: 'M67 79 L60 95 L69 98 L75 84 Z', fill: AZUL_CLARO }),
    el('rect', { x: 68, y: 108, width: 11, height: 11, rx: 1.5, fill: 'none', stroke: AZUL_ESC, 'stroke-width': 1.1 }));
  for (const y of [104, 118, 132, 146]) vida.append(el('circle', { cx: 60, cy: y, r: 1.4, fill: '#DCEBFF' }));

  // braços: manga dobrada, antebraço e mão (o antebraço gira no cotovelo)
  const braco = lado => {
    const e = lado === 'esquerdo', ox = e ? 0 : 120, f = e ? 1 : -1;
    const x = v => ox + f * v;
    return el('g', { class: `m2__braco m2__braco--${lado}` },
      el('path', { d: `M${x(24)} 90 Q${x(15)} 106 ${x(18)} 126 L${x(33)} 128 Q${x(35)} 108 ${x(40)} 95 Z`, fill: AZUL }),
      traco(`M${x(18)} 126 L${x(33)} 128`, AZUL_ESC, 1.6),
      el('g', { class: 'm2__antebraco' },
        el('path', { d: `M${x(19)} 125 L${x(32)} 127 L${x(31)} 142 L${x(21)} 141 Z`, fill: PELE }),
        el('ellipse', { cx: x(26), cy: 147, rx: 6.4, ry: 7.4, fill: PELE }),
        el('ellipse', { cx: x(32), cy: 143, rx: 2.4, ry: 4, fill: PELE, transform: `rotate(${f * -25} ${x(32)} ${143})` })));
  };
  vida.append(braco('esquerdo'), braco('direito'));

  // seis tranças em frente aos ombros, com miçangas
  const trancas = [['M36 38 Q22 70 26 116', 26, 116, '#FF6FA5'], ['M33 46 Q16 78 21 108', 21, 108, '#FFC83D'], ['M40 44 Q30 80 33 124', 33, 124, '#FFC83D'],
    ['M84 38 Q98 70 94 116', 94, 116, '#FFC83D'], ['M87 46 Q104 78 99 108', 99, 108, '#FF6FA5'], ['M80 44 Q90 80 87 124', 87, 124, '#FF6FA5']];
  trancas.forEach(([d, x, y, cor], i) => {
    const g = el('g', { class: 'm2__tranca m2__tranca--' + (i < 3 ? 'e' : 'd') });
    g.style.setProperty('--i', String(i));
    g.append(traco(d, CABELO, 5.4), traco(d, '#46342D', 5.4, { 'stroke-dasharray': '1.6 2.2', 'stroke-linecap': 'butt', opacity: 0.85 }), el('circle', { cx: x, cy: y, r: 2.8, fill: cor }));
    vida.append(g);
  });

  // cabeça grande, no estilo de desenho animado
  const cab = el('g', { class: 'm2__cabeca' });
  cab.append(el('path', { d: 'M31 54 Q22 4 60 3 Q98 4 89 54 Q86 22 60 18 Q34 22 31 54 Z', fill: CABELO }),
    el('ellipse', { cx: 34.5, cy: 52, rx: 4.4, ry: 7, fill: PELE }), el('ellipse', { cx: 85.5, cy: 52, rx: 4.4, ry: 7, fill: PELE }),
    el('circle', { cx: 34.5, cy: 61, r: 2.5, fill: '#E5A72A' }), el('circle', { cx: 85.5, cy: 61, r: 2.5, fill: '#E5A72A' }),
    el('ellipse', { cx: 60, cy: 50, rx: 26, ry: 29, fill: PELE }),
    el('path', { d: 'M33 48 Q26 8 60 6 Q94 8 87 48 Q82 26 60 22 Q38 26 33 48 Z', fill: CABELO }),
    traco('M41 28 Q45 15 58 10', '#44332C', 1.4), traco('M47 27 Q50 17 59 12', '#44332C', 1.4), traco('M79 28 Q75 15 62 10', '#44332C', 1.4), traco('M73 27 Q70 17 61 12', '#44332C', 1.4),
    traco('M60 9 L60 22', '#2A1D18', 1.6, { opacity: 0.9 }),
    traco('M36 31 Q60 14 84 31', '#FFC83D', 4.4),
    el('g', { transform: 'rotate(22 80 27) translate(80 27) scale(.85) translate(-84 -26)' },
      el('path', { d: 'M84 26 L69 15 L71 36 Z', fill: '#FF6FA5' }), el('path', { d: 'M84 26 L99 19 L96 37 Z', fill: '#FF6FA5' }), el('circle', { cx: 84, cy: 26, r: 4, fill: '#E8408A' })),
    el('circle', { cx: 42.5, cy: 62, r: 5.2, fill: '#FF6F8E', opacity: 0.32 }), el('circle', { cx: 77.5, cy: 62, r: 5.2, fill: '#FF6F8E', opacity: 0.32 }));

  // olhos grandes: branco, íris que segue o dedo, brilho; as pálpebras piscam
  const olhos = el('g', { class: 'lou__olhos' });
  olhos.style.transformOrigin = '60px 50px';
  for (const x of [48.5, 71.5]) {
    const lado = x < 60 ? -1 : 1;
    if (feliz) { olhos.append(traco(`M${x - 6.5} 51 Q${x} 41 ${x + 6.5} 51`, TINTA, 3.2), traco(`M${x + lado * 6.5} 49 L${x + lado * 8.6} 46.8`, TINTA, 1.6)); continue; }
    const ry = humor === 'ops' ? 8.6 : 7.8, ri = humor === 'ops' ? 4.2 : 5, dx = humor === 'pensando' ? 2 : 0, dy = humor === 'pensando' ? -2.4 : humor === 'ops' ? 0.8 : 0;
    olhos.append(el('ellipse', { cx: x, cy: 50, rx: 7, ry, fill: '#fff' }),
      el('g', { class: 'm2__pupila' }, el('circle', { cx: x + dx, cy: 50.5 + dy, r: ri, fill: '#4A2A18' }), el('circle', { cx: x + dx, cy: 50.5 + dy, r: ri * 0.55, fill: '#120A06' }), el('circle', { cx: x + dx + 1.8, cy: 48.6 + dy, r: 1.6, fill: '#fff' })),
      traco(`M${x - 7.2} 48.5 Q${x} ${49 - ry * 1.2} ${x + 7.2} 48.5`, TINTA, 2), traco(`M${x + lado * 7} 47.6 L${x + lado * 9.2} 45.4`, TINTA, 1.5));
  }
  const alto2 = humor === 'ops' ? -3 : humor === 'pensando' ? -2 : 0;
  cab.append(olhos,
    traco(`M40 ${38 + alto2} Q48 ${34 + alto2} 55 ${37.5 + alto2}`, CABELO, 2.6), traco(`M65 ${37.5 + (humor === 'pensando' ? -3 : alto2)} Q72 ${34 + alto2} 80 ${38 + alto2}`, CABELO, 2.6),
    traco('M60 55 Q57 61 61 62', '#3E2418', 1.6));
  // boca: sorriso fechado, aberta (feliz/festa), de lado (pensando), "o" (ops); .m2__fala abre e fecha enquanto ela fala
  if (feliz) cab.append(el('path', { d: 'M48 66 Q60 70 72 66 Q70 81 60 81 Q50 81 48 66 Z', fill: BOCA }), el('path', { d: 'M49.4 66.6 Q60 70.4 70.6 66.6 L70.1 69.6 Q60 73 49.9 69.6 Z', fill: '#fff' }), el('path', { d: 'M54 77 Q60 72.6 66 77 Q64 81 60 81 Q56 81 54 77 Z', fill: '#E8404E' }));
  else if (humor === 'ops') cab.append(el('ellipse', { cx: 60, cy: 71, rx: 3.8, ry: 4.8, fill: BOCA }));
  else if (humor === 'pensando') cab.append(traco('M52 71 Q58 68.5 67 70.5', BOCA, 3.2));
  else cab.append(traco('M51 68 Q60 76 69 68', BOCA, 3.2));
  if (!feliz) cab.append(el('g', { class: 'm2__fala' }, el('path', { d: 'M50 67.5 Q60 71.4 70 67.5 Q68 80 60 80 Q52 80 50 67.5 Z', fill: BOCA }), el('path', { d: 'M54.5 76 Q60 72 65.5 76 Q63.5 80 60 80 Q56.5 80 54.5 76 Z', fill: '#E8404E' })));
  if (humor === 'festa') {
    const cone = 'M42 16 L58 -14 L76 16 Q59 22 42 16 Z', idc = 'mia2-chapeu-' + Math.floor(Math.random() * 1e6);
    cab.append(el('g', { transform: 'rotate(-14 58 14)' }, el('clipPath', { id: idc }, el('path', { d: cone })), el('path', { d: cone, fill: '#FFC83D' }),
      el('g', { 'clip-path': `url(#${idc})` }, traco('M32 14 L68 -10', '#FF6FA5', 5), traco('M32 24 L80 -6', '#FF6FA5', 5), traco('M44 28 L86 4', '#FF6FA5', 5)),
      el('path', { d: 'M42 16 Q59 22 76 16 L75 12 Q59 18 43 12 Z', fill: '#E8408A' }), el('circle', { cx: 58, cy: -15, r: 5.2, fill: '#FF6FA5' })));
  }
  vida.append(cab);
  corpo.append();
  s.append(corpo);
  if (humor === 'pensando') for (const [x, y, r] of [[92, 22, 2], [97, 14, 2.8], [103, 4, 3.8]]) s.append(el('circle', { class: 'm2__ideia', cx: x, cy: y, r, fill: 'var(--tinta-2,#46557A)' }));
  if (humor === 'ops') s.append(el('path', { class: 'm2__gota', d: 'M86 16 Q90 23 86 27 Q82 23 86 16 Z', fill: '#7FD3F5' }));
  if (humor === 'festa') for (const [x, y, r] of [[10, 18, 6], [110, 12, 5], [112, 58, 4]]) s.append(el('path', { class: 'lou__estrela', d: `M${x} ${y - r} L${x + r * 0.3} ${y - r * 0.3} L${x + r} ${y} L${x + r * 0.3} ${y + r * 0.3} L${x} ${y + r} L${x - r * 0.3} ${y + r * 0.3} L${x - r} ${y} L${x - r * 0.3} ${y - r * 0.3} Z`, fill: 'var(--sol,#FFC83D)' }));
  return s;
}
