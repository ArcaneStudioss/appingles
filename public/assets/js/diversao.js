// Lou (o mascote: um balãozinho de fala), sons sintetizados e confete. Tudo respeita "menos movimento"
// e a preferência de som deste aparelho. Nada aqui pune o aluno: o erro tem um som suave, não um alarme.
import { localStorageGet, falarPt } from './ui.js?v=__V__';

const NS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs = {}, ...filhos) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); e.append(...filhos); return e; };

// humor: oi | feliz | pensando | ops | festa
export function lou(humor = 'oi', { tamanho = 96, rotulo = 'Lou, o mascote do Inglou' } = {}) {
  const s = el('svg', { viewBox: '0 0 120 120', width: tamanho, height: tamanho, class: `lou lou--${humor}`, role: 'img', 'aria-label': rotulo });
  const corpo = el('g', { class: 'lou__corpo' });
  // balão de fala com rabinho
  corpo.append(
    el('path', { d: 'M22 28 Q22 12 40 12 H84 Q102 12 102 30 V70 Q102 88 84 88 H50 L32 104 L36 88 Q22 86 22 70 Z', fill: 'var(--caneta)' }),
    el('path', { d: 'M30 24 Q34 18 44 18', stroke: '#fff', 'stroke-width': '4', 'stroke-linecap': 'round', fill: 'none', opacity: '.35' }));
  const olhos = el('g', { class: 'lou__olhos' });
  if (humor === 'feliz' || humor === 'festa') {
    olhos.append(el('path', { d: 'M42 48 Q48 40 54 48', stroke: '#fff', 'stroke-width': '5', 'stroke-linecap': 'round', fill: 'none' }), el('path', { d: 'M70 48 Q76 40 82 48', stroke: '#fff', 'stroke-width': '5', 'stroke-linecap': 'round', fill: 'none' }));
  } else {
    const dx = humor === 'pensando' ? 3 : 0, dy = humor === 'pensando' ? -3 : humor === 'ops' ? 2 : 0;
    for (const x of [48, 76]) olhos.append(el('ellipse', { cx: x, cy: 46, rx: 8, ry: 9.5, fill: '#fff' }), el('circle', { cx: x + dx, cy: 47 + dy, r: 4.2, fill: '#14213D' }), el('circle', { cx: x + dx + 1.5, cy: 45 + dy, r: 1.4, fill: '#fff' }));
  }
  const boca = humor === 'ops' ? el('path', { d: 'M52 68 Q57 64 62 68 Q67 72 72 68', stroke: '#fff', 'stroke-width': '4', 'stroke-linecap': 'round', fill: 'none' })
    : humor === 'pensando' ? el('circle', { cx: 63, cy: 68, r: 4, fill: '#fff' })
      : el('path', { d: humor === 'oi' ? 'M50 64 Q62 74 74 64' : 'M48 62 Q62 80 76 62 Z', stroke: '#fff', 'stroke-width': '4', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', fill: humor === 'oi' ? 'none' : '#fff' });
  corpo.append(olhos, boca, el('circle', { cx: 38, cy: 60, r: 5, fill: '#FF9FB2', opacity: '.55' }), el('circle', { cx: 86, cy: 60, r: 5, fill: '#FF9FB2', opacity: '.55' }));
  s.append(corpo);
  if (humor === 'festa') for (const [x, y, r] of [[10, 18, 6], [108, 14, 5], [112, 58, 4]]) s.append(el('path', { class: 'lou__estrela', d: `M${x} ${y - r} L${x + r * .3} ${y - r * .3} L${x + r} ${y} L${x + r * .3} ${y + r * .3} L${x} ${y + r} L${x - r * .3} ${y + r * .3} L${x - r} ${y} L${x - r * .3} ${y - r * .3} Z`, fill: 'var(--sol)' }));
  return s;
}

// Lou falando: mascote + balão com o texto
export function louFala(humor, ...conteudo) {
  const d = document.createElement('div'); d.className = 'lou-fala';
  const b = document.createElement('div'); b.className = 'lou-fala__balao'; b.append(...conteudo.flat().filter(x => x != null && x !== false));
  // botão "Ouvir": o Lou lê o balão em português (pedagógico: serve para quem ainda lê devagar)
  const ouvir = document.createElement('button');
  ouvir.type = 'button'; ouvir.className = 'lou-fala__ouvir'; ouvir.setAttribute('aria-pressed', 'false');
  ouvir.setAttribute('aria-label', 'Ouvir o Lou ler esta mensagem');
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
