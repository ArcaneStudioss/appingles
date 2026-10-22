'use strict';
// Leitura + escolhas de contexto. As fichas culturais aprofundam as diferenças de uso.
const UNIDADES_BRASIL = [
  {
    id: 'crianca-brasil-sabores', faixa: 'crianca', nivel: 'A1', tema: 'Sabores do Brasil', titulo: 'Na sua casa, como se chama?', imagem: '🍊', cultura: ['bergamota', 'mandioca', 'pao-frances', 'jerimum'],
    explicacao: 'Tangerina, bergamota e mexerica são nomes que você pode ouvir pelo Brasil. Em inglês, mandarin ajuda a falar dessa fruta. Aprenda também palavras para explicar o que há na mesa da sua família. Nenhum jeito regional de falar é errado.',
    vocab: [{ en: 'mandarin', pt: 'tangerina; também chamada de bergamota ou mexerica' }, { en: 'bread roll', pt: 'pãozinho individual' }, { en: 'cassava', pt: 'mandioca, aipim ou macaxeira' }, { en: 'pumpkin', pt: 'abóbora ou jerimum, conforme o tipo' }],
    texto: 'I have a mandarin and a bread roll. My friend calls the fruit bergamota. I call it mexerica. We share our food. At home, we eat cooked cassava and pumpkin soup. We have different names and many stories to tell.',
    traducao: 'Tenho uma tangerina e um pãozinho. Meu amigo chama a fruta de bergamota. Eu a chamo de mexerica. Compartilhamos nossa comida. Em casa, comemos mandioca cozida e sopa de abóbora. Temos nomes diferentes e muitas histórias para contar.',
    perguntas: [
      ['Os amigos usam nomes diferentes para a fruta. O que isso mostra?', ['O Brasil tem diferentes jeitos de nomear alimentos', 'Um dos amigos não sabe falar', 'Cada nome sempre indica uma fruta completamente diferente'], 'O texto apresenta bergamota e mexerica como nomes usados pelos amigos. Conhecer outra palavra não torna o seu jeito de falar errado.'],
      ['O que a família come em casa?', ['Mandioca cozida e sopa de abóbora', 'Somente doces', 'Bolo e sorvete'], 'Cooked cassava é mandioca cozida; pumpkin soup é sopa de abóbora. Aipim e macaxeira também são nomes usados para a mandioca de mesa.'],
    ],
    lacuna: { frase: 'I have a ___. It is a small orange fruit.', resposta: ['mandarin', 'tangerine'], explica: 'Mandarin e tangerine ajudam a falar da fruta. Bergamot geralmente indica outro cítrico em inglês, e não a bergamota da lancheira.' },
  },
  {
    id: 'crianca-brasil-ditados', faixa: 'crianca', nivel: 'A2', tema: 'Ditados e descobertas', titulo: 'Um conselho pode viajar', imagem: '🐢', cultura: ['devagar', 'tarde', 'prevenir', 'aparencia'],
    explicacao: 'Ditados são frases que contam uma ideia com uma imagem. Devagar se vai longe combina com slow and steady wins the race: praticar com calma e constância ajuda. A imagem pode mudar em outro idioma, mas o conselho pode ser parecido.',
    vocab: [{ en: 'steady', pt: 'constante, regular' }, { en: 'late', pt: 'atrasado ou tarde' }, { en: 'careful', pt: 'cuidadoso ou cuidadosa' }, { en: 'progress', pt: 'progresso' }],
    texto: 'Bia wants to learn a new song. She practices a little every day. Her grandpa says, "Slow and steady wins the race." Bia is careful with the difficult parts. She makes progress. Her friend starts practicing a week later. "Better late than never!" Bia says. They can learn together.',
    traducao: 'Bia quer aprender uma música nova. Ela pratica um pouco todos os dias. Seu avô diz: "Devagar se vai longe." Bia tem cuidado com as partes difíceis. Ela progride. Sua amiga começa a praticar uma semana depois. "Antes tarde do que nunca!", diz Bia. Elas podem aprender juntas.',
    perguntas: [
      ['O avô está falando de uma corrida de verdade?', ['Não: ele aconselha Bia a praticar com constância', 'Sim: Bia precisa correr enquanto canta', 'Sim: só ganha quem acaba primeiro'], 'O ditado usa a imagem de uma corrida para valorizar a constância. No texto, a situação é aprender uma música.'],
      ['Por que Bia diz “Better late than never”?', ['A amiga começou depois, mas ainda pode aprender', 'A amiga não pode mais participar', 'É errado começar algo novo'], 'Better late than never tem sentido próximo de antes tarde do que nunca. Bia acolhe a amiga que começou depois.'],
    ],
    lacuna: { frase: 'Slow and ___ wins the race.', resposta: ['steady'], explica: 'Steady é constante. O conselho valoriza praticar um pouco com regularidade.' },
  },
  {
    id: 'adolescente-brasil-chat', faixa: 'adolescente', nivel: 'A2', tema: 'Chats e jogos', titulo: 'Do grupo dos amigos para o chat em inglês', imagem: '🎮', cultura: ['risadas', 'ja-volto', 'bora', 'tamo-junto'],
    explicacao: 'No chat, a intenção vale mais que traduzir palavra por palavra. Já volto pode virar brb, abreviação de be right back. Lol pode marcar risada. Essas formas combinam com amigos e jogos; por extenso costuma ser mais claro em uma mensagem ao professor.',
    vocab: [{ en: 'brb', pt: 'já volto (abreviação informal)' }, { en: 'lol', pt: 'risada ou reação descontraída em mensagem' }, { en: 'sticker', pt: 'figurinha de mensagem' }, { en: 'you in?', pt: 'você topa? (convite informal)' }],
    texto: 'Mia sends a funny sticker to the group. "Haha, I love it!" Leo replies. They want to play a game at four. "You in?" Mia asks. "Yes! brb, getting some water," Leo writes. Later, Leo sends a message to his teacher: "I will be right back." He uses the full words because the message has a different audience.',
    traducao: 'Mia manda uma figurinha engraçada no grupo. "Haha, adorei!", responde Leo. Eles querem jogar às quatro. "Você topa?", pergunta Mia. "Sim! Já volto, vou pegar água", escreve Leo. Depois, Leo envia uma mensagem ao professor: "Já volto." Ele usa as palavras por extenso porque a mensagem tem outro público.',
    perguntas: [
      ['Leo escreve “brb” no grupo. O que ele quer avisar?', ['Vai se ausentar por um instante e voltar', 'Não quer jogar nunca mais', 'Terminou a tarefa do professor'], 'Brb abrevia be right back, já volto. A mensagem seguinte explica que ele vai pegar água.'],
      ['Por que Leo escreve por extenso ao professor?', ['Para deixar a mensagem clara para outro público', 'Porque abreviações nunca fazem sentido', 'Porque o inglês dos amigos é sempre errado'], 'Amigos podem compartilhar abreviações. Ajustar a forma para quem recebe é uma escolha de contexto, não uma disputa entre inglês certo e errado.'],
    ],
    lacuna: { frase: 'In a chat, be right back can become ___.', resposta: ['brb'], explica: 'Brb = be right back. Com quem não conhece a sigla, escreva a frase por extenso.' },
  },
  {
    id: 'adolescente-brasil-girias', faixa: 'adolescente', nivel: 'B1', tema: 'Gírias e redes sociais', titulo: 'Arrasou, papo reto: o que cabe no comentário?', imagem: '💬', cultura: ['arrasou', 'papo-reto', 'lowkey', 'viralizou'],
    explicacao: 'Gírias circulam entre grupos e mudam com o tempo. No cap pode afirmar sinceridade; slay pode elogiar; lowkey tem sentidos que dependem da frase. Aprender a reconhecer essas formas não obriga você a usá-las. Compare sempre com uma alternativa neutra e observe quem está conversando.',
    vocab: [{ en: 'no cap', pt: 'sem mentira; estou falando sério (gíria)' }, { en: 'slay', pt: 'arrasar, fazer muito bem (gíria)' }, { en: 'lowkey', pt: 'meio que; sem admitir com muito alarde (gíria)' }, { en: 'go viral', pt: 'viralizar' }],
    texto: 'Jo shares a video from a game. A friend writes, "You nailed it!" Another comments, "This is your best video, no cap." Jo understands that the friend means it. Jo replies, "I lowkey love making these videos." The next day, the video goes viral. For a school presentation, Jo uses a different sentence: "I really enjoy making videos." The idea stays similar, but the audience and tone change.',
    traducao: 'Jo compartilha um vídeo de um jogo. Um amigo escreve: "Você arrasou!" Outro comenta: "Este é seu melhor vídeo, sem mentira." Jo entende que o amigo está falando sério. Jo responde: "Eu meio que adoro fazer esses vídeos." No dia seguinte, o vídeo viraliza. Em uma apresentação na escola, Jo usa outra frase: "Gosto muito de fazer vídeos." A ideia continua parecida, mas o público e o tom mudam.',
    perguntas: [
      ['Neste comentário, o que “no cap” faz?', ['Reforça que o amigo está falando sério', 'Explica que Jo perdeu um boné', 'Significa que o vídeo é falso'], 'No cap é uma expressão inteira: neste contexto, equivale a sem mentira ou é sério. Traduzir no e cap separadamente leva ao sentido errado.'],
      ['Qual versão Jo escolhe para a apresentação na escola?', ['I really enjoy making videos.', 'Uma gíria é obrigatória em qualquer público.', 'Uma sequência de siglas sem explicação.'], 'Jo escolhe uma frase neutra e clara. Gírias podem funcionar entre amigos e não funcionar tão bem em outro contexto.'],
    ],
    lacuna: { frase: 'Her video went ___. Many people shared it.', resposta: ['viral'], explica: 'Went viral é viralizou. Go viral muda para went viral quando falamos do passado.' },
  },
  {
    id: 'adulto-brasil-sabores', faixa: 'adulto', nivel: 'A2', tema: 'Cultura brasileira em inglês', titulo: 'Convide o mundo para o nosso churrasco', imagem: '🔥', cultura: ['churrasco', 'bergamota', 'mandioca', 'canjica', 'biscoito'],
    explicacao: 'Apresente a cultura brasileira com um nome e uma descrição. Churrasco pode ser Brazilian barbecue; cookout destaca um encontro ao ar livre nos Estados Unidos. Mandioca, aipim e macaxeira podem ser explicados com cassava. Para bergamota da mesa, mandarin costuma ser útil; bergamot geralmente indica outro cítrico. Nem nomes regionais nem tradições precisam desaparecer na tradução.',
    vocab: [{ en: 'barbecue', pt: 'churrasco; também pode ser o evento ou a churrasqueira' }, { en: 'cookout', pt: 'encontro para cozinhar e comer ao ar livre, sobretudo nos EUA' }, { en: 'mandarin', pt: 'tangerina; também chamada de bergamota ou mexerica' }, { en: 'cassava', pt: 'mandioca, aipim ou macaxeira' }],
    texto: 'I am inviting a friend to a Brazilian barbecue. I explain that we call it churrasco and describe the food my family makes. We also serve cooked cassava. My aunt calls it aipim, and my cousin says macaxeira. For dessert, we have mandarins and a sweet dish made with corn kernels and milk. I tell my friend the Brazilian names and explain our recipes. A familiar English word helps start the conversation; the details tell our story.',
    traducao: 'Vou convidar uma amiga para um churrasco brasileiro. Explico que o chamamos de churrasco e descrevo a comida que minha família faz. Também servimos mandioca cozida. Minha tia a chama de aipim e meu primo diz macaxeira. De sobremesa, temos tangerinas e um doce feito com grãos de milho e leite. Conto os nomes brasileiros à minha amiga e explico nossas receitas. Uma palavra conhecida em inglês ajuda a começar a conversa; os detalhes contam nossa história.',
    perguntas: [
      ['Qual estratégia ajuda a apresentar o churrasco da família?', ['Usar Brazilian barbecue e explicar como a família o prepara', 'Afirmar que todo barbecue no mundo é igual', 'Apagar o nome churrasco da conversa'], 'Brazilian barbecue situa a tradição. Acrescentar o nome churrasco e descrever a sua versão preserva a cultura e ajuda a outra pessoa a entender.'],
      ['Por que o texto descreve o doce de milho?', ['O mesmo nome regional pode indicar receitas diferentes', 'Nenhum prato brasileiro pode ser explicado em inglês', 'Todo doce de milho tem uma tradução única'], 'Ingredientes e preparo esclarecem qual versão da receita você quer dizer. Canjica e mungunzá podem ter usos e receitas diferentes entre lugares.'],
    ],
    lacuna: { frase: 'Where I live, this fruit is called bergamota. In English, I can say ___.', resposta: ['mandarin', 'tangerine'], explica: 'Mandarin ou tangerine ajudam a explicar essa fruta. Bergamot geralmente se refere a outro cítrico, associado ao aroma do Earl Grey.' },
  },
  {
    id: 'adulto-brasil-ditados', faixa: 'adulto', nivel: 'B1', tema: 'Ditados e equivalências', titulo: 'O conselho muda de imagem, não de intenção', imagem: '🌎', cultura: ['passaro', 'grao', 'cao', 'rapadura', 'prevenir'],
    explicacao: 'Um ditado pode ter um equivalente parecido, uma aproximação ou apenas uma boa explicação em inglês. Quem não tem cão caça com gato pode ser explicado com make do with what you have. Rapadura é doce, mas não é mole pode virar good things take effort: uma frase natural de sentido próximo, sem fingir que é um ditado inglês tradicional.',
    vocab: [{ en: 'make do', pt: 'virar-se com os recursos disponíveis' }, { en: 'little by little', pt: 'pouco a pouco' }, { en: 'effort', pt: 'esforço' }, { en: 'resource', pt: 'recurso' }],
    texto: 'We have a small room for our community project, so we make do with what we have. Little by little, people bring books and chairs. A visitor asks about a Brazilian saying involving rapadura. I explain that rapadura is unrefined cane sugar sold in solid blocks. The saying connects something sweet with something difficult. I explain the idea in English: good things take effort. We do not need identical images to share useful advice.',
    traducao: 'Temos uma sala pequena para nosso projeto comunitário, então nos viramos com o que temos. Pouco a pouco, as pessoas trazem livros e cadeiras. Uma visitante pergunta sobre um ditado brasileiro com rapadura. Explico que rapadura é açúcar de cana não refinado vendido em blocos sólidos. O ditado liga algo doce a algo difícil. Explico a ideia em inglês: coisas boas exigem esforço. Não precisamos de imagens idênticas para compartilhar um conselho útil.',
    perguntas: [
      ['O que “make do with what we have” comunica no texto?', ['Aproveitar os recursos disponíveis', 'Esperar por uma sala perfeita sem agir', 'Comprar todos os recursos novos'], 'A frase comunica uma adaptação. É uma forma natural de explicar a ideia de quem não tem cão caça com gato, sem inventar uma tradução literal com animais.'],
      ['“Good things take effort” é apresentado como o quê?', ['Uma explicação em inglês da ideia do ditado com rapadura', 'Um ditado inglês tradicional com a mesma história', 'A tradução do nome do doce'], 'A frase transmite a ideia, mas não é apresentada como um provérbio inglês tradicional. O nome rapadura recebe uma explicação própria.'],
    ],
    lacuna: { frase: 'We are making progress little by ___.', resposta: ['little'], explica: 'Little by little é pouco a pouco. Ajuda a explicar a ideia de avanços pequenos sem precisar traduzir cada palavra de um ditado.' },
  },
  ...require('./biblioteca-brasil-contextos').UNIDADES_CONTEXTOS,
].map(u => ({ ...u, colecao: 'brasil-mundo' }));

module.exports = { UNIDADES_BRASIL };
