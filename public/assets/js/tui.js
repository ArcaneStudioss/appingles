// Tuiuiú (arara-azul) em peças separadas, para animar de verdade: respira, pisca, mexe a cabeça, balança a cauda, bate a asa,
// segue o dedo com os olhos e reage ao toque. Sem galho: cada ambiente escolhe uma pose (senta, acena, aponta, comemora, voa, dorme, consola, espia).
// Todo movimento é CSS (app.css, bloco "Tuiuiú vivo") e some quando a pessoa pede menos animação.
const NS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs = {}, ...filhos) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); e.append(...filhos); return e; };

const TINTA_OLHO = '#16224A';
const C = { corpo: 'var(--arara-1,#2447D0)', sombra: 'var(--arara-2,#1A33A0)', luz: 'var(--arara-3,#6C8DFF)', bico: '#3A4254', bicoEsc: '#2B3140', bicoLuz: '#7A849B', anel: '#FFC83D', pata: '#5B6275' };
let seq = 0;

export const POSES = ['senta', 'acena', 'aponta', 'comemora', 'voa', 'dorme', 'consola', 'espia'];

export function desenharTui(humor = 'oi', { tamanho = 96, rotulo = 'Tuiuiú, a arara-azul do Inglou', pose = 'senta' } = {}) {
  if (!POSES.includes(pose)) pose = 'senta';
  const id = ++seq;
  const dorme = pose === 'dorme';
  const feliz = !dorme && (humor === 'feliz' || humor === 'festa');
  const espia = pose === 'espia';
  const alto = espia ? Math.round(tamanho * 0.64) : tamanho;
  const s = el('svg', { viewBox: '0 0 120 120', width: tamanho, height: alto, preserveAspectRatio: espia ? 'xMidYMin slice' : 'xMidYMid meet', class: `lou lou--tui lou--${humor} tui--${pose}`, role: rotulo ? 'img' : 'presentation', ...(rotulo ? { 'aria-label': rotulo } : { 'aria-hidden': 'true' }), focusable: 'false' });
  // cada Tuiuiú pisca e se mexe em ritmo próprio, para vários na tela não ficarem sincronizados
  s.style.setProperty('--tui-atraso', `${-(Math.random() * 6).toFixed(2)}s`);
  const traco = (d, cor, larg, extra = {}) => el('path', { d, stroke: cor, 'stroke-width': larg, 'stroke-linecap': 'round', fill: 'none', ...extra });

  const grad = `tui-g-${id}`;
  s.append(el('defs', {}, el('linearGradient', { id: grad, x1: 0, y1: 0, x2: 0.35, y2: 1 },
    el('stop', { offset: 0, 'stop-color': C.corpo }), el('stop', { offset: 0.62, 'stop-color': C.corpo }), el('stop', { offset: 1, 'stop-color': C.sombra }))));

  // sombra no chão (some quando voa) e a asa do outro lado, que só aparece nas poses de braços abertos
  s.append(el('ellipse', { class: 'tui__sombra', cx: 60, cy: 114, rx: 27, ry: 4, fill: '#000', opacity: 0.16 }),
    el('g', { class: 'tui__asa-longe' },
      el('path', { d: 'M42 58 Q27 84 37 108 Q54 102 62 76 Q58 58 42 58 Z', fill: C.sombra }),
      traco('M42 70 Q38 88 43 100', C.luz, 2, { opacity: 0.3 })));

  // cauda longa de duas penas
  s.append(el('g', { class: 'tui__cauda' },
    el('path', { d: 'M50 84 Q34 98 22 118 Q34 121 44 113 Q56 102 60 90 Z', fill: C.sombra }),
    el('path', { d: 'M56 88 Q50 104 46 120 Q57 119 63 108 Q68 98 66 90 Z', fill: C.corpo }),
    traco('M52 100 Q49 108 48 114', C.luz, 2, { opacity: 0.4 })));
  // patas
  s.append(el('g', { class: 'tui__pernas' },
    traco('M57 100 L56 111', C.pata, 4.5), traco('M67 100 L68 111', C.pata, 4.5),
    traco('M51 112.5 Q56 109.5 61 112.5', C.pata, 3.2), traco('M63 112.5 Q68 109.5 73 112.5', C.pata, 3.2)));

  const corpo = el('g', { class: 'lou__corpo' });
  const resp = el('g', { class: 'tui__resp' });
  corpo.append(resp);
  // tronco, barriga clara e penas do peito
  resp.append(el('ellipse', { cx: 62, cy: 74, rx: 25, ry: 34, fill: `url(#${grad})`, transform: 'rotate(7 62 74)' }),
    el('ellipse', { cx: 72, cy: 80, rx: 11, ry: 23, fill: C.luz, opacity: 0.26, transform: 'rotate(7 72 80)' }),
    traco('M62 70 Q67 74 72 70', C.luz, 1.6, { opacity: 0.3 }), traco('M60 80 Q65 84 71 80', C.luz, 1.6, { opacity: 0.28 }), traco('M62 90 Q67 94 72 90', C.luz, 1.6, { opacity: 0.24 }));
  // asa com penas sobrepostas
  resp.append(el('g', { class: 'tui__asa' },
    el('path', { d: 'M46 58 Q31 84 41 108 Q58 102 66 76 Q62 56 46 58 Z', fill: C.sombra }),
    el('path', { d: 'M47 63 Q38 82 44 98 Q55 92 60 76 Q58 63 47 63 Z', fill: C.corpo, opacity: 0.6 }),
    traco('M45 76 Q47 90 50 101', C.luz, 2, { opacity: 0.4 }), traco('M50 72 Q53 86 55 97', C.luz, 2, { opacity: 0.32 }),
    traco('M41 100 L40 108', C.sombra, 3), traco('M46 103 L46 110', C.sombra, 3), traco('M51 103 L52 109', C.sombra, 3)));

  // cabeça: pescoço, bico, olho e expressão
  const cab = el('g', { class: 'tui__cabeca' });
  cab.append(el('ellipse', { cx: 64, cy: 53, rx: 14, ry: 12, fill: C.corpo }),
    el('circle', { cx: 68, cy: 38, r: 19, fill: C.corpo }), traco('M54 30 Q58 22 66 21', '#fff', 3, { opacity: 0.3 }));
  if (feliz) cab.append(el('circle', { cx: 64, cy: 46, r: 5, fill: '#FF8FA8', opacity: 0.28 }));

  // bico: mandíbula de baixo (abre ao piar) e a parte de cima, com a mancha amarela da base
  cab.append(el('g', { class: 'tui__mandibula' }, el('path', { d: 'M87 51 Q100 53 99 63 Q92 67 86 58 Z', fill: C.bicoEsc })),
    el('path', { d: 'M82 32 Q106 28 106 54 Q104 64 96 58 Q98 48 86 46 Q80 42 82 32 Z', fill: C.bico }),
    traco('M86 33 Q98 32 103 42', C.bicoLuz, 2.5, { opacity: 0.75 }),
    el('ellipse', { cx: 87, cy: 49, rx: 6, ry: 3.6, fill: C.anel }));

  // olho: anel amarelo, íris escura que segue o dedo e brilho
  const olhos = el('g', { class: 'lou__olhos' });
  olhos.style.transformOrigin = '75px 38px';
  olhos.append(el('circle', { cx: 74, cy: 38, r: 8.7, fill: C.anel }));
  if (dorme) olhos.append(traco('M68 39 Q74 43 80 39', TINTA_OLHO, 3));
  else if (feliz) olhos.append(traco('M69 40 Q75 32 81 40', TINTA_OLHO, 3.6));
  else {
    const dx = humor === 'pensando' ? -1.5 : 0, dy = humor === 'pensando' ? -2.5 : humor === 'ops' ? 1.4 : 0, r = humor === 'ops' ? 3.3 : 4.6;
    olhos.append(el('g', { class: 'tui__pupila' }, el('circle', { cx: 75 + dx, cy: 38 + dy, r, fill: TINTA_OLHO }), el('circle', { cx: 76.5 + dx, cy: 36.5 + dy, r: 1.4, fill: '#fff' })));
  }
  cab.append(olhos);
  if (humor === 'ops' && !dorme) cab.append(traco('M68 27 Q74 23 81 27', C.sombra, 2.2));
  if (humor === 'festa' && !dorme) cab.append(el('path', { d: 'M58 24 L70 -4 L82 22 Z', fill: 'var(--sol,#FFC83D)' }), traco('M63 15 L77 15', '#FF6FA5', 3), traco('M66 7 L73 7', '#FF6FA5', 3), el('circle', { cx: 70, cy: -4, r: 4.5, fill: '#FF6FA5' }));
  resp.append(cab);

  s.append(corpo);
  if (humor === 'pensando' && !dorme) s.append(el('circle', { class: 'tui__ideia', cx: 100, cy: 18, r: 2.4, fill: 'var(--tinta-2,#46557A)' }), el('circle', { class: 'tui__ideia', cx: 105, cy: 10, r: 3.4, fill: 'var(--tinta-2,#46557A)' }), el('circle', { class: 'tui__ideia', cx: 110, cy: 1, r: 4.6, fill: 'var(--tinta-2,#46557A)' }));
  if (humor === 'ops' && !dorme) s.append(el('path', { class: 'tui__gota', d: 'M56 14 Q61 22 56 27 Q51 22 56 14 Z', fill: '#7FD3F5' }));
  if (dorme) for (const [x, y, t, d] of [[88, 22, 9, 0], [96, 12, 12, 0.5], [106, 2, 15, 1]]) { const z = el('text', { class: 'tui__z', x, y, 'font-size': t, 'font-weight': 800, fill: 'var(--tinta-2,#46557A)' }, 'z'); z.style.animationDelay = `${d}s`; s.append(z); }
  if (humor === 'festa' && !dorme) for (const [x, y, r] of [[10, 22, 6], [112, 14, 5], [14, 62, 4]]) s.append(el('path', { class: 'lou__estrela', d: `M${x} ${y - r} L${x + r * 0.3} ${y - r * 0.3} L${x + r} ${y} L${x + r * 0.3} ${y + r * 0.3} L${x} ${y + r} L${x - r * 0.3} ${y + r * 0.3} L${x - r} ${y} L${x - r * 0.3} ${y - r * 0.3} Z`, fill: 'var(--sol,#FFC83D)' }));
  return s;
}

// ---------- interação (um só conjunto de ouvintes para a página inteira) ----------
let instalado = false;
export function instalarInteracao({ aoToque } = {}) {
  if (instalado) return; instalado = true;
  const calmo = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  let alvo = null, quadro = 0;
  // os olhos acompanham o dedo ou o mouse, num raio pequeno
  const seguir = () => {
    quadro = 0; if (!alvo) return;
    for (const s of document.querySelectorAll('.lou--tui:not(.tui--dorme) .tui__pupila')) {
      const svg = s.ownerSVGElement, r = svg.getBoundingClientRect();
      if (!r.width || r.bottom < 0 || r.top > innerHeight) continue;
      const dx = alvo.x - (r.left + r.width * 0.62), dy = alvo.y - (r.top + r.height * 0.32), d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / 120);
      s.style.setProperty('--ox', `${((dx / d) * 2.6 * k).toFixed(2)}px`);
      s.style.setProperty('--oy', `${((dy / d) * 2.2 * k).toFixed(2)}px`);
    }
  };
  const mover = e => { if (calmo()) return; alvo = { x: e.clientX, y: e.clientY }; if (!quadro) quadro = requestAnimationFrame(seguir); };
  addEventListener('pointermove', mover, { passive: true });
  addEventListener('pointerdown', mover, { passive: true });
  // toque no personagem: pulinho, asa e piado (Mia acena)
  document.addEventListener('pointerdown', e => {
    const p = e.target.closest?.('.lou--tui, .lou--mia'); if (!p || calmo()) return;
    const classe = p.classList.contains('lou--mia') ? 'mia--acena' : 'tui--reage';
    p.classList.remove(classe); void p.getBoundingClientRect(); p.classList.add(classe);
    clearTimeout(p._reage); p._reage = setTimeout(() => p.classList.remove(classe), 1300);
    aoToque?.(p);
  });
}
