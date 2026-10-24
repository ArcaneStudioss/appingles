// Inglou · tela de abertura: o Tuiuiú chega voando e dá a saudação do horário.
// Aparece uma vez por sessão do aparelho; toque, tecla ou o tempo encerram. Com "menos movimento" não voa, só aparece.
import { h } from './ui.js?v=__V__';

const NS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs = {}, ...filhos) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); e.append(...filhos); return e; };

// Tuiuiú de frente, livre no ar, com as asas abertas (cores do mascote: acompanham Dia e Noite)
function louVoando() {
  const C = { corpo: 'var(--arara-1,#2447D0)', sombra: 'var(--arara-2,#1A33A0)', luz: 'var(--arara-3,#6C8DFF)' };
  const traco = (d, cor, larg, op = 1) => el('path', { d, stroke: cor, 'stroke-width': larg, 'stroke-linecap': 'round', fill: 'none', opacity: op });
  // pena: sai da base (bx,by), aponta no ângulo (graus) e tem comprimento e largura; com a haste no meio
  const pena = (bx, by, ang, comp, larg, cor, haste = true) => {
    const a = ang * Math.PI / 180, dx = Math.cos(a), dy = Math.sin(a), nx = -dy, ny = dx;
    const P = (t, l) => `${(bx + dx * comp * t + nx * larg * l).toFixed(1)} ${(by + dy * comp * t + ny * larg * l).toFixed(1)}`;
    const g = el('g');
    g.append(el('path', { d: `M${P(0, 0)} C${P(.25, 1)} ${P(.75, 1.05)} ${P(1, 0)} C${P(.75, -.8)} ${P(.25, -1)} ${P(0, 0)} Z`, fill: cor }));
    if (haste) g.append(traco(`M${P(.05, 0)} L${P(.92, 0)}`, C.luz, 1.3, .55));
    return g;
  };
  const asa = lado => {
    const g = el('g', { class: 'asa asa--' + lado });
    const f = el('g', lado === 'e' ? { transform: 'translate(240 0) scale(-1 1)' } : {});
    // da ponta para o ombro: primárias (as longas), secundárias, e as fileiras de coberteiras por cima
    for (let i = 0; i < 7; i++) f.append(pena(172 + i * 1.5, 56 + i * 2, -58 + i * 9.5, 70 - i * 2.5, 9.5, i % 2 ? C.sombra : C.corpo));
    for (let i = 0; i < 6; i++) f.append(pena(138 + i * 7, 90 - i * 4.5, 8 - i * 5, 56 - i * 3, 11, i % 2 ? C.corpo : C.sombra));
    f.append(el('path', { d: 'M122 70 C140 52 160 46 178 52 C170 66 158 82 140 94 C132 98 126 96 122 90 Z', fill: C.corpo }));
    for (let i = 0; i < 5; i++) f.append(el('ellipse', { cx: 168 - i * 9, cy: 62 + i * 6, rx: 9.5, ry: 6.5, fill: i % 2 ? C.corpo : C.sombra, opacity: '.9', transform: `rotate(${-24 - i * 3} ${168 - i * 9} ${62 + i * 6})` }));
    for (let i = 0; i < 4; i++) f.append(el('ellipse', { cx: 160 - i * 10, cy: 56 + i * 5.5, rx: 8, ry: 5.5, fill: C.luz, opacity: '.8', transform: `rotate(${-28 - i * 3} ${160 - i * 10} ${56 + i * 5.5})` }));
    f.append(traco('M124 70 C142 50 164 44 184 50', C.luz, 3.2, .85));
    g.append(f); return g;
  };
  const s = el('svg', { viewBox: '0 0 240 176', class: 'lou lou--voando', 'aria-hidden': 'true', focusable: 'false' });
  s.append(
    // cauda longa
    el('path', { d: 'M108 118 L96 172 L120 162 L144 172 L132 118 Z', fill: C.sombra }),
    el('path', { d: 'M114 118 L112 160 L120 154 L128 160 L126 118 Z', fill: C.corpo }),
    asa('e'), asa('d'),
    // corpo e barriga
    el('ellipse', { cx: 120, cy: 88, rx: 27, ry: 37, fill: C.corpo }),
    el('ellipse', { cx: 120, cy: 94, rx: 14, ry: 26, fill: C.luz, opacity: '.28' }),
    traco('M110 120 Q108 128 102 130', '#5B6275', 3), traco('M130 120 Q132 128 138 130', '#5B6275', 3),
    // cabeça
    el('circle', { cx: 120, cy: 46, r: 23, fill: C.corpo }), traco('M104 34 Q110 26 120 25', '#fff', 3, .3),
    // manchas amarelas e olhos felizes
    el('ellipse', { cx: 105, cy: 55, rx: 6, ry: 4, fill: '#FFC83D' }), el('ellipse', { cx: 135, cy: 55, rx: 6, ry: 4, fill: '#FFC83D' }),
    el('circle', { cx: 108, cy: 44, r: 8, fill: '#FFC83D' }), el('circle', { cx: 132, cy: 44, r: 8, fill: '#FFC83D' }),
    traco('M102 46 Q108 37 114 46', '#16224A', 3.4), traco('M126 46 Q132 37 138 46', '#16224A', 3.4),
    // bico grosso e curvo, de frente
    el('path', { d: 'M120 46 Q106 52 110 66 Q114 80 120 82 Q126 80 130 66 Q134 52 120 46 Z', fill: '#3A4254' }),
    traco('M115 55 Q113 62 116 70', '#7A849B', 2.5, .75),
    traco('M113 74 Q120 79 127 74', C.sombra, 2, .5));
  return s;
}

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

// o Tuiuiú sai da tela por cima, volta planando pela esquerda e pousa no poleiro do canto superior direito
function voarParaOPoleiro(ave, poleiroEl, calmo) {
  const chegar = () => { poleiroEl.classList.remove('pouso--espera'); if (!calmo) poleiroEl.classList.add('pouso--chegou'); };
  const de = ave.getBoundingClientRect(), para = poleiroEl.getBoundingClientRect();
  if (calmo || !de.width || !ave.animate) return chegar();
  const vw = innerWidth, vh = innerHeight, W = de.width, H = de.height;
  const fim = { x: para.left + para.width / 2, y: para.top + para.height / 2 }, ini = { x: de.left + W / 2, y: de.top + H / 2 };
  const fim_s = Math.min(1, 54 / W);
  const clone = h('div', { class: 'ave-voo' }, ave.cloneNode(true));
  clone.firstChild.classList.add('lou--rapido');
  clone.classList.add('ave-voo');
  document.body.append(clone);
  const q = (c, s, r) => `translate(${c.x - W / 2}px,${c.y - H / 2}px) scale(${s}) rotate(${r}deg)`;
  const anim = clone.animate([
    { transform: q(ini, 1, 0), offset: 0, easing: 'cubic-bezier(.5,0,.9,.5)' },
    { transform: q({ x: ini.x + vw * .08, y: -H }, 1.2, 8), offset: .2 },
    { transform: q({ x: -W, y: vh * .3 }, .8, -6), offset: .21, easing: 'cubic-bezier(.25,.6,.4,1)' },
    { transform: q({ x: vw * .5, y: vh * .16 }, .55, 6), offset: .62, easing: 'cubic-bezier(.2,.7,.35,1)' },
    { transform: q({ x: fim.x - 6, y: fim.y - 2 }, fim_s * 1.05, 0), offset: 1 },
  ], { duration: 2300, fill: 'forwards' });
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

abrir();
