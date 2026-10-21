'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function player(fetchImpl) {
  const urls = new Map(), reproducoes = [], eventos = {}, chamadas = [];
  let indice = 0, sintetizadasPeloAparelho = 0;
  class Audio {
    pause() {} removeAttribute() {} load() {}
    async play() { const blob = urls.get(this.src); if (blob?.type === 'audio/mpeg') { reproducoes.push(this.src); setTimeout(() => this.onended?.(), 0); } }
  }
  const contexto = vm.createContext({ Audio, Blob, Uint8Array, DataView, AbortController, DOMException, setTimeout,
    URL: { createObjectURL: b => { const id = 'blob:' + indice++; urls.set(id, b); return id; }, revokeObjectURL: id => urls.delete(id) },
    addEventListener: (nome, fn) => { eventos[nome] = fn; },
    speechSynthesis: { speak: () => { sintetizadasPeloAparelho++; throw new Error('voz não autorizada'); } },
    fetch: async (url, opts) => { chamadas.push({ url, ...JSON.parse(opts.body) }); return fetchImpl(url, opts); },
  });
  const fonte = fs.readFileSync(path.join(__dirname, '../public/assets/js/voz.js'), 'utf8').replace(/^export /gm, '');
  vm.runInContext(fonte, contexto);
  return { contexto, reproducoes, chamadas, urls, eventos, sintetizadas: () => sintetizadasPeloAparelho };
}
const mp3 = () => new Response(Buffer.from('ID3audio'), { headers: { 'Content-Type': 'audio/mpeg' } });

test('player lê todo o texto em trechos no mesmo personagem e idioma, e libera os arquivos temporários', async () => {
  const p = player(async () => mp3()), texto = 'Uma palavra de cada vez. '.repeat(220).trim();
  await new Promise((resolve, reject) => p.contexto.tocarVoz(texto, { personagem: 'tuiuiu', idioma: 'pt', aoFim: resolve, aoErro: reject }));
  assert.ok(p.chamadas.length > 1);
  assert.equal(p.chamadas.map(c => c.texto).join(' '), texto);
  assert.ok(p.chamadas.every(c => c.personagem === 'tuiuiu' && c.idioma === 'pt' && c.texto.length <= 2400));
  assert.equal(p.reproducoes.length, p.chamadas.length); assert.equal(p.urls.size, 0); assert.equal(p.sintetizadas(), 0);
});

test('se o serviço falha, informa o erro sem tentar voz do navegador ou gravação antiga', async () => {
  const p = player(async () => new Response(JSON.stringify({ erro: 'Tente novamente.' }), { status: 503 }));
  const erro = await new Promise(resolve => p.contexto.tocarVoz('Hello!', { aoErro: resolve }));
  assert.equal(erro, 'Tente novamente.'); assert.equal(p.chamadas.length, 1);
  assert.equal(p.reproducoes.length, 0); assert.equal(p.sintetizadas(), 0); assert.equal(p.urls.size, 0);
});

test('sair da tela durante a preparação impede reprodução tardia', async () => {
  let responder;
  const p = player(() => new Promise(resolve => { responder = resolve; }));
  p.contexto.tocarVoz('Hello!'); p.eventos.hashchange(); responder(mp3());
  await new Promise(resolve => setTimeout(resolve, 20));
  assert.equal(p.reproducoes.length, 0); assert.equal(p.urls.size, 0); assert.equal(p.sintetizadas(), 0);
});
