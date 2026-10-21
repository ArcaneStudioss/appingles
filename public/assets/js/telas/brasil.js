import { api } from '../api.js?v=__V__';
import { h, icone, falar, toast } from '../ui.js?v=__V__';
import { registrarExpressoes } from '../traducao.js?v=__V__';
import { NOMES_PUBLICO } from './publico.js?v=__V__';

const normalizar = texto => texto.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/\p{Diacritic}/gu, '').trim();
export async function telaBrasil(el, { estado, param, carregarEu }) {
  const d = await api('/brasil-mundo');
  registrarExpressoes(Object.fromEntries(d.expressoes.flatMap(e => e.equivalentes.map(v => [v.en, v.pt]))));
  const infantil = d.publico.id === 'crianca', professor = estado.eu?.perfil?.papel === 'professor';
  const busca = h('input', { type: 'search', 'aria-label': 'Buscar expressão do Brasil ou do inglês', placeholder: 'Bergamota, churrasco, no cap, um ditado...', value: '' });
  const categoria = h('select', { 'aria-label': 'Tipo de expressão' }, h('option', { value: '' }, 'Todos os temas'), Object.entries(d.categorias).filter(([id]) => d.expressoes.some(e => e.categoria === id)).map(([id, nome]) => h('option', { value: id }, nome)));
  categoria.value = d.expressoes.find(e => e.id === param)?.categoria || (d.publico.id === 'adolescente' && !professor ? 'internet' : 'regional');
  const regiao = h('select', { 'aria-label': 'Destacar exemplos de uma região' }, h('option', { value: '' }, 'Brasil inteiro / não informar'), Object.entries(d.regioes).map(([id, nome]) => h('option', { value: id }, nome)), h('option', { value: 'fora' }, 'Moro fora do Brasil'));
  regiao.value = d.publico.regiao?.id || '';
  const quantidade = h('p', { class: 'ajuda', role: 'status' });
  const lista = h('div', { class: 'cultura-grade' });
  const trilhas = h('section', { class: 'folha cultura-pratica' }, h('h2', {}, 'Pratique em uma aula'), h('p', { class: 'ajuda' }, professor ? 'Estes capítulos também estão no banco de questões para suas turmas.' : 'Leituras e questões para escolher a expressão que combina com a situação.'),
    h('ul', { class: 'lista-simples' }, d.capitulos.map(u => h('li', {}, h('a', { href: '#/biblioteca/' + u.id }, u.titulo), h('small', { class: 'ajuda' }, ` · ${u.nivel}${professor ? ' · ' + NOMES_PUBLICO[u.faixa] : ''}`)))));
  function ficha(e) {
    const capitulo = d.capitulos.find(u => u.cultura.includes(e.id) && (!professor || u.faixa === 'adolescente')) || d.capitulos.find(u => u.cultura.includes(e.id));
    const detalhes = h('details', { open: param === e.id }, h('summary', {}, 'Como usar em inglês'),
      h('p', {}, e.brasil),
      h('div', { class: 'cultura-equivalentes' }, e.equivalentes.map(v => h('section', { class: 'cultura-equivalente' },
        h('div', { class: 'linha-titulo' }, h('h3', { lang: 'en', 'data-traducao': v.pt }, v.en), h('button', { type: 'button', class: 'btn-icone', 'aria-label': 'Ouvir ' + v.en, on: { click: () => falar(v.en, { velocidade: .85 }) } }, icone('speaker-high'))),
        h('p', { class: 'cultura-sentido' }, v.pt), h('p', { class: 'ajuda' }, v.uso),
        h('blockquote', { lang: 'en', 'data-traducao': v.traducao }, v.exemplo), h('p', { class: 'ajuda' }, v.traducao)))),
      h('div', { class: 'cultura-contexto' }, h('strong', {}, 'O contexto faz diferença'), h('p', {}, e.cuidado)),
      capitulo ? h('a', { class: 'btn btn-sec btn-peq', href: '#/biblioteca/' + capitulo.id }, icone('play'), 'Praticar este tema') : null,
      h('details', { class: 'cultura-fontes' }, h('summary', {}, 'Fontes e revisão'), h('p', { class: 'ajuda' }, 'Revisão do conteúdo: ' + e.revisadoEm.split('-').reverse().join('/') + '. As equivalências são explicações de uso, não regras sobre uma região ou uma geração.'), h('ul', {}, e.fontes.map(f => h('li', {}, h('a', { href: f.url, target: '_blank', rel: 'noopener noreferrer' }, f.titulo))))));
    return h('article', { class: 'folha cultura-ficha', id: 'cultura-' + e.id },
      h('div', { class: 'linha-acoes' }, h('span', { class: 'chip c-turquesa' }, d.categorias[e.categoria]), h('span', { class: 'chip' }, e.nivel), regiao.value && e.regioes.includes(regiao.value) ? h('span', { class: 'chip c-sol' }, 'Em destaque: ' + d.regioes[regiao.value]) : null),
      h('h2', {}, e.titulo), h('p', {}, e.resumo), h('p', { class: 'cultura-registro' }, e.registro), detalhes);
  }
  function desenhar() {
    const termo = normalizar(busca.value);
    regiao.hidden = categoria.value === 'internet';
    const destaque = regiao.hidden || !Object.hasOwn(d.regioes, regiao.value) ? '' : regiao.value;
    const expressoes = d.expressoes.filter(e => (!categoria.value || e.categoria === categoria.value) && normalizar([e.titulo, e.resumo, e.brasil, ...e.aliases, ...e.equivalentes.flatMap(v => [v.en, v.pt])].join(' ')).includes(termo));
    // Destaca a região sem esconder outras formas ou atribuir um jeito de falar à pessoa.
    expressoes.sort((a, b) => Number(b.regioes.includes(destaque)) - Number(a.regioes.includes(destaque)));
    quantidade.textContent = `${expressoes.length} ${expressoes.length === 1 ? 'expressão encontrada' : 'expressões encontradas'}. ${destaque ? 'Exemplos da região aparecem primeiro; os outros continuam aqui.' : 'Explore palavras, contextos e jeitos de falar.'}`;
    lista.replaceChildren(...(expressoes.length ? expressoes.map(ficha) : [h('p', { class: 'folha' }, 'Ainda não há uma ficha para essa busca. Tente outro nome ou limpe os filtros. O catálogo mostra equivalências revisadas.') ]));
  }
  busca.addEventListener('input', desenhar); categoria.addEventListener('change', desenhar);
  regiao.addEventListener('change', async () => {
    const anterior = d.publico.regiao?.id || '';
    regiao.disabled = true;
    try { const r = await api('/perfil/regiao', { metodo: 'PUT', corpo: { regiao: regiao.value || null } }); d.publico.regiao = r.publico.regiao; await carregarEu(); desenhar(); toast('Região atualizada no seu perfil.'); }
    catch (e) { regiao.value = anterior; toast(e.message, { tipo: 'erro' }); }
    finally { regiao.disabled = false; }
  });
  el.append(h('nav', { class: 'caminho-volta', 'aria-label': 'Caminho da biblioteca' }, h('a', { href: '#/biblioteca' }, icone('arrow-left'), 'Biblioteca'), h('span', { 'aria-hidden': 'true' }, '/'), h('span', { 'aria-current': 'page' }, 'Do Brasil pro mundo')),
    h('header', { class: 'cabeca c-turquesa' }, h('span', { class: 'bolha' }, icone('chats')), h('div', {}, h('h1', {}, 'Do Brasil pro mundo'), h('p', { class: 'ajuda' }, infantil ? 'Na sua casa, como se fala? Descubra jeitos de contar nossas histórias em inglês.' : 'Seu jeito de falar tem lugar em inglês. Explore equivalências, contextos e diferenças culturais.'))),
    h('p', { class: 'cultura-aviso' }, 'Sua região é opcional e fica no seu perfil. Ela destaca exemplos, sem definir como toda pessoa fala. O inglês também muda entre países e grupos.', !infantil ? ' Gírias mudam com o tempo: reconheça o sentido e escolha quando usar.' : ''),
    h('div', { class: 'biblioteca-filtros' }, busca, categoria, regiao), quantidade, lista, trilhas);
  desenhar();
  if (param) requestAnimationFrame(() => document.getElementById('cultura-' + param)?.scrollIntoView({ block: 'start' }));
}
