'use strict';
// Somente as quatro vozes oficiais. Chave, síntese e cache ficam no servidor.
const fs = require('node:fs/promises');
const path = require('node:path');
const { createHash, randomUUID } = require('node:crypto');
const { ErroHttp } = require('./http');
const { transacao } = require('./db');

const VOZES = {
  mia: { pt: 'MeTEa1BhTRHHItBKl2mJ', en: 'WshF5zVOQJVpRBKVUjvc' },
  tuiuiu: { pt: '5sXm87IvJC4SNxe0UIfp', en: '1TtJKrO3NEEEDoWRDALC' },
};
function pedidoValido(b = {}) {
  if (!Object.hasOwn(VOZES, b.personagem) || !['pt', 'en'].includes(b.idioma)) throw new ErroHttp(422, 'Escolha a Mia ou o Tuiuiú e o idioma da fala.');
  if (typeof b.texto !== 'string') throw new ErroHttp(422, 'Informe o texto para ouvir.');
  const texto = b.texto.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').trim();
  if (!texto || texto.length > 3000) throw new ErroHttp(422, 'Use de 1 a 3000 caracteres por trecho de áudio.');
  return { texto, personagem: b.personagem, idioma: b.idioma };
}
const inteiro = (v, padrao) => Number.isSafeInteger(Number(v)) && Number(v) > 0 ? Number(v) : padrao;
function criarVozes({ db, dir, env = process.env, fetchImpl = fetch, diaDe = () => new Date().toISOString().slice(0, 10), agora = Date.now }) {
  const chave = env.ELEVENLABS_API_KEY || '', modelo = env.ELEVENLABS_MODEL || 'eleven_flash_v2_5';
  const vozes = Object.fromEntries(Object.entries(VOZES).map(([p, idiomas]) => [p, Object.fromEntries(Object.entries(idiomas).map(([idioma, id]) => [idioma, env[`ELEVENLABS_VOICE_${p === 'mia' ? 'MIA' : 'TUIUIU'}_${idioma.toUpperCase()}`] || id]))]));
  const raiz = path.join(dir, 'vozes'), pendentes = new Map(), versoes = new Map();
  const diasCache = inteiro(env.VOZ_CACHE_DIAS, 30), porPessoa = inteiro(env.VOZ_CARACTERES_DIA, 60000), totalDia = inteiro(env.VOZ_CARACTERES_TOTAL_DIA, 300000);
  const q = sql => db.prepare(sql), pasta = uid => path.join(raiz, String(uid));
  function reservar(uid, dia, quantidade) {
    transacao(db, () => {
      const usados = q('SELECT caracteres FROM uso_voz WHERE user_id = ? AND dia = ?').get(uid, dia)?.caracteres || 0;
      const total = q('SELECT SUM(caracteres) n FROM uso_voz WHERE dia = ?').get(dia).n || 0;
      if (usados + quantidade > porPessoa || total + quantidade > totalDia) throw new ErroHttp(429, 'O limite de novos áudios de hoje foi atingido. Os textos continuam disponíveis; tente ouvir novamente mais tarde.');
      q('INSERT INTO uso_voz (user_id, dia, caracteres) VALUES (?,?,?) ON CONFLICT(user_id,dia) DO UPDATE SET caracteres = caracteres + excluded.caracteres').run(uid, dia, quantidade);
    });
  }
  async function sintetizar(uid, entrada) {
    const pedido = pedidoValido(entrada);
    if (!Number.isSafeInteger(uid) || uid < 1) throw new ErroHttp(401, 'Faça login para ouvir.');
    const voz = vozes[pedido.personagem][pedido.idioma];
    if (!/^[A-Za-z0-9]{20,64}$/.test(voz)) throw new ErroHttp(503, 'A voz deste personagem ainda não está configurada.');
    const hash = createHash('sha256').update(JSON.stringify([uid, voz, modelo, 'v1', pedido.idioma, pedido.texto])).digest('hex');
    const arquivo = path.join(pasta(uid), hash + '.mp3');
    try {
      const stat = await fs.stat(arquivo);
      if (stat.mtimeMs + diasCache * 864e5 > agora()) return { audio: await fs.readFile(arquivo), cache: true };
      await fs.unlink(arquivo);
    } catch (e) { if (e.code !== 'ENOENT') throw new ErroHttp(503, 'Não foi possível preparar o áudio agora.'); }
    const id = uid + ':' + hash;
    if (pendentes.has(id)) return pendentes.get(id);
    if (!chave.startsWith('sk_')) throw new ErroHttp(503, 'As vozes da Mia e do Tuiuiú ainda não estão disponíveis neste servidor.');
    if (pendentes.size >= 4) throw new ErroHttp(429, 'Estamos preparando outros áudios. Tente ouvir de novo em instantes.');
    const versao = versoes.get(uid) || 0, dia = diaDe(uid);
    const trabalho = (async () => {
      reservar(uid, dia, pedido.texto.length);
      let temporario;
      try {
        const resposta = await fetchImpl('https://api.elevenlabs.io/v1/text-to-speech/' + voz + '?output_format=mp3_44100_128', {
          method: 'POST', headers: { 'xi-api-key': chave, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
          body: JSON.stringify({ text: pedido.texto, model_id: modelo, ...(modelo === 'eleven_multilingual_v2' ? {} : { language_code: pedido.idioma }), voice_settings: { stability: .5, similarity_boost: .75, speed: 1 } }),
          signal: AbortSignal.timeout(30000),
        });
        if (!resposta.ok || !/^audio\/(mpeg|mp3)(?:;|$)/i.test(resposta.headers.get('content-type') || '')) throw new Error('sintese_indisponivel');
        const partes = []; let bytes = 0;
        for await (const bloco of resposta.body) { bytes += bloco.length; if (bytes > 8 * 1024 * 1024) throw new Error('audio_grande'); partes.push(Buffer.from(bloco)); }
        const audio = Buffer.concat(partes);
        if (audio.length < 3 || !(audio.subarray(0, 3).toString() === 'ID3' || (audio[0] === 0xff && (audio[1] & 0xe0) === 0xe0))) throw new Error('audio_invalido');
        // Apagar dados durante a geração também impede a criação posterior do arquivo.
        if ((versoes.get(uid) || 0) === versao) {
          await fs.mkdir(pasta(uid), { recursive: true, mode: 0o700 });
          temporario = path.join(pasta(uid), '.' + randomUUID() + '.tmp');
          await fs.writeFile(temporario, audio, { mode: 0o600 });
          if ((versoes.get(uid) || 0) === versao) await fs.rename(temporario, arquivo);
        }
        return { audio, cache: false };
      } catch {
        // Não registra texto, chave ou resposta do provedor em logs ou mensagens ao navegador.
        q('UPDATE uso_voz SET caracteres = MAX(0, caracteres - ?) WHERE user_id = ? AND dia = ?').run(pedido.texto.length, uid, dia);
        throw new ErroHttp(503, 'Não consegui preparar esta fala agora. Tente novamente; a voz do personagem será mantida.');
      } finally { if (temporario) await fs.rm(temporario, { force: true }).catch(() => {}); }
    })();
    pendentes.set(id, trabalho);
    try { return await trabalho; } finally { pendentes.delete(id); }
  }
  async function limparUsuario(uid) { versoes.set(uid, (versoes.get(uid) || 0) + 1); await fs.rm(pasta(uid), { recursive: true, force: true }); }
  async function limparExpirados() {
    for (const pessoa of await fs.readdir(raiz, { withFileTypes: true }).catch(() => [])) {
      if (!pessoa.isDirectory() || !/^\d+$/.test(pessoa.name)) continue;
      for (const f of await fs.readdir(path.join(raiz, pessoa.name), { withFileTypes: true }).catch(() => [])) {
        if (!f.isFile()) continue;
        const arquivo = path.join(raiz, pessoa.name, f.name), stat = await fs.stat(arquivo).catch(() => null);
        if (stat && stat.mtimeMs + diasCache * 864e5 <= agora()) await fs.rm(arquivo, { force: true });
      }
    }
  }
  limparExpirados().catch(() => {});
  const limpeza = setInterval(() => limparExpirados().catch(() => {}), 864e5); limpeza.unref();
  return { sintetizar, limparUsuario, fechar: () => clearInterval(limpeza) };
}
module.exports = { criarVozes, pedidoValido, VOZES };
