// Tour de boas-vindas: um passo por vez, com a parte do app em destaque e o Tuiuiú explicando.
// Aparece sozinho na primeira vez (por conta, neste aparelho) e pode ser repetido em Mais > Tour pelo app.
import { h, icone, localStorageGet, localStorageSet } from './ui.js?v=__V__';
import { lou } from './diversao.js?v=__V__';

const NAV = {
  hoje: ['Hoje', 'A sua aula do dia começa aqui. Escolha 5, 10 ou 20 minutos e o Tuiuiú monta o treino para você.'],
  professor: ['Painel', 'Suas turmas, aulas e alunos ficam aqui.'],
  biblioteca: ['Biblioteca', 'Capítulos, textos e expressões do Brasil pro mundo para estudar no seu tempo.'],
  progresso: ['Progresso', 'Sua sequência de dias, o que você já domina e onde ainda tropeça.'],
  conta: ['Conta', 'Seus dados, o plano e os lembretes.'],
  turmas: ['Turmas', 'Atividades do professor. Entre com o código que ele passar.'],
  mais: ['Mais', 'Tudo o resto mora aqui: revisar, conversar, ouvir a Rádio, mudar de nível e tirar dúvidas. Tem um campo de busca para achar rápido.'],
};

export const chaveDoTour = eu => `tour-feito:${eu?.usuario?.email || 'x'}`;

function passos() {
  const lista = [{ titulo: 'Bem-vindo ao Inglou!', texto: 'Eu sou o Tuiuiú. Em 1 minuto eu mostro onde fica cada coisa. Dá para pular quando quiser.' }];
  for (const el of document.querySelectorAll('.nav a:not([hidden]), .nav .nav__mais')) {
    const info = NAV[el.dataset.rota]; if (info && el.getClientRects().length) lista.push({ alvo: el, titulo: info[0], texto: info[1] });
  }
  const nivel = document.querySelector('.nivel-chip');
  if (nivel) lista.push({ alvo: nivel, titulo: 'Seu nível', texto: 'Este é o seu nível de inglês. Se achar fácil ou difícil demais, toque aqui para mudar. Eu também ajusto sozinho pelos seus acertos.' });
  const tema = document.querySelector('.tema-troca');
  if (tema?.getClientRects().length) lista.push({ alvo: tema, titulo: 'Dia ou noite', texto: 'Troque o tema para estudar com a luz que ficar melhor para os seus olhos.' });
  lista.push({ titulo: 'Pronto, é só começar!', texto: 'Para rever este passeio, abra Mais e toque em Tour pelo app.' });
  return lista;
}

export function iniciarTour({ chave } = {}) {
  if (document.querySelector('.tour')) return;
  const lista = passos(), retorno = document.activeElement;
  let k = 0;
  const foco = h('div', { class: 'tour__foco' });
  const cartao = h('div', { class: 'tour__cartao', role: 'document' });
  const raiz = h('div', { class: 'tour', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'tour-t' }, foco, cartao);
  const terminar = () => { if (chave) localStorageSet(chave, 'sim'); removeEventListener('resize', posicionar); removeEventListener('keydown', teclas, true); raiz.remove(); retorno?.focus?.({ preventScroll: true }); };
  const ir = d => { k = Math.max(0, Math.min(lista.length - 1, k + d)); desenhar(); };

  function posicionar() {
    const p = lista[k], r = p.alvo?.getBoundingClientRect();
    const f = foco.style, c = cartao.style, W = innerWidth, H = innerHeight;
    if (r) { const m = 6; f.setProperty('--x', `${r.left - m}px`); f.setProperty('--y', `${r.top - m}px`); f.setProperty('--w', `${r.width + 2 * m}px`); f.setProperty('--h', `${r.height + 2 * m}px`); }
    else { f.setProperty('--x', `${W / 2}px`); f.setProperty('--y', `${H / 2}px`); f.setProperty('--w', '0px'); f.setProperty('--h', '0px'); }
    const largura = Math.min(352, W - 24);
    c.setProperty('--cw', `${largura}px`);
    c.setProperty('--cx', `${Math.max(12, Math.min(W - largura - 12, r ? r.left + r.width / 2 - largura / 2 : (W - largura) / 2))}px`);
    // o cartão fica do lado com mais espaço: acima de uma barra na base da tela, abaixo de um botão no topo
    if (r && r.top > H / 2) { c.setProperty('--cy', 'auto'); c.setProperty('--cb', `${H - r.top + 14}px`); }
    else if (r) { c.setProperty('--cy', `${r.bottom + 14}px`); c.setProperty('--cb', 'auto'); }
    else { c.setProperty('--cy', `${Math.max(16, H / 2 - 130)}px`); c.setProperty('--cb', 'auto'); }
  }
  function desenhar() {
    const p = lista[k], ultimo = k === lista.length - 1;
    p.alvo?.scrollIntoView?.({ block: 'nearest' });
    cartao.replaceChildren(
      h('div', { class: 'tour__topo' }, lou(ultimo || !k ? 'feliz' : 'oi', { tamanho: 46, rotulo: '' }), h('h2', { id: 'tour-t' }, p.titulo)),
      h('p', {}, p.texto),
      h('div', { class: 'tour__rodape' },
        h('span', { class: 'tour__pontos', 'aria-label': `Passo ${k + 1} de ${lista.length}` }, lista.map((_, i) => h('i', { class: i === k ? 'agora' : '' }))),
        h('div', { class: 'tour__acoes' },
          ultimo ? null : h('button', { type: 'button', class: 'btn btn-texto btn-peq', on: { click: terminar } }, 'Pular'),
          k ? h('button', { type: 'button', class: 'btn btn-sec btn-peq', on: { click: () => ir(-1) } }, 'Voltar') : null,
          h('button', { type: 'button', class: 'btn btn-peq', on: { click: () => (ultimo ? terminar() : ir(1)) } }, ultimo ? 'Começar' : k ? 'Próximo' : 'Vamos lá', ultimo ? null : icone('caret-right')))));
    posicionar();
    cartao.querySelector('.btn:not(.btn-texto):not(.btn-sec)')?.focus({ preventScroll: true });
    cartao.classList.remove('tour__cartao--troca'); void cartao.offsetWidth; cartao.classList.add('tour__cartao--troca');
  }
  function teclas(e) {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); terminar(); }
    else if (e.key === 'Tab') { // o foco fica dentro do cartão
      const bs = [...cartao.querySelectorAll('button')], primeiro = bs[0], ultimo = bs.at(-1);
      if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
    }
  }
  addEventListener('resize', posicionar); addEventListener('keydown', teclas, true);
  document.body.append(raiz); desenhar();
}
