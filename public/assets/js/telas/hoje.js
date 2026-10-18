// Tela principal: lição do dia, revisões pendentes e UM próximo passo. Nada além disso em destaque.
import { api } from '../api.js?v=__V__';
import { h, icone, dataBR, plural } from '../ui.js?v=__V__';

const CONQ = { 'primeiro-passo': 'Primeiro passo: teste de nível feito', 'primeira-licao': 'Primeira lição concluída', 'primeira-conversa': 'Primeira conversa', 'primeira-demonstracao': 'Primeira missão demonstrada', retido: 'Missão mantida depois de dias', 'foco-superado': 'Superou uma dificuldade', 'revisoes-50': '50 revisões', material: 'Estudou com material seu', 'licoes-10': '10 lições', 'dias-3': '3 dias de estudo', 'dias-10': '10 dias de estudo', 'dias-30': '30 dias de estudo', 'dias-60': '60 dias de estudo' };
export const nomeConquista = c => CONQ[c] || (c.startsWith('volta') ? 'Que bom te ver de volta' : c);

export async function telaHoje(el, { ir }) {
  const d = await api('/hoje');
  if (d.semPlano) return ir('#/plano');
  const saudacao = new Date().getHours() < 12 ? 'Bom dia' : new Date().getHours() < 18 ? 'Boa tarde' : 'Boa noite';
  const pct = Math.min(1, d.meta.feitos / Math.max(1, d.meta.minutos));
  const anel = h('div', { class: 'anel', role: 'img', 'aria-label': `Meta de hoje: ${d.meta.feitos} de ${d.meta.minutos} minutos` }, h('span', { class: 'anel-cheio', style: `--p:${pct.toFixed(3)}` }), h('span', { class: 'anel-num' }, `${d.meta.feitos}`, h('small', {}, `/${d.meta.minutos} min`)));

  const blocos = [];
  // aviso do teste (só perto do fim, sem alarde)
  const a = d.assinatura;
  if (a.status === 'teste' && a.diasRestantes <= 5) blocos.push(h('div', { class: 'aviso-suave' }, icone('info'), h('p', {}, `Seu teste grátis termina em ${plural(a.diasRestantes, 'dia', 'dias')} (${dataBR(a.ate)}). Nada é cobrado sozinho. `, h('a', { href: '#/conta' }, 'Ver planos'))));
  if (a.acesso === 'livre') blocos.push(h('div', { class: 'aviso-suave' }, icone('info'), h('p', {}, 'Você está no acesso livre: seus flashcards e seu progresso continuam aqui. ', h('a', { href: '#/conta' }, 'Voltar ao plano completo'))));

  // 1. lição do dia
  if (d.licao) {
    const L = d.licao;
    const feita = L.status === 'concluida';
    blocos.push(h('section', { class: 'folha licao-dia', 'aria-labelledby': 'licao-t' },
      h('div', { class: 'licao-dia__topo' }, h('span', { class: 'chip' }, icone('clock'), `${L.minutos} min`), feita ? h('span', { class: 'chip chip-ok' }, icone('check'), 'Feita') : null),
      h('p', { class: 'rotulo-pequeno' }, 'Lição de hoje'),
      h('h2', { id: 'licao-t' }, L.missao ? L.missao.titulo : 'Manter e ampliar'),
      L.missao ? h('p', { class: 'ajuda' }, `Parte ${L.missao.parte} de ${L.missao.total} · ${L.missao.podeFazer}`) : null,
      L.porque?.[0] ? h('p', { class: 'bilhete porque' }, L.porque[0]) : null,
      feita ? h('a', { class: 'btn btn-sec', href: '#/licao' }, 'Rever a lição') : h('a', { class: 'btn btn-bloco', href: '#/licao' }, L.iniciada ? 'Continuar a lição' : 'Começar a lição', icone('arrow-right'))));
  }

  // 2. revisões + meta (lado a lado no PC)
  blocos.push(h('div', { class: 'duas' },
    h('section', { class: 'folha cartao-revisao' },
      h('div', {}, h('p', { class: 'rotulo-pequeno' }, 'Revisões'), h('p', { class: 'numero' }, String(d.revisoesPendentes)), h('p', { class: 'ajuda' }, d.revisoesPendentes ? 'cartões esperando por você' : 'nada pendente hoje')),
      d.revisoesPendentes ? h('a', { class: 'btn btn-sec', href: '#/revisar' }, icone('cards'), 'Revisar') : null),
    h('section', { class: 'folha cartao-meta' }, anel, h('div', {}, h('p', { class: 'rotulo-pequeno' }, 'Meta de hoje'), h('p', { class: 'ajuda' }, pct >= 1 ? 'Meta cumprida. Qualquer coisa a mais é bônus.' : 'Sem pressão: o que der hoje já conta.')))));

  // 3. próximo passo (um só)
  const p = d.proximo;
  const destino = { licao: '#/licao', revisar: '#/revisar', conversar: p.cenario ? `#/conversar?c=${p.cenario}` : '#/conversar', assinatura: '#/conta', descansar: null }[p.acao];
  blocos.push(h('section', { class: 'proximo' }, h('p', { class: 'rotulo-pequeno' }, 'Próximo passo recomendado'),
    destino ? h('a', { class: 'proximo__link', href: destino }, h('span', {}, p.texto), icone('arrow-right')) : h('p', { class: 'proximo__link' }, p.texto)));

  if (d.foco && d.licao?.status === 'concluida') blocos.push(h('p', { class: 'ajuda margem-nota' }, icone('note-pencil'), ` Anotado para a próxima aula: ${d.foco.nome.toLowerCase()} (apareceu ${d.foco.origem === 'conversa' ? 'numa conversa' : d.foco.origem === 'nivelamento' ? 'no teste de nível' : 'num texto seu'}).`));
  if (d.novasConquistas?.length) blocos.push(h('p', { class: 'conquista-recente' }, icone('medal'), ' ', nomeConquista(d.novasConquistas[0])));

  el.append(
    h('header', { class: 'cabeca' }, h('p', { class: 'bilhete' }, `${saudacao}, ${d.nome}.`), h('a', { class: 'objetivo-link', href: '#/plano' }, icone('target'), d.objetivo.nome, d.objetivo.prazo ? ` · até ${dataBR(d.objetivo.prazo)}` : '')),
    ...blocos,
    h('nav', { class: 'mais', 'aria-label': 'Outras atividades' },
      h('a', { href: '#/material' }, icone('file-text'), 'Estudar com um texto seu'),
      h('a', { href: '#/duvidas' }, icone('question'), 'Tirar uma dúvida'),
      h('a', { href: '#/plano' }, icone('path'), 'Ver meu plano')));
}
