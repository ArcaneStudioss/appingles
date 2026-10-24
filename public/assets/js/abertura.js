// Inglou · tela de abertura: o Tuiuiú chega voando e dá a saudação do horário.
// Aparece uma vez por sessão do aparelho; toque, tecla ou o tempo encerram. Com "menos movimento" não voa, só aparece.
import { h } from './ui.js?v=__V__';
import { lou } from './diversao.js?v=__V__';

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
      h('div', { class: 'abertura__arco' }, lou('feliz', { tamanho: 150, rotulo: '' }))),
    h('div', { class: 'abertura__texto' },
      h('h1', {}, saudacao() + '!'),
      h('p', {}, jaVeio ? 'Que bom te ver de novo!' : 'Que bom te ver por aqui!')));
  tela.querySelector('svg')?.setAttribute('aria-hidden', 'true');

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
