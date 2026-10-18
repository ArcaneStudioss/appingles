// Tutor de dúvidas (português ou inglês). Sem IA, responde pelos pontos do catálogo e diz isso.
import { api } from '../api.js?v=__V__';
import { h, icone, ocupado, toast } from '../ui.js?v=__V__';
import { lou } from '../diversao.js?v=__V__';
const avatar = () => h('span', { class: 'msg__avatar' }, lou('pensando', { tamanho: 44, rotulo: '' }));

export async function telaDuvidas(el) {
  const historico = [];
  const lista = h('ol', { class: 'chat', 'aria-live': 'polite' },
    h('li', { class: 'msg msg--tutor' }, avatar(), h('div', { class: 'msg__balao' }, 'Pode perguntar em português ou em inglês. Ex.: "Quando uso since e quando uso for?" ou "Como digo que estou de acordo numa reunião?"')));
  const campo = h('textarea', { rows: 2, maxlength: 1000, 'aria-label': 'Sua dúvida', placeholder: 'Sua dúvida...' });
  const pre = new URLSearchParams(location.hash.split('?')[1] || '').get('q');   // vindo de um estudo sob medida
  if (pre) campo.value = pre.slice(0, 300);
  const btn = h('button', { type: 'submit', class: 'btn', 'aria-label': 'Perguntar' }, icone('arrow-right'));
  const form = h('form', { class: 'chat-form', on: { submit: async e => {
    e.preventDefault();
    const pergunta = campo.value.trim();
    if (pergunta.length < 2) return;
    lista.append(h('li', { class: 'msg msg--aluno' }, h('div', { class: 'msg__balao' }, pergunta)));
    campo.value = ''; ocupado(btn, true);
    try {
      const r = await api('/tutor', { metodo: 'POST', corpo: { pergunta, historico } });
      historico.push({ papel: 'aluno', texto: pergunta }, { papel: 'tutor', texto: r.resposta });
      lista.append(h('li', { class: 'msg msg--tutor' }, avatar(), h('div', { class: 'msg__balao msg__balao--longo' }, r.resposta)));
      if (r.aviso) toast(r.aviso);
    } catch (err) { toast(err.message, { tipo: 'erro' }); campo.value = pergunta; }
    finally { ocupado(btn, false); campo.focus(); lista.lastElementChild?.scrollIntoView({ block: 'end' }); }
  } } }, h('div', { class: 'chat-form__linha' }, campo, btn));
  campo.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); form.requestSubmit(); } });
  el.append(h('header', { class: 'cabeca c-coral' }, h('span', { class: 'bolha' }, icone('question')), h('div', {}, h('h1', {}, 'Tirar dúvidas'), h('p', { class: 'ajuda' }, 'O tutor pode errar. Se algo não fizer sentido, pergunte de novo de outro jeito.'))), lista, form);
}
