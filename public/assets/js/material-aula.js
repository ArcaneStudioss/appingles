import { h, icone, falar, falarPt } from './ui.js?v=__V__';

export function materialAula(material = {}) {
  const { explicacao, texto, traducao, vocab = [] } = material;
  return h('div', { class: 'material-aula' },
    explicacao ? h('section', { class: 'folha' }, h('h2', {}, 'Antes de praticar'), h('p', {}, explicacao), h('button', { type: 'button', class: 'btn btn-texto btn-peq', on: { click: () => falarPt(explicacao) } }, icone('speaker-high'), 'Ler explicação')) : null,
    vocab.length ? h('section', { class: 'folha' }, h('h2', {}, 'Amplie seu vocabulário'), h('p', { class: 'ajuda' }, 'Toque nas palavras para traduzir. Use o áudio para ouvir a pronúncia.'),
      h('ul', { class: 'vocabulario-aula' }, vocab.map(v => h('li', {}, h('div', {}, h('strong', { lang: 'en', 'data-traducao': v.pt }, v.en), h('p', {}, v.pt)), h('button', { type: 'button', class: 'btn-icone', 'aria-label': 'Ouvir ' + v.en, on: { click: () => falar(v.en, { velocidade: 0.85 }) } }, icone('speaker-high')))))) : null,
    texto ? h('section', { class: 'folha' }, h('div', { class: 'linha-titulo' }, h('h2', {}, 'Leia e descubra'), h('button', { type: 'button', class: 'btn btn-sec btn-peq', on: { click: () => falar(texto, { velocidade: 0.85 }) } }, icone('speaker-high'), 'Ouvir texto')),
      h('blockquote', { class: 'texto-leitura', lang: 'en', 'data-traducao': traducao || null }, texto),
      traducao ? h('details', { class: 'ajuda-exercicio' }, h('summary', {}, 'Consultar tradução do texto'), h('p', {}, traducao)) : null) : null);
}
