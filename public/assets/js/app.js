// Inglou · casca do app: rotas por hash, estado do aluno e navegação.
import { api } from './api.js?v=__V__';
import { h, limpar, toast, icone, janela, localStorageGet, localStorageSet } from './ui.js?v=__V__';
import { som, lou } from './diversao.js?v=__V__';
import './instalar.js?v=__V__';
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
import { telaSobMedida, telaEstudo, telaAssunto, telaSimulado } from './telas/sobmedida.js?v=__V__';
import { telaAprender } from './telas/aprender.js?v=__V__';
import { telaTreino } from './telas/treino.js?v=__V__';
import { telaTurmas, telaMinhaTurma, telaAtividade } from './telas/turmas.js?v=__V__';
import { telaTurma } from './telas/professor.js?v=__V__';
import { agendarAviso } from './lembrete.js?v=__V__';

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

// "Mais": no celular a doca tem 4 abas; o resto mora numa janela com cartões grandes (cada um com a cor da sua atividade)
const MAIS = [
  { rota: 'podcast', cor: 'rosa', ic: 'headphones', t: 'Rádio Tuiuiú', s: 'um episódio por dia, feito com os seus tropeços' },
  { rota: 'treino', cor: 'limao', ic: 'target', t: 'Meu treino', s: 'perguntas só nas suas dificuldades' },
  { rota: 'sobmedida', cor: 'turquesa', ic: 'graduation-cap', t: 'Sob medida', s: 'prova, entrevista ou viagem com data' },
  { rota: 'material', cor: 'turquesa', ic: 'file-text', t: 'Meu texto', s: 'estude com um material seu' },
  { rota: 'aprender', cor: 'limao', ic: 'compass', t: 'Meu jeito', s: 'veja como você aprende, pelos seus acertos' },
  { rota: 'turmas', cor: 'lilas', ic: 'users-three', t: 'Turmas', s: 'atividades do professor ou crie a sua turma' },
  { rota: 'duvidas', cor: 'coral', ic: 'question', t: 'Dúvidas', s: 'pergunte ao tutor' },
  { rota: 'conta', cor: 'azul', ic: 'user-circle', t: 'Eu', s: 'conta, plano e lembretes' },
];
const btnMais = document.querySelector('.nav__mais');
btnMais?.addEventListener('click', () => {
  janela({ titulo: 'Mais para você', corpo: h('ul', { class: 'mais-lista' }, MAIS.map(m => h('li', {},
    h('a', { class: 'mais-item c-' + m.cor, href: '#/' + m.rota }, h('span', { class: 'bolha' }, icone(m.ic)), h('span', {}, h('strong', {}, m.t), h('small', {}, m.s)))))) });
});

const ROTAS = {
  entrar: telaEntrar, perfil: telaPerfil, nivelamento: telaNivelamento, hoje: telaHoje, plano: telaPlano,
  licao: telaLicao, revisar: telaRevisar, conversar: telaConversar, conversa: telaConversa, progresso: telaProgresso,
  material: telaMaterial, 'material-item': telaMaterialItem, duvidas: telaDuvidas, conta: telaConta, podcast: telaPodcast,
  turmas: telaTurmas, minhaturma: telaMinhaTurma, atividade: telaAtividade, turma: telaTurma,
  aprender: telaAprender, treino: telaTreino, sobmedida: telaSobMedida, estudo: telaEstudo, assunto: telaAssunto, simulado: telaSimulado,
};
const LIVRES = new Set(['entrar']);
const ONBOARDING = new Set(['perfil', 'nivelamento', 'plano']);

export async function carregarEu() {
  try { estado.eu = await api('/eu'); } catch { estado.eu = null; }
  agendarAviso(estado.eu?.perfil?.lembrete);
  return estado.eu;
}
export const ir = rota => { if (location.hash === rota) render(); else location.hash = rota; };

let renderizando = 0;
async function render() {
  const meu = ++renderizando;
  // janela aberta não atravessa a troca de tela
  for (const d of document.querySelectorAll('dialog.janela[open]')) d.querySelector('.janela__x')?.click();
  const [, nome = 'hoje', param, param2] = (location.hash || '#/hoje').match(/^#\/([\w-]+)(?:\/([\w-]+))?(?:\/([\w-]+))?/) || [];
  let rota = nome === 'material' && param ? 'material-item' : nome === 'conversa' ? 'conversa' : nome;
  if (nome === 'sobmedida' && param) rota = param2 === 'simulado' ? 'simulado' : param2 ? 'assunto' : 'estudo';
  if (!ROTAS[rota]) rota = 'hoje';
  if (!LIVRES.has(rota)) {
    if (!estado.eu) await carregarEu();
    if (!estado.eu) {
      // link de convite de turma aberto sem login: guarda o código e retoma depois de entrar
      const cod = (location.hash.match(/^#\/turmas\?.*codigo=([\w-]+)/) || [])[1];
      if (cod) localStorageSet('turma-pendente', cod);
      if (meu === renderizando) { location.hash = '#/entrar'; }
      return;
    }
    // onboarding: perfil -> nivelamento -> plano, nessa ordem
    const passo = estado.eu.passo;
    const TURMA_LIVRE = ['turmas', 'turma', 'minhaturma', 'atividade'].includes(rota);   // professor e aluno de turma não precisam do plano pessoal para usar a turma
    if (passo === 'perfil' && rota !== 'perfil' && !TURMA_LIVRE) { location.hash = '#/perfil'; return; }
    if (passo === 'nivelamento' && !['perfil', 'nivelamento'].includes(rota) && !TURMA_LIVRE) { location.hash = '#/nivelamento'; return; }
    if (passo === 'app' && localStorageGet('turma-pendente') && rota !== 'turmas') { location.hash = '#/turmas'; return; }
  }
  nav.hidden = !estado.eu || ONBOARDING.has(rota) || LIVRES.has(rota) || rota === 'licao' || rota === 'simulado' || rota === 'treino' || rota === 'atividade';
  document.body.classList.toggle('foco-total', rota === 'licao' || rota === 'nivelamento' || rota === 'simulado' || rota === 'treino' || rota === 'atividade');
  for (const a of nav.querySelectorAll('a')) {
    const ativo = a.dataset.rota === nome || (nome === 'conversa' && a.dataset.rota === 'conversar');
    a.toggleAttribute('aria-current', ativo); if (ativo) a.setAttribute('aria-current', 'page');
  }
  if (btnMais) { const noMais = MAIS.some(m => m.rota === nome); btnMais.toggleAttribute('aria-current', noMais); if (noMais) btnMais.setAttribute('aria-current', 'page'); }
  document.body.dataset.rota = rota;
  const alvo = h('div', { class: 'tela' });
  limpar(palco).append(alvo);
  try {
    await ROTAS[rota](alvo, { param, param2, estado, ir, carregarEu });
  } catch (e) {
    console.error(e);
    if (meu !== renderizando) return;
    limpar(alvo).append(h('div', { class: 'folha vazio' }, lou('ops', { tamanho: 96 }), h('h1', {}, 'Algo não carregou'), h('p', {}, e.message || 'Tente de novo em instantes.'), h('button', { class: 'btn', on: { click: render } }, 'Tentar de novo')));
  }
  if (meu === renderizando) { palco.focus({ preventScroll: true }); scrollTo(0, 0); }
}

addEventListener('inglou:lembrete', e => agendarAviso(e.detail));
document.addEventListener('visibilitychange', () => { if (!document.hidden) agendarAviso(estado.eu?.perfil?.lembrete); });
addEventListener('hashchange', render);
addEventListener('online', () => toast('Conexão de volta.'));
render();
