'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { abrir } = require('../src/db');
const { criarVozes, VOZES } = require('../src/vozes');
const MP3 = Buffer.from('ID3audio-de-teste');
function ambiente(t, { fetchImpl, env = {} } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'inglou-vozes-')), db = abrir(dir);
  for (let id = 1; id <= 2; id++) db.prepare('INSERT INTO usuarios (id,email,nome,senha_hash,criado_em,consentiu_em) VALUES (?,?,?,?,?,?)').run(id, `p${id}@teste.test`, 'Pessoa', 'fixture', '2026-10-21', '2026-10-21');
  const chamadas = [];
  const servico = criarVozes({ db, dir, env: { ELEVENLABS_API_KEY: 'sk_fixture_sem_valor', ...env }, diaDe: () => '2026-10-21', fetchImpl: fetchImpl || (async (url, opts) => { chamadas.push({ url, opts }); return new Response(MP3, { headers: { 'Content-Type': 'audio/mpeg' } }); }) });
  t.after(() => { servico.fechar(); db.close(); fs.rmSync(dir, { recursive: true, force: true }); });
  return { servico, db, dir, chamadas };
}
const pedido = { texto: 'Hello!', personagem: 'mia', idioma: 'en' };

test('as quatro combinações usam exclusivamente o ID oficial e o idioma correto', async t => {
  const { servico, chamadas } = ambiente(t);
  for (const personagem of ['mia', 'tuiuiu']) for (const idioma of ['pt', 'en']) {
    const r = await servico.sintetizar(1, { texto: idioma === 'pt' ? 'Olá!' : 'Hello!', personagem, idioma, voice_id: 'uma-voz-nao-autorizada' });
    assert.deepEqual(r.audio, MP3);
    const ultima = chamadas.at(-1);
    assert.ok(ultima.url.includes('/' + VOZES[personagem][idioma] + '?'));
    assert.equal(JSON.parse(ultima.opts.body).language_code, idioma);
    assert.equal(ultima.opts.headers['xi-api-key'], 'sk_fixture_sem_valor');
  }
  assert.equal(chamadas.length, 4);
});

test('repetição simultânea e cache persistente cobram uma geração; contas ficam isoladas', async t => {
  const { servico, chamadas, db, dir } = ambiente(t);
  const respostas = await Promise.all(Array.from({ length: 8 }, () => servico.sintetizar(1, pedido)));
  assert.equal(chamadas.length, 1); respostas.forEach(r => assert.deepEqual(r.audio, MP3));
  assert.equal((await servico.sintetizar(1, pedido)).cache, true);
  assert.equal(db.prepare('SELECT caracteres FROM uso_voz WHERE user_id = 1').get().caracteres, pedido.texto.length);
  await servico.sintetizar(2, pedido); assert.equal(chamadas.length, 2);
  const nomes = fs.readdirSync(path.join(dir, 'vozes', '1')); assert.equal(nomes.length, 1); assert.match(nomes[0], /^[a-f0-9]{64}\.mp3$/);
  await servico.limparUsuario(1);
  assert.ok(!fs.existsSync(path.join(dir, 'vozes', '1')));
  assert.ok(fs.existsSync(path.join(dir, 'vozes', '2')));
});

test('erro ou chave ausente não gera outra voz, não vaza segredo e libera a cota da tentativa', async t => {
  let chamadas = 0;
  const { servico, db, dir } = ambiente(t, { fetchImpl: async () => { chamadas++; return new Response(JSON.stringify({ detalhe: 'sk_fixture_sem_valor' }), { status: 401 }); } });
  await assert.rejects(servico.sintetizar(1, pedido), e => e.status === 503 && !e.message.includes('sk_'));
  assert.equal(chamadas, 1);
  assert.equal(db.prepare('SELECT caracteres FROM uso_voz WHERE user_id = 1').get().caracteres, 0);
  assert.ok(!fs.existsSync(path.join(dir, 'vozes', '1')));
  const desligado = criarVozes({ db, dir, env: {}, fetchImpl: async () => { throw new Error('não deve chamar'); } });
  t.after(desligado.fechar);
  await assert.rejects(desligado.sintetizar(1, pedido), e => e.status === 503);
  for (const p of [{ ...pedido, personagem: 'outra' }, { ...pedido, idioma: 'fr' }, { ...pedido, texto: '' }, { ...pedido, texto: 'a'.repeat(3001) }]) await assert.rejects(servico.sintetizar(1, p), e => e.status === 422);
  assert.equal(chamadas, 1);
});

test('limite de caracteres persiste entre instâncias e não bloqueia repetir áudio já pronto', async t => {
  const { servico, db, dir, chamadas } = ambiente(t, { env: { VOZ_CARACTERES_DIA: '6' } });
  await servico.sintetizar(1, pedido);
  const outra = criarVozes({ db, dir, env: { ELEVENLABS_API_KEY: 'sk_fixture_sem_valor', VOZ_CARACTERES_DIA: '6' }, diaDe: () => '2026-10-21', fetchImpl: async () => { throw new Error('não deve chamar'); } });
  t.after(outra.fechar);
  assert.equal((await outra.sintetizar(1, pedido)).cache, true);
  await assert.rejects(outra.sintetizar(1, { ...pedido, texto: 'Bye!' }), e => e.status === 429);
  assert.equal(chamadas.length, 1);
});

test('apagar dados durante a síntese impede que o cache reapareça depois', async t => {
  let iniciar, terminar;
  const iniciou = new Promise(r => { iniciar = r; }), terminou = new Promise(r => { terminar = r; });
  const { servico, dir } = ambiente(t, { fetchImpl: async () => { iniciar(); await terminou; return new Response(MP3, { headers: { 'Content-Type': 'audio/mpeg' } }); } });
  const geracao = servico.sintetizar(1, pedido); await iniciou;
  await servico.limparUsuario(1); terminar(); await geracao;
  assert.ok(!fs.existsSync(path.join(dir, 'vozes', '1')));
});
