import { api } from '../api.js?v=__V__';
import { h, icone } from '../ui.js?v=__V__';
import { materialAula } from '../material-aula.js?v=__V__';
import { exercicio } from './exercicio.js?v=__V__';
import { NOMES_PUBLICO } from './publico.js?v=__V__';
import { companheirosAula } from '../companheiros.js?v=__V__';
const normalizar = texto => texto.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/\p{Diacritic}/gu, '').trim();

export async function telaBiblioteca(el, { estado }) {
  const { unidades, publico } = await api('/biblioteca');
  const professor = estado.eu?.perfil?.papel === 'professor';
  const busca = h('input', { type: 'search', placeholder: 'Tema ou palavra: música, bergamota, gírias...', 'aria-label': 'Buscar tema na biblioteca' });
  const nivel = h('select', { 'aria-label': 'Filtrar por nível' }, h('option', { value: '' }, 'Todos os níveis'), ['A1', 'A2', 'B1'].map(n => h('option', { value: n }, n)));
  const colecao = h('select', { 'aria-label': 'Coleção da biblioteca' }, h('option', { value: '' }, 'Todas as coleções'), h('option', { value: 'brasil-mundo' }, 'Do Brasil pro mundo'));
  colecao.value = new URLSearchParams(location.hash.split('?')[1] || '').get('colecao') === 'brasil-mundo' ? 'brasil-mundo' : '';
  const faixa = professor ? h('select', { 'aria-label': 'Público da biblioteca' }, h('option', { value: '' }, 'Todos os públicos'), Object.entries(NOMES_PUBLICO).map(([id, nome]) => h('option', { value: id }, nome))) : null;
  const lista = h('div', { class: 'biblioteca-grade' });
  const desenhar = () => {
    const termo = normalizar(busca.value);
    const filtradas = unidades.filter(u => (!nivel.value || u.nivel === nivel.value) && (!colecao.value || u.colecao === colecao.value) && (!faixa?.value || u.faixa === faixa.value) && normalizar(`${u.titulo} ${u.tema} ${(u.termos || []).join(' ')}`).includes(termo));
    lista.replaceChildren(filtradas.length ? filtradas.map(u => h('article', { class: 'capitulo-card' },
      h('span', { class: 'capitulo-card__imagem', 'aria-hidden': 'true' }, u.imagem),
      h('div', { class: 'linha-acoes' }, h('span', { class: 'chip' }, u.nivel), h('span', { class: 'chip' }, professor ? NOMES_PUBLICO[u.faixa] : u.tema)),
      h('h2', {}, u.titulo), h('p', {}, `${u.palavras} palavras e expressões · leitura · ${u.total} questões com explicação`),
      u.nivel === estado.eu?.nivel ? h('p', { class: 'ajuda' }, 'Combina com seu nível atual') : null,
      h('a', { class: 'btn btn-bloco' + (u.concluida ? ' btn-sec' : ''), href: `#/biblioteca/${u.id}` }, u.concluida ? 'Rever aula' : u.feitas ? 'Continuar aula' : 'Estudar este capítulo'))) : h('p', { class: 'folha' }, 'Nenhum capítulo com esses filtros. Escolha outro nível ou tema.'));
  };
  busca.addEventListener('input', desenhar); nivel.addEventListener('change', desenhar); colecao.addEventListener('change', desenhar); faixa?.addEventListener('change', desenhar);
  el.append(h('header', { class: 'cabeca c-azul' }, h('span', { class: 'bolha' }, icone('book-open-text')), h('div', {}, h('h1', {}, publico.id === 'crianca' && !professor ? 'Histórias e palavras' : 'Biblioteca de inglês'), h('p', { class: 'ajuda' }, professor ? 'Explore capítulos por público, nível e conteúdo. Use as questões para montar suas aulas.' : `${publico.nome}: temas para sua fase da vida, com dificuldade indicada em cada capítulo.`))),
    h('a', { class: 'brasil-convite c-turquesa', href: '#/brasil' }, h('span', { class: 'bolha' }, icone('chats')), h('span', {}, h('strong', {}, 'Do Brasil pro mundo'), h('small', {}, publico.id === 'crianca' && !professor ? 'Nomes da sua região e histórias para contar em inglês' : 'Gírias, ditados e jeitos regionais com equivalentes em inglês')), icone('caret-right')),
    h('div', { class: 'biblioteca-filtros' }, busca, nivel, colecao, faixa), lista,
    professor ? h('a', { class: 'btn btn-sec', href: '#/professor' }, 'Montar uma aula para minha turma') : null);
  desenhar();
}

export async function telaUnidade(el, { param, ir }) {
  let d;
  try { d = await api(`/biblioteca/${param}`); }
  catch (e) { if (e.status !== 403 && e.status !== 402) throw e; el.append(h('section', { class: 'folha' }, h('h1', {}, 'Continue com o plano completo'), h('p', {}, e.message), h('a', { class: 'btn', href: '#/conta' }, 'Ver minha assinatura'))); return; }
  const { unidade: u, itens, respondidos } = d;
  let i = 0;
  const pendente = itens.findIndex(e => !respondidos[e.id]);
  if (Object.keys(respondidos).length && pendente >= 0) i = pendente + 1;
  const palco = h('div', { class: 'licao-palco' });
  const progresso = h('p', { class: 'licao-contador', 'aria-live': 'polite' });
  el.append(h('div', { class: 'licao-topo' }, h('a', { class: 'btn btn-texto btn-peq', href: '#/biblioteca' }, icone('caret-left'), 'Biblioteca'), progresso), palco);
  const avancar = () => { i++; desenhar(); };
  const barra = (texto, acao) => h('div', { class: 'barra-acao barra-acao--fixa' }, h('div', { class: 'barra-acao__in' }, h('button', { type: 'button', class: 'btn btn-bloco', on: { click: acao } }, texto)));
  function desenhar() {
    const tela = h('div', { class: 'passo' }); palco.replaceChildren(tela); scrollTo(0, 0);
    progresso.textContent = i === 0 ? 'Estudar antes de responder' : i <= itens.length ? `Questão ${i} de ${itens.length}` : 'Capítulo concluído';
    if (i === 0) tela.append(h('p', { class: 'chip' }, u.nivel, ' · ', u.tema), h('h1', {}, u.titulo), materialAula(u), barra('Praticar o que aprendi', avancar));
    else if (i <= itens.length) {
      const ex = itens[i - 1];
      tela.append(h('a', { class: 'btn btn-texto btn-peq', href: '#', on: { click: e => { e.preventDefault(); i = 0; desenhar(); } } }, icone('book-open-text'), 'Consultar o material'),
        exercicio(ex, { permitirTreino: true, barraFixa: true, ja: respondidos[ex.id], aoProximo: avancar,
          responder: async (resposta, meta) => { const r = await api(`/biblioteca/${u.id}/responder`, { metodo: 'POST', corpo: { itemId: ex.id, resposta, ...meta } }); if (!r.pratica) respondidos[ex.id] = { ...r, resposta }; return r; } }));
    } else tela.append(companheirosAula({ fase: 'fim', silencioso: d.concluida === true }).elemento, h('span', { class: 'etapa' }, icone('check'), 'Você concluiu este capítulo'), h('h1', {}, 'Mais palavras para usar de verdade'), h('p', {}, 'As expressões desta aula também estão nos seus cartões de revisão. Você pode voltar ao material e às explicações quando quiser.'), materialAula({ vocab: u.vocab }), barra('Voltar à biblioteca', () => ir('#/biblioteca')));
    tela.querySelector('h1,h2')?.setAttribute('tabindex', '-1'); tela.querySelector('h1,h2')?.focus({ preventScroll: true });
  }
  desenhar();
}
