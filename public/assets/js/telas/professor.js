// Turmas, lado do professor: painel da turma (código, atividades, alunos, dificuldades), criação de atividade
// (perguntas do banco do app + perguntas próprias) e o resultado de cada atividade.
import { api } from '../api.js?v=__V__';
import { h, icone, toast, confirmar, janela, ocupado, dataBR, plural } from '../ui.js?v=__V__';

const TIPO = { escolha: 'Escolha', lacuna: 'Lacuna', escuta: 'Escuta', ditado: 'Ditado', traduzir: 'Traduzir', ordenar: 'Ordenar', leitura: 'Leitura', fala: 'Fala', corrigir: 'Corrigir' };
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
    await api(`/turmas/${t.id}`, { metodo: 'DELETE' }); toast('Turma apagada.'); ir('#/turmas');
  }
  async function remover(al) {
    if (!await confirmar({ titulo: `Remover ${al.nome}?`, texto: 'As respostas dessa pessoa nas atividades da turma são apagadas. Ela pode entrar de novo com o código.', ok: 'Remover', cancelar: 'Cancelar', perigo: true })) return;
    await api(`/turmas/${t.id}/alunos/${al.id}`, { metodo: 'DELETE' }); ir(`#/turma/${t.id}`);
  }

  el.append(
    h('header', { class: 'cabeca c-menta' }, h('span', { class: 'bolha' }, icone('users-three')), h('div', {}, h('h1', {}, t.nome), h('p', { class: 'ajuda' }, `${plural(d.resumo.alunos, 'aluno', 'alunos')} · ${plural(d.resumo.atividades, 'atividade', 'atividades')}${d.resumo.pct != null ? ` · acerto geral ${d.resumo.pct}%` : ''}`))),
    h('section', { class: 'folha turma-convite' },
      h('h2', {}, 'Convide seus alunos'),
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
      h('a', { class: 'btn btn-sec', href: '#/turmas' }, 'Voltar'),
      h('button', { type: 'button', class: 'btn btn-texto', on: { click: apagar } }, icone('trash'), 'Apagar turma')));
}

async function detalheAtividade(el, turmaId, aid, ir) {
  const d = await api(`/turmas/${turmaId}/atividades/${aid}`);
  const a = d.atividade;
  async function apagar() {
    if (!await confirmar({ titulo: 'Apagar a atividade?', texto: 'As respostas dos alunos nela também são apagadas.', ok: 'Apagar atividade', cancelar: 'Cancelar', perigo: true })) return;
    await api(`/turmas/${turmaId}/atividades/${aid}`, { metodo: 'DELETE' }); ir(`#/turma/${turmaId}`);
  }
  el.append(
    h('header', { class: 'cabeca c-menta' }, h('span', { class: 'bolha' }, icone('users-three')), h('div', {}, h('h1', {}, a.titulo), h('p', { class: 'ajuda' }, `${d.turma.nome} · ${a.prazo ? 'até ' + dataBR(a.prazo) : 'sem prazo'}`))),
    h('div', { class: 'status' }, [[d.resumo.concluiram, 'concluíram'], [d.resumo.naoComecaram, 'não começaram'], [pctTxt(d.resumo.pctMedio), 'acerto médio']].map(([n, r]) => h('div', { class: 'status__item' }, h('strong', {}, String(n)), h('span', {}, r)))),
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
    h('div', { class: 'linha-acoes' }, h('a', { class: 'btn btn-sec', href: `#/turma/${turmaId}` }, 'Voltar à turma'), h('button', { type: 'button', class: 'btn btn-texto', on: { click: apagar } }, icone('trash'), 'Apagar atividade')));
}

// ---------- criar atividade ----------
async function novaAtividade(el, turmaId, ir) {
  const { missoes } = await api('/professor/banco');
  const escolhidas = new Set();          // ids do banco
  const proprias = [];                   // perguntas escritas pelo professor
  const resumo = h('p', { class: 'chip c-azul', 'aria-live': 'polite' });
  const atualizar = () => { resumo.textContent = `${plural(escolhidas.size + proprias.length, 'pergunta escolhida', 'perguntas escolhidas')}`; };
  const titulo = h('input', { type: 'text', id: 'at-titulo', maxlength: 100, placeholder: 'Ex.: Revisão: no banco e na clínica' });
  const descricao = h('textarea', { id: 'at-desc', rows: 2, maxlength: 600, placeholder: 'Opcional: o que os alunos devem lembrar antes de começar' });
  const prazo = h('input', { type: 'date', id: 'at-prazo' });

  const bancoUI = h('div', { class: 'banco-lista' }, missoes.map(m => {
    const marcar = (ids, sim) => ids.forEach(id => (sim ? escolhidas.add(id) : escolhidas.delete(id)));
    const caixas = m.exercicios.map(e => h('label', { class: 'banco-item' }, h('input', { type: 'checkbox', on: { change: ev => { marcar([e.id], ev.target.checked); atualizar(); } } }), h('span', {}, h('span', { class: 'chip chip-neutro' }, TIPO[e.tipo] || e.tipo), ' ', e.resumo)));
    const todas = h('button', { type: 'button', class: 'btn btn-texto btn-peq', on: { click: () => { const sim = !caixas.every(c => c.querySelector('input').checked); caixas.forEach(c => { c.querySelector('input').checked = sim; }); marcar(m.exercicios.map(e => e.id), sim); atualizar(); } } }, 'Marcar todas');
    return h('details', { class: 'banco-missao' }, h('summary', {}, h('strong', {}, m.titulo), h('small', {}, ` · ${plural(m.exercicios.length, 'pergunta', 'perguntas')}`)), todas, caixas);
  }));
  const propriasUI = h('ul', { class: 'turma-lista' });
  const desenharProprias = () => propriasUI.replaceChildren(proprias.map((p, k) => h('li', { class: 'turma-item' }, h('span', {}, h('strong', {}, TIPO[p.tipo]), h('small', {}, p.enunciado || p.frase || p.pt)),
    h('button', { type: 'button', class: 'btn btn-texto btn-peq', 'aria-label': 'Remover pergunta', on: { click: () => { proprias.splice(k, 1); desenharProprias(); atualizar(); } } }, icone('trash')))));

  function escreverPergunta() {
    const tipo = h('select', { id: 'pp-tipo' }, [['escolha', 'Escolha (alternativas)'], ['lacuna', 'Lacuna (completar a frase)'], ['traduzir', 'Traduzir (do português para o inglês)']].map(([v, r]) => h('option', { value: v }, r)));
    const campos = h('div', {});
    const msg = h('p', { class: 'erro-campo', 'aria-live': 'polite' });
    const campo = (id, rotulo, ajuda, tag = 'input', extra = {}) => { const c = h(tag, { id, maxlength: 220, ...(tag === 'textarea' ? { rows: 3 } : { type: 'text' }), ...extra }); return [h('div', { class: 'campo' }, h('label', { for: id }, rotulo), c, ajuda ? h('small', {}, ajuda) : null), c]; };
    const montar = () => {
      campos.replaceChildren();
      const t = tipo.value;
      if (t === 'escolha') {
        const [d1, enun] = campo('pp-enun', 'Pergunta', null);
        const alts = Array.from({ length: 4 }, (_, k) => campo(`pp-alt${k}`, `Alternativa ${k + 1}${k < 2 ? '' : ' (opcional)'}`, null));
        const sel = h('select', { id: 'pp-certa' }, [0, 1, 2, 3].map(k => h('option', { value: k }, `Alternativa ${k + 1}`)));
        const [d2, expl] = campo('pp-expl', 'Explicação (opcional)', 'Aparece para o aluno depois da resposta.');
        campos.append(d1, ...alts.map(a => a[0]), h('div', { class: 'campo' }, h('label', { for: 'pp-certa' }, 'Qual é a certa?'), sel), d2);
        campos._ler = () => ({ tipo: 'escolha', enunciado: enun.value, opcoes: alts.map(a => a[1].value.trim()).filter(Boolean), resposta: Number(sel.value), explica: expl.value });
        campos._conferir = p => { if (Number(sel.value) >= p.opcoes.length || !alts[Number(sel.value)][1].value.trim()) throw new Error('A alternativa certa precisa estar preenchida.'); };
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
        if (p.tipo === 'escolha' && (p.opcoes.length < 2 || !p.enunciado.trim())) throw new Error('Escreva a pergunta e pelo menos 2 alternativas.');
        if (p.tipo === 'escolha') campos._conferir(p);
        if (p.tipo === 'lacuna' && (!/___/.test(p.frase) || !p.resposta.length)) throw new Error('Escreva a frase com ___ e pelo menos uma resposta aceita.');
        if (p.tipo === 'traduzir' && (!p.pt.trim() || !p.aceitas.length)) throw new Error('Escreva a frase em português e pelo menos uma resposta aceita.');
        if (!p.explica.trim()) delete p.explica;
        proprias.push(p); desenharProprias(); atualizar(); j.fechar(true);
      } catch (e) { msg.textContent = e.message; }
    });
  }

  const publicar = h('button', { type: 'button', class: 'btn btn-bloco' }, 'Publicar atividade');
  publicar.addEventListener('click', async () => {
    ocupado(publicar, true);
    try {
      await api(`/turmas/${turmaId}/atividades`, { metodo: 'POST', corpo: { titulo: titulo.value, descricao: descricao.value, prazo: prazo.value || null, banco: [...escolhidas], proprias } });
      toast('Atividade publicada. Os alunos já a veem em Turmas.', { tipo: 'ok' }); ir(`#/turma/${turmaId}`);
    } catch (e) { toast(e.message, { tipo: 'erro' }); ocupado(publicar, false); }
  });

  el.append(
    h('header', { class: 'cabeca c-menta' }, h('span', { class: 'bolha' }, icone('pencil-simple')), h('div', {}, h('h1', {}, 'Nova atividade'), h('p', { class: 'ajuda' }, 'Escolha perguntas do banco do app e escreva as suas.'))),
    h('section', { class: 'folha' },
      h('div', { class: 'campo' }, h('label', { for: 'at-titulo' }, 'Título'), titulo),
      h('div', { class: 'campo' }, h('label', { for: 'at-desc' }, 'Descrição'), descricao),
      h('div', { class: 'campo' }, h('label', { for: 'at-prazo' }, 'Prazo (opcional)'), prazo)),
    h('section', { class: 'folha' }, h('h2', {}, 'Perguntas do banco do app'), h('p', { class: 'ajuda' }, 'Abra um assunto e marque as perguntas que quer na atividade. Você vê as respostas certas depois, no resultado.'), bancoUI),
    h('section', { class: 'folha' }, h('h2', {}, 'Suas perguntas'), propriasUI, h('div', { class: 'linha-acoes' }, h('button', { type: 'button', class: 'btn btn-sec', on: { click: escreverPergunta } }, icone('plus'), 'Escrever uma pergunta'))),
    h('div', { class: 'barra-acao barra-acao--fixa' }, h('div', { class: 'barra-acao__in' }, resumo, publicar)));
  atualizar(); desenharProprias();
}
