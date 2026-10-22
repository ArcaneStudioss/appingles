// Tela principal: saudação, medidores do dia, Tuiuiú com o porquê da aula, a aula de hoje (o "pacotinho"),
// quatro atalhos grandes (cada um com a cor da sua atividade) e o álbum de missões.
// Sem vidas e sem "ofensiva" que se perde: os dias do mês só somam.
import { api } from '../api.js?v=__V__';
import { h, icone, dataBR, plural, toast, janela, localStorageGet, localStorageSet } from '../ui.js?v=__V__';
import { lou, louFala } from '../diversao.js?v=__V__';
import { configurarLembrete, lembreteDeHoje, jaPassouDaHora } from '../lembrete.js?v=__V__';

const CONQ = { 'primeira-sessao': 'Minha primeira sessão guiada', 'primeiro-passo': 'Primeiro passo: teste de nível feito', 'primeira-licao': 'Primeira lição concluída', 'primeira-conversa': 'Primeira conversa', 'primeira-demonstracao': 'Primeira missão demonstrada', retido: 'Missão mantida depois de dias', 'foco-superado': 'Superou uma dificuldade', 'revisoes-50': '50 revisões', material: 'Estudou com material seu', 'licoes-10': '10 lições', 'dias-3': '3 dias de estudo', 'dias-10': '10 dias de estudo', 'dias-30': '30 dias de estudo', 'dias-60': '60 dias de estudo', radio: 'Primeiro episódio da Rádio Tuiuiú', 'estudo-1': 'Primeiro assunto do estudo sob medida', 'estudo-completo': 'Estudo sob medida completo', 'simulado-1': 'Primeiro simulado', 'treino-1': 'Primeiro treino focado', 'treino-7': '7 treinos focados',
  'seq-3': '3 dias seguidos', 'seq-7': '1 semana seguida', 'seq-14': '2 semanas seguidas', 'seq-30': '30 dias seguidos', 'seq-60': '60 dias seguidos', 'seq-100': '100 dias seguidos', 'seq-200': '200 dias seguidos', 'seq-365': '1 ano seguido' };
export const nomeConquista = c => CONQ[c] || (c.startsWith('passaporte:') ? 'Passaporte cultural: missão concluída' : null) || (c.startsWith('volta') ? 'Que bom te ver de volta' : c);

// ---------- álbum: cada missão é uma página; cada parte, uma figurinha; a tarefa final, a figurinha brilhante
export function paginaMissao(m, mi, { iAtual = -1, licaoFeita = false } = {}) {
  const infantil = document.body.dataset.publico === 'crianca';
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
    h('p', { class: 'pagina__num' }, `${infantil ? 'Página' : 'Etapa'} ${mi + 1}`),
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
    h('div', { class: 'album__topo' }, h('h2', { id: 'album-t' }, h('span', { class: 'bolha bolha--peq' }, icone('book-open-text')), document.body.dataset.publico === 'crianca' ? titulo : 'Sua trilha de aprendizagem'), h('span', { class: 'chip' }, `${feitas} de ${plano.missoes.length} etapas`)),
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
      h('li', {}, 'Qualquer estudo conta: aula, revisão, conversa ou episódio da Rádio Tuiuiú.'),
      h('li', {}, 'A cada 7 dias seguidos você ganha um escudo (guarda até 2). Se faltar um dia, o escudo salva a sequência sozinho.'),
      h('li', {}, 'Se a sequência recomeçar, nada se perde: o recorde e as figurinhas ficam no seu álbum.'))) });
}

// ---------- tela
export async function telaHoje(el, { ir, estado }) {
  const [d, p, ss] = await Promise.all([api('/hoje'), api('/plano').catch(() => null), api('/sessao').catch(() => ({sessao:null}))]);
  if (d.semPlano) return ir('#/plano');
  const a = d.assinatura;
  const hora = new Date().getHours();
  const saud = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
  const L = d.licao, feita = L?.status === 'concluida';
  const iniciante = !!L?.guiada || estado?.eu?.perfil?.objetivo === 'zero';
  const infantil = estado?.eu?.publico?.id === 'crianca';

  // Tela enxuta, pensada para uma criança: Tuiuiú + saudação, UM cartão grande com a aula, e atalhos só com ícone e nome.
  // O que é detalhe (meta em minutos, "no fim você vai conseguir", sob medida, dúvidas) fica nas outras telas.
  const principal = h('div', { class: 'hoje__col' });
  principal.append(
    h('header', { class: 'saudacao' },
      lou(feita ? 'feliz' : 'oi', { tamanho: 64 }),
      h('h1', {}, `${saud}, ${d.nome}!`),
      h('button', { type: 'button', class: 'status__item status__item--seq c-coral' + (d.sequencia.estudouHoje ? ' acesa' : ''), 'aria-label': `Sequência: ${d.sequencia.atual} dias seguidos. Ver detalhes`, on: { click: () => verSequencia(d.sequencia, d.diasNoMes) } },
        icone('flame'), h('strong', {}, String(d.sequencia.atual)))));

  if (a.acesso === 'completo') {
    const tempos = h('div', { class: 'linha-acoes' });
    for (const minutos of [5, 10, 20]) tempos.append(h('button', { type: 'button', class: 'btn btn-sec', on: { click: async e => {
      const b = e.currentTarget; b.disabled = true;
      try { await api('/sessao', { metodo: 'POST', corpo: { minutos } }); ir('#/sessao'); }
      catch (err) { toast(err.message, { tipo: 'erro' }); b.disabled = false; }
    } } }, `${minutos} minutos`));
    const salva=ss.sessao, iniciada=salva&&Object.keys(salva.respondidos).length>0;
    principal.append(h('section', { class: 'folha sessao-convite c-azul' }, h('h2', {}, salva?.concluida ? 'Seu treino de hoje está salvo!' : iniciada ? 'Vamos continuar de onde parou?' : 'Quanto tempo você tem hoje?'), h('p', {}, L?.missao?.podeFazer || 'Exemplos, prática e revisão no seu ritmo.'), h('p', {class:'ajuda'}, 'Pode pedir ajuda e sair quando precisar. O progresso fica salvo.'), salva?.concluida || iniciada ? h('a',{class:'btn btn-bloco',href:'#/sessao'},salva.concluida?'Rever minha sessão':'Continuar minha sessão') : tempos));
  }

  if (a.status === 'teste' && a.diasRestantes <= 5) principal.append(h('div', { class: 'aviso-suave' }, icone('info'), h('p', {}, `Seu teste grátis termina em ${plural(a.diasRestantes, 'dia', 'dias')} (${dataBR(a.ate)}). Nada é cobrado sozinho. `, h('a', { href: '#/conta' }, 'Ver planos'))));
  if (a.acesso === 'livre') principal.append(h('div', { class: 'aviso-suave' }, icone('info'), h('p', {}, 'Você está no acesso livre: seus cartões e seu progresso continuam aqui. ', h('a', { href: '#/conta' }, 'Voltar ao plano completo'))));

  // lembrete diário: convite (uma vez, dá para dispensar) ou, no horário combinado, o chamado para o exercício do dia
  const lem = estado?.eu?.perfil?.lembrete;
  if (lem && !lem.ativo && localStorageGet('lembrete-dispensado') !== 'sim' && a.acesso === 'completo') {
    const caixa = h('div', { class: 'aviso-suave aviso-lembrete' }, icone('bell'), h('p', {}, 'Quer um lembrete para fazer o exercício todo dia? Escolha o horário e o Tuiuiú te chama.'),
      h('div', { class: 'linha-acoes' },
        h('button', { type: 'button', class: 'btn btn-sec btn-peq', on: { click: () => configurarLembrete(lem, { aoSalvar: novo => { estado.eu.perfil.lembrete = novo; caixa.remove(); } }) } }, 'Escolher horário'),
        h('button', { type: 'button', class: 'btn btn-texto btn-peq', on: { click: () => { localStorageSet('lembrete-dispensado', 'sim'); caixa.remove(); } } }, 'Agora não')));
    principal.append(caixa);
  } else if (lem && lembreteDeHoje(lem) && jaPassouDaHora(lem) && !d.sequencia.estudouHoje && !feita && a.acesso === 'completo') {
    principal.append(h('div', { class: 'aviso-suave aviso-lembrete' }, icone('bell'), h('p', {}, `Hora do exercício de hoje! Seu lembrete era às ${lem.hora}. Uns minutinhos já contam.`),
      h('a', { class: 'btn btn-peq', href: '#/licao' }, L?.iniciada ? 'Continuar a aula' : 'Começar agora')));
  }

  let balao = null;
  if (L) {
    balao = louFala(feita ? 'feliz' : 'oi', h('p', {}, iniciante ? (feita ? 'Aula concluída. Você pode rever as palavras ou explorar um capítulo da biblioteca.' : infantil ? 'Eu ajudo você! Ouça as palavras e descubra o significado. Depois vamos brincar de responder.' : 'Comece com as expressões da aula. Há áudio, tradução e explicações para estudar com autonomia.') : feita ? 'Aula de hoje feita! Que tal revisar uns cartões ou conversar um pouco?' : (L.porque?.[0] || 'Sua aula de hoje está pronta.')));
    principal.append(h('section', { class: 'aula' + (feita ? ' aula--feita' : ''), 'aria-labelledby': 'aula-t' },
      feita ? null : h('span', { class: 'aula__pacote', 'aria-hidden': 'true' }, L.missao ? String(L.missao.parte) : '+'),
      h('div', { class: 'aula__topo' }, h('span', { class: 'chip chip-sol' }, icone('clock'), `${L.minutos} min`), feita ? h('span', { class: 'chip' }, icone('check'), 'Feita') : L.missao ? h('span', { class: 'chip' }, `Figurinha ${L.missao.parte} de ${L.missao.total}`) : null),
      h('p', { class: 'rotulo-pequeno' }, 'Aula de hoje'),
      h('h2', { id: 'aula-t' }, L.missao ? L.missao.titulo : 'Manter e ampliar'),
      iniciante ? h('p', { class: 'aula__meta' }, infantil ? 'Áudio, tradução e jogos curtinhos. Uma palavra de cada vez.' : 'Expressões essenciais, áudio, tradução e prática com explicações.') : null,
      L.missao ? h('p', { class: 'aula__meta' }, icone('target'), h('span', {}, 'No fim da missão você vai conseguir: ', h('strong', {}, `“${L.missao.podeFazer}”`))) : null,
      feita ? h('a', { class: 'btn btn-sec btn-bloco', href: '#/licao' }, icone('repeat'), 'Rever a aula')
        : h('a', { class: 'btn btn-bloco btn-grande', href: '#/licao' }, icone('play'), L.iniciada ? 'Continuar a aula' : 'Começar minha aula')));
  }

  // Treino focado: 100% nas dificuldades da pessoa (sem dificuldade registrada ainda, o cartão leva ao "Meu jeito de aprender")
  if (d.treino && a.acesso === 'completo') {
    const t = d.treino, pronto = t.pronto || t.tags.length;
    principal.append(h('a', { class: 'treino-card c-limao' + (t.concluido ? ' treino-card--feito' : ''), href: pronto ? '#/treino' : '#/aprender' },
      h('span', { class: 'bolha' }, icone(pronto ? 'target' : 'compass')),
      h('span', { class: 'treino-card__txt' }, h('strong', {}, t.concluido ? 'Treino de hoje feito' : pronto ? 'Meu treino de hoje' : 'Meu jeito de aprender'),
        h('small', {}, t.concluido ? 'Quer mais um? Dá para fazer outro.' : pronto ? (t.tags.length ? `Foco: ${t.tags.join('; ').toLowerCase()}${t.quantos ? ` · ${t.quantos} perguntas` : ''}` : `${t.quantos} perguntas só para você`) : 'veja como você aprende, pelos seus acertos')),
      h('span', { class: 'radio-card__play', 'aria-hidden': 'true' }, icone(t.concluido ? 'check' : 'play'))));
  }

  // Turma: atividades do professor esperando o aluno (só aparece para quem está em alguma turma)
  if (d.turmas) {
    const t = d.turmas;
    principal.append(h('a', { class: 'treino-card turma-atalho c-lilas', href: '#/turmas' },
      h('span', { class: 'bolha' }, icone('users-three')),
      h('span', { class: 'treino-card__txt' }, h('strong', {}, t.pendentes ? plural(t.pendentes, 'atividade da turma', 'atividades da turma') : 'Turma em dia'),
        h('small', {}, t.pendentes && t.proxima ? `${t.proxima.titulo}${t.proxima.prazo ? ' · até ' + dataBR(t.proxima.prazo) : ''}` : 'Nenhuma atividade esperando')),
      h('span', { class: 'radio-card__play', 'aria-hidden': 'true' }, icone(t.pendentes ? 'play' : 'check'))));
  }

  // Rádio Tuiuiú: o episódio de hoje, feito com os tropeços da pessoa
  if (d.radio && a.acesso === 'completo') {
    const r = d.radio;
    const sub = r.ouvido ? 'Ouvido hoje. Dá para ouvir de novo.' : r.pronto ? `${r.minutos} min · ${r.titulo}` : r.tropecos ? `Feito com ${plural(r.tropecos, 'tropeço seu', 'tropeços seus')} · uns 3 min` : 'Sobre a sua missão · uns 3 min';
    principal.append(h('a', { class: 'radio-card c-rosa' + (r.ouvido ? ' radio-card--ouvido' : ''), href: '#/podcast' },
      h('span', { class: 'radio-card__dupla', 'aria-hidden': 'true' }, lou('feliz', { tamanho: 46, rotulo: '' }), lou('oi', { tamanho: 46, rotulo: '', mia: true })),
      h('span', { class: 'radio-card__txt' }, h('strong', {}, 'Rádio Tuiuiú'), h('small', {}, sub)),
      h('span', { class: 'radio-card__play', 'aria-hidden': 'true' }, icone(r.ouvido ? 'check' : 'play'))));
  }

  // atalhos: o próximo passo recomendado ganha o selo "Sugestão do Tuiuiú"
  const pr = d.proximo;
  const sugere = pr.acao === 'revisar' || pr.acao === 'conversar' ? pr.acao : null;
  const atalho = (chave, cor, href, ic, titulo, num) => h('a', { class: `atalho c-${cor}` + (sugere === chave || num ? ' atalho--vivo' : ''), href },
    h('span', { class: 'bolha' }, icone(ic)), num ? h('span', { class: 'atalho__num', 'aria-hidden': 'true' }, String(num)) : null,
    h('strong', {}, titulo));
  const completo = a.acesso === 'completo';
  const treinoPronto = d.treino && completo ? (d.treino.pronto || d.treino.tags.length) : false;
  principal.append(h('nav', { class: 'atalhos', 'aria-label': 'Atividades' },
    atalho('revisar', 'sol', '#/revisar', 'cards', 'Revisar', d.revisoesPendentes),
    atalho('conversar', 'menta', pr.acao === 'conversar' && pr.cenario ? `#/conversar?c=${pr.cenario}` : '#/conversar', 'chats', 'Conversar'),
    d.turmas ? atalho('turma', 'lilas', '#/turmas', 'users-three', 'Turma', d.turmas.pendentes) : null,
    d.radio && completo ? atalho('radio', 'rosa', '#/podcast', 'headphones', 'Rádio Tuiuiú') : null,
    d.treino && completo ? atalho('treino', 'limao', treinoPronto ? '#/treino' : '#/aprender', treinoPronto ? 'target' : 'compass', treinoPronto ? 'Meu treino' : 'Meu jeito') : null));
  if (pr.acao === 'assinatura') principal.append(h('p', { class: 'aviso-suave' }, icone('info'), h('span', {}, pr.texto, ' ', h('a', { href: '#/conta' }, 'Ver planos'))));
  principal.append(h('a', { class: 'treino-card c-lilas social-convite', href: '#/desafios' }, h('span', { class: 'bolha' }, icone('users-three')), h('span', { class: 'treino-card__txt' }, h('strong', {}, 'Desafios com amigos'), h('small', {}, d.economia ? `${d.economia.xp} XP · ${d.economia.moedas} moedas · metas e figurinhas` : 'Figurinhas, metas em grupo, XP e moedas')), icone('caret-right')));
  if (d.novasConquistas?.length) principal.append(h('p', { class: 'conquista-recente' }, h('span', { class: 'medalha medalha--peq' }, icone('medal')), 'Nova figurinha: ', nomeConquista(d.novasConquistas[0])));

  // A aula e as atividades da turma são os próximos passos. As outras opções aparecem sob demanda.
  const aulaEl = principal.querySelector('.aula'), statusEl = principal.querySelector('.status');
  const sessaoEl=principal.querySelector('.sessao-convite');
  if (sessaoEl) {
    principal.querySelector('.saudacao').after(sessaoEl);
    if(aulaEl) sessaoEl.after(h('details',{class:'outras-atividades'},h('summary',{},icone('path'),'Continuar minha missão'),aulaEl,balao));
    const turmaEl=principal.querySelector('.turma-atalho');if(turmaEl)sessaoEl.after(turmaEl);
  } else if (aulaEl) {
    principal.querySelector('.saudacao').after(aulaEl, ...[balao, principal.querySelector('.turma-atalho')].filter(Boolean));
  }

  const lado = h('div', { class: 'hoje__col hoje__col--lado' });
  const extras = [...principal.querySelectorAll('.treino-card:not(.turma-atalho):not(.social-convite),.radio-card,.atalhos,.aviso-lembrete')];
  if (iniciante && statusEl) extras.unshift(statusEl);
  principal.append(h('details', { class: 'outras-atividades' }, h('summary', {}, icone('dots-three'), iniciante ? 'Outras atividades e meu progresso' : 'Mais maneiras de praticar'), h('div', { class: 'outras-atividades__conteudo' }, extras)));
  if (p?.plano) lado.append(h('details', { class: 'outras-atividades' }, h('summary', {}, icone('path'), 'Meu caminho de aprendizagem'), album(p.plano, { licaoFeita: feita })));
  el.append(h('div', { class: 'hoje' + (iniciante ? ' hoje--guiada' : '') }, principal, lado));
}
