// Estudar com material da própria vida: vaga, apresentação, texto da faculdade, artigo.
import { api } from '../api.js?v=__V__';
import { h, icone, falar, toast, formulario, confirmar, dataBR, ocupado } from '../ui.js?v=__V__';
import { exercicio } from './exercicio.js?v=__V__';

export async function telaMaterial(el, { ir }) {
  const { materiais } = await api('/materiais');
  const novo = async () => {
    const r = await formulario({ titulo: 'Novo material', enviar: 'Preparar meu material', texto: 'Cole um texto em inglês: uma descrição de vaga, um e-mail, parte de uma apresentação ou de um artigo. Não cole dados pessoais de outras pessoas.',
      campos: [{ nome: 'titulo', rotulo: 'Título', obrigatorio: true, max: 120, placeholder: 'Vaga de analista na Empresa X' }, { nome: 'texto', rotulo: 'Texto (em inglês)', tipo: 'textarea', obrigatorio: true, max: 8000, linhas: 9 }],
      aoEnviar: v => api('/materiais', { metodo: 'POST', corpo: v }) });
    if (r?.id) { if (r.aviso) toast(r.aviso); ir('#/material/' + r.id); }
  };
  el.append(
    h('header', { class: 'cabeca c-turquesa' }, h('span', { class: 'bolha' }, icone('file-text')), h('div', {}, h('h1', {}, 'Meu texto'), h('p', { class: 'ajuda' }, 'Traga o que você vai usar de verdade. Viram palavras do seu nível, exercícios e perguntas de simulação.'))),
    h('button', { type: 'button', class: 'btn btn-cor c-turquesa', on: { click: novo } }, icone('plus'), 'Novo texto'),
    materiais.length ? h('ul', { class: 'lista-simples' }, materiais.map(m => h('li', {}, h('a', { href: '#/material/' + m.id }, m.titulo), h('small', {}, ' ' + dataBR(m.criado_em)))))
      : h('div', { class: 'folha vazio c-turquesa' }, h('p', { class: 'bilhete' }, 'Ideia'), h('p', {}, 'Tem uma entrevista? Cole a descrição da vaga. Vamos tirar dela as palavras que o recrutador vai usar e as perguntas que ele pode fazer.')));
}

export async function telaMaterialItem(el, { param, ir }) {
  const { material: m } = await api('/materiais/' + encodeURIComponent(param));
  const vocab = m.vocab || [];
  const marcados = new Set(vocab.map((_, i) => i).slice(0, 8));
  const btnCartoes = h('button', { type: 'button', class: 'btn btn-sec', on: { click: async () => {
    ocupado(btnCartoes, true);
    try { const r = await api(`/materiais/${m.id}/cartoes`, { metodo: 'POST', corpo: { indices: [...marcados] } }); toast(r.criados ? `${r.criados} cartões criados para revisão.` : 'Esses cartões já existiam.', { tipo: 'ok' }); }
    catch (e) { toast(e.message, { tipo: 'erro' }); } finally { ocupado(btnCartoes, false); }
  } } }, icone('cards'), 'Criar cartões com as marcadas');

  const exs = h('div', { class: 'lista-exercicios' });
  for (const ex of [...(m.compreensao || []).map(c => ({ ...c, tipo: 'escolha', enunciado: c.pergunta })), ...(m.exercicios || [])]) {
    const caixa = h('div', { class: 'folha' });
    caixa.append(exercicio(ex, { responder: (resposta) => api(`/materiais/${m.id}/responder`, { metodo: 'POST', corpo: { itemId: ex.id, resposta } }), rotuloProximo: 'Próximo', aoProximo: () => { const prox = caixa.nextElementSibling; if (prox) { prox.scrollIntoView({ block: 'center' }); prox.querySelector('button,input,textarea')?.focus({ preventScroll: true }); } } }));
    exs.append(caixa);
  }

  el.append(
    h('header', { class: 'cabeca' }, h('a', { class: 'btn btn-texto btn-peq', href: '#/material' }, icone('caret-left'), 'Materiais'), h('h1', {}, m.titulo), h('p', { class: 'ajuda' }, dataBR(m.criado_em))),
    m.aviso ? h('p', { class: 'aviso-suave' }, icone('info'), h('span', {}, m.aviso)) : null,
    m.resumo ? h('section', { class: 'folha com-margem' }, h('h2', {}, 'Resumo'), h('p', { lang: 'en' }, m.resumo), m.resumo_pt ? h('p', { class: 'ajuda' }, m.resumo_pt) : null, h('button', { type: 'button', class: 'btn btn-sec btn-peq', on: { click: () => falar(m.resumo, { velocidade: 0.95 }) } }, icone('speaker-high'), 'Ouvir o resumo')) : null,
    vocab.length ? h('section', { class: 'folha' }, h('h2', {}, 'Vocabulário do seu texto'),
      h('ul', { class: 'vocab vocab--marcavel' }, vocab.map((v, i) => h('li', {},
        h('input', { type: 'checkbox', id: 'v' + i, checked: marcados.has(i), on: { change: e => { if (e.target.checked) marcados.add(i); else marcados.delete(i); } } }),
        h('label', { for: 'v' + i }, h('span', { class: 'marca', lang: 'en' }, v.en), v.pt ? h('small', {}, ' ' + v.pt) : null, h('em', { lang: 'en' }, v.ex)),
        h('button', { type: 'button', class: 'btn-icone', 'aria-label': 'Ouvir', on: { click: () => falar(v.ex) } }, icone('speaker-high'))))),
      btnCartoes) : null,
    exs.children.length ? h('section', {}, h('h2', {}, 'Exercícios'), exs) : null,
    m.dialogo?.length ? h('section', { class: 'folha' }, h('h2', {}, 'Diálogo'), h('ol', { class: 'dialogo', lang: 'en' }, m.dialogo.map(f => h('li', {}, h('strong', {}, f.quem + ': '), f.fala))), h('button', { type: 'button', class: 'btn btn-sec btn-peq', on: { click: () => falar(m.dialogo.map(f => f.fala).join(' '), { velocidade: 0.95 }) } }, icone('speaker-high'), 'Ouvir o diálogo')) : null,
    m.audio?.length ? h('section', { class: 'folha' }, h('h2', {}, 'Ouça frases do seu texto'), h('ul', { class: 'exemplos' }, m.audio.map(f => h('li', {}, h('button', { type: 'button', class: 'btn-icone', 'aria-label': 'Ouvir', on: { click: () => falar(f) } }, icone('speaker-high')), h('span', { lang: 'en' }, f))))) : null,
    m.simulacao?.length ? h('section', { class: 'folha com-margem' }, h('h2', {}, 'Perguntas para simular'), h('p', { class: 'ajuda' }, 'Responda em voz alta ou por escrito. Depois, converse sobre isso numa simulação de entrevista.'), h('ol', { lang: 'en' }, m.simulacao.map(q => h('li', {}, q))), h('a', { class: 'btn btn-sec', href: '#/conversar?c=entrevista-geral&material=' + m.id }, icone('chats'), 'Praticar numa conversa')) : null,
    h('details', { class: 'folha' }, h('summary', {}, 'Ver o texto original'), h('p', { lang: 'en', class: 'texto-original' }, m.texto)),
    h('button', { type: 'button', class: 'btn btn-perigo', on: { click: async () => { if (await confirmar({ titulo: 'Apagar este material?', ok: 'Apagar', perigo: true })) { await api('/materiais/' + m.id, { metodo: 'DELETE' }); ir('#/material'); } } } }, icone('trash'), 'Apagar material'));
}
