// Turmas, lado do professor: painel da turma (código, atividades, alunos, dificuldades), criação de atividade
// (perguntas do banco do app + perguntas próprias) e o resultado de cada atividade.
import { api } from '../api.js?v=__V__';
import { h, icone, toast, confirmar, janela, ocupado, dataBR, plural } from '../ui.js?v=__V__';
import { materialAula } from '../material-aula.js?v=__V__';
import { exercicio } from './exercicio.js?v=__V__';
import { NOMES_PUBLICO } from './publico.js?v=__V__';

const TIPO = { escolha: 'Escolha', vocabulario: 'Vocabulário', lacuna: 'Lacuna', escuta: 'Escuta', ditado: 'Ditado', traduzir: 'Traduzir', ordenar: 'Ordenar', leitura: 'Leitura', fala: 'Fala', corrigir: 'Corrigir' };
const pctTxt = p => (p == null ? '–' : `${p}%`);
const quando = iso => (iso ? dataBR(iso) : '–');
const barra = (pct, cor = 'azul') => h('span', { class: 'barras-trilho', 'aria-hidden': 'true' }, h('span', { style: `transform:scaleX(${((pct || 0) / 100).toFixed(2)})`, class: `c-${cor}` }));

async function copiar(texto, msg) {
  try { await navigator.clipboard.writeText(texto); toast(msg, { tipo: 'ok' }); }
  catch { janela({ titulo: 'Copie daqui', corpo: h('input', { type: 'text', readonly: true, value: texto, class: 'campo-copiar' }) }); }
}

export async function telaTurma(el, { param, param2, ir }) {
  if (param2 === 'nova') return novaAtividade(el, param, ir);
  if (/^a\d+$/.test(param2 || '')) return detalheAtividade(el, param, param2.slice(1), ir);
  const d = await api(`/turmas/${param}`);
  const t = d.turma, link = location.origin + t.link;

  async function trocarCodigo() {
    if (!await confirmar({ titulo: 'Gerar um código novo?', texto: 'O código antigo deixa de funcionar. Quem já está na turma continua nela.', ok: 'Gerar código novo', cancelar: 'Cancelar' })) return;
    await api(`/turmas/${t.id}/codigo`, { metodo: 'POST' }); ir(`#/turma/${t.id}`);
  }
  async function apagar() {
    if (!await confirmar({ titulo: 'Apagar a turma?', texto: 'A turma, as atividades e as respostas dos alunos são apagadas de vez. Isso não dá para desfazer.', ok: 'Apagar a turma', cancelar: 'Cancelar', perigo: true })) return;
    await api(`/turmas/${t.id}`, { metodo: 'DELETE' }); toast('Turma apagada.'); ir('#/professor');
  }
  async function remover(al) {
    if (!await confirmar({ titulo: `Remover ${al.nome}?`, texto: 'As respostas dessa pessoa nas atividades da turma são apagadas. Ela pode entrar de novo com o código.', ok: 'Remover', cancelar: 'Cancelar', perigo: true })) return;
    await api(`/turmas/${t.id}/alunos/${al.id}`, { metodo: 'DELETE' }); ir(`#/turma/${t.id}`);
  }

  el.append(
    h('nav', { class: 'caminho-volta', 'aria-label': 'Caminho da turma' }, h('a', { href: '#/professor' }, icone('arrow-left'), 'Minhas turmas'), h('span', { 'aria-hidden': 'true' }, '/'), h('span', { 'aria-current': 'page' }, t.nome)),
    h('header', { class: 'cabeca c-menta' }, h('span', { class: 'bolha' }, icone('users-three')), h('div', {}, h('h1', {}, t.nome), h('p', { class: 'ajuda' }, `${plural(d.resumo.alunos, 'aluno', 'alunos')} · ${plural(d.resumo.atividades, 'atividade', 'atividades')}${d.resumo.pct != null ? ` · acerto geral ${d.resumo.pct}%` : ''}`))),
    h('details', { class: 'folha turma-convite', open: !d.alunos.length },
      h('summary', {}, 'Convidar alunos e ver código da turma'),
      h('p', { class: 'turma-codigo', 'aria-label': `Código da turma: ${t.codigo.split('').join(' ')}` }, t.codigo),
      h('p', { class: 'ajuda' }, 'O aluno entra em Turmas, toca em "Entrar com um código" e digita este código. Ou manda o link: quem abrir já cai na tela de entrada (se não tiver conta, cria uma antes).'),
      h('div', { class: 'linha-acoes' },
        h('button', { type: 'button', class: 'btn', on: { click: () => copiar(t.codigo, 'Código copiado.') } }, 'Copiar código'),
        h('button', { type: 'button', class: 'btn btn-sec', on: { click: () => copiar(link, 'Link copiado.') } }, 'Copiar link'),
        h('button', { type: 'button', class: 'btn btn-texto btn-peq', on: { click: trocarCodigo } }, 'Gerar código novo'))),
    h('section', { class: 'folha' },
      h('div', { class: 'linha-titulo' }, h('h2', {}, 'Atividades'), h('a', { class: 'btn btn-peq', href: `#/turma/${t.id}/nova` }, icone('plus'), 'Nova atividade')),
      d.atividades.length ? h('ul', { class: 'turma-lista' }, d.atividades.map(a => h('li', {}, h('a', { class: 'turma-item', href: `#/turma/${t.id}/a${a.id}` },
        h('span', {}, h('strong', {}, a.titulo), h('small', {}, `${plural(a.total, 'pergunta', 'perguntas')} · ${a.prazo ? 'até ' + dataBR(a.prazo) : 'sem prazo'}`)),
        h('span', { class: 'chip' }, `${a.concluiram}/${d.resumo.alunos} concluíram`), a.pctMedio != null ? h('span', { class: 'chip c-sol' }, `${a.pctMedio}% de acerto`) : null)))) :
        h('p', { class: 'ajuda' }, 'Nenhuma atividade ainda. Crie uma com perguntas do banco do app (ex.: banco, clínica, supermercado) e as suas.')),
    h('section', { class: 'folha' },
      h('h2', {}, 'Dificuldades da turma'),
      d.dificuldades.length ? h('ul', { class: 'barras' }, d.dificuldades.map(x => h('li', {},
        h('span', { class: 'barras-rotulo' }, x.nome, h('small', {}, ` · ${plural(x.alunosComErro, 'aluno errou', 'alunos erraram')}`)), h('strong', {}, `${x.pctErro}% de erro`), barra(x.pctErro, 'coral')))) :
        h('p', { class: 'ajuda' }, 'Quando os alunos responderem as atividades, aparecem aqui os pontos que a turma mais erra, para você reforçar em aula.')),
    h('section', { class: 'folha' },
      h('h2', {}, 'Alunos'),
      d.alunos.length ? h('div', { class: 'tabela-rolavel' }, h('table', { class: 'tabela-turma' },
        h('thead', {}, h('tr', {}, ['Aluno', 'Respondidas', 'Acerto', 'Atividades feitas', 'Última', ''].map(c => h('th', { scope: 'col' }, c)))),
        h('tbody', {}, d.alunos.map(al => h('tr', {},
          h('th', { scope: 'row' }, al.nome), h('td', {}, String(al.feitas)), h('td', { class: al.pct != null && al.pct < 50 ? 'tabela-alerta' : '' }, pctTxt(al.pct)), h('td', {}, `${al.atividadesFeitas}/${d.resumo.atividades}`), h('td', {}, quando(al.ultima)),
          h('td', {}, h('button', { type: 'button', class: 'btn btn-texto btn-peq', 'aria-label': `Remover ${al.nome}`, on: { click: () => remover(al) } }, icone('trash'))))))))
        : h('p', { class: 'ajuda' }, 'Ninguém entrou ainda. Compartilhe o código acima.')),
    h('div', { class: 'linha-acoes' },
      h('a', { class: 'btn btn-sec', href: '#/professor' }, 'Voltar às minhas turmas'),
      h('button', { type: 'button', class: 'btn btn-texto', on: { click: apagar } }, icone('trash'), 'Apagar turma')));
}

async function detalheAtividade(el, turmaId, aid, ir) {
  const d = await api(`/turmas/${turmaId}/atividades/${aid}`);
  const a = d.atividade;
  async function reutilizar() {
    const { professor } = await api('/turmas');
    const destino = h('select', { 'aria-label': 'Turma de destino' }, professor.map(t => h('option', { value: t.id }, t.nome)));
    const btn = h('button', { type: 'button', class: 'btn' }, 'Criar cópia da aula');
    const j = janela({ titulo: 'Reutilizar aula', corpo: h('div', {}, h('p', {}, 'O material e as questões serão copiados. As respostas dos alunos ficam na turma original.'), destino), acoes: [btn] });
    btn.addEventListener('click', async () => { ocupado(btn, true); try { const r = await api(`/turmas/${turmaId}/atividades/${aid}/duplicar`, { metodo: 'POST', corpo: { turmaId: Number(destino.value) } }); j.fechar(true); ir(`#/turma/${r.turmaId}/a${r.id}`); } catch (e) { toast(e.message); ocupado(btn, false); } });
  }
  async function apagar() {
    if (!await confirmar({ titulo: 'Apagar a atividade?', texto: 'As respostas dos alunos nela também são apagadas.', ok: 'Apagar atividade', cancelar: 'Cancelar', perigo: true })) return;
    await api(`/turmas/${turmaId}/atividades/${aid}`, { metodo: 'DELETE' }); ir(`#/turma/${turmaId}`);
  }
  el.append(
    h('nav', { class: 'caminho-volta', 'aria-label': 'Caminho da aula' }, h('a', { href: '#/professor' }, 'Minhas turmas'), h('span', { 'aria-hidden': 'true' }, '/'), h('a', { href: `#/turma/${turmaId}` }, d.turma.nome), h('span', { 'aria-hidden': 'true' }, '/'), h('span', { 'aria-current': 'page' }, 'Resultados da aula')),
    h('header', { class: 'cabeca c-menta' }, h('span', { class: 'bolha' }, icone('users-three')), h('div', {}, h('h1', {}, a.titulo), h('p', { class: 'ajuda' }, `${d.turma.nome} · ${a.prazo ? 'até ' + dataBR(a.prazo) : 'sem prazo'}`))),
    h('div', { class: 'status' }, [[d.resumo.concluiram, 'concluíram'], [d.resumo.naoComecaram, 'não começaram'], [pctTxt(d.resumo.pctMedio), 'acerto médio']].map(([n, r]) => h('div', { class: 'status__item' }, h('strong', {}, String(n)), h('span', {}, r)))),
    h('details', { class: 'folha' }, h('summary', {}, 'Material da aula'), materialAula(a.material)),
    h('section', { class: 'folha' },
      h('h2', {}, 'Por pergunta'),
      h('p', { class: 'ajuda' }, 'As perguntas com menos acerto são as que valem retomar em aula.'),
      h('ol', { class: 'barras' }, d.itens.map((it, k) => h('li', {},
        h('span', { class: 'barras-rotulo' }, `${k + 1}. ${it.resumo || TIPO[it.tipo]}`, h('small', {}, ` · ${TIPO[it.tipo] || it.tipo}· resposta: ${it.esperado}`)),
        h('strong', {}, it.respondentes ? `${it.pct}% (${it.certas}/${it.respondentes})` : 'sem respostas'), barra(it.pct, it.pct != null && it.pct < 50 ? 'coral' : 'azul'))))),
    h('section', { class: 'folha' },
      h('h2', {}, 'Por aluno'),
      d.alunos.length ? h('div', { class: 'tabela-rolavel' }, h('table', { class: 'tabela-turma' },
        h('thead', {}, h('tr', {}, ['Aluno', 'Respondidas', 'Acerto', 'Tempo', 'Situação'].map(c => h('th', { scope: 'col' }, c)))),
        h('tbody', {}, d.alunos.map(al => h('tr', {},
          h('th', { scope: 'row' }, al.nome), h('td', {}, `${al.feitas}/${al.total}`), h('td', { class: al.pct != null && al.pct < 50 ? 'tabela-alerta' : '' }, pctTxt(al.pct)), h('td', {}, al.feitas ? `${al.tempoMin} min` : '–'),
          h('td', {}, al.concluiu ? h('span', { class: 'chip chip-ok' }, icone('check'), 'concluiu') : al.feitas ? h('span', { class: 'chip c-sol' }, 'em andamento') : h('span', { class: 'chip' }, 'não começou'))))))) : h('p', { class: 'ajuda' }, 'Nenhum aluno na turma.')),
    h('div', { class: 'linha-acoes' }, h('a', { class: 'btn btn-sec', href: `#/turma/${turmaId}` }, 'Voltar à turma'), h('button', { type: 'button', class: 'btn btn-sec', on: { click: reutilizar } }, icone('arrow-counter-clockwise'), 'Reutilizar em outra turma'), h('button', { type: 'button', class: 'btn btn-texto', on: { click: apagar } }, icone('trash'), 'Apagar atividade')));
}

// ---------- criar atividade ----------
async function novaAtividade(el, turmaId, ir) {
  const [{ missoes }, { turma }] = await Promise.all([api('/professor/banco'), api(`/turmas/${turmaId}`)]);
  const escolhidas = new Set();          // ids do banco
  const proprias = [];                   // perguntas escritas pelo professor
  const resumo = h('p', { class: 'chip c-azul', 'aria-live': 'polite' });
  const atualizar = () => { resumo.textContent = `${plural(escolhidas.size + proprias.length, 'pergunta escolhida', 'perguntas escolhidas')}`; };
  const titulo = h('input', { type: 'text', id: 'at-titulo', maxlength: 100, placeholder: 'Ex.: Revisão: no banco e na clínica' });
  const descricao = h('textarea', { id: 'at-desc', rows: 2, maxlength: 600, placeholder: 'Opcional: o que os alunos devem lembrar antes de começar' });
  const prazo = h('input', { type: 'date', id: 'at-prazo' });
  const tema = h('input', { type: 'text', id: 'at-tema', maxlength: 100, placeholder: 'Ex.: alimentação, simple present, interpretação de texto' });
  const explicacao = h('textarea', { id: 'at-explicacao', rows: 4, maxlength: 4000, placeholder: 'Explique em português o conteúdo que os alunos vão praticar.' });
  const leitura = h('textarea', { id: 'at-leitura', rows: 5, maxlength: 6000, placeholder: 'Texto em inglês para leitura e interpretação.' });
  const traducao = h('textarea', { id: 'at-traducao', rows: 3, maxlength: 6000, placeholder: 'Tradução de apoio, disponível para consulta.' });
  const vocabulario = h('textarea', { id: 'at-vocabulario', rows: 4, maxlength: 8000, placeholder: 'Uma expressão por linha: garden = jardim\nshare = compartilhar' });
  const busca = h('input', { type: 'search', placeholder: 'Buscar assunto, palavra ou estrutura...', 'aria-label': 'Buscar no banco de questões' });
  const faixa = h('select', { 'aria-label': 'Público da aula' }, h('option', { value: 'todas' }, 'Público misto'), Object.entries(NOMES_PUBLICO).map(([id, nome]) => h('option', { value: id }, nome))); faixa.value = turma.faixa || 'todas';
  const nivel = h('select', { 'aria-label': 'Nível da aula' }, ['A1', 'A2', 'B1', 'B2', 'C1'].map(n => h('option', { value: n }, n))); nivel.value = turma.nivel || 'A1';
  const tipoFiltro = h('select', { 'aria-label': 'Tipo de questão' }, h('option', { value: '' }, 'Todos os tipos'), Object.entries(TIPO).map(([id, nome]) => h('option', { value: id }, nome)));
  const nivelBanco = h('select', { 'aria-label': 'Nível das questões do banco' }, h('option', { value: '' }, 'Todos os níveis'), ['A1', 'A2', 'B1', 'B2', 'C1'].map(n => h('option', { value: n }, n))); nivelBanco.value = nivel.value;
  const payload = () => ({ titulo: titulo.value, descricao: descricao.value, prazo: prazo.value || null, tema: tema.value, faixa: faixa.value, nivel: nivel.value, banco: [...escolhidas], proprias,
    material: { explicacao: explicacao.value, texto: leitura.value, traducao: traducao.value, vocab: vocabulario.value.split('\n').filter(l => l.trim()).map(l => { const i = l.indexOf('='); if (i < 1 || !l.slice(i + 1).trim()) throw new Error('No vocabulário, use uma expressão por linha: inglês = significado.'); return { en: l.slice(0, i).trim(), pt: l.slice(i + 1).trim() }; }) } });

  const bancoUI = h('div', { class: 'banco-lista' });
  const desenharBanco = () => {
    const termo = busca.value.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
    const grupos = missoes.filter(m => (!faixa.value || faixa.value === 'todas' || m.faixa === 'todas' || m.faixa === faixa.value) && (!nivelBanco.value || m.nivel === nivelBanco.value)).map(m => ({ ...m, exercicios: m.exercicios.filter(e => (!tipoFiltro.value || (tipoFiltro.value === 'vocabulario' ? e.habilidade === 'vocabulario' : e.tipo === tipoFiltro.value)) && `${m.titulo} ${m.tema} ${e.resumo} ${e.tag || ''}`.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').includes(termo)) })).filter(m => m.exercicios.length);
    bancoUI.replaceChildren(grupos.length ? grupos.map(m => {
    const marcar = (ids, sim) => ids.forEach(id => (sim ? escolhidas.add(id) : escolhidas.delete(id)));
    const caixas = m.exercicios.map(e => h('label', { class: 'banco-item' }, h('input', { type: 'checkbox', checked: escolhidas.has(e.id), on: { change: ev => { marcar([e.id], ev.target.checked); atualizar(); } } }), h('span', {}, h('span', { class: 'chip chip-neutro' }, e.habilidade === 'vocabulario' ? 'Vocabulário' : TIPO[e.tipo] || e.tipo), ' ', e.resumo)));
    const todas = h('button', { type: 'button', class: 'btn btn-texto btn-peq', on: { click: () => { const sim = !caixas.every(c => c.querySelector('input').checked); caixas.forEach(c => { c.querySelector('input').checked = sim; }); marcar(m.exercicios.map(e => e.id), sim); atualizar(); } } }, 'Marcar todas');
    const modelo = h('button', { type: 'button', class: 'btn btn-sec btn-peq', on: { click: () => {
      const original = missoes.find(x => x.id === m.id);
      if (!titulo.value) titulo.value = original.titulo;
      tema.value = original.tema; explicacao.value = original.material.explicacao; leitura.value = original.material.texto; traducao.value = original.material.traducao; vocabulario.value = original.material.vocab.map(v => `${v.en} = ${v.pt}`).join('\n');
      original.exercicios.forEach(e => escolhidas.add(e.id)); atualizar(); desenharBanco(); toast('Material e questões adicionados. Você pode editar e desmarcar questões.');
    } } }, icone('book-open-text'), 'Usar capítulo como modelo');
    return h('details', { class: 'banco-missao' }, h('summary', {}, h('strong', {}, m.titulo), h('small', {}, ` · ${m.nivel} · ${NOMES_PUBLICO[m.faixa] || 'Todos os públicos'} · ${plural(m.exercicios.length, 'questão', 'questões')}`)), h('div', { class: 'linha-acoes' }, todas, modelo), caixas);
    }) : h('p', { class: 'ajuda' }, 'Nenhuma questão com esses filtros. Ajuste o nível, o público ou o tipo.'));
  };
  for (const f of [faixa, nivelBanco, tipoFiltro]) f.addEventListener('change', desenharBanco);
  busca.addEventListener('input', desenharBanco);
  const propriasUI = h('ul', { class: 'turma-lista' });
  const desenharProprias = () => propriasUI.replaceChildren(proprias.map((p, k) => h('li', { class: 'turma-item' }, h('span', {}, h('strong', {}, TIPO[p.tipo]), h('small', {}, p.enunciado || p.frase || p.pt)),
    h('button', { type: 'button', class: 'btn btn-texto btn-peq', 'aria-label': 'Remover pergunta', on: { click: () => { proprias.splice(k, 1); desenharProprias(); atualizar(); } } }, icone('trash')))));

  function escreverPergunta() {
    const tipo = h('select', { id: 'pp-tipo' }, [['escolha', 'Escolha (alternativas)'], ['vocabulario', 'Expansão de vocabulário'], ['leitura', 'Leitura e interpretação'], ['lacuna', 'Lacuna (completar a frase)'], ['traduzir', 'Traduzir (do português para o inglês)']].map(([v, r]) => h('option', { value: v }, r)));
    const campos = h('div', {});
    const msg = h('p', { class: 'erro-campo', 'aria-live': 'polite' });
    const campo = (id, rotulo, ajuda, tag = 'input', extra = {}) => { const c = h(tag, { id, maxlength: 220, ...(tag === 'textarea' ? { rows: 3 } : { type: 'text' }), ...extra }); return [h('div', { class: 'campo' }, h('label', { for: id }, rotulo), c, ajuda ? h('small', {}, ajuda) : null), c]; };
    const montar = () => {
      campos.replaceChildren();
      const t = tipo.value;
      if (['escolha', 'vocabulario', 'leitura'].includes(t)) {
        const [d1, enun] = campo('pp-enun', t === 'leitura' ? 'Pergunta sobre o texto' : 'Pergunta', null);
        const [textoUI, textoLeitura] = campo('pp-texto', 'Texto em inglês', 'O aluno pode ouvir e consultar as palavras.', 'textarea', { maxlength: 6000, rows: 5 });
        const alts = Array.from({ length: 4 }, (_, k) => campo(`pp-alt${k}`, `Alternativa ${k + 1}${k < 2 ? '' : ' (opcional)'}`, null));
        const sel = h('select', { id: 'pp-certa' }, [0, 1, 2, 3].map(k => h('option', { value: k }, `Alternativa ${k + 1}`)));
        const [d2, expl] = campo('pp-expl', 'Explique por que a resposta está correta', 'Aparece após a resposta, inclusive quando o aluno acerta.', 'textarea', { maxlength: 300 });
        const [d3, pista] = campo('pp-dica', 'Dica (opcional)', 'Ajuda o aluno a pensar antes de responder.', 'textarea', { maxlength: 300 });
        campos.append(t === 'leitura' ? textoUI : null, d1, ...alts.map(a => a[0]), h('div', { class: 'campo' }, h('label', { for: 'pp-certa' }, 'Qual é a certa?'), sel), d2, d3);
        campos._ler = () => { const preenchidas = alts.map((a, i) => ({ texto: a[1].value.trim(), i })).filter(a => a.texto); return { tipo: t, enunciado: enun.value, ...(t === 'leitura' ? { texto: textoLeitura.value, pergunta: enun.value } : {}), opcoes: preenchidas.map(a => a.texto), resposta: preenchidas.findIndex(a => a.i === Number(sel.value)), explica: expl.value, ...(pista.value.trim() ? { dica: pista.value } : {}) }; };
        campos._conferir = p => { if (p.resposta < 0) throw new Error('A alternativa certa precisa estar preenchida.'); if (p.tipo === 'leitura' && !p.texto.trim()) throw new Error('Acrescente o texto de leitura.'); };
      } else if (t === 'lacuna') {
        const [d1, frase] = campo('pp-frase', 'Frase com a lacuna', 'Use três sublinhados no lugar da palavra que falta: I ___ to school every day.');
        const [d2, resp] = campo('pp-resp', 'Respostas aceitas', 'Separe várias com vírgula: go');
        const [d3, expl] = campo('pp-expl', 'Explicação (opcional)', null);
        campos.append(d1, d2, d3);
        campos._ler = () => ({ tipo: 'lacuna', frase: frase.value, resposta: resp.value.split(',').map(x => x.trim()).filter(Boolean), explica: expl.value });
      } else {
        const [d1, pt] = campo('pp-pt', 'Frase em português', null);
        const [d2, ac] = campo('pp-ac', 'Respostas aceitas em inglês', 'Uma por linha, todas as formas corretas que você aceita.', 'textarea');
        const [d3, expl] = campo('pp-expl', 'Explicação (opcional)', null);
        campos.append(d1, d2, d3);
        campos._ler = () => ({ tipo: 'traduzir', pt: pt.value, aceitas: ac.value.split('\n').map(x => x.trim()).filter(Boolean), explica: expl.value });
      }
    };
    tipo.addEventListener('change', montar); montar();
    const ok = h('button', { type: 'button', class: 'btn' }, 'Adicionar pergunta');
    const j = janela({ titulo: 'Escrever uma pergunta', larga: true, corpo: h('div', {}, h('div', { class: 'campo' }, h('label', { for: 'pp-tipo' }, 'Tipo'), tipo), campos, msg), acoes: [ok] });
    ok.addEventListener('click', () => {
      try {
        const p = campos._ler();
        if (['escolha', 'vocabulario', 'leitura'].includes(p.tipo) && (p.opcoes.length < 2 || !p.enunciado.trim())) throw new Error('Escreva a pergunta e pelo menos 2 alternativas.');
        if (['escolha', 'vocabulario', 'leitura'].includes(p.tipo)) campos._conferir(p);
        if (p.tipo === 'lacuna' && (!/___/.test(p.frase) || !p.resposta.length)) throw new Error('Escreva a frase com ___ e pelo menos uma resposta aceita.');
        if (p.tipo === 'traduzir' && (!p.pt.trim() || !p.aceitas.length)) throw new Error('Escreva a frase em português e pelo menos uma resposta aceita.');
        if (!p.explica.trim()) delete p.explica;
        proprias.push(p); desenharProprias(); atualizar(); j.fechar(true);
      } catch (e) { msg.textContent = e.message; }
    });
  }

  const previa = h('button', { type: 'button', class: 'btn btn-sec' }, icone('eye'), 'Pré-visualizar aula');
  previa.addEventListener('click', async () => {
    ocupado(previa, true);
    try {
      const aula = payload();
      const r = await api('/professor/previa', { metodo: 'POST', corpo: aula });
      janela({ titulo: titulo.value || 'Prévia da aula', larga: true, corpo: h('div', { class: 'previa-aula' }, h('p', { class: 'chip' }, 'Prévia: as respostas aqui não contam no progresso'), materialAula(r.material), r.itens.map((ex, i) => h('details', { class: 'folha' }, h('summary', {}, `Questão ${i + 1}: ${TIPO[ex.tipo]}`), exercicio(ex, { responder: async resposta => (await api('/professor/previa', { metodo: 'POST', corpo: { ...aula, respostas: { [ex.id]: resposta } } })).correcoes[ex.id], aoProximo: () => {}, rotuloProximo: 'Resposta conferida' })))) });
    } catch (e) { toast(e.message, { tipo: 'erro' }); } finally { ocupado(previa, false); }
  });
  const publicar = h('button', { type: 'button', class: 'btn' }, 'Publicar aula');
  publicar.addEventListener('click', async () => {
    ocupado(publicar, true);
    try {
      await api(`/turmas/${turmaId}/atividades`, { metodo: 'POST', corpo: payload() });
      toast('Atividade publicada. Os alunos já a veem em Turmas.', { tipo: 'ok' }); ir(`#/turma/${turmaId}`);
    } catch (e) { toast(e.message, { tipo: 'erro' }); ocupado(publicar, false); }
  });

  el.append(
    h('a', { class: 'btn btn-texto btn-peq', href: `#/turma/${turmaId}` }, icone('caret-left'), 'Voltar à turma'),
    h('header', { class: 'cabeca c-menta' }, h('span', { class: 'bolha' }, icone('pencil-simple')), h('div', {}, h('h1', {}, 'Montar aula'), h('p', { class: 'ajuda' }, 'Organize o material, escolha as questões e veja a prévia antes de publicar.'))),
    h('section', { class: 'folha' },
      h('h2', {}, '1. Conteúdo e turma'),
      h('div', { class: 'campo' }, h('label', { for: 'at-titulo' }, 'Título'), titulo),
      h('div', { class: 'campo' }, h('label', { for: 'at-tema' }, 'Conteúdo específico'), tema),
      h('div', { class: 'biblioteca-filtros' }, h('label', {}, 'Público', faixa), h('label', {}, 'Nível de inglês', nivel)),
      h('div', { class: 'campo' }, h('label', { for: 'at-desc' }, 'Descrição'), descricao),
      h('div', { class: 'campo' }, h('label', { for: 'at-prazo' }, 'Prazo (opcional)'), prazo)),
    h('details', { class: 'folha' }, h('summary', {}, '2. Material para estudar antes de responder (opcional)'), h('p', { class: 'ajuda' }, 'Use este espaço como uma página de livro didático: explicação, palavras e texto de leitura.'),
      h('div', { class: 'campo' }, h('label', { for: 'at-explicacao' }, 'Explicação em português'), explicacao), h('div', { class: 'campo' }, h('label', { for: 'at-leitura' }, 'Texto de leitura em inglês'), leitura), h('div', { class: 'campo' }, h('label', { for: 'at-traducao' }, 'Tradução de apoio'), traducao), h('div', { class: 'campo' }, h('label', { for: 'at-vocabulario' }, 'Vocabulário: inglês = significado'), vocabulario)),
    h('section', { class: 'folha' }, h('h2', {}, '3. Questões do banco'), h('p', { class: 'ajuda' }, 'Busque por conteúdo, tipo e nível. O público escolhido acima também filtra os exemplos. Ou use um capítulo completo como modelo.'), h('div', { class: 'biblioteca-filtros' }, busca, nivelBanco, tipoFiltro), bancoUI),
    h('section', { class: 'folha' }, h('h2', {}, 'Questões que você escreveu'), propriasUI, h('div', { class: 'linha-acoes' }, h('button', { type: 'button', class: 'btn btn-sec', on: { click: escreverPergunta } }, icone('plus'), 'Escrever uma questão'))),
    h('div', { class: 'barra-acao barra-acao--fixa' }, h('div', { class: 'barra-acao__in' }, resumo, h('div', { class: 'editor-acoes' }, previa, publicar))));
  atualizar(); desenharProprias(); desenharBanco();
}
