'use strict';
// Monta a lição do dia (10 a 20 minutos) a partir de tudo que sabemos do aluno.
// Ordem de prioridade: 1) o que travou na conversa/produção recente (foco), 2) reteste de missão já demonstrada,
// 3) a próxima parte da missão atual do plano, 4) ajustes pelas hipóteses (mais escuta, mais produção...).
// Cada decisão vira uma frase em "porque", para o aluno entender o motivo da aula.
const { POR_ID, TODOS_EXERCICIOS } = require('../conteudo/missoes');
const { POR_TAG } = require('../conteudo/dificuldades');
const { CENARIOS } = require('../conteudo/cenarios');
const { embaralhar, diasEntre } = require('./util');
const { dificuldadeAlvo } = require('./modelo');
const { licoesPorMissao } = require('./plano');

const MIN = { explicacao: 2, exercicio: 0.6, escuta: 0.8, producao: 3, foco: 1.5 };
const ABORDAGENS = ['regra', 'contraste', 'exemplos', 'escuta'];
const NOME_ABORDAGEM = { regra: 'a regra direta', contraste: 'comparando com o português', exemplos: 'muitos exemplos', escuta: 'ouvindo' };
const diaSemana = iso => new Intl.DateTimeFormat('pt-BR', { weekday: 'long', timeZone: 'UTC' }).format(new Date(iso.slice(0, 10) + 'T12:00:00Z'));

const PRODUCAO = ['lacuna', 'ordenar', 'traduzir', 'ditado'];

function missaoAtual(plano, competencias) {
  for (const m of plano.missoes) {
    const c = competencias[m.id];
    if (!c || c.status === 'nao_iniciada' || c.status === 'praticando') return m;
  }
  return null;    // trilha concluída: entra o modo "manter e ampliar"
}

function escolherExercicios(lista, { quantos, alvo, vistos, preferirProducao, excluir = new Set() }) {
  const pontua = e => {
    let p = 0;
    const v = vistos[e.id];
    if (!v) p += 3; else if (!v.acertou) p += 2;
    if ((e.dif || 1) <= alvo) p += 1; else p -= 1;
    if ((e.dif || 1) === alvo) p += 0.5;
    if (preferirProducao && PRODUCAO.includes(e.tipo)) p += 1.5;
    return p;
  };
  return lista.filter(e => !excluir.has(e.id)).map(e => [e, pontua(e)]).sort((a, b) => b[1] - a[1]).slice(0, quantos).map(([e]) => e);
}

function exerciciosDaTag(tag) {
  const d = POR_TAG[tag];
  return (d?.exercicios || []).map((e, i) => ({ ...e, id: `dif:${tag}:${i}`, habilidade: e.habilidade || d.habilidade, tag, dif: e.dif || 2 }));
}

function blocoFoco(foco, origemTexto) {
  const d = POR_TAG[foco.tag];
  const usadas = foco.abordagens || [];
  const abordagem = ABORDAGENS.find(a => !usadas.includes(a) && (a !== 'contraste' || d.abordagens.contraste || d.contraste)) || 'regra';
  const exp = { abordagem, nomeAbordagem: NOME_ABORDAGEM[abordagem] };
  if (abordagem === 'regra') exp.texto = d.abordagens.regra;
  if (abordagem === 'contraste') { exp.texto = d.abordagens.contraste || d.contraste.nota; exp.contraste = d.contraste; }
  if (abordagem === 'exemplos') { exp.texto = 'Leia os exemplos em voz alta e repare no padrão antes de praticar.'; exp.exemplos = d.abordagens.exemplos; }
  if (abordagem === 'escuta') { exp.texto = d.abordagens.escuta; exp.audios = d.abordagens.exemplos.slice(0, 3); }
  if (!exp.exemplos) exp.exemplos = d.abordagens.exemplos.slice(0, 2);
  return {
    tipo: 'foco', titulo: d.nome, tag: foco.tag, focoId: foco.id || null, origem: origemTexto,
    seu: foco.trecho ? { trecho: foco.trecho, correcao: foco.correcao || null } : null,
    explicacao: exp,
    exercicios: exerciciosDaTag(foco.tag).slice(0, 3),
    tentativaAnterior: usadas.length ? `Da outra vez trabalhamos com ${usadas.map(a => NOME_ABORDAGEM[a]).join(' e ')}. Hoje, outro caminho: ${NOME_ABORDAGEM[abordagem]}.` : null,
  };
}

// Teto de questões por lição: 10, ou 7 quando há áudio (escuta pesa mais). A tarefa de escrever no fim não conta.
// Corta primeiro o que é reforço (respostas rápidas, retomada, treino extra) e só depois a prática principal.
const MAX_QUESTOES = 10, MAX_COM_AUDIO = 7;
const ORDEM_CORTE = [b => b.tipo === 'rapidas', b => b.tipo === 'retomada', b => b.titulo === 'Treino extra', b => b.tipo === 'exercicios' && b.titulo !== 'Combine os pares' && b.titulo !== 'Treino extra', b => b.tipo === 'escuta'];
function limiteDaLicao(blocos) { return blocos.some(b => b.tipo === 'escuta' || b.exercicios?.some(e => e.tipo === 'escuta' || e.tipo === 'ditado')) ? MAX_COM_AUDIO : MAX_QUESTOES; }
function limitarQuestoes(blocos) {
  const conta = () => blocos.reduce((n, b) => n + (b.exercicios ? b.exercicios.length : 0), 0);
  const antes = conta(), teto = limiteDaLicao(blocos);
  for (const alvo of ORDEM_CORTE) {
    for (const b of blocos.filter(alvo).reverse()) {
      while (b.exercicios.length > 1 && conta() > teto) b.exercicios.pop();
      if (conta() > teto && b.exercicios.length === 1 && b.tipo !== 'escuta') b.exercicios.pop();
    }
    if (conta() <= teto) break;
  }
  for (let i = blocos.length - 1; i >= 0; i--) if (blocos[i].exercicios && !blocos[i].exercicios.length) blocos.splice(i, 1);
  return antes - conta();
}

function montarLicao(ctx) {
  const { perfil, plano, nivel, tentativas = [], competencias = {}, focos = [], hipoteses = [], hojeISO, cartoesPendentes = 0 } = ctx;
  const orcamento = Math.max(10, Math.min(20, perfil.minutos_dia | 0 || 15));
  let gasto = 0;
  const porque = [], blocos = [];
  const vistos = {};
  for (const t of tentativas) vistos[t.item_id] = { acertou: !!t.correto };
  const alvo = dificuldadeAlvo(nivel, tentativas);
  const hip = new Set(hipoteses.map(h => h.id.split(':')[0]));
  const preferirProducao = hip.has('reconhece-x-produz');
  const usados = new Set();

  // 1) Foco: dificuldade que apareceu na conversa ou numa produção recente
  const focoNovo = focos.filter(f => f.status === 'novo' && POR_TAG[f.tag]).sort((a, b) => b.criado_em.localeCompare(a.criado_em))[0];
  const hipErro = hipoteses.find(h => h.id.startsWith('erro-recorrente:'));
  if (focoNovo) {
    const quando = diasEntre(focoNovo.criado_em.slice(0, 10), hojeISO);
    const quandoTxt = quando <= 0 ? 'hoje' : quando === 1 ? 'ontem' : diaSemana(focoNovo.criado_em);
    const onde = focoNovo.origem === 'conversa' ? `na sua conversa de ${quandoTxt}` : focoNovo.origem === 'material' ? 'no material que você trouxe' : focoNovo.origem === 'nivelamento' ? 'no seu teste de nivelamento' : `num texto seu de ${quandoTxt}`;
    const b = blocoFoco(focoNovo, onde);
    blocos.push(b); b.exercicios.forEach(e => usados.add(e.id));
    gasto += MIN.foco + b.exercicios.length * MIN.exercicio;
    porque.push(`Hoje começamos por “${b.titulo}” porque isso apareceu ${onde}${focoNovo.trecho ? ` (“${focoNovo.trecho}”)` : ''}.`);
  } else if (hipErro && POR_TAG[hipErro.tag]) {
    const usadasAntes = focos.filter(f => f.tag === hipErro.tag).flatMap(f => f.abordagens || []);
    const b = blocoFoco({ tag: hipErro.tag, abordagens: usadasAntes }, 'em várias atividades suas');
    blocos.push(b); b.exercicios.forEach(e => usados.add(e.id));
    gasto += MIN.foco + b.exercicios.length * MIN.exercicio;
    porque.push(`Começamos por “${b.titulo}” porque esse ponto se repetiu em situações diferentes nas últimas semanas.`);
  }

  // 2) Teste em outra situação: foco já praticado que venceu, ou missão demonstrada há 3+ dias
  const focoReteste = focos.find(f => f.status === 'praticando' && f.retestar_em && f.retestar_em <= hojeISO && POR_TAG[f.tag]);
  const missaoReteste = plano.missoes.map(m => [m, competencias[m.id]]).find(([, c]) => c && c.status === 'demonstrado' && c.demonstrado_em && diasEntre(c.demonstrado_em.slice(0, 10), hojeISO) >= 3);
  let temProducao = false;
  if (missaoReteste) {
    const [m] = missaoReteste; const def = POR_ID[m.id];
    const c = competencias[m.id];
    const situacao = def.reteste[(c.retestes || 0) % def.reteste.length];
    blocos.push({ tipo: 'producao', reteste: true, missao: m.id, titulo: `Teste em outra situação: ${def.titulo.toLowerCase()}`, situacao, tarefa: { ...def.tarefa, enunciado: situacao }, semDicas: true, focoId: focoReteste?.id || null, focoTag: focoReteste?.tag || null });
    gasto += MIN.producao; temProducao = true;
    porque.push(`Você demonstrou “${def.titulo.toLowerCase()}” há ${diasEntre(c.demonstrado_em.slice(0, 10), hojeISO)} dias. Agora vamos ver se ficou, numa situação nova e sem dicas.`);
  } else if (focoReteste) {
    const cen = CENARIOS[focoReteste.cenario] || null;
    const situacao = focoReteste.origem === 'conversa' && cen
      ? `Lembra da conversa "${cen.titulo}"? Agora em outra situação: escreva 3 ou 4 frases contando algo diferente do que você contou lá.`
      : `Escreva 3 ou 4 frases sobre algo da sua semana, usando o ponto que treinamos: ${POR_TAG[focoReteste.tag].nome.toLowerCase()}.`;
    blocos.push({ tipo: 'producao', reteste: true, focoId: focoReteste.id, focoTag: focoReteste.tag, titulo: 'Teste em outra situação', situacao, tarefa: { enunciado: situacao, minPalavras: 20, elementos: [], tagsChave: [focoReteste.tag] }, semDicas: true });
    gasto += MIN.producao; temProducao = true;
    porque.push(`Há alguns dias treinamos “${POR_TAG[focoReteste.tag].nome}”. Hoje vem o teste de verdade: usar sem ajuda, num contexto novo.`);
  }

  // 3) Missão atual do plano
  const atual = missaoAtual(plano, competencias);
  let missaoInfo = null;
  if (atual) {
    const def = POR_ID[atual.id];
    const total = licoesPorMissao(def, nivel);
    const feitas = Math.min(total, competencias[atual.id]?.partes || 0);
    const parte = Math.min(total, feitas + 1);
    missaoInfo = { id: def.id, titulo: def.titulo, podeFazer: def.podeFazer, parte, total };
    const resta = Math.max(4, orcamento - gasto);
    const primeira = parte === 1;
    const ultima = parte === total;
    porque.push(`${primeira ? "Começamos" : "Seguimos com"} a missão “${def.titulo}” (parte ${parte} de ${total}), um passo do seu objetivo: ${plano.objetivoNome.toLowerCase()}.`);

    if (primeira) {
      blocos.push({ tipo: 'explicacao', titulo: def.explicacao.titulo, texto: def.explicacao.texto, estrutura: def.explicacao.estrutura, exemplos: def.exemplos, vocab: def.vocab, missao: def.id });
      // combinar pares com o vocabulário que acabou de aparecer (aquecimento rápido de memória)
      blocos.push({ tipo: 'exercicios', titulo: 'Combine os pares', exercicios: [{ id: `pares:${def.id}`, tipo: 'pares', habilidade: 'vocabulario', dif: 1, missao: def.id, pares: def.vocab.slice(0, 5).map(v => ({ en: v.en, pt: v.pt })) }] });
      gasto += 1;
    } else {
      blocos.push({ tipo: 'lembrete', titulo: 'Relembrando a estrutura', estrutura: def.explicacao.estrutura, missao: def.id });
      // aquecimento diferente a cada parte: o vocabulário da missão girado, para não repetir os mesmos 5 pares
      const giro = def.vocab.slice((parte - 1) % def.vocab.length).concat(def.vocab.slice(0, (parte - 1) % def.vocab.length));
      blocos.push({ tipo: 'exercicios', titulo: 'Combine os pares', exercicios: [{ id: `pares:${def.id}:${parte}`, tipo: 'pares', habilidade: 'vocabulario', dif: 1, missao: def.id, pares: giro.slice(0, 5).map(v => ({ en: v.en, pt: v.pt })) }] });
      gasto += 1;
    }
    const custoExp = primeira ? MIN.explicacao : 0.5;
    const reservaProducao = ultima && !temProducao ? MIN.producao : 0;
    const vagas = Math.max(2, Math.floor((resta - custoExp - reservaProducao) / MIN.exercicio));
    const naoEscuta = def.exercicios.filter(e => e.tipo !== 'escuta' && e.tipo !== 'ditado' && e.tipo !== 'fala');
    const escuta = def.exercicios.filter(e => e.tipo === 'escuta' || e.tipo === 'ditado');
    const nEscuta = Math.min(escuta.length, hip.has('escuta-x-leitura') ? 3 : primeira ? 1 : 2);
    // cada parte usa sua fatia dos exercícios da missão (senão a parte 1 gasta tudo)
    const fatia = Math.ceil(naoEscuta.length / total) + (primeira ? 0 : 1);
    const exs = escolherExercicios(naoEscuta, { quantos: Math.max(1, Math.min(vagas - nEscuta, fatia)), alvo: primeira ? Math.min(alvo, 2) : alvo, vistos, preferirProducao, excluir: usados });
    exs.forEach(e => usados.add(e.id));
    if (exs.length) blocos.push({ tipo: 'exercicios', titulo: primeira ? 'Primeira prática' : 'Prática', exercicios: exs.map(e => ({ ...e, missao: def.id })) });
    const esc = escolherExercicios(escuta, { quantos: nEscuta, alvo, vistos, excluir: usados });
    if (esc.length) blocos.push({ tipo: 'escuta', titulo: 'Escuta', exercicios: esc.map(e => ({ ...e, missao: def.id })), devagar: hip.has('escuta-x-leitura') || nivel === 'A1', mostrarTextoDepois: true });
    // a partir da segunda parte da missão entra uma frase para falar em voz alta (microfone ou digitando)
    const fala = !primeira ? escolherExercicios(def.exercicios.filter(e => e.tipo === 'fala'), { quantos: 1, alvo, vistos, excluir: usados }) : [];
    if (fala.length) { blocos.push({ tipo: 'exercicios', titulo: 'Fale em voz alta', exercicios: fala.map(e => ({ ...e, missao: def.id })) }); gasto += MIN.exercicio; }
    if (hip.has('escuta-x-leitura')) porque.push('Incluímos mais escuta porque, até aqui, você tem entendido melhor lendo do que ouvindo.');
    if (preferirProducao) porque.push('Trocamos parte das alternativas por frases para você montar, porque produzir sozinho ainda é o passo que falta.');
    gasto += custoExp + exs.length * MIN.exercicio + esc.length * MIN.escuta;
    // sobrou tempo? treino extra dos pontos de gramática da missão (catálogo de dificuldades)
    const sobra = Math.floor((orcamento - gasto - (ultima && !temProducao ? MIN.producao : 0) - 1) / MIN.exercicio);
    if (sobra >= 2) {
      const extra = escolherExercicios(def.tags.flatMap(exerciciosDaTag), { quantos: Math.min(4, sobra), alvo, vistos, preferirProducao, excluir: usados });
      extra.forEach(e => usados.add(e.id));
      if (extra.length) { blocos.push({ tipo: 'exercicios', titulo: 'Treino extra', exercicios: extra }); gasto += extra.length * MIN.exercicio; }
    }
    if (ultima && !temProducao) {
      blocos.push({ tipo: 'producao', reteste: false, missao: def.id, titulo: 'Sua vez: use de verdade', tarefa: def.tarefa, situacao: def.tarefa.enunciado, area: perfil.area || null, semDicas: false });
      gasto += MIN.producao; temProducao = true;
      porque.push('No fim, uma tarefa real. Se você fizer sem usar as dicas, ela conta como aprendizado demonstrado.');
    }
  } else {
    porque.push('Você passou por todas as missões do plano. Agora o foco é manter o que conquistou e ampliar: refaça o nivelamento ou ajuste seu objetivo quando quiser.');
  }

  // 4) Retomada: 1-2 itens de missões anteriores (lembrar depois de dias ajuda a fixar)
  const anteriores = plano.missoes.filter(m => competencias[m.id] && competencias[m.id].status !== 'nao_iniciada' && m.id !== atual?.id);
  if (anteriores.length && gasto < orcamento - 1) {
    const pool = anteriores.flatMap(m => POR_ID[m.id].exercicios.map(e => ({ ...e, missao: m.id }))).filter(e => !usados.has(e.id));
    const errados = pool.filter(e => vistos[e.id] && !vistos[e.id].acertou);
    const escolha = (errados.length ? errados : embaralhar(pool, hojeISO)).slice(0, gasto < orcamento - 2 ? 2 : 1);
    if (escolha.length) {
      blocos.push({ tipo: 'retomada', titulo: 'Retomada rápida', exercicios: escolha });
      gasto += escolha.length * MIN.exercicio;
      porque.push(errados.length ? 'Trouxemos de volta um ponto de uma missão anterior que ainda não estava firme.' : 'E uma retomada rápida de missões anteriores, para não esquecer.');
    }
  }

  // 5) Respostas rápidas para quem sabe mas demora
  if (hip.has('demora-formular') && gasto < orcamento - 1) {
    const dominados = Object.entries(vistos).filter(([id, v]) => v.acertou && TODOS_EXERCICIOS[id] && !usados.has(id) && PRODUCAO.includes(TODOS_EXERCICIOS[id].tipo)).map(([id]) => id);
    if (dominados.length >= 3) {
      blocos.push({ tipo: 'rapidas', titulo: 'Respostas rápidas', exercicios: embaralhar(dominados, hojeISO + 'r').slice(0, 3).map(id => TODOS_EXERCICIOS[id]), texto: 'Responda o mais rápido que conseguir. Não precisa ser perfeito.' });
      porque.push('Uma rodada de respostas rápidas com coisas que você já sabe, para a resposta sair mais automática.');
    }
  }

  gasto -= limitarQuestoes(blocos) * MIN.exercicio;

  return {
    data: hojeISO,
    minutos: Math.round(Math.min(orcamento, Math.max(8, gasto))),
    missao: missaoInfo,
    porque,
    revisoesPendentes: cartoesPendentes,
    blocos,
  };
}

// Remove gabaritos antes de mandar ao navegador e embaralha as opções.
function paraCliente(licao, semente) {
  const limpar = (e, i) => {
    const base = { id: e.id, tipo: e.tipo, habilidade: e.habilidade, tag: e.tag || null, dif: e.dif || 1, enunciado: e.enunciado || null };
    if (e.opcoes) base.opcoes = embaralhar(e.opcoes, `${semente}:${e.id}:${i}`);
    if (e.frase) base.frase = e.frase;
    if (e.pt) base.pt = e.pt;
    if (e.texto) base.texto = e.texto;
    if (e.pergunta) base.pergunta = e.pergunta;
    if (e.audio) base.audio = e.audio;
    if (e.errado) base.errado = e.errado;
    if (e.palavras) base.palavras = embaralhar(e.palavras, `${semente}:${e.id}:p`);
    if (e.dica) base.dica = e.dica;
    if (e.sufixo) base.sufixo = e.sufixo;
    if (e.multi) base.multi = true;
    if (e.personalizado) base.personalizado = true;
    if (e.tokens) base.tokens = e.tokens;   // caça ao erro: só as palavras; o índice do erro fica no servidor
    if (e.oponente) base.oponente = e.oponente;
    if (e.pares) base.pares = e.pares;   // nos pares a tradução já foi mostrada na explicação: não é gabarito escondido
    return base;
  };
  return {
    ...licao,
    blocos: licao.blocos.map(b => {
      const c = { ...b };
      if (b.exercicios) c.exercicios = b.exercicios.map(limpar);
      if (b.tarefa) c.tarefa = { enunciado: b.tarefa.enunciado, minPalavras: b.tarefa.minPalavras, dicas: b.semDicas ? [] : (b.tarefa.dicas || []), modelo: null, elementos: (b.tarefa.elementos || []).map(e => e.nome) };
      return c;
    }),
  };
}

// Acha um exercício (com gabarito) dentro da lição salva ou no catálogo.
function acharExercicio(licaoCompleta, id) {
  for (const b of licaoCompleta?.blocos || []) for (const e of b.exercicios || []) if (e.id === id) return e;
  return null;
}

// Exercícios vindos da IA: só entra o que tem forma válida e uma resposta certa clara.
function validarExerciciosIa(lista, missaoId, tag, max = 3) {
  const ok = [];
  const txt = (s, max) => typeof s === 'string' && s.trim().length > 0 && s.length <= max;
  for (const e of (Array.isArray(lista) ? lista : []).slice(0, max + 4)) {
    const base = { id: `ia:${missaoId}:${ok.length}`, habilidade: e.tipo === 'traduzir' ? 'escrita' : 'gramatica', tag: tag || null, dif: 2, missao: missaoId, personalizado: true, explica: txt(e.explicacao, 300) ? e.explicacao : null };
    if (e.tipo === 'escolha' && txt(e.enunciado, 200) && Array.isArray(e.opcoes) && e.opcoes.length >= 2 && e.opcoes.length <= 5 && e.opcoes.every(o => txt(o, 160)) && new Set(e.opcoes).size === e.opcoes.length && Number.isInteger(e.correta) && e.correta >= 0 && e.correta < e.opcoes.length)
      ok.push({ ...base, tipo: 'escolha', enunciado: e.enunciado, opcoes: e.opcoes, resposta: e.correta });
    else if (e.tipo === 'lacuna' && txt(e.frase, 200) && e.frase.split('___').length === 2 && Array.isArray(e.respostas_aceitas) && e.respostas_aceitas.length && e.respostas_aceitas.every(r => txt(r, 60)))
      ok.push({ ...base, tipo: 'lacuna', frase: e.frase, resposta: e.respostas_aceitas });
    else if (e.tipo === 'traduzir' && txt(e.pt, 200) && Array.isArray(e.respostas_aceitas) && e.respostas_aceitas.length && e.respostas_aceitas.every(r => txt(r, 200)))
      ok.push({ ...base, tipo: 'traduzir', pt: e.pt, aceitas: e.respostas_aceitas });
    if (ok.length >= max) break;
  }
  return ok;
}

module.exports = { limitarQuestoes, limiteDaLicao, MAX_QUESTOES, MAX_COM_AUDIO, montarLicao, paraCliente, acharExercicio, exerciciosDaTag, missaoAtual, validarExerciciosIa };
