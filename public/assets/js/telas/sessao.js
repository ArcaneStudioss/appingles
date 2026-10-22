import { api } from '../api.js?v=__V__';
import { h, falar, falarPt, pararVoz, ocupado, toast, icone } from '../ui.js?v=__V__';
import { exercicio } from './exercicio.js?v=__V__';
import { louFala, confete } from '../diversao.js?v=__V__';

export async function telaSessao(el, { ir }) {
  const { sessao: s } = await api('/sessao');
  if (!s) { ir('#/hoje'); return; }
  const palco = h('div', { class: 'sessao-palco' });
  const progresso = h('p', { class: 'chip', role: 'status' });
  el.append(h('a', { class: 'btn btn-texto', href: '#/hoje' }, icone('caret-left'), 'Sair e continuar depois'), progresso, palco);
  const novo = s.itens.findIndex(e => !s.respondidos[e.id]);
  let passo = s.concluida ? s.itens.length + 1 : novo > 0 ? novo + 1 : 0;
  const avancar = () => { pararVoz(); passo++; desenhar(); };
  const botao = (texto, acao) => h('button', { class: 'btn btn-bloco', type: 'button', on: { click: acao } }, texto);
  function desenhar() {
    palco.replaceChildren(); progresso.textContent = `Sessão de até ${s.minutos} minutos · ${Math.min(passo, s.itens.length)} de ${s.itens.length} atividades`;
    if (passo === 0) {
      palco.append(louFala('oi', h('p', {}, s.podeFazer || s.titulo)), h('h1', {}, s.titulo),
        h('p', {}, 'Primeiro veja os exemplos. Depois pratique; pode pedir ajuda sempre que precisar.'),
        h('ul', { class: 'vocab' }, s.vocab.map(v => h('li', {}, h('strong', { lang: 'en', 'data-traducao': v.pt }, v.en), h('span', {}, v.pt),
          h('p', { lang: 'en' }, v.ex || v.en), botao('Ouvir exemplo', () => falar(v.ex || v.en))))),
        h('details', { class: 'folha' }, h('summary', {}, 'Entender melhor'), h('p', {}, s.explicacao), botao('Ouvir explicação', () => falarPt(s.explicacao))), botao('Praticar', avancar));
      return;
    }
    if (passo <= s.itens.length) {
      const ex = s.itens[passo - 1];
      let apoioPendente = Promise.resolve();
      const apoio = h('section', { class: 'folha', hidden: true, role: 'status' });
      const marcar = () => {
        apoioPendente = apoioPendente.then(() => api('/sessao/ajuda', { metodo: 'POST', corpo: { itemId: ex.id } }));
        return apoioPendente;
      };
      const caixa = exercicio(ex, {
        ja: s.respondidos[ex.id], permitirTreino: true,
        responder: async (resposta, extra = {}) => { await apoioPendente; const r = await api('/sessao/responder', { metodo: 'POST', corpo: { itemId: ex.id, resposta, ...extra } }); if(!r.pratica)s.respondidos[ex.id] = r; return r; },
        aoProximo: avancar,
      });
      caixa.addEventListener('inglou:traducao', () => { marcar().catch(e => toast(e.message)); });
      palco.append(h('h1', {}, ex.etapa || 'Praticar'), caixa,
        botao('Não entendi: mostrar outro apoio', async () => {
          try { const r = await marcar(); apoio.hidden = false; apoio.replaceChildren(h('p', {}, r.dica), r.textoAudio ? h('p', {lang:'en'}, r.textoAudio) : null, r.exemplo ? h('p', {}, h('span', { lang: 'en' }, r.exemplo.en), ' — ', r.exemplo.pt) : null, r.vocab.map(v => h('p', {}, h('strong', { lang: 'en' }, v.en), ' = ', v.pt)), h('p', { class: 'ajuda' }, 'Este apoio fica registrado como prática com ajuda.')); }
          catch (e) { toast(e.message, { tipo: 'erro' }); }
        }), apoio);
      return;
    }
    palco.append(louFala('feliz', h('p', {}, s.concluida ? 'Seu treino de hoje está salvo!' : 'Você chegou ao fim. Cada prática é um passo.')), h('h1', {}, 'Sessão concluída'),
      h('p', {}, 'Seu XP representa participação. O domínio do inglês é verificado nas tarefas feitas sem ajuda e nos retestes.'),
      s.concluida ? h('a', { class: 'btn', href: '#/progresso' }, 'Ver meu progresso') : botao('Salvar conclusão', async e => {
        const b = e.currentTarget; ocupado(b, true);
        try { const r = await api('/sessao/concluir', { metodo: 'POST' }); s.concluida = true; if (!r.repetida) confete(); desenhar(); }
        catch (err) { toast(err.message, { tipo: 'erro' }); ocupado(b, false); }
      }), h('a', { class: 'btn btn-sec', href: '#/licao' }, 'Continuar a missão'), h('a', { class: 'btn btn-texto', href: '#/hoje' }, 'Voltar para Hoje'));
  }
  desenhar();
}
