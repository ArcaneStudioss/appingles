// Tela principal: barra de status, Lou com o porquê da aula, a lição do dia, revisões, UM próximo passo
// e a trilha (missões em caminho). Sem vidas e sem "ofensiva" que se perde: os dias do mês só somam.
import { api } from '../api.js?v=__V__';
import { h, icone, dataBR, plural, toast } from '../ui.js?v=__V__';
import { louFala, lou } from '../diversao.js?v=__V__';

const CONQ = { 'primeiro-passo': 'Primeiro passo: teste de nível feito', 'primeira-licao': 'Primeira lição concluída', 'primeira-conversa': 'Primeira conversa', 'primeira-demonstracao': 'Primeira missão demonstrada', retido: 'Missão mantida depois de dias', 'foco-superado': 'Superou uma dificuldade', 'revisoes-50': '50 revisões', material: 'Estudou com material seu', 'licoes-10': '10 lições', 'dias-3': '3 dias de estudo', 'dias-10': '10 dias de estudo', 'dias-30': '30 dias de estudo', 'dias-60': '60 dias de estudo' };
export const nomeConquista = c => CONQ[c] || (c.startsWith('volta') ? 'Que bom te ver de volta' : c);

const DESLOC = [0, 44, 66, 44, 0, -44, -66, -44];

function trilha(plano, licaoFeita) {
  const lista = h('ol', { class: 'caminho', 'aria-label': 'Sua trilha de missões' });
  let k = 0;
  let iAtual = plano.missoes.findIndex(m => m.atual);
  if (iAtual < 0) iAtual = plano.missoes.length;
  plano.missoes.forEach((m, mi) => {
    const feitoMissao = ['demonstrado', 'retido'].includes(m.status);
    const aberta = mi === iAtual || mi === iAtual + 1;     // só a missão atual e a próxima mostram as bolinhas
    lista.append(h('li', { class: 'caminho__missao' + (feitoMissao ? ' feito' : '') + (!aberta && mi > iAtual ? ' adiante' : '') },
      h('div', { class: 'caminho__faixa' }, h('span', {}, `Missão ${mi + 1}`, feitoMissao ? (m.status === 'retido' ? ' · mantida' : ' · demonstrada') : !aberta && mi > iAtual ? ' · mais adiante' : ''), h('strong', {}, m.titulo))));
    if (!aberta) return;
    const nos = [];
    for (let p = 1; p <= m.total; p++) nos.push({ tipo: 'parte', p, feito: m.partes >= p || feitoMissao, atual: m.atual && m.partes + 1 === p });
    nos.push({ tipo: 'trofeu', feito: feitoMissao, retido: m.status === 'retido', atual: m.atual && m.partes >= m.total && !feitoMissao });
    for (const n of nos) {
      const estado = n.feito ? 'feito' : n.atual ? 'atual' : 'bloqueado';
      const rotulo = n.tipo === 'trofeu' ? `${m.titulo}: tarefa final (${n.feito ? (n.retido ? 'demonstrada e mantida' : 'demonstrada') : 'ainda não'})` : `${m.titulo}: parte ${n.p} de ${m.total} (${estado === 'feito' ? 'feita' : estado === 'atual' ? 'é a de hoje' : 'mais adiante'})`;
      const ic = n.tipo === 'trofeu' ? (n.retido ? 'seal-check' : 'medal') : n.feito ? 'check' : n.atual ? 'play' : 'lock-key';
      const no = estado === 'atual'
        ? h('a', { class: `no no--${estado} no--${n.tipo}`, href: '#/licao', 'aria-label': rotulo }, icone(ic), h('span', { class: 'no__balao' }, licaoFeita ? 'Próxima aula' : 'Começar'))
        : h('button', { type: 'button', class: `no no--${estado} no--${n.tipo}`, 'aria-label': rotulo, on: { click: () => toast(estado === 'feito' ? (n.tipo === 'trofeu' ? 'Demonstrada! Ela volta num teste em outra situação para confirmar.' : 'Feita. O conteúdo volta nas revisões e retomadas.') : 'Chegando lá: siga a lição do dia que a trilha avança sozinha.') } }, icone(ic));
      no.style.setProperty('--dx', `${DESLOC[k++ % DESLOC.length]}px`);
      lista.append(h('li', { class: 'caminho__no' }, no));
    }
  });
  lista.append(h('li', { class: 'caminho__fim' }, lou('festa', { tamanho: 84, rotulo: 'Fim da trilha' }), h('p', { class: 'ajuda' }, `Meta: ${plano.prazo ? 'até ' + dataBR(plano.prazo) : 'no seu ritmo'}`)));
  return lista;
}

export async function telaHoje(el, { ir }) {
  const [d, p] = await Promise.all([api('/hoje'), api('/plano').catch(() => null)]);
  if (d.semPlano) return ir('#/plano');
  const pct = Math.min(1, d.meta.feitos / Math.max(1, d.meta.minutos));
  const a = d.assinatura;

  const status = h('div', { class: 'status' },
    h('a', { class: 'status__item', href: '#/progresso', 'aria-label': `${d.diasNoMes} dias de estudo neste mês` }, icone('calendar-plus'), h('strong', {}, String(d.diasNoMes)), h('span', {}, 'dias no mês')),
    h('a', { class: 'status__item status__item--sol', href: '#/progresso', 'aria-label': `${d.pontosHoje} pontos hoje` }, icone('sparkle'), h('strong', {}, String(d.pontosHoje)), h('span', {}, 'pontos hoje')),
    h('a', { class: 'status__item status__item--meta', href: '#/progresso', 'aria-label': `Meta de hoje: ${d.meta.feitos} de ${d.meta.minutos} minutos` }, h('span', { class: 'anel', style: `--p:${pct.toFixed(3)}` }, h('span', { class: 'anel-cheio' })), h('strong', {}, `${d.meta.feitos}/${d.meta.minutos}`), h('span', {}, 'min hoje')));

  const blocos = [status];
  if (a.status === 'teste' && a.diasRestantes <= 5) blocos.push(h('div', { class: 'aviso-suave' }, icone('info'), h('p', {}, `Seu teste grátis termina em ${plural(a.diasRestantes, 'dia', 'dias')} (${dataBR(a.ate)}). Nada é cobrado sozinho. `, h('a', { href: '#/conta' }, 'Ver planos'))));
  if (a.acesso === 'livre') blocos.push(h('div', { class: 'aviso-suave' }, icone('info'), h('p', {}, 'Você está no acesso livre: seus flashcards e seu progresso continuam aqui. ', h('a', { href: '#/conta' }, 'Voltar ao plano completo'))));

  const saud = new Date().getHours() < 12 ? 'Bom dia' : new Date().getHours() < 18 ? 'Boa tarde' : 'Boa noite';
  if (d.licao) {
    const L = d.licao, feita = L.status === 'concluida';
    blocos.push(louFala(feita ? 'feliz' : 'oi', h('p', { class: 'lou-fala__nome' }, `${saud}, ${d.nome}!`), h('p', {}, feita ? 'Lição de hoje feita. Que tal revisar ou conversar um pouco?' : (L.porque?.[0] || 'Sua lição de hoje está pronta.'))));
    blocos.push(h('section', { class: 'licao-dia', 'aria-labelledby': 'licao-t' },
      h('div', { class: 'licao-dia__topo' }, h('span', { class: 'chip chip-sol' }, icone('clock'), `${L.minutos} min`), feita ? h('span', { class: 'chip chip-ok' }, icone('check'), 'Feita') : L.missao ? h('span', { class: 'chip' }, `Parte ${L.missao.parte} de ${L.missao.total}`) : null),
      h('p', { class: 'rotulo-pequeno' }, 'Lição de hoje'),
      h('h2', { id: 'licao-t' }, L.missao ? L.missao.titulo : 'Manter e ampliar'),
      L.missao ? h('p', { class: 'licao-dia__meta' }, `Ao fim da missão: “${L.missao.podeFazer}”`) : null,
      feita ? h('a', { class: 'btn btn-sec btn-bloco', href: '#/licao' }, 'Rever a lição') : h('a', { class: 'btn btn-bloco btn-grande', href: '#/licao' }, L.iniciada ? 'Continuar a lição' : 'Começar a lição')));
  }

  const pr = d.proximo;
  const destino = { licao: '#/licao', revisar: '#/revisar', conversar: pr.cenario ? `#/conversar?c=${pr.cenario}` : '#/conversar', assinatura: '#/conta', descansar: null }[pr.acao];
  blocos.push(h('div', { class: 'duas' },
    h('a', { class: 'atalho atalho--revisao', href: '#/revisar' }, h('span', { class: 'atalho__ico' }, icone('cards')), h('span', {}, h('strong', {}, d.revisoesPendentes ? plural(d.revisoesPendentes, 'cartão para revisar', 'cartões para revisar') : 'Revisões em dia'), h('small', {}, d.revisoesPendentes ? 'antes que você esqueça' : 'nada pendente hoje'))),
    destino && pr.acao !== 'licao' && pr.acao !== 'revisar'
      ? h('a', { class: 'atalho atalho--proximo', href: destino }, h('span', { class: 'atalho__ico' }, icone(pr.acao === 'conversar' ? 'chats' : 'arrow-right')), h('span', {}, h('strong', {}, pr.texto), h('small', {}, 'próximo passo recomendado')))
      : h('a', { class: 'atalho atalho--proximo', href: '#/conversar' }, h('span', { class: 'atalho__ico' }, icone('chats')), h('span', {}, h('strong', {}, 'Conversar'), h('small', {}, 'a conversa de hoje vira a aula de amanhã')))));

  if (d.novasConquistas?.length) blocos.push(h('p', { class: 'conquista-recente' }, h('span', { class: 'medalha medalha--peq' }, icone('medal')), nomeConquista(d.novasConquistas[0])));

  if (p?.plano) blocos.push(h('section', { class: 'trilha-sec', 'aria-labelledby': 'trilha-t' },
    h('div', { class: 'trilha-sec__topo' }, h('h2', { id: 'trilha-t' }, 'Sua trilha'), h('a', { class: 'btn btn-texto btn-peq', href: '#/plano' }, icone('target'), d.objetivo.nome)),
    trilha(p.plano, d.licao?.status === 'concluida')));

  blocos.push(h('nav', { class: 'mais', 'aria-label': 'Outras atividades' },
    h('a', { href: '#/material' }, h('span', { class: 'atalho__ico' }, icone('file-text')), 'Estudar com um texto seu'),
    h('a', { href: '#/duvidas' }, h('span', { class: 'atalho__ico' }, icone('question')), 'Tirar uma dúvida')));
  el.append(...blocos);
}
