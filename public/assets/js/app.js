import { telaAdmin } from './telas/admin.js?v=__V__';
import { telaPassaporte } from './telas/passaporte.js?v=__V__';
import { telaSessao } from './telas/sessao.js?v=__V__';
// Inglou · casca do app: rotas por hash, estado do aluno e navegação.
import './abertura.js?v=__V__';
import { api } from './api.js?v=__V__';
import { h, limpar, toast, icone, janela, localStorageGet, localStorageSet } from './ui.js?v=__V__';
import { som, lou, passearVoando } from './diversao.js?v=__V__';
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
import { iniciarTraducoes } from './traducao.js?v=__V__';
import { telaPublico } from './telas/publico.js?v=__V__';
import { telaBiblioteca, telaUnidade } from './telas/biblioteca.js?v=__V__';
import { telaBrasil } from './telas/brasil.js?v=__V__';
import { telaSocial, telaColecao, telaLoja } from './telas/social.js?v=__V__';

const palco = document.getElementById('conteudo');
// Mantém a escala da área de estudo; a rolagem continua livre no celular.
// Preserva o gesto de ampliar para acessibilidade. Campos usam fonte de pelo menos 16px.
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
iniciarTraducoes();
escuroSistema.addEventListener?.('change', () => aplicarTema());
addEventListener('inglou:tema', () => aplicarTema());
btnTema.addEventListener('click', () => {
  const t = btnTema.getAttribute('aria-pressed') === 'true' ? 'claro' : 'escuro';
  localStorageSet('tema', t); aplicarTema(t); som('toque');
});

// A mesma navegação curta no celular e no computador. Os outros recursos ficam agrupados por finalidade.
const MAIS = [
  { grupo: 'Praticar inglês', rota: 'passaporte', cor: 'turquesa', ic: 'airplane', t: 'Passaporte cultural', s: 'missões Do Brasil pro mundo' },
  { grupo: 'Ensino e conta', rota: 'admin', cor: 'azul', ic: 'gear', t: 'Revisão e qualidade', s: 'conteúdo e métricas', admin: true },
  { grupo: 'Amigos e coleção', rota: 'desafios', cor: 'lilas', ic: 'users-three', t: 'Desafios com amigos', s: 'duelos, metas e sequências em grupo' },
  { grupo: 'Amigos e coleção', rota: 'colecao', cor: 'sol', ic: 'cards', t: 'Minhas figurinhas', s: 'raridades e figurinhas para os duelos' },
  { grupo: 'Amigos e coleção', rota: 'loja', cor: 'lilas', ic: 'medal', t: 'Loja e moedas', s: 'XP, poções e caixas de figurinhas' },
  { grupo: 'Praticar inglês', rota: 'revisar', cor: 'sol', ic: 'cards', t: 'Revisar palavras', s: 'relembre o que aprendeu' },
  { grupo: 'Praticar inglês', rota: 'conversar', cor: 'menta', ic: 'chats', t: 'Conversar', s: 'pratique em situações reais' },
  { grupo: 'Praticar inglês', rota: 'treino', cor: 'limao', ic: 'target', t: 'Treinar dificuldades', s: 'questões para reforçar o que precisa' },
  { grupo: 'Praticar inglês', rota: 'podcast', cor: 'rosa', ic: 'headphones', t: 'Ouvir inglês', s: 'episódios da Rádio Tuiuiú com transcrição' },
  { grupo: 'Personalizar estudos', rota: 'sobmedida', cor: 'turquesa', ic: 'graduation-cap', t: 'Estudar para um objetivo', s: 'prepare-se para uma prova ou uma viagem' },
  { grupo: 'Personalizar estudos', rota: 'material', cor: 'turquesa', ic: 'file-text', t: 'Estudar meu texto', s: 'use um material seu para praticar' },
  { grupo: 'Personalizar estudos', rota: 'aprender', cor: 'limao', ic: 'compass', t: 'Meu jeito de aprender', s: 'entenda seu progresso e suas preferências' },
  { grupo: 'Personalizar estudos', rota: 'progresso', cor: 'lilas', ic: 'book-open-text', t: 'Meu progresso', s: 'acompanhe seu estudo individual', professor: true },
  { grupo: 'Ensino e conta', rota: 'professor', cor: 'menta', ic: 'users-three', t: 'Área do professor', s: 'crie turmas, monte aulas e acompanhe alunos', aluno: true },
  { grupo: 'Ensino e conta', rota: 'turmas', cor: 'lilas', ic: 'users-three', t: 'Minhas turmas como aluno', s: 'acesse as aulas de outros professores', professor: true },
  { grupo: 'Ensino e conta', rota: 'duvidas', cor: 'coral', ic: 'question', t: 'Tirar uma dúvida', s: 'pergunte ao tutor' },
  { grupo: 'Ensino e conta', rota: 'conta', cor: 'azul', ic: 'user-circle', t: 'Minha conta', s: 'assinatura, idade, preferências e lembretes', aluno: true },
];
const btnMais = document.querySelector('.nav__mais');
const itensMais = () => MAIS.filter(m => (!m.admin || estado.eu?.admin)).filter(m => estado.eu?.perfil?.papel === 'ambos' ? true : estado.eu?.perfil?.papel === 'professor' ? !m.aluno : !m.professor);
btnMais?.addEventListener('click', () => {
  const itens = itensMais();
  janela({ titulo: 'O que você quer fazer?', corpo: h('div', { class: 'mais-grupos' }, [...new Set(itens.map(m => m.grupo))].map(grupo => h('section', { class: 'mais-grupo' },
    h('h3', {}, grupo), h('ul', { class: 'mais-lista' }, itens.filter(m => m.grupo === grupo).map(m => h('li', {},
      h('a', { class: 'mais-item c-' + m.cor, href: '#/' + m.rota }, h('span', { class: 'bolha' }, icone(m.ic)), h('span', {}, h('strong', {}, m.t), h('small', {}, m.s))))))))) });
});

const ROTAS = { admin: telaAdmin, passaporte: telaPassaporte, sessao: telaSessao,
  desafios: telaSocial, colecao: telaColecao, loja: telaLoja,
  brasil: telaBrasil,
  biblioteca: telaBiblioteca, unidade: telaUnidade,
  publico: telaPublico, professor: telaTurmas,
  entrar: telaEntrar, perfil: telaPerfil, nivelamento: telaNivelamento, hoje: telaHoje, plano: telaPlano,
  licao: telaLicao, revisar: telaRevisar, conversar: telaConversar, conversa: telaConversa, progresso: telaProgresso,
  material: telaMaterial, 'material-item': telaMaterialItem, duvidas: telaDuvidas, conta: telaConta, podcast: telaPodcast,
  turmas: telaTurmas, minhaturma: telaMinhaTurma, atividade: telaAtividade, turma: telaTurma,
  aprender: telaAprender, treino: telaTreino, sobmedida: telaSobMedida, estudo: telaEstudo, assunto: telaAssunto, simulado: telaSimulado,
};
const LIVRES = new Set(['entrar']);
const ONBOARDING = new Set(['perfil', 'nivelamento', 'plano', 'publico']);

export async function carregarEu() {
  try { estado.eu = await api('/eu'); } catch { estado.eu = null; }
  document.body.dataset.cenario = estado.eu?.cenario || 'padrao';
  document.body.dataset.publico = estado.eu?.publico?.id || 'adulto';
  document.body.dataset.papel = estado.eu?.perfil?.papel || 'aluno';
  const prof = estado.eu?.perfil?.papel === 'professor';
  const inicio = nav.querySelector('[data-nav="inicio"]');
  if (inicio) { inicio.href = prof ? '#/professor' : '#/hoje'; inicio.dataset.rota = prof ? 'professor' : 'hoje'; inicio.lastElementChild.textContent = prof ? 'Painel' : 'Hoje'; }
  const progresso = nav.querySelector('[data-nav="progresso"]');
  if (progresso) {
    progresso.href = prof ? '#/conta' : '#/progresso'; progresso.dataset.rota = prof ? 'conta' : 'progresso';
    progresso.lastElementChild.textContent = prof ? 'Conta' : estado.eu?.publico?.id === 'crianca' ? 'Álbum' : 'Progresso';
    progresso.querySelector('use').setAttribute('href', '/assets/icones/sprite.svg?v=__V__#i-' + (prof ? 'user-circle' : estado.eu?.publico?.id === 'crianca' ? 'medal' : 'chart-line-up'));
  }
  nav.querySelector('[data-nav="turmas"]').hidden = prof;
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
  if (nome === 'biblioteca' && param) rota = 'unidade';
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
    if (!estado.eu.publico?.informado && rota !== 'publico') { location.hash = '#/publico'; return; }
    if (rota === 'hoje' && estado.eu.perfil?.papel === 'professor') { location.hash = '#/professor'; return; }
    const TURMA_LIVRE = ['publico', 'admin', 'passaporte', 'professor', 'conta', 'biblioteca', 'brasil', 'unidade', 'desafios', 'colecao', 'loja', 'turmas', 'turma', 'minhaturma', 'atividade'].includes(rota);
    if (passo === 'perfil' && rota !== 'perfil' && !TURMA_LIVRE) { location.hash = '#/perfil'; return; }
    if (passo === 'nivelamento' && !['perfil', 'nivelamento'].includes(rota) && !TURMA_LIVRE) { location.hash = '#/nivelamento'; return; }
    if (passo === 'app' && localStorageGet('turma-pendente') && rota !== 'turmas') { location.hash = '#/turmas'; return; }
  }
  const editandoAula = rota === 'turma' && (param2 === 'nova' || /^e\d+$/.test(param2 || ''));
  nav.hidden = !estado.eu || ONBOARDING.has(rota) || LIVRES.has(rota) || editandoAula || ['sessao', 'licao', 'unidade', 'simulado', 'treino', 'atividade'].includes(rota);
  document.body.classList.toggle('foco-total', editandoAula || ['sessao', 'licao', 'unidade', 'nivelamento', 'simulado', 'treino', 'atividade'].includes(rota));
  for (const a of nav.querySelectorAll('a')) {
    const pai = ['unidade', 'biblioteca', 'brasil'].includes(rota) ? 'biblioteca' : ['turma', 'professor'].includes(rota) ? 'professor' : ['minhaturma', 'atividade'].includes(rota) ? 'turmas' : nome;
    const ativo = !a.hidden && a.dataset.rota === pai;
    a.toggleAttribute('aria-current', ativo); if (ativo) a.setAttribute('aria-current', 'page');
  }
  if (btnMais) { const noMais = itensMais().some(m => m.rota === nome || (nome === 'conversa' && m.rota === 'conversar') || (nome === 'minhaturma' && m.rota === 'turmas')); btnMais.toggleAttribute('aria-current', noMais); if (noMais) btnMais.setAttribute('aria-current', 'page'); }
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
  if (meu === renderizando) { palco.focus({ preventScroll: true }); scrollTo(0, 0); passearVoando(rota); }
}

addEventListener('inglou:lembrete', e => agendarAviso(e.detail));
document.addEventListener('visibilitychange', () => { if (!document.hidden) agendarAviso(estado.eu?.perfil?.lembrete); });
addEventListener('hashchange', render);
addEventListener('online', () => toast('Conexão de volta.'));
render();
