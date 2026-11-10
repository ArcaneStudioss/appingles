// Tela principal: saudação com dias de voo e nível, UM cartão de destaque (o treino ou a aula do dia),
// atalhos em grade ("quando sobrar um tempinho"), linhas curtas (missão, turma, desafios) e o álbum de missões.
// Sem vidas e sem "ofensiva" que se perde: os dias do mês só somam.
import { penaMini } from '../penas.js?v=__V__';
import { api } from '../api.js?v=__V__';
import { h, icone, dataBR, plural, toast, janela, localStorageGet, localStorageSet } from '../ui.js?v=__V__';
import { lou, louFala, reagirCanto } from '../diversao.js?v=__V__';
import { configurarLembrete, lembreteDeHoje, jaPassouDaHora } from '../lembrete.js?v=__V__';
import { jaInstalado, instalarOuGuiar, podeInstalarDireto, ehIphone } from '../instalar.js?v=__V__';

const CONQ = { 'primeira-sessao': 'Minha primeira sessão guiada', 'primeiro-passo': 'Primeiro passo dado', 'primeira-licao': 'Primeira lição concluída', 'primeira-conversa': 'Primeira conversa', 'primeira-demonstracao': 'Primeira missão demonstrada', retido: 'Missão mantida depois de dias', 'foco-superado': 'Superou uma dificuldade', 'revisoes-50': '50 revisões', material: 'Estudou com material seu', 'licoes-10': '10 lições', 'dias-3': '3 dias de estudo', 'dias-10': '10 dias de estudo', 'dias-30': '30 dias de estudo', 'dias-60': '60 dias de estudo', radio: 'Primeiro episódio da Rádio Tuiuiú', 'estudo-1': 'Primeiro assunto do estudo sob medida', 'estudo-completo': 'Estudo sob medida completo', 'simulado-1': 'Primeiro simulado', 'treino-1': 'Primeiro treino focado', 'treino-7': '7 treinos focados',
  'seq-3': '3 dias seguidos', 'seq-7': '1 semana seguida', 'seq-14': '2 semanas seguidas', 'seq-30': '30 dias seguidos', 'seq-60': '60 dias seguidos', 'seq-100': '100 dias seguidos', 'seq-200': '200 dias seguidos', 'seq-365': '1 ano seguido' };
export const nomeConquista = c => CONQ[c] || (c.startsWith('passaporte:') ? 'Passaporte cultural: missão concluída' : null) || (c.startsWith('volta') ? 'Que bom te ver de volta' : c.startsWith('fig-') ? 'Figurinha do Brasil, veja em Meu álbum' : c);

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
    return h('li', { class: 'seq-dia seq-dia--' + d.estado, 'aria-label': `${dia}: ${rot}` }, h('span', { class: 'seq-dia__bola' }, d.estado === 'estudou' ? penaMini() : d.estado === 'escudo' ? icone('shield-check') : null), h('small', {}, dia));
  }));
  janela({ titulo: seq.atual ? `${seq.atual} ${seq.atual === 1 ? 'dia de voo' : 'dias de voo seguidos'}!` : 'Ganhe sua primeira pena hoje', corpo: h('div', { class: 'seq-janela' },
    semana,
    h('ul', { class: 'numeros' },
      h('li', {}, h('strong', {}, String(seq.atual)), 'seguidos agora'),
      h('li', {}, h('strong', {}, String(seq.recorde)), 'seu recorde'),
      h('li', {}, h('strong', {}, String(seq.escudos)), seq.escudos === 1 ? 'escudo guardado' : 'escudos guardados'),
      h('li', {}, h('strong', {}, String(diasNoMes)), 'dias neste mês')),
    seq.proximoPremio ? h('p', { class: 'aviso-suave' }, icone('medal'), h('span', {}, `Faltam ${plural(seq.faltam, 'dia', 'dias')} para a figurinha especial de ${seq.proximoPremio} dias.`)) : null,
    h('ul', { class: 'lista-check' },
      h('li', {}, 'Cada dia de estudo rende uma pena azul do Tuiuiú. Qualquer estudo conta: aula, revisão, conversa ou episódio da Rádio Tuiuiú.'),
      h('li', {}, 'A cada 7 dias seguidos você ganha um escudo (guarda até 2). Se faltar um dia, o escudo cobre e seus dias de voo continuam.'),
      h('li', {}, 'Se os dias de voo recomeçarem, nada se perde: o recorde e as figurinhas ficam no seu álbum.'))) });
}

// O app ajustou o nível sozinho? Avisa com o motivo e deixa desfazer. Nível certo mas com erros? Convida a reforçar.
function avisosDeNivel(destino, nivel) {
  const a = nivel?.ajuste;
  const recente = a && a.origem === 'auto' && !a.desfez && Date.now() - new Date(a.em) < 7 * 864e5;
  if (recente && localStorageGet('nivel-visto') !== a.em) {
    const motivo = a.motivo === 'facil' ? 'estava fácil: você acertou bastante, quase sem ajuda' : `estava puxado: o acerto ficou em ${Math.round((a.taxa || 0) * 100)}%`;
    const caixa = h('div', { class: 'aviso-suave nivel-aviso' }, icone('chart-line-up'), h('p', {}, `Ajustei seu nível de ${a.de} para ${a.para}, porque o último trecho ${motivo}.`),
      h('div', { class: 'linha-acoes' },
        h('button', { type: 'button', class: 'btn btn-sec btn-peq', on: { click: async e => { e.currentTarget.disabled = true; try { await api('/nivel/desfazer', { metodo: 'POST' }); location.reload(); } catch (err) { toast(err.message, { tipo: 'erro' }); e.currentTarget.disabled = false; } } } }, 'Voltar para ' + a.de),
        h('button', { type: 'button', class: 'btn btn-texto btn-peq', on: { click: () => { localStorageSet('nivel-visto', a.em); caixa.remove(); } } }, 'Entendi')));
    destino.append(caixa);
  } else if (nivel?.avaliacao?.reforcar) {
    destino.append(h('a', { class: 'aviso-suave nivel-aviso nivel-aviso--reforco', href: '#/treino' }, icone('target'), h('p', {}, 'Seu nível está certo, mas ainda há erros para firmar. Que tal um treino só com o que você errou?'), icone('caret-right')));
  }
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

  // Visual "caderno limpo": UMA ação principal (o cartão azul de destaque), atalhos em grade e o resto em linhas curtas.
  const principal = h('div', { class: 'hoje__col' });
  const completo = a.acesso === 'completo';
  const dataHoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  principal.append(
    h('header', { class: 'saudacao' },
      h('span', { class: 'saudacao__lou', 'aria-hidden': 'true' }, lou(feita ? 'feliz' : 'oi', { tamanho: 48, rotulo: '' })),
      h('div', { class: 'saudacao__txt' }, h('p', { class: 'saudacao__data' }, dataHoje.charAt(0).toUpperCase() + dataHoje.slice(1)), h('h1', {}, `${saud}, ${d.nome}!`)),
      completo || d.nivel?.atual ? h('div', { class: 'saudacao__status' },
        // a pena aparece desde o primeiro dia (ainda sem cor): é o convite para começar os dias de voo
        completo ? h('button', { type: 'button', class: 'status__item status__item--seq' + (d.sequencia.estudouHoje ? ' acesa' : ''), 'aria-label': d.sequencia.atual ? `Dias de voo: ${d.sequencia.atual} seguidos. Ver detalhes` : 'Seus dias de voo ainda não começaram. Ver como funciona', on: { click: () => verSequencia(d.sequencia, d.diasNoMes) } },
          penaMini({ acesa: d.sequencia.estudouHoje }), h('strong', {}, String(d.sequencia.atual))) : null,
        d.nivel?.atual ? h('a', { class: 'status__nivel', href: '#/nivel', 'aria-label': `Meu nível: ${d.nivel.atual}. Ver ou ajustar` }, d.nivel.atual) : null) : null));
  const metaDias = estado?.eu?.perfil?.dias_semana, feitosSemana = d.sequencia.semana.filter(x => x.estado === 'estudou' || x.estado === 'escudo').length;
  if (metaDias && (d.sequencia.atual || d.sequencia.recorde)) principal.append(h('p', { class: 'ajuda meta-semana' }, feitosSemana >= metaDias ? `Meta da semana cumprida: ${feitosSemana} dias de estudo nos últimos 7. Parabéns!` : `Meta da semana: ${feitosSemana} de ${metaDias} dias de estudo nos últimos 7.`));
  avisosDeNivel(principal, d.nivel);

  // ---------- o destaque: a sessão do dia (plano completo) ou a aula
  const salva = ss.sessao, iniciada = salva && Object.keys(salva.respondidos).length > 0;
  const progressoAula = L?.missao ? h('div', { class: 'destaque__passos', role: 'img', 'aria-label': `Parte ${L.missao.parte} de ${L.missao.total} da missão` },
    Array.from({ length: L.missao.total }, (_, k) => h('span', { class: k < (feita ? L.missao.parte : L.missao.parte - 1) ? 'feito' : '' })),
    h('small', { 'aria-hidden': 'true' }, `${L.missao.parte} de ${L.missao.total}`)) : null;
  let destaque = null, aulaComoLinha = false;
  if (completo) {
    const tempos = h('div', { class: 'destaque__tempos' });
    const meta = estado?.eu?.perfil?.minutos_dia, recomendado = iniciante ? 5 : [5, 10, 20].reduce((m, x) => Math.abs(x - (meta || 10)) < Math.abs(m - (meta || 10)) ? x : m);
    for (const minutos of [5, 10, 20]) tempos.append(h('button', { type: 'button', class: minutos === recomendado ? 'btn btn-sol' : 'btn btn-vidro', 'aria-description': minutos === recomendado ? 'Tempo recomendado' : null, on: { click: async e => {
      const b = e.currentTarget; b.disabled = true;
      try { await api('/sessao', { metodo: 'POST', corpo: { minutos } }); ir('#/sessao'); }
      catch (err) { toast(err.message, { tipo: 'erro' }); b.disabled = false; }
    } } }, h('span', { 'aria-label': `${minutos} minutos` }, `${minutos} min`), minutos === recomendado ? h('small', { class: 'tempo-rec', 'aria-hidden': 'true' }, 'recomendado') : null));
    destaque = h('section', { class: 'destaque sessao-convite', 'aria-labelledby': 'destaque-t' },
      h('p', { class: 'destaque__rotulo' }, salva?.concluida ? 'Feito hoje' : 'Treino de hoje'),
      h('h2', { id: 'destaque-t' }, salva?.concluida ? 'Seu treino de hoje está salvo!' : iniciada ? 'Vamos continuar de onde parou?' : 'Quanto tempo você tem hoje?'),
      h('p', { class: 'destaque__texto' }, L?.missao?.podeFazer || 'Exemplos, prática e revisão no seu ritmo.'),
      salva?.concluida || iniciada ? h('a', { class: 'btn btn-sol btn-bloco', href: '#/sessao' }, salva.concluida ? 'Rever minha sessão' : 'Continuar minha sessão', icone('arrow-right')) : tempos,
      h('p', { class: 'destaque__nota' }, 'Pode pedir ajuda e sair quando precisar. O progresso fica salvo.'));
    aulaComoLinha = !!L;
  } else if (L) {
    destaque = h('section', { class: 'destaque aula' + (feita ? ' destaque--feito' : ''), 'aria-labelledby': 'destaque-t' },
      h('p', { class: 'destaque__rotulo' }, feita ? 'Aula de hoje · feita' : `Aula de hoje · ${L.minutos} min`),
      h('h2', { id: 'destaque-t' }, L.missao ? L.missao.titulo : 'Manter e ampliar'),
      iniciante ? h('p', { class: 'destaque__texto' }, infantil ? 'Áudio, tradução e jogos curtinhos. Uma palavra de cada vez.' : 'Expressões essenciais, áudio, tradução e prática com explicações.')
        : L.missao ? h('p', { class: 'destaque__texto' }, `No fim da missão você vai conseguir: “${L.missao.podeFazer}”`) : null,
      progressoAula,
      feita ? h('a', { class: 'btn btn-vidro btn-bloco', href: '#/licao' }, icone('repeat'), 'Rever a aula')
        : h('a', { class: 'btn btn-sol btn-bloco btn-grande', href: '#/licao' }, L.iniciada ? 'Continuar aula' : 'Começar minha aula', icone('arrow-right')));
  }
  if (destaque) principal.append(destaque);
  if (L && !completo) principal.append(louFala(feita ? 'feliz' : 'oi', h('p', {}, iniciante ? (feita ? 'Aula concluída. Você pode rever as palavras ou explorar um capítulo da biblioteca.' : infantil ? 'Eu ajudo você! Ouça as palavras e descubra o significado. Depois vamos brincar de responder.' : 'Comece com as expressões da aula. Há áudio, tradução e explicações para estudar com autonomia.') : feita ? 'Aula de hoje feita! Que tal revisar uns cartões ou conversar um pouco?' : (L.porque?.[0] || 'Sua aula de hoje está pronta.'))));

  if (a.status === 'teste' && a.diasRestantes <= 5) principal.append(h('div', { class: 'aviso-suave' }, icone('info'), h('p', {}, `Seu teste grátis termina em ${plural(a.diasRestantes, 'dia', 'dias')} (${dataBR(a.ate)}). Nada é cobrado sozinho. `, h('a', { href: '#/conta' }, 'Ver planos'))));
  if (a.acesso === 'livre') principal.append(h('div', { class: 'aviso-suave' }, icone('info'), h('p', {}, 'Você está no acesso livre: seus cartões e seu progresso continuam aqui. ', h('a', { href: '#/conta' }, 'Voltar ao plano completo'))));
  const pr = d.proximo;
  if (pr.acao === 'assinatura') principal.append(h('p', { class: 'aviso-suave' }, icone('info'), h('span', {}, pr.texto, ' ', h('a', { href: '#/conta' }, 'Ver planos'))));

  // lembrete diário: convite (uma vez, dá para dispensar) ou, no horário combinado, o chamado para o exercício do dia
  const lem = estado?.eu?.perfil?.lembrete;
  if (lem && !lem.ativo && localStorageGet('lembrete-dispensado') !== 'sim' && completo) {
    const caixa = h('div', { class: 'aviso-suave aviso-lembrete' }, icone('bell'), h('p', {}, 'Quer um lembrete para fazer o exercício todo dia? Escolha o horário e o Tuiuiú te chama.'),
      h('div', { class: 'linha-acoes' },
        h('button', { type: 'button', class: 'btn btn-sec btn-peq', on: { click: () => configurarLembrete(lem, { aoSalvar: novo => { estado.eu.perfil.lembrete = novo; caixa.remove(); } }) } }, 'Escolher horário'),
        h('button', { type: 'button', class: 'btn btn-texto btn-peq', on: { click: () => { localStorageSet('lembrete-dispensado', 'sim'); caixa.remove(); } } }, 'Agora não')));
    principal.append(caixa);
  } else if (lem && lembreteDeHoje(lem) && jaPassouDaHora(lem) && !d.sequencia.estudouHoje && !feita && completo) {
    principal.append(h('div', { class: 'aviso-suave aviso-lembrete' }, icone('bell'), h('p', {}, `Hora do exercício de hoje! Seu lembrete era às ${lem.hora}. Uns minutinhos já contam.`),
      h('a', { class: 'btn btn-peq', href: '#/licao' }, L?.iniciada ? 'Continuar a aula' : 'Começar agora')));
  }

  // depois da primeira aula feita, convite (uma vez) para ter o Inglou na tela inicial
  if (feita && !jaInstalado() && (podeInstalarDireto() || ehIphone()) && localStorageGet('instalar-dispensado') !== 'sim') {
    const caixa = h('div', { class: 'aviso-suave aviso-lembrete' }, icone('info'), h('p', {}, 'Aula feita! Que tal deixar o Inglou na tela inicial do celular para estudar com um toque?'),
      h('div', { class: 'linha-acoes' },
        h('button', { type: 'button', class: 'btn btn-sec btn-peq', on: { click: () => instalarOuGuiar() } }, 'Adicionar à tela de início'),
        h('button', { type: 'button', class: 'btn btn-texto btn-peq', on: { click: () => { localStorageSet('instalar-dispensado', 'sim'); caixa.remove(); } } }, 'Agora não')));
    principal.append(caixa);
  }

  // ---------- "quando sobrar um tempinho": atalhos em grade, com uma linha que diz o que tem lá
  const sugere = pr.acao === 'revisar' || pr.acao === 'conversar' ? pr.acao : null;
  const bloco = (chave, cor, href, ic, titulo, sub, num) => h('a', { class: `bloco c-${cor}` + (sugere === chave ? ' bloco--sugerido' : ''), href },
    h('span', { class: 'bolha bolha--peq' }, icone(ic)), num ? h('span', { class: 'bloco__num', 'aria-label': plural(num, 'pendente', 'pendentes') }, String(num)) : null,
    h('strong', {}, titulo), sub ? h('small', {}, sub) : null);
  const t = d.treino && completo ? d.treino : null, treinoPronto = t && (t.pronto || t.tags.length);
  const r = d.radio && completo ? d.radio : null;
  principal.append(h('section', { class: 'tempinho', 'aria-labelledby': 'tempinho-t' },
    h('h2', { id: 'tempinho-t' }, 'Quando sobrar um tempinho'),
    h('nav', { class: 'blocos', 'aria-label': 'Atividades' },
      bloco('conversar', 'menta', pr.acao === 'conversar' && pr.cenario ? `#/conversar?c=${pr.cenario}` : '#/conversar', 'chats', 'Conversar', sugere === 'conversar' ? 'sugestão do Tuiuiú' : 'situações do dia a dia'),
      bloco('revisar', 'sol', '#/revisar', 'cards', 'Revisar', d.revisoesPendentes ? plural(d.revisoesPendentes, 'cartão', 'cartões') : 'cartões em dia', d.revisoesPendentes),
      t ? bloco('treino', 'limao', treinoPronto ? '#/treino' : '#/aprender', treinoPronto ? 'target' : 'compass', t.concluido ? 'Treino feito' : treinoPronto ? 'Meu treino' : 'Meu jeito', t.concluido ? 'dá para fazer outro' : treinoPronto ? (t.quantos ? `${t.quantos} perguntas para você` : 'só o que você erra') : 'como você aprende') : null,
      r ? bloco('radio', 'rosa', '#/podcast', 'headphones', 'Rádio Tuiuiú', r.ouvido ? 'ouvido hoje' : r.pronto ? `${r.minutos} min` : 'uns 3 min') : null)));

  // ---------- linhas curtas: missão (quando o destaque é a sessão), turma, desafios, figurinha nova
  const linha = (cor, href, ic, titulo, sub, extra = {}) => h('li', {}, h('a', { class: `linha c-${cor}`, href, ...extra }, h('span', { class: 'bolha bolha--peq' }, icone(ic)), h('span', { class: 'linha__txt' }, h('strong', {}, titulo), sub ? h('small', {}, sub) : null), icone('caret-right')));
  const linhas = h('ul', { class: 'linhas', 'aria-label': 'Mais para você' });
  if (aulaComoLinha) linhas.append(linha('azul', '#/licao', feita ? 'check' : 'path', feita ? 'Missão: aula de hoje feita' : 'Continuar minha missão', L.missao ? `${L.missao.titulo} · parte ${L.missao.parte} de ${L.missao.total}` : 'Manter e ampliar'));
  if (d.turmas) { const tu = d.turmas; linhas.append(linha('lilas', '#/turmas', 'users-three', tu.pendentes ? plural(tu.pendentes, 'atividade da turma', 'atividades da turma') : 'Turma em dia', tu.pendentes && tu.proxima ? `${tu.proxima.titulo}${tu.proxima.prazo ? ' · até ' + dataBR(tu.proxima.prazo) : ''}` : 'Nenhuma atividade esperando', { 'data-turma': '' })); }
  if (d.novasConquistas?.length) linhas.append(linha('sol', '#/colecao', 'medal', 'Figurinha nova!', nomeConquista(d.novasConquistas[0])));
  linhas.append(linha('lilas', '#/desafios', 'users-three', 'Desafios com amigos', d.economia ? `${d.economia.xp} XP · ${d.economia.moedas} moedas` : 'Figurinhas, metas em grupo, XP e moedas'));
  principal.append(linhas);
  // acabou de concluir uma aula: o Tuiuiú do cantinho comemora
  try { const f = sessionStorage.getItem('inglou:festa'); if (f) { sessionStorage.removeItem('inglou:festa'); setTimeout(() => reagirCanto('festa', f === 'conquista' ? 'Nova figurinha!' : 'Aula concluída!'), 1000); } } catch {}

  const lado = h('div', { class: 'hoje__col hoje__col--lado' });
  if (p?.plano) lado.append(h('details', { class: 'outras-atividades' }, h('summary', {}, icone('path'), 'Meu caminho de aprendizagem'), album(p.plano, { licaoFeita: feita })));
  el.append(h('div', { class: 'hoje' + (iniciante ? ' hoje--guiada' : '') }, principal, lado));
}
