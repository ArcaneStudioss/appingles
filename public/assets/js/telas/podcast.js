// Rádio Tuiuiú: um episódio curto por dia com os tropeços do aluno. O Tuiuiú explica em português, a Mia fala inglês.
// O áudio usa exclusivamente as vozes oficiais dos personagens. O roteiro fica na tela,
// com a fala atual em destaque (dá para ler junto). Nas falas "repita", o player espera a pessoa repetir.
// No fim, um treino rápido com o mesmo assunto (o gabarito é conferido no servidor).
import { api } from '../api.js?v=__V__';
import { h, icone, toast, localStorageGet, localStorageSet } from '../ui.js?v=__V__';
import { lou, som, confete } from '../diversao.js?v=__V__';
import { exercicio } from './exercicio.js?v=__V__';
import { nomeConquista } from './hoje.js?v=__V__';
import { tocarVoz, pararVoz, temVoz } from '../voz.js?v=__V__';

const PAUSA_REPITA = 4200;
const temVozes = temVoz;

export async function telaPodcast(el) {
  const capa = h('section', { class: 'radio-capa c-rosa', 'aria-live': 'polite' }, h('div', { class: 'radio-capa__carregando' }, lou('pensando', { tamanho: 72, rotulo: '' }), h('p', {}, 'O Tuiuiú está montando o seu episódio...')));
  el.append(h('header', { class: 'cabeca c-rosa' }, h('span', { class: 'bolha' }, icone('headphones')), h('div', {}, h('h1', {}, 'Rádio Tuiuiú'), h('p', { class: 'ajuda' }, 'Um episódio por dia, feito com o que você mais errou. Ouça, repita junto e treine no fim.'))), capa);
  const { episodio: ep, aviso } = await api('/podcast');
  if (aviso) toast(aviso);
  const falas = ep.falas;

  // ---------- capa e controles
  let i = 0, tocando = false, geracao = 0, timer = null;
  let devagar = localStorageGet('radio-devagar') === 'sim';
  const ondas = h('div', { class: 'radio-ondas', 'aria-hidden': 'true' }, Array.from({ length: 5 }, () => h('i')));
  const quemFala = h('p', { class: 'radio-capa__quem', 'aria-live': 'polite' }, 'Toque no play para começar');
  const fitas = h('div', { class: 'radio-fitas', 'aria-hidden': 'true' }, falas.map((f, k) => h('i', { class: 'radio-fita radio-fita--' + f.quem, dados: { k } })));
  const btnPlay = h('button', { type: 'button', class: 'radio-play', 'aria-label': 'Tocar o episódio', on: { click: () => (tocando ? pausar() : tocar(i)) } }, icone('play'));
  const btnVolta = h('button', { type: 'button', class: 'radio-ctrl', 'aria-label': 'Fala anterior', on: { click: () => pular(-1) } }, icone('skip-back'));
  const btnAvanca = h('button', { type: 'button', class: 'radio-ctrl', 'aria-label': 'Próxima fala', on: { click: () => pular(1) } }, icone('skip-forward'));
  const btnVel = h('button', { type: 'button', class: 'radio-vel', 'aria-pressed': String(devagar), on: { click: () => { devagar = !devagar; localStorageSet('radio-devagar', devagar ? 'sim' : 'nao'); btnVel.setAttribute('aria-pressed', String(devagar)); btnVel.lastChild.textContent = devagar ? 'Devagar' : 'Normal'; if (tocando) tocar(i); } } }, icone('clock'), h('span', {}, devagar ? 'Devagar' : 'Normal'));
  capa.replaceChildren(
    h('div', { class: 'radio-capa__palco' },
      h('div', { class: 'radio-capa__dupla' }, lou('feliz', { tamanho: 76, rotulo: 'Tuiuiú' }), ondas, lou('oi', { tamanho: 148, rotulo: 'Mia', mia: true })),
      h('p', { class: 'rotulo-pequeno' }, `Episódio de hoje · ${ep.minutos} min`),
      h('h2', {}, ep.titulo),
      h('div', { class: 'linha-acoes radio-capa__chips' },
        ep.tropecos.length ? h('span', { class: 'chip' }, icone('target'), `${ep.tropecos.length} ${ep.tropecos.length === 1 ? 'tropeço seu' : 'tropeços seus'}`) : h('span', { class: 'chip' }, icone('path'), 'Sobre a sua missão'),
        ep.modo === 'ia' ? h('span', { class: 'chip' }, icone('sparkle'), 'Roteiro escrito pela IA') : null,
        ep.ouvido ? h('span', { class: 'chip chip-ok' }, icone('check'), 'Ouvido hoje') : null)),
    fitas, quemFala,
    h('div', { class: 'radio-controles' }, btnVel, btnVolta, btnPlay, btnAvanca, h('span', { class: 'radio-vel radio-vel--fantasma', 'aria-hidden': 'true' })));

  // ---------- roteiro (lê junto; toque numa fala para ir até ela)
  const roteiro = h('ol', { class: 'roteiro', 'aria-label': 'Roteiro do episódio' }, falas.map((f, k) => h('li', { class: `roteiro__fala roteiro__fala--${f.quem}` + (f.repita ? ' roteiro__fala--repita' : '') },
    h('button', { type: 'button', class: 'roteiro__btn', on: { click: () => tocar(k) } },
      h('span', { class: 'roteiro__quem' }, lou(f.quem === 'mia' ? 'oi' : 'feliz', { tamanho: 30, rotulo: '', mia: f.quem === 'mia' }), f.quem === 'mia' ? 'Mia' : 'Tuiuiú'),
      f.riscado ? h('span', { class: 'roteiro__riscado riscado', lang: 'en' }, f.riscado) : null,
      h('span', { class: 'roteiro__texto', lang: f.lingua === 'en' ? 'en' : 'pt-BR' }, f.texto),
      f.repita ? h('span', { class: 'chip c-rosa roteiro__sua-vez' }, icone('microphone'), 'Sua vez: repita em voz alta') : null))));

  function marcar() {
    roteiro.querySelectorAll('.roteiro__fala').forEach((li, k) => { li.classList.toggle('agora', k === i); li.classList.toggle('ja', k < i); });
    fitas.querySelectorAll('i').forEach((f, k) => { f.classList.toggle('agora', k === i); f.classList.toggle('ja', k < i); });
    const f = falas[i];
    quemFala.textContent = !f ? 'Fim do episódio' : f.repita ? 'Sua vez: repita depois da Mia' : f.quem === 'mia' ? 'A Mia está falando (inglês)' : 'O Tuiuiú está falando';
    capa.dataset.quem = f?.quem || '';
  }
  function rolar() { const li = roteiro.children[i]; if (li && tocando) li.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); }

  function tocar(k) {
    if (!temVozes()) { toast('Seu navegador não conseguiu reproduzir o áudio. Tente novamente ou acompanhe o roteiro.'); return; }
    const minha = ++geracao;
    clearTimeout(timer); pararVoz();
    i = Math.max(0, Math.min(falas.length - 1, k)); tocando = true;
    btnPlay.replaceChildren(icone('pause')); btnPlay.setAttribute('aria-label', 'Pausar'); capa.classList.add('tocando'); capa.classList.remove('repita');
    marcar(); rolar();
    const f = falas[i];
    const fim = () => {
      if (minha !== geracao || !tocando) return;
      if (f.repita) { capa.classList.add('repita'); timer = setTimeout(() => { if (minha === geracao) seguir(); }, PAUSA_REPITA * (devagar ? 1.3 : 1)); }
      else timer = setTimeout(() => { if (minha === geracao) seguir(); }, 250);
    };
    tocarVoz(f.texto, { personagem: f.quem === 'mia' ? 'mia' : 'tuiuiu', idioma: f.lingua,
      velocidade: (f.lingua === 'en' ? .95 : 1) * (devagar ? .8 : 1), aoFim: fim,
      aoCancelar: () => { if (minha === geracao && tocando) pausar(); },
      aoErro: mensagem => { if (minha === geracao) { pausar(); toast(mensagem, { tipo: 'erro' }); } } });
  }
  function seguir() { if (i + 1 < falas.length) tocar(i + 1); else terminar(); }
  function pausar() {
    tocando = false; geracao++; clearTimeout(timer); pararVoz();
    btnPlay.replaceChildren(icone('play')); btnPlay.setAttribute('aria-label', 'Continuar o episódio'); capa.classList.remove('tocando', 'repita');
  }
  function pular(d) { const alvo = Math.max(0, Math.min(falas.length - 1, i + d)); if (tocando) tocar(alvo); else { i = alvo; marcar(); } }

  async function terminar() {
    pausar(); i = falas.length; marcar(); i = 0;
    try {
      const r = await api('/podcast/ouvido', { metodo: 'POST' });
      if (r.conquistas?.length) { som('fim'); confete(); for (const c of r.conquistas) toast('Nova figurinha: ' + nomeConquista(c), { tipo: 'ok' }); }
      else toast('Episódio ouvido! Agora o treino aqui embaixo.', { tipo: 'ok' });
    } catch (e) { toast(e.message, { tipo: 'erro' }); }
    treinoSec.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  // ---------- treino do episódio
  const exs = h('div', { class: 'lista-exercicios' });
  for (const ex of ep.treino) {
    const caixa = h('div', { class: 'folha' });
    caixa.append(exercicio(ex, {
      ja: ep.respondidos[ex.id],
      responder: async (resposta, meta) => { const r = await api('/podcast/responder', { metodo: 'POST', corpo: { itemId: ex.id, resposta, ...meta } }); ep.respondidos[ex.id] = { ...r, resposta }; return r; },
      rotuloProximo: 'Próximo',
      aoProximo: () => { const prox = caixa.nextElementSibling; if (prox) { prox.scrollIntoView({ block: 'center' }); prox.querySelector('button,input,textarea')?.focus({ preventScroll: true }); } else toast('Treino feito! Esses pontos voltam na revisão.', { tipo: 'ok' }); },
    }));
    exs.append(caixa);
  }
  const treinoSec = h('section', { class: 'radio-treino c-rosa', 'aria-labelledby': 'treino-t' },
    h('h2', { id: 'treino-t' }, icone('pencil-simple'), ' Treino do episódio'),
    h('p', { class: 'ajuda' }, `${ep.treino.length} perguntas rápidas sobre o que você acabou de ouvir.`), exs);

  el.append(
    ep.tropecos.length ? h('ul', { class: 'radio-tropecos', 'aria-label': 'Do que o episódio fala' }, ep.tropecos.map(t => h('li', {}, h('strong', {}, t.nome), h('small', {}, t.vezes > 1 ? `apareceu ${t.vezes} vezes` : 'apareceu 1 vez')))) : null,
    h('details', { class: 'radio-roteiro folha', open: true }, h('summary', {}, icone('file-text'), ' Roteiro (leia junto)'), roteiro),
    exs.children.length ? treinoSec : null,
    temVozes() ? null : h('button', { type: 'button', class: 'btn btn-sec', on: { click: terminar } }, icone('check'), 'Li o roteiro todo'));

  // sair da tela para o áudio
  addEventListener('hashchange', pausar, { once: true });
  marcar();
}
