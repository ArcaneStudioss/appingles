// Rádio Tuiuiú: um episódio curto por dia com os tropeços do aluno. O Tuiuiú explica em português, a Mia fala inglês.
// A tela é um mini vídeo: cena do erro/exemplo, legendas em inglês e português e quem está falando. O áudio usa exclusivamente as vozes oficiais dos personagens. O roteiro fica na tela,
// com a fala atual em destaque (dá para ler junto). Nas falas "repita", o player espera a pessoa repetir.
// No fim, um treino rápido com o mesmo assunto (o gabarito é conferido no servidor).
import { api } from '../api.js?v=__V__';
import { h, icone, toast, localStorageGet, localStorageSet } from '../ui.js?v=__V__';
import { lou, som, confete, voarComemorando } from '../diversao.js?v=__V__';
import { exercicio } from './exercicio.js?v=__V__';
import { nomeConquista } from './hoje.js?v=__V__';
import { tocarVoz, tocarSilencio, pararVoz, preCarregarVoz, temVoz, configurarMidia, encerrarMidia } from '../voz.js?v=__V__';
import { significadoLocal } from '../traducao.js?v=__V__';

const PAUSA_REPITA = 4200;
const palavras = t => (String(t).match(/[A-Za-zÀ-ú']+/g) || []).length;
const temVozes = temVoz;

export async function telaPodcast(el) {
  const capa = h('section', { class: 'radio-capa c-rosa', 'aria-live': 'polite' }, h('div', { class: 'radio-capa__carregando' }, lou('pensando', { tamanho: 72, rotulo: '' }), h('p', {}, 'O Tuiuiú está montando o seu episódio...')));
  el.append(h('header', { class: 'cabeca c-rosa' }, h('span', { class: 'bolha' }, icone('headphones')), h('div', {}, h('h1', {}, 'Rádio Tuiuiú'), h('p', { class: 'ajuda' }, 'Um episódio por dia, feito com o que você mais errou. Ouça, repita junto e treine no fim.'))), capa);
  const { episodio: ep, aviso } = await api('/podcast');
  if (aviso) toast(aviso);
  const falas = ep.falas;

  // ---------- vídeo: cena (erro e exemplo), legendas em inglês e português e as duas bolinhas de quem fala
  let i = 0, tocando = false, geracao = 0, timer = null;
  let devagar = localStorageGet('radio-devagar') === 'sim';
  let legendas = localStorageGet('radio-legendas') !== 'nao';
  const reduzir = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const topicos = falas.map((f, k) => { let t = -1; for (let j = 0; j <= k; j++) { const n = ep.tropecos.findIndex(x => falas[j].quem === 'lou' && falas[j].texto.includes(x.nome + '.')); if (n >= 0) t = n; } return t; });
  const proximaMia = k => falas.slice(k + 1).find(f => f.quem === 'mia');
  const ptDe = f => f.pt || significadoLocal(f.texto) || null;

  // O que aparece na tela em cada fala: o erro riscado, a forma certa, o exemplo ou o desafio de repetir.
  function cena(k) {
    const f = falas[k], anterior = falas[k - 1];
    const cartao = (tipo, txt, selo) => h('div', { class: `cena__cartao cena__cartao--${tipo}` }, h('span', { class: 'cena__selo' }, icone(selo)), h('span', { class: 'cena__txt', lang: 'en' }, txt));
    if (f.riscado) return h('div', { class: 'cena cena--erro' }, h('span', { class: 'cena__rotulo' }, 'Você escreveu'), cartao('errado', f.riscado, 'x'));
    if (f.quem === 'mia' && f.repita) return h('div', { class: 'cena cena--repita' }, h('span', { class: 'cena__rotulo' }, 'Sua vez: repita em voz alta'), h('div', { class: 'cena__mic' }, icone('microphone')), cartao('certo', f.texto, 'check'));
    if (f.quem === 'mia' && anterior?.riscado) return h('div', { class: 'cena cena--erro' }, cartao('errado', anterior.riscado, 'x'), h('span', { class: 'cena__seta' }, icone('caret-down')), cartao('certo', f.texto, 'check'));
    if (f.quem === 'mia') return h('div', { class: 'cena cena--exemplo' }, h('span', { class: 'cena__rotulo' }, 'Exemplo'), cartao('certo', f.texto, 'check'));
    const contraste = f.texto.match(/^Em português a gente diz: (.+) Em inglês:$/);
    if (contraste) return h('div', { class: 'cena cena--contraste' }, h('span', { class: 'cena__rotulo' }, 'Em português'), h('div', { class: 'cena__cartao cena__cartao--pt', lang: 'pt-BR' }, contraste[1]), h('span', { class: 'cena__seta' }, icone('caret-down')), h('div', { class: 'cena__cartao cena__cartao--aguarda', lang: 'en' }, proximaMia(k)?.texto || '...'));
    const t = ep.tropecos[topicos[k]];
    return h('div', { class: 'cena cena--topico' }, h('span', { class: 'cena__bolha' }, icone(t ? 'target' : 'path')), h('strong', { class: 'cena__titulo' }, t ? t.nome : ep.titulo));
  }
  function legenda(k) {
    const f = falas[k]; if (!f) return [];
    return f.quem === 'mia'
      ? [h('p', { class: 'leg__en', lang: 'en' }, f.texto), ptDe(f) ? h('p', { class: 'leg__pt', lang: 'pt-BR' }, ptDe(f)) : null]
      : [h('p', { class: 'leg__pt', lang: 'pt-BR' }, f.texto)];
  }

  const bolinha = (quem, rotulo, ...filhos) => h('span', { class: `video__pip video__pip--${quem}`, 'aria-hidden': 'true', title: rotulo }, ...filhos);
  const pipLou = bolinha('lou', 'Tuiuiú', lou('feliz', { tamanho: 40, rotulo: '' }));
  const pipMia = bolinha('mia', 'Mia', lou('oi', { tamanho: 46, rotulo: '', mia: true }));
  const contador = h('span', { class: 'chip video__contador', 'aria-hidden': 'true' });
  const palco = h('div', { class: 'video__cena' });
  const caixaLeg = h('div', { class: 'video__legenda' });
  const quemFala = h('p', { class: 'video__status', 'aria-live': 'polite' }, 'Toque no play para começar');
  const fitas = h('div', { class: 'radio-fitas', 'aria-hidden': 'true' }, falas.map((f, k) => h('i', { class: 'radio-fita radio-fita--' + f.quem, dados: { k } })));
  const btnPlay = h('button', { type: 'button', class: 'radio-play', 'aria-label': 'Tocar o episódio', on: { click: () => (tocando ? pausar() : tocar(i)) } }, icone('play'));
  const btnVolta = h('button', { type: 'button', class: 'radio-ctrl', 'aria-label': 'Fala anterior', on: { click: () => pular(-1) } }, icone('skip-back'));
  const btnAvanca = h('button', { type: 'button', class: 'radio-ctrl', 'aria-label': 'Próxima fala', on: { click: () => pular(1) } }, icone('skip-forward'));
  const btnVel = h('button', { type: 'button', class: 'radio-vel', 'aria-pressed': String(devagar), on: { click: () => { devagar = !devagar; localStorageSet('radio-devagar', devagar ? 'sim' : 'nao'); btnVel.setAttribute('aria-pressed', String(devagar)); btnVel.lastChild.textContent = devagar ? 'Devagar' : 'Normal'; if (tocando) tocar(i); } } }, icone('clock'), h('span', {}, devagar ? 'Devagar' : 'Normal'));
  const btnLeg = h('button', { type: 'button', class: 'radio-vel radio-vel--fim', 'aria-pressed': String(legendas), on: { click: () => { legendas = !legendas; localStorageSet('radio-legendas', legendas ? 'sim' : 'nao'); btnLeg.setAttribute('aria-pressed', String(legendas)); video.classList.toggle('sem-legenda', !legendas); } } }, icone('translate'), h('span', {}, 'Legendas'));
  const video = h('div', { class: 'video' + (legendas ? '' : ' sem-legenda') },
    h('div', { class: 'video__tela' },
      h('div', { class: 'video__topo' }, pipLou, pipMia, h('span', { class: 'video__titulo' }, `Episódio de hoje · ${ep.minutos} min`), contador),
      palco, caixaLeg),
    fitas, quemFala,
    h('div', { class: 'radio-controles' }, btnVel, btnVolta, btnPlay, btnAvanca, btnLeg));
  capa.replaceWith(video);
  const avisoCapa = h('div', { class: 'linha-acoes radio-capa__chips' },
    ep.tropecos.length ? h('span', { class: 'chip' }, icone('target'), `${ep.tropecos.length} ${ep.tropecos.length === 1 ? 'tropeço seu' : 'tropeços seus'}`) : h('span', { class: 'chip' }, icone('path'), 'Sobre a sua missão'),
    ep.modo === 'ia' ? h('span', { class: 'chip' }, icone('sparkle'), 'Roteiro escrito pela IA') : null,
    ep.ouvido ? h('span', { class: 'chip chip-ok' }, icone('check'), 'Ouvido hoje') : null);
  video.querySelector('.video__titulo').after(h('h2', { class: 'video__nome' }, ep.titulo));
  video.insertBefore(avisoCapa, fitas);

  // ---------- roteiro (lê junto; toque numa fala para ir até ela)
  const roteiro = h('ol', { class: 'roteiro', 'aria-label': 'Roteiro do episódio' }, falas.map((f, k) => h('li', { class: `roteiro__fala roteiro__fala--${f.quem}` + (f.repita ? ' roteiro__fala--repita' : '') },
    h('button', { type: 'button', class: 'roteiro__btn', on: { click: () => tocar(k) } },
      h('span', { class: 'roteiro__quem' }, lou(f.quem === 'mia' ? 'oi' : 'feliz', { tamanho: 30, rotulo: '', mia: f.quem === 'mia' }), f.quem === 'mia' ? 'Mia' : 'Tuiuiú'),
      f.riscado ? h('span', { class: 'roteiro__riscado riscado', lang: 'en' }, f.riscado) : null,
      h('span', { class: 'roteiro__texto', lang: f.lingua === 'en' ? 'en' : 'pt-BR' }, f.texto),
      f.quem === 'mia' && ptDe(f) ? h('span', { class: 'roteiro__pt', lang: 'pt-BR' }, ptDe(f)) : null,
      f.repita ? h('span', { class: 'chip c-rosa roteiro__sua-vez' }, icone('microphone'), 'Sua vez: repita em voz alta') : null))));

  function marcar() {
    roteiro.querySelectorAll('.roteiro__fala').forEach((li, k) => { li.classList.toggle('agora', k === i); li.classList.toggle('ja', k < i); });
    const f = falas[i];
    fitas.querySelectorAll('i').forEach((fita, k) => {
      fita.classList.toggle('ja', k < i); fita.classList.remove('agora');
      if (k === i && f) {
        fita.style.setProperty('--dur', (palavras(f.texto) / 2.4 * (devagar ? 1.25 : 1) + .6) + 's');
        void fita.offsetWidth; fita.classList.add('agora');
      }
    });
    quemFala.textContent = !f ? 'Fim do episódio' : f.repita ? 'Sua vez: repita depois da Mia' : f.quem === 'mia' ? 'A Mia está falando (inglês)' : 'O Tuiuiú está falando';
    video.dataset.quem = f?.quem || '';
    pipLou.classList.toggle('fala', f?.quem === 'lou'); pipMia.classList.toggle('fala', f?.quem === 'mia');
    contador.textContent = f ? `${i + 1}/${falas.length}` : '';
    if (f) { palco.replaceChildren(cena(i)); caixaLeg.replaceChildren(...legenda(i)); }
    else { palco.replaceChildren(h('div', { class: 'cena cena--topico' }, h('span', { class: 'cena__bolha' }, icone('check')), h('strong', { class: 'cena__titulo' }, 'Fim do episódio'))); caixaLeg.replaceChildren(); }
  }
  function rolar() { const li = roteiro.children[i]; if (li && tocando && roteiro.closest('details')?.open) li.scrollIntoView({ block: 'nearest', behavior: reduzir ? 'auto' : 'smooth' }); }

  const opcoesVoz = f => ({ personagem: f.quem === 'mia' ? 'mia' : 'tuiuiu', idioma: f.lingua, velocidade: (f.lingua === 'en' ? .95 : 1) * (devagar ? .8 : 1) });
  function tocar(k) {
    if (!temVozes()) { toast('Seu navegador não conseguiu reproduzir o áudio. Tente novamente ou acompanhe o roteiro.'); return; }
    const minha = ++geracao;
    clearTimeout(timer); pararVoz();
    i = Math.max(0, Math.min(falas.length - 1, k)); tocando = true;
    btnPlay.replaceChildren(icone('pause')); btnPlay.setAttribute('aria-label', 'Pausar'); video.classList.add('tocando'); video.classList.remove('repita');
    marcar(); rolar();
    const f = falas[i];
    const fim = () => {
      if (minha !== geracao || !tocando) return;
      // o silêncio toca no mesmo player, para o episódio seguir com a tela apagada
      if (f.repita) video.classList.add('repita');
      tocarSilencio(f.repita ? PAUSA_REPITA * (devagar ? 1.3 : 1) : 80, { aoFim: () => { if (minha === geracao) seguir(); } });
    };
    tocarVoz(f.texto, { ...opcoesVoz(f), midia: true, aoFim: fim,
      aoCancelar: () => { if (minha === geracao && tocando) pausar(); },
      aoErro: mensagem => { if (minha === geracao) { pausar(); toast(mensagem, { tipo: 'erro' }); } } });
    // já baixa o começo da próxima fala para a troca não ter espera
    const prox = falas[i + 1]; if (prox) preCarregarVoz(prox.texto, opcoesVoz(prox));
  }
  configurarMidia({ titulo: ep.titulo, aoPlay: () => tocar(i), aoPausa: () => pausar(), aoProxima: () => pular(1), aoAnterior: () => pular(-1) });
  function seguir() { if (i + 1 < falas.length) tocar(i + 1); else terminar(); }
  function pausar() {
    tocando = false; geracao++; clearTimeout(timer); pararVoz();
    btnPlay.replaceChildren(icone('play')); btnPlay.setAttribute('aria-label', 'Continuar o episódio'); video.classList.remove('tocando', 'repita');
  }
  function pular(d) { const alvo = Math.max(0, Math.min(falas.length - 1, i + d)); if (tocando) tocar(alvo); else { i = alvo; marcar(); } }

  async function terminar() {
    pausar(); i = falas.length; marcar(); i = 0;
    try {
      const r = await api('/podcast/ouvido', { metodo: 'POST' });
      if (r.conquistas?.length) { som('fim'); confete(); voarComemorando({ jeito: 'cruza', confetes: false }); for (const c of r.conquistas) toast('Nova figurinha: ' + nomeConquista(c), { tipo: 'ok' }); }
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
    h('details', { class: 'radio-roteiro folha', }, h('summary', {}, icone('file-text'), ' Roteiro completo'), roteiro),
    exs.children.length ? treinoSec : null,
    temVozes() ? null : h('button', { type: 'button', class: 'btn btn-sec', on: { click: terminar } }, icone('check'), 'Li o roteiro todo'));

  // sair da tela para o áudio
  addEventListener('hashchange', () => { pausar(); encerrarMidia(); }, { once: true });
  marcar();
}
