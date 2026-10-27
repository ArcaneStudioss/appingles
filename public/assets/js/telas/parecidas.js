// Palavras parecidas: desenhos com bola, caixa e carro para separar in/on/under, between/among, through/across...
// Só conteúdo fixo, sem IA. Ver, ouvir e treinar em janela. O treino aqui não vale pontos: serve para fixar a diferença.
import { h, icone, janela, falar } from '../ui.js?v=__V__';
import { som } from '../diversao.js?v=__V__';
import { GRUPOS, svgDe } from '../parecidas-cenas.js?v=__V__';

const figura = id => { const f = h('div', { class: 'parecidas__figura' }); f.innerHTML = svgDe(id); return f; };
const misturar = lista => lista.map(x => [Math.random(), x]).sort((a, b) => a[0] - b[0]).map(p => p[1]);

function treinar(grupo) {
  const itens = misturar(grupo.itens);
  let i = 0, certos = 0;
  const corpo = h('div', { class: 'parecidas__treino' });
  const { fechar } = janela({ titulo: grupo.titulo, corpo, larga: true });
  function passo() {
    if (i >= itens.length) {
      corpo.replaceChildren(h('p', { class: 'parecidas__placar' }, `${certos} de ${itens.length}`), h('p', {}, certos === itens.length ? 'Você separou todas. Muito bem!' : 'Veja as dicas e tente de novo quando quiser.'),
        h('div', { class: 'linha-acoes' }, h('button', { type: 'button', class: 'btn btn-sec', on: { click: () => { fechar(); treinar(grupo); } } }, 'Treinar de novo'), h('button', { type: 'button', class: 'btn', on: { click: () => fechar() } }, 'Fechar')));
      return;
    }
    const item = itens[i], resposta = h('p', { class: 'parecidas__resposta', 'aria-live': 'polite' });
    const botoes = misturar(grupo.itens).map(o => h('button', { type: 'button', class: 'btn btn-sec', lang: 'en', on: { click: e => {
      const ok = o.id === item.id; if (ok) certos++;
      som(ok ? 'acerto' : 'erro');
      botoes.forEach(b => { b.disabled = true; b.classList.toggle('certa', b.textContent === item.en); });
      e.currentTarget.classList.add(ok ? 'certa' : 'errada');
      resposta.textContent = (ok ? 'Isso! ' : `Era "${item.en}". `) + item.dica;
      falar(item.frase, { velocidade: .85 });
      corpo.append(h('button', { type: 'button', class: 'btn', on: { click: () => { i++; passo(); } } }, i + 1 < itens.length ? 'Próxima' : 'Ver resultado'));
    } } }, o.en));
    corpo.replaceChildren(h('p', { class: 'ajuda' }, `${i + 1} de ${itens.length}`), figura(item.id), h('p', { class: 'parecidas__pergunta' }, grupo.pergunta), h('div', { class: 'parecidas__opcoes' }, botoes), resposta);
  }
  passo();
}

export async function telaParecidas(el) {
  el.append(
    h('header', { class: 'cabeca c-rosa' }, h('span', { class: 'bolha' }, icone('eye')),
      h('div', {}, h('h1', {}, 'Palavras parecidas'), h('p', { class: 'ajuda' }, 'Veja a diferença no desenho, ouça a frase e treine com bola, caixa e carro.'))),
    GRUPOS.map(g => h('section', { class: 'folha parecidas' }, h('h2', {}, g.titulo),
      h('ul', { class: 'parecidas__lista' }, g.itens.map(it => h('li', { class: 'parecidas__card' }, figura(it.id),
        h('strong', { lang: 'en' }, it.en), h('span', {}, it.pt), h('small', { lang: 'en' }, it.frase),
        h('button', { type: 'button', class: 'btn btn-sec btn-peq', 'aria-label': 'Ouvir ' + it.en, on: { click: () => falar(it.frase, { velocidade: .85 }) } }, icone('speaker-high'), 'Ouvir')))),
      h('button', { type: 'button', class: 'btn', on: { click: () => treinar(g) } }, icone('target'), 'Treinar este grupo'))));
}
