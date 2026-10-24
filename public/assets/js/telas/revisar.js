// Flashcards com repetição espaçada. Errar só traz o cartão de volta mais cedo.
import { api } from '../api.js?v=__V__';
import { h, icone, falar, toast, formulario, confirmar, plural } from '../ui.js?v=__V__';
import { nomeConquista } from './hoje.js?v=__V__';
import { lou, louFala } from '../diversao.js?v=__V__';


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
      h('header', { class: 'cabeca c-sol' }, h('span', { class: 'bolha' }, icone('cards')), h('div', {}, h('h1', {}, 'Revisar'))),
      louFala(feitos ? 'festa' : 'feliz', h('p', {}, feitos ? `${plural(feitos, 'cartão revisado', 'cartões revisados')}. Até a próxima!` : 'Nada para revisar agora. Você está em dia!')),
      h('div', { class: 'folha vazio' }, h('p', {}, 'Os cartões voltam no dia certo para você não esquecer. Eles nascem das lições, dos seus erros nas conversas e dos seus materiais.'),
        h('div', { class: 'linha-acoes' }, h('a', { class: 'btn', href: '#/hoje' }, 'Voltar para hoje'), h('button', { class: 'btn btn-sec', on: { click: novo } }, icone('plus'), 'Criar um cartão'), h('button', { class: 'btn btn-texto', on: { click: gerenciar } }, 'Ver todos os cartões'))));
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
    caixa.replaceChildren(h('header', { class: 'cabeca c-sol' }, h('span', { class: 'bolha' }, icone('cards')), h('div', {}, h('h1', {}, 'Seus cartões'), h('p', { class: 'ajuda' }, `${cartoes.length} no total. Corrija ou apague o que não fizer sentido.`))),
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
        producao ? h('p', { class: 'ajuda' }, 'Diga em inglês') : null,
        h('p', { class: 'flashcard__texto', lang: producao ? null : 'en' }, frente),
        producao ? null : h('button', { type: 'button', class: 'btn btn-sec btn-peq', on: { click: e => { e.stopPropagation(); falar(textoIngles); } } }, icone('speaker-high'), 'Ouvir')),
      h('div', { class: 'flashcard__face flashcard__verso' },
        h('p', { class: 'flashcard__texto', lang: producao ? 'en' : null }, verso),
        c.exemplo ? h('p', { class: 'exemplo', lang: 'en' }, c.exemplo) : null,
        c.nota ? h('p', { class: 'ajuda' }, c.nota) : null));
    // carinhas: dizer como foi é mais fácil do que dar nota (e a carinha decide quando o cartão volta)
    const notas = h('div', { class: 'notas', hidden: true, role: 'group', 'aria-label': 'Como foi lembrar?' },
      [[0, 'Esqueci', 'smiley-x-eyes', 'coral'], [3, 'Difícil', 'smiley-nervous', 'sol'], [4, 'Lembrei', 'smiley', 'azul'], [5, 'Fácil', 'smiley-wink', 'menta']].map(([n, r, ic, cor]) =>
        h('button', { type: 'button', class: `nota c-${cor}`, dados: { nota: n }, on: { click: () => avaliar(n) } }, h('span', { class: 'nota__cara' }, icone(ic)), r)));
    const virar = h('button', { type: 'button', class: 'btn btn-bloco btn-grande btn-virar', on: { click: () => { cartao.classList.add('virado'); virar.hidden = true; notas.hidden = false; notas.querySelector('[data-nota="4"]').focus(); if (!producao) falar(textoIngles); } } }, icone('arrow-counter-clockwise'), 'Virar o cartão');
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
    const n = feitos + fila.length + 1;
    caixa.replaceChildren(
      h('header', { class: 'cabeca c-sol' }, h('span', { class: 'bolha' }, icone('cards')), h('div', {}, h('h1', {}, 'Revisar'), h('p', { class: 'ajuda' }, `${feitos + 1} de ${n}`))),
      cartao, virar, notas);
    cartao.focus({ preventScroll: true });
  }

  await carregar();
}
