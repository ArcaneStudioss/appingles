'use strict';
const { REGIOES } = require('../conteudo/brasil-mundo');
const FAIXAS = {
  crianca: { nome: 'Crianças', intervalo: 'até 12 anos', contexto: 'brincadeiras, animais, família, escola e descobertas', orientacao: 'Use instruções curtas, situações concretas, imagens e jogos. Apresente uma ideia de cada vez e explique cada erro com gentileza.' },
  adolescente: { nome: 'Adolescentes', intervalo: '13 a 17 anos', contexto: 'amizades, escola, música, esportes, tecnologia, jogos, mensagens, redes sociais e projetos', orientacao: 'Fale de forma direta e respeitosa, sem infantilizar. Use desafios com propósito, escolhas e exemplos próximos da vida adolescente. Explique gírias e abreviações com contexto, tom e alternativa neutra; não force gírias nem suponha que todos os adolescentes falam igual.' },
  adulto: { nome: 'Adultos', intervalo: '18 anos ou mais', contexto: 'cotidiano, viagens, estudos, trabalho e interesses pessoais', orientacao: 'Trate como adulto mesmo no A1. Use linguagem objetiva, exemplos úteis e explicações claras. Não use fala de bebê nem recompensas infantis.' },
};
function faixaEtaria(idade) {
  if (!Number.isInteger(idade) || idade < 1 || idade > 120) return null;
  return idade <= 12 ? 'crianca' : idade <= 17 ? 'adolescente' : 'adulto';
}
function publicoDe(perfil = {}) {
  const id = faixaEtaria(perfil.idade) || 'adulto';
  const regiao = perfil.regiao === 'fora' ? { id: 'fora', nome: 'Fora do Brasil' } : Object.hasOwn(REGIOES, perfil.regiao) ? { id: perfil.regiao, nome: REGIOES[perfil.regiao] } : null;
  return { id, ...FAIXAS[id], informado: faixaEtaria(perfil.idade) !== null, regiao };
}
module.exports = { FAIXAS, faixaEtaria, publicoDe };
