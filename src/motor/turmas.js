'use strict';
// Turmas e atividades do professor: código de convite, validação das perguntas que o professor escreve
// e as métricas (por aluno, por pergunta e dificuldades da turma). Funções puras: quem acessa o banco é src/turmas.js.
const crypto = require('node:crypto');

// sem 0/O, 1/I/L: o código é digitado ou lido em voz alta
const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const TAMANHO_CODIGO = 6;

function novoCodigo(jaExiste = () => false) {
  for (let t = 0; t < 30; t++) {
    let c = '';
    for (const b of crypto.randomBytes(TAMANHO_CODIGO)) c += ALFABETO[b % ALFABETO.length];
    if (!jaExiste(c)) return c;
  }
  throw new Error('Não consegui gerar um código único.');
}
// aceita "mia-4x7k", "MIA 4X7K", com espaços ou traços
const normalizarCodigo = s => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
const codigoValido = c => new RegExp(`^[${ALFABETO}]{${TAMANHO_CODIGO}}$`).test(c);

class ErroItem extends Error {}
const texto = (v, max, campo, { min = 1 } = {}) => {
  if (typeof v !== 'string') throw new ErroItem(`${campo}: preencha este campo.`);
  const t = v.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').trim();
  if (t.length < min) throw new ErroItem(`${campo}: preencha este campo.`);
  if (t.length > max) throw new ErroItem(`${campo}: texto longo demais (máx. ${max}).`);
  return t;
};

// Pergunta escrita pelo professor: escolha, lacuna ou traduzir (as que o app corrige sem ambiguidade).
function validarPerguntaPropria(p) {
  if (!p || typeof p !== 'object') throw new ErroItem('Pergunta inválida.');
  const tipo = p.tipo;
  const base = { habilidade: tipo === 'traduzir' ? 'escrita' : tipo === 'leitura' ? 'leitura' : tipo === 'vocabulario' ? 'vocabulario' : 'gramatica', dif: 2, origem: 'professor' };
  if (p.explica) base.explica = texto(p.explica, 300, 'Explicação', { min: 0 }) || undefined;
  if (p.dica) base.dica = texto(p.dica, 300, 'Dica');
  if (p.traducao) base.traducao = texto(p.traducao, 6000, 'Tradução');
  if (['escolha', 'vocabulario', 'leitura'].includes(tipo)) {
    const opcoes = Array.isArray(p.opcoes) ? p.opcoes.map(o => texto(o, 120, 'Alternativa')) : [];
    if (opcoes.length < 2 || opcoes.length > 5) throw new ErroItem('Use de 2 a 5 alternativas.');
    if (new Set(opcoes.map(o => o.toLowerCase())).size !== opcoes.length) throw new ErroItem('Há alternativas repetidas.');
    const resposta = Number(p.resposta);
    if (!Number.isInteger(resposta) || resposta < 0 || resposta >= opcoes.length) throw new ErroItem('Marque qual alternativa é a certa.');
    if (tipo === 'leitura') return { ...base, tipo, texto: texto(p.texto, 6000, 'Texto de leitura'), pergunta: texto(p.pergunta || p.enunciado, 220, 'Pergunta de interpretação'), opcoes, resposta };
    return { ...base, tipo: 'escolha', enunciado: texto(p.enunciado, 220, 'Enunciado'), opcoes, resposta };
  }
  if (tipo === 'lacuna') {
    const frase = texto(p.frase, 220, 'Frase');
    if ((frase.match(/___/g) || []).length !== 1) throw new ErroItem('A frase precisa ter exatamente uma lacuna, escrita com três sublinhados (___).');
    const resposta = (Array.isArray(p.resposta) ? p.resposta : [p.resposta]).map(r => texto(r, 60, 'Resposta aceita'));
    if (!resposta.length || resposta.length > 6) throw new ErroItem('Informe de 1 a 6 respostas aceitas.');
    return { ...base, tipo, frase, resposta };
  }
  if (tipo === 'traduzir') {
    const aceitas = (Array.isArray(p.aceitas) ? p.aceitas : []).map(r => texto(r, 220, 'Resposta aceita'));
    if (!aceitas.length || aceitas.length > 8) throw new ErroItem('Informe de 1 a 8 respostas aceitas.');
    return { ...base, tipo, pt: texto(p.pt, 220, 'Frase em português'), aceitas };
  }
  throw new ErroItem('Tipo de pergunta inválido (use escolha, vocabulário, leitura, lacuna ou traduzir).');
}

function validarMaterial(m = {}) {
  if (!m || typeof m !== 'object' || Array.isArray(m)) throw new ErroItem('Material da aula inválido.');
  const campo = (v, max, nome) => v == null || v === '' ? '' : texto(v, max, nome, { min: 0 });
  if (m.vocab != null && (!Array.isArray(m.vocab) || m.vocab.length > 30)) throw new ErroItem('Use até 30 palavras no vocabulário da aula.');
  return { explicacao: campo(m.explicacao, 4000, 'Explicação da aula'), texto: campo(m.texto, 6000, 'Texto de apoio'), traducao: campo(m.traducao, 6000, 'Tradução do texto'),
    vocab: (m.vocab || []).map(v => ({ en: texto(v?.en, 100, 'Palavra em inglês'), pt: texto(v?.pt, 200, 'Significado em português') })) };
}

// Monta as perguntas da atividade: ids do banco do app + perguntas do professor. Cada item ganha id próprio (i1, i2...).
function montarItens({ banco = [], proprias = [] }, TODOS_EXERCICIOS) {
  if(!Array.isArray(banco)||!Array.isArray(proprias)||banco.length>60||proprias.length>30)throw new ErroItem('Envie listas válidas de questões, com até 30 perguntas na aula.');
  const itens = [];
  const vistos = new Set();
  for (const id of banco) {
    if (typeof id !== 'string' || vistos.has(id)) continue;
    const e = TODOS_EXERCICIOS[id];
    if (!e) throw new ErroItem('Uma das perguntas escolhidas não existe mais.');
    vistos.add(id);
    const { id: _id, missao, ...resto } = e;
    itens.push({ ...resto, origem: 'banco', origemId: id, missao });
  }
  for (const p of proprias) itens.push(validarPerguntaPropria(p));
  if (!itens.length) throw new ErroItem('Escolha ou escreva pelo menos uma pergunta.');
  if (itens.length > 30) throw new ErroItem('No máximo 30 perguntas por atividade.');
  return itens.map((it, i) => ({ ...it, id: 'i' + (i + 1) }));
}

const pct = (a, b) => (b ? Math.round(100 * a / b) : null);

// respostas: linhas { user_id, item_id, correto, tag, tempo_ms, em }; alunos: [{ id, nome, entrou_em }]; itens da atividade
function metricasDaAtividade({ itens, alunos, respostas }) {
  const idsItens = new Set(itens.map(i => i.id));
  const porAluno = new Map(alunos.map(a => [a.id, { id: a.id, nome: a.nome, entrou_em: a.entrou_em, feitas: 0, certas: 0, tempoMs: 0, ultima: null }]));
  const porItem = new Map(itens.map(i => [i.id, { id: i.id, respondentes: 0, certas: 0 }]));
  for (const r of respostas) {
    if (!idsItens.has(r.item_id)) continue;
    const a = porAluno.get(r.user_id), it = porItem.get(r.item_id);
    if (!a) continue;
    a.feitas++; a.certas += r.correto ? 1 : 0; a.tempoMs += r.tempo_ms || 0;
    if (!a.ultima || r.em > a.ultima) a.ultima = r.em;
    it.respondentes++; it.certas += r.correto ? 1 : 0;
  }
  const total = itens.length;
  const lista = [...porAluno.values()].map(a => ({ ...a, total, concluiu: total > 0 && a.feitas === total, pct: pct(a.certas, a.feitas), tempoMin: Math.round(a.tempoMs / 6000) / 10 }));
  const respondeu = lista.filter(a => a.feitas > 0);
  return {
    alunos: lista.sort((x, y) => x.nome.localeCompare(y.nome)),
    itens: [...porItem.values()].map(i => ({ ...i, pct: pct(i.certas, i.respondentes) })),
    resumo: {
      alunos: lista.length, concluiram: lista.filter(a => a.concluiu).length, naoComecaram: lista.filter(a => a.feitas === 0).length,
      pctMedio: respondeu.length ? Math.round(respondeu.reduce((s, a) => s + (a.pct || 0), 0) / respondeu.length) : null,
    },
  };
}

// Dificuldades da turma: erros agrupados por ponto de gramática (tag) ou, sem tag, por habilidade. nomeDe(tag) dá o nome em português.
function dificuldadesDaTurma(respostas, itensPorId, nomeDe, nomeHabilidade = h => h) {
  const grupos = new Map();
  for (const r of respostas) {
    const it = itensPorId.get(r.atividade_id + ':' + r.item_id);
    if (!it) continue;
    const chave = it.tag ? 'tag:' + it.tag : 'hab:' + (it.habilidade || 'geral');
    const g = grupos.get(chave) || { chave, nome: it.tag ? (nomeDe(it.tag) || it.tag) : nomeHabilidade(it.habilidade || 'geral'), tipo: it.tag ? 'gramatica' : 'habilidade', total: 0, erros: 0, alunosComErro: new Set() };
    g.total++;
    if (!r.correto) { g.erros++; g.alunosComErro.add(r.user_id); }
    grupos.set(chave, g);
  }
  return [...grupos.values()].filter(g => g.total >= 2)
    .map(g => ({ chave: g.chave, nome: g.nome, tipo: g.tipo, total: g.total, erros: g.erros, pctErro: pct(g.erros, g.total), alunosComErro: g.alunosComErro.size }))
    .sort((a, b) => b.pctErro - a.pctErro || b.erros - a.erros)
    .slice(0, 8);
}

module.exports = { novoCodigo, normalizarCodigo, codigoValido, validarPerguntaPropria, validarMaterial, montarItens, metricasDaAtividade, dificuldadesDaTurma, ErroItem, ALFABETO };
