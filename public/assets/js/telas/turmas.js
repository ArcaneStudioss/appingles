// Turmas, lado do aluno: entrar por código (ou link), ver as atividades do professor e fazê-las.
// Também lista as turmas que a pessoa criou como professor(a) (o painel fica em professor.js).
import { api } from '../api.js?v=__V__';
import { h, icone, toast, confirmar, formulario, janela, ocupado, dataBR, plural, localStorageGet, localStorageSet } from '../ui.js?v=__V__';
import { lou, louFala, som, confete } from '../diversao.js?v=__V__';
import { exercicio } from './exercicio.js?v=__V__';
import { materialAula } from '../material-aula.js?v=__V__';

const prazoTxt = p => (p ? `até ${dataBR(p)}` : 'sem prazo');
const codigoDaUrl = () => (location.hash.match(/[?&]codigo=([\w-]+)/) || [])[1] || '';

// o que o professor vê: dito com clareza antes de entrar
export const AVISO_PROFESSOR = [
  'O professor vê o seu nome, quantas perguntas da turma você respondeu, se acertou e quanto tempo levou.',
  'Ele NÃO vê o que você digitou, suas conversas, seus textos, seus cartões nem o resto do seu estudo.',
  'Você pode sair da turma quando quiser. Ao sair, suas respostas nas atividades dela são apagadas.',
];

export async function telaTurmas(el, { ir, estado, carregarEu }) {
  const { professor, aluno } = await api('/turmas');
  const areaProfessor = location.hash.startsWith('#/professor');
  const codigoLink = codigoDaUrl() || localStorageGet('turma-pendente') || '';
  const lista = (itens, vazio) => (itens.length ? h('div', { class: 'turma-lista' }, itens) : h('p', { class: 'ajuda' }, vazio));

  async function entrar(codigo) {
    const ok = await formulario({
      titulo: 'Entrar na turma', enviar: 'Estou ciente, entrar na turma',
      texto: AVISO_PROFESSOR.join(' '),
      campos: [{ nome: 'codigo', rotulo: 'Código da turma', valor: codigo || '', max: 12, obrigatorio: true, placeholder: 'ABC123' }],
      aoEnviar: v => api('/turmas/entrar', { metodo: 'POST', corpo: { codigo: v.codigo, ciente: true } }),
    });
    localStorageSet('turma-pendente', '');
    if (ok && ok.turma) { toast(`Você entrou na turma ${ok.turma.nome}.`, { tipo: 'ok' }); ir(`#/minhaturma/${ok.turma.id}`); }
  }
  async function criar() {
    const ok = await formulario({ titulo: 'Criar turma', enviar: 'Criar turma', texto: 'Você será o(a) professor(a) desta turma. Depois, compartilhe o código com os alunos.',
      campos: [{ nome: 'nome', rotulo: 'Nome da turma', max: 80, obrigatorio: true, placeholder: 'Ex.: Inglês A1 - turma de adolescentes' },
        { nome: 'faixa', rotulo: 'Público', tipo: 'select', opcoes: [{ valor: 'todas', rotulo: 'Público misto' }, { valor: 'crianca', rotulo: 'Crianças' }, { valor: 'adolescente', rotulo: 'Adolescentes' }, { valor: 'adulto', rotulo: 'Adultos' }] },
        { nome: 'nivel', rotulo: 'Nível de inglês da turma', tipo: 'select', opcoes: ['A1', 'A2', 'B1', 'B2', 'C1'].map(n => ({ valor: n, rotulo: n })) }],
      aoEnviar: v => api('/turmas', { metodo: 'POST', corpo: v }) });
    if (ok && ok.turma) { await carregarEu(); ir(`#/turma/${ok.turma.id}`); }
  }

  el.append(
    h('header', { class: 'cabeca c-lilas' }, h('span', { class: 'bolha' }, icone('users-three')), h('div', {}, h('h1', {}, areaProfessor ? 'Área do professor' : 'Minhas turmas'), h('p', { class: 'ajuda' }, areaProfessor ? 'Organize suas turmas, monte aulas por conteúdo e acompanhe a aprendizagem.' : 'Material, questões e explicações das aulas do seu professor.'))),
    h('nav', { class: 'areas-uso', 'aria-label': 'Área de uso' }, h('a', { class: 'btn' + (areaProfessor ? ' btn-sec' : ''), href: '#/turmas' }, 'Sou aluno(a)'), h('a', { class: 'btn' + (areaProfessor ? '' : ' btn-sec'), href: '#/professor' }, 'Sou professor(a)')),
    h('section', { class: 'folha c-azul', hidden: areaProfessor },
      h('h2', {}, 'Sou aluno(a)'),
      lista(aluno.map(t => h('a', { class: 'turma-item', href: `#/minhaturma/${t.id}` },
        h('span', {}, h('strong', {}, t.nome), h('small', {}, `Professor(a): ${t.professor}`)),
        t.pendentes ? h('span', { class: 'chip c-sol' }, plural(t.pendentes, 'atividade nova', 'atividades novas')) : h('span', { class: 'chip chip-ok' }, icone('check'), 'em dia'))), 'Você ainda não está em nenhuma turma.'),
      h('div', { class: 'linha-acoes' }, h('button', { type: 'button', class: 'btn', on: { click: () => entrar(codigoLink) } }, icone('plus'), 'Entrar com um código'))),
    h('section', { class: 'folha c-menta', hidden: !areaProfessor },
      h('h2', {}, 'Sou professor(a)'),
      lista(professor.map(t => h('a', { class: 'turma-item', href: `#/turma/${t.id}` },
        h('span', {}, h('strong', {}, t.nome), h('small', {}, `${plural(t.alunos, 'aluno', 'alunos')} · ${plural(t.atividades, 'atividade', 'atividades')}`)),
        h('span', { class: 'chip' }, 'Código ', h('strong', {}, t.codigo)))), 'Você ainda não criou nenhuma turma.'),
      h('div', { class: 'linha-acoes' }, h('button', { type: 'button', class: 'btn', on: { click: criar } }, icone('plus'), 'Criar uma turma'), h('a', { class: 'btn btn-sec', href: '#/biblioteca' }, icone('book-open-text'), 'Explorar capítulos e conteúdos'))));

  // link de convite: abre direto a janela de entrada
  if (codigoDaUrl() || localStorageGet('turma-pendente')) setTimeout(() => entrar(codigoLink), 250);
}

export async function telaMinhaTurma(el, { param, ir }) {
  const { turma, atividades } = await api(`/turmas/${param}/aluno`);
  el.append(
    h('nav', { class: 'caminho-volta', 'aria-label': 'Caminho da turma' }, h('a', { href: '#/turmas' }, icone('arrow-left'), 'Minhas turmas'), h('span', { 'aria-hidden': 'true' }, '/'), h('span', { 'aria-current': 'page' }, turma.nome)),
    h('header', { class: 'cabeca c-azul' }, h('span', { class: 'bolha' }, icone('graduation-cap')), h('div', {}, h('h1', {}, turma.nome), h('p', { class: 'ajuda' }, `Professor(a): ${turma.professor}`))),
    atividades.length ? h('ul', { class: 'turma-lista' }, atividades.map(a => h('li', {}, h('a', { class: 'turma-item', href: `#/atividade/${a.id}` },
      h('span', {}, h('strong', {}, a.titulo), h('small', {}, `${plural(a.total, 'pergunta', 'perguntas')} · ${prazoTxt(a.prazo)}`), a.descricao ? h('small', {}, a.descricao) : null),
      a.concluida ? h('span', { class: 'chip chip-ok' }, icone('check'), `${a.certas}/${a.total}`) : a.feitas ? h('span', { class: 'chip c-sol' }, `${a.feitas}/${a.total}`) : h('span', { class: 'chip' }, 'Começar'))))) :
      h('div', { class: 'folha vazio' }, lou('oi', { tamanho: 80 }), h('p', {}, 'O professor ainda não publicou atividades. Quando publicar, elas aparecem aqui.')),
    h('details', { class: 'folha' }, h('summary', {}, icone('info'), ' O que o professor vê'), h('ul', { class: 'lista-check' }, AVISO_PROFESSOR.map(t => h('li', {}, t)))),
    h('div', { class: 'linha-acoes' },
      h('a', { class: 'btn btn-sec', href: '#/turmas' }, 'Voltar às minhas turmas'),
      h('button', { type: 'button', class: 'btn btn-texto', on: { click: async () => {
        if (!await confirmar({ titulo: 'Sair da turma?', texto: 'Suas respostas nas atividades desta turma serão apagadas. Você pode entrar de novo com o código.', ok: 'Sair da turma', cancelar: 'Ficar', perigo: true })) return;
        await api(`/turmas/${turma.id}/sair`, { metodo: 'POST' }); toast('Você saiu da turma.'); ir('#/turmas');
      } } }, icone('sign-out'), 'Sair da turma')));
}

// fazer a atividade: uma pergunta por tela, como a lição e o treino
export async function telaAtividade(el, { param, ir }) {
  const { atividade: a, itens, respondidos } = await api(`/atividades/${param}`);
  const total = itens.length + 2;                       // intro + perguntas + fim
  let i = 0;
  const feitos = Object.keys(respondidos).length;
  if (feitos && feitos < itens.length) i = 1 + itens.findIndex(x => !respondidos[x.id]);
  else if (feitos === itens.length && itens.length) i = total - 1;
  const palco = h('div', { class: 'licao-palco' });
  const topo = h('div', { class: 'licao-topo' },
    h('a', { class: 'btn btn-texto btn-peq', href: `#/minhaturma/${a.turmaId}`, 'aria-label': 'Voltar à turma' }, icone('arrow-left'), 'Turma'),
    h('div', { class: 'trilho', role: 'progressbar', 'aria-label': 'Progresso da atividade', 'aria-valuemin': 0, 'aria-valuemax': total - 1 }, h('span', { class: 'trilho__cheio' }), h('span', { class: 'trilho__lou' }, lou('feliz', { tamanho: 38, rotulo: '' }))),
    h('span', { class: 'chip c-azul' }, icone('graduation-cap'), 'Turma'));
  el.append(topo, palco);
  const avancar = () => { i = Math.min(total - 1, i + 1); desenhar(); };
  const barraBotao = (rotulo, acao = avancar) => h('div', { class: 'barra-acao barra-acao--fixa' }, h('div', { class: 'barra-acao__in' }, h('button', { type: 'button', class: 'btn btn-bloco', on: { click: acao } }, rotulo)));

  function desenhar() {
    const barra = topo.querySelector('.trilho');
    barra.setAttribute('aria-valuenow', i); barra.style.setProperty('--p', (i / (total - 1)).toFixed(3));
    const tela = h('div', { class: 'passo' });
    palco.replaceChildren(tela);
    if (i === 0) {
      tela.append(h('p', { class: 'etapa c-azul' }, h('span', { class: 'bolha' }, icone('graduation-cap')), a.turma), h('h1', {}, a.titulo),
        a.descricao ? louFala('oi', h('p', {}, a.descricao)) : null,
        materialAula(a.material),
        h('p', { class: 'ajuda' }, `${plural(itens.length, 'pergunta', 'perguntas')} · ${prazoTxt(a.prazo)}. O professor vê só se você acertou, não o que digitou.`),
        barraBotao(feitos ? 'Continuar' : 'Começar'));
    } else if (i === total - 1) fim(tela);
    else {
      const ex = itens[i - 1];
      tela.append(h('p', { class: 'etapa c-azul' }, h('span', { class: 'bolha' }, icone('graduation-cap')), `Pergunta ${i} de ${itens.length}`),
        a.material && (a.material.texto || a.material.explicacao || a.material.vocab?.length) ? h('button', { type: 'button', class: 'btn btn-texto btn-peq', on: { click: () => janela({ titulo: 'Material da aula', larga: true, corpo: materialAula(a.material) }) } }, icone('book-open-text'), 'Consultar o material') : null,
        exercicio(ex, {
          ja: respondidos[ex.id],
          permitirTreino: true,
          responder: async (resposta, meta) => { const r = await api(`/atividades/${a.id}/responder`, { metodo: 'POST', corpo: { itemId: ex.id, resposta, ...meta } }); if (!r.pratica) respondidos[ex.id] = { ...r, resposta }; return r; },
          aoProximo: avancar, barraFixa: true,
        }));
    }
    tela.querySelector('h1,h2')?.setAttribute('tabindex', '-1');
    if (i === 0 || i === total - 1) tela.querySelector('h1,h2')?.focus({ preventScroll: true });
    scrollTo(0, 0);
  }
  function fim(tela) {
    const feitas = Object.values(respondidos), certas = feitas.filter(r => r.correto).length;
    const faltam = itens.length - feitas.length;
    const pct = feitas.length ? Math.round(100 * certas / feitas.length) : 0;
    tela.classList.add('passo--fim');
    tela.append(lou(pct >= 70 ? 'festa' : 'feliz', { tamanho: 130 }), h('h2', { class: 'fim-titulo' }, faltam ? 'Seu progresso ficou salvo' : pct >= 70 ? 'Atividade concluída. Bom trabalho!' : 'Atividade concluída. Continue praticando.'),
      h('div', { class: 'placar' }, h('div', { class: 'placar__item' }, h('span', {}, 'Certas'), h('strong', {}, `${certas}/${itens.length}`)), h('div', { class: 'placar__item placar__item--sol' }, h('span', {}, 'Acerto'), h('strong', {}, `${pct}%`))),
      h('p', { class: 'ajuda' }, faltam ? `Faltam ${plural(faltam, 'questão', 'questões')}. Você pode voltar à turma e continuar depois.` : 'Seu professor já pode ver o seu resultado nesta atividade.'),
      h('details', { class: 'folha' }, h('summary', {}, 'Rever material da aula'), materialAula(a.material)),
      h('details', { class: 'folha respostas-da-aula' }, h('summary', {}, 'Rever respostas e explicações'), itens.map(ex => { const r = respondidos[ex.id]; return r ? h('div', { class: 'resumo-resposta' }, h('strong', {}, ex.enunciado || ex.pergunta || 'Prática'), h('p', { lang: r.audioResposta ? 'en' : null, 'data-traducao': r.traducao || null }, r.fraseCompleta || r.esperado), h('p', {}, r.explica)) : null; })),
      h('div', { class: 'barra-acao barra-acao--fixa' }, h('div', { class: 'barra-acao__in' }, h('a', { class: 'btn btn-bloco', href: `#/minhaturma/${a.turmaId}` }, 'Voltar à turma'))));
    if (feitas.length === itens.length) { som('fim'); if (pct >= 70) confete(); }
  }
  desenhar();
}
