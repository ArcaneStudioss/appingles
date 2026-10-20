'use strict';
// Objetivos que organizam o curso. A ordem das missões é a trilha sugerida;
// "essenciais" são as que entram mesmo quando o prazo é curto.

const OBJETIVOS = {
  zero: {
    nome: 'Começar do zero',
    frase: 'Aprender inglês desde o primeiro dia: sons, cumprimentos, se apresentar e conversar um minuto sobre você.',
    missoes: ['zero-sons', 'zero-oi-tchau', 'zero-nome-origem', 'zero-numeros', 'zero-to-be', 'zero-familia', 'zero-cores-casa', 'zero-rotina', 'zero-comida', 'zero-lugares', 'zero-gostos', 'zero-conversa'],
    essenciais: ['zero-sons', 'zero-oi-tchau', 'zero-nome-origem', 'zero-to-be', 'zero-conversa'],
    exemploMeta: 'Conversar um minuto em inglês sobre mim: nome, de onde sou, idade, o que gosto.',
  },
  entrevista: {
    nome: 'Entrevista de emprego',
    frase: 'Chegar na entrevista sabendo se apresentar, contar sua experiência e responder às perguntas mais comuns.',
    missoes: ['apresentar', 'pedir-repetir', 'trajetoria', 'perguntas-entrevista', 'projeto', 'forcas', 'planos', 'perguntar-empresa', 'reunioes', 'emails'],
    essenciais: ['apresentar', 'trajetoria', 'perguntas-entrevista', 'projeto', 'perguntar-empresa'],
    exemploMeta: 'Responder às 6 perguntas mais comuns de entrevista em frases simples e claras, sem ler.',
  },
  trabalho: {
    nome: 'Inglês no trabalho (reuniões e e-mails)',
    frase: 'Participar de reuniões, dar opinião e escrever e-mails sem travar.',
    missoes: ['apresentar', 'pedir-repetir', 'telefone', 'reunioes', 'emails', 'small-talk', 'trajetoria', 'projeto', 'fim-de-semana', 'planos', 'forcas'],
    essenciais: ['apresentar', 'pedir-repetir', 'reunioes', 'emails'],
    exemploMeta: 'Dar sua opinião numa reunião e escrever e-mails curtos de pedido e confirmação.',
  },
  clientes: {
    nome: 'Atender clientes estrangeiros',
    frase: 'Receber, entender e ajudar clientes em inglês, inclusive quando algo dá errado.',
    missoes: ['atender', 'pedir-repetir', 'telefone', 'apresentar', 'reclamacao', 'emails', 'small-talk', 'viagem-cidade', 'rotina'],
    essenciais: ['atender', 'pedir-repetir', 'reclamacao'],
    exemploMeta: 'Atender um cliente do começo ao fim e resolver uma reclamação simples.',
  },
  cotidiano: {
    nome: 'Dia a dia na cidade (banco, mercado, clínica...)',
    frase: 'Se virar nos lugares do cotidiano em inglês: banco, clínica médica, farmácia, supermercado, padaria e lojas.',
    missoes: ['pedir-repetir', 'supermercado', 'padaria', 'banco', 'farmacia', 'clinica', 'loja-roupas', 'small-talk', 'viagem-cidade'],
    essenciais: ['pedir-repetir', 'supermercado', 'banco', 'clinica'],
    exemploMeta: 'Resolver sozinho uma ida ao banco, à farmácia e ao supermercado, sem depender de tradutor.',
  },
  viagem: {
    nome: 'Viagem',
    frase: 'Se virar no aeroporto, no hotel, no restaurante e na rua.',
    missoes: ['viagem-chegada', 'pedir-repetir', 'viagem-cidade', 'apresentar', 'fim-de-semana', 'rotina', 'planos'],
    essenciais: ['viagem-chegada', 'pedir-repetir', 'viagem-cidade'],
    exemploMeta: 'Fazer check-in, pedir comida e pedir informações sem depender de tradutor.',
  },
  estudar: {
    nome: 'Estudar fora ou fazer uma prova',
    frase: 'Se apresentar, falar de planos e objetivos e escrever textos curtos com clareza.',
    missoes: ['apresentar', 'pedir-repetir', 'rotina', 'planos', 'fim-de-semana', 'trajetoria', 'emails', 'reunioes'],
    essenciais: ['apresentar', 'planos', 'emails'],
    exemploMeta: 'Falar dos seus estudos e planos e escrever um e-mail formal curto.',
    aviso: 'Para provas oficiais (TOEFL, IELTS, Cambridge), este plano trabalha a base de comunicação, mas não substitui um preparatório específico do formato da prova.',
  },
  debate: {
    nome: 'Debater e argumentar',
    frase: 'Dar opinião, discordar com educação, montar argumentos e rebater, com as palavras certas para cada situação.',
    missoes: ['debate-opiniao', 'debate-discordar', 'debate-argumento', 'debate-palavras', 'debate-mediar', 'debate-final'],
    essenciais: ['debate-opiniao', 'debate-discordar', 'debate-argumento'],
    exemploMeta: 'Defender uma posição por 1 minuto, reconhecer o que é justo no outro lado e rebater sem perder a calma.',
    aviso: 'Este plano é para quem já se vira no inglês (B1 ou mais). Se ainda trava em frases simples, comece por "Conversação do dia a dia" e volte aqui depois.',
  },
  conversa: {
    nome: 'Conversação do dia a dia',
    frase: 'Conversar sobre você, sua rotina e suas experiências com mais naturalidade.',
    missoes: ['apresentar', 'small-talk', 'rotina', 'fim-de-semana', 'pedir-repetir', 'planos', 'viagem-cidade', 'reunioes'],
    essenciais: ['apresentar', 'rotina', 'fim-de-semana'],
    exemploMeta: 'Manter uma conversa de 5 minutos sobre você e suas experiências.',
  },
};

const INTERESSES = ['tecnologia', 'saúde', 'vendas', 'finanças', 'educação', 'esportes', 'música', 'cinema e séries', 'viagens', 'gastronomia', 'games', 'natureza'];

module.exports = { OBJETIVOS, INTERESSES };
