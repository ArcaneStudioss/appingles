// Inglou · casca do app: rotas por hash, estado do aluno e navegação.
import { api } from './api.js?v=__V__';
import { h, limpar, toast, localStorageGet, localStorageSet } from './ui.js?v=__V__';
import { som, lou } from './diversao.js?v=__V__';
import { telaEntrar } from './telas/entrar.js?v=__V__';
import { telaPerfil } from './telas/perfil.js?v=__V__';
import { telaNivelamento } from './telas/nivelamento.js?v=__V__';
import { telaHoje } from './telas/hoje.js?v=__V__';
import { telaPlano } from './telas/plano.js?v=__V__';
import { telaLicao } from './telas/licao.js?v=__V__';
import { telaRevisar } from './telas/revisar.js?v=__V__';
import { telaConversar, telaConversa } from './telas/conversar.js?v=__V__';
import { telaProgresso } from './telas/progresso.js?v=__V__';
import { telaMaterial, telaMaterialItem } from './telas/material.js?v=__V__';
import { telaDuvidas } from './telas/duvidas.js?v=__V__';
import { telaConta } from './telas/conta.js?v=__V__';
import { telaPodcast } from './telas/podcast.js?v=__V__';

const palco = document.getElementById('conteudo');
const nav = document.querySelector('.nav');
export const estado = { eu: null };

// tema Dia/Noite: escolhido neste aparelho (claro/escuro) ou igual ao sistema
const btnTema = document.querySelector('.tema-troca');
const escuroSistema = matchMedia('(prefers-color-scheme: dark)');
export function aplicarTema(t = localStorageGet('tema')) {
  if (t === 'claro' || t === 'escuro') document.documentElement.dataset.tema = t; else delete document.documentElement.dataset.tema;
  const noite = t === 'escuro' || (t !== 'claro' && escuroSistema.matches);
  btnTema.setAttribute('aria-pressed', String(noite));
  btnTema.setAttribute('aria-label', noite ? 'Tema noite ligado. Trocar para o tema dia' : 'Tema dia ligado. Trocar para o tema noite');
  for (const m of document.querySelectorAll('meta[name="theme-color"]')) m.content = noite ? '#0B1330' : '#EDF2FF';
}
aplicarTema();
escuroSistema.addEventListener?.('change', () => aplicarTema());
addEventListener('inglou:tema', () => aplicarTema());
btnTema.addEventListener('click', () => {
  const t = btnTema.getAttribute('aria-pressed') === 'true' ? 'claro' : 'escuro';
  localStorageSet('tema', t); aplicarTema(t); som('toque');
});

const ROTAS = {
  entrar: telaEntrar, perfil: telaPerfil, nivelamento: telaNivelamento, hoje: telaHoje, plano: telaPlano,
  licao: telaLicao, revisar: telaRevisar, conversar: telaConversar, conversa: telaConversa, progresso: telaProgresso,
  material: telaMaterial, 'material-item': telaMaterialItem, duvidas: telaDuvidas, conta: telaConta, podcast: telaPodcast,
};
const LIVRES = new Set(['entrar']);
const ONBOARDING = new Set(['perfil', 'nivelamento', 'plano']);

export async function carregarEu() {
  try { estado.eu = await api('/eu'); } catch { estado.eu = null; }
  return estado.eu;
}
export const ir = rota => { if (location.hash === rota) render(); else location.hash = rota; };

let renderizando = 0;
async function render() {
  const meu = ++renderizando;
  // janela aberta não atravessa a troca de tela
  for (const d of document.querySelectorAll('dialog.janela[open]')) d.querySelector('.janela__x')?.click();
  const [, nome = 'hoje', param] = (location.hash || '#/hoje').match(/^#\/([\w-]+)(?:\/([\w-]+))?/) || [];
  let rota = nome === 'material' && param ? 'material-item' : nome === 'conversa' ? 'conversa' : nome;
  if (!ROTAS[rota]) rota = 'hoje';
  if (!LIVRES.has(rota)) {
    if (!estado.eu) await carregarEu();
    if (!estado.eu) { if (meu === renderizando) { location.hash = '#/entrar'; } return; }
    // onboarding: perfil -> nivelamento -> plano, nessa ordem
    const passo = estado.eu.passo;
    if (passo === 'perfil' && rota !== 'perfil') { location.hash = '#/perfil'; return; }
    if (passo === 'nivelamento' && !['perfil', 'nivelamento'].includes(rota)) { location.hash = '#/nivelamento'; return; }
  }
  nav.hidden = !estado.eu || ONBOARDING.has(rota) || LIVRES.has(rota) || rota === 'licao';
  document.body.classList.toggle('foco-total', rota === 'licao' || rota === 'nivelamento');
  for (const a of nav.querySelectorAll('a')) {
    const ativo = a.dataset.rota === nome || (nome === 'conversa' && a.dataset.rota === 'conversar');
    a.toggleAttribute('aria-current', ativo); if (ativo) a.setAttribute('aria-current', 'page');
  }
  document.body.dataset.rota = rota;
  const alvo = h('div', { class: 'tela' });
  limpar(palco).append(alvo);
  try {
    await ROTAS[rota](alvo, { param, estado, ir, carregarEu });
  } catch (e) {
    console.error(e);
    if (meu !== renderizando) return;
    limpar(alvo).append(h('div', { class: 'folha vazio' }, lou('ops', { tamanho: 96 }), h('h1', {}, 'Algo não carregou'), h('p', {}, e.message || 'Tente de novo em instantes.'), h('button', { class: 'btn', on: { click: render } }, 'Tentar de novo')));
  }
  if (meu === renderizando) { palco.focus({ preventScroll: true }); scrollTo(0, 0); }
}

addEventListener('hashchange', render);
addEventListener('online', () => toast('Conexão de volta.'));
render();
