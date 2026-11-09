import { api } from '../api.js?v=__V__';
import { h, falar, falarPt, pararVoz, ocupado, toast, icone } from '../ui.js?v=__V__';
import { exercicio } from './exercicio.js?v=__V__';
import { celebrarSequencia } from '../chama.js?v=__V__';
import { lou, louFala, som, confete, botaoSom, pontosFlutuantes, contar, vibrar, voarComemorando } from '../diversao.js?v=__V__';
import { mudarPose } from '../tui.js?v=__V__';

export async function telaSessao(el, { ir }) {
  const { sessao: s } = await api('/sessao');
  if (!s) { ir('#/hoje'); return; }
  const palco = h('div', { class: 'sessao-palco' });
  const progresso = h('p', { class: 'licao-contador', role: 'status' });
  // Mesmo "jeito de jogo" da aula: trilho com o Tuiuiú andando, combo de acertos seguidos e som. O progresso fica salvo ao sair.
  let combo = 0, melhorCombo = 0, comemorouFim = false;
  const chipCombo = h('span', { class: 'combo', hidden: true, 'aria-live': 'polite' }, icone('flame'), h('b', {}, '0'), h('span', { class: 'oculto' }, ' acertos seguidos'));
  const trilho = h('div', { class: 'trilho', role: 'progressbar', 'aria-label': 'Progresso da sessão', 'aria-valuemin': 0, 'aria-valuemax': s.itens.length + 1 }, h('span', { class: 'trilho__cheio' }), h('span', { class: 'trilho__lou' }, lou('feliz', { tamanho: 38, rotulo: '', pose: 'voa' })));
  const topo = h('div', { class: 'licao-topo' }, h('a', { class: 'btn btn-texto btn-peq', href: '#/hoje', 'aria-label': 'Sair e continuar depois', title: 'Sair e continuar depois' }, icone('x')), trilho, chipCombo, botaoSom());
  function marcarCombo(certo, xp = 0) {
    combo = certo ? combo + 1 : 0; melhorCombo = Math.max(melhorCombo, combo);
    chipCombo.hidden = combo < 2; chipCombo.querySelector('b').textContent = String(combo);
    chipCombo.classList.remove('combo--pula'); void chipCombo.offsetWidth; chipCombo.classList.add('combo--pula');
    const mascote = trilho.querySelector('.trilho__lou');
    mascote.classList.remove('trilho__lou--pula', 'trilho__lou--ops'); void mascote.offsetWidth; mascote.classList.add(certo ? 'trilho__lou--pula' : 'trilho__lou--ops');
    if (certo && xp) pontosFlutuantes(mascote, `+${xp} XP`);
    const tui = mascote.querySelector('.lou--tui'); if (tui) mudarPose(tui, certo ? 'comemora' : 'consola', certo ? 900 : 1500);
  }
  el.append(topo, progresso, palco);
  const novo = s.itens.findIndex(e => !s.respondidos[e.id]);
  let passo = s.concluida || novo === -1 ? s.itens.length + 1 : novo > 0 ? novo + 1 : 0;
  const avancar = () => { pararVoz(); passo++; desenhar(); const titulo = palco.querySelector('h1'); titulo?.setAttribute('tabindex', '-1'); titulo?.focus({ preventScroll: true }); scrollTo({ top: 0, behavior: 'instant' }); };
  const botao = (texto, acao) => h('button', { class: 'btn btn-bloco', type: 'button', on: { click: acao } }, texto);
  function desenhar() {
    palco.replaceChildren();
    progresso.textContent = passo === 0 ? `Sessão de até ${s.minutos} minutos · ${s.itens.length} atividades` : passo <= s.itens.length ? `Atividade ${passo} de ${s.itens.length}` : 'Você chegou ao fim!';
    trilho.setAttribute('aria-valuenow', passo);
    trilho.style.setProperty('--p', (passo / (s.itens.length + 1)).toFixed(3));
    if (passo > 0) { trilho.classList.remove('is-avanca'); void trilho.offsetWidth; trilho.classList.add('is-avanca'); }
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
        responder: async (resposta, extra = {}) => { await apoioPendente.catch(() => {}); const r = await api('/sessao/responder', { metodo: 'POST', corpo: { itemId: ex.id, resposta, ...extra, dica: extra.dica || pediuApoio } }); if (!r.pratica) { s.respondidos[ex.id] = r; outroApoio.hidden = true; if (!r.repetida) marcarCombo(r.correto && !r.ajuda && !r.dica, r.recompensa?.xp || 0); } return { ...r, sequencia: !r.pratica && !r.repetida ? combo : 0 }; },
        aoProximo: avancar,
      });
      caixa.addEventListener('inglou:traducao', () => { marcar().catch(e => toast(e.message)); });
      // Ajuda extra discreta (o exercício já tem dica e "ver resposta"); some depois de responder para não disputar com "Continuar".
      const outroApoio = h('button', { class: 'btn btn-texto', type: 'button', hidden: !!s.respondidos[ex.id], on: { click: async () => {
          try { const r = await marcar(); apoio.hidden = false; apoio.replaceChildren(h('p', {}, r.dica), r.textoAudio ? h('p', {lang:'en'}, r.textoAudio) : null, r.exemplo ? h('p', {}, h('span', { lang: 'en' }, r.exemplo.en), ' — ', r.exemplo.pt) : null, r.vocab.map(v => h('p', {}, h('strong', { lang: 'en' }, v.en), ' = ', v.pt)), h('p', { class: 'ajuda' }, 'Este apoio fica registrado como prática com ajuda.')); }
          catch (e) { toast(e.message, { tipo: 'erro' }); }
        } } }, icone('question'), 'Não entendi: mostrar outro apoio');
      palco.append(h('h1', {}, ex.etapa || 'Praticar'), caixa, outroApoio, apoio);
      return;
    }
    // Fim da sessão: placar com contagem e festa (uma vez). XP é participação; o domínio continua sendo medido nas tarefas sem ajuda.
    const feitos = s.itens.map(e => s.respondidos[e.id]).filter(Boolean);
    const certos = feitos.filter(r => r.correto).length, xp = feitos.reduce((t, r) => t + (r.recompensa?.xp || 0), 0);
    palco.append(louFala(s.concluida ? 'feliz' : 'festa', h('p', {}, s.concluida ? 'Seu treino de hoje está salvo!' : certos === feitos.length && feitos.length ? 'Acertou tudo! Que sessão.' : 'Você chegou ao fim. Cada prática é um passo.')), h('h1', {}, 'Sessão concluída'),
      feitos.length ? h('div', { class: 'placar' },
        h('div', { class: 'placar__item' }, h('span', {}, 'Acertos'), h('strong', {}, h('b', { 'data-conta': certos }, String(certos)), h('small', {}, ` de ${feitos.length}`))),
        xp ? h('div', { class: 'placar__item placar__item--sol' }, h('span', {}, 'XP ganho'), h('strong', { 'data-conta': xp, 'data-prefixo': '+' }, `+${xp}`)) : null,
        melhorCombo >= 3 ? h('div', { class: 'placar__item placar__item--coral' }, h('span', {}, 'Melhor combo'), h('strong', {}, `x${melhorCombo}`)) : null) : null,
      h('p', { class: 'ajuda' }, 'XP mostra participação. O domínio do inglês é verificado nas tarefas feitas sem ajuda e nos retestes.'),
      s.concluida ? h('a', { class: 'btn', href: '#/progresso' }, 'Ver meu progresso') : botao('Concluir sessão', async e => {
        const b = e.currentTarget; ocupado(b, true);
        try { const r = await api('/sessao/concluir', { metodo: 'POST' }); s.concluida = true; if (!r.repetida) { confete(); voarComemorando({ jeito: 'rasante', confetes: false }); }
          desenhar();   // a tela já fica no estado concluído por baixo da comemoração da sequência
          if (!r.repetida && r.sequencia?.estudouHoje) { let nome = ''; try { nome = String((await api('/eu')).usuario?.nome || '').split(' ')[0].slice(0, 20); } catch {} await celebrarSequencia(r.sequencia, { nome }); }
        }
        catch (err) { toast(err.message, { tipo: 'erro' }); ocupado(b, false); }
      }), h('a', { class: 'btn btn-sec', href: '#/licao' }, 'Continuar a missão'), h('a', { class: 'btn btn-texto', href: '#/hoje' }, 'Voltar para Hoje'));
    for (const n of palco.querySelectorAll('[data-conta]')) contar(n, Number(n.dataset.conta), { prefixo: n.dataset.prefixo || '' });
    if (!s.concluida && !comemorouFim) { comemorouFim = true; som('fim'); vibrar([30, 40, 30]); confete(document.body, 24); }
  }
  desenhar();
}
