// Tuiuiú (o mascote: uma arara-azul), sons sintetizados e confete. Tudo respeita "menos movimento"
// e a preferência de som deste aparelho. Nada aqui pune o aluno: o erro tem um som suave, não um alarme.
import { localStorageGet, falarPt } from './ui.js?v=__V__';

const NS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs = {}, ...filhos) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); e.append(...filhos); return e; };

// Tuiuiú: uma arara-azul-grande de verdade (o orgulho do Brasil): corpo, asa, cauda longa, bico grosso e curvo e o anel amarelo no olho,
// empoleirada num galho. A Mia, que fala inglês na Rádio Tuiuiú, é a tutora e dona do Tuiuiú: uma adolescente negra de tranças, de corpo inteiro.
// humor: oi | feliz | pensando | ops | festa. As cores do Tuiuiú vêm de variáveis (--arara-*), então acompanham Dia e Noite;
// o segundo valor de cada var() é a cor de reserva (página de vendas e ícones, onde não há tema).
const TINTA_OLHO = '#16224A';
const PALETA_TUI = { corpo: 'var(--arara-1,#2447D0)', sombra: 'var(--arara-2,#1A33A0)', luz: 'var(--arara-3,#6C8DFF)', bico: '#3A4254', bicoLuz: '#7A849B', anel: '#FFC83D' };

// Mia de corpo inteiro (viewBox 120 x 256), proporções de adolescente (cabeça com cerca de 1/7 da altura), camisa azul, jeans e tênis, tranças com miçangas.
// Em tamanho pequeno (até 60) mostra só da cabeça aos ombros. Cores fixas: pele e cabelo não mudam no modo Noite.
function tutora(humor, { tamanho, rotulo }) {
  const pequeno = tamanho <= 60;
  const s = el('svg', { viewBox: pequeno ? '22 -2 76 76' : '0 -10 120 256', width: pequeno ? tamanho : Math.round(tamanho * 120 / 256), height: tamanho, class: `lou lou--${humor} lou--mia`, role: 'img', 'aria-label': rotulo });
  const corpo = el('g', { class: 'lou__corpo' });
  const traco = (d, cor, larg, extra = {}) => el('path', { d, stroke: cor, 'stroke-width': larg, 'stroke-linecap': 'round', fill: 'none', ...extra });
  const PELE = '#6B4430', PELE_SOMBRA = '#55351F', CABELO = '#1B1210', TINTA = '#1A0F0B', BOCA = '#2A130C', AZUL = '#2E73D9', AZUL_ESC = '#1F55A8', JEANS = '#2B3350';
  const feliz = humor === 'feliz' || humor === 'festa';

  // pernas de jeans (coxa larga, tornozelo fino) e tênis brancos
  corpo.append(el('path', { d: 'M44 126 L59 126 L58 174 L55 220 L47 220 L45 174 Z', fill: JEANS }), el('path', { d: 'M61 126 L76 126 L75 174 L73 220 L65 220 L62 174 Z', fill: JEANS }),
    traco('M51 140 L51 172', '#3C4770', 1.2, { opacity: '.6' }), traco('M69 140 L69 172', '#3C4770', 1.2, { opacity: '.6' }),
    traco('M47 218 H55', '#1B2038', 2), traco('M65 218 H73', '#1B2038', 2),
    el('path', { d: 'M46 220 H56 L57 227 Q58 231 54 233 H43 Q39 233 40 229 Z', fill: '#FFF8E6', stroke: '#BFA986', 'stroke-width': 1 }),
    el('path', { d: 'M74 220 H64 L63 227 Q62 231 66 233 H77 Q81 233 80 229 Z', fill: '#FFF8E6', stroke: '#BFA986', 'stroke-width': 1 }),
    traco('M41 231 H56', '#FFC83D', 2), traco('M79 231 H64', '#FFC83D', 2));
  // pescoço, mãos e antebraços, camisa azul solta (colarinho, botões, bolso), mangas dobradas
  corpo.append(el('rect', { x: 55, y: 42, width: 10, height: 22, rx: 5, fill: PELE_SOMBRA }),
    el('path', { d: 'M29 100 L27 128 L33 129 L39 104 Z', fill: PELE }), el('path', { d: 'M91 100 L93 128 L87 129 L81 104 Z', fill: PELE }),
    el('ellipse', { cx: 30, cy: 134, rx: 4, ry: 5.5, fill: PELE }), el('ellipse', { cx: 90, cy: 134, rx: 4, ry: 5.5, fill: PELE }),
    el('path', { d: 'M41 64 Q60 57 79 64 Q80 84 76 104 Q74 122 81 142 Q60 147 39 142 Q46 122 44 104 Q40 84 41 64 Z', fill: AZUL }),
    el('path', { d: 'M60 60 L79 64 Q80 84 76 104 Q74 122 81 142 L60 146 Z', fill: AZUL_ESC, opacity: '.16' }),
    traco('M60 74 L60 144', AZUL_ESC, 1.2),
    el('path', { d: 'M52 58 L60 74 L54 77 L47 62 Z', fill: '#7FB0F5' }), el('path', { d: 'M68 58 L60 74 L66 77 L73 62 Z', fill: '#7FB0F5' }),
    el('rect', { x: 66, y: 86, width: 9, height: 9, rx: 1, fill: 'none', stroke: AZUL_ESC, 'stroke-width': 1 }),
    traco('M39 140 Q60 144 81 140', AZUL_ESC, 1.6),
    el('path', { d: 'M41 64 Q33 66 31 78 L29 100 L39 104 L44 78 Z', fill: AZUL }), el('path', { d: 'M79 64 Q87 66 89 78 L91 100 L81 104 L76 78 Z', fill: AZUL }),
    traco('M29 100 L39 104', AZUL_ESC, 1.4), traco('M91 100 L81 104', AZUL_ESC, 1.4));
  for (const y of [84, 98, 112, 126]) corpo.append(el('circle', { cx: 60, cy: y, r: 1.3, fill: '#DCEBFF' }));
  // tranças em frente aos ombros, trançadas de verdade (segmentos em relevo) e com miçangas; 3 de cada lado
  [['M46 18 Q33 60 38 112', 38, 112, '#FF6FA5'], ['M50 22 Q41 64 46 118', 46, 118, '#FFC83D'], ['M43 24 Q27 58 31 100', 31, 100, '#FFC83D'],
    ['M74 18 Q87 60 82 112', 82, 112, '#FFC83D'], ['M70 22 Q79 64 74 118', 74, 118, '#FF6FA5'], ['M77 24 Q93 58 89 100', 89, 100, '#FF6FA5']]
    .forEach(([d, x, y, cor]) => corpo.append(traco(d, CABELO, 4.6), traco(d, '#40302A', 4.6, { 'stroke-dasharray': '1.5 2.1', 'stroke-linecap': 'butt', opacity: '.85' }), el('circle', { cx: x, cy: y, r: 2.3, fill: cor }), el('circle', { cx: x, cy: y - 5, r: 1.4, fill: '#FFF1C9' })));

  // cabeça (desenhada em escala maior e reduzida: o rosto mantém os mesmos traços)
  const cabeca = el('g', { transform: 'translate(60 28) scale(.58) translate(-60 -50)' });
  cabeca.append(el('ellipse', { cx: 33, cy: 52, rx: 4, ry: 6, fill: PELE }), el('ellipse', { cx: 87, cy: 52, rx: 4, ry: 6, fill: PELE }),
    el('ellipse', { cx: 60, cy: 50, rx: 27, ry: 31, fill: PELE }),
    el('circle', { cx: 33, cy: 58, r: 2.4, fill: '#E5A72A' }), el('circle', { cx: 87, cy: 58, r: 2.4, fill: '#E5A72A' }),
    el('path', { d: 'M30 50 Q24 6 60 4 Q96 6 90 50 Q85 24 60 21 Q35 24 30 50 Z', fill: CABELO }),
    traco('M40 30 Q44 16 58 9', '#44332C', 1.4), traco('M46 28 Q49 18 59 12', '#44332C', 1.4), traco('M80 30 Q76 16 62 9', '#44332C', 1.4), traco('M74 28 Q71 18 61 12', '#44332C', 1.4),
    traco('M60 8 L60 21', '#2A1D18', 1.6, { opacity: '.9' }),
    traco('M35 30 Q60 15 85 30', '#FFC83D', 4),
    el('path', { d: 'M84 26 L70 17 L70 35 Z', fill: '#FF6FA5' }), el('path', { d: 'M84 26 L98 17 L98 35 Z', fill: '#FF6FA5' }), el('circle', { cx: 84, cy: 26, r: 3.2, fill: '#E8408A' }));
  const olhos = el('g', { class: 'lou__olhos', style: 'transform-origin:60px 47px' });
  for (const x of [49, 71]) {
    const lado = x < 60 ? -1 : 1;   // -1 = olho esquerdo (canto de fora à esquerda)
    if (feliz) {
      olhos.append(traco(`M${x - 6.5} 48.5 Q${x} 39 ${x + 6.5} 48.5`, TINTA, 3.2),
        traco(`M${x + lado * 6.3} 46.5 L${x + lado * 9} 43.8`, TINTA, 1.7), traco(`M${x + lado * 4} 43.2 L${x + lado * 5.2} 40.4`, TINTA, 1.4));
      continue;
    }
    const dx = humor === 'pensando' ? 2 : 0, dy = humor === 'pensando' ? -2.2 : humor === 'ops' ? 1.2 : 0;
    const alta = humor === 'ops' ? 9.5 : 8, r = humor === 'ops' ? 3.4 : 4.1;
    olhos.append(
      el('path', { d: `M${x - 7.2} 47.6 Q${x} ${47.6 - alta} ${x + 7.2} 47.6 Q${x} ${47.6 + alta * .72} ${x - 7.2} 47.6 Z`, fill: '#FFF8F0' }),
      el('circle', { cx: x + dx, cy: 47.8 + dy, r, fill: '#4A2A18' }), el('circle', { cx: x + dx, cy: 47.8 + dy, r: r * .52, fill: '#120A06' }),
      el('circle', { cx: x + dx + 1.5, cy: 46.3 + dy, r: 1.35, fill: '#fff' }), el('circle', { cx: x + dx - 1.4, cy: 49.4 + dy, r: .7, fill: '#fff', opacity: '.85' }),
      traco(`M${x - 7.4} 47.6 Q${x} ${47.6 - alta - 1.2} ${x + 7.4} 47.6`, TINTA, 2.3),
      traco(`M${x + lado * 7.2} 46.8 L${x + lado * 10} 43.8`, TINTA, 1.7), traco(`M${x + lado * 4.8} 40.6 L${x + lado * 6} 37.6`, TINTA, 1.3),
      traco(`M${x - 5} 52 Q${x} 54.2 ${x + 5} 52`, '#2A160E', .8, { opacity: '.45' }),
      traco(`M${x - 5.5} 41.5 Q${x} 37.8 ${x + 5.5} 41.5`, PELE_SOMBRA, 1, { opacity: '.5' }));
  }
  const alto = humor === 'ops' ? -3 : 0;
  cabeca.append(olhos, traco(`M43 ${38 + alto} Q49 ${34 + alto} 55 ${38 + alto}`, CABELO, 2.1), traco(`M65 ${38 + alto} Q71 ${34 + alto} 77 ${38 + alto}`, CABELO, 2.1),
    traco('M60 52 Q57 58 61 59', '#3E2418', 1.5),
    el('circle', { cx: 42, cy: 60, r: 4.5, fill: '#FF6F8E', opacity: '.32' }), el('circle', { cx: 78, cy: 60, r: 4.5, fill: '#FF6F8E', opacity: '.32' }));
  if (feliz) cabeca.append(el('path', { d: 'M50 64 Q60 80 70 64 Z', fill: BOCA }), el('ellipse', { cx: 60, cy: 73, rx: 4, ry: 2.5, fill: '#E8404E' }));
  else if (humor === 'ops') cabeca.append(el('ellipse', { cx: 60, cy: 69, rx: 3.6, ry: 4.6, fill: BOCA }));
  else if (humor === 'pensando') cabeca.append(traco('M53 68 Q58 66 66 68', BOCA, 3));
  else cabeca.append(traco('M51 66 Q60 74 69 66', BOCA, 3));
  if (humor === 'festa') cabeca.append(el('path', { d: 'M44 26 L60 -8 L76 26 Z', fill: 'var(--sol,#FFC83D)' }), traco('M50 16 L70 16', '#FF6FA5', 3.4), traco('M54 5 L66 5', '#FF6FA5', 3.4), el('circle', { cx: 60, cy: -9, r: 5, fill: '#FF6FA5' }));
  corpo.append(cabeca);

  if (humor === 'pensando') corpo.append(el('circle', { cx: 86, cy: 22, r: 2, fill: 'var(--tinta-2,#46557A)' }), el('circle', { cx: 91, cy: 14, r: 2.8, fill: 'var(--tinta-2,#46557A)' }), el('circle', { cx: 97, cy: 4, r: 3.8, fill: 'var(--tinta-2,#46557A)' }));
  if (humor === 'ops') corpo.append(el('path', { d: 'M84 14 Q88 21 84 25 Q80 21 84 14 Z', fill: '#7FD3F5' }));
  s.append(corpo);
  if (humor === 'festa') for (const [x, y, r] of [[12, 10, 6], [108, 6, 5], [110, 56, 4]]) s.append(el('path', { class: 'lou__estrela', d: `M${x} ${y - r} L${x + r * .3} ${y - r * .3} L${x + r} ${y} L${x + r * .3} ${y + r * .3} L${x} ${y + r} L${x - r * .3} ${y + r * .3} L${x - r} ${y} L${x - r * .3} ${y - r * .3} Z`, fill: 'var(--sol,#FFC83D)' }));
  return s;
}

export function lou(humor = 'oi', { tamanho = 96, rotulo = 'Tuiuiú, a arara-azul do Inglou', mia = false } = {}) {
  if (mia) return tutora(humor, { tamanho, rotulo: rotulo === 'Tuiuiú, a arara-azul do Inglou' ? 'Mia, a tutora do Tuiuiú' : rotulo });
  const P = PALETA_TUI;
  const s = el('svg', { viewBox: '0 0 120 120', width: tamanho, height: tamanho, class: `lou lou--${humor}`, role: 'img', 'aria-label': rotulo });
  const corpo = el('g', { class: 'lou__corpo' });
  const traco = (d, cor, larg, extra = {}) => el('path', { d, stroke: cor, 'stroke-width': larg, 'stroke-linecap': 'round', fill: 'none', ...extra });
  const feliz = humor === 'feliz' || humor === 'festa';

  // galho e cauda longa
  corpo.append(traco('M6 112 Q60 108 114 113', '#7A5538', 6), traco('M18 111 Q38 108 50 109', '#A07C58', 2, { opacity: '.7' }),
    el('path', { d: 'M46 92 Q32 108 28 118 L40 118 Q46 108 54 96 Z', fill: P.sombra }), el('path', { d: 'M54 94 Q46 110 44 119 L54 118 Q58 108 62 98 Z', fill: P.corpo }));
  // corpo, barriga clara, asa com penas, patas
  corpo.append(el('ellipse', { cx: 62, cy: 76, rx: 24, ry: 34, fill: P.corpo, transform: 'rotate(8 62 76)' }),
    el('ellipse', { cx: 70, cy: 80, rx: 10, ry: 22, fill: P.luz, opacity: '.3', transform: 'rotate(8 70 80)' }),
    el('path', { d: 'M44 60 Q35 86 44 104 Q57 98 63 78 Q59 60 44 60 Z', fill: P.sombra }),
    traco('M47 74 Q50 88 52 100', P.luz, 2, { opacity: '.45' }), traco('M52 70 Q56 84 57 96', P.luz, 2, { opacity: '.35' }),
    traco('M56 106 Q54 112 50 112', '#5B6275', 3), traco('M64 107 Q64 113 68 113', '#5B6275', 3));
  // cabeça
  corpo.append(el('circle', { cx: 68, cy: 40, r: 19, fill: P.corpo }), traco('M54 30 Q58 22 66 21', '#fff', 3, { opacity: '.3' }));
  // olho com anel amarelo
  const olhos = el('g', { class: 'lou__olhos', style: 'transform-origin:75px 38px' });
  olhos.append(el('circle', { cx: 74, cy: 38, r: 8.5, fill: P.anel }));
  if (feliz) olhos.append(traco('M69 40 Q75 32 81 40', TINTA_OLHO, 3.6));
  else {
    const dx = humor === 'pensando' ? -1.5 : 0, dy = humor === 'pensando' ? -2.5 : humor === 'ops' ? 1.5 : 0, r = humor === 'ops' ? 3.2 : 4.4;
    olhos.append(el('circle', { cx: 75 + dx, cy: 38 + dy, r, fill: TINTA_OLHO }), el('circle', { cx: 76.4 + dx, cy: 36.6 + dy, r: 1.3, fill: '#fff' }));
  }
  corpo.append(olhos,
    // bico grosso e curvo, com a mancha amarela na base
    el('path', { d: 'M82 32 Q106 28 106 54 Q104 64 96 58 Q98 48 86 46 Q80 42 82 32 Z', fill: P.bico }),
    traco('M86 33 Q98 32 103 42', P.bicoLuz, 2.5, { opacity: '.75' }),
    el('ellipse', { cx: 87, cy: 49, rx: 6, ry: 3.6, fill: P.anel }));
  if (feliz) corpo.append(traco('M89 55 Q95 59 100 55', P.sombra, 2, { opacity: '.5' }));

  if (humor === 'pensando') corpo.append(el('circle', { cx: 100, cy: 18, r: 2.4, fill: 'var(--tinta-2,#46557A)' }), el('circle', { cx: 105, cy: 10, r: 3.4, fill: 'var(--tinta-2,#46557A)' }), el('circle', { cx: 110, cy: 1, r: 4.6, fill: 'var(--tinta-2,#46557A)' }));
  if (humor === 'ops') corpo.append(el('path', { d: 'M54 16 Q59 24 54 29 Q49 24 54 16 Z', fill: '#7FD3F5' }));
  if (humor === 'festa') corpo.append(el('path', { d: 'M56 24 L66 -2 L78 24 Z', fill: 'var(--sol,#FFC83D)' }), traco('M60 16 L74 16', '#FF6FA5', 3), traco('M63 8 L70 8', '#FF6FA5', 3), el('circle', { cx: 66, cy: -3, r: 4.5, fill: '#FF6FA5' }));
  s.append(corpo);
  if (humor === 'festa') for (const [x, y, r] of [[10, 22, 6], [112, 14, 5], [14, 62, 4]]) s.append(el('path', { class: 'lou__estrela', d: `M${x} ${y - r} L${x + r * .3} ${y - r * .3} L${x + r} ${y} L${x + r * .3} ${y + r * .3} L${x} ${y + r} L${x - r * .3} ${y + r * .3} L${x - r} ${y} L${x - r * .3} ${y - r * .3} Z`, fill: 'var(--sol,#FFC83D)' }));
  return s;
}

// Tuiuiú falando: mascote + balão com o texto
export function louFala(humor, ...conteudo) {
  const d = document.createElement('div'); d.className = 'lou-fala';
  const b = document.createElement('div'); b.className = 'lou-fala__balao'; b.append(...conteudo.flat().filter(x => x != null && x !== false));
  // botão "Ouvir": o Tuiuiú lê o balão em português (pedagógico: serve para quem ainda lê devagar)
  const ouvir = document.createElement('button');
  ouvir.type = 'button'; ouvir.className = 'lou-fala__ouvir'; ouvir.setAttribute('aria-pressed', 'false');
  ouvir.setAttribute('aria-label', 'Ouvir o Tuiuiú ler esta mensagem');
  const svg = el('svg', { class: 'ico', 'aria-hidden': 'true' }, el('use', { href: '/assets/icones/sprite.svg?v=__V__#i-speaker-high' }));
  ouvir.append(svg, document.createTextNode('Ouvir'));
  ouvir.addEventListener('click', () => {
    if (ouvir.getAttribute('aria-pressed') === 'true') { speechSynthesis.cancel(); ouvir.setAttribute('aria-pressed', 'false'); return; }
    const texto = [...b.querySelectorAll('p,li')].map(x => x.textContent.trim()).filter(Boolean).join('. ') || b.textContent.replace(/Ouvir$/, '');
    if (falarPt(texto, () => ouvir.setAttribute('aria-pressed', 'false'))) ouvir.setAttribute('aria-pressed', 'true');
  });
  if ('speechSynthesis' in window) b.append(ouvir);
  d.append(lou(humor, { tamanho: 72 }), b);
  return d;
}

// ---------- sons (Web Audio, sem arquivos) ----------
let ctx = null;
export const somLigado = () => localStorageGet('sons') !== 'nao';
function nota(freq, inicio, dur, { tipo = 'sine', volume = 0.12 } = {}) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = tipo; o.frequency.value = freq;
  g.gain.setValueAtTime(0, ctx.currentTime + inicio);
  g.gain.linearRampToValueAtTime(volume, ctx.currentTime + inicio + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + inicio + dur);
  o.connect(g).connect(ctx.destination);
  o.start(ctx.currentTime + inicio); o.stop(ctx.currentTime + inicio + dur + 0.05);
}
export function som(tipo) {
  if (!somLigado()) return;
  try {
    ctx ||= new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    if (tipo === 'acerto') { nota(784, 0, 0.12, { tipo: 'triangle' }); nota(1175, 0.09, 0.22, { tipo: 'triangle' }); }
    else if (tipo === 'erro') { nota(330, 0, 0.18, { volume: 0.08 }); nota(262, 0.12, 0.26, { volume: 0.07 }); }
    else if (tipo === 'fim') [523, 659, 784, 1047].forEach((f, i) => nota(f, i * 0.11, 0.3, { tipo: 'triangle', volume: 0.1 }));
    else if (tipo === 'toque') nota(660, 0, 0.05, { volume: 0.05 });
  } catch { /* navegador sem áudio: segue em silêncio */ }
}

// ---------- confete ----------
export function confete(alvo = document.body, quantidade = 46) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const cores = ['var(--caneta)', 'var(--sol)', '#7FA6FF', '#FF9FB2', '#5EC8F2'];
  const camada = document.createElement('div'); camada.className = 'confete'; camada.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < quantidade; i++) {
    const p = document.createElement('i');
    p.style.setProperty('--x', `${(Math.random() * 2 - 1) * 46}vw`);
    p.style.setProperty('--y', `${-30 - Math.random() * 50}vh`);
    p.style.setProperty('--r', `${Math.random() * 720 - 360}deg`);
    p.style.setProperty('--d', `${0.9 + Math.random() * 0.8}s`);
    p.style.setProperty('background', cores[i % cores.length]);
    p.style.setProperty('left', `${45 + Math.random() * 10}%`);
    camada.append(p);
  }
  alvo.append(camada);
  setTimeout(() => camada.remove(), 2000);
}
