// Player único: nenhuma síntese do navegador nem gravação antiga substitui os personagens.
let geracao = 0, atual = null, contextoAudio = null, sessaoAnterior = null, suspensaoAudio = Promise.resolve();
function avisar(fase, personagem) {
  if (typeof dispatchEvent === 'function' && typeof CustomEvent === 'function') dispatchEvent(new CustomEvent('inglou:voz', { detail: { fase, personagem } }));
}
function liberar(estado) {
  if (!estado) return;
  if (estado.fonte) { estado.fonte.onended = null; try { estado.fonte.stop(); } catch {} estado.fonte.disconnect(); estado.fonte = null; }
}
function ativarSessaoDeFala(tipo) {
  // Falas curtas das aulas usam 'transient', como os sons de Duolingo e WhatsApp: não viram "tocando agora" no Controle do iPhone.
  // O podcast usa 'playback' (tela apagada, outros apps, controles na tela de bloqueio).
  try {
    const sessao = globalThis.navigator?.audioSession;
    if (sessao) { if (sessaoAnterior === null) sessaoAnterior = sessao.type; sessao.type = tipo; }
  } catch {}
}
function restaurarSessaoAudio() {
  if (sessaoAnterior === null) return;
  try { globalThis.navigator.audioSession.type = sessaoAnterior; } catch {}
  sessaoAnterior = null;
}
function silenciarContexto() {
  const pausa = contextoAudio?.state === 'running' || contextoAudio?.state === 'interrupted' ? contextoAudio.suspend().catch(() => {}) : Promise.resolve();
  suspensaoAudio = Promise.all([suspensaoAudio, pausa]);
  // Uma pausa antiga não pode rebaixar a sessão da próxima fala que já começou.
  pausa.then(() => { if (!atual) restaurarSessaoAudio(); });
}
// Podcast: um <audio> de verdade, para tocar com a tela apagada e aparecer na tela de bloqueio com botões.
// Os silêncios entre as falas também tocam por ele, para o iPhone não suspender a página no meio do episódio.
let midia = null, urlMidia = null, emEpisodio = false;
function elementoMidia() { if (!midia) { midia = new Audio(); midia.preload = 'auto'; } return midia; }
function soltarMidia() { if (urlMidia) { URL.revokeObjectURL(urlMidia); urlMidia = null; } }
function silencioWav(ms) {
  const taxa = 8000, n = Math.max(1, Math.round(taxa * ms / 1000)), b = new DataView(new ArrayBuffer(44 + n));
  const t = (o, x) => [...x].forEach((c, k) => b.setUint8(o + k, c.charCodeAt(0)));
  t(0, 'RIFF'); b.setUint32(4, 36 + n, true); t(8, 'WAVEfmt '); b.setUint32(16, 16, true); b.setUint16(20, 1, true); b.setUint16(22, 1, true);
  b.setUint32(24, taxa, true); b.setUint32(28, taxa, true); b.setUint16(32, 1, true); b.setUint16(34, 8, true); t(36, 'data'); b.setUint32(40, n, true);
  for (let k = 0; k < n; k++) b.setUint8(44 + k, 128);
  return new Blob([b.buffer], { type: 'audio/wav' });
}
function tocarNoElemento(blob, estado) {
  const el = elementoMidia(); soltarMidia();
  urlMidia = URL.createObjectURL(blob); el.src = urlMidia;
  return new Promise((resolve, reject) => {
    const limpar = () => { el.onended = el.onerror = null; estado.controle.signal.removeEventListener('abort', cancelar); };
    const cancelar = () => { limpar(); el.pause(); reject(new DOMException('Cancelado', 'AbortError')); };
    el.onended = () => { limpar(); resolve(); };
    el.onerror = () => { limpar(); reject(new Error('Não foi possível tocar. Confira o volume e toque em ouvir novamente.')); };
    estado.controle.signal.addEventListener('abort', cancelar, { once: true });
    el.play().catch(() => { limpar(); reject(new Error('Não foi possível tocar. Confira o volume e toque em ouvir novamente.')); });
  });
}
// Botões da tela de bloqueio e do Controle do iPhone
export function configurarMidia({ titulo, aoPlay, aoPausa, aoProxima, aoAnterior } = {}) {
  emEpisodio = true;
  const ms = globalThis.navigator?.mediaSession; if (!ms) return;
  try {
    ms.metadata = new MediaMetadata({ title: titulo || 'Rádio Tuiuiú', artist: 'Inglou', album: 'Rádio Tuiuiú' });
    for (const [acao, fn] of [['play', aoPlay], ['pause', aoPausa], ['nexttrack', aoProxima], ['previoustrack', aoAnterior]]) ms.setActionHandler(acao, fn || null);
  } catch {}
}
export function encerrarMidia() {
  emEpisodio = false;
  const ms = globalThis.navigator?.mediaSession;
  try { if (ms) { ms.metadata = null; for (const a of ['play', 'pause', 'nexttrack', 'previoustrack']) ms.setActionHandler(a, null); } } catch {}
  if (midia) { midia.pause(); midia.removeAttribute('src'); midia.load?.(); }
  soltarMidia(); restaurarSessaoAudio();
}
export function tocarSilencio(ms, { aoFim } = {}) {
  pararVoz();
  const minha = geracao, controle = new AbortController(), estado = { controle, fonte: null }; atual = estado;
  ativarSessaoDeFala('playback');
  tocarNoElemento(silencioWav(ms), estado).then(() => { if (atual === estado && minha === geracao) { atual = null; aoFim?.(); } }, () => {});
}
export function pararVoz() {
  geracao++;
  const anterior = atual; atual = null;
  anterior?.controle.abort(); liberar(anterior); if (!emEpisodio) silenciarContexto(); anterior?.aoCancelar?.();
  avisar('parado');
}
function trechosDe(texto) {
  // Parágrafos juntos dão à voz o contexto da leitura, em vez de reiniciar a entonação a cada linha.
  let resto = (Array.isArray(texto) ? texto : [texto]).map(t => String(t ?? '').trim()).filter(Boolean).join('\n\n');
  const fila = [];
  while (resto.length > 2400) {
    const janela = resto.slice(0, 2401);
    const pausas = [...janela.matchAll(/[.!?…][”"'’):\]]*(?=\s)|\n\n/g)].map(m => m.index + m[0].length).filter(n => n >= 400 && n <= 2400);
    let fim = pausas.at(-1) || resto.lastIndexOf(' ', 2400);
    if (fim < 1) fim = 2400;
    fila.push(resto.slice(0, fim).trim()); resto = resto.slice(fim).trim();
  }
  if (resto) fila.push(resto);
  return fila;
}
const classeAudio = () => globalThis.AudioContext || globalThis.webkitAudioContext;
export const temVoz = () => !!classeAudio() && typeof fetch === 'function';
// Corpo do pedido de síntese. Pré-carga e reprodução usam o mesmo texto para compartilhar o áudio já baixado.
const corpoDe = (trechos, i, { personagem, idioma, emocao, velocidade }) => JSON.stringify({ texto: trechos[i], personagem, idioma, emocao, velocidade: Math.max(.5, Math.min(1.6, Number(velocidade) || 1)),
  anterior: i ? trechos[i - 1].slice(-500) : '', seguinte: trechos[i + 1]?.slice(0, 500) || '' });
const preCarga = new Map();
async function requisitar(corpo, signal) {
  const r = await fetch('/api/v1/vozes/sintetizar', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-Inglou': '1' }, body: corpo, signal });
  if (!r.ok) { const d = await r.json().catch(() => null); throw new Error(d?.erro || 'Não consegui preparar esta fala. Tente novamente.'); }
  if (!/^audio\/mpeg(?:;|$)/i.test(r.headers.get('content-type') || '')) throw new Error('Não consegui carregar o áudio. Tente novamente.');
  return r.arrayBuffer();
}
// Usa o áudio pré-carregado, se houver. decodeAudioData consome o buffer, então a entrada sai do mapa.
async function baixar(corpo, signal) {
  const pronto = preCarga.get(corpo);
  if (!pronto) return requisitar(corpo, signal);
  preCarga.delete(corpo);
  try { return await pronto; } catch { return requisitar(corpo, signal); }
}
// Baixa antes o começo da próxima fala para a troca não ter espera. Falha em silêncio: a reprodução tenta de novo.
export function preCarregarVoz(texto, { personagem = 'mia', idioma = 'en', velocidade = 1, emocao = 'contexto' } = {}) {
  const trechos = trechosDe(texto);
  if (!trechos.length || !temVoz()) return;
  const corpo = corpoDe(trechos, 0, { personagem, idioma, emocao, velocidade });
  if (preCarga.has(corpo)) return;
  if (preCarga.size > 6) preCarga.delete(preCarga.keys().next().value);
  const promessa = requisitar(corpo); promessa.catch(() => preCarga.delete(corpo));
  preCarga.set(corpo, promessa);
}
export function tocarVoz(texto, { personagem = 'mia', idioma = 'en', velocidade = 1, emocao = 'contexto', midia: noPlayer = false, aoFim, aoErro, aoCancelar } = {}) {
  const trechos = trechosDe(texto);
  if (!trechos.length || !temVoz()) { aoErro?.('O áudio não está disponível neste navegador.'); return false; }
  pararVoz();
  const pausaAnterior = suspensaoAudio;
  const minha = geracao, controle = new AbortController();
  let desbloquear;
  try {
    ativarSessaoDeFala(noPlayer ? 'playback' : 'transient');
    if (noPlayer) desbloquear = Promise.resolve();
    else { contextoAudio ||= new (classeAudio())({ latencyHint: 'interactive' }); desbloquear = contextoAudio.resume(); }
  } catch { restaurarSessaoAudio(); aoErro?.('Não consegui iniciar o áudio. Toque em ouvir novamente.'); return false; }
  const estado = { controle, fonte: null, aoCancelar }; atual = estado;
  avisar('preparando', personagem);
  const ativa = () => atual === estado && minha === geracao && !controle.signal.aborted;
  (async () => {
    try {
      await desbloquear;
      await pausaAnterior;
      if (!ativa()) return;
      const preparar = async i => {
        const dados = await baixar(corpoDe(trechos, i, { personagem, idioma, emocao, velocidade }), controle.signal);
        if (!ativa()) return null;
        return noPlayer ? new Blob([dados], { type: 'audio/mpeg' }) : contextoAudio.decodeAudioData(dados);
      };
      let proximo = preparar(0);
      for (let i = 0; i < trechos.length; i++) {
        const blob = await proximo;
        if (!ativa()) return;
        // Uma suspensão da fala anterior pode terminar depois do primeiro resume
        // (Safari). Retoma o contexto antes de iniciar a fonte para não tocar em silêncio.
        if (!noPlayer && contextoAudio.state !== 'running') await contextoAudio.resume();
        if (!ativa()) return;
        // Prepara somente o próximo trecho enquanto o atual toca, evitando esperar pela rede entre frases.
        proximo = i + 1 < trechos.length ? preparar(i + 1) : null;
        proximo?.catch(() => {}); // A falha é apresentada quando chegar a vez deste trecho.
        avisar('falando', personagem);
        if (noPlayer) { await tocarNoElemento(blob, estado); if (!ativa()) return; continue; }
        const fonte = contextoAudio.createBufferSource(); fonte.buffer = blob;
        // A velocidade é gerada pelo provedor, preservando o timbre sem acelerar o MP3 no aparelho.
        fonte.connect(contextoAudio.destination); estado.fonte = fonte;
        await new Promise((resolve, reject) => {
          const limpar = () => { fonte.onended = null; controle.signal.removeEventListener('abort', cancelar); };
          const cancelar = () => { limpar(); reject(new DOMException('Cancelado', 'AbortError')); };
          fonte.onended = () => { limpar(); fonte.disconnect(); estado.fonte = null; resolve(); };
          controle.signal.addEventListener('abort', cancelar, { once: true });
          try { fonte.start(); } catch { limpar(); reject(new Error('Não foi possível tocar. Confira o volume e toque em ouvir novamente.')); }
        });
        if (!ativa()) return;
      }
      if (ativa()) { atual = null; liberar(estado); if (!noPlayer) silenciarContexto(); avisar('parado'); aoFim?.(); }
    } catch (e) {
      if (!ativa() || e.name === 'AbortError') return;
      atual = null; controle.abort(); liberar(estado); if (!noPlayer) silenciarContexto(); avisar('parado'); aoErro?.(e.message);
    }
  })();
  return true;
}
addEventListener('hashchange', pararVoz);

addEventListener('pagehide', () => { encerrarMidia(); pararVoz(); });
if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => { if (document.hidden && !emEpisodio) pararVoz(); });
