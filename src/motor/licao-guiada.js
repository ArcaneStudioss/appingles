'use strict';
// Nas missões iniciais, reconhecer vem antes de escrever. Sem treino extra de gramática alheio à aula.
const { POR_ID } = require('../conteudo/missoes');
const { licoesPorMissao } = require('./plano');
const { publicoDe } = require('./publico');
const { montarBaseIniciante } = require('./licao-iniciante');

function montarGuiada(ctx, atual) {
  const { nivel, competencias = {}, tentativas = [], hojeISO, cartoesPendentes = 0 } = ctx;
  const publico = publicoDe(ctx.perfil);
  let def = POR_ID[atual.id];
  if (publico.id !== 'adulto' && ['zero-numeros', 'zero-rotina', 'zero-conversa'].includes(def.id)) {
    // A estrutura, o gabarito e a rubrica são adaptados juntos para situações da idade do aluno.
    def = JSON.parse(JSON.stringify(def), (_k, v) => typeof v !== 'string' ? v : v
      .replace(/\bworks\b/g, 'studies').replace(/\bwork\b/g, 'study').replace(/\btrabalha\b/g, 'estuda').replace(/\btrabalho\b/g, 'estudo')
      .replace(/\bthirty\b/g, publico.id === 'crianca' ? 'eight' : 'sixteen').replace(/\b30\b/g, publico.id === 'crianca' ? '8' : '16'));
    if (def.id === 'zero-numeros') def.tarefa = { ...def.tarefa, enunciado: 'Diga a idade de uma personagem. Você pode inventar a idade e usar o exemplo como ajuda.', minPalavras: 5, elementos: def.tarefa.elementos.slice(0, 1), dicas: ['I am ... years old.'], modelo: publico.id === 'crianca' ? 'I am eight years old.' : 'I am sixteen years old.' };
  }
  const base = montarBaseIniciante(ctx, atual, def);
  if (base) return { ...base, publico: publico.id };
  const total = licoesPorMissao(def, nivel);
  const parte = Math.min(total, (competencias[atual.id]?.partes || 0) + 1);
  const primeira = nivel === 'A1' ? parte === total - 2 : parte === 1;
  const recentes = tentativas.filter(t => t.missao === def.id && t.origem === 'licao').slice(-6);
  const reforco = recentes.length >= 2 && recentes.filter(t => t.correto).length / recentes.length < 0.6;
  const vistos = new Map(tentativas.map(t => [t.item_id, t]));
  const escolher = (lista, n) => lista.slice().sort((a, b) => {
    const peso = e => !vistos.has(e.id) ? 2 : !vistos.get(e.id).correto ? 1 : 0;
    return peso(b) - peso(a) || (a.dif || 1) - (b.dif || 1);
  }).slice(0, n);
  const escolhas = def.exercicios.filter(e => e.tipo === 'escolha');
  const guiados = def.exercicios.filter(e => ['lacuna', 'ordenar'].includes(e.tipo) && !e.multi);
  const audios = def.exercicios.filter(e => e.tipo === 'escuta');
  const praticas = primeira || reforco
    ? escolher(escolhas, 3)
    : [...escolher(escolhas, 1), ...escolher(guiados, 2)];
  // Três palavras novas no máximo; o restante entra nas partes seguintes.
  const inicio = primeira || reforco ? 0 : Math.min(3, Math.max(0, def.vocab.length - 3));
  const vocab = def.vocab.slice(inicio, inicio + 3);
  const pares = vocab.map(v => ({ en: v.en, pt: v.pt }));
  const comMissao = ex => {
    const base = { ...ex, missao: def.id, guiado: true, publico: publico.id, imagem: publico.id === 'crianca' ? ex.imagem || ({ escolha: '🌟', lacuna: '🧩', ordenar: '🧱', escuta: '🎧' })[ex.tipo] : null };
    if (def.id === 'zero-sons' && publico.id !== 'crianca' && ex.id === 'z1-10') base.enunciado = publico.id === 'adulto' ? 'Você encontrou um colega. Como diz olá?' : 'Você encontrou seus amigos. Como diz olá?';
    if (ex.tipo === 'lacuna') {
      const outras = [...def.exercicios.filter(e => e.tipo === 'lacuna').map(e => e.resposta[0]), ...def.vocab.map(v => v.en), 'Hello', 'Bye'];
      base.bancoPalavras = [...new Set([ex.resposta[0], ...outras.filter(p => p !== ex.resposta[0] && !/\s/.test(p))])].slice(0, 3);
    }
    if (primeira || reforco) {
      const { respostaCerta, corrigirExercicio } = require('./correcao');
      const modelo = ex.tipo === 'escuta' ? ex.audio : ex.tipo === 'ordenar' ? ex.resposta : ex.tipo === 'lacuna' ? ex.frase.replace('___', ex.resposta[0]) : null;
      base.ensino = { en: modelo, pt: ex.pt || ex.traducao || (ex.tipo === 'escolha' ? respostaCerta(ex) : ''), nota: corrigirExercicio(ex, respostaCerta(ex)).explica };
    }
    return base;
  };
  const exercicios = [
    { id: `pares:${def.id}:${parte}`, tipo: 'pares', habilidade: 'vocabulario', dif: 1, missao: def.id, guiado: true, pares },
    ...praticas.map(comMissao),
  ];
  const escuta = escolher(audios, Math.max(0, 5 - exercicios.length)).map(comMissao);
  const blocos = [
    { tipo: 'explicacao', guiada: true, titulo: reforco ? 'Vamos relembrar' : 'Aprenda no seu ritmo', texto: def.explicacao.texto, estrutura: def.explicacao.estrutura, exemplos: def.exemplos, vocab, missao: def.id },
    { tipo: 'exercicios', titulo: publico.id === 'crianca' ? 'Vamos brincar com as palavras' : 'Pratique as novas palavras', exercicios },
  ];
  if (escuta.length) blocos.push({ tipo: 'escuta', titulo: 'Ouça com calma', devagar: true, exercicios: escuta });
  if (parte === total && !reforco) blocos.push({ tipo: 'producao', guiada: true, missao: def.id, titulo: 'Agora é sua vez', tarefa: def.tarefa, situacao: def.tarefa.enunciado, semDicas: false });
  return {
    data: hojeISO, guiada: true, publico: publico.id, reforco, minutos: 5,
    missao: { id: def.id, titulo: def.titulo, podeFazer: def.podeFazer, parte, total },
    porque: [reforco ? 'Vamos rever as palavras com mais ajuda antes de seguir. Aprender leva tempo, e tudo bem.' : 'Primeiro você aprende com áudio e tradução. Depois, pratica um pouquinho de cada vez.'],
    revisoesPendentes: cartoesPendentes, blocos,
  };
}

module.exports = { montarGuiada };
