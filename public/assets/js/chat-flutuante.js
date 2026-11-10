// Botão flutuante que abre o tutor de dúvidas em um painel, em qualquer tela da área do aluno.
import { h, icone, reduzirMovimento } from './ui.js?v=__V__';
import { lou } from './diversao.js?v=__V__';
import { montarChatTutor } from './chat-tutor.js?v=__V__';

const SEM_BOTAO = new Set(['duvidas', 'sessao', 'licao', 'unidade', 'simulado', 'treino', 'atividade', 'nivelamento', 'perfil', 'plano', 'publico', 'entrar', 'conversa']);
const historico = [];
let painel = null, botao = null, aoEsc = null, dono = null;   // dono: de quem é o histórico (some ao sair ou trocar de conta)

function abrir() {
  if (painel) return;
  const chat = montarChatTutor({ historico });
  const fechar = () => {
    document.removeEventListener('keydown', aoEsc);
    const fim = () => { painel?.remove(); painel = null; botao?.setAttribute('aria-expanded', 'false'); botao?.focus(); };
    if (reduzirMovimento()) fim(); else { painel.classList.add('is-closing'); setTimeout(fim, 170); }
  };
  const x = h('button', { type: 'button', class: 'btn btn-texto btn-peq', 'aria-label': 'Fechar o chat', on: { click: fechar } }, icone('x'));
  painel = h('aside', { class: 'chat-flut__painel', role: 'dialog', 'aria-label': 'Perguntar ao tutor' },
    h('header', { class: 'chat-flut__topo' }, h('strong', {}, 'Pergunte ao Lou'), x),
    h('div', { class: 'chat-flut__corpo' }, chat.lista), chat.form);
  document.body.append(painel);
  aoEsc = e => { if (e.key === 'Escape') fechar(); };
  document.addEventListener('keydown', aoEsc);
  botao.setAttribute('aria-expanded', 'true');
  chat.campo.focus({ preventScroll: true });
  chat.lista.lastElementChild?.scrollIntoView({ block: 'end' });
}

export function montarChatFlutuante() {
  botao = h('button', { type: 'button', class: 'chat-flut__botao', 'aria-label': 'Perguntar ao tutor', 'aria-expanded': 'false', hidden: true,
    on: { click: () => (painel ? painel.querySelector('[aria-label="Fechar o chat"]').click() : abrir()) } }, lou('pensando', { tamanho: 40, rotulo: '' }));
  document.body.append(botao);
  // chamado a cada troca de tela: some nas telas de foco e nas de entrada
  return (rota, navVisivel, usuario = null) => {
    if (usuario !== dono) {
      dono = usuario; historico.length = 0;
      if (painel) { document.removeEventListener('keydown', aoEsc); painel.remove(); painel = null; botao.setAttribute('aria-expanded', 'false'); }
    }
    const mostrar = navVisivel && !SEM_BOTAO.has(rota);
    botao.hidden = !mostrar;
    if (!mostrar && painel) { document.removeEventListener('keydown', aoEsc); painel.remove(); painel = null; botao.setAttribute('aria-expanded', 'false'); }
  };
}
