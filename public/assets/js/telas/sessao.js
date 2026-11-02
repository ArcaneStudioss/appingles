import { api } from '../api.js?v=__V__';
import { h, falar, falarPt, pararVoz, ocupado, toast, icone } from '../ui.js?v=__V__';
import { exercicio } from './exercicio.js?v=__V__';
import { celebrarSequencia } from '../chama.js?v=__V__';
import { louFala, confete, voarComemorando } from '../diversao.js?v=__V__';

export async function telaSessao(el, { ir }) {
  const { sessao: s } = await api('/sessao');
  if (!s) { ir('#/hoje'); return; }
  const palco = h('div', { class: 'sessao-palco' });
  const progresso = h('p', { class: 'chip', role: 'status' });
  el.append(h('a', { class: 'btn btn-texto', href: '#/hoje' }, icone('caret-left'), 'Sair e continuar depois'), progresso, palco);
  const novo = s.itens.findIndex(e => !s.respondidos[e.id]);
  let passo = s.concluida || novo === -1 ? s.itens.length + 1 : novo > 0 ? novo + 1 : 0;
  const avancar = () => { pararVoz(); passo++; desenhar(); const titulo = palco.querySelector('h1'); titulo?.setAttribute('tabindex', '-1'); titulo?.focus({ preventScroll: true }); scrollTo({ top: 0, behavior: 'instant' }); };
  const botao = (texto, acao) => h('button', { class: 'btn btn-bloco', type: 'button', on: { click: acao } }, texto);
  function desenhar() {
    palco.replaceChildren(); progresso.textContent = `Sessão de até ${s.minutos} minutos · ${Math.min(passo, s.itens.length)} de ${s.itens.length} atividades`;
    if (passo === 0) {
      palco.append(louFala('oi', h('p', {}, s.podeFazer || s.titulo)), h('h1', {}, s.titulo),
        h('p', {}, 'Primeiro veja os exemplos. Depois pratique; pode pedir ajuda sempre que precisar.'),
        h('ul', { class: 'vocab vocab--sessao' }, s.vocab.map(v => {
          const ex = v.ex && v.ex.replace(/[.!?]/g, '').trim().toLowerCase() !== v.en.toLowerCase() ? v.ex : null;
          return h('li', {}, h('button', { type: 'button', class: 'btn-icone', 'aria-label': 'Ouvir ' + v.en, on: { click: () => falar(ex || v.en) } }, icone('speaker-high')),
            h('div', {}, h('strong', { lang: 'en', 'data-traducao': v.pt }, v.en), h('span', { class: 'vocab__significado' }, v.pt), ex ? h('em', { lang: 'en', class: 'vocab__exemplo' }, ex) : null));
        })),
        h('details', { class: 'folha' }, h('summary', {}, 'Entender melhor'), h('p', {}, s.explicacao), botao('Ouvir explicação', () => falarPt(s.explicacao))), botao('Praticar', avancar));
      return;
    }
    if (passo <= s.itens.length) {
      const ex = s.itens[passo - 1];
      let apoioPendente = Promise.resolve();
      let pediuApoio = false;
      const apoio = h('section', { class: 'folha', hidden: true, role: 'status' });
      const marcar = () => {
        pediuApoio = true;
        // Uma falha anterior não impede nova tentativa. A resposta também leva
        // a marca de apoio, mesmo se o serviço de ajuda estiver indisponível.
        apoioPendente = apoioPendente.catch(() => {}).then(() => api('/sessao/ajuda', { metodo: 'POST', corpo: { itemId: ex.id } }));
        return apoioPendente;
      };
      const caixa = exercicio(ex, {
        ja: s.respondidos[ex.id], permitirTreino: true,
        responder: async (resposta, extra = {}) => { await apoioPendente.catch(() => {}); const r = await api('/sessao/responder', { metodo: 'POST', corpo: { itemId: ex.id, resposta, ...extra, dica: extra.dica || pediuApoio } }); if(!r.pratica)s.respondidos[ex.id] = r; return r; },
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
        try { const r = await api('/sessao/concluir', { metodo: 'POST' }); s.concluida = true; if (!r.repetida) { confete(); voarComemorando({ companhia: true, jeito: 'sobe', confetes: false }); }
          if (!r.repetida && r.sequencia?.estudouHoje) { let nome = ''; try { nome = String((await api('/eu')).usuario?.nome || '').split(' ')[0].slice(0, 20); } catch {} await celebrarSequencia(r.sequencia, { nome }); }
          desenhar(); }
        catch (err) { toast(err.message, { tipo: 'erro' }); ocupado(b, false); }
      }), h('a', { class: 'btn btn-sec', href: '#/licao' }, 'Continuar a missão'), h('a', { class: 'btn btn-texto', href: '#/hoje' }, 'Voltar para Hoje'));
  }
  desenhar();
}
