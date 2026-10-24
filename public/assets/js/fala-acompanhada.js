// Alinha o texto reconhecido à frase lida. Isto é só acompanhamento visual, não correção de pronúncia.
const CONTRACOES = {
  "i'm": 'i am', "you're": 'you are', "we're": 'we are', "they're": 'they are',
  "he's": 'he is', "she's": 'she is', "it's": 'it is', "that's": 'that is',
  "i've": 'i have', "you've": 'you have', "we've": 'we have', "they've": 'they have',
  "i'll": 'i will', "you'll": 'you will', "we'll": 'we will', "they'll": 'they will',
  "don't": 'do not', "doesn't": 'does not', "didn't": 'did not', "can't": 'can not', cannot: 'can not',
  "isn't": 'is not', "aren't": 'are not', "wasn't": 'was not', "weren't": 'were not',
  "won't": 'will not', "haven't": 'have not', "hasn't": 'has not', "let's": 'let us',
};
const partes = texto => String(texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[’‘]/g, "'").match(/[a-z0-9]+(?:'[a-z]+)*/g) || [];
const expandir = palavra => partes(palavra).flatMap(p => (CONTRACOES[p] || p).split(' '));

export function indicesReconhecidos(palavras, transcricao) {
  const alvo = [], donos = [], totais = new Map();
  palavras.slice(0, 256).forEach((p, i) => {
    const unidades = expandir(p); totais.set(i, unidades.length);
    for (const u of unidades) { alvo.push(u); donos.push(i); }
  });
  const ouvido = partes(transcricao).slice(0, 512).flatMap(p => (CONTRACOES[p] || p).split(' '));
  const n = alvo.length, m = ouvido.length;
  const tabela = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) {
    tabela[i][j] = alvo[i] === ouvido[j] ? 1 + tabela[i + 1][j + 1] : Math.max(tabela[i + 1][j], tabela[i][j + 1]);
  }
  const acertos = new Map();
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (alvo[i] === ouvido[j]) { acertos.set(donos[i], (acertos.get(donos[i]) || 0) + 1); i++; j++; }
    else if (tabela[i + 1][j] >= tabela[i][j + 1]) i++;
    else j++;
  }
  // Uma palavra repetida não acende todas as ocorrências; contrações precisam estar completas.
  return [...acertos].filter(([k, v]) => v === totais.get(k)).map(([k]) => k);
}

export function destacarReconhecidas(elemento, transcricao) {
  const palavras = [...elemento.querySelectorAll('.palavra-toque')];
  const reconhecidas = new Set(indicesReconhecidos(palavras.map(p => p.textContent), transcricao));
  palavras.forEach((p, i) => p.classList.toggle('fala-reconhecida', reconhecidas.has(i)));
  return { reconhecidas: reconhecidas.size, total: palavras.length };
}
