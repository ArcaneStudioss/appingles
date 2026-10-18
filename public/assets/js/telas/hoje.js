// Tela principal: saudação, medidores do dia, Lou com o porquê da aula, a aula de hoje (o "pacotinho"),
// quatro atalhos grandes (cada um com a cor da sua atividade) e o álbum de missões.
// Sem vidas e sem "ofensiva" que se perde: os dias do mês só somam.
import { api } from '../api.js?v=__V__';
import { h, icone, dataBR, plural, toast, janela } from '../ui.js?v=__V__';
import { louFala, lou } from '../diversao.js?v=__V__';

const CONQ = { 'primeiro-passo': 'Primeiro passo: teste de nível feito', 'primeira-licao': 'Primeira lição concluída', 'primeira-conversa': 'Primeira conversa', 'primeira-demonstracao': 'Primeira missão demonstrada', retido: 'Missão mantida depois de dias', 'foco-superado': 'Superou uma dificuldade', 'revisoes-50': '50 revisões', material: 'Estudou com material seu', 'licoes-10': '10 lições', 'dias-3': '3 dias de estudo', 'dias-10': '10 dias de estudo', 'dias-30': '30 dias de estudo', 'dias-60': '60 dias de estudo', radio: 'Primeiro episódio da Rádio Lou',
  'seq-3': '3 dias seguidos', 'seq-7': '1 semana seguida', 'seq-14': '2 semanas seguidas', 'seq-30': '30 dias seguidos', 'seq-60': '60 dias seguidos', 'seq-100': '100 dias seguidos', 'seq-200': '200 dias seguidos', 'seq-365': '1 ano seguido' };
export const nomeConquista = c => CONQ[c] || (c.startsWith('volta') ? 'Que bom te ver de volta' : c);

// ---------- álbum: cada missão é uma página; cada parte, uma figurinha; a tarefa final, a figurinha brilhante
export function paginaMissao(m, mi, { iAtual = -1, licaoFeita = false } = {}) {
  const feita = ['demonstrado', 'retido'].includes(m.status);
  const adiante = iAtual >= 0 && mi > iAtual;
  const slots = h('ol', { class: 'figurinhas', 'aria-label': `Figurinhas da missão ${mi + 1}` });
  const explicar = msg => () => toast(msg);
  for (let p = 1; p <= m.total; p++) {
    const colada = feita || m.partes >= p;
    const hoje = m.atual && m.partes + 1 === p;
    const rotulo = `Parte ${p} de ${m.total}: ${colada ? 'feita' : hoje ? 'é a aula de hoje' : 'ainda não'}`;
    slots.append(h('li', {}, hoje
      ? h('a', { class: 'figurinha figurinha--hoje', href: '#/licao', 'aria-label': rotulo }, icone('play'), h('span', { 'aria-hidden': 'true' }, licaoFeita ? 'próxima' : 'hoje'))
      : h('button', { type: 'button', class: 'figurinha' + (colada ? ' figurinha--colada' : ''), 'aria-label': rotulo, on: { click: explicar(colada ? 'Figurinha colada! Esse conteúdo volta nas revisões.' : 'Essa figurinha vem com as próximas aulas. É só seguir a aula de hoje.') } }, colada ? icone('check') : String(p))));
  }
  const finalHoje = m.atual && m.partes >= m.total && !feita;
  const rotFinal = `Tarefa final: ${feita ? (m.status === 'retido' ? 'demonstrada e mantida' : 'demonstrada') : finalHoje ? 'é a de hoje' : 'ainda não'}`;
  slots.append(h('li', {}, finalHoje
    ? h('a', { class: 'figurinha figurinha--final figurinha--hoje', href: '#/licao', 'aria-label': rotFinal }, icone('medal'), h('span', { 'aria-hidden': 'true' }, 'final'))
    : h('button', { type: 'button', class: 'figurinha figurinha--final' + (feita ? ' figurinha--brilho' : ''), 'aria-label': rotFinal, on: { click: explicar(feita ? 'Figurinha brilhante: você fez a tarefa final sozinho. Ela volta num teste em outra situação para confirmar.' : 'A figurinha brilhante sai quando você faz a tarefa final da missão sem ajuda.') } }, icone(feita && m.status === 'retido' ? 'seal-check' : 'medal'))));
  return h('li', { class: 'pagina' + (m.atual ? ' pagina--atual' : '') + (feita ? ' pagina--feita' : '') + (adiante && !m.atual ? ' pagina--adiante' : '') },
    h('p', { class: 'pagina__num' }, `Página ${mi + 1}`),
    feita ? h('span', { class: 'chip chip-ok pagina__selo' }, icone('seal-check'), m.status === 'retido' ? 'Mantida' : 'Completa') : m.atual ? h('span', { class: 'chip c-lilas pagina__selo' }, 'Você está aqui') : null,
    h('h3', {}, m.titulo),
    slots,
    h('p', { class: 'pagina__rodape' }, icone('target'), h('span', {}, `“${m.podeFazer}”`)));
}

export function album(plano, { licaoFeita = false, titulo = 'Seu álbum', classe = '' } = {}) {
  let iAtual = plano.missoes.findIndex(m => m.atual);
  if (iAtual < 0) iAtual = plano.missoes.length;
  const paginas = h('ol', { class: 'album__paginas', tabindex: '0', 'aria-label': 'Páginas do álbum. Deslize para ver as outras.' },
    plano.missoes.map((m, mi) => paginaMissao(m, mi, { iAtual, licaoFeita })),
    h('li', { class: 'album__fim' }, lou('festa', { tamanho: 72, rotulo: 'Fim do álbum' }), h('strong', {}, 'Álbum completo'), h('small', {}, plano.prazo ? `Meta: até ${dataBR(plano.prazo)}` : 'No seu ritmo')));
  // abre o álbum na página atual (sem mexer na rolagem da tela)
  requestAnimationFrame(() => { const atual = paginas.querySelector('.pagina--atual'); if (atual && paginas.scrollWidth > paginas.clientWidth) paginas.scrollLeft = atual.offsetLeft - paginas.offsetLeft - 4; });
  const feitas = plano.missoes.filter(m => ['demonstrado', 'retido'].includes(m.status)).length;
  return h('section', { class: 'album c-lilas ' + classe, 'aria-labelledby': 'album-t' },
    h('div', { class: 'album__topo' }, h('h2', { id: 'album-t' }, h('span', { class: 'bolha bolha--peq' }, icone('book-open-text')), titulo), h('span', { class: 'chip' }, `${feitas} de ${plano.missoes.length} páginas`)),
    paginas,
    h('p', { class: 'album__dica' }, icone('caret-right'), 'Deslize para os lados para ver as páginas. Toque numa figurinha para saber mais.'));
}

// ---------- sequência: pílula no topo + janela que explica (escudos, recorde, próxima figurinha)
const DIA_CURTO = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
function verSequencia(seq, diasNoMes) {
  const semana = h('ol', { class: 'seq-semana', 'aria-label': 'Últimos 7 dias' }, seq.semana.map(d => {
    const dia = DIA_CURTO[new Date(d.data + 'T12:00:00Z').getUTCDay()];
    const rot = { estudou: 'estudou', escudo: 'salvo pelo escudo', hoje: 'hoje, ainda dá tempo', nao: 'sem estudo' }[d.estado];
    return h('li', { class: 'seq-dia seq-dia--' + d.estado, 'aria-label': `${dia}: ${rot}` }, h('span', { class: 'seq-dia__bola' }, d.estado === 'estudou' ? icone('flame') : d.estado === 'escudo' ? icone('shield-check') : null), h('small', {}, dia));
  }));
  janela({ titulo: seq.atual ? `${seq.atual} ${seq.atual === 1 ? 'dia seguido' : 'dias seguidos'}!` : 'Comece sua sequência hoje', corpo: h('div', { class: 'seq-janela' },
    semana,
    h('ul', { class: 'numeros' },
      h('li', {}, h('strong', {}, String(seq.atual)), 'seguidos agora'),
      h('li', {}, h('strong', {}, String(seq.recorde)), 'seu recorde'),
      h('li', {}, h('strong', {}, String(seq.escudos)), seq.escudos === 1 ? 'escudo guardado' : 'escudos guardados'),
      h('li', {}, h('strong', {}, String(diasNoMes)), 'dias neste mês')),
    seq.proximoPremio ? h('p', { class: 'aviso-suave' }, icone('medal'), h('span', {}, `Faltam ${plural(seq.faltam, 'dia', 'dias')} para a figurinha especial de ${seq.proximoPremio} dias.`)) : null,
    h('ul', { class: 'lista-check' },
      h('li', {}, 'Qualquer estudo conta: aula, revisão, conversa ou episódio da Rádio Lou.'),
      h('li', {}, 'A cada 7 dias seguidos você ganha um escudo (guarda até 2). Se faltar um dia, o escudo salva a sequência sozinho.'),
      h('li', {}, 'Se a sequência recomeçar, nada se perde: o recorde e as figurinhas ficam no seu álbum.'))) });
}

// ---------- tela
export async function telaHoje(el, { ir }) {
  const [d, p] = await Promise.all([api('/hoje'), api('/plano').catch(() => null)]);
  if (d.semPlano) return ir('#/plano');
  const pct = Math.min(1, d.meta.feitos / Math.max(1, d.meta.minutos));
  const a = d.assinatura;
  const hora = new Date().getHours();
  const saud = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
  const L = d.licao, feita = L?.status === 'concluida';

  const principal = h('div', { class: 'hoje__col' });
  principal.append(
    h('header', { class: 'saudacao' },
      h('div', {}, h('h1', {}, `${saud}, ${d.nome}!`), h('p', {}, h('a', { href: '#/plano', class: 'objetivo-link' }, icone('target'), ' ', d.objetivo.nome)))),
    h('div', { class: 'status', role: 'list', 'aria-label': 'Seu dia' },
      h('a', { role: 'listitem', class: 'status__item c-sol', href: '#/progresso', 'aria-label': `${d.pontosHoje} pontos hoje` }, icone('sparkle'), h('strong', {}, String(d.pontosHoje)), h('span', {}, 'pontos')),
      h('a', { role: 'listitem', class: 'status__item', href: '#/progresso', 'aria-label': `Meta de hoje: ${d.meta.feitos} de ${d.meta.minutos} minutos` }, h('span', { class: 'anel', style: `--p:${pct.toFixed(3)}` }, h('span', { class: 'anel-cheio' })), h('strong', {}, `${d.meta.feitos}/${d.meta.minutos}`), h('span', {}, 'min')),
      h('button', { type: 'button', role: 'listitem', class: 'status__item status__item--seq c-coral' + (d.sequencia.estudouHoje ? ' acesa' : ''), 'aria-label': `Sequência: ${d.sequencia.atual} dias seguidos${d.sequencia.escudos ? `, ${d.sequencia.escudos} escudos` : ''}. Ver detalhes`, on: { click: () => verSequencia(d.sequencia, d.diasNoMes) } },
        icone('flame'), h('strong', {}, String(d.sequencia.atual)), h('span', {}, 'seguidos'), d.sequencia.escudos ? h('span', { class: 'seq-escudos', 'aria-hidden': 'true' }, icone('shield-check'), String(d.sequencia.escudos)) : null)));

  if (a.status === 'teste' && a.diasRestantes <= 5) principal.append(h('div', { class: 'aviso-suave' }, icone('info'), h('p', {}, `Seu teste grátis termina em ${plural(a.diasRestantes, 'dia', 'dias')} (${dataBR(a.ate)}). Nada é cobrado sozinho. `, h('a', { href: '#/conta' }, 'Ver planos'))));
  if (a.acesso === 'livre') principal.append(h('div', { class: 'aviso-suave' }, icone('info'), h('p', {}, 'Você está no acesso livre: seus cartões e seu progresso continuam aqui. ', h('a', { href: '#/conta' }, 'Voltar ao plano completo'))));

  if (L) {
    principal.append(louFala(feita ? 'feliz' : 'oi', h('p', {}, feita ? 'Aula de hoje feita! Que tal revisar uns cartões ou conversar um pouco?' : (L.porque?.[0] || 'Sua aula de hoje está pronta.'))));
    principal.append(h('section', { class: 'aula' + (feita ? ' aula--feita' : ''), 'aria-labelledby': 'aula-t' },
      feita ? null : h('span', { class: 'aula__pacote', 'aria-hidden': 'true' }, L.missao ? String(L.missao.parte) : '+'),
      h('div', { class: 'aula__topo' }, h('span', { class: 'chip chip-sol' }, icone('clock'), `${L.minutos} min`), feita ? h('span', { class: 'chip' }, icone('check'), 'Feita') : L.missao ? h('span', { class: 'chip' }, `Figurinha ${L.missao.parte} de ${L.missao.total}`) : null),
      h('p', { class: 'rotulo-pequeno' }, 'Aula de hoje'),
      h('h2', { id: 'aula-t' }, L.missao ? L.missao.titulo : 'Manter e ampliar'),
      L.missao ? h('p', { class: 'aula__meta' }, icone('target'), h('span', {}, 'No fim da missão você vai conseguir: ', h('strong', {}, `“${L.missao.podeFazer}”`))) : null,
      feita ? h('a', { class: 'btn btn-sec btn-bloco', href: '#/licao' }, icone('repeat'), 'Rever a aula')
        : h('a', { class: 'btn btn-bloco btn-grande', href: '#/licao' }, icone('play'), L.iniciada ? 'Continuar a aula' : 'Bora começar')));
  }

  // Rádio Lou: o episódio de hoje, feito com os tropeços da pessoa
  if (d.radio && a.acesso === 'completo') {
    const r = d.radio;
    const sub = r.ouvido ? 'Ouvido hoje. Dá para ouvir de novo.' : r.pronto ? `${r.minutos} min · ${r.titulo}` : r.tropecos ? `Feito com ${plural(r.tropecos, 'tropeço seu', 'tropeços seus')} · uns 3 min` : 'Sobre a sua missão · uns 3 min';
    principal.append(h('a', { class: 'radio-card c-rosa' + (r.ouvido ? ' radio-card--ouvido' : ''), href: '#/podcast' },
      h('span', { class: 'radio-card__dupla', 'aria-hidden': 'true' }, lou('feliz', { tamanho: 46, rotulo: '' }), lou('oi', { tamanho: 46, rotulo: '', mia: true })),
      h('span', { class: 'radio-card__txt' }, h('strong', {}, 'Rádio Lou'), h('small', {}, sub)),
      h('span', { class: 'radio-card__play', 'aria-hidden': 'true' }, icone(r.ouvido ? 'check' : 'play'))));
  }

  // atalhos: o próximo passo recomendado ganha o selo "Sugestão do Lou"
  const pr = d.proximo;
  const sugere = pr.acao === 'revisar' || pr.acao === 'conversar' ? pr.acao : null;
  const atalho = (chave, cor, href, ic, titulo, sub, num) => h('a', { class: `atalho c-${cor}`, href },
    h('span', { class: 'bolha' }, icone(ic)), num ? h('span', { class: 'atalho__num', 'aria-hidden': 'true' }, String(num)) : null,
    h('span', {}, h('strong', {}, titulo), h('small', {}, sugere === chave ? 'Sugestão do Lou' : sub)));
  principal.append(h('nav', { class: 'atalhos', 'aria-label': 'Atividades' },
    atalho('revisar', 'sol', '#/revisar', 'cards', 'Revisar', d.revisoesPendentes ? plural(d.revisoesPendentes, 'cartão te esperando', 'cartões te esperando') : 'tudo em dia', d.revisoesPendentes),
    atalho('conversar', 'menta', pr.acao === 'conversar' && pr.cenario ? `#/conversar?c=${pr.cenario}` : '#/conversar', 'chats', 'Conversar', 'treine falando'),
    atalho('material', 'turquesa', '#/material', 'file-text', 'Meu texto', 'estude com o que é seu'),
    atalho('duvidas', 'coral', '#/duvidas', 'question', 'Dúvida', 'pergunte ao tutor')));
  if (pr.acao === 'assinatura') principal.append(h('p', { class: 'aviso-suave' }, icone('info'), h('span', {}, pr.texto, ' ', h('a', { href: '#/conta' }, 'Ver planos'))));
  if (d.novasConquistas?.length) principal.append(h('p', { class: 'conquista-recente' }, h('span', { class: 'medalha medalha--peq' }, icone('medal')), 'Nova figurinha: ', nomeConquista(d.novasConquistas[0])));

  const lado = h('div', { class: 'hoje__col hoje__col--lado' });
  if (p?.plano) lado.append(album(p.plano, { licaoFeita: feita }));
  el.append(h('div', { class: 'hoje' }, principal, lado));
}
