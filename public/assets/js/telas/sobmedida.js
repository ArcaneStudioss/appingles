// Estudo sob medida: o aluno tem uma prova, entrevista ou viagem e precisa de ajuda específica.
// Lista de estudos -> um estudo (assuntos em ordem, ritmo até a data, simulado) -> um assunto (mini-aula + exercícios) -> simulado.
// Formulário só em janela (regra de telas limpas). O gabarito é conferido no servidor.
import { api } from '../api.js?v=__V__';
import { h, icone, toast, formulario, confirmar, plural, dataBR, ocupado, falar } from '../ui.js?v=__V__';
import { lou, louFala, som, confete } from '../diversao.js?v=__V__';
import { exercicio } from './exercicio.js?v=__V__';
import { nomeConquista } from './hoje.js?v=__V__';

const TIPOS = [
  ['prova', 'Prova da escola ou faculdade', 'note-pencil'], ['concurso', 'Concurso ou vestibular', 'flag-checkered'],
  ['proficiencia', 'Prova de proficiência (TOEFL, IELTS, Cambridge...)', 'translate'], ['entrevista', 'Entrevista ou apresentação', 'briefcase'],
  ['viagem', 'Viagem', 'airplane'], ['outro', 'Outra coisa', 'compass'],
];
const iconeTipo = t => (TIPOS.find(x => x[0] === t) || TIPOS[5])[2];
const nomeTipo = t => (TIPOS.find(x => x[0] === t) || TIPOS[5])[1];
const EXEMPLOS = [
  { tipo: 'prova', titulo: 'Prova de inglês da faculdade', descricao: 'present perfect\npreposições\ninterpretação de texto' },
  { tipo: 'entrevista', titulo: 'Entrevista de emprego', descricao: 'me apresentar\nfalar da minha experiência\nperguntas comuns de entrevista' },
  { tipo: 'viagem', titulo: 'Viagem para os Estados Unidos', descricao: 'aeroporto\nhotel\nrestaurante\npedir informação na rua' },
];

function textoRitmo(r) {
  if (r.diasRestantes == null) return 'Sem data: siga a ordem dos assuntos, no seu ritmo.';
  if (r.atrasado) return 'A data já passou. Mude a data ou encerre o estudo.';
  if (!r.restantes) return 'Todos os assuntos estudados. Faça o simulado e continue as revisões.';
  if (r.diasRestantes === 0) return 'É hoje! Revise os cartões e faça um simulado.';
  return `Faltam ${plural(r.diasRestantes, 'dia', 'dias')}. Para dar tempo: ${r.porDia === 1 ? 'um assunto' : r.porDia + ' assuntos'} por dia.`;
}
const rotuloData = r => (r.diasRestantes == null ? 'sem data' : r.atrasado ? 'data passou' : r.diasRestantes === 0 ? 'é hoje' : `faltam ${plural(r.diasRestantes, 'dia', 'dias')}`);
const barra = (pct, rotulo) => h('div', { class: 'estudo-barra', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': pct, 'aria-label': rotulo }, h('span', { style: `transform:scaleX(${(pct / 100).toFixed(3)})` }));

async function novoEstudo(ir, pre = {}) {
  const r = await formulario({
    titulo: 'Novo estudo sob medida', enviar: 'Montar meu estudo',
    texto: 'Conte o que vem pela frente. Quanto mais específico, melhor o caminho. Montar leva alguns segundos.',
    campos: [
      { nome: 'tipo', rotulo: 'O que vem pela frente?', tipo: 'select', valor: pre.tipo || 'prova', opcoes: TIPOS.map(([valor, rotulo]) => ({ valor, rotulo })) },
      { nome: 'titulo', rotulo: 'Nome do estudo', obrigatorio: true, max: 80, placeholder: 'Prova de inglês da faculdade', valor: pre.titulo },
      { nome: 'data_alvo', rotulo: 'Que dia é? (opcional)', tipo: 'date', ajuda: 'Com a data, eu divido os assuntos até lá.' },
      { nome: 'descricao', rotulo: 'O que cai ou o que você precisa saber?', tipo: 'textarea', obrigatorio: true, max: 1500, linhas: 5, placeholder: 'Um assunto por linha. Ex.:\npresent perfect\nphrasal verbs', valor: pre.descricao },
      { nome: 'material', rotulo: 'Tem material? (opcional)', tipo: 'textarea', max: 8000, linhas: 5, ajuda: 'Cole um texto, uma lista de palavras ou o conteúdo programático da prova.' },
    ],
    aoEnviar: v => api('/sobmedida', { metodo: 'POST', corpo: v }),
  });
  if (r?.id) { if (r.aviso) toast(r.aviso); ir('#/sobmedida/' + r.id); }
}

// ---------- lista ----------
export async function telaSobMedida(el, { ir }) {
  const { estudos, ia } = await api('/sobmedida');
  const ativos = estudos.filter(e => e.ativo), encerrados = estudos.filter(e => !e.ativo);
  const cartao = e => h('a', { class: 'estudo-card c-turquesa', href: '#/sobmedida/' + e.id },
    h('span', { class: 'bolha' }, icone(iconeTipo(e.tipo))),
    h('span', { class: 'estudo-card__txt' }, h('strong', {}, e.titulo), h('small', {}, `${e.progresso.concluidos} de ${e.progresso.total} assuntos · ${rotuloData(e.ritmo)}`), barra(e.progresso.pct, 'Progresso do estudo')),
    icone('caret-right'));
  el.append(
    h('header', { class: 'cabeca c-turquesa' }, h('span', { class: 'bolha' }, icone('graduation-cap')), h('div', {}, h('h1', {}, 'Estudo sob medida'), h('p', { class: 'ajuda' }, 'Tem uma prova, uma entrevista ou uma viagem? Conte para o Tuiuiú e ele monta o caminho.'))),
    h('button', { type: 'button', class: 'btn btn-cor c-turquesa btn-grande', on: { click: () => novoEstudo(ir) } }, icone('plus'), 'Novo estudo'),
    ia ? null : h('p', { class: 'aviso-suave' }, icone('info'), h('span', {}, 'Modo de prática: eu separo os assuntos do que você escreve e uso nosso catálogo e o seu material. Com a IA ligada, cada assunto é escrito sob medida.')),
    ativos.length ? h('section', { class: 'tela' }, h('h2', {}, 'Em andamento'), ativos.map(cartao)) : h('section', { class: 'vazio folha c-turquesa' },
      louFala('oi', h('p', {}, 'Ainda não tem nenhum estudo. Escolha um exemplo ou conte o seu.')),
      h('div', { class: 'escolhas' }, EXEMPLOS.map(ex => h('button', { type: 'button', class: 'chip c-turquesa chip-botao', on: { click: () => novoEstudo(ir, ex) } }, icone(iconeTipo(ex.tipo)), ex.titulo)))),
    h('a', { class: 'estudo-card estudo-card--texto c-lilas', href: '#/material' }, h('span', { class: 'bolha' }, icone('file-text')), h('span', { class: 'estudo-card__txt' }, h('strong', {}, 'Só quero estudar um texto meu'), h('small', {}, 'Cole uma vaga, e-mail ou artigo e eu transformo em palavras e exercícios.')), icone('caret-right')),
    encerrados.length ? h('details', { class: 'folha' }, h('summary', {}, icone('flag-checkered'), ` Encerrados (${encerrados.length})`), h('div', { class: 'tela' }, encerrados.map(cartao))) : null);
}

// ---------- um estudo ----------
export async function telaEstudo(el, { param, ir }) {
  const id = param;
  const { estudo: e, ia } = await api('/sobmedida/' + encodeURIComponent(id));
  const recarregar = () => ir('#/sobmedida/' + id);
  const r = e.ritmo, p = e.progresso;

  const mudarData = async () => {
    const ok = await formulario({ titulo: 'Mudar a data', campos: [{ nome: 'data_alvo', rotulo: 'Nova data (deixe vazio para tirar a data)', tipo: 'date', valor: e.data_alvo || '' }], aoEnviar: v => api('/sobmedida/' + id, { metodo: 'PATCH', corpo: { data_alvo: v.data_alvo || null } }) });
    if (ok) { toast('Data atualizada.', { tipo: 'ok' }); recarregar(); }
  };
  const encerrar = async () => {
    if (e.ativo && !await confirmar({ titulo: 'Encerrar este estudo?', texto: 'Ele sai da lista de andamento, mas você pode reabrir quando quiser. Nada é apagado.', ok: 'Encerrar' })) return;
    await api('/sobmedida/' + id, { metodo: 'PATCH', corpo: { ativo: !e.ativo } }); toast(e.ativo ? 'Estudo encerrado.' : 'Estudo reaberto.', { tipo: 'ok' }); recarregar();
  };
  const apagar = async () => {
    if (!await confirmar({ titulo: 'Apagar este estudo?', texto: 'Somem os assuntos, as respostas e o simulado. Os cartões de revisão já criados continuam.', ok: 'Apagar', perigo: true })) return;
    await api('/sobmedida/' + id, { metodo: 'DELETE' }); ir('#/sobmedida');
  };
  const pergunta = encodeURIComponent(`Estou estudando para: ${e.titulo}. `.slice(0, 200));

  const assuntos = h('ol', { class: 'assuntos', 'aria-label': 'Assuntos do estudo' }, e.assuntos.map((a, i) => {
    const hoje = r.proximo === a.id && e.ativo;
    return h('li', { class: 'assunto c-turquesa' + (a.concluido ? ' assunto--feito' : '') + (hoje ? ' assunto--hoje' : '') },
      h('span', { class: 'assunto__num' }, a.concluido ? icone('check') : String(i + 1)),
      h('div', { class: 'assunto__txt' },
        h('div', { class: 'assunto__topo' }, h('strong', {}, a.nome), hoje ? h('span', { class: 'chip c-sol' }, 'Próximo') : null, a.concluido ? h('span', { class: 'chip chip-ok' }, icone('check'), a.feitos ? `${a.certos} de ${a.feitos}` : 'Feito') : a.visto ? h('span', { class: 'chip' }, 'Em estudo') : null),
        a.porque ? h('small', {}, a.porque) : null),
      h('a', { class: 'btn btn-peq ' + (hoje ? 'btn-cor c-turquesa' : 'btn-sec'), href: `#/sobmedida/${id}/${a.id}` }, a.concluido ? 'Rever' : a.visto ? 'Continuar' : 'Estudar'));
  }));

  const sim = e.simulado;
  el.append(
    h('header', { class: 'cabeca cabeca--chat' }, h('a', { class: 'btn btn-texto btn-peq', href: '#/sobmedida', 'aria-label': 'Voltar aos estudos' }, icone('caret-left')), h('h1', {}, e.titulo), h('span')),
    h('section', { class: 'estudo-painel folha c-turquesa' },
      h('div', { class: 'estudo-painel__topo' }, h('span', { class: 'chip' }, icone(iconeTipo(e.tipo)), nomeTipo(e.tipo).replace(/ \(.*\)/, '')), e.data_alvo ? h('span', { class: 'chip c-sol' }, icone('calendar-plus'), dataBR(e.data_alvo)) : null, e.ativo ? null : h('span', { class: 'chip chip-neutro' }, 'Encerrado'), h('span', { class: 'chip chip-neutro' }, e.modo === 'ia' ? 'Plano escrito pela IA' : 'Plano do que você escreveu')),
      h('p', { class: 'estudo-painel__num' }, h('strong', {}, `${p.concluidos} de ${p.total}`), ' assuntos estudados'),
      barra(p.pct, 'Assuntos estudados'),
      h('p', { class: 'ajuda' }, textoRitmo(r))),
    h('section', { class: 'tela' }, h('h2', {}, 'Assuntos'), assuntos),
    h('section', { class: 'simulado-card folha c-lilas' },
      h('div', { class: 'cartao-conta__info' }, h('span', { class: 'bolha' }, icone('flag-checkered')), h('div', {}, h('h2', {}, 'Mini simulado'), h('p', { class: 'ajuda' }, sim.resultado ? `Último resultado: ${sim.resultado.pct}% (${sim.resultado.certos} de ${sim.resultado.total}).` : sim.pode ? 'Perguntas dos assuntos que você já abriu, sem consultar. O resultado vem no fim.' : 'Abra e estude pelo menos um assunto para liberar o simulado.'))),
      h('div', { class: 'linha-acoes' },
        sim.pode ? h('a', { class: 'btn btn-cor c-lilas', href: `#/sobmedida/${id}/simulado` }, icone('play'), sim.emAndamento ? 'Continuar' : sim.feito ? 'Ver resultado' : 'Fazer o simulado') : h('button', { type: 'button', class: 'btn', disabled: true }, icone('play'), 'Fazer o simulado'))),
    h('section', { class: 'tela' },
      h('div', { class: 'linha-acoes' },
        h('a', { class: 'btn btn-sec c-coral', href: `#/duvidas?q=${pergunta}` }, icone('question'), 'Perguntar ao tutor'),
        h('a', { class: 'btn btn-sec', href: '#/revisar' }, icone('cards'), 'Revisar cartões')),
      h('div', { class: 'linha-acoes' },
        h('button', { type: 'button', class: 'btn btn-texto btn-peq', on: { click: mudarData } }, icone('calendar-plus'), e.data_alvo ? 'Mudar a data' : 'Colocar uma data'),
        h('button', { type: 'button', class: 'btn btn-texto btn-peq', on: { click: encerrar } }, icone('flag-checkered'), e.ativo ? 'Encerrar' : 'Reabrir'),
        h('button', { type: 'button', class: 'btn btn-texto btn-peq', on: { click: apagar } }, icone('trash'), 'Apagar'))),
    ia || e.modo === 'ia' ? null : h('p', { class: 'ajuda' }, 'Dica: cole um texto ou o conteúdo programático ao criar um estudo novo para eu ter mais material.'));
}

// ---------- um assunto ----------
export async function telaAssunto(el, { param, param2, ir }) {
  const id = param, aid = param2;
  el.append(h('div', { class: 'folha vazio c-turquesa' }, lou('pensando', { tamanho: 84, rotulo: '' }), h('p', { class: 'bilhete' }, 'O Tuiuiú está preparando este assunto...'), h('p', { class: 'ajuda' }, 'Na primeira vez pode levar alguns segundos.')));
  const { assunto: a, estudo, aviso } = await api(`/sobmedida/${encodeURIComponent(id)}/assunto/${encodeURIComponent(aid)}`);
  const topo = h('header', { class: 'cabeca cabeca--chat' }, h('a', { class: 'btn btn-texto btn-peq', href: '#/sobmedida/' + id, 'aria-label': 'Voltar ao estudo' }, icone('caret-left')), h('h1', {}, a.nome), h('span'));
  const secao = (icon, cor, titulo, ...filhos) => h('section', { class: `folha c-${cor}` }, h('p', { class: `etapa c-${cor}` }, h('span', { class: 'bolha' }, icone(icon)), titulo), ...filhos);
  const ouvir = en => h('button', { type: 'button', class: 'btn-icone', 'aria-label': 'Ouvir', on: { click: () => falar(en) } }, icone('speaker-high'));

  if (!a.exercicios.length && !a.explicacao) {
    el.replaceChildren(topo, h('div', { class: 'folha vazio c-turquesa' }, lou('ops', { tamanho: 84, rotulo: '' }), h('h2', {}, 'Esse eu não sei montar sozinho'), h('p', {}, aviso || 'Sem o tutor de IA, só monto os assuntos que o catálogo cobre ou que saem do seu material.'),
      h('div', { class: 'linha-acoes' }, h('a', { class: 'btn', href: `#/duvidas?q=${encodeURIComponent('Me explica: ' + a.nome)}` }, icone('question'), 'Perguntar ao tutor'), h('a', { class: 'btn btn-sec', href: '#/sobmedida/' + id }, 'Voltar'))));
    return;
  }

  const pratica = h('div', { class: 'lista-exercicios' });
  const caixas = a.exercicios.map(ex => {
    const caixa = h('div', { class: 'folha' });
    caixa.append(exercicio(ex, {
      ja: a.respondidos[ex.id],
      responder: async (resposta, meta) => { const r = await api(`/sobmedida/${id}/assunto/${aid}/responder`, { metodo: 'POST', corpo: { itemId: ex.id, resposta, ...meta } }); a.respondidos[ex.id] = { ...r, resposta }; return r; },
      rotuloProximo: 'Próximo',
      aoProximo: () => { const prox = caixa.nextElementSibling; if (prox) { prox.scrollIntoView({ block: 'center' }); prox.querySelector('button,input,textarea')?.focus({ preventScroll: true }); } else finalizar.scrollIntoView({ block: 'center' }); },
    }));
    pratica.append(caixa);
    return caixa;
  });

  const resultado = h('div', { 'aria-live': 'polite' });
  const finalizar = h('button', { type: 'button', class: 'btn btn-bloco btn-grande btn-cor c-turquesa', on: { click: async () => {
    ocupado(finalizar, true);
    try {
      const r = await api(`/sobmedida/${id}/assunto/${aid}/concluir`, { metodo: 'POST' });
      som('fim'); confete(); for (const c of r.conquistas || []) toast('Nova figurinha: ' + nomeConquista(c), { tipo: 'ok' });
      finalizar.hidden = true;
      resultado.replaceChildren(h('div', { class: 'folha c-menta' }, louFala('feliz', h('p', { class: 'lou-fala__nome' }, 'Assunto concluído!'), h('p', {}, r.feitos ? `Você acertou ${r.certos} de ${r.feitos}. O que errou virou cartão de revisão.` : 'Marquei como estudado.')),
        h('p', { class: 'ajuda' }, `${r.progresso.concluidos} de ${r.progresso.total} assuntos estudados.`),
        h('div', { class: 'linha-acoes' }, r.proximo ? h('a', { class: 'btn btn-cor c-turquesa', href: `#/sobmedida/${id}/${r.proximo.id}` }, 'Próximo: ' + r.proximo.nome, icone('arrow-right')) : h('a', { class: 'btn btn-cor c-lilas', href: `#/sobmedida/${id}/simulado` }, icone('flag-checkered'), 'Fazer o simulado'), h('a', { class: 'btn btn-sec', href: '#/sobmedida/' + id }, 'Voltar ao estudo'))));
      resultado.scrollIntoView({ block: 'center' });
    } catch (err) { toast(err.message, { tipo: 'erro' }); ocupado(finalizar, false); }
  } } }, icone('check'), a.concluido ? 'Concluir de novo' : 'Concluir este assunto');

  el.replaceChildren(topo,
    aviso ? h('p', { class: 'aviso-suave' }, icone('info'), h('span', {}, aviso)) : null,
    a.porque ? h('p', { class: 'bilhete' }, a.porque) : null,
    a.explicacao ? secao('book-open-text', 'azul', 'Entenda', h('p', {}, a.explicacao.texto),
      a.explicacao.contraste ? h('div', { class: 'contraste' }, h('p', {}, h('small', {}, 'Português'), a.explicacao.contraste.pt), h('p', { lang: 'en' }, h('small', {}, 'Inglês'), a.explicacao.contraste.en)) : null) : null,
    a.exemplos.length ? secao('speaker-high', 'turquesa', 'Exemplos', h('ul', { class: 'exemplos' }, a.exemplos.map(x => h('li', {}, ouvir(x.en), h('span', {}, h('span', { lang: 'en' }, x.en), x.pt ? h('small', {}, x.pt) : null))))) : null,
    a.vocab.length ? secao('translate', 'lilas', 'Palavras para guardar', h('ul', { class: 'vocab' }, a.vocab.map(v => h('li', {}, ouvir(v.ex), h('span', {}, h('span', { class: 'marca', lang: 'en' }, v.en), v.pt ? h('small', {}, ' ' + v.pt) : null, h('em', { lang: 'en' }, v.ex))))),
      h('button', { type: 'button', class: 'btn btn-sec btn-peq', on: { click: async e => {
        const b = e.currentTarget; ocupado(b, true); let n = 0;
        try { for (const v of a.vocab.slice(0, 8)) { try { await api('/cartoes', { metodo: 'POST', corpo: { frente: v.en, verso: v.pt || `(do seu estudo) ${v.ex}`, exemplo: v.ex } }); n++; } catch { /* cartão repetido */ } } toast(n ? `${n} cartões criados para revisão.` : 'Esses cartões já existiam.', { tipo: 'ok' }); } finally { ocupado(b, false); }
      } } }, icone('cards'), 'Criar cartões das palavras')) : null,
    a.dicas.length ? secao('lightbulb', 'sol', 'Dicas para a prova', h('ul', { class: 'lista-check' }, a.dicas.map(d => h('li', {}, d)))) : null,
    a.exercicios.length ? h('section', { class: 'tela' }, h('p', { class: 'etapa c-lilas' }, h('span', { class: 'bolha' }, icone('pencil-simple')), 'Pratique'), pratica) : null,
    finalizar, resultado);
}

// ---------- simulado ----------
export async function telaSimulado(el, { param, ir }) {
  const id = param;
  const { simulado: s, estudo } = await api(`/sobmedida/${encodeURIComponent(id)}/simulado`);
  const itens = s.itens, porId = Object.fromEntries(itens.map(i => [i.id, i]));
  if (s.feito) return mostrarResultado(s.resultado, s.detalhes);

  const respostas = {};
  let i = 0;
  const caixa = h('div', { class: 'simulado' });
  el.append(caixa);
  const sair = async () => { if (await confirmar({ titulo: 'Sair do simulado?', texto: 'As respostas desta tentativa se perdem. Você pode começar de novo quando quiser.', ok: 'Sair', cancelar: 'Continuar' })) ir('#/sobmedida/' + id); };

  function pergunta() {
    const it = itens[i];
    const ultima = i === itens.length - 1;
    let corpo;
    const atual = () => respostas[it.id] || '';
    const barraAcao = (btn) => h('div', { class: 'barra-acao barra-acao--fixa' }, h('div', { class: 'barra-acao__in' }, btn));
    const avancar = h('button', { type: 'button', class: 'btn btn-bloco btn-cor c-lilas', disabled: !atual(), on: { click: () => (ultima ? enviar() : (i++, pergunta())) } }, ultima ? 'Enviar simulado' : 'Próxima', icone('arrow-right'));
    const habilitar = () => { avancar.disabled = !atual().trim(); };
    if (it.tipo === 'escolha') {
      corpo = h('div', {}, h('h2', { class: 'enunciado' }, it.enunciado || 'Escolha a melhor opção'), h('div', { class: 'opcoes', role: 'radiogroup', 'aria-label': 'Alternativas' }, it.opcoes.map((o, k) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(atual() === o), class: 'opcao' + (atual() === o ? ' escolhida' : ''), lang: /^[\x20-\x7E’‘]+$/.test(o) ? 'en' : null,
        on: { click: e => { respostas[it.id] = o; som('toque'); for (const b of e.currentTarget.parentElement.children) { b.classList.remove('escolhida'); b.setAttribute('aria-checked', 'false'); } e.currentTarget.classList.add('escolhida'); e.currentTarget.setAttribute('aria-checked', 'true'); habilitar(); } } }, h('span', { class: 'opcao__tecla', 'aria-hidden': 'true' }, String(k + 1)), h('span', {}, o)))));
    } else if (it.tipo === 'lacuna') {
      const partes = it.frase.split('___');
      const campo = h('input', { type: 'text', class: 'lacuna', 'aria-label': 'Resposta', autocapitalize: 'off', spellcheck: 'false', maxlength: 60, size: 8, value: atual() });
      campo.addEventListener('input', () => { respostas[it.id] = campo.value; habilitar(); });
      campo.addEventListener('keydown', e => { if (e.key === 'Enter' && !avancar.disabled) avancar.click(); });
      corpo = h('div', {}, h('h2', { class: 'enunciado' }, 'Complete a frase'), h('p', { class: 'frase-lacuna', lang: 'en' }, partes[0], campo, partes[1] || ''));
      setTimeout(() => campo.focus({ preventScroll: true }), 80);
    } else {
      const campo = h('textarea', { class: 'resposta-livre', rows: 3, lang: 'en', autocapitalize: 'sentences', spellcheck: 'false', maxlength: 300, placeholder: 'Escreva em inglês', 'aria-label': 'Sua resposta em inglês' });
      campo.value = atual();
      campo.addEventListener('input', () => { respostas[it.id] = campo.value; habilitar(); });
      corpo = h('div', {}, h('h2', { class: 'enunciado' }, 'Escreva em inglês'), h('div', { class: 'frase-pt' }, lou('pensando', { tamanho: 52, rotulo: '' }), h('p', { class: 'balao-pt' }, it.pt)), campo);
      setTimeout(() => campo.focus({ preventScroll: true }), 80);
    }
    caixa.replaceChildren(
      h('div', { class: 'licao-topo' }, h('button', { type: 'button', class: 'btn btn-texto btn-peq', 'aria-label': 'Sair do simulado', on: { click: sair } }, icone('x')),
        h('div', { class: 'barra-progresso', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': itens.length, 'aria-valuenow': i }, h('span', { style: `transform:scaleX(${(i / itens.length).toFixed(3)})` })), h('span', { class: 'chip c-lilas' }, `${i + 1} de ${itens.length}`)),
      h('div', { class: 'passo' }, h('p', { class: 'ajuda' }, 'Sem consultar e sem dica. O resultado vem no fim.'), corpo,
        h('div', { class: 'linha-acoes' }, i > 0 ? h('button', { type: 'button', class: 'btn btn-texto', on: { click: () => { i--; pergunta(); } } }, icone('caret-left'), 'Voltar') : null,
          h('button', { type: 'button', class: 'btn btn-texto', on: { click: () => { respostas[it.id] = ''; ultima ? enviar() : (i++, pergunta()); } } }, 'Não sei'))),
      barraAcao(avancar));
    scrollTo(0, 0);
  }

  async function enviar() {
    caixa.replaceChildren(h('div', { class: 'folha vazio c-lilas' }, lou('pensando', { tamanho: 84, rotulo: '' }), h('p', { class: 'bilhete' }, 'Corrigindo o seu simulado...')));
    try {
      const r = await api(`/sobmedida/${id}/simulado/enviar`, { metodo: 'POST', corpo: { respostas } });
      for (const c of r.conquistas || []) toast('Nova figurinha: ' + nomeConquista(c), { tipo: 'ok' });
      caixa.remove(); mostrarResultado(r.resultado, r.detalhes, true);
    } catch (e) { toast(e.message, { tipo: 'erro' }); caixa.replaceChildren(h('div', { class: 'folha vazio' }, h('p', {}, e.message), h('button', { class: 'btn', on: { click: enviar } }, 'Tentar de novo'))); }
  }

  function mostrarResultado(res, detalhes, novo = false) {
    if (novo) { som('fim'); if (res.pct >= 70) confete(); }
    document.body.classList.remove('foco-total');
    const refazer = h('button', { type: 'button', class: 'btn btn-sec', on: { click: async () => { try { await api(`/sobmedida/${id}/simulado/novo`, { metodo: 'POST' }); ir('#/sobmedida/' + id + '/simulado'); } catch (e) { toast(e.message, { tipo: 'erro' }); } } } }, icone('arrow-counter-clockwise'), 'Refazer com perguntas novas');
    el.replaceChildren(
      h('header', { class: 'cabeca cabeca--chat' }, h('a', { class: 'btn btn-texto btn-peq', href: '#/sobmedida/' + id, 'aria-label': 'Voltar ao estudo' }, icone('caret-left')), h('h1', {}, 'Resultado do simulado'), h('span')),
      h('section', { class: 'folha resultado-nivel c-lilas' }, h('p', { class: 'chip' }, estudo?.titulo || 'Simulado'), h('p', { class: 'nivel-grande nivel-grande--pct' }, `${res.pct}%`), h('p', {}, `${res.certos} de ${res.total} certas`), h('p', { class: 'ajuda' }, res.conselho), h('p', { class: 'ajuda' }, res.aviso)),
      h('section', { class: 'folha' }, h('h2', {}, 'Por assunto'), h('ul', { class: 'barras' }, res.porAssunto.map(p => h('li', {}, h('span', { class: 'barras-rotulo' }, p.nome), h('span', { class: 'barras-trilho', 'aria-hidden': 'true' }, h('span', { style: `transform:scaleX(${(p.pct / 100).toFixed(2)})` })), h('strong', {}, `${p.pct}%`))))),
      detalhes ? h('section', { class: 'tela' }, h('h2', {}, 'Pergunta por pergunta'), h('ol', { class: 'detalhes' }, detalhes.map(d => {
        const it = porId[d.id];
        return h('li', { class: 'folha detalhe ' + (d.correto ? 'detalhe--certo' : 'detalhe--errado') },
          h('p', { class: 'chip ' + (d.correto ? 'chip-ok' : '') }, icone(d.correto ? 'check' : 'x'), d.assunto),
          h('p', { class: 'enunciado', lang: it?.tipo === 'traduzir' ? null : 'en' }, it?.frase || it?.enunciado || it?.pt || ''),
          d.correto ? null : h('div', { class: 'correcao' }, d.sua ? h('span', { class: 'riscado', lang: 'en' }, d.sua) : h('span', { class: 'riscado' }, '(em branco)'), h('span', { class: 'nova', lang: 'en' }, d.esperado)),
          !d.correto && d.explica ? h('p', { class: 'explica' }, icone('lightbulb'), ' ' + d.explica) : null);
      }))) : null,
      h('div', { class: 'linha-acoes' }, h('a', { class: 'btn btn-cor c-turquesa', href: '#/sobmedida/' + id }, 'Voltar ao estudo'), refazer, h('a', { class: 'btn btn-sec', href: '#/revisar' }, icone('cards'), 'Revisar cartões')));
  }

  pergunta();
}
