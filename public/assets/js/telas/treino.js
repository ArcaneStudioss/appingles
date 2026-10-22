// Treino focado: de 6 a 10 perguntas, 100% nas dificuldades de cada aluno, no modo (ler, escrever, ouvir) em que ele mais precisa.
// Um passo por tela, como a lição. O gabarito é conferido no servidor. Termina mostrando o que melhorou, por dificuldade.
import { api } from '../api.js?v=__V__';
import { h, icone, toast, confirmar, ocupado } from '../ui.js?v=__V__';
import { lou, louFala, som, confete } from '../diversao.js?v=__V__';
import { exercicio } from './exercicio.js?v=__V__';
import { companheirosAula } from '../companheiros.js?v=__V__';
import { nomeConquista } from './hoje.js?v=__V__';

const MODO = { ler: ['book-open-text', 'azul', 'lendo'], escrever: ['pencil-simple', 'menta', 'escrevendo'], ouvir: ['headphones', 'turquesa', 'ouvindo'] };

export async function telaTreino(el, { ir }) {
  const { treino: t } = await api('/treino');
  const itens = t.itens;
  const total = itens.length + 2;                       // intro + perguntas + fim
  let i = 0;
  const feitos = Object.keys(t.respondidos).length;
  if (!t.concluido && feitos && feitos < itens.length) i = 1 + itens.findIndex(x => !t.respondidos[x.id]);
  else if (t.concluido || feitos === itens.length) i = total - 1;

  const topo = h('div', { class: 'licao-topo' },
    h('button', { type: 'button', class: 'btn btn-texto btn-peq', 'aria-label': 'Sair do treino', on: { click: async () => { if (i === 0 || i === total - 1 || await confirmar({ titulo: 'Sair do treino?', texto: 'O que você já respondeu fica salvo e você continua de onde parou.', ok: 'Sair', cancelar: 'Continuar' })) ir('#/hoje'); } } }, icone('x')),
    h('div', { class: 'trilho', role: 'progressbar', 'aria-label': 'Progresso do treino', 'aria-valuemin': 0, 'aria-valuemax': total - 1 }, h('span', { class: 'trilho__cheio' }), h('span', { class: 'trilho__lou' }, lou('feliz', { tamanho: 38, rotulo: '' }))),
    h('span', { class: 'chip c-limao' }, icone('target'), 'Treino'));
  const palco = h('div', { class: 'licao-palco' });
  el.append(topo, palco);
  const avancar = () => { i = Math.min(total - 1, i + 1); desenhar(); };
  const barraBotao = (rotulo, acao = avancar) => h('div', { class: 'barra-acao barra-acao--fixa' }, h('div', { class: 'barra-acao__in' }, h('button', { type: 'button', class: 'btn btn-bloco btn-cor c-limao', on: { click: acao } }, rotulo)));

  function desenhar() {
    const barra = topo.querySelector('.trilho');
    barra.setAttribute('aria-valuenow', i); barra.style.setProperty('--p', (i / (total - 1)).toFixed(3));
    const tela = h('div', { class: 'passo' });
    palco.replaceChildren(tela);
    if (i === 0) intro(tela);
    else if (i === total - 1) fim(tela);
    else {
      const ex = itens[i - 1];
      const [ic, cor, nome] = MODO[ex.tipo === 'ditado' ? 'ouvir' : ex.tipo === 'escolha' ? 'ler' : 'escrever'];
      tela.append(h('p', { class: `etapa c-${cor}` }, h('span', { class: 'bolha' }, icone(ic)), ex.tipo === 'corrigir' ? 'Uma frase sua' : `Treinando ${nome}`),
        exercicio(ex, {
          ja: t.respondidos[ex.id],
          responder: async (resposta, meta) => { const r = await api('/treino/responder', { metodo: 'POST', corpo: { itemId: ex.id, resposta, ...meta } }); t.respondidos[ex.id] = { ...r, resposta }; return r; },
          aoProximo: avancar, barraFixa: true,
        }));
    }
    tela.querySelector('h1,h2')?.setAttribute('tabindex', '-1');
    if (i === 0 || i === total - 1) tela.querySelector('h1,h2')?.focus({ preventScroll: true });
    scrollTo(0, 0);
  }

  function intro(tela) {
    const m = t.modos || {};
    tela.append(
      h('p', { class: 'etapa c-limao' }, h('span', { class: 'bolha' }, icone('target')), 'Treino focado'),
      h('h1', {}, 'O treino de hoje é só seu'),
      louFala('oi', h('p', { class: 'bilhete pequeno' }, 'Por que este treino'), h('ul', { class: 'por-que' }, t.porque.map(x => h('li', {}, x)))),
      h('div', { class: 'treino-modos', 'aria-label': 'Como o treino está dividido' }, ['ler', 'escrever', 'ouvir'].filter(k => m[k]).map(k => h('span', { class: `chip c-${MODO[k][1]}` }, icone(MODO[k][0]), `${m[k]} ${MODO[k][2]}`)), t.pessoais ? h('span', { class: 'chip c-sol' }, icone('note-pencil'), `${t.pessoais} ${t.pessoais === 1 ? 'frase sua' : 'frases suas'}`) : null),
      h('div', { class: 'treino-tags' }, t.tags.map(x => h('span', { class: 'chip chip-neutro' }, x.nome))),
      t.modo === 'ia' ? h('p', { class: 'ajuda' }, icone('sparkle'), ' Frases novas escritas pela IA, sobre a sua área e os seus erros.') : null,
      barraBotao(i === 0 && Object.keys(t.respondidos).length ? 'Continuar o treino' : 'Começar'));
  }

  async function fim(tela) {
    const jaConcluido = t.concluido;
    tela.classList.add('passo--fim');
    tela.append(h('h2', { class: 'fim-titulo' }, 'Treino feito!'), h('p', { class: 'ajuda' }, 'Contando as suas respostas...'));
    let r;
    try { r = await api('/treino/concluir', { metodo: 'POST' }); } catch (e) { toast(e.message, { tipo: 'erro' }); return; }
    if (!t.concluido) { som('fim'); confete(); t.concluido = true; }
    for (const c of r.conquistas || []) toast('Nova figurinha: ' + nomeConquista(c), { tipo: 'ok' });
    const pct = r.feitos ? Math.round(100 * r.certos / r.feitos) : 0;
    tela.replaceChildren(
      companheirosAula({ fase: 'fim', silencioso: jaConcluido }).elemento, h('h2', { class: 'fim-titulo' }, pct >= 70 ? 'Treino feito. Mandou bem!' : 'Treino feito. É assim que se aprende.'),
      h('div', { class: 'placar' }, h('div', { class: 'placar__item' }, h('span', {}, 'Certas'), h('strong', {}, `${r.certos}/${r.feitos}`)), h('div', { class: 'placar__item placar__item--sol' }, h('span', {}, 'Acerto'), h('strong', {}, `${pct}%`)), h('div', { class: 'placar__item placar__item--azul' }, h('span', {}, 'XP de conclusão'), h('strong', {}, String(r.recompensa?.xp || 0)))),
      h('section', { class: 'folha treino-resumo c-limao' }, h('h2', {}, 'Por dificuldade'), h('ul', { class: 'barras' }, r.porTag.map(x => h('li', {}, h('span', { class: 'barras-rotulo' }, x.nome), h('span', { class: 'barras-trilho', 'aria-hidden': 'true' }, h('span', { style: `transform:scaleX(${(x.certos / Math.max(1, x.total)).toFixed(2)})` })), h('strong', {}, `${x.certos}/${x.total}`)))),
        h('p', { class: 'ajuda' }, 'O que você errou virou cartão de revisão e volta amanhã, de outro jeito.')),
      h('div', { class: 'linha-acoes' },
        h('a', { class: 'btn btn-cor c-limao', href: '#/hoje' }, 'Voltar para hoje'),
        h('button', { type: 'button', class: 'btn btn-sec', on: { click: async e => { const b = e.currentTarget; ocupado(b, true); try { await api('/treino/novo', { metodo: 'POST' }); ir('#/treino'); } catch (err) { toast(err.message, { tipo: 'erro' }); ocupado(b, false); } } } }, icone('repeat'), 'Mais um treino'),
        h('a', { class: 'btn btn-sec', href: '#/aprender' }, icone('compass'), 'Meu jeito de aprender')));
  }
  desenhar();
}
