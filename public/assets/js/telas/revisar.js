// Flashcards com repetição espaçada. Errar só traz o cartão de volta mais cedo.
import { api } from '../api.js?v=__V__';
import { h, icone, falar, toast, formulario, confirmar, plural } from '../ui.js?v=__V__';
import { nomeConquista } from './hoje.js?v=__V__';

const TIPO = { expressao: 'Expressão', erro: 'Do seu erro', palavra: 'Palavra' };

export async function telaRevisar(el) {
  const caixa = h('div', { class: 'revisar' });
  el.append(caixa);
  let fila = [], feitos = 0, total = 0;

  async function carregar() {
    const r = await api('/cartoes/revisar');
    fila = r.cartoes; total = r.total; feitos = 0;
    proximo();
  }

  function vazio() {
    caixa.replaceChildren(
      h('header', { class: 'cabeca' }, h('h1', {}, 'Revisar'), h('p', { class: 'bilhete' }, feitos ? `${plural(feitos, 'cartão revisado', 'cartões revisados')}. Até a próxima!` : 'Nada para revisar agora.')),
      h('div', { class: 'folha vazio' }, h('p', {}, 'Os cartões voltam no dia certo para você não esquecer. Eles nascem das lições, dos seus erros nas conversas e dos seus materiais.'),
        h('div', { class: 'linha-acoes' }, h('a', { class: 'btn btn-sec', href: '#/hoje' }, 'Voltar para hoje'), h('button', { class: 'btn btn-sec', on: { click: novo } }, icone('plus'), 'Criar um cartão'), h('button', { class: 'btn btn-texto', on: { click: gerenciar } }, 'Ver todos os cartões'))));
  }

  async function novo() {
    const ok = await formulario({ titulo: 'Novo cartão', enviar: 'Criar', campos: [
      { nome: 'frente', rotulo: 'Em inglês', obrigatorio: true, max: 200, placeholder: 'to follow up' },
      { nome: 'verso', rotulo: 'Significado', obrigatorio: true, max: 200, placeholder: 'dar seguimento' },
      { nome: 'exemplo', rotulo: 'Exemplo (opcional)', max: 300, placeholder: "I'll follow up by email." }],
      aoEnviar: v => api('/cartoes', { metodo: 'POST', corpo: v }) });
    if (ok) toast('Cartão criado. Ele aparece na revisão de hoje.', { tipo: 'ok' });
  }

  async function gerenciar() {
    const { cartoes } = await api('/cartoes');
    caixa.replaceChildren(h('header', { class: 'cabeca' }, h('h1', {}, 'Seus cartões'), h('p', { class: 'ajuda' }, `${cartoes.length} no total. Corrija ou apague o que não fizer sentido.`)),
      h('ul', { class: 'lista-cartoes' }, cartoes.map(c => h('li', { class: 'folha' },
        h('div', {}, h('strong', { lang: 'en' }, c.frente), h('p', {}, c.verso), c.exemplo ? h('em', { lang: 'en' }, c.exemplo) : null, h('p', { class: 'ajuda' }, `${TIPO[c.tipo] || c.tipo} · volta em ${c.vence_em.split('-').reverse().join('/')}`)),
        h('div', { class: 'linha-acoes' },
          h('button', { class: 'btn btn-texto btn-peq', on: { click: async () => { if (await formulario({ titulo: 'Corrigir cartão', campos: [{ nome: 'frente', rotulo: 'Frente', valor: c.frente, obrigatorio: true }, { nome: 'verso', rotulo: 'Verso', valor: c.verso, obrigatorio: true }, { nome: 'exemplo', rotulo: 'Exemplo', valor: c.exemplo || '' }], aoEnviar: v => api('/cartoes/' + c.id, { metodo: 'PATCH', corpo: v }) })) gerenciar(); } } }, icone('pencil-simple'), 'Corrigir'),
          h('button', { class: 'btn btn-texto btn-peq', on: { click: async () => { if (await confirmar({ titulo: 'Apagar este cartão?', texto: c.frente, ok: 'Apagar', perigo: true })) { await api('/cartoes/' + c.id, { metodo: 'DELETE' }); gerenciar(); } } } }, icone('trash'), 'Apagar'))))),
      h('div', { class: 'linha-acoes' }, h('button', { class: 'btn', on: { click: novo } }, icone('plus'), 'Novo cartão'), h('button', { class: 'btn btn-sec', on: { click: carregar } }, 'Voltar à revisão')));
  }

  function proximo() {
    const c = fila.shift();
    if (!c) return vazio();
    const t0 = performance.now();
    const producao = c.modo === 'producao';
    const frente = producao ? c.verso : c.frente;
    const verso = producao ? c.frente : c.verso;
    const textoIngles = c.tipo === 'erro' ? c.verso : c.frente;
    const cartao = h('div', { class: 'flashcard', tabindex: '-1' },
      h('div', { class: 'flashcard__face flashcard__frente' },
        h('p', { class: 'chip chip-neutro' }, TIPO[c.tipo] || 'Cartão', producao ? ' · diga em inglês' : ''),
        h('p', { class: 'flashcard__texto', lang: producao ? null : 'en' }, frente),
        producao ? null : h('button', { type: 'button', class: 'btn btn-sec btn-peq', on: { click: e => { e.stopPropagation(); falar(textoIngles); } } }, icone('speaker-high'), 'Ouvir')),
      h('div', { class: 'flashcard__face flashcard__verso' },
        h('p', { class: 'flashcard__texto', lang: producao ? 'en' : null }, verso),
        c.exemplo ? h('p', { class: 'exemplo', lang: 'en' }, c.exemplo) : null,
        c.nota ? h('p', { class: 'ajuda' }, c.nota) : null,
        h('button', { type: 'button', class: 'btn btn-sec btn-peq', on: { click: e => { e.stopPropagation(); falar(c.exemplo || textoIngles); } } }, icone('speaker-high'), 'Ouvir')));
    const notas = h('div', { class: 'notas', hidden: true, role: 'group', 'aria-label': 'Como foi?' },
      [[0, 'Não lembrei'], [3, 'Difícil'], [4, 'Bom'], [5, 'Fácil']].map(([n, r]) => h('button', { type: 'button', class: 'btn ' + (n === 4 ? '' : 'btn-sec'), on: { click: () => avaliar(n) } }, r)));
    const virar = h('button', { type: 'button', class: 'btn btn-bloco', on: { click: () => { cartao.classList.add('virado'); virar.hidden = true; notas.hidden = false; notas.querySelector('.btn:not(.btn-sec)').focus(); if (!producao) falar(textoIngles); } } }, 'Mostrar resposta');
    async function avaliar(n) {
      notas.querySelectorAll('button').forEach(b => { b.disabled = true; });
      try {
        const r = await api(`/cartoes/${c.id}/revisar`, { metodo: 'POST', corpo: { nota: n, tempoMs: Math.round(performance.now() - t0) } });
        feitos++;
        for (const x of r.conquistas || []) toast('Conquista: ' + nomeConquista(x), { tipo: 'ok' });
        if (n === 0) fila.push(c);   // volta ainda hoje, no fim da fila
        proximo();
      } catch (e) { toast(e.message, { tipo: 'erro' }); notas.querySelectorAll('button').forEach(b => { b.disabled = false; }); }
    }
    caixa.replaceChildren(
      h('header', { class: 'cabeca' }, h('h1', {}, 'Revisar'), h('p', { class: 'ajuda' }, `${feitos} feitos · ${fila.length + 1} na fila${total > 30 ? ` (de ${total})` : ''}`)),
      cartao, virar, notas,
      h('p', { class: 'ajuda centro' }, 'Seja honesto na nota: ela decide quando o cartão volta.'));
    cartao.focus({ preventScroll: true });
  }

  await carregar();
}
