// Dias de voo: a constância do aluno, do jeito do Inglou. O Tuiuiú é uma arara-azul; cada dia de estudo ele deixa
// uma pena azul de ponta amarela, e as penas da semana abrem em leque, como uma asa. Sete dias seguidos fecham a asa.
// Só CSS e SVG; sem movimento quando a pessoa pede menos animação. Os dados (dias seguidos, escudos, semana) vêm da API.
import { h, icone, reduzirMovimento } from './ui.js?v=__V__';
import { lou, som, vibrar } from './diversao.js?v=__V__';

const MARCOS = [3, 7, 14, 30, 60, 100, 200, 365];

const PENA = `<svg class="pena__svg" viewBox="0 0 40 120" aria-hidden="true" focusable="false">
  <path class="pena__corpo" d="M20 3C33 20 37 58 25 92L23 104H17L15 92C3 58 7 20 20 3Z"/>
  <path class="pena__ponta" d="M20 3C26 11 30 22 31 35C24 30 16 30 9 35C10 22 14 11 20 3Z"/>
  <path class="pena__eixo" d="M20 16V116"/>
  <path class="pena__farpa" d="M20 50L11 42M20 66L10 59M20 50L29 42M20 66L30 59"/>
</svg>`;
const pena = (classe = '') => { const el = h('span', { class: 'pena ' + classe, 'aria-hidden': 'true' }); el.innerHTML = PENA; return el; };

const dia3 = d => { const t = new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''); return t[0].toUpperCase() + t.slice(1); };

// seq = { atual, escudos, semana: [{ data, estado }] }. Devolve uma promessa que termina quando a pessoa fecha.
export function celebrarSequencia(seq, { nome = '' } = {}) {
  if (!seq || !(seq.atual > 0) || document.querySelector('.dias-voo')) return Promise.resolve();
  const parado = reduzirMovimento();
  const dias = seq.atual, marco = MARCOS.includes(dias);
  const semana = seq.semana || [];
  const naSemana = semana.filter(d => d.estado === 'estudou' || d.estado === 'escudo').length;
  const msg = dias === 1 ? 'Primeira pena! Volte amanhã e o Tuiuiú deixa mais uma.'
    : marco ? `${dias} dias de voo: essa pena é dourada. Constância de verdade!`
    : naSemana >= 7 ? 'Asa completa: sete penas nesta semana!'
    : `Mais uma pena para a sua asa. Já são ${naSemana} nesta semana.`;

  const leque = h('div', { class: 'dias-voo__leque', 'aria-hidden': 'true' });
  const rotulos = h('ol', { class: 'dias-voo__dias', 'aria-hidden': 'true' });
  semana.forEach((d, i) => {
    const hoje = i === semana.length - 1, feito = d.estado === 'estudou' || d.estado === 'escudo';
    const p = pena((feito ? 'pena--feita' : 'pena--vazia') + (d.estado === 'escudo' ? ' pena--escudo' : '') + (hoje ? ' pena--hoje' : '') + (hoje && marco ? ' pena--ouro' : ''));
    p.style.setProperty('--i', String(i)); p.style.setProperty('--n', String(semana.length));
    leque.append(p);
    rotulos.append(h('li', { class: hoje ? 'hoje' : feito ? 'feito' : '' }, dia3(d.data)));
  });

  return new Promise(resolver => {
    const botao = h('button', { type: 'button', class: 'btn btn-bloco dias-voo__botao' }, nome ? `Boa, ${nome}!` : 'Continuar');
    const raiz = h('div', { class: 'dias-voo' + (parado ? ' dias-voo--parado' : '') + (marco ? ' dias-voo--marco' : ''), role: 'dialog', 'aria-modal': 'true', 'aria-label': `${dias} ${dias === 1 ? 'dia' : 'dias'} de voo` },
      h('span', { class: 'dias-voo__nuvem dias-voo__nuvem--1', 'aria-hidden': 'true' }), h('span', { class: 'dias-voo__nuvem dias-voo__nuvem--2', 'aria-hidden': 'true' }),
      h('div', { class: 'dias-voo__ave', 'aria-hidden': 'true' }, lou('festa', { tamanho: 104, rotulo: '' })),
      leque, rotulos,
      h('p', { class: 'dias-voo__total' }, h('strong', {}, String(dias)), h('span', {}, dias === 1 ? 'dia de voo' : 'dias de voo seguidos')),
      h('p', { class: 'dias-voo__msg' }, msg),
      seq.escudos > 0 ? h('p', { class: 'dias-voo__escudo' }, icone('shield-check'), `${seq.escudos} ${seq.escudos === 1 ? 'escudo guardado: ele cobre' : 'escudos guardados: eles cobrem'} um dia sem estudo`) : null,
      h('div', { class: 'dias-voo__acao' }, botao));
    // trocar de tela (voltar do navegador, link) também fecha: a comemoração não fica por cima da tela seguinte
    const fechar = () => { removeEventListener('keydown', tecla, true); removeEventListener('hashchange', fechar); raiz.classList.add('dias-voo--saindo'); setTimeout(() => { raiz.remove(); resolver(); }, parado ? 0 : 220); };
    const tecla = e => { if (e.key === 'Escape') { e.stopPropagation(); fechar(); } };
    botao.addEventListener('click', fechar);
    addEventListener('keydown', tecla, true); addEventListener('hashchange', fechar);
    document.body.append(raiz);
    botao.focus({ preventScroll: true });
    if (parado) return;
    som('fim'); vibrar([20, 30, 20, 30, 80]);
  });
}

// Pena pequena para a pílula da tela inicial e para a semana: colorida quando o dia conta, só contorno quando ainda não.
export function penaMini({ acesa = true } = {}) { return pena('pena-mini' + (acesa ? ' pena--feita' : ' pena--vazia')); }
