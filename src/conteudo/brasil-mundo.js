'use strict';
// Equivalências de função e contexto. As regiões destacam usos, nunca delimitam quem pode falar assim.
const REGIOES = { norte: 'Norte', nordeste: 'Nordeste', 'centro-oeste': 'Centro-Oeste', sudeste: 'Sudeste', sul: 'Sul' };
const CATEGORIAS = { regional: 'Jeitos do Brasil', internet: 'Internet e conversas', ditados: 'Ditados do dia a dia', cotidiano: 'Convivência e cotidiano' };
const revisadoEm = '2026-10-22';
const CONTEXTOS = { familia: 'Família', amigos: 'Amizades', escola: 'Escola', redes: 'Redes e mensagens', jogos: 'Jogos', lazer: 'Lazer', trabalho: 'Trabalho', servicos: 'Compras e serviços', viagem: 'Viagens', comunidade: 'Comunidade' };
const fonte = (titulo, url) => ({ titulo, url });
const cambridge = termo => fonte('Cambridge Dictionary: ' + termo.replaceAll('-', ' '), 'https://dictionary.cambridge.org/dictionary/english/' + termo);
const REGIONAL = fonte('Guia Michelin: nomes regionais de alimentos', 'https://guide.michelin.com/br/pt_BR/article/news-and-views/afinal-qual-e-o-nome');
const GIRIAS = fonte('British Council: gírias e contextos de uso', 'https://englishonline.britishcouncil.org/blog/articles/no-cap-just-facts-your-simple-guide-to-british-slang/');
const CHAT = fonte('Cambridge: abreviações em mensagens', 'https://dictionaryblog.cambridge.org/2016/06/28/cn-u-txt/');
const equivalente = (en, pt, uso, exemplo, traducao) => ({ en, pt, uso, exemplo, traducao });

const EXPRESSOES = [
  {
    id: 'bergamota', categoria: 'regional', titulo: 'Tangerina, bergamota ou mexerica?', nivel: 'A1', regioes: ['sul', 'sudeste', 'centro-oeste'],
    aliases: ['tangerina', 'bergamota', 'vergamota', 'mexerica', 'mimosa', 'poncã', 'ponkan', 'mandarina'],
    resumo: 'Nomes da sua região podem levar à mesma família de frutas em inglês.',
    brasil: 'Bergamota aparece em partes do Sul; mexerica, em partes do Sudeste. Tangerina é amplamente entendida. Os nomes populares também podem se misturar com nomes de variedades.',
    equivalentes: [equivalente('mandarin', 'tangerina; também chamada de bergamota ou mexerica', 'Termo geral útil para esse grupo de cítricos.', 'I have a mandarin in my lunchbox.', 'Tenho uma tangerina na lancheira.'), equivalente('tangerine', 'tangerina', 'Outra palavra comum; a variedade específica pode mudar o nome.', 'Would you like a tangerine?', 'Você quer uma tangerina?')],
    cuidado: 'Bergamot geralmente é outro cítrico, conhecido pelo aroma do chá Earl Grey. Poncã é uma variedade, não um novo nome para toda fruta. Em uma conversa, descreva a fruta se houver dúvida.',
    fontes: [fonte('Embrapa: citros e nomes em inglês', 'https://www.embrapa.br/en/web/mandioca-e-fruticultura/cultivos/citros'), cambridge('bergamot'), cambridge('tangerine')],
  },
  {
    id: 'churrasco', categoria: 'regional', titulo: 'Como explicar nosso churrasco?', nivel: 'A2', regioes: [], aliases: ['churrasco', 'churras', 'churrasqueira', 'churrascada', 'BBQ'],
    resumo: 'Você está falando do preparo, da comida ou do encontro?',
    brasil: 'O churrasco tem muitos estilos no Brasil. Você pode apresentar o nome brasileiro e contar como é o seu, sem precisar igualar todas as tradições.',
    equivalentes: [equivalente('barbecue', 'churrasco; também pode ser o evento ou a churrasqueira', 'Palavra ampla. BBQ é uma abreviação comum.', 'We are having a barbecue on Sunday.', 'Vamos fazer um churrasco no domingo.'), equivalente('Brazilian barbecue', 'churrasco brasileiro', 'Ajuda a situar a tradição. Churrasco também pode ser mantido e explicado.', 'Churrasco is a Brazilian barbecue with food cooked over a fire.', 'Churrasco é um churrasco brasileiro com comida preparada sobre o fogo.'), equivalente('cookout', 'encontro para cozinhar e comer ao ar livre', 'Mais usado nos Estados Unidos para o evento; não descreve sozinho todo estilo de churrasco.', 'Our neighbors invited us to a cookout.', 'Nossos vizinhos nos convidaram para uma reunião com comida ao ar livre.')],
    cuidado: 'Barbecue pode lembrar técnicas e comidas diferentes conforme o lugar. Para a carne, grilled meat pode ajudar; para o aparelho, barbecue grill. Não é preciso chamar toda reunião brasileira de cookout.',
    fontes: [cambridge('barbecue'), cambridge('cookout'), fonte('Oxford: barbecue', 'https://www.oxfordlearnersdictionaries.com/definition/english/barbecue_1')],
  },
  {
    id: 'mandioca', categoria: 'regional', titulo: 'Mandioca, aipim e macaxeira', nivel: 'A1', regioes: ['norte', 'nordeste', 'sudeste'], aliases: ['mandioca', 'aipim', 'macaxeira'],
    resumo: 'Um nome em inglês pode conectar vários nomes brasileiros.',
    brasil: 'Aipim e macaxeira são nomes comuns para a mandioca de mesa em diferentes lugares. Mandioca também é um termo mais amplo para a planta e suas variedades.',
    equivalentes: [equivalente('cassava', 'mandioca, aipim ou macaxeira', 'Nome da raiz em inglês. Conte como ela é servida.', 'We eat cooked cassava with lunch.', 'Comemos mandioca cozida no almoço.')],
    cuidado: 'O nome regional não conta tudo sobre a variedade ou a receita. Tapioca e cassava flour são produtos da mandioca, não sinônimos automáticos da raiz.',
    fontes: [fonte('Embrapa: mandiocas de mesa, macaxeira e aipim', 'https://www.atermaisdigital.cnptia.embrapa.br/web/mandioca/cultivares'), cambridge('cassava')],
  },
  {
    id: 'pao-frances', categoria: 'regional', titulo: 'Pão francês, pão de sal, cacetinho', nivel: 'A1', regioes: ['norte', 'nordeste', 'sudeste', 'sul'], aliases: ['pão francês', 'pão de sal', 'cacetinho', 'careca', 'carioquinha', 'pãozinho'],
    resumo: 'Explique o formato do pão, além do nome que você usa.',
    brasil: 'Pão de sal e cacetinho são alguns dos nomes encontrados pelo Brasil para esse pão de padaria.',
    equivalentes: [equivalente('bread roll', 'pãozinho individual', 'Nome geral. Para explicar o brasileiro, acrescente a textura.', 'This is a small, crusty bread roll.', 'Este é um pãozinho de casca crocante.')],
    cuidado: 'French bread pode fazer alguém pensar em outro pão, como uma baguete. Bread roll descreve o formato; não garante a mesma receita.',
    fontes: [REGIONAL, cambridge('roll')],
  },
  {
    id: 'geladinho', categoria: 'regional', titulo: 'Geladinho, sacolé, dindim, chup-chup', nivel: 'A2', regioes: ['nordeste', 'sudeste', 'centro-oeste'], aliases: ['geladinho', 'sacolé', 'sacole', 'dindim', 'dindin', 'chup-chup', 'laranjinha'],
    resumo: 'Quando não há um nome universal, uma descrição resolve.',
    brasil: 'Esse doce congelado ganha vários nomes. O saquinho é uma boa pista para explicar qual produto você quer dizer.',
    equivalentes: [equivalente('a frozen treat in a plastic tube', 'um doce congelado em um saquinho comprido', 'Descrição compreensível em vários lugares.', 'This frozen treat in a plastic tube is called sacolé where I live.', 'Onde moro, esse doce congelado no saquinho é chamado de sacolé.'), equivalente('freezer pop', 'doce congelado que pode vir em um tubo', 'Nome usado para produtos semelhantes, sobretudo nos Estados Unidos.', 'Would you like a freezer pop?', 'Você quer um geladinho?')],
    cuidado: 'Ice pop é uma categoria mais ampla e pode ter palito. Diga in a plastic tube para explicar o nosso saquinho; as receitas também variam.',
    fontes: [REGIONAL, cambridge('ice-pop')],
  },
  {
    id: 'biscoito', categoria: 'regional', titulo: 'Biscoito ou bolacha? E em inglês?', nivel: 'A2', regioes: ['sudeste', 'sul'], aliases: ['biscoito', 'bolacha', 'cookie', 'biscuit', 'cracker'],
    resumo: 'O inglês também muda conforme o país e o tipo de alimento.',
    brasil: 'Biscoito e bolacha têm usos que variam entre pessoas, regiões e produtos. Observe se o alimento é doce ou salgado.',
    equivalentes: [equivalente('cookie', 'biscoito doce ou bolacha doce', 'Nome comum nos Estados Unidos; em outros lugares pode indicar um tipo específico.', 'I like chocolate cookies.', 'Gosto de biscoitos de chocolate.'), equivalente('biscuit', 'biscoito ou bolacha, especialmente no inglês britânico', 'No Reino Unido pode nomear o biscoito doce; nos Estados Unidos costuma indicar outro tipo de pãozinho.', 'Would you like a biscuit with your tea?', 'Você quer um biscoito com seu chá?'), equivalente('cracker', 'biscoito salgado', 'Ajuda a distinguir de uma bolacha doce.', 'These crackers are salty.', 'Estes biscoitos são salgados.')],
    cuidado: 'Não use uma única palavra para qualquer biscoito. Produto, país e contexto ajudam a escolher.',
    fontes: [cambridge('cookie'), cambridge('biscuit'), cambridge('cracker')],
  },
  {
    id: 'canjica', categoria: 'regional', titulo: 'Canjica, mungunzá ou curau?', nivel: 'B1', regioes: ['nordeste', 'sudeste', 'centro-oeste'], aliases: ['canjica', 'mungunzá', 'mungunza', 'curau', 'mingau de milho'],
    resumo: 'Às vezes o mesmo nome indica pratos diferentes. Pergunte pelos ingredientes.',
    brasil: 'Em alguns lugares, canjica é feita com grãos de milho; em outros, esse nome pode indicar o doce de milho fresco chamado de curau em outra região. Mungunzá também tem receitas diferentes.',
    equivalentes: [equivalente('a sweet dish made with corn kernels and milk', 'um doce feito com grãos de milho e leite', 'Descrição para uma versão doce com grãos.', 'Our canjica is a sweet dish made with corn kernels and milk.', 'Nossa canjica é um doce feito com grãos de milho e leite.'), equivalente('a creamy corn pudding', 'um doce cremoso de milho', 'Descrição útil para explicar o curau; acrescente detalhes da sua receita.', 'This creamy corn pudding is called curau in my town.', 'Na minha cidade, esse doce cremoso de milho se chama curau.')],
    cuidado: 'Canjica não vira automaticamente uma palavra única em inglês. Mantenha o nome, descreva a sua versão e pergunte como a outra pessoa conhece o prato.',
    fontes: [REGIONAL, cambridge('pudding')],
  },
  {
    id: 'jerimum', categoria: 'regional', titulo: 'Abóbora ou jerimum?', nivel: 'A1', regioes: ['norte', 'nordeste', 'sul', 'sudeste', 'centro-oeste'], aliases: ['abóbora', 'abobora', 'jerimum', 'moranga'],
    resumo: 'Use o nome da família e, quando necessário, descreva o tipo.',
    brasil: 'Jerimum é um nome encontrado no Norte e no Nordeste para tipos de abóbora. Moranga também pode indicar um tipo específico.',
    equivalentes: [equivalente('pumpkin', 'abóbora ou jerimum, conforme o tipo', 'Útil para muitas abóboras usadas em pratos.', 'My family makes pumpkin soup.', 'Minha família faz sopa de abóbora.'), equivalente('squash', 'grupo de vegetais que inclui vários tipos de abóbora', 'Pode ser mais adequado conforme a variedade e o país.', 'What kind of squash do you use?', 'Que tipo de abóbora você usa?')],
    cuidado: 'Pumpkin e squash não se dividem exatamente como os nomes brasileiros. Uma foto ou descrição do tipo ajuda.',
    fontes: [REGIONAL, cambridge('pumpkin'), cambridge('squash')],
  },
  {
    id: 'risadas', categoria: 'internet', titulo: 'kkkk, haha, lol', nivel: 'A1', aliases: ['kkkk', 'kkk', 'rsrs', 'risada', 'haha', 'lol'], resumo: 'A risada digitada também tem contexto.',
    brasil: 'No Brasil, kkkk pode marcar uma risada. Em uma conversa internacional, haha ou lol costumam deixar essa intenção mais clara.',
    equivalentes: [equivalente('haha', 'risada escrita', 'Conversa informal por mensagem.', 'Haha, that cat is so funny!', 'Haha, esse gato é muito engraçado!'), equivalente('lol', 'risada ou reação descontraída em mensagem', 'Abreviação de laughing out loud. Também pode suavizar o tom sem uma gargalhada real.', 'I sent the wrong sticker, lol.', 'Mandei a figurinha errada, kkk.')],
    cuidado: 'Evite levar kkk para qualquer conversa internacional: a sigla pode ter outra leitura, especialmente nos Estados Unidos. Em uma mensagem formal, responda com palavras claras.', fontes: [CHAT, cambridge('lol')],
  },
  {
    id: 'ja-volto', categoria: 'internet', titulo: 'Já volto → brb', nivel: 'A1', aliases: ['já volto', 'ja volto', 'brb', 'be right back'], resumo: 'Uma abreviação para avisar uma pausa rápida.',
    brasil: 'Em um chat de jogo ou de amigos, você pode avisar que vai sair por um instante e voltar.',
    equivalentes: [equivalente('brb', 'já volto', 'Forma abreviada para mensagens informais.', 'brb, getting some water.', 'Já volto, vou pegar água.'), equivalente('be right back', 'já volto', 'Versão por extenso, também usada na fala.', 'I will be right back.', 'Já volto.')],
    cuidado: 'Para um professor, cliente ou pessoa que não conhece a sigla, escreva a frase por extenso.', fontes: [CHAT, cambridge('brb')],
  },
  {
    id: 'bora', categoria: 'internet', titulo: 'Bora? Partiu!', nivel: 'A2', aliases: ['bora', 'partiu', 'vambora', 'vamos nessa'], resumo: 'Convide, confirme ou comemore: a intenção muda a frase.',
    brasil: 'Bora pode ser um convite, um pedido para começar ou uma reação animada. Não há uma frase única para todos esses sentidos.',
    equivalentes: [equivalente('you in?', 'você topa?', 'Convite informal para participar.', 'We are playing at four. You in?', 'Vamos jogar às quatro. Você topa?'), equivalente("let's go", 'vamos nessa', 'Chamada para começar ou sair.', "The bus is here. Let's go!", 'O ônibus chegou. Vamos!')],
    cuidado: 'Para convidar de forma neutra, use Would you like to join us? Let’s go nem sempre faz a mesma pergunta que Bora?.', fontes: [cambridge('in'), cambridge('let')],
  },
  {
    id: 'arrasou', categoria: 'internet', titulo: 'Arrasou! Mandou muito!', nivel: 'A2', aliases: ['arrasou', 'mandou bem', 'slay', 'you nailed it', 'amassou'], resumo: 'Elogios podem soar neutros ou bem informais.',
    brasil: 'Você quer elogiar algo que alguém fez muito bem. Escolha uma expressão que combine com a relação entre vocês.',
    equivalentes: [equivalente('you nailed it', 'você mandou muito bem', 'Elogio informal para uma tarefa bem feita.', 'Your presentation was great. You nailed it!', 'Sua apresentação foi ótima. Você arrasou!'), equivalente('slay', 'arrasar, fazer muito bem (gíria)', 'Elogio em alguns grupos, especialmente em comentários e redes. Não é uma palavra obrigatória de adolescente.', 'You slay!', 'Você arrasa!')],
    cuidado: 'Em um retorno mais neutro, diga You did a great job. Slay também tem um sentido literal diferente; observe a situação.', fontes: [GIRIAS, cambridge('slay'), cambridge('nail')],
  },
  {
    id: 'papo-reto', categoria: 'internet', titulo: 'Papo reto, sem caô → no cap?', nivel: 'B1', aliases: ['papo reto', 'sem caô', 'sem cao', 'sem mentira', 'no cap', 'fr', 'for real'], resumo: 'Quando a intenção é dizer “é sério, não estou inventando”.',
    brasil: 'Papo reto pode indicar sinceridade ou conversa direta. No cap só serve para alguns desses usos: afirmar que você fala sério.',
    equivalentes: [equivalente('no cap', 'sem mentira, estou falando sério (gíria)', 'Mensagem muito informal. Tem raízes no inglês afro-americano e circula em outros grupos.', 'This is my favorite game, no cap.', 'Esse é meu jogo favorito, sem mentira.'), equivalente('for real', 'de verdade, é sério', 'Reação ou afirmação informal. Fr pode aparecer como abreviação no chat.', 'That was amazing, for real.', 'Aquilo foi incrível, de verdade.')],
    cuidado: 'Cap sozinho pode ser boné ou ter outros sentidos; a expressão no cap deve ser entendida inteira. Em contexto neutro, use I mean it ou honestly. Nem todo falante usa essa gíria.', fontes: [GIRIAS, fonte('Dictionary.com: sentido e origem de no cap', 'https://www.dictionary.com/culture/slang/no-cap')],
  },
  {
    id: 'lowkey', categoria: 'internet', titulo: 'Lowkey: meio que… ou sem alarde', nivel: 'B1', aliases: ['lowkey', 'low-key', 'meio que', 'discretamente'], resumo: 'O sentido muda com a posição e a intenção.',
    brasil: 'Em alguns posts, lowkey aproxima-se de meio que ou de uma admissão discreta. Em outros contextos, low-key quer dizer discreto ou sem exagero.',
    equivalentes: [equivalente('lowkey', 'meio que; sem admitir com muito alarde (gíria)', 'Uso informal como comentário sobre o que você sente.', 'I lowkey love this song.', 'Eu meio que adoro essa música.'), equivalente('low-key', 'discreto, tranquilo, sem exagero', 'Também aparece fora da gíria de internet.', 'We want a low-key party.', 'Queremos uma festa tranquila, sem muito alarde.')],
    cuidado: 'Lowkey não substitui qualquer “meio que”, “talvez” ou “segredo”. Uma opção neutra para o exemplo é I really like this song.', fontes: [cambridge('low-key')],
  },
  {
    id: 'viralizou', categoria: 'internet', titulo: 'Viralizou! E o post?', nivel: 'A2', aliases: ['viralizou', 'viralizar', 'post', 'feed', 'went viral', 'go viral'], resumo: 'Converse sobre publicações e vídeos que se espalham.',
    brasil: 'Uma publicação pode se espalhar rapidamente entre muitas pessoas. Viralizar não comprova que seu conteúdo é verdadeiro.',
    equivalentes: [equivalente('go viral', 'viralizar', 'Expressão para algo que se espalha muito, sobretudo na internet.', 'Her video went viral.', 'O vídeo dela viralizou.'), equivalente('post', 'publicação; publicar', 'Pode ser substantivo ou verbo.', 'Did you see my new post?', 'Você viu minha nova publicação?')],
    cuidado: 'Went viral fala do passado. Go, goes e went mudam com a frase. Nem tudo que aparece no seu feed viralizou no mundo inteiro.', fontes: [cambridge('viral'), cambridge('post')],
  },
  {
    id: 'tamo-junto', categoria: 'internet', titulo: 'Tamo junto: apoio ou agradecimento?', nivel: 'A2', aliases: ['tamo junto', 'tmj', 'conte comigo', 'valeu'], resumo: 'Traduza a intenção, não a escrita abreviada.',
    brasil: 'Tamo junto pode oferecer apoio, retribuir um agradecimento ou demonstrar parceria. O contexto escolhe o equivalente.',
    equivalentes: [equivalente("I've got your back", 'conte comigo; eu apoio você', 'Quando você oferece apoio a alguém.', "Don't worry. I've got your back.", 'Não se preocupe. Conte comigo.'), equivalente('no problem', 'de nada; sem problema', 'Pode responder a um agradecimento, se essa for a intenção.', 'Thanks for helping! No problem.', 'Obrigado pela ajuda! Tamo junto.')],
    cuidado: 'We are together descreve estar junto e pode sugerir um relacionamento. Não transmite automaticamente o apoio de “tamo junto”.', fontes: [cambridge('have-someone-s-back'), cambridge('no-problem')],
  },
  {
    id: 'devagar', categoria: 'ditados', titulo: 'Devagar se vai longe', nivel: 'A2', aliases: ['devagar se vai longe', 'slow and steady'], resumo: 'O foco é a constância, sem precisar correr.',
    brasil: 'Use para valorizar passos pequenos e regulares.',
    equivalentes: [equivalente('slow and steady wins the race', 'a constância e a calma ajudam a chegar lá', 'Ditado de função parecida.', 'I practice a little every day. Slow and steady wins the race.', 'Pratico um pouco todo dia. Devagar se vai longe.')],
    cuidado: 'A imagem em inglês é uma corrida; o conselho pode ser o mesmo. Para explicar sem ditado, diga Keep making steady progress.', fontes: [fonte('Cambridge: provérbios', 'https://www.cambridge.org/my/files/7513/6681/8957/3832_PROVERBS_TEST.pdf')],
  },
  {
    id: 'tarde', categoria: 'ditados', titulo: 'Antes tarde do que nunca', nivel: 'A2', aliases: ['antes tarde do que nunca', 'better late than never'], resumo: 'Algo aconteceu atrasado, mas ainda valeu a pena.', brasil: 'Pode acolher quem finalmente conseguiu fazer algo; observe o tom para não parecer uma crítica.',
    equivalentes: [equivalente('better late than never', 'antes tarde do que nunca', 'Ditado com sentido muito próximo.', 'I finally read that book. Better late than never!', 'Finalmente li aquele livro. Antes tarde do que nunca!')],
    cuidado: 'Um ditado não substitui um pedido de desculpas quando o atraso prejudicou alguém.', fontes: [cambridge('better-late-than-never')],
  },
  {
    id: 'prevenir', categoria: 'ditados', titulo: 'Melhor prevenir do que remediar', nivel: 'A2', aliases: ['melhor prevenir do que remediar', 'better safe than sorry'], resumo: 'Um cuidado antes pode evitar um problema depois.', brasil: 'Use para explicar um cuidado simples, como conferir o horário antes de sair.',
    equivalentes: [equivalente('better safe than sorry', 'melhor tomar cuidado antes do que se arrepender depois', 'Ditado de função parecida.', 'I checked the address twice. Better safe than sorry.', 'Conferi o endereço duas vezes. Melhor prevenir do que remediar.')],
    cuidado: 'O sentido é a precaução. Remediar não precisa virar uma palavra sobre remédio em inglês.', fontes: [cambridge('better-safe-than-sorry')],
  },
  {
    id: 'passaro', categoria: 'ditados', titulo: 'Mais vale um pássaro na mão…', nivel: 'B1', aliases: ['mais vale um pássaro na mão', 'dois voando', 'bird in the hand'], resumo: 'Compare uma certeza com uma possibilidade arriscada.', brasil: 'O ditado valoriza algo que você já tem diante de uma promessa incerta.',
    equivalentes: [equivalente('a bird in the hand is worth two in the bush', 'mais vale uma certeza do que duas possibilidades incertas', 'Ditado com imagem parecida: os outros pássaros estão no arbusto.', 'I kept my ticket instead of risking it. A bird in the hand is worth two in the bush.', 'Fiquei com meu ingresso em vez de arriscá-lo. Mais vale um pássaro na mão do que dois voando.')],
    cuidado: 'Em inglês, os outros pássaros estão in the bush. Traduzir “dois voando” palavra por palavra muda a forma consagrada do ditado.', fontes: [cambridge('a-bird-in-the-hand-is-worth-two-in-the-bush')],
  },
  {
    id: 'grao', categoria: 'ditados', titulo: 'De grão em grão, a galinha enche o papo', nivel: 'B1', aliases: ['de grão em grão', 'grao em grao', 'every little helps'], resumo: 'Pequenas contribuições também contam.', brasil: 'Pouco a pouco, pequenas quantidades podem se somar.',
    equivalentes: [equivalente('every little helps', 'cada pequena contribuição ajuda', 'Expressão sobretudo britânica com função parecida.', 'We saved a little each week. Every little helps.', 'Economizamos um pouco por semana. Cada pequena contribuição ajuda.'), equivalente('little by little', 'pouco a pouco', 'Alternativa curta e compreensível, sem reproduzir o ditado.', 'Little by little, I am learning.', 'Pouco a pouco, estou aprendendo.')],
    cuidado: 'A equivalência é aproximada: every little helps destaca a contribuição; o ditado brasileiro destaca também o acúmulo. A galinha não precisa aparecer na versão em inglês.', fontes: [cambridge('every-little-helps'), cambridge('little-by-little')],
  },
  {
    id: 'cao', categoria: 'ditados', titulo: 'Quem não tem cão caça com gato', nivel: 'B1', aliases: ['quem não tem cão caça com gato', 'quem nao tem cao', 'make do'], resumo: 'Improvise com os recursos disponíveis.', brasil: 'A intenção é adaptar-se quando o recurso ideal não está disponível.',
    equivalentes: [equivalente('make do with what you have', 'virar-se com o que você tem', 'Frase que transmite a ideia; não é a mesma imagem nem uma tradução literal.', "We don't have a big table, so we will make do with what we have.", 'Não temos uma mesa grande, então vamos nos virar com o que temos.')],
    cuidado: 'Não há necessidade de inventar um ditado inglês com cão e gato. Explique a ideia com uma frase natural.', fontes: [cambridge('make-do')],
  },
  {
    id: 'rapadura', categoria: 'ditados', titulo: 'Rapadura é doce, mas não é mole', nivel: 'B1', regioes: ['nordeste'], aliases: ['rapadura é doce mas não é mole', 'rapadura', 'good things take effort'], resumo: 'Leve o ditado e a comida brasileira para a conversa.', brasil: 'Um ditado conhecido em diferentes lugares, com forte associação cultural à rapadura: algo bom pode exigir esforço.',
    equivalentes: [equivalente('good things take effort', 'coisas boas exigem esforço', 'Explicação natural da ideia; não é apresentada como um ditado tradicional inglês.', 'Learning a language is rewarding, but good things take effort.', 'Aprender um idioma é gratificante, mas coisas boas exigem esforço.')],
    cuidado: 'Você pode contar o ditado brasileiro e explicar que rapadura é unrefined cane sugar sold in solid blocks. Traduzir a imagem sem essa explicação pode confundir.', fontes: [fonte('Embrapa: rapadura e açúcares artesanais', 'https://www.embrapa.br/en/web/agencia-de-informacao-tecnologica/cultivos/cana-de-acucar/pos-producao/acucares_artesanais')],
  },
  {
    id: 'aparencia', categoria: 'ditados', titulo: 'Quem vê cara não vê coração', nivel: 'B1', aliases: ['quem vê cara não vê coração', 'quem ve cara', 'julgar pela aparência'], resumo: 'A aparência não conta a história inteira.', brasil: 'O conselho é conhecer melhor alguém antes de formar um julgamento.',
    equivalentes: [equivalente("don't judge a book by its cover", 'não julgue pela aparência', 'Ditado que usa a imagem da capa de um livro.', "He looks serious, but he is kind. Don't judge a book by its cover.", 'Ele parece sério, mas é gentil. Não julgue pela aparência.')],
    cuidado: 'A imagem muda, mas o conselho é próximo. Não é necessário traduzir cara e coração palavra por palavra.', fontes: [cambridge('you-can-t-judge-a-book-by-its-cover')],
  },
  ...require('./brasil-expressoes').NOVAS_EXPRESSOES,
].map(e => ({ regioes: [], contextos: e.categoria === 'internet' ? ['amigos', 'redes', 'jogos'] : e.categoria === 'ditados' ? ['familia', 'escola', 'amigos'] : ['familia', 'servicos'], registro: e.categoria === 'internet' ? 'Informal: mensagens e amigos' : e.categoria === 'ditados' ? 'Conversa: escolha o momento' : 'Cotidiano: descreva o contexto', ...e,
  // Crianças têm contato com vocabulário e ditados concretos; a seção de redes é para adolescentes e adultos.
  faixas: e.faixas || (e.categoria === 'internet' ? ['adolescente', 'adulto'] : ['crianca', 'adolescente', 'adulto']), revisadoEm }));

const POR_EXPRESSAO = Object.fromEntries(EXPRESSOES.map(e => [e.id, e]));
const dicionarioCultural = () => Object.fromEntries(EXPRESSOES.flatMap(e => e.equivalentes.map(v => [v.en, v.pt])));
module.exports = { REGIOES, CATEGORIAS, CONTEXTOS, EXPRESSOES, POR_EXPRESSAO, dicionarioCultural, revisadoEm };
