// Tutor de dúvidas (português ou inglês). Sem IA, responde pelos pontos do catálogo e diz isso.
import { h, icone } from '../ui.js?v=__V__';
import { montarChatTutor } from '../chat-tutor.js?v=__V__';

export async function telaDuvidas(el) {
  const pre = new URLSearchParams(location.hash.split('?')[1] || '').get('q');   // vindo de um estudo sob medida
  const { lista, form } = montarChatTutor({ pre: pre || '' });
  el.append(h('header', { class: 'cabeca c-coral' }, h('span', { class: 'bolha' }, icone('question')), h('div', {}, h('h1', {}, 'Tirar dúvidas'), h('p', { class: 'ajuda' }, 'O tutor pode errar. Se algo não fizer sentido, pergunte de novo de outro jeito.'))), lista, form);
}
