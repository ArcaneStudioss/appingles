// Tradução ao toque, local e sem enviar o texto da criança a um serviço externo.
// Palavras com mais de um sentido mostram também a tradução da frase, quando disponível.
const PALAVRAS = {
  a: 'um ou uma', an: 'um ou uma', the: 'o, a, os ou as', and: 'e', or: 'ou', but: 'mas',
  i: 'eu', you: 'você ou vocês', he: 'ele', she: 'ela', it: 'ele ou ela (coisa ou animal)',
  we: 'nós', they: 'eles ou elas', me: 'me ou mim', us: 'nos ou nós', them: 'eles ou elas',
  my: 'meu ou minha', your: 'seu ou sua', his: 'dele', her: 'dela', our: 'nosso ou nossa', their: 'deles ou delas',
  am: 'sou ou estou (com I)', is: 'é ou está', are: 'é, está, somos ou estamos, conforme a pessoa',
  be: 'ser ou estar', was: 'era ou estava', were: 'eram ou estavam', been: 'sido ou estado', being: 'sendo ou estando',
  "i'm": 'eu sou ou eu estou', "you're": 'você é ou você está', "he's": 'ele é ou ele está',
  "she's": 'ela é ou ela está', "it's": 'é ou está (uma coisa ou um animal)', "we're": 'nós somos ou estamos', "they're": 'eles são ou estão',
  "i've": 'eu tenho; forma curta de I have', "i'll": 'eu vou; forma curta de I will', "i'd": 'eu iria ou eu tinha, conforme a frase',
  "don't": 'não (antes de uma ação)', "doesn't": 'não (com he, she ou it)', "didn't": 'não (no passado)',
  "isn't": 'não é ou não está', "aren't": 'não é, não está ou não estão', "can't": 'não consigo ou não pode',
  "won't": 'não vai', "that's": 'isso é', "what's": 'o que é ou qual é', "there's": 'há ou tem',
  hello: 'olá', hi: 'oi', hey: 'oi', bye: 'tchau', goodbye: 'adeus ou tchau',
  thank: 'agradecer; em Thank you: obrigado ou obrigada', thanks: 'obrigado ou obrigada',
  please: 'por favor', sorry: 'desculpe', welcome: 'bem-vindo; em You are welcome: de nada',
  good: 'bom ou boa', morning: 'manhã; em Good morning: bom dia', afternoon: 'tarde', evening: 'começo da noite', night: 'noite',
  yes: 'sim', no: 'não', not: 'não', very: 'muito', much: 'muito', well: 'bem', fine: 'bem', great: 'ótimo',
  how: 'como; em How old: quantos anos', what: 'o que ou qual', who: 'quem', where: 'onde', when: 'quando', why: 'por quê', which: 'qual',
  this: 'este, esta ou isto', that: 'aquele, aquela ou aquilo', these: 'estes ou estas', those: 'aqueles ou aquelas',
  here: 'aqui', there: 'lá; em There is: há ou tem', from: 'de (origem)', to: 'para ou a', for: 'para ou por',
  in: 'em ou dentro de', on: 'em ou sobre', at: 'em ou às', of: 'de', with: 'com', without: 'sem', about: 'sobre; em What about you: e você',
  up: 'para cima; em Wake up: acordar', down: 'para baixo', out: 'fora', into: 'para dentro de', between: 'entre',
  can: 'poder ou conseguir', could: 'poderia', would: 'indica uma ação como gostaria ou faria', should: 'deveria', will: 'vai (futuro)', must: 'deve ou precisa',
  have: 'ter', has: 'tem', had: 'tinha ou teve', do: 'fazer; também ajuda a formar perguntas', does: 'faz; também ajuda a formar perguntas', did: 'fez; também ajuda a perguntar no passado',
  name: 'nome', first: 'primeiro', last: 'último', nice: 'legal; em Nice to meet you: prazer em conhecer você', meet: 'conhecer ou encontrar',
  city: 'cidade', country: 'país', brazil: 'Brasil', brazilian: 'brasileiro ou brasileira', english: 'inglês', portuguese: 'português',
  london: 'Londres', paris: 'Paris', canada: 'Canadá', american: 'americano ou americana',
  one: 'um', two: 'dois', three: 'três', four: 'quatro', five: 'cinco', six: 'seis', seven: 'sete', eight: 'oito', nine: 'nove', ten: 'dez',
  zero: 'zero', eleven: 'onze', twelve: 'doze', thirteen: 'treze', fourteen: 'quatorze', fifteen: 'quinze', sixteen: 'dezesseis',
  seventeen: 'dezessete', eighteen: 'dezoito', nineteen: 'dezenove', twenty: 'vinte', thirty: 'trinta', forty: 'quarenta', fifty: 'cinquenta', hundred: 'cem',
  old: 'velho; em Years old: anos de idade', year: 'ano', years: 'anos', age: 'idade', number: 'número', phone: 'telefone',
  happy: 'feliz', sad: 'triste', tired: 'cansado ou cansada', hungry: 'com fome', thirsty: 'com sede',
  family: 'família', mother: 'mãe', father: 'pai', mom: 'mamãe', dad: 'papai', brother: 'irmão', sister: 'irmã',
  friend: 'amigo ou amiga', friends: 'amigos ou amigas', child: 'criança', children: 'crianças', boy: 'menino', girl: 'menina',
  people: 'pessoas', person: 'pessoa', teacher: 'professor ou professora', student: 'estudante', school: 'escola',
  house: 'casa', home: 'casa ou lar', room: 'cômodo ou quarto', bedroom: 'quarto', bathroom: 'banheiro', kitchen: 'cozinha', garden: 'jardim',
  table: 'mesa', chair: 'cadeira', chairs: 'cadeiras', bed: 'cama', door: 'porta', window: 'janela', book: 'livro', books: 'livros',
  blue: 'azul', red: 'vermelho', yellow: 'amarelo', green: 'verde', black: 'preto', white: 'branco', pink: 'rosa', orange: 'laranja', color: 'cor',
  small: 'pequeno ou pequena', big: 'grande', large: 'grande', new: 'novo ou nova', beautiful: 'bonito ou bonita',
  day: 'dia', days: 'dias', today: 'hoje', tomorrow: 'amanhã', yesterday: 'ontem', now: 'agora', later: 'depois ou mais tarde',
  week: 'semana', weekend: 'fim de semana', month: 'mês', months: 'meses', time: 'tempo ou hora', hour: 'hora', minutes: 'minutos',
  monday: 'segunda-feira', tuesday: 'terça-feira', wednesday: 'quarta-feira', thursday: 'quinta-feira', friday: 'sexta-feira', saturday: 'sábado', sunday: 'domingo',
  every: 'todo ou cada', always: 'sempre', sometimes: 'às vezes', never: 'nunca', again: 'de novo', soon: 'em breve',
  like: 'gostar; também pode significar como', love: 'amar ou adorar', hate: 'odiar ou detestar', want: 'querer', need: 'precisar',
  play: 'brincar ou jogar', playing: 'brincando ou jogando', game: 'jogo', games: 'jogos', toy: 'brinquedo', toys: 'brinquedos',
  dog: 'cachorro', cat: 'gato', bird: 'pássaro', fish: 'peixe', animal: 'animal', pet: 'animal de estimação',
  eat: 'comer', drink: 'beber; também pode ser bebida', food: 'comida', water: 'água', milk: 'leite', juice: 'suco',
  bread: 'pão', rice: 'arroz', beans: 'feijão', chicken: 'frango', fruit: 'fruta', apple: 'maçã', banana: 'banana',
  pizza: 'pizza', pasta: 'macarrão ou massa', coffee: 'café', tea: 'chá', menu: 'cardápio', bill: 'conta', price: 'preço',
  breakfast: 'café da manhã', lunch: 'almoço', dinner: 'jantar', delicious: 'delicioso ou deliciosa',
  go: 'ir', goes: 'vai', going: 'indo; em Going to: vai fazer algo', went: 'foi', come: 'vir', comes: 'vem',
  see: 'ver; em See you: até logo', look: 'olhar', listen: 'ouvir com atenção', hear: 'ouvir', speak: 'falar', say: 'dizer',
  read: 'ler', write: 'escrever', repeat: 'repetir', spell: 'soletrar', letter: 'letra', alphabet: 'alfabeto', sound: 'som',
  learn: 'aprender', learning: 'aprendendo', study: 'estudar', studying: 'estudando', understand: 'entender', know: 'saber ou conhecer',
  help: 'ajudar ou ajuda', ask: 'perguntar ou pedir', answer: 'responder ou resposta', question: 'pergunta', tell: 'contar ou dizer',
  live: 'morar ou viver', lives: 'mora ou vive', wake: 'acordar (com up)', sleep: 'dormir', get: 'pegar, obter ou ficar, conforme a frase',
  work: 'trabalhar ou trabalho', works: 'trabalha ou funciona', working: 'trabalhando', job: 'emprego', company: 'empresa', team: 'equipe',
  music: 'música', football: 'futebol', soccer: 'futebol', movie: 'filme', movies: 'filmes', sport: 'esporte', sports: 'esportes',
  rain: 'chuva', sun: 'sol', weather: 'tempo ou clima', park: 'parque', beach: 'praia', party: 'festa', birthday: 'aniversário',
  street: 'rua', left: 'esquerda; também pode ser saiu', right: 'direita ou certo', straight: 'em frente', turn: 'virar', near: 'perto', far: 'longe',
  station: 'estação', bus: 'ônibus', train: 'trem', car: 'carro', airport: 'aeroporto', hotel: 'hotel', bank: 'banco', store: 'loja',
  supermarket: 'supermercado', hospital: 'hospital', pharmacy: 'farmácia', restaurant: 'restaurante', excuse: 'desculpar; em Excuse me: com licença',
  buy: 'comprar', pay: 'pagar', money: 'dinheiro', ticket: 'passagem ou ingresso', open: 'abrir ou aberto', close: 'fechar',
  start: 'começar', finish: 'terminar', stop: 'parar', wait: 'esperar', take: 'pegar ou levar', give: 'dar', make: 'fazer',
  also: 'também', too: 'também ou demais', more: 'mais', some: 'algum ou um pouco', all: 'todos ou tudo',
  together: 'juntos', because: 'porque', then: 'então ou depois', after: 'depois', before: 'antes',
  nurse: 'enfermeiro ou enfermeira', doctor: 'médico ou médica', developer: 'desenvolvedor ou desenvolvedora',
};

let balao = null, palavraAberta = null;
export function fraseConhecida(texto) {
  const palavras = texto.toLowerCase().replaceAll('’', "'").match(/[a-z]+(?:'[a-z]+)*/g) || [];
  return palavras.length > 0 && palavras.every(p => Object.hasOwn(PALAVRAS, p));
}
function fechar() {
  if (!balao) return;
  balao.remove(); balao = null;
  palavraAberta?.setAttribute('aria-expanded', 'false');
  palavraAberta?.removeAttribute('aria-describedby'); palavraAberta = null;
}

function abrir(botao, palavra, frasePt) {
  if (palavraAberta === botao) { fechar(); return; }
  fechar();
  palavraAberta = botao;
  botao.setAttribute('aria-expanded', 'true');
  botao.setAttribute('aria-describedby', 'traducao-da-palavra');
  botao.dispatchEvent(new CustomEvent('inglou:traducao', { bubbles: true }));
  const chave = palavra.toLowerCase().replaceAll('’', "'");
  const contexto = botao.closest('[data-traducao]');
  const palavraUnica = contexto?.textContent.trim().replace(/[.!?]/g, '').toLowerCase() === chave;
  const traducao = palavraUnica && frasePt ? frasePt : PALAVRAS[chave] || (chave.endsWith('s') && PALAVRAS[chave.slice(0, -1)] ? PALAVRAS[chave.slice(0, -1)] + ' (forma de ' + chave.slice(0, -1) + ')' : null);
  balao = document.createElement('span');
  balao.id = 'traducao-da-palavra'; balao.className = 'traducao-balao'; balao.setAttribute('role', 'tooltip');
  const titulo = document.createElement('strong'); titulo.lang = 'en'; titulo.textContent = palavra;
  const significado = document.createElement('span'); significado.textContent = traducao || (frasePt ? 'Veja o sentido na frase abaixo.' : 'Ainda não tenho uma tradução para esta palavra. Nomes de pessoas não precisam de tradução.');
  balao.append(titulo, significado);
  if (frasePt && !palavraUnica) { const frase = document.createElement('small'); frase.textContent = 'No contexto: ' + (frasePt.length > 180 ? frasePt.slice(0, 177) + '...' : frasePt); balao.append(frase); }
  (botao.closest('dialog[open]') || document.body).append(balao);
  const r = botao.getBoundingClientRect(), b = balao.getBoundingClientRect();
  const esquerda = Math.max(12, Math.min(innerWidth - b.width - 12, r.left + r.width / 2 - b.width / 2));
  const acima = r.top - b.height - 12 >= 8;
  balao.style.left = esquerda + 'px';
  balao.style.top = (acima ? r.top - b.height - 12 : r.bottom + 12) + 'px';
  balao.style.setProperty('--seta', Math.max(16, Math.min(b.width - 16, r.left + r.width / 2 - esquerda)) + 'px');
  balao.dataset.lado = acima ? 'acima' : 'abaixo';
}

function preparar(alvo) {
  const ingles = [...(alvo.matches?.('[lang="en"]') ? [alvo] : []), ...alvo.querySelectorAll('[lang="en"]')];
  for (const el of ingles) {
    // Os controles de resposta conservam o toque para escolher, encaixar ou ouvir.
    if (el.closest('button,a,input,textarea,svg,[contenteditable],.palavra-traduzivel,.traducao-balao')) continue;
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, { acceptNode: n => n.parentElement.closest('button,a,input,textarea,svg,.palavra-traduzivel,.traducao-balao') || n.parentElement.closest('[lang]')?.lang !== 'en' ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
    const textos = []; while (walker.nextNode()) textos.push(walker.currentNode);
    for (const no of textos) {
      if (!/[A-Za-z]/.test(no.textContent)) continue;
      const frasePt = no.parentElement.closest('[data-traducao]')?.dataset.traducao;
      const frag = document.createDocumentFragment();
      for (const trecho of no.textContent.split(/([A-Za-zÀ-ÿ]+(?:['’][A-Za-zÀ-ÿ]+)*)/)) {
        if (!/^[A-Za-zÀ-ÿ]+(?:['’][A-Za-zÀ-ÿ]+)*$/.test(trecho)) { frag.append(document.createTextNode(trecho)); continue; }
        const botao = document.createElement('button');
        botao.type = 'button'; botao.className = 'palavra-traduzivel'; botao.textContent = trecho;
        botao.setAttribute('aria-label', 'Ver tradução de ' + trecho); botao.setAttribute('aria-expanded', 'false');
        botao.addEventListener('click', e => { e.stopPropagation(); abrir(botao, trecho, frasePt); });
        frag.append(botao);
      }
      no.replaceWith(frag);
    }
  }
}

export function iniciarTraducoes() {
  fetch('/api/v1/dicionario').then(r => r.ok ? r.json() : null).then(d => { if (d?.palavras) Object.assign(PALAVRAS, d.palavras); }).catch(() => {});
  preparar(document.body);
  let agendado = false;
  new MutationObserver(mudancas => {
    if (palavraAberta && !palavraAberta.isConnected) fechar();
    if (agendado || !mudancas.some(m => [...m.addedNodes].some(n => n.nodeType === 1 && !n.closest('.traducao-balao,.palavra-traduzivel')))) return;
    agendado = true;
    requestAnimationFrame(() => { agendado = false; preparar(document.body); });
  }).observe(document.body, { childList: true, subtree: true });
  document.addEventListener('click', e => { if (!e.target.closest('.palavra-traduzivel,.traducao-balao')) fechar(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && balao) { const b = palavraAberta; fechar(); b?.focus({ preventScroll: true }); e.preventDefault(); e.stopPropagation(); } });
  document.addEventListener('scroll', fechar, { capture: true, passive: true });
  addEventListener('resize', fechar);
}
