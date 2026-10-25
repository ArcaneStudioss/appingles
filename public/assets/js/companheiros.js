// Mia explica; Tuiuiú pratica junto. As reações acompanham a atividade e nunca alteram a nota.
import { h, icone, falarPt, pararVoz } from './ui.js?v=__V__';
import { lou, louVoando } from './diversao.js?v=__V__';

const GUIAS = {
  escolha: 'Compare as opções e escolha a que combina com o pedido.',
  leitura: 'Procure no texto a pista para responder. Toque numa palavra para consultar o significado.',
  escuta: 'Ouça a frase. Você pode repetir e mudar a velocidade antes de responder.',
  ditado: 'Ouça com calma e escreva o que entendeu. Depois vamos conferir juntos.',
  lacuna: 'Leia a frase inteira e escolha a palavra que completa a ideia.',
  ordenar: 'Toque nas palavras para montar a frase. Toque de novo para devolver uma peça.',
  pares: 'Encontre as duplas: uma palavra em inglês e seu significado em português.',
  fala: 'Escute o exemplo e fale no seu ritmo. Se o microfone entender errado, você pode repetir.',
  traduzir: 'Pense no sentido da frase e escreva como você diria isso em inglês.',
  corrigir: 'Encontre o que precisa mudar e reescreva a frase em inglês.',
  detetive: 'Leia a frase e toque na palavra que precisa de um ajuste.',
};
const NOMES = { mia: 'Mia', tuiuiu: 'Tuiuiú' };

// Um único listener atende os componentes conectados, sem acumular listeners a cada questão.
let companhiaFalante;
document.addEventListener('click', e => {
  if (!e.target.closest('button')) return;
  companhiaFalante = e.target.closest('.companheiros') || e.target.closest('.exercicio')?.querySelector('.companheiros');
}, true);
addEventListener('hashchange', () => { companhiaFalante = null; });
addEventListener('inglou:voz', ({ detail: d }) => {
  for (const ator of document.querySelectorAll('.dupla__ator')) ator.classList.toggle('esta-falando', d?.fase === 'falando' && companhiaFalante?.isConnected && companhiaFalante.contains(ator) && ator.dataset.personagem === d.personagem);
  if (d?.fase === 'parado') for (const b of document.querySelectorAll('.companheiros__ouvir')) b.setAttribute('aria-pressed', 'false');
});

export function duplaPersonagens({ acao = 'inicio', silencioso = false } = {}) {
  const alegre = ['acerto', 'superacao', 'combo', 'fim'].includes(acao), festa = ['combo', 'fim'].includes(acao);
  const dupla = h('div', { class: 'dupla' + (silencioso ? ' dupla--silenciosa' : ''), dados: { acao }, 'aria-hidden': 'true' });
  const humor = festa ? 'festa' : alegre ? 'feliz' : acao === 'apoio' || acao === 'dica' ? 'pensando' : 'oi';
  dupla.append(h('div', { class: 'dupla__ator dupla__ator--mia', dados: { personagem: 'mia' } }, lou(humor, { mia: true, tamanho: 132, rotulo: '' })));
  dupla.append(h('div', { class: 'dupla__ator dupla__ator--tuiuiu', dados: { personagem: 'tuiuiu' } },
    h('span', { class: 'dupla__pousado' }, lou(humor, { tamanho: 96, rotulo: '' })),
    h('span', { class: 'dupla__voador' }, louVoando())));
  if (festa || acao === 'superacao') dupla.append(h('span', { class: 'dupla__notas' }, '♪ ♫ ✦'));

  return dupla;
}

export function companheirosAula({ fase = 'inicio', tipo, texto, silencioso = false } = {}) {
  const publico = document.body.dataset.publico || 'adulto';
  const infantil = publico === 'crianca', adolescente = publico === 'adolescente';
  let fala;
  const figuras = h('div', { class: 'companheiros__figuras' });
  const nome = h('strong', { class: 'companheiros__nome' });
  const mensagem = h('p', { class: 'companheiros__mensagem' });
  const ouvir = h('button', { type: 'button', class: 'btn btn-texto btn-peq companheiros__ouvir', 'aria-pressed': 'false', on: { click: () => {
    if (ouvir.getAttribute('aria-pressed') === 'true') { pararVoz(); return; }
    if (falarPt(fala.texto, () => ouvir.setAttribute('aria-pressed', 'false'), { personagem: fala.quem, emocao: fala.tom })) ouvir.setAttribute('aria-pressed', 'true');
  } } });
  const elemento = h('section', { class: 'companheiros', 'aria-label': 'Mia e Tuiuiú acompanham esta atividade' }, figuras,
    h('div', { class: 'companheiros__balao' }, nome, mensagem, ouvir));

  function reagir(proximaFase, { texto: proximoTexto, silencioso: quieto = false } = {}) {
    if (ouvir.getAttribute('aria-pressed') === 'true') pararVoz();
    const roteiros = {
      inicio: { quem: 'mia', acao: 'inicio', tom: 'acolhedor', texto: GUIAS[tipo] || 'Vamos por partes. Leia o exemplo e pratique no seu ritmo.' },
      dica: { quem: 'mia', acao: 'dica', tom: 'curioso', texto: 'Uma pista pode ajudar. Compare a dica com o exemplo e tente de novo.' },
      acerto: { quem: 'tuiuiu', acao: 'acerto', tom: 'feliz', texto: infantil ? 'Toca aqui! Você conseguiu! Vamos ver por que essa é a resposta?' : adolescente ? 'Boa! Toca aqui! Confere a explicação para levar essa ideia para a próxima.' : 'Boa resposta! Veja a explicação para usar essa expressão em outras situações.' },
      superacao: { quem: 'mia', acao: 'superacao', tom: 'feliz', texto: infantil ? 'Olha só, você tentou de novo e conseguiu! Palmas para você!' : 'Você reviu a explicação e conseguiu nesta tentativa. Esse avanço conta!' },
      combo: { quem: 'tuiuiu', acao: 'combo', tom: infantil ? 'animado' : 'feliz', texto: 'Acertos em sequência! A Mia e o Tuiuiú comemoram com você. Confira a explicação antes de continuar.' },
      apoio: { quem: 'mia', acao: 'apoio', tom: 'acolhedor', texto: infantil ? 'Tudo bem! Eu e o Tuiuiú vamos ajudar. Vamos olhar a resposta e entender juntos?' : adolescente ? 'Essa ainda não encaixou. Vamos entender a resposta e tentar por outro caminho.' : 'Vamos entender o que mudou. Compare sua resposta com o exemplo e consulte a explicação.' },
      quase: { quem: 'mia', acao: 'apoio', tom: 'acolhedor', texto: 'Você acertou a ideia. Vamos conferir juntos o pequeno ajuste mostrado na explicação.' },
      aprender: { quem: 'mia', acao: 'dica', tom: 'acolhedor', texto: 'Vamos estudar a resposta primeiro. Depois você pode tentar com mais segurança.' },
      tentar: { quem: 'tuiuiu', acao: 'inicio', tom: 'acolhedor', texto: infantil ? 'Bora tentar de novo? Eu estou com você!' : 'Mais uma tentativa, no seu ritmo. Use o que acabou de aprender.' },
      pausa: { quem: 'mia', acao: 'apoio', tom: 'acolhedor', texto: 'Tudo bem pausar esta atividade. Você pode continuar com as outras e voltar depois.' },
      fim: { quem: 'mia', acao: 'fim', tom: infantil ? 'animado' : 'feliz', texto: infantil ? 'Missão cumprida! Eu e o Tuiuiú estamos comemorando com você!' : adolescente ? 'Fechou mais uma etapa! A Mia e o Tuiuiú comemoram esse avanço com você.' : 'Mais uma etapa praticada. Bom trabalho! Retome as explicações sempre que precisar.' },
    };
    fala = { ...(roteiros[proximaFase] || roteiros.inicio) };
    if (proximoTexto) fala.texto = proximoTexto;
    elemento.dataset.fase = proximaFase;
    figuras.replaceChildren(duplaPersonagens({ acao: fala.acao, silencioso: quieto }));
    nome.textContent = NOMES[fala.quem]; mensagem.textContent = fala.texto;
    ouvir.replaceChildren(icone('speaker-high'), 'Ouvir ' + NOMES[fala.quem]);
    ouvir.setAttribute('aria-label', 'Ouvir ' + NOMES[fala.quem] + ' ler esta mensagem');
    ouvir.setAttribute('aria-pressed', 'false');
  }
  reagir(fase, { texto, silencioso });
  return { elemento, reagir };
}
