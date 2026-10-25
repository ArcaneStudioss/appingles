'use strict';
// Apoio pedagógico disponível também sem IA. O gabarito só entra no retorno da correção.
const { MISSOES, POR_ID } = require('../conteudo/missoes');
const { POR_TAG } = require('../conteudo/dificuldades');
const { normalizar } = require('./util');

const DONOS = new Map(MISSOES.flatMap(m => m.exercicios.map(e => [e.id, m])));
const TRADUCOES = new Map(MISSOES.flatMap(m => [
  ...m.exemplos.map(e => [normalizar(e.en), e.pt]),
  ...m.vocab.map(v => [normalizar(v.en), v.pt]),
]));
const INSTRUCOES = {
  escolha: 'Toque em uma resposta. Depois, toque em Conferir.',
  leitura: 'Leia o texto com calma. Toque na resposta e depois em Conferir.',
  escuta: 'Toque em Ouvir. Escolha uma resposta e toque em Conferir.',
  lacuna: 'Escreva a palavra que falta no espaço azul. Depois, toque em Conferir.',
  ordenar: 'Toque nas palavras para montar a frase. Toque de novo para devolver uma palavra.',
  ditado: 'Ouça quantas vezes quiser. Escreva o que ouviu e toque em Conferir.',
  traduzir: 'Leia a frase em português. Escreva como dizer isso em inglês.',
  corrigir: 'Mude a parte que precisa de ajuste. Depois, toque em Conferir.',
  fala: 'Ouça o exemplo. Depois, fale ou escreva a frase.',
  detetive: 'Toque na palavra que precisa de correção e depois em Conferir.',
  pares: 'Toque em uma palavra em inglês e depois no significado em português.',
};

function apoioDoExercicio(ex) {
  const missao = POR_ID[ex.missao] || DONOS.get(ex.id);
  const texto = normalizar([ex.enunciado, ex.frase, ex.pt, ex.audio, ...(ex.palavras || [])].filter(Boolean).join(' '));
  const vocab = (missao?.vocab || []).map(v => {
    const termos = normalizar(v.en + ' ' + v.pt).split(' ').filter(t => t.length > 2);
    return { v, pontos: termos.filter(t => (' ' + texto + ' ').includes(' ' + t + ' ')).length };
  }).filter(x => x.pontos > 0).sort((a, b) => b.pontos - a.pontos).slice(0, 3).map(({ v }) => ({ en: v.en, pt: v.pt }));
  const regra = ex.tag && POR_TAG[ex.tag]?.regra;
  let dica = ex.dica;
  if (!dica && vocab.length) dica = 'Lembre das palavras que aprendemos. Você pode ouvir e olhar o significado abaixo.';
  if (!dica) dica = regra || missao?.explicacao.texto || INSTRUCOES[ex.tipo] || 'Vá com calma. Você pode consultar a resposta para aprender.';
  return { instrucao: INSTRUCOES[ex.tipo], dica, apoio: vocab };
}

function completarLacunas(ex) {
  const primeira = ex.resposta?.[0] || '';
  const n = ex.frase?.split('___').length - 1;
  if (!n) return primeira;
  if (n === 1) return ex.frase.replace('___', primeira);
  const partes = primeira.split(/[,\s]+/).filter(Boolean);
  if (partes.length !== n) return null;
  let i = 0;
  return ex.frase.replace(/___(?: \([^)]*\))?/g, () => partes[i++]);
}

function retornoDidatico(ex, esperado) {
  const missao = POR_ID[ex.missao] || DONOS.get(ex.id);
  let fraseCompleta = null;
  if (['escuta', 'ditado'].includes(ex.tipo)) fraseCompleta = ex.audio;
  else if (ex.tipo === 'lacuna') fraseCompleta = completarLacunas(ex);
  else if (ex.tipo === 'detetive') fraseCompleta = ex.tokens.map((t, i) => i === ex.erro ? ex.correcao + (t.match(/[.,!?;:]+$/)?.[0] || '') : t).join(' ');
  else if (['ordenar', 'traduzir', 'corrigir', 'fala'].includes(ex.tipo)) fraseCompleta = esperado;
  else if (TRADUCOES.has(normalizar(esperado))) fraseCompleta = esperado;
  const traducao = ex.traducao || (ex.tipo === 'traduzir' || ex.tipo === 'fala' ? ex.pt : null) || TRADUCOES.get(normalizar(fraseCompleta || '')) || null;
  let explica = ex.explica || (ex.tag && POR_TAG[ex.tag]?.regra);
  if (!explica) {
    switch (ex.tipo) {
      case 'escolha':
        explica = traducao ? `“${esperado}” quer dizer “${traducao}”.` : missao?.explicacao.texto || `Neste exercício, a opção que responde ao pedido é “${esperado}”. Compare com o enunciado e tente de novo.`;
        break;
      case 'escuta': case 'ditado':
        explica = `A voz disse “${ex.audio}”.${traducao ? ` Em português: “${traducao}”.` : ` A resposta pedida é “${esperado}”.`} Ouça de novo, devagar, e acompanhe o texto.`;
        break;
      case 'lacuna':
        explica = fraseCompleta ? `Preencha com “${esperado}”. A frase fica: “${fraseCompleta}”.${traducao ? ` Isso quer dizer “${traducao}”.` : ''}` : `As palavras que faltam, na ordem dos espaços, são “${esperado}”.`;
        break;
      case 'ordenar':
        explica = `A ordem das palavras é “${esperado}”.${traducao ? ` Isso quer dizer “${traducao}”.` : ' Compare a posição de cada palavra com a frase que você montou.'}`;
        break;
      case 'traduzir':
        explica = `Para dizer “${ex.pt}”, uma forma é “${esperado}”.`;
        break;
      case 'detetive':
        explica = `A palavra que precisa de ajuste é “${ex.tokens[ex.erro]}”. Use “${ex.correcao}” nesse lugar. A frase corrigida é “${fraseCompleta}”.`;
        break;
      case 'corrigir':
        explica = `Compare “${ex.errado}” com “${esperado}”. Repare nas palavras que mudaram e pratique a frase corrigida.`;
        break;
      case 'fala':
        explica = 'Ouça a frase devagar e repita no seu ritmo. Você também pode escrever. O microfone pode entender uma palavra diferente do que você falou.';
        break;
      case 'leitura':
        explica = `A resposta é “${esperado}”. Volte ao texto e procure a informação que combina com a pergunta.`;
        break;
      case 'pares':
        explica = 'Cada palavra em inglês tem um significado em português. Veja os pares e ouça as palavras para lembrar.';
        break;
      default:
        explica = `Uma resposta para este exercício é “${esperado}”.`;
    }
  }
  return { explica, fraseCompleta, traducao, audioResposta: fraseCompleta || null, ...(ex.tipo === 'pares' ? { pares: ex.pares } : {}) };
}

module.exports = { apoioDoExercicio, retornoDidatico };
