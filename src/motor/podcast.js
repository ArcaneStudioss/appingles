'use strict';
// Rádio Tuiuiú: um episódio curto por dia, montado com os tropeços do próprio aluno.
// Dois apresentadores: o Tuiuiú explica em português; a Mia dá voz ao inglês (exemplos e "repita comigo").
// Sem IA, o roteiro sai do catálogo de dificuldades + as frases que o aluno realmente escreveu.
// Com IA, o tutor escreve um roteiro mais natural (ver ia.podcast), mas o treino continua vindo do catálogo
// (gabarito conferido no servidor, nunca enviado ao navegador).
const { POR_TAG } = require('../conteudo/dificuldades');
const { POR_ID } = require('../conteudo/missoes');
const { exerciciosDaTag } = require('./licao');
const { diasEntre, palavras } = require('./util');

const ORIGEM = { conversa: 'numa conversa', producao: 'numa tarefa escrita', material: 'no seu material', licao: 'numa aula', revisao: 'na revisão', padrao: 'nas suas respostas' };
const TIPOS_TREINO = ['escolha', 'lacuna', 'traduzir'];
const MAX_TROPECOS = 3;

// Junta os sinais de erro dos últimos 21 dias e devolve os tropeços mais importantes, por tag.
function coletarTropecos({ focos = [], tentativas = [] }, hoje) {
  const recente = iso => iso && diasEntre(iso.slice(0, 10), hoje) <= 21;
  const por = {};
  const item = tag => (por[tag] ||= { tag, nome: POR_TAG[tag].nome, vezes: 0, peso: 0, trecho: null, correcao: null, origem: null });
  for (const t of tentativas) {
    if (t.correto || !t.tag || !POR_TAG[t.tag] || !recente(t.em)) continue;
    const it = item(t.tag); it.vezes++; it.peso += 1;
    if (!it.trecho && t.origem !== 'licao' && t.resposta && t.resposta.length <= 160) { it.trecho = t.resposta; it.origem = t.origem; }
  }
  for (const f of focos) {
    if (!POR_TAG[f.tag] || f.status === 'superado' || !recente(f.criado_em)) continue;
    const it = item(f.tag); it.peso += 3; it.vezes = Math.max(it.vezes, 1);
    if (f.trecho) { it.trecho = f.trecho; it.correcao = f.correcao || null; it.origem = f.origem; }
  }
  return Object.values(por).sort((a, b) => b.peso - a.peso).slice(0, MAX_TROPECOS).map(({ peso, ...r }) => r);
}

// "I'm ... (years old)" é dica de detector, não frase para ler em voz alta
const fraseLimpa = s => typeof s === 'string' && s.length > 2 && s.length <= 200 && !/\.\.\.|\[|\(|\//.test(s);
const primeiraVersao = s => String(s || '').split(' / ')[0].trim();

function roteiroDeTropecos(tropecos, { nome }) {
  const falas = [];
  const lou = (texto, riscado = null) => falas.push({ quem: 'lou', texto, riscado });
  const mia = (texto, repita = false) => falas.push({ quem: 'mia', texto, repita });
  lou(`Oi, ${nome}! Aqui é o Tuiuiú, e este é o seu episódio de hoje da Rádio Tuiuiú.`);
  lou('A Mia está comigo. Ela vai dar voz ao inglês.');
  mia(`Hi, ${nome}! Nice to see you again.`);
  lou(`Juntei ${tropecos.length === 1 ? 'uma coisa' : tropecos.length + ' coisas'} em que você tropeçou nos últimos dias. Errar é normal: é assim que a gente descobre o que treinar.`);
  tropecos.forEach((t, i) => {
    const d = POR_TAG[t.tag];
    const exemplos = d.abordagens.exemplos.filter(fraseLimpa);
    lou(`${tropecos.length > 1 ? `Número ${i + 1}. ` : ''}${d.nome}.`);
    if (t.trecho) {
      // a frase errada aparece riscada na tela, mas não é falada (ouvir o erro em voz alta só reforça o erro)
      lou(`${ORIGEM[t.origem] ? (ORIGEM[t.origem][0].toUpperCase() + ORIGEM[t.origem].slice(1)) : 'Outro dia'}, você escreveu uma frase com esse tropeço. Ela está riscada aí na tela. A Mia diz do jeito natural:`, t.trecho);
      mia(fraseLimpa(t.correcao) ? t.correcao : exemplos[0]);
    }
    lou(d.regra);
    if (d.contraste?.pt && fraseLimpa(primeiraVersao(d.contraste.en))) { lou(`Em português a gente diz: ${d.contraste.pt} Em inglês:`); mia(primeiraVersao(d.contraste.en)); }
    lou('Mais dois exemplos.');
    for (const e of exemplos.slice(0, 2)) mia(e);
    lou('Agora repita depois da Mia, em voz alta. Pode ser baixinho.');
    mia(exemplos[0], true);
  });
  lou(`Resumindo o episódio: ${tropecos.map(t => POR_TAG[t.tag].nome.toLowerCase()).join('; ')}.`);
  lou('Esses pontos já estão nos seus cartões de revisão. Agora tem um treino rapidinho aqui embaixo. Bora?');
  mia(`See you tomorrow, ${nome}!`);
  return falas;
}

// Sem tropeços ainda: o episódio apresenta a missão atual (para a Rádio funcionar desde o primeiro dia).
function roteiroDeMissao(missao, { nome }) {
  const m = POR_ID[missao?.id] || null;
  const falas = [];
  const lou = (texto) => falas.push({ quem: 'lou', texto });
  const mia = (texto, repita = false) => falas.push({ quem: 'mia', texto, repita });
  lou(`Oi, ${nome}! Aqui é o Tuiuiú, na Rádio Tuiuiú.`);
  lou('Ainda não juntei tropeços seus: eles aparecem depois das aulas e conversas. Então hoje o episódio é sobre a sua missão.');
  if (!m) { lou('Faça a aula de hoje e uma conversa curta. Amanhã o episódio já vem com o que você precisa treinar.'); return falas; }
  lou(`A missão é: ${m.titulo}. No fim dela você vai conseguir dizer: ${m.podeFazer}`);
  lou(m.explicacao.texto);
  lou('A Mia vai dar uns exemplos.');
  for (const e of (m.exemplos || []).slice(0, 3)) { mia(e.en); lou(e.pt); }
  lou('Agora umas expressões que ajudam.');
  for (const v of (m.vocab || []).slice(0, 3)) { mia(v.ex); lou(`${v.en.replace(/\.\.\.$/, '')}: ${v.pt.replace(/\.\.\.$/, '')}.`); }
  lou('Repita depois da Mia.');
  if (m.exemplos?.[0]) mia(m.exemplos[0].en, true);
  lou('Pronto! Tem um treino rapidinho aqui embaixo.');
  mia(`See you tomorrow, ${nome}!`);
  return falas;
}

function treinoDe(tropecos, missao) {
  const lista = [];
  if (tropecos.length) {
    for (const t of tropecos) lista.push(...exerciciosDaTag(t.tag).filter(e => TIPOS_TREINO.includes(e.tipo)).slice(0, tropecos.length === 1 ? 4 : 2));
  } else {
    const m = POR_ID[missao?.id];
    for (const e of m?.exercicios || []) if (TIPOS_TREINO.includes(e.tipo)) lista.push({ ...e, missao: m.id, habilidade: e.habilidade || 'gramatica' });
  }
  return lista.slice(0, 5).map(e => ({ ...e, id: 'radio:' + e.id }));
}

function montarEpisodio({ tropecos, missao, nome, falasIa = null }) {
  const falas = falasIa || (tropecos.length ? roteiroDeTropecos(tropecos, { nome }) : roteiroDeMissao(missao, { nome }));
  const segundos = falas.reduce((s, f) => s + palavras(f.texto) / 2.4 + (f.repita ? 4 : 0.6), 0);
  return {
    titulo: tropecos.length ? `Seus tropeços: ${tropecos.map(t => POR_TAG[t.tag].nome.split(/ \(|:/)[0].toLowerCase()).join(', ')}` : `Missão: ${POR_ID[missao?.id]?.titulo || 'primeiros passos'}`,
    minutos: Math.max(1, Math.round(segundos / 60)),
    tropecos: tropecos.map(t => ({ tag: t.tag, nome: t.nome, vezes: t.vezes })),
    falas: falas.map(f => ({ quem: f.quem, lingua: f.quem === 'mia' ? 'en' : 'pt', texto: f.texto, repita: !!f.repita, riscado: f.riscado ? String(f.riscado).slice(0, 200) : null })),
    treino: treinoDe(tropecos, missao),
    modo: falasIa ? 'ia' : 'roteiro',
  };
}

// O que a IA devolve só entra se tiver forma válida (senão, fica o roteiro do catálogo).
function validarFalasIa(falas) {
  if (!Array.isArray(falas) || falas.length < 6 || falas.length > 45) return null;
  const ok = falas.filter(f => f && ['lou', 'mia'].includes(f.quem) && typeof f.texto === 'string' && f.texto.trim() && f.texto.length <= 320)
    .map(f => ({ quem: f.quem, texto: f.texto.trim(), repita: f.quem === 'mia' && f.repita === true }));
  return ok.length === falas.length && ok.some(f => f.quem === 'mia') ? ok : null;
}

module.exports = { coletarTropecos, montarEpisodio, validarFalasIa };
