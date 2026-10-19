'use strict';
// Palavras muito comuns que quase nenhuma missão ensina como vocabulário, mas que aparecem em toda frase.
// Servem à tradução por palavra nos exercícios (src/motor/dicionario.js). Tradução curta, a mais usual.

const PALAVRAS_COMUNS = [
  // artigos, pronomes, possessivos
  ['a', 'um, uma'], ['an', 'um, uma'], ['the', 'o, a, os, as'], ['i', 'eu'], ['you', 'você, vocês'], ['he', 'ele'], ['she', 'ela'], ['it', 'ele, ela (coisa ou bicho)'],
  ['we', 'nós'], ['they', 'eles, elas'], ['me', 'me, mim'], ['him', 'o, ele'], ['her', 'dela; a, ela'], ['us', 'nos, nós'], ['them', 'os, eles, elas'],
  ['my', 'meu, minha'], ['your', 'seu, sua, de você'], ['his', 'dele'], ['its', 'dele, dela (coisa ou bicho)'], ['our', 'nosso, nossa'], ['their', 'deles, delas'],
  ['this', 'este, esta, isto'], ['that', 'aquele, aquilo, que'], ['these', 'estes, estas'], ['those', 'aqueles, aquelas'], ['who', 'quem'], ['what', 'o que, qual'],
  ['where', 'onde'], ['when', 'quando'], ['why', 'por que'], ['how', 'como'], ['which', 'qual'],
  // verbos básicos
  ['be', 'ser, estar'], ['am', 'sou, estou'], ['is', 'é, está'], ['are', 'são, estão'], ['was', 'era, foi, estava'], ['were', 'eram, foram, estavam'], ['been', 'sido, estado'],
  ['have', 'ter'], ['has', 'tem'], ['had', 'teve, tinha'], ['do', 'fazer (ajuda nas perguntas e negativas)'], ['does', 'faz (ajuda nas perguntas e negativas)'], ['did', 'fez (ajuda no passado)'],
  ['can', 'poder, conseguir'], ['could', 'poderia, conseguia'], ['must', 'precisar, dever'], ['will', 'vai (futuro)'], ['would', 'faria, gostaria'], ['should', 'deveria'],
  ['go', 'ir'], ['goes', 'vai'], ['went', 'foi'], ['come', 'vir'], ['get', 'pegar, conseguir, ficar'], ['make', 'fazer, criar'], ['take', 'pegar, levar'], ['see', 'ver'], ['know', 'saber, conhecer'],
  ['want', 'querer'], ['like', 'gostar; como'], ['love', 'amar, adorar'], ['live', 'viver, morar'], ['work', 'trabalhar; trabalho'], ['eat', 'comer'], ['help', 'ajudar'], ['keep', 'manter'],
  ['catch', 'pegar, apanhar'], ['hurt', 'machucar, ferir'], ['cut', 'cortar'], ['burn', 'queimar'], ['leave', 'deixar, sair'], ['find', 'encontrar'], ['cut', 'cortar'], ['swim', 'nadar'], ['fly', 'voar'],
  ['say', 'dizer'], ['tell', 'contar, dizer'], ['ask', 'perguntar, pedir'], ['use', 'usar'], ['need', 'precisar'], ['try', 'tentar'], ['give', 'dar'], ['think', 'pensar'], ['look', 'olhar'], ['learn', 'aprender'],
  ['study', 'estudar'], ['speak', 'falar'], ['wake', 'acordar'], ['sell', 'vender'], ['buy', 'comprar'], ['grow', 'crescer, plantar'], ['fight', 'lutar'], ['care', 'cuidado, importar-se'],
  // preposições, conjunções, advérbios
  ['in', 'em, dentro de'], ['on', 'em, sobre'], ['at', 'em, às (hora, lugar)'], ['to', 'para, a'], ['from', 'de (origem)'], ['of', 'de'], ['for', 'para, por'], ['with', 'com'], ['without', 'sem'],
  ['by', 'por, perto de'], ['about', 'sobre'], ['into', 'para dentro de'], ['over', 'sobre, acima de'], ['under', 'embaixo de'], ['between', 'entre'], ['than', 'do que'], ['as', 'como, enquanto'],
  ['and', 'e'], ['or', 'ou'], ['but', 'mas'], ['so', 'então, tão'], ['because', 'porque'], ['if', 'se'], ['then', 'então, depois'], ['not', 'não'], ["don't", 'não (faço, fazemos...)'], ["doesn't", 'não (faz)'],
  ["can't", 'não consigo, não pode'], ['cannot', 'não consegue, não pode'], ["isn't", 'não é, não está'], ["aren't", 'não são, não estão'], ['no', 'não, nenhum'], ['yes', 'sim'],
  ['very', 'muito'], ['much', 'muito (incontável)'], ['many', 'muitos'], ['more', 'mais'], ['most', 'a maioria, mais'], ['some', 'algum, alguns'], ['any', 'algum, qualquer'], ['all', 'todo, tudo'],
  ['every', 'todo, cada'], ['each', 'cada'], ['only', 'só, apenas'], ['also', 'também'], ['too', 'também, demais'], ['still', 'ainda'], ['now', 'agora'], ['today', 'hoje'], ['here', 'aqui'], ['there', 'lá, ali (há)'],
  ['again', 'de novo'], ['always', 'sempre'], ['never', 'nunca'], ['early', 'cedo'], ['late', 'tarde, atrasado'], ['well', 'bem'], ['just', 'só, apenas'],
  // substantivos e adjetivos muito comuns
  ['day', 'dia'], ['night', 'noite'], ['year', 'ano'], ['time', 'tempo, vez'], ['people', 'pessoas, gente'], ['man', 'homem'], ['woman', 'mulher'], ['child', 'criança'], ['family', 'família'],
  ['friend', 'amigo, amiga'], ['home', 'casa, lar'], ['city', 'cidade'], ['water', 'água'], ['food', 'comida'], ['money', 'dinheiro'], ['animal', 'animal'], ['life', 'vida'], ['world', 'mundo'],
  ['good', 'bom'], ['bad', 'ruim'], ['new', 'novo'], ['old', 'velho, antigo'], ['small', 'pequeno'], ['long', 'longo, comprido'], ['high', 'alto'], ['young', 'jovem'], ['beautiful', 'bonito, lindo'],
  ['dirty', 'sujo'], ['dirtier', 'mais sujo'], ['fewer', 'menos (contáveis)'], ['less', 'menos'], ['green', 'verde'], ['red', 'vermelho'], ['yellow', 'amarelo'], ['black', 'preto'], ['white', 'branco'],
  // temas das missões do Brasil
  ['wolf', 'lobo'], ['danger', 'perigo'], ['dangerous', 'perigoso'], ['indigenous', 'indígena'], ['quilombo', 'quilombo (comunidade de descendentes de pessoas escravizadas)'], ['egg', 'ovo'], ['lay', 'pôr (ovos), colocar'],
  ['atlantic', 'atlântico'], ['cerrado', 'Cerrado (savana brasileira)'], ['collector', 'coletor, catador'], ['corn', 'milho'], ['bean', 'feijão'], ['bottle', 'garrafa'], ['cat', 'gato, felino'], ['dog', 'cachorro'],
  ['car', 'carro'], ['ocean', 'oceano'], ['sky', 'céu'], ['sand', 'areia'], ['root', 'raiz'], ['straw', 'palha'], ['shallow', 'raso'], ['slow', 'lento'], ['strong', 'forte'], ['warm', 'quente, morno'], ['stuck', 'preso'],
  ['taller', 'mais alto'], ['title', 'título'], ['legal', 'legal, da lei'], ['partner', 'parceiro, parceira'], ['piece', 'pedaço'], ['please', 'por favor'], ['put', 'pôr, colocar'], ['respect', 'respeito, respeitar'],
  ['deserve', 'merecer'], ['mend', 'consertar'], ['market', 'mercado'], ['lost', 'perdido, perdeu'], ['lot', 'muito (em "a lot of")'], ['hit', 'bater; atropelado'], ['fur', 'pelo'], ['grandmother', 'avó'], ['alone', 'sozinho'],
  ['back', 'de volta; costas'], ['up', 'para cima'], ['important', 'importante'], ['maned', 'com crina (o lobo-guará é o "maned wolf")'], ['countryside', 'interior, campo'], ['seed', 'semente'], ['bed', 'cama'], ['thing', 'coisa'], ['wing', 'asa'], ['news', 'notícias'],
  ['one', 'um'], ['two', 'dois'], ['three', 'três'], ['four', 'quatro'], ['five', 'cinco'], ['six', 'seis'], ['seven', 'sete'], ['eight', 'oito'], ['nine', 'nove'], ['ten', 'dez'],
];

module.exports = { PALAVRAS_COMUNS: PALAVRAS_COMUNS.map(([en, pt]) => ({ en, pt })) };
