// Figurinha do Álbum Brasil: foto redonda de adesivo, nome, estado e uma legenda em inglês que traduz ao toque.
// Não conquistada, vira uma silhueta com o nome. Os dados vêm de GET /figurinhas.
import { h, icone } from './ui.js?v=__V__';

const CAMINHO = '/assets/figurinhas/';

function foto(f) {
  const img = h('img', { class: 'fig__foto', src: CAMINHO + f.arquivo, alt: f.alt, width: 320, height: 320, loading: 'lazy', decoding: 'async' });
  // imagem que não carrega (sem rede, arquivo ausente): o layout não quebra e o texto alternativo continua na tela
  img.addEventListener('error', () => img.replaceWith(h('span', { class: 'fig__foto fig__foto--falhou', role: 'img', 'aria-label': f.alt }, 'Foto indisponível agora')), { once: true });
  return img;
}

export function figurinhaBrasil(f, { conquistada = false } = {}) {
  const raiz = h('article', { class: `fig fig--${f.tom}` + (conquistada ? '' : ' fig--vazia'), dados: { id: f.id } });
  if (!conquistada) {
    raiz.append(
      h('span', { class: 'fig__foto fig__foto--vazia', 'aria-hidden': 'true' }, icone('medal')),
      h('p', { class: 'fig__nome' }, f.nome),
      h('p', { class: 'fig__dica' }, 'Complete a missão para colar esta figurinha.'));
    return raiz;
  }
  let emPt = false;
  const dica = h('span', { class: 'fig__dica', 'aria-live': 'polite' }, 'Toque para traduzir');
  const legenda = h('button', { type: 'button', class: 'fig__leg', lang: 'en', 'aria-pressed': 'false' }, f.legendaEn);
  legenda.addEventListener('click', () => {
    emPt = !emPt;
    legenda.textContent = emPt ? f.legendaPt : f.legendaEn;
    legenda.lang = emPt ? 'pt-BR' : 'en';
    legenda.setAttribute('aria-pressed', String(emPt));
    dica.textContent = emPt ? 'Toque para voltar ao inglês' : 'Toque para traduzir';
  });
  raiz.append(
    foto(f),
    h('p', { class: 'fig__nome' }, f.nome),
    h('span', { class: 'fig__estado' }, f.estado),
    legenda,
    dica);
  return raiz;
}
