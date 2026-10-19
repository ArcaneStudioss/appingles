// Palavras tocáveis nos exercícios: tocar numa palavra em inglês abre um balãozinho com a tradução, o botão Ouvir e
// "Marcar como dúvida" (vira um cartão no Revisar). A tradução vem do dicionário do app (GET /palavras/traduzir).
// Teclado: cada texto tem UMA parada de Tab (as setas andam entre as palavras); ao abrir, o foco vai para o balão.
import { api } from './api.js?v=__V__';
import { h, icone, falar, toast } from './ui.js?v=__V__';

const PALAVRA = /[A-Za-z][A-Za-z’'-]*/g;
// controles do jogo ficam como estão: tocar numa peça, opção ou par continua só jogando
const IGNORAR = 'input, textarea, button, .peca, .par, .opcao, .balao-palavra';

let aberto = null;   // { balao, botao }

// há um balão aberto de verdade? (um balão órfão, de um exercício que já passou, é fechado aqui)
export function balaoAberto() {
  if (aberto && !aberto.balao.isConnected) fecharBalao();
  return !!aberto;
}

export function fecharBalao({ devolverFoco = false } = {}) {
  if (!aberto) return;
  const { balao, botao } = aberto;
  aberto = null;
  balao.remove();
  document.removeEventListener('keydown', aoTeclar, true);
  document.removeEventListener('click', aoClicarFora, true);
  botao.setAttribute('aria-expanded', 'false');
  if (devolverFoco && botao.isConnected) botao.focus({ preventScroll: true });
}
function aoTeclar(e) {
  if (!balaoAberto()) return;
  if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); fecharBalao({ devolverFoco: true }); }
}
function aoClicarFora(e) { if (balaoAberto() && !aberto.balao.contains(e.target) && !aberto.botao.contains(e.target)) fecharBalao(); }

async function abrir(botao, palavra, exemplo) {
  if (aberto?.botao === botao) return fecharBalao({ devolverFoco: true });
  fecharBalao();
  const corpo = h('div', { class: 'balao-palavra__corpo', 'aria-live': 'polite' }, h('p', { class: 'ajuda' }, 'Procurando...'));
  const balao = h('div', { class: 'balao-palavra', role: 'dialog', 'aria-label': `Tradução de ${palavra}`, tabindex: '-1' },
    corpo,
    h('button', { type: 'button', class: 'balao-palavra__fechar', 'aria-label': 'Fechar tradução', on: { click: () => fecharBalao({ devolverFoco: true }) } }, '×'));
  (botao.closest('p, blockquote, h2, div') || botao).after(balao);
  botao.setAttribute('aria-expanded', 'true');
  aberto = { balao, botao };
  document.addEventListener('keydown', aoTeclar, true);
  document.addEventListener('click', aoClicarFora, true);
  balao.focus({ preventScroll: true });   // quem usa teclado ou leitor de tela cai direto na tradução, sem andar pelas outras palavras
  try {
    const r = await api('/palavras/traduzir?p=' + encodeURIComponent(palavra));
    if (aberto?.balao !== balao) return;   // a pessoa já tocou em outra palavra
    const btnDuvida = h('button', { type: 'button', class: 'btn btn-sec btn-peq' }, icone('question'), 'Marcar como dúvida');
    // aria-disabled, e não disabled: o botão focado que fica desativado derruba o foco para o body e as teclas voltam ao exercício
    const marcar = () => { btnDuvida.replaceChildren(icone('check'), r.marcada ? 'Já está nas suas revisões' : 'Marcada'); btnDuvida.setAttribute('aria-disabled', 'true'); };
    if (r.marcada) marcar();
    btnDuvida.addEventListener('click', async () => {
      if (btnDuvida.getAttribute('aria-disabled') === 'true') return;
      btnDuvida.setAttribute('aria-disabled', 'true');
      try {
        await api('/palavras/duvida', { metodo: 'POST', corpo: { palavra: r.palavra || palavra, exemplo } });
        btnDuvida.replaceChildren(icone('check'), 'Marcada');
        toast('Vai voltar nas suas revisões.', { tipo: 'ok' });
      } catch (e) { btnDuvida.removeAttribute('aria-disabled'); toast(e.message, { tipo: 'erro' }); }
    });
    corpo.replaceChildren(
      h('p', { class: 'balao-palavra__palavra' }, h('strong', { lang: 'en' }, r.palavra || palavra)),
      h('p', { class: 'balao-palavra__trad' }, r.traducao || 'Ainda não tenho essa palavra.'),
      h('div', { class: 'linha-acoes' },
        h('button', { type: 'button', class: 'btn btn-texto btn-peq', 'aria-label': `Ouvir ${palavra}`, on: { click: () => falar(r.palavra || palavra) } }, icone('speaker-high'), 'Ouvir'),
        btnDuvida));
  } catch (e) {
    if (aberto?.balao === balao) corpo.replaceChildren(h('p', { class: 'ajuda' }, e.message || 'Não consegui traduzir agora.'));
  }
}

// troca as palavras inglesas dos textos de `raiz` por botões; `exemplo` é a frase do exercício, guardada no cartão
// (vazio quando a frase pode estar errada, como em "corrija a frase")
export function palavrasTocaveis(raiz, { exemplo = '' } = {}) {
  if (!raiz) return;
  const nos = [];
  const walker = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) nos.push(walker.currentNode);
  const botoes = [];
  for (const no of nos) {
    if (no.parentElement?.closest(IGNORAR)) continue;
    const texto = no.nodeValue;
    const achados = [...texto.matchAll(PALAVRA)];
    if (!achados.length) continue;
    const frag = document.createDocumentFragment();
    let i = 0;
    for (const m of achados) {
      frag.append(texto.slice(i, m.index));
      const botao = h('button', { type: 'button', class: 'palavra', lang: 'en', tabindex: '-1', 'aria-expanded': 'false' }, m[0]);
      botao.addEventListener('click', () => abrir(botao, m[0], exemplo));
      botoes.push(botao);
      frag.append(botao);
      i = m.index + m[0].length;
    }
    frag.append(texto.slice(i));
    no.replaceWith(frag);
  }
  if (!botoes.length) return;
  // uma só parada de Tab por texto; as setas andam entre as palavras
  const parada = alvo => { for (const b of botoes) b.tabIndex = b === alvo ? 0 : -1; };
  parada(botoes[0]);
  raiz.addEventListener('focusin', e => { if (botoes.includes(e.target)) parada(e.target); });
  raiz.addEventListener('keydown', e => {
    const i = botoes.indexOf(e.target);
    if (i < 0) return;
    const destino = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: botoes.length - 1 }[e.key];
    if (destino == null || !botoes[destino]) return;
    e.preventDefault();
    botoes[destino].focus();
  });
}
