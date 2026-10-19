'use strict';
// Figurinhas do Álbum Brasil: cada uma é o prêmio de uma missão temática (missoes-brasil.js).
// Imagens geradas por IA e reduzidas por scripts/preparar-figurinhas.ps1 (public/assets/figurinhas/).
// "conferido" só vira true depois de checar estado de ameaça (IUCN e ICMBio) e fonte de cada afirmação da legenda.
// Ver docs/superpowers/specs/2026-10-19-album-brasil-design.md.

const F = (id, grupo, tom, nome, estado, alt, legendaEn, legendaPt) =>
  ({ id, missao: 'brasil-' + id, arquivo: id + '.jpg', grupo, tom, nome, estado, alt, legendaEn, legendaPt, conferido: false });

const FIGURINHAS = [
  F('arara', 'animal', 'aviso', 'Arara-azul-grande', 'Vulnerável',
    'Arara-azul-grande pousada num galho, de plumagem azul-cobalto, bico preto e anel amarelo no olho',
    'The biggest macaw in the world is losing its home, and young birds are still taken for illegal trade.',
    'A maior arara do mundo está perdendo o seu lar, e filhotes ainda são levados para o comércio ilegal.'),
  F('mico', 'animal', 'perigo', 'Mico-leão-dourado', 'Em perigo',
    'Mico-leão-dourado de pelo dourado e longo, sentado num galho na Mata Atlântica',
    'It lives only in the Atlantic Forest, which lost most of its trees. Now it is coming back, thanks to people who protect the forest.',
    'Vive só na Mata Atlântica, que perdeu a maior parte das árvores. Agora está voltando, graças a quem protege a mata.'),
  F('onca', 'animal', 'aviso', 'Onça-pintada', 'Vulnerável no Brasil',
    'Onça-pintada deitada na margem de um rio do Pantanal, com a pelagem dourada cheia de rosetas pretas',
    'The jaguar needs a lot of space. Fires and farms cut its forest into small pieces.',
    'A onça precisa de muito espaço. Queimadas e fazendas cortam a floresta dela em pedacinhos.'),
  F('peixeboi', 'animal', 'perigo', 'Peixe-boi-marinho', 'Em perigo no Brasil',
    'Peixe-boi-marinho cinza nadando devagar sobre capim marinho em água rasa e esverdeada',
    'This gentle sea cow is hurt by boats and fishing nets, and it loses the mangroves where it feeds.',
    'Este animal manso se machuca com barcos e redes de pesca, e perde os manguezais onde se alimenta.'),
  F('tartaruga', 'animal', 'perigo', 'Tartaruga-de-pente', 'Criticamente em perigo',
    'Tartaruga-de-pente nadando sobre um recife de corais, com o casco em tons de âmbar e marrom',
    'Plastic, fishing nets and lost beaches put this sea turtle in danger. Many people work to protect its nests.',
    'Plástico, redes de pesca e praias perdidas colocam esta tartaruga em perigo. Muita gente trabalha para proteger os ninhos.'),
  F('lobo', 'animal', 'aviso', 'Lobo-guará', 'Vulnerável no Brasil',
    'Lobo-guará de pelo avermelhado e pernas longas e pretas, em pé no capim dourado do Cerrado',
    'The Cerrado is shrinking, and many maned wolves are hit by cars on the road.',
    'O Cerrado está encolhendo, e muitos lobos-guará são atropelados nas estradas.'),
  F('catadora', 'gente', 'orgulho', 'Catadora de recicláveis', 'Trabalho essencial',
    'Catadora de materiais recicláveis sorrindo, de colete refletivo e luvas, separando garrafas e papelão numa cooperativa',
    'She collects what others throw away and keeps our cities cleaner. Her work deserves respect and fair pay.',
    'Ela recolhe o que os outros jogam fora e deixa nossas cidades mais limpas. O trabalho dela merece respeito e pagamento justo.'),
  F('pescador', 'gente', 'orgulho', 'Pescador artesanal', 'Trabalho essencial',
    'Pescador artesanal consertando uma rede ao lado de uma jangada na praia, ao amanhecer',
    'He feeds many families, but today he finds a dirtier sea and fewer fish.',
    'Ele alimenta muitas famílias, mas hoje encontra um mar mais sujo e menos peixes.'),
  F('quilombola', 'gente', 'orgulho', 'Mulher quilombola', 'Terra e história',
    'Mulher quilombola sorrindo, com uma cesta de mandioca recém-colhida, na plantação da comunidade',
    'Her community grows food on land that her family has cared for for generations. Many quilombos still wait for the legal title.',
    'A comunidade dela planta alimentos numa terra que a família cuida há gerações. Muitos quilombos ainda esperam o título da terra.'),
  F('indigena', 'gente', 'orgulho', 'Mulher indígena', 'Guardiã da floresta',
    'Mulher indígena tecendo um cesto de palha na frente de uma casa de aldeia, à beira da floresta',
    'Indigenous peoples take care of the forest and keep old crafts alive. They keep fighting for the right to their land.',
    'Os povos indígenas cuidam da floresta e mantêm vivos os ofícios antigos. Eles seguem lutando pelo direito à sua terra.'),
];

const POR_MISSAO = Object.fromEntries(FIGURINHAS.map(f => [f.missao, f]));
const codigoConquista = f => 'fig-' + f.id;

module.exports = { FIGURINHAS, POR_MISSAO, codigoConquista };
