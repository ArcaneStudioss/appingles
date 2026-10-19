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
