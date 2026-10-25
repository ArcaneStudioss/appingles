'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const contexto = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(__dirname, '../public/assets/js/fala-acompanhada.js'), 'utf8').replace(/^export /gm, ''), contexto);
const ouvir = (frase, texto) => Array.from(contexto.indicesReconhecidos(frase.split(' '), texto));

test('leitura destaca só palavras reconhecidas, tolerando pontuação, caixa e palavras omitidas', () => {
  assert.deepEqual(ouvir('I usually work from home', 'I USUALLY work,'), [0, 1, 2]);
  assert.deepEqual(ouvir('I usually work from home', 'I work from home.'), [0, 2, 3, 4]);
  assert.deepEqual(ouvir('I usually work from home', 'uh I usually work from home'), [0, 1, 2, 3, 4]);
  assert.deepEqual(ouvir('I usually work from home', 'She likes coffee'), []);
});

test('reconhecimento parcial revisto não deixa palavras antigas destacadas e regravação começa limpa', () => {
  assert.deepEqual(ouvir('I usually work from home', 'I usually work'), [0, 1, 2]);
  assert.deepEqual(ouvir('I usually work from home', 'I usually walk'), [0, 1]);
  assert.deepEqual(ouvir('I usually work from home', ''), []);
});

test('contrações equivalentes são acompanhadas sem marcar uma contração incompleta', () => {
  assert.deepEqual(ouvir('I am happy', 'I’m happy'), [0, 1, 2]);
  assert.deepEqual(ouvir("I'm happy", 'I am happy'), [0, 1]);
  assert.deepEqual(ouvir("I'm happy", 'I'), []);
  assert.deepEqual(ouvir('I cannot go', "I can't go"), [0, 1, 2]);
});

test('uma palavra repetida só destaca a quantidade ouvida e respeita a ordem da frase', () => {
  assert.deepEqual(ouvir('go go go', 'go'), [0]);
  assert.deepEqual(ouvir('go go go', 'go go'), [0, 1]);
  assert.ok(ouvir('I work at home', 'home at work I').length < 4);
});
