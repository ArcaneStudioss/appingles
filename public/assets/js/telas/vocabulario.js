// Vocabulário em desenho: cartões com a cena, a palavra e a tradução, no estilo "aprenda inglês facilmente". Só conteúdo fixo.
// O treino aqui não vale pontos: serve para ligar a palavra ao desenho.
import { h, icone, janela, falar } from '../ui.js?v=__V__';
import { som } from '../diversao.js?v=__V__';
import { GRUPOS } from '../vocabulario-cenas.js?v=__V__';
import { svgDe } from '../vocabulario-desenhos.js?v=__V__';

const figura = en => { const f = h('div', { class: 'vocab__cena' }); f.innerHTML = svgDe(en); return f; };
const misturar = lista => lista.map(x => [Math.random(), x]).sort((a, b) => a[0] - b[0]).map(p => p[1]);

function treinar(grupo) {
  const itens = misturar(grupo.itens);
  let i = 0, certos = 0;
  const corpo = h('div', { class: 'parecidas__treino' });
  const { fechar } = janela({ titulo: grupo.titulo, corpo, larga: true });
  function passo() {
    if (i >= itens.length) {
      corpo.replaceChildren(h('p', { class: 'parecidas__placar' }, `${certos} de ${itens.length}`), h('p', {}, certos === itens.length ? 'Acertou todas. Muito bem!' : 'Veja os cartões de novo e tente quando quiser.'),
        h('div', { class: 'linha-acoes' }, h('button', { type: 'button', class: 'btn btn-sec', on: { click: () => { fechar(); treinar(grupo); } } }, 'Treinar de novo'), h('button', { type: 'button', class: 'btn', on: { click: () => fechar() } }, 'Fechar')));
      return;
    }
    const item = itens[i], resposta = h('p', { class: 'parecidas__resposta', 'aria-live': 'polite' });
    // 4 opções: a certa e 3 do mesmo grupo
    const opcoes = misturar([item, ...misturar(grupo.itens.filter(o => o !== item)).slice(0, 3)]);
    const botoes = opcoes.map(o => h('button', { type: 'button', class: 'btn btn-sec', lang: 'en', on: { click: e => {
      const ok = o === item; if (ok) certos++;
      som(ok ? 'acerto' : 'erro');
      botoes.forEach(b => { b.disabled = true; b.classList.toggle('certa', b.textContent === item.en); });
      e.currentTarget.classList.add(ok ? 'certa' : 'errada');
      resposta.textContent = `${ok ? 'Isso! ' : 'Era '}"${item.en}" é ${item.pt}. ${item.frase}`;
      falar(item.frase, { velocidade: .85 });
      corpo.append(h('button', { type: 'button', class: 'btn', on: { click: () => { i++; passo(); } } }, i + 1 < itens.length ? 'Próxima' : 'Ver resultado'));
    } } }, o.en));
    corpo.replaceChildren(h('p', { class: 'ajuda' }, `${i + 1} de ${itens.length}`), figura(item.en), h('p', { class: 'parecidas__pergunta' }, grupo.pergunta), h('div', { class: 'parecidas__opcoes' }, botoes), resposta);
  }
  passo();
}

export async function telaVocabulario(el) {
  el.append(
    h('header', { class: 'cabeca c-rosa' }, h('span', { class: 'bolha' }, icone('eye')),
      h('div', {}, h('h1', {}, 'Palavras em desenho'), h('p', { class: 'ajuda' }, 'Veja o desenho, ouça a frase e treine. Dá para entender sem traduzir.'))),
    GRUPOS.map(g => h('section', { class: 'folha parecidas', 'aria-label': g.titulo }, h('h2', {}, g.titulo),
      h('ul', { class: 'vocab__lista' }, g.itens.map(it => h('li', { class: 'vocab__card' }, figura(it.en),
        h('strong', { lang: 'en' }, it.en), h('span', {}, it.pt),
        h('button', { type: 'button', class: 'btn btn-sec btn-peq', 'aria-label': 'Ouvir ' + it.en, on: { click: () => falar(it.frase, { velocidade: .85 }) } }, icone('speaker-high'), 'Ouvir')))),
      h('button', { type: 'button', class: 'btn', on: { click: () => treinar(g) } }, icone('target'), 'Treinar este grupo'))));
}
