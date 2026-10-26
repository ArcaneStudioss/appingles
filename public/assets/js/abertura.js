// Inglou · tela de abertura: o Tuiuiú chega voando e dá a saudação do horário.
// Aparece uma vez por sessão do aparelho; toque, tecla ou o tempo encerram. Com "menos movimento" não voa, só aparece.
import { h } from './ui.js?v=__V__';
import { louVoando } from './diversao.js?v=__V__';

const NS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs = {}, ...filhos) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); e.append(...filhos); return e; };

export function saudacao(hora = new Date().getHours()) {
  return hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
}

const guardar = (store, k, v) => { try { return v === undefined ? store.getItem(k) : store.setItem(k, v); } catch { return null; } };

// Tuiuiú de frente, pousado no galho, de asas dobradas (é o que fica no canto depois do pouso)
function louPousado() {
  const C = { corpo: 'var(--arara-1,#2447D0)', sombra: 'var(--arara-2,#1A33A0)', luz: 'var(--arara-3,#6C8DFF)' };
  const traco = (d, cor, larg, op = 1) => el('path', { d, stroke: cor, 'stroke-width': larg, 'stroke-linecap': 'round', fill: 'none', opacity: op });
  const s = el('svg', { viewBox: '0 0 120 120', class: 'lou lou--pousado', 'aria-hidden': 'true', focusable: 'false' });
  const corpo = el('g', { class: 'lou__corpo' });
  const asa = lado => {
    const f = el('g', lado === 'e' ? { transform: 'translate(120 0) scale(-1 1)' } : {});
    f.append(
      el('path', { d: 'M80 52 C92 62 92 88 84 106 C80 110 74 108 72 100 C70 84 72 64 80 52 Z', fill: C.sombra }),
      el('path', { d: 'M80 54 C88 64 88 86 82 102 C78 100 76 84 77 66 Z', fill: C.corpo }),
      traco('M80 62 Q84 80 80 98', C.luz, 2, .5), traco('M84 70 Q87 84 84 98', C.luz, 2, .35));
    return f;
  };
  corpo.append(
    el('path', { d: 'M50 92 L46 118 L60 112 L74 118 L70 92 Z', fill: C.sombra }),
    el('ellipse', { cx: 60, cy: 70, rx: 24, ry: 35, fill: C.corpo }),
    el('ellipse', { cx: 60, cy: 76, rx: 12, ry: 24, fill: C.luz, opacity: '.28' }),
    asa('e'), asa('d'),
    el('circle', { cx: 60, cy: 32, r: 21, fill: C.corpo }), traco('M46 22 Q52 15 60 14', '#fff', 3, .3),
    el('ellipse', { cx: 47, cy: 41, rx: 5.5, ry: 3.6, fill: '#FFC83D' }), el('ellipse', { cx: 73, cy: 41, rx: 5.5, ry: 3.6, fill: '#FFC83D' }));
  const olhos = el('g', { class: 'lou__olhos' });
  for (const x of [49, 71]) olhos.append(el('circle', { cx: x, cy: 31, r: 7.5, fill: '#FFC83D' }), el('circle', { cx: x, cy: 31, r: 4, fill: '#16224A' }), el('circle', { cx: x + 1.3, cy: 29.6, r: 1.3, fill: '#fff' }));
  corpo.append(olhos,
    el('path', { d: 'M60 34 Q47 40 51 53 Q55 66 60 68 Q65 66 69 53 Q73 40 60 34 Z', fill: '#3A4254' }),
    traco('M55 42 Q53 49 56 57', '#7A849B', 2.4, .75));
  s.append(corpo,
    // galho por cima da cauda, e as patinhas agarradas nele
    traco('M2 104 Q60 99 118 105', '#7A5538', 6), traco('M14 103 Q36 100 50 101', '#A07C58', 2, .7),
    traco('M52 100 Q52 106 56 106', '#5B6275', 3), traco('M68 100 Q68 106 64 106', '#5B6275', 3));
  return s;
}

const poleiro = () => {
  const p = h('div', { class: 'pouso', 'aria-hidden': 'true' }, louPousado());
  document.body.append(p);
  return p;
};

// Caminho contínuo (Catmull-Rom) pelos pontos; devolve posição e direção em t de 0 a 1.
function curva(pts) {
  const n = pts.length - 1;
  return t => {
    const f = Math.min(n - 1e-6, Math.max(0, t * n)), i = Math.floor(f), u = f - i;
    const [p0, p1, p2, p3] = [pts[Math.max(0, i - 1)], pts[i], pts[i + 1], pts[Math.min(n, i + 2)]];
    const eixo = k => .5 * ((2 * p1[k]) + (-p0[k] + p2[k]) * u + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * u * u + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * u ** 3);
    return { x: eixo(0), y: eixo(1) };
  };
}

// rastro de faíscas e penas que o Tuiuiú deixa pelo caminho
function rastro(x, y, tam) {
  const cor = ['var(--arara-3,#6C8DFF)', '#FFC83D', '#fff'][Math.floor(Math.random() * 3)];
  const p = h('i', { class: 'ave-rastro', 'aria-hidden': 'true' });
  Object.assign(p.style, { left: x + 'px', top: y + 'px', width: tam + 'px', height: tam + 'px', background: cor });
  document.body.append(p);
  const dx = (Math.random() - .5) * 46, dy = 14 + Math.random() * 30;
  p.animate([{ transform: 'translate(-50%,-50%) scale(1)', opacity: .95 }, { transform: `translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(.1) rotate(160deg)`, opacity: 0 }],
    { duration: 650 + Math.random() * 350, easing: 'ease-out' }).onfinish = () => p.remove();
}

// o Tuiuiú agacha, toma impulso, faz um laço no ar e plana até o poleiro do canto superior direito, sem sumir da tela
function voarParaOPoleiro(ave, poleiroEl, calmo) {
  const chegar = () => {
    poleiroEl.classList.remove('pouso--espera');
    if (calmo) return;
    poleiroEl.classList.add('pouso--chegou');
    for (const c of ['pouso__anel', 'pouso__anel pouso__anel--2']) { const a = h('i', { class: c }); poleiroEl.append(a); setTimeout(() => a.remove(), 900); }
    const r = poleiroEl.getBoundingClientRect();
    for (let i = 0; i < 12; i++) setTimeout(() => rastro(r.left + r.width / 2, r.top + r.height * .75, 5 + Math.random() * 5), i * 18);
  };
  const de = ave.getBoundingClientRect(), para = poleiroEl.getBoundingClientRect();
  if (calmo || !de.width || !ave.animate) return chegar();
  const vw = innerWidth, vh = innerHeight, W = de.width, H = de.height;
  const ini = { x: de.left + W / 2, y: de.top + H / 2 };
  const fim = { x: para.left + para.width / 2, y: para.top + para.height / 2 - 2 };
  const escalaFim = Math.min(1, 54 / W);
  const clone = h('div', { class: 'ave-voo' }, ave.cloneNode(true));
  clone.firstChild.classList.add('lou--rapido');
  document.body.append(clone);

  const caminho = curva([
    [ini.x, ini.y], [ini.x - vw * .03, ini.y + vh * .05],                       // agacha para o impulso
    [vw * .2, vh * .32], [vw * .12, vh * .12], [vw * .3, vh * .03],            // sobe em curva aberta
    [vw * .55, vh * .13], [vw * .5, vh * .26], [vw * .66, vh * .17],           // laço no ar
    [(vw * .66 + fim.x) / 2 + 8, fim.y + vh * .06], [fim.x - 10, fim.y - 6], [fim.x, fim.y],
  ]);
  // escala: encolhe no agachar, cresce no pico do voo e chega do tamanho do poleiro
  const escala = t => t < .1 ? 1 - t * 1.2 : t < .6 ? .88 + (t - .1) * .44 : 1.1 + (escalaFim - 1.1) * Math.pow((t - .6) / .4, 1.3);
  const passos = 64, quadros = [];
  let antes = caminho(0), giro = 0;
  for (let i = 0; i <= passos; i++) {
    const t = i / passos, tempo = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;          // acelera e freia na chegada
    const q = caminho(Math.min(1, tempo)), dx = q.x - antes.x;
    giro += ((Math.max(-34, Math.min(34, dx * 1.1)) * (i === 0 ? 0 : 1)) - giro) * .35;           // inclina para onde voa, com suavidade
    const e = escala(t), esticar = 1 + Math.min(.12, Math.abs(q.y - antes.y) / 90);
    quadros.push({ transform: `translate(${q.x - W / 2}px,${q.y - H / 2}px) rotate(${i === passos ? 0 : giro}deg) scale(${e * (1 / esticar)},${e * esticar})`, offset: t });
    antes = q;
  }
  const dur = 2600, anim = clone.animate(quadros, { duration: dur, easing: 'linear', fill: 'forwards' });
  let ultimo = 0;
  const passo = () => {
    if (!clone.isConnected) return;
    const t = anim.currentTime || 0;
    if (t - ultimo > 38) { ultimo = t; const r = clone.getBoundingClientRect(); rastro(r.left + r.width * .3, r.top + r.height * .6, 4 + Math.random() * 6); }
    requestAnimationFrame(passo);
  };
  requestAnimationFrame(passo);
  anim.onfinish = () => { chegar(); clone.remove(); };
}

function abrir() {
  const p = poleiro();
  if (guardar(sessionStorage, 'inglou:abertura')) return;
  guardar(sessionStorage, 'inglou:abertura', '1');
  p.classList.add('pouso--espera');
  const jaVeio = guardar(localStorage, 'inglou:ja-veio');
  guardar(localStorage, 'inglou:ja-veio', '1');
  const calmo = matchMedia('(prefers-reduced-motion:reduce)').matches;
  const casca = document.querySelector('.casca');

  const tela = h('div', { class: 'abertura' + (calmo ? ' abertura--calma' : ''), role: 'status' },
    h('div', { class: 'abertura__voo' },
      h('span', { class: 'abertura__vento', 'aria-hidden': 'true' }, h('i'), h('i'), h('i')),
      h('div', { class: 'abertura__arco' }, louVoando())),
    h('div', { class: 'abertura__texto' },
      h('h1', {}, saudacao() + '!'),
      h('p', {}, jaVeio ? 'Que bom te ver de novo!' : 'Que bom te ver por aqui!')));

  let fim = false;
  const fechar = () => {
    if (fim) return; fim = true;
    clearTimeout(prazo);
    removeEventListener('keydown', fechar);
    const ave = tela.querySelector('.lou--voando');
    voarParaOPoleiro(ave, p, calmo);
    tela.querySelector('.abertura__voo').classList.add('abertura__voo--foi');
    tela.classList.add('abertura--sai');
    if (casca) casca.inert = false;
    setTimeout(() => { tela.remove(); document.getElementById('conteudo')?.focus({ preventScroll: true }); }, calmo ? 0 : 450);
  };
  const prazo = setTimeout(fechar, calmo ? 1400 : 2900);
  tela.addEventListener('click', fechar);
  addEventListener('keydown', fechar);
  if (casca) casca.inert = true;
  document.body.append(tela);
}

// de vez em quando o Tuiuiú do canto dá um pulinho de alegria (só com a aba à vista e sem "menos movimento")
function pulinhos() {
  const calmo = matchMedia('(prefers-reduced-motion:reduce)');
  setInterval(() => {
    const p = document.querySelector('.pouso:not(.pouso--espera)');
    if (!p || calmo.matches || document.hidden || Math.random() > .5) return;
    p.classList.remove('pouso--pula'); void p.offsetWidth; p.classList.add('pouso--pula');
  }, 18000);
}

abrir();
pulinhos();
