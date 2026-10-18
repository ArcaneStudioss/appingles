'use strict';
// Estudo sob medida: o aluno tem uma prova (ou entrevista, viagem...) e precisa de ajuda específica.
// O estudo vira assuntos em ordem, cada assunto uma mini-aula (explicação, exemplos, vocabulário, exercícios) e, no fim, um simulado.
// Sem IA: assuntos vêm do que o aluno escreveu e o conteúdo vem do catálogo de dificuldades e do texto que ele colou.
// Com IA (ver ia.planejarEstudo / ia.estudarAssunto): tudo escrito sob medida. Gabarito nunca vai ao navegador.
const { POR_TAG } = require('../conteudo/dificuldades');
const { exerciciosDaTag } = require('./licao');
const { processarOffline } = require('./material');
const { embaralhar, diasEntre } = require('./util');

// comparação de assuntos em português: sem acento, sem maiúscula, sem pontuação
const sem = s => String(s ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();

const TIPOS = ['prova', 'concurso', 'proficiencia', 'entrevista', 'viagem', 'outro'];
const MAX_ASSUNTOS = 10;
const TIPOS_SIMULADO = ['escolha', 'lacuna', 'traduzir'];

// palavras que, no pedido do aluno, indicam um ponto que o catálogo cobre (comparação sem acento e sem maiúscula)
const PALAVRAS = {
  'idade-have': ['idade', 'how old', 'years old'],
  'tempo-desde': ['present perfect', 'since', 'ha quanto tempo', 'tempo verbal desde', 'for and since'],
  concordar: ['agree', 'concordar', 'concordancia de opiniao'],
  'terceira-pessoa': ['third person', 'terceira pessoa', '3rd person', 'present simple', 'simple present', 'presente simples', 'he she it'],
  'perguntas-do': ['question', 'pergunta', 'do does did', 'auxiliar', 'interrogativ'],
  'passado-irregular': ['simple past', 'past simple', 'passado simples', 'irregular', 'passado dos verbos'],
  'sujeito-oculto': ['subject', 'sujeito', 'there is', 'there are', 'there be'],
  'explicar-para': ['explain', 'tell me', 'verbos com objeto'],
  preposicoes: ['preposition', 'preposic', 'in on at', 'dependent prepositions'],
  'falsos-cognatos': ['false cognate', 'falso cognato', 'cognato', 'false friends', 'falsos amigos'],
  'people-plural': ['plural', 'people'],
  'make-do': ['make and do', 'make do', 'collocation', 'colocacao', 'take and'],
  incontaveis: ['uncountable', 'countable', 'incontavel', 'contavel', 'information', 'advice'],
  'artigo-profissao': ['article', 'artigo', 'a an the', 'profession', 'profissao'],
};
const PALAVRAS_N = Object.fromEntries(Object.entries(PALAVRAS).map(([tag, l]) => [tag, l.map(sem)]));

// "present perfect, phrasal verbs\n- interpretação de texto" -> ['present perfect', 'phrasal verbs', 'interpretação de texto']
function dividirAssuntos(texto) {
  const vistos = new Set(), saida = [];
  for (const bruto of String(texto || '').split(/[\n;•]+|,(?![^()]*\))/)) {
    const nome = bruto.replace(/^\s*(?:[-•*·]|\d+[.)])\s*/, '').replace(/\s+/g, ' ').trim().slice(0, 80);
    const chave = sem(nome);
    if (nome.length < 2 || vistos.has(chave)) continue;
    vistos.add(chave); saida.push(nome);
    if (saida.length >= MAX_ASSUNTOS) break;
  }
  return saida;
}

function acharTags(nome) {
  const n = ' ' + sem(nome) + ' ';
  return Object.keys(PALAVRAS_N).filter(tag => PALAVRAS_N[tag].some(p => n.includes(p))).slice(0, 2);
}

const novoAssunto = (n, nome, porque = null, tags = null) => ({ id: 'a' + n, nome: String(nome).slice(0, 80), porque: porque ? String(porque).slice(0, 220) : null, tags: tags || acharTags(nome), conteudo: null, respondidos: {}, visto_em: null, concluido_em: null });

function montarAssuntos(lista) {
  return lista.slice(0, MAX_ASSUNTOS).map((a, i) => (typeof a === 'string' ? novoAssunto(i + 1, a) : novoAssunto(i + 1, a.nome, a.porque)));
}

// ids próprios: o navegador devolve o id e o servidor acha o gabarito no que ficou guardado
const comIds = (lista, prefixo) => lista.map((e, i) => ({ ...e, id: `${prefixo}:${i}`, estudo: true }));

// Conteúdo sem IA: catálogo de dificuldades + texto do aluno. Devolve null se não há de onde tirar.
function conteudoOffline(assunto, material, nivel) {
  const tags = assunto.tags || [];
  const conteudo = { fonte: null, explicacao: null, exemplos: [], vocab: [], dicas: [], exercicios: [], modo: 'regras' };
  if (tags.length) {
    const d = POR_TAG[tags[0]];
    conteudo.fonte = 'catalogo';
    conteudo.explicacao = { titulo: d.nome, texto: d.regra, contraste: d.contraste || null };
    conteudo.exemplos = d.abordagens.exemplos.slice(0, 4).map(en => ({ en, pt: null }));
    const lista = tags.flatMap(t => exerciciosDaTag(t)).filter(e => TIPOS_SIMULADO.includes(e.tipo)).slice(0, 5);
    conteudo.exercicios = comIds(lista, assunto.id);
    conteudo.dicas = ['Se errar, o ponto volta como cartão de revisão e entra no seu episódio da Rádio.'];
  }
  if (material && String(material).trim().length >= 80) {
    const m = processarOffline(assunto.nome, material, { nivel });
    if (m.vocab.length) {
      conteudo.fonte = conteudo.fonte ? 'catalogo+material' : 'material';
      conteudo.vocab = m.vocab.slice(0, 8);
      const doTexto = m.exercicios.slice(0, conteudo.exercicios.length ? 2 : 5).map(e => ({ ...e }));
      conteudo.exercicios = [...conteudo.exercicios, ...comIds(doTexto, assunto.id + 'm').map((e, i) => ({ ...e, id: `${assunto.id}:m${i}` }))];
      if (!conteudo.explicacao) conteudo.explicacao = { titulo: assunto.nome, texto: 'Estas são as palavras e frases mais importantes do material que você trouxe. Leia os exemplos em voz alta e depois responda.', contraste: null };
      if (!conteudo.exemplos.length) conteudo.exemplos = m.vocab.slice(0, 3).map(v => ({ en: v.ex, pt: null }));
    }
  }
  return conteudo.fonte ? conteudo : null;
}

// Conteúdo vindo da IA (já validado pelo servidor): só entra o que tem forma válida.
function conteudoDaIa(r, assunto, validarExercicios) {
  const txt = (s, max) => typeof s === 'string' && s.trim() && s.length <= max;
  const exercicios = validarExercicios(r.exercicios, `e-${assunto.id}`, assunto.tags?.[0] || null, 5).filter(e => TIPOS_SIMULADO.includes(e.tipo));
  if (!txt(r.explicacao_pt, 1500) || !exercicios.length) return null;
  return {
    fonte: 'ia', modo: 'ia',
    explicacao: { titulo: assunto.nome, texto: r.explicacao_pt.trim(), contraste: null },
    exemplos: (r.exemplos || []).filter(e => e && txt(e.en, 200)).slice(0, 5).map(e => ({ en: e.en.trim(), pt: txt(e.pt, 200) ? e.pt.trim() : null })),
    vocab: (r.vocab || []).filter(v => v && txt(v.en, 80) && txt(v.ex, 200)).slice(0, 8).map(v => ({ en: v.en.trim(), pt: txt(v.pt, 120) ? v.pt.trim() : null, ex: v.ex.trim() })),
    dicas: (r.dicas_prova || []).filter(d => txt(d, 220)).slice(0, 4),
    exercicios: exercicios.map((e, i) => ({ ...e, id: `${assunto.id}:${i}`, estudo: true })),
  };
}

const acertosDe = a => { const rs = Object.values(a.respondidos || {}); return { feitos: rs.length, certos: rs.filter(r => r.correto).length }; };

function progresso(assuntos) {
  const concluidos = assuntos.filter(a => a.concluido_em).length;
  return { concluidos, total: assuntos.length, pct: assuntos.length ? Math.round(100 * concluidos / assuntos.length) : 0 };
}

// quantos assuntos por dia até a data da prova (sem data: só a ordem sugerida)
function ritmo(estudo, hoje) {
  const restantes = estudo.assuntos.filter(a => !a.concluido_em).length;
  const proximo = estudo.assuntos.find(a => !a.concluido_em)?.id || null;
  if (!estudo.data_alvo) return { diasRestantes: null, restantes, porDia: null, atrasado: false, proximo };
  const dias = diasEntre(hoje, estudo.data_alvo);
  if (dias < 0) return { diasRestantes: dias, restantes, porDia: null, atrasado: true, proximo };
  return { diasRestantes: dias, restantes, porDia: restantes ? Math.max(1, Math.ceil(restantes / Math.max(1, dias))) : 0, atrasado: false, proximo };
}

// Simulado: itens dos assuntos que a pessoa já abriu, intercalados entre os assuntos, os que errou antes primeiro.
function montarSimulado(assuntos, semente, quantos = 10) {
  const filas = assuntos.filter(a => a.conteudo?.exercicios?.length && (a.visto_em || Object.keys(a.respondidos || {}).length)).map(a => {
    const itens = a.conteudo.exercicios.filter(e => TIPOS_SIMULADO.includes(e.tipo)).map(e => ({ ...e, _assunto: a.id }));
    const errados = itens.filter(e => a.respondidos?.[e.id] && !a.respondidos[e.id].correto);
    const resto = embaralhar(itens.filter(e => !errados.includes(e)), `${semente}:${a.id}`);
    return [...errados, ...resto];
  });
  const itens = [];
  for (let k = 0; itens.length < quantos && filas.some(f => f[k]); k++) for (const f of filas) if (f[k] && itens.length < quantos) itens.push(f[k]);
  return embaralhar(itens, semente).map((e, i) => ({ ...e, id: `sim${i}`, original: e.id }));
}

function resultadoSimulado(itens, correcoes, assuntos) {
  const por = {};
  for (const e of itens) {
    const p = (por[e._assunto] ||= { id: e._assunto, nome: assuntos.find(a => a.id === e._assunto)?.nome || e._assunto, certos: 0, total: 0 });
    p.total++; if (correcoes[e.id]?.correto) p.certos++;
  }
  const lista = Object.values(por).map(p => ({ ...p, pct: Math.round(100 * p.certos / p.total) }));
  const total = itens.length, certos = lista.reduce((s, p) => s + p.certos, 0);
  const fracos = lista.filter(p => p.pct < 60).map(p => p.nome);
  const pct = total ? Math.round(100 * certos / total) : 0;
  return {
    pct, certos, total, porAssunto: lista, fracos,
    conselho: !total ? '' : fracos.length ? `Vale rever: ${fracos.join('; ')}. Esses pontos já viraram cartões de revisão.` : pct >= 80 ? 'Você foi bem em tudo que treinou aqui. Mantenha as revisões até o dia e faça outro simulado perto da prova.' : 'Está encaminhado. Refaça os assuntos em que errou e depois um novo simulado.',
    aviso: 'Este resultado mostra como você foi no que praticou aqui. Não prevê a nota da prova real.',
  };
}

module.exports = { TIPOS, MAX_ASSUNTOS, dividirAssuntos, acharTags, montarAssuntos, conteudoOffline, conteudoDaIa, acertosDe, progresso, ritmo, montarSimulado, resultadoSimulado };
