// Chat do tutor de dúvidas, usado pela tela "Tirar dúvidas" e pelo botão flutuante.
// `historico` fica com quem chama (assim a conversa sobrevive enquanto o app está aberto).
import { api } from './api.js?v=__V__';
import { h, icone, ocupado, toast } from './ui.js?v=__V__';
import { lou } from './diversao.js?v=__V__';

const avatar = () => h('span', { class: 'msg__avatar' }, lou('pensando', { tamanho: 44, rotulo: '' }));
export const BOAS_VINDAS = 'Pode perguntar em português ou em inglês. Ex.: "Quando uso since e quando uso for?" ou "Como digo que estou de acordo numa reunião?"';

export function montarChatTutor({ historico = [], pre = '' } = {}) {
  const lista = h('ol', { class: 'chat', 'aria-live': 'polite' },
    h('li', { class: 'msg msg--tutor' }, avatar(), h('div', { class: 'msg__balao' }, BOAS_VINDAS)));
  for (const m of historico) {
    lista.append(m.papel === 'aluno'
      ? h('li', { class: 'msg msg--aluno' }, h('div', { class: 'msg__balao' }, m.texto))
      : h('li', { class: 'msg msg--tutor' }, avatar(), h('div', { class: 'msg__balao msg__balao--longo' }, m.texto)));
  }
  const campo = h('textarea', { rows: 2, maxlength: 1000, 'aria-label': 'Sua dúvida', placeholder: 'Sua dúvida...' });
  if (pre) campo.value = pre.slice(0, 300);
  const btn = h('button', { type: 'submit', class: 'btn', 'aria-label': 'Perguntar' }, icone('arrow-right'));
  const rolar = () => lista.lastElementChild?.scrollIntoView({ block: 'end' });
  const form = h('form', { class: 'chat-form', on: { submit: async e => {
    e.preventDefault();
    const pergunta = campo.value.trim();
    if (pergunta.length < 2) return;
    lista.append(h('li', { class: 'msg msg--aluno' }, h('div', { class: 'msg__balao' }, pergunta)));
    campo.value = ''; ocupado(btn, true); rolar();
    try {
      const r = await api('/tutor', { metodo: 'POST', corpo: { pergunta, historico } });
      historico.push({ papel: 'aluno', texto: pergunta }, { papel: 'tutor', texto: r.resposta });
      lista.append(h('li', { class: 'msg msg--tutor' }, avatar(), h('div', { class: 'msg__balao msg__balao--longo' }, r.resposta)));
      if (r.aviso) toast(r.aviso);
    } catch (err) { toast(err.message, { tipo: 'erro' }); campo.value = pergunta; }
    finally { ocupado(btn, false); campo.focus(); rolar(); }
  } } }, h('div', { class: 'chat-form__linha' }, campo, btn));
  campo.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); form.requestSubmit(); } });
  return { lista, form, campo };
}
