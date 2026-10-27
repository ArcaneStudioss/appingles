// Sons do inglês: alfabeto e os sons em que quem fala português mais tropeça. Sem IA; só conteúdo fixo com áudio.
import { api } from '../api.js?v=__V__';
import { h, icone, falar } from '../ui.js?v=__V__';

export async function telaSons(el) {
  const d = await api('/sons');
  el.append(
    h('header', { class: 'cabeca c-menta' }, h('span', { class: 'bolha' }, icone('speaker-high')),
      h('div', {}, h('h1', {}, 'Sons do inglês'), h('p', { class: 'ajuda' }, 'Ouça, repita e compare. A leitura em português é só um apoio.'))),
    h('section', { class: 'folha' }, h('h2', {}, 'Alfabeto'),
      h('p', { class: 'ajuda' }, 'Como se diz cada letra em inglês.'),
      h('ul', { class: 'sons-letras' }, d.LETRAS.map(([letra, como]) => h('li', {}, h('strong', { lang: 'en' }, letra), h('span', {}, como))))),
    d.SONS.map(s => h('section', { class: 'folha sons-grupo' }, h('h2', {}, s.titulo), h('p', {}, s.dica),
      h('ul', { class: 'sons-palavras' }, s.palavras.map(([en, como]) => h('li', {},
        h('button', { type: 'button', class: 'btn btn-sec', 'aria-label': 'Ouvir ' + en, on: { click: () => falar(en, { velocidade: 0.8 }) } }, icone('speaker-high'), h('span', { lang: 'en' }, en)),
        h('small', {}, 'leia: ' + como)))))));
}
