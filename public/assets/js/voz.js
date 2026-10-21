// Player único: nenhuma síntese do navegador nem gravação antiga substitui os personagens.
let geracao = 0, atual = null;
function avisar(fase, personagem) {
  if (typeof dispatchEvent === 'function' && typeof CustomEvent === 'function') dispatchEvent(new CustomEvent('inglou:voz', { detail: { fase, personagem } }));
}
function liberar(estado) {
  if (!estado) return;
  estado.audio.onended = null; estado.audio.onerror = null;
  estado.audio.pause(); estado.audio.removeAttribute('src'); estado.audio.load();
  for (const url of estado.urls) URL.revokeObjectURL(url);
}
export function pararVoz() {
  geracao++;
  const anterior = atual; atual = null;
  anterior?.controle.abort(); liberar(anterior); anterior?.aoCancelar?.();
  avisar('parado');
}
function trechosDe(texto) {
  const fila = [];
  for (const valor of Array.isArray(texto) ? texto : [texto]) {
    let resto = String(valor ?? '').trim();
    while (resto.length > 2400) {
      let fim = resto.lastIndexOf(' ', 2400);
      if (fim < 1) fim = 2400;
      fila.push(resto.slice(0, fim)); resto = resto.slice(fim).trim();
    }
    if (resto) fila.push(resto);
  }
  return fila;
}
function silencioInicial() {
  // Desbloqueia o elemento de áudio no gesto do usuário (Safari). É silêncio, sem fala alternativa.
  const bytes = new Uint8Array(844), d = new DataView(bytes.buffer);
  const escrever = (n, texto) => [...texto].forEach((c, i) => { bytes[n + i] = c.charCodeAt(0); });
  escrever(0, 'RIFF'); d.setUint32(4, 836, true); escrever(8, 'WAVE'); escrever(12, 'fmt ');
  d.setUint32(16, 16, true); d.setUint16(20, 1, true); d.setUint16(22, 1, true); d.setUint32(24, 8000, true);
  d.setUint32(28, 16000, true); d.setUint16(32, 2, true); d.setUint16(34, 16, true); escrever(36, 'data'); d.setUint32(40, 800, true);
  return new Blob([bytes], { type: 'audio/wav' });
}
export const temVoz = () => typeof Audio === 'function' && typeof fetch === 'function';
export function tocarVoz(texto, { personagem = 'mia', idioma = 'en', velocidade = 1, aoFim, aoErro, aoCancelar } = {}) {
  const trechos = trechosDe(texto);
  if (!trechos.length || !temVoz()) { aoErro?.('O áudio não está disponível neste navegador.'); return false; }
  pararVoz();
  const minha = geracao, audio = new Audio(), controle = new AbortController();
  const estado = { audio, controle, urls: [], aoCancelar }; atual = estado;
  avisar('preparando', personagem);
  const silencio = URL.createObjectURL(silencioInicial()); estado.urls.push(silencio); audio.src = silencio;
  audio.play().catch(() => {});
  const ativa = () => atual === estado && minha === geracao && !controle.signal.aborted;
  (async () => {
    try {
      for (const trecho of trechos) {
        const r = await fetch('/api/v1/vozes/sintetizar', {
          method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-Inglou': '1' },
          body: JSON.stringify({ texto: trecho, personagem, idioma }), signal: controle.signal,
        });
        if (!r.ok) { const d = await r.json().catch(() => null); throw new Error(d?.erro || 'Não consegui preparar esta fala. Tente novamente.'); }
        if (!/^audio\/mpeg(?:;|$)/i.test(r.headers.get('content-type') || '')) throw new Error('Não consegui carregar o áudio. Tente novamente.');
        const blob = await r.blob();
        if (!ativa()) return;
        audio.pause();
        const url = URL.createObjectURL(blob); estado.urls.push(url); audio.src = url;
        audio.playbackRate = Math.max(.5, Math.min(1.6, Number(velocidade) || 1)); audio.preservesPitch = true;
        avisar('falando', personagem);
        await new Promise((resolve, reject) => {
          const limpar = () => { audio.onended = null; audio.onerror = null; controle.signal.removeEventListener('abort', cancelar); };
          const cancelar = () => { limpar(); reject(new DOMException('Cancelado', 'AbortError')); };
          audio.onended = () => { limpar(); resolve(); };
          audio.onerror = () => { limpar(); reject(new Error('O áudio parou. Toque em ouvir para tentar novamente.')); };
          controle.signal.addEventListener('abort', cancelar, { once: true });
          audio.play().catch(() => { limpar(); reject(new Error('Não foi possível tocar. Confira o volume e toque em ouvir novamente.')); });
        });
        URL.revokeObjectURL(url); estado.urls.splice(estado.urls.indexOf(url), 1);
        if (!ativa()) return;
      }
      if (ativa()) { atual = null; liberar(estado); avisar('parado'); aoFim?.(); }
    } catch (e) {
      if (!ativa() || e.name === 'AbortError') return;
      atual = null; liberar(estado); avisar('parado'); aoErro?.(e.message);
    }
  })();
  return true;
}
addEventListener('hashchange', pararVoz);
