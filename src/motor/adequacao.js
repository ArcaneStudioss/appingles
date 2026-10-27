'use strict';
// Adequação à idade do que o aluno pede (estudo sob medida, objetivo livre) e do que a IA devolve.
// Três camadas: este filtro na entrada, regras no prompt da IA (ia.js) e o mesmo filtro na saída.
// É uma rede de segurança por palavras: não entende contexto. Na dúvida, o aluno recebe um aviso e escolhe outro assunto.
const { faixaEtaria } = require('./publico');

// adultos: vale para todas as idades; saida: também confere o que a IA escreveu (só termos pouco ambíguos)
const CATEGORIAS = [
  { id: 'sexual', adultos: true, saida: true,
    re: /\b(porn\w*|xxx|hentai|onlyfans|nudes|erotic\w*|orgasm\w*|masturb\w*|blow ?job|handjob|striptease|fetish\w*|sexting|sexo (explicito|oral|anal)|cena de sexo|sex scenes?|pedofil\w*|pedophil\w*|lolic\w*|sexo com (crianca|menor)\w*|child porn\w*)\b/,
    mensagem: 'O Inglou não cria estudos com conteúdo sexual explícito. Escolha outro assunto.' },
  { id: 'autolesao', adultos: true, saida: true,
    re: /\b(suicid\w*|me matar|se matar|kill myself|killing myself|automutila\w*|auto mutila\w*|self[- ]?harm\w*|cutting myself|me cortar|end my life)\b/,
    mensagem: 'Esse é um assunto delicado e o Inglou não monta estudo sobre ele. Se você está mal, converse com alguém de confiança. No Brasil, o CVV atende 24 horas pelo 188, ligação gratuita.' },
  { id: 'perigo', adultos: true, saida: true,
    re: /\b(como (fazer|montar|construir) (uma )?(bomba|explosivo\w*|arma)\w*|how to (make|build) (a )?(bomb|explosive\w*|gun)|bomb[- ]?making)\b/,
    mensagem: 'O Inglou não cria estudos que ensinam a machucar pessoas. Escolha outro assunto.' },
  { id: 'sexo-menor', adultos: false, saida: false,
    re: /\b(sexo|sex|sexual\w*|sexy|transar|transa|camisinha|condom|erecao|penis|vagina|seios|peitos|bunda)\b/,
    mensagem: 'Esse tema não é adequado para a sua faixa etária no Inglou. Escolha outro assunto ou converse com um responsável.' },
  { id: 'drogas', adultos: false, saida: true,
    re: /\b(cocaina|cocaine|maconha|marijuana|heroina|heroin|lsd|ecstasy|metanfetamina|meth|fentanil\w*|haxixe|cannabis|drogas ilicitas|trafic\w* (de )?drogas|drug dealer|traficante)\b/,
    mensagem: 'Esse tema não é adequado para a sua faixa etária no Inglou. Escolha outro assunto ou converse com um responsável.' },
  { id: 'alcool-tabaco', adultos: false, saida: false,
    re: /\b(cerveja|beer|vodka|whisky|whiskey|alcool|alcohol\w*|embriag\w*|bebad[oa]|drunk|vape|cigarro|cigarette|tabaco|tobacco)\b/,
    mensagem: 'Esse tema não é adequado para a sua faixa etária no Inglou. Escolha outro assunto ou converse com um responsável.' },
  { id: 'violencia', adultos: false, saida: true,
    re: /\b(gore|tortur\w*|decapit\w*|esquartej\w*|como matar|how to kill|estupr\w*|rape|serial killer)\b/,
    mensagem: 'Esse tema não é adequado para a sua faixa etária no Inglou. Escolha outro assunto ou converse com um responsável.' },
  { id: 'armas', adultos: false, saida: false,
    re: /\b(arma de fogo|armas de fogo|firearm\w*|pistola|revolver|fuzil|rifle|submetralhadora)\b/,
    mensagem: 'Esse tema não é adequado para a sua faixa etária no Inglou. Escolha outro assunto ou converse com um responsável.' },
  { id: 'apostas', adultos: false, saida: false,
    re: /\b(apostas?|gambl\w*|cassino|casino|poker|poquer|tigrinho|bet365|betting|roleta)\b/,
    mensagem: 'Jogos de aposta não são adequados para a sua faixa etária. Escolha outro assunto.' },
  { id: 'palavrao', adultos: false, saida: false,
    re: /\b(palavroes?|palavrao|xingament\w*|insultos?|swear\w*|curse words?|cussing|profanity|dirty words?|bad words?)\b/,
    mensagem: 'O Inglou não ensina palavrões nem xingamentos para a sua faixa etária. Escolha outro assunto.' },
  { id: 'chulo', adultos: false, saida: true,
    re: /\b(fuck\w*|shit\w*|bitch\w*|asshole|pussy|cunt|porra|caralho|puta|fdp|merda)\b/,
    mensagem: 'Esse tema não é adequado para a sua faixa etária no Inglou. Escolha outro assunto ou converse com um responsável.' },
];

const LEET = { 0: 'o', 1: 'i', 3: 'e', 4: 'a', 5: 's', 7: 't', '@': 'a', $: 's' };
const normalizar = s => String(s ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9@$' ]+/g, ' ').replace(/\s+/g, ' ');
// sem idade informada vale a regra mais cuidadosa de menores
const ehMenor = publico => (publico?.informado === false ? true : (publico?.id || faixaEtaria(publico?.idade) || 'adolescente') !== 'adulto');

function categoriaDoTexto(texto, publico, { saida = false } = {}) {
  const base = normalizar(texto);
  if (!base) return null;
  const variantes = [base, base.replace(/[013457@$]/g, c => LEET[c])];
  const menor = ehMenor(publico);
  const c = CATEGORIAS.find(c => (c.adultos || menor) && (!saida || c.saida) && variantes.some(v => c.re.test(v)));
  return c || null;
}

// Pedido do aluno (título, descrição, material). Devolve { ok: true } ou { ok: false, categoria, mensagem }.
function avaliarPedido(textos, publico) {
  for (const t of Object.values(textos)) {
    const c = categoriaDoTexto(t, publico);
    if (c) return { ok: false, categoria: c.id, mensagem: c.mensagem };
  }
  return { ok: true };
}

function textos(valor, fundo = 0, saida = []) {
  if (typeof valor === 'string') saida.push(valor);
  else if (fundo < 6 && valor && typeof valor === 'object') for (const v of Object.values(valor)) textos(v, fundo + 1, saida);
  return saida;
}

// Tudo que a IA escreveu (texto solto, lista ou objeto): false se algum trecho for inadequado para a idade
function saidaAdequada(valor, publico) {
  return !textos(valor).some(t => categoriaDoTexto(t, publico, { saida: true }));
}

module.exports = { avaliarPedido, saidaAdequada, categoriaDoTexto };
