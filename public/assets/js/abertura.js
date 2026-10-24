// Inglou · tela de abertura: o Tuiuiú chega voando e dá a saudação do horário.
// Aparece uma vez por sessão do aparelho; toque, tecla ou o tempo encerram. Com "menos movimento" não voa, só aparece.
import { h } from './ui.js?v=__V__';

const NS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs = {}, ...filhos) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); e.append(...filhos); return e; };

// Tuiuiú de frente, livre no ar, com as asas abertas (cores do mascote: acompanham Dia e Noite)
function louVoando() {
  const C = { corpo: 'var(--arara-1,#2447D0)', sombra: 'var(--arara-2,#1A33A0)', luz: 'var(--arara-3,#6C8DFF)' };
  const traco = (d, cor, larg, op = 1) => el('path', { d, stroke: cor, 'stroke-width': larg, 'stroke-linecap': 'round', fill: 'none', opacity: op });
  const asa = lado => {
    const g = el('g', { class: 'asa asa--' + lado });
    const f = el('g', lado === 'e' ? { transform: 'translate(240 0) scale(-1 1)' } : {});
    f.append(
      el('path', { d: 'M122 70 C150 40 196 24 236 32 C226 44 218 52 210 58 C220 58 228 57 234 54 C220 76 196 90 172 94 C180 96 188 96 194 95 C174 112 144 112 124 100 Z', fill: C.corpo }),
      el('path', { d: 'M122 84 C150 76 180 66 206 58 C190 82 160 100 124 100 Z', fill: C.sombra, opacity: '.55' }),
      traco('M130 80 C158 66 190 48 222 38', C.luz, 3, .5), traco('M132 92 C160 82 186 68 208 62', C.luz, 3, .4));
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

function abrir() {
  if (guardar(sessionStorage, 'inglou:abertura')) return;
  guardar(sessionStorage, 'inglou:abertura', '1');
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
    tela.classList.add('abertura--sai');
    setTimeout(() => {
      tela.remove();
      if (casca) casca.inert = false;
      document.getElementById('conteudo')?.focus({ preventScroll: true });
    }, calmo ? 0 : 450);
  };
  const prazo = setTimeout(fechar, calmo ? 1400 : 2900);
  tela.addEventListener('click', fechar);
  addEventListener('keydown', fechar);
  if (casca) casca.inert = true;
  document.body.append(tela);
}

abrir();
