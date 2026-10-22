// Player único: nenhuma síntese do navegador nem gravação antiga substitui os personagens.
let geracao = 0, atual = null, contextoAudio = null;
function avisar(fase, personagem) {
  if (typeof dispatchEvent === 'function' && typeof CustomEvent === 'function') dispatchEvent(new CustomEvent('inglou:voz', { detail: { fase, personagem } }));
}
function liberar(estado) {
  if (!estado) return;
  if (estado.fonte) { estado.fonte.onended = null; try { estado.fonte.stop(); } catch {} estado.fonte.disconnect(); estado.fonte = null; }
}
function silenciarContexto() { if (contextoAudio?.state === 'running') contextoAudio.suspend().catch(() => {}); }
export function pararVoz() {
  geracao++;
  const anterior = atual; atual = null;
  anterior?.controle.abort(); liberar(anterior); silenciarContexto(); anterior?.aoCancelar?.();
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
export function tocarVoz(texto, { personagem = 'mia', idioma = 'en', velocidade = 1, emocao = 'contexto', aoFim, aoErro, aoCancelar } = {}) {
  const trechos = trechosDe(texto);
  if (!trechos.length || !temVoz()) { aoErro?.('O áudio não está disponível neste navegador.'); return false; }
  pararVoz();
  const minha = geracao, controle = new AbortController();
  let desbloquear;
  try {
    contextoAudio ||= new (classeAudio())({ latencyHint: 'interactive' });
    // Fala pontual da atividade, sem elemento de mídia nem sessão de música.
    try { if (globalThis.navigator?.audioSession) navigator.audioSession.type = 'transient'; } catch {}
    desbloquear = contextoAudio.resume();
  } catch { aoErro?.('Não consegui iniciar o áudio. Toque em ouvir novamente.'); return false; }
  const estado = { controle, fonte: null, aoCancelar }; atual = estado;
  avisar('preparando', personagem);
  const ativa = () => atual === estado && minha === geracao && !controle.signal.aborted;
  (async () => {
    try {
      await desbloquear;
      if (!ativa()) return;
      const preparar = async i => {
        const r = await fetch('/api/v1/vozes/sintetizar', {
          method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-Inglou': '1' },
          body: JSON.stringify({ texto: trechos[i], personagem, idioma, emocao, velocidade: Math.max(.5, Math.min(1.6, Number(velocidade) || 1)),
            anterior: i ? trechos[i - 1].slice(-500) : '', seguinte: trechos[i + 1]?.slice(0, 500) || '' }), signal: controle.signal,
        });
        if (!r.ok) { const d = await r.json().catch(() => null); throw new Error(d?.erro || 'Não consegui preparar esta fala. Tente novamente.'); }
        if (!/^audio\/mpeg(?:;|$)/i.test(r.headers.get('content-type') || '')) throw new Error('Não consegui carregar o áudio. Tente novamente.');
        const dados = await r.arrayBuffer();
        if (!ativa()) return null;
        return contextoAudio.decodeAudioData(dados);
      };
      let proximo = preparar(0);
      for (let i = 0; i < trechos.length; i++) {
        const blob = await proximo;
        if (!ativa()) return;
        // Prepara somente o próximo trecho enquanto o atual toca, evitando esperar pela rede entre frases.
        proximo = i + 1 < trechos.length ? preparar(i + 1) : null;
        proximo?.catch(() => {}); // A falha é apresentada quando chegar a vez deste trecho.
        const fonte = contextoAudio.createBufferSource(); fonte.buffer = blob;
        // A velocidade é gerada pelo provedor, preservando o timbre sem acelerar o MP3 no aparelho.
        fonte.connect(contextoAudio.destination); estado.fonte = fonte;
        avisar('falando', personagem);
        await new Promise((resolve, reject) => {
          const limpar = () => { fonte.onended = null; controle.signal.removeEventListener('abort', cancelar); };
          const cancelar = () => { limpar(); reject(new DOMException('Cancelado', 'AbortError')); };
          fonte.onended = () => { limpar(); fonte.disconnect(); estado.fonte = null; resolve(); };
          controle.signal.addEventListener('abort', cancelar, { once: true });
          try { fonte.start(); } catch { limpar(); reject(new Error('Não foi possível tocar. Confira o volume e toque em ouvir novamente.')); }
        });
        if (!ativa()) return;
      }
      if (ativa()) { atual = null; liberar(estado); silenciarContexto(); avisar('parado'); aoFim?.(); }
    } catch (e) {
      if (!ativa() || e.name === 'AbortError') return;
      atual = null; controle.abort(); liberar(estado); silenciarContexto(); avisar('parado'); aoErro?.(e.message);
    }
  })();
  return true;
}
addEventListener('hashchange', pararVoz);

addEventListener('pagehide', pararVoz);
if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => { if (document.hidden) pararVoz(); });
