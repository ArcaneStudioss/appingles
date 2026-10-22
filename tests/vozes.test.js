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

test('conteúdo fixo do catálogo é reutilizado entre contas e contexto pessoal permanece privado', async t => {
  const { servico, chamadas }=ambiente(t);
  const { CATALOGO_VOZ }=require('../src/conteudo/vozes-catalogo');
  const texto=[...CATALOGO_VOZ].find(t=>t.includes(' ')&&t.length>15);
  const entrada={texto,personagem:'mia',idioma:'en'};
  await servico.sintetizar(1,entrada);
  assert.equal((await servico.sintetizar(2,entrada)).cache,true);assert.equal(chamadas.length,1);
  await servico.sintetizar(1,{...entrada,anterior:'Minha apresentação particular.'});
  await servico.sintetizar(2,{...entrada,anterior:'Minha apresentação particular.'});
  assert.equal(chamadas.length,3,'contexto por pessoa não compartilha o cache');
});

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
  const pedido = { texto: 'My private presentation about my own life in Recife.', personagem:'mia', idioma:'en' };
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


test('as quatro vozes leem com o modelo expressivo e direção de emoção sem trocar palavras', async t => {
  const { servico, chamadas } = ambiente(t);
  for (const personagem of ['mia', 'tuiuiu']) for (const idioma of ['pt', 'en']) for (const [emocao, tag] of [['feliz', '[happy]'], ['triste', '[sad]'], ['animado', '[excited]']]) {
    const texto = idioma === 'pt' ? 'Hoje vamos contar uma história e descobrir como os personagens se sentem.' : 'Today we will tell a story and discover how the characters feel.';
    await servico.sintetizar(1, { texto, personagem, idioma, emocao, anterior: 'Earlier in the story.', seguinte: 'The story continues.' });
    const req = chamadas.at(-1), corpo = JSON.parse(req.opts.body);
    assert.ok(req.url.includes('/' + VOZES[personagem][idioma] + '?'));
    assert.equal(corpo.model_id, 'eleven_v4'); assert.equal(corpo.text, tag + ' ' + texto);
    assert.deepEqual(corpo.voice_settings, { stability: .5, similarity_boost: .75 });
    assert.equal(corpo.previous_text, 'Earlier in the story.'); assert.equal(corpo.next_text, 'The story continues.');
  }
});

test('contexto natural não força alegria e cache distingue emoção, velocidade, modelo e contexto', async t => {
  const { servico, chamadas, db, dir } = ambiente(t);
  const pedido = { texto: 'My private presentation about my own life in Recife.', personagem:'mia', idioma:'en' };
  const p = { ...pedido, texto: 'I miss my old friend. We used to walk together.' };
  await servico.sintetizar(1, p); assert.equal(JSON.parse(chamadas.at(-1).opts.body).text, p.texto);
  assert.equal((await servico.sintetizar(1, p)).cache, true);
  for (const extra of [{ emocao: 'triste' }, { velocidade: .8 }, { anterior: 'A quiet evening.' }]) await servico.sintetizar(1, { ...p, ...extra });
  assert.equal(chamadas.length, 4);
  const corpo = JSON.parse(chamadas[2].opts.body); assert.ok(corpo.text.startsWith('[slowly] ')); assert.ok(!('speed' in corpo.voice_settings));
  const outro = criarVozes({ db, dir, env: { ELEVENLABS_API_KEY: 'sk_fixture_sem_valor', ELEVENLABS_MODEL_TEXTO: 'eleven_multilingual_v2' }, fetchImpl: async (url, opts) => { chamadas.push({ url, opts }); return new Response(MP3, { headers: { 'Content-Type': 'audio/mpeg' } }); } });
  t.after(outro.fechar); await outro.sintetizar(1, { ...p, emocao: 'triste' });
  const legado = JSON.parse(chamadas.at(-1).opts.body); assert.equal(legado.text, p.texto); assert.equal(legado.model_id, 'eleven_multilingual_v2');
  assert.ok(!('language_code' in legado));
  for (const extra of [{ emocao: '[laughs]' }, { anterior: 'x'.repeat(501) }, { seguinte: 1 }, { velocidade: 3 }]) await assert.rejects(servico.sintetizar(1, { ...p, ...extra }), e => e.status === 422);
});
