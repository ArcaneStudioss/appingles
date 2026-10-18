// Plano: objetivo, meta realista (sem promessa de fluência) e trilha de missões por semana.
import { api } from '../api.js?v=__V__';
import { h, icone, dataBR } from '../ui.js?v=__V__';
import { paginaMissao } from './hoje.js?v=__V__';


export async function telaPlano(el, { estado, ir }) {
  const { plano, nivelamento } = await api('/plano');
  const primeiraVez = !plano.missoes.some(m => m.status !== 'nao_iniciada');
  const semanas = {};
  for (const m of plano.missoes) (semanas[m.semana] ||= []).push(m);
  el.append(
    h('header', { class: 'cabeca c-lilas' }, h('span', { class: 'bolha' }, icone('path')), h('div', {},
      h('p', { class: 'bilhete' }, primeiraVez ? 'Seu plano está pronto!' : 'Seu plano'),
      h('h1', {}, plano.objetivoNome),
      h('p', { class: 'ajuda' }, `Nível de partida: ${plano.nivelInicial} · ${plano.minutosDia} min por dia, ${plano.sessoesPorSemana} dias por semana${plano.prazo ? ' · prazo ' + dataBR(plano.prazo) : ''}`))),
    h('section', { class: 'folha com-margem meta c-sol' },
      h('h2', {}, 'Meta realista'),
      h('p', {}, plano.metaRealista),
      h('ul', { class: 'lista-check' }, plano.metas.map(m => h('li', {}, `“${m}”`))),
      h('p', { class: 'ajuda' }, plano.compromisso),
      plano.avisos.map(a => h('p', { class: 'aviso-suave' }, icone('info'), h('span', {}, a)))),
    h('h2', {}, 'As páginas do seu álbum'),
    (() => { let mi = -1; const iAtual = plano.missoes.findIndex(m => m.atual); return Object.entries(semanas).map(([sem, ms]) => h('section', { class: 'semana' },
      h('h3', {}, icone('calendar-plus'), `Semana ${sem}`),
      h('ol', { class: 'album__paginas' }, ms.map(m => paginaMissao(m, ++mi, { iAtual }))))); })(),
    h('div', { class: 'linha-acoes' },
      h('a', { class: 'btn', href: '#/hoje' }, primeiraVez ? 'Ir para a lição de hoje' : 'Voltar para hoje', icone('arrow-right')),
      h('a', { class: 'btn btn-sec', href: '#/perfil' }, icone('pencil-simple'), 'Mudar objetivo ou rotina')),
    nivelamento ? h('p', { class: 'ajuda' }, `Teste de nível feito em ${dataBR(nivelamento.feito_em)}. `, h('a', { href: '#/nivelamento' }, 'Refazer o teste')) : null);
}
