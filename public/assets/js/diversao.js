// Tuiuiú (o mascote: uma arara-azul), sons sintetizados e confete. Tudo respeita "menos movimento"
// e a preferência de som deste aparelho. Nada aqui pune o aluno: o erro tem um som suave, não um alarme.
import { localStorageGet, falarPt, pararVoz } from './ui.js?v=__V__';

const NS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs = {}, ...filhos) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); e.append(...filhos); return e; };

// Tuiuiú: uma arara-azul (o orgulho do Brasil). A Mia, a amiga que fala inglês na Rádio Tuiuiú, é uma arara-vermelha.
// humor: oi | feliz | pensando | ops | festa. As cores do Tuiuiú vêm de variáveis (--arara-*), então acompanham Dia e Noite;
// o segundo valor de cada var() é a cor de reserva (página de vendas e ícones, onde não há tema).
const TINTA_OLHO = '#16224A';
const PALETAS = {
  lou: { corpo: 'var(--arara-1,#2447D0)', sombra: 'var(--arara-2,#1A33A0)', luz: 'var(--arara-3,#6C8DFF)', bico: '#3A4254', bicoLuz: '#7A849B', rosto: null, anel: '#FFC83D', bochecha: '#FFC83D' },
  mia: { corpo: '#E8404E', sombra: '#B02634', luz: '#FF8A92', bico: '#EBD9BC', bicoLuz: '#FFF6E6', rosto: '#FFF8F2', anel: null, bochecha: null },
};
export function lou(humor = 'oi', { tamanho = 96, rotulo = 'Tuiuiú, a arara-azul do Inglou', mia = false } = {}) {
  const P = mia ? PALETAS.mia : PALETAS.lou;
  const s = el('svg', { viewBox: '0 0 120 120', width: tamanho, height: tamanho, class: `lou lou--${humor}${mia ? ' lou--mia' : ''}`, role: 'img', 'aria-label': rotulo });
  const corpo = el('g', { class: 'lou__corpo' });
  const traco = (d, cor, larg, extra = {}) => el('path', { d, stroke: cor, 'stroke-width': larg, 'stroke-linecap': 'round', fill: 'none', ...extra });
  const feliz = humor === 'feliz' || humor === 'festa';

  // ombros e asas (a Mia ganha as penas amarela e azul das asas)
  corpo.append(el('path', { d: 'M12 120 Q12 92 36 84 H84 Q108 92 108 120 Z', fill: P.sombra }),
    el('path', { d: 'M34 120 Q36 95 60 91 Q84 95 86 120 Z', fill: P.corpo }));
  if (mia) corpo.append(traco('M17 119 Q17 101 28 92', '#FFC83D', 5), traco('M24 119 Q24 105 33 97', '#2F6BFF', 5), traco('M103 119 Q103 101 92 92', '#FFC83D', 5), traco('M96 119 Q96 105 87 97', '#2F6BFF', 5));
  else corpo.append(traco('M22 114 Q24 102 31 95', P.luz, 3, { opacity: '.55' }), traco('M98 114 Q96 102 89 95', P.luz, 3, { opacity: '.55' }));

  // penas da cabeça (no dia de festa dão lugar ao chapéu)
  if (humor !== 'festa') corpo.append(el('ellipse', { cx: 51, cy: 19, rx: 5.5, ry: 10, fill: P.corpo, transform: 'rotate(-18 51 19)' }), el('ellipse', { cx: 67, cy: 18, rx: 5.5, ry: 11, fill: P.corpo, transform: 'rotate(14 67 18)' }));
  // cabeça
  corpo.append(el('ellipse', { cx: 60, cy: 52, rx: 37, ry: 35, fill: P.corpo }),
    el('path', { d: 'M25 58 Q30 88 60 88 Q90 88 95 58 Q88 80 60 80 Q32 80 25 58 Z', fill: P.sombra, opacity: '.45' }),
    traco('M31 40 Q35 25 50 20', '#fff', 4, { opacity: '.3' }));
  if (P.rosto) corpo.append(el('ellipse', { cx: 60, cy: 52, rx: 30, ry: 23, fill: P.rosto }), traco('M33 58 Q37 63 42 64', P.corpo, 1.8, { opacity: '.55' }), traco('M87 58 Q83 63 78 64', P.corpo, 1.8, { opacity: '.55' }));
  if (P.bochecha) corpo.append(el('ellipse', { cx: 44, cy: 67, rx: 8, ry: 6, fill: P.bochecha }), el('ellipse', { cx: 76, cy: 67, rx: 8, ry: 6, fill: P.bochecha }));

  // olhos (anel amarelo da arara-azul)
  const olhos = el('g', { class: 'lou__olhos' });
  for (const x of [42, 78]) {
    if (feliz) { olhos.append(traco(`M${x - 7} 49 Q${x} 37 ${x + 7} 49`, TINTA_OLHO, 4.5)); continue; }
    const dx = humor === 'pensando' ? 2.5 : 0, dy = humor === 'pensando' ? -3 : humor === 'ops' ? 2.5 : 0, r = humor === 'ops' ? 3.2 : 4.6;
    if (P.anel) olhos.append(el('circle', { cx: x, cy: 46, r: 12, fill: P.anel }));
    olhos.append(el('ellipse', { cx: x, cy: 46, rx: 8.6, ry: 9.6, fill: '#fff' }), el('circle', { cx: x + dx, cy: 47 + dy, r, fill: TINTA_OLHO }), el('circle', { cx: x + dx + 1.4, cy: 45 + dy, r: 1.4, fill: '#fff' }));
  }
  corpo.append(olhos,
    el('circle', { cx: 28, cy: 62, r: 4.5, fill: '#FF9FB2', opacity: '.5' }), el('circle', { cx: 92, cy: 62, r: 4.5, fill: '#FF9FB2', opacity: '.5' }));

  // bico grande e curvo
  corpo.append(el('path', { d: 'M50 60 Q50 50 60 50 Q70 50 70 60 Q70 70 64 79 Q60 85 56 79 Q50 70 50 60 Z', fill: P.bico }),
    traco('M54 56 Q56 53 60 53', P.bicoLuz, 2.5, { opacity: '.75' }),
    el('circle', { cx: 56.5, cy: 58, r: 1.3, fill: '#000', opacity: '.35' }), el('circle', { cx: 63.5, cy: 58, r: 1.3, fill: '#000', opacity: '.35' }));
  if (feliz) corpo.append(traco('M55 72 Q60 77 65 72', P.sombra, 2.2, { opacity: '.55' }));

  if (humor === 'pensando') corpo.append(el('circle', { cx: 100, cy: 30, r: 2.4, fill: 'var(--tinta-2,#46557A)' }), el('circle', { cx: 106, cy: 21, r: 3.4, fill: 'var(--tinta-2,#46557A)' }), el('circle', { cx: 111, cy: 9, r: 4.6, fill: 'var(--tinta-2,#46557A)' }));
  if (humor === 'ops') corpo.append(el('path', { d: 'M98 28 Q103 36 98 41 Q93 36 98 28 Z', fill: '#7FD3F5' }));
  if (humor === 'festa') corpo.append(el('path', { d: 'M48 26 L62 -2 L76 26 Z', fill: 'var(--sol,#FFC83D)' }), traco('M53 18 L71 18', '#FF6FA5', 3), traco('M57 9 L66 9', '#FF6FA5', 3), el('circle', { cx: 62, cy: -3, r: 4.5, fill: '#FF6FA5' }));
  s.append(corpo);
  if (humor === 'festa') for (const [x, y, r] of [[10, 22, 6], [110, 18, 5], [114, 62, 4]]) s.append(el('path', { class: 'lou__estrela', d: `M${x} ${y - r} L${x + r * .3} ${y - r * .3} L${x + r} ${y} L${x + r * .3} ${y + r * .3} L${x} ${y + r} L${x - r * .3} ${y + r * .3} L${x - r} ${y} L${x - r * .3} ${y - r * .3} Z`, fill: 'var(--sol,#FFC83D)' }));
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
    if (ouvir.getAttribute('aria-pressed') === 'true') { pararVoz(); ouvir.setAttribute('aria-pressed', 'false'); return; }
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
