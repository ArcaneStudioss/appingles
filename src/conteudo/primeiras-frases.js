'use strict';
// Cada pedaço é ensinado com significado antes de pedir a frase inteira.
const PRIMEIRAS_FRASES = {
  'zero-sons': [ [['Hello!', 'Olá!'], ['Thank you.', 'Obrigado.']], [['Thank you.', 'Obrigado.'], ['Bye!', 'Tchau!']] ],
  'zero-oi-tchau': [ [['Good morning!', 'Bom dia!'], ['Thank you.', 'Obrigado.']], [['Sorry.', 'Desculpe.'], ['Bye!', 'Tchau!']] ],
  'zero-nome-origem': [ [['My name is', 'Meu nome é'], ['Ana.', 'Ana.']], [['I am from', 'Eu sou de'], ['Brazil.', 'Brasil.']] ],
  'zero-numeros': [ [['I am', 'Eu tenho (para idade)'], ['ten', 'dez'], ['years old.', 'anos de idade.']], [['My number is', 'Meu número é'], ['one, two, three.', 'um, dois, três.']] ],
  'zero-to-be': [ [['I am', 'Eu estou'], ['happy.', 'feliz.']], [['She is', 'Ela é'], ['my friend.', 'minha amiga.']] ],
  'zero-familia': [ [['This is', 'Esta é'], ['my mother.', 'minha mãe.']], [['I have', 'Eu tenho'], ['one brother.', 'um irmão.']] ],
  'zero-cores-casa': [ [['There is', 'Há'], ['a blue chair.', 'uma cadeira azul.']], [['There are', 'Há (mais de um)'], ['two beds.', 'duas camas.']] ],
  'zero-rotina': [ [['I wake up', 'Eu acordo'], ['at seven.', 'às sete.']], [['I study', 'Eu estudo'], ['on Monday.', 'na segunda-feira.']] ],
  'zero-comida': [ [["I'd like", 'Eu gostaria de'], ['water, please.', 'água, por favor.']], [['How much', 'Quanto'], ['is it?', 'custa?']] ],
  'zero-lugares': [ [['Where is', 'Onde fica'], ['the park?', 'o parque?']], [['Turn left.', 'Vire à esquerda.'], ['Go straight.', 'Siga em frente.']] ],
  'zero-gostos': [ [['I like', 'Eu gosto de'], ['music.', 'música.']], [["I don't like", 'Eu não gosto de'], ['rain.', 'chuva.']] ],
  'zero-conversa': [ [['Hello!', 'Olá!'], ['My name is', 'Meu nome é'], ['Ana.', 'Ana.']], [['I like', 'Eu gosto de'], ['music.', 'música.'], ['And you?', 'E você?']] ],
};
module.exports = { PRIMEIRAS_FRASES };
