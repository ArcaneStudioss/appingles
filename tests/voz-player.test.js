'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function player(fetchImpl) {
  const urls = new Map(), reproducoes = [], eventos = {}, chamadas = [], fontes = [];
  let sintetizadasPeloAparelho = 0, estados = [], tiposSessao = [], tipoSessao = 'auto';
  const audioSession = { get type() { return tipoSessao; }, set type(v) { tipoSessao = v; tiposSessao.push(v); } };
  class AudioContext {
    constructor() { this.state = 'suspended'; this.destination = {}; }
    async resume() { this.state = 'running'; estados.push(this.state); }
    async suspend() { this.state = 'suspended'; estados.push(this.state); }
    async decodeAudioData(dados) { return { dados }; }
    createBufferSource() {
      const fonte = { connect() {}, disconnect() {}, stop() { this.parou = true; }, start() { reproducoes.push(this.buffer); setTimeout(() => this.onended?.(), 0); } };
      fontes.push(fonte); return fonte;
    }
  }
  const documento = { hidden: false, addEventListener: (nome, fn) => { eventos[nome] = fn; } };
  const contexto = vm.createContext({ AudioContext, navigator: { audioSession }, document: documento, Audio: class { constructor() { throw new Error('reprodutor de mídia não deve ser criado'); } }, AbortController, DOMException, setTimeout,
    addEventListener: (nome, fn) => { eventos[nome] = fn; },
    speechSynthesis: { speak: () => { sintetizadasPeloAparelho++; throw new Error('voz não autorizada'); } },
    fetch: async (url, opts) => { chamadas.push({ url, ...JSON.parse(opts.body) }); return fetchImpl(url, opts); },
  });
  const fonte = fs.readFileSync(path.join(__dirname, '../public/assets/js/voz.js'), 'utf8').replace(/^export /gm, '');
  vm.runInContext(fonte, contexto);
  return { contexto, reproducoes, chamadas, urls, eventos, fontes, estados, documento, audioSession, tiposSessao, sintetizadas: () => sintetizadasPeloAparelho };
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
  p.contexto.tocarVoz('Hello!'); await new Promise(resolve => setTimeout(resolve, 0)); p.eventos.hashchange(); responder(mp3());
  await new Promise(resolve => setTimeout(resolve, 20));
  assert.equal(p.reproducoes.length, 0); assert.equal(p.urls.size, 0); assert.equal(p.sintetizadas(), 0);
});


test('une parágrafos e corta leituras no fim da frase, enviando contexto e tom sem descartar texto', async () => {
  const p = player(async () => mp3());
  const paragrafos = ['She was happy to see her friends. '.repeat(50).trim(), 'They celebrated the end of the journey. '.repeat(40).trim()];
  await new Promise((resolve, reject) => p.contexto.tocarVoz(paragrafos, { emocao: 'feliz', velocidade: .8, aoFim: resolve, aoErro: reject }));
  assert.equal(p.chamadas.map(c => c.texto).join(' ').replace(/\s+/g, ' '), paragrafos.join(' ').replace(/\s+/g, ' '));
  assert.ok(p.chamadas.slice(0, -1).every(c => /[.!?]$/.test(c.texto)));
  assert.equal(p.chamadas[0].anterior, ''); assert.ok(p.chamadas[0].seguinte.length > 0);
  assert.equal(p.chamadas[1].anterior, p.chamadas[0].texto.slice(-500));
  assert.ok(p.chamadas.every(c => c.emocao === 'feliz' && c.velocidade === .8 && c.anterior.length <= 500 && c.seguinte.length <= 500));
  assert.equal(p.estados.at(-1), 'suspended');
});

test('prepara o próximo trecho enquanto o atual toca e cancela ao esconder o app', async () => {
  let pedidos = 0, liberarSegundo;
  const p = player(async () => ++pedidos === 1 ? mp3() : new Promise(resolve => { liberarSegundo = resolve; }));
  p.contexto.tocarVoz('A complete sentence. '.repeat(200));
  await new Promise(resolve => setTimeout(resolve, 10));
  assert.equal(pedidos, 2); assert.equal(p.reproducoes.length, 1);
  p.documento.hidden = true; p.eventos.visibilitychange(); liberarSegundo(mp3());
  await new Promise(resolve => setTimeout(resolve, 10));
  assert.equal(p.reproducoes.length, 1); assert.equal(p.estados.at(-1), 'suspended');
});

test('sair da página para a reprodução e uma nova fala não retoma a anterior', async () => {
  const p = player(async () => mp3());
  p.contexto.tocarVoz('First phrase.'); await new Promise(resolve => setTimeout(resolve, 0));
  p.eventos.pagehide();
  assert.ok(p.fontes.every(f => f.parou || !f.onended));
  await new Promise((resolve, reject) => p.contexto.tocarVoz('New phrase.', { aoFim: resolve, aoErro: reject }));
  assert.equal(p.estados.at(-1), 'suspended'); assert.equal(p.sintetizadas(), 0);
});

test('fala da aula usa sessão transient (fora do Controle do iPhone) e restaura a sessão após concluir', async () => {
  const p = player(async () => { assert.equal(p.audioSession.type, 'transient'); return mp3(); });
  await new Promise((resolve, reject) => p.contexto.tocarVoz('Vamos aprender juntos.', { aoFim: resolve, aoErro: reject }));
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.deepEqual(p.tiposSessao, ['transient', 'auto']);
  assert.equal(p.audioSession.type, 'auto'); assert.equal(p.reproducoes.length, 1);
});

test('podcast toca em <audio> com sessão playback e mantém tocando ao esconder o app', async () => {
  const p = player(async () => mp3());
  const tocados = [];
  p.contexto.Audio = class { play() { tocados.push(this.src); setTimeout(() => this.onended?.(), 0); return Promise.resolve(); } pause() {} removeAttribute() {} };
  p.contexto.URL = { createObjectURL: () => 'blob:x', revokeObjectURL() {} };
  p.contexto.Blob = Blob; p.contexto.configurarMidia({ titulo: 'Episódio' });
  await new Promise((resolve, reject) => p.contexto.tocarVoz('Hello there.', { midia: true, aoFim: resolve, aoErro: reject }));
  assert.equal(tocados.length, 1); assert.equal(p.reproducoes.length, 0); assert.ok(p.tiposSessao.includes('playback'));
  p.contexto.tocarVoz('Another one.', { midia: true }); p.documento.hidden = true; p.eventos.visibilitychange();
  await new Promise(resolve => setTimeout(resolve, 20));
  assert.equal(tocados.length, 2);
});

test('trocar de fala durante preparação mantém a sessão e cancelar ou falhar libera a sessão', async () => {
  let liberar;
  const p = player(async () => new Promise(resolve => { liberar = resolve; }));
  p.contexto.tocarVoz('Primeira fala.'); await new Promise(resolve => setTimeout(resolve, 0));
  p.contexto.tocarVoz('Segunda fala.'); await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(p.audioSession.type, 'transient');
  p.contexto.pararVoz(); liberar(mp3()); await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(p.audioSession.type, 'auto'); assert.equal(p.reproducoes.length, 0);
  const falha = player(async () => new Response('{}', { status: 503 }));
  await new Promise(resolve => falha.contexto.tocarVoz('Uma frase.', { aoErro: resolve }));
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(falha.audioSession.type, 'auto');
});

test('uma suspensão tardia da fala anterior não deixa a próxima fonte tocar em silêncio', async () => {
  let liberarPausa, preparar;
  const p = player(() => new Promise(resolve => { preparar = resolve; }));
  p.contexto.AudioContext.prototype.suspend = function () { return new Promise(resolve => { liberarPausa = () => { this.state = 'suspended'; resolve(); }; }); };
  const inicio = p.contexto.AudioContext.prototype.createBufferSource;
  p.contexto.AudioContext.prototype.createBufferSource = function () {
    const contexto = this, fonte = inicio.call(this), start = fonte.start;
    fonte.start = function () { assert.equal(contexto.state, 'running', 'A fonte precisa de contexto ativo'); start.call(this); }; return fonte;
  };
  p.contexto.tocarVoz('Primeira frase.'); await new Promise(r => setTimeout(r, 0));
  const fim = new Promise((resolve, reject) => p.contexto.tocarVoz('Segunda frase.', { aoFim: resolve, aoErro: reject }));
  await new Promise(r => setTimeout(r, 0)); liberarPausa();
  await new Promise(r => setTimeout(r, 0)); preparar(mp3());
  await fim; assert.equal(p.reproducoes.length, 1);
});
