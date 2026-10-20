// Rádio Tuiuiú: um episódio curto por dia com os tropeços do aluno. O Tuiuiú explica em português, a Mia fala inglês.
// O áudio sai da voz do próprio aparelho (sem custo e sem mandar nada a terceiros). O roteiro fica na tela,
// com a fala atual em destaque (dá para ler junto). Nas falas "repita", o player espera a pessoa repetir.
// No fim, um treino rápido com o mesmo assunto (o gabarito é conferido no servidor).
import { api } from '../api.js?v=__V__';
import { h, icone, toast, localStorageGet, localStorageSet, ehGoogle } from '../ui.js?v=__V__';
import { lou, som, confete } from '../diversao.js?v=__V__';
import { exercicio } from './exercicio.js?v=__V__';
import { nomeConquista } from './hoje.js?v=__V__';

const PAUSA_REPITA = 4200;
const temVozes = () => 'speechSynthesis' in window;
// A Mia tem voz gravada para as frases do catálogo (mp3 guardado). O que muda por aluno (nome, correção própria) cai na voz do aparelho.
const PASTA_MIA = '/assets/audio/mia/';
let mapaMia = null;
try { fetch(PASTA_MIA + 'mapa.json?v=__V__').then(r => (r.ok ? r.json() : null)).then(j => { mapaMia = j; }).catch(() => {}); } catch {}

function escolherVozes() {
  const todas = temVozes() ? speechSynthesis.getVoices() : [];
  const nota = (v, boa) => (boa.test(v.name) ? 10 : 0) + (ehGoogle(v) ? -14 : 0);
  const melhor = (lista, boa) => lista.slice().sort((a, b) => nota(b, boa) - nota(a, boa))[0];
  const pt = melhor(todas.filter(v => /^pt[-_]BR/i.test(v.lang)), /natural|neural|online|francisca|antonio|thalita|luciana|felipe/i) || melhor(todas.filter(v => /^pt/i.test(v.lang)), /natural|neural|online/i);
  const en = melhor(todas.filter(v => /^en[-_]US/i.test(v.lang)), /natural|neural|online|jenny|aria|samantha|ava|zira/i) || melhor(todas.filter(v => /^en/i.test(v.lang)), /natural|neural|online/i);
  return { pt, en };
}

export async function telaPodcast(el) {
  const capa = h('section', { class: 'radio-capa c-rosa', 'aria-live': 'polite' }, h('div', { class: 'radio-capa__carregando' }, lou('pensando', { tamanho: 72, rotulo: '' }), h('p', {}, 'O Tuiuiú está montando o seu episódio...')));
  el.append(h('header', { class: 'cabeca c-rosa' }, h('span', { class: 'bolha' }, icone('headphones')), h('div', {}, h('h1', {}, 'Rádio Tuiuiú'), h('p', { class: 'ajuda' }, 'Um episódio por dia, feito com o que você mais errou. Ouça, repita junto e treine no fim.'))), capa);
  const { episodio: ep, aviso } = await api('/podcast');
  if (aviso) toast(aviso);
  const falas = ep.falas;

  // ---------- capa e controles
  let i = 0, tocando = false, geracao = 0, timer = null, audioMia = null;
  const pararMia = () => { try { audioMia?.pause(); } catch {} audioMia = null; };
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
    if (!temVozes()) { toast('Seu navegador não lê em voz alta. Você pode ler o roteiro aqui embaixo.'); return; }
    const minha = ++geracao;
    clearTimeout(timer); pararMia(); if (temVozes()) speechSynthesis.cancel();
    i = Math.max(0, Math.min(falas.length - 1, k)); tocando = true;
    btnPlay.replaceChildren(icone('pause')); btnPlay.setAttribute('aria-label', 'Pausar'); capa.classList.add('tocando'); capa.classList.remove('repita');
    marcar(); rolar();
    const f = falas[i], v = escolherVozes();
    const fim = () => {
      if (minha !== geracao || !tocando) return;
      if (f.repita) { capa.classList.add('repita'); timer = setTimeout(() => { if (minha === geracao) seguir(); }, PAUSA_REPITA * (devagar ? 1.3 : 1)); }
      else timer = setTimeout(() => { if (minha === geracao) seguir(); }, 250);
    };
    const arq = f.quem === 'mia' && f.lingua === 'en' && mapaMia && mapaMia[String(f.texto).trim()];
    if (arq) {
      const a = new Audio(PASTA_MIA + arq + '?v=__V__');
      a.playbackRate = devagar ? 0.8 : 1; a.preservesPitch = true;
      audioMia = a;
      a.onended = fim;
      a.onerror = () => { if (minha === geracao && tocando && audioMia === a) { audioMia = null; falarNavegador(); } };
      a.play().catch(() => { if (minha === geracao && tocando && audioMia === a) { audioMia = null; falarNavegador(); } });
      return;
    }
    falarNavegador();
    function falarNavegador() {
    const u = new SpeechSynthesisUtterance(f.texto);
    const voz = f.lingua === 'en' ? v.en : v.pt;
    if (voz) u.voice = voz;
    u.lang = voz?.lang || (f.lingua === 'en' ? 'en-US' : 'pt-BR');
    u.rate = (f.lingua === 'en' ? 0.95 : 1.05) * (devagar ? 0.8 : 1);
    u.pitch = f.quem === 'mia' ? 1.15 : 1;
    u.onend = fim;
    u.onerror = e => { if (minha === geracao && e.error !== 'interrupted' && e.error !== 'canceled') { pausar(); toast('O áudio parou. Toque no play para continuar.'); } };
    speechSynthesis.speak(u);
    }
  }
  function seguir() { if (i + 1 < falas.length) tocar(i + 1); else terminar(); }
  function pausar() {
    tocando = false; geracao++; clearTimeout(timer); pararMia(); if (temVozes()) speechSynthesis.cancel();
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
