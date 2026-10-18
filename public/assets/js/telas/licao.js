// Lição do dia: um passo por tela. Começa explicando o PORQUÊ da aula de hoje.
import { api } from '../api.js?v=__V__';
import { h, icone, falar, botaoOuvir, ocupado, toast, confirmar, temMicrofone, ouvirMicrofone } from '../ui.js?v=__V__';
import { exercicio } from './exercicio.js?v=__V__';
import { nomeConquista } from './hoje.js?v=__V__';
import { lou, louFala, som, confete, somLigado } from '../diversao.js?v=__V__';
import { localStorageSet } from '../ui.js?v=__V__';

const ABORDAGEM = { regra: 'A regra direta', contraste: 'Comparando com o português', exemplos: 'Pelos exemplos', escuta: 'Ouvindo' };

export async function telaLicao(el, { ir }) {
  const { licao, respondidos, status } = await api('/licao');
  // monta a sequência de passos
  const passos = [{ tipo: 'intro' }];
  licao.blocos.forEach((b, bi) => {
    if (['foco', 'explicacao', 'lembrete'].includes(b.tipo)) passos.push({ tipo: 'bloco', b, bi });
    if (['exercicios', 'escuta', 'retomada', 'rapidas'].includes(b.tipo)) passos.push({ tipo: 'abre', b, bi });
    for (const ex of b.exercicios || []) passos.push({ tipo: 'ex', ex, b, bi });
    if (b.tipo === 'producao') passos.push({ tipo: 'producao', b, bi });
  });
  passos.push({ tipo: 'fim' });
  let i = 0;
  const inicio = Date.now();
  // retoma de onde parou
  if (status !== 'concluida' && Object.keys(respondidos).length) { const prox = passos.findIndex(p => p.tipo === 'ex' && !respondidos[p.ex.id]); if (prox > 1) i = Math.max(1, prox); }

  const topo = h('div', { class: 'licao-topo' },
    h('button', { type: 'button', class: 'btn btn-texto btn-peq', 'aria-label': 'Sair da lição', on: { click: async () => { if (i === 0 || await confirmar({ titulo: 'Sair da lição?', texto: 'Seu progresso fica salvo e você continua de onde parou.', ok: 'Sair', cancelar: 'Continuar a lição' })) ir('#/hoje'); } } }, icone('x')),
    h('div', { class: 'barra-progresso', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': passos.length - 1 }, h('span')),
    h('button', { type: 'button', class: 'btn btn-texto btn-peq', 'aria-pressed': String(somLigado()), 'aria-label': 'Sons', on: { click: e => { const v = !somLigado(); localStorageSet('sons', v ? 'sim' : 'nao'); e.currentTarget.setAttribute('aria-pressed', String(v)); e.currentTarget.replaceChildren(icone(v ? 'speaker-high' : 'x'), h('span', { class: 'oculto' }, 'Sons')); } } }, icone(somLigado() ? 'speaker-high' : 'x'), h('span', { class: 'oculto' }, 'Sons')));
  const palco = h('div', { class: 'licao-palco' });
  el.append(topo, palco);

  const avancar = () => { i = Math.min(passos.length - 1, i + 1); desenhar(); };
  const barraBotao = (rotulo, acao = avancar) => h('div', { class: 'barra-acao barra-acao--fixa' }, h('div', { class: 'barra-acao__in' }, h('button', { type: 'button', class: 'btn btn-bloco', on: { click: acao } }, rotulo)));
  function desenhar() {
    const barra = topo.querySelector('.barra-progresso');
    barra.setAttribute('aria-valuenow', i);
    barra.firstChild.style.transform = `scaleX(${(i / (passos.length - 1)).toFixed(3)})`;
    const p = passos[i];
    const tela = h('div', { class: 'passo' });
    palco.replaceChildren(tela);
    if (p.tipo === 'intro') desenharIntro(tela);
    else if (p.tipo === 'bloco') desenharBloco(tela, p.b);
    else if (p.tipo === 'abre') tela.append(h('p', { class: 'rotulo-pequeno' }, p.b.titulo), h('h2', {}, p.b.tipo === 'escuta' ? 'Agora, ouvindo' : p.b.tipo === 'retomada' ? 'Lembra disso?' : p.b.tipo === 'rapidas' ? 'Rápido, sem pensar muito' : 'Hora de praticar'), p.b.texto ? h('p', {}, p.b.texto) : null, p.b.tipo === 'escuta' && p.b.devagar ? h('p', { class: 'ajuda' }, 'O áudio começa um pouco mais devagar. Depois de responder, você pode ver o texto.') : null, barraBotao('Vamos'));
    else if (p.tipo === 'ex') {
      if (p.b.tipo !== 'exercicios' || p.ex.tag) tela.append(h('p', { class: 'rotulo-pequeno' }, p.b.titulo));
      tela.append(exercicio(p.ex, {
        ja: respondidos[p.ex.id],
        devagar: !!p.b.devagar,
        responder: async (resposta, meta) => { const r = await api('/licao/responder', { metodo: 'POST', corpo: { itemId: p.ex.id, resposta, ...meta } }); respondidos[p.ex.id] = { ...r, resposta }; return r; },
        contestar: async () => (await api('/licao/contestar', { metodo: 'POST', corpo: { itemId: p.ex.id } })).mensagem,
        aoProximo: avancar,
        barraFixa: true,
      }));
    } else if (p.tipo === 'producao') desenharProducao(tela, p.b, p.bi);
    else desenharFim(tela);
    tela.querySelector('h1,h2')?.setAttribute('tabindex', '-1');
    if (p.tipo !== 'ex') tela.querySelector('h1,h2')?.focus({ preventScroll: true });
    scrollTo(0, 0);
  }

  function desenharIntro(tela) {
    tela.append(
      h('p', { class: 'rotulo-pequeno' }, 'Lição de hoje'),
      h('h1', {}, licao.missao ? licao.missao.titulo : 'Manter e ampliar'),
      licao.missao ? h('p', { class: 'ajuda' }, `Parte ${licao.missao.parte} de ${licao.missao.total}. Ao fim da missão: “${licao.missao.podeFazer}”`) : null,
      louFala('oi', h('p', { class: 'bilhete pequeno' }, 'Por que esta aula'), h('ul', { class: 'por-que' }, licao.porque.map(t => h('li', {}, t)))),
      barraBotao(status === 'concluida' ? 'Rever' : 'Começar'));
  }

  function exemplos(lista) {
    return h('ul', { class: 'exemplos' }, lista.map(e => {
      const en = typeof e === 'string' ? e : e.en;
      return h('li', {}, h('button', { type: 'button', class: 'btn-icone', 'aria-label': 'Ouvir', on: { click: () => falar(en) } }, icone('speaker-high')), h('span', {}, h('span', { lang: 'en' }, en), typeof e === 'string' ? null : h('small', {}, e.pt)));
    }));
  }

  function desenharBloco(tela, b) {
    if (b.tipo === 'foco') {
      const x = b.explicacao;
      tela.append(
        h('p', { class: 'rotulo-pequeno' }, 'Foco de hoje'),
        h('h2', {}, b.titulo),
        b.seu ? h('div', { class: 'folha pautado correcao-sua' }, h('p', { class: 'ajuda' }, `Você escreveu ${b.origem}:`), h('div', { class: 'correcao' }, h('span', { class: 'riscado', lang: 'en' }, b.seu.trecho), b.seu.correcao ? h('span', { class: 'nova', lang: 'en' }, b.seu.correcao) : null)) : null,
        b.tentativaAnterior ? h('p', { class: 'bilhete pequeno' }, b.tentativaAnterior) : h('p', { class: 'chip chip-neutro' }, ABORDAGEM[x.abordagem]),
        h('p', {}, x.texto),
        x.contraste ? h('div', { class: 'contraste' }, h('p', {}, h('small', {}, 'Português'), x.contraste.pt), h('p', { lang: 'en' }, h('small', {}, 'Inglês'), x.contraste.en)) : null,
        x.audios ? h('div', { class: 'linha-acoes' }, x.audios.map((a, k) => botaoOuvir(a, { rotulo: `Exemplo ${k + 1}`, velocidade: 0.9 }))) : null,
        x.exemplos ? exemplos(x.exemplos) : null,
        barraBotao('Praticar'));
    } else if (b.tipo === 'explicacao') {
      tela.append(
        h('p', { class: 'rotulo-pequeno' }, 'Entender'),
        h('h2', {}, b.titulo),
        h('p', {}, b.texto),
        h('div', { class: 'folha pautado estrutura' }, h('p', { class: 'bilhete pequeno' }, 'Estrutura'), h('ol', {}, b.estrutura.map(s => h('li', { lang: 'en' }, s)))),
        h('h3', {}, 'Exemplos'), exemplos(b.exemplos),
        h('h3', {}, 'Palavras e expressões'),
        h('ul', { class: 'vocab' }, b.vocab.map(v => h('li', {}, h('button', { type: 'button', class: 'btn-icone', 'aria-label': 'Ouvir', on: { click: () => falar(v.ex) } }, icone('speaker-high')), h('span', {}, h('span', { class: 'marca', lang: 'en' }, v.en), ' ', h('small', {}, v.pt), h('em', { lang: 'en' }, v.ex))))),
        h('p', { class: 'ajuda' }, 'Essas expressões viram cartões de revisão quando você terminar a lição.'),
        barraBotao('Praticar'));
    } else {
      tela.append(h('p', { class: 'rotulo-pequeno' }, 'Relembrando'), h('h2', {}, b.titulo), h('div', { class: 'folha pautado estrutura' }, h('ol', {}, b.estrutura.map(s => h('li', { lang: 'en' }, s)))), barraBotao('Continuar'));
    }
  }

  function desenharProducao(tela, b, bi) {
    let usouAjuda = false;
    const t = h('textarea', { id: 'prod', rows: 7, maxlength: 3000, lang: 'en', spellcheck: 'false', placeholder: 'Write in English...' });
    const cont = h('small', { 'aria-live': 'polite' }, `0 palavras (mínimo ${b.tarefa.minPalavras})`);
    t.addEventListener('input', () => { const n = (t.value.match(/[A-Za-z']+/g) || []).length; cont.textContent = `${n} ${n === 1 ? 'palavra' : 'palavras'} (mínimo ${b.tarefa.minPalavras})`; });
    const retorno = h('div', { class: 'retorno-producao', 'aria-live': 'polite' });
    const btn = h('button', { type: 'submit', class: 'btn' }, 'Enviar para correção');
    const dicas = b.tarefa.dicas?.length ? h('details', { class: 'dicas', on: { toggle: e => { if (e.target.open) usouAjuda = true; } } }, h('summary', {}, icone('lightbulb'), ' Ver dicas (conta como prática com ajuda)'), h('ul', {}, b.tarefa.dicas.map(d => h('li', { lang: 'en' }, d)))) : null;
    let mic = null;
    if (temMicrofone()) {
      let rec = null, base = '';
      mic = h('button', { type: 'button', class: 'btn btn-sec btn-peq', on: { click: () => {
        if (rec) { rec.stop(); return; }
        base = t.value ? t.value.trim() + ' ' : '';
        mic.lastChild.textContent = 'Parar';
        rec = ouvirMicrofone({ aoTexto: tx => { t.value = base + tx; t.dispatchEvent(new Event('input')); }, aoFim: () => { rec = null; mic.lastChild.textContent = 'Falar em vez de digitar'; } });
      } } }, icone('microphone'), h('span', {}, 'Falar em vez de digitar'));
    }
    const form = h('form', { on: { submit: async e => {
      e.preventDefault();
      if (!t.value.trim()) { t.focus(); return; }
      ocupado(btn, true);
      try {
        const r = await api('/licao/producao', { metodo: 'POST', corpo: { bloco: bi, texto: t.value, usouAjuda } });
        mostrarAvaliacao(retorno, r);
        btn.hidden = true;
        retorno.append(h('div', { class: 'linha-acoes' },
          h('button', { type: 'button', class: 'btn btn-sec', on: { click: () => { retorno.replaceChildren(); btn.hidden = false; t.focus(); } } }, 'Reescrever e enviar de novo'),
          h('button', { type: 'button', class: 'btn', on: { click: avancar } }, 'Continuar', icone('arrow-right'))));
        for (const c of r.conquistas || []) toast('Conquista: ' + nomeConquista(c), { tipo: 'ok' });
      } catch (err) { toast(err.message, { tipo: 'erro' }); }
      finally { ocupado(btn, false); }
    } } },
      h('div', { class: 'campo' }, h('label', { for: 'prod' }, 'Seu texto'), t, cont),
      h('div', { class: 'linha-acoes' }, mic, btn));
    tela.append(
      h('p', { class: 'rotulo-pequeno' }, b.reteste ? 'Teste em outra situação' : 'Sua vez'),
      h('h2', {}, b.titulo),
      h('div', { class: 'folha com-margem situacao' }, h('p', {}, b.situacao), b.area ? h('p', { class: 'ajuda' }, `Se puder, use exemplos da sua área (${b.area}).`) : null,
        b.tarefa.elementos?.length ? h('p', { class: 'ajuda' }, 'Inclua: ' + b.tarefa.elementos.join(' · ')) : null),
      b.semDicas ? h('p', { class: 'ajuda' }, 'Sem dicas desta vez: é para ver o que você já consegue sozinho. Tudo bem errar.') : dicas,
      form, retorno, h('button', { type: 'button', class: 'btn btn-texto', on: { click: avancar } }, 'Pular esta tarefa por hoje'));
  }

  function desenharFim(tela) {
    const total = passos.filter(p => p.tipo === 'ex').length;
    const certos = passos.filter(p => p.tipo === 'ex' && respondidos[p.ex.id]?.correto).length;
    const btn = h('button', { class: 'btn btn-bloco', on: { click: async () => {
      ocupado(btn, true);
      try {
        const r = await api('/licao/concluir', { metodo: 'POST' });
        for (const c of r.conquistas || []) toast('Conquista: ' + nomeConquista(c), { tipo: 'ok' });
        ir(r.revisoesPendentes ? '#/revisar' : '#/hoje');
      } catch (e) { toast(e.message, { tipo: 'erro' }); ocupado(btn, false); }
    } } }, status === 'concluida' ? 'Voltar' : 'Continuar');
    const pct = total ? Math.round(100 * certos / total) : 100;
    const minutos = Math.max(1, Math.round((Date.now() - inicio) / 60000));
    tela.classList.add('passo--fim');
    tela.append(
      lou('festa', { tamanho: 150 }),
      h('h2', { class: 'fim-titulo' }, pct >= 80 ? 'Lição concluída!' : 'Lição feita. Bom treino!'),
      h('div', { class: 'placar' },
        h('div', { class: 'placar__item placar__item--sol' }, h('span', {}, 'Pontos'), h('strong', {}, String(certos * 10 + 20))),
        h('div', { class: 'placar__item' }, h('span', {}, 'Acertos'), h('strong', {}, `${pct}%`)),
        h('div', { class: 'placar__item placar__item--azul' }, h('span', {}, 'Tempo'), h('strong', {}, `${minutos} min`))),
      h('p', {}, certos < total ? 'O que você errou não tira nada: vira revisão e volta de outro jeito.' : 'Tudo certo hoje.'),
      h('p', { class: 'ajuda' }, 'Lição concluída é prática. Aprendizado demonstrado é usar sozinho numa tarefa ou conversa.'),
      h('div', { class: 'barra-acao barra-acao--fixa' }, h('div', { class: 'barra-acao__in' }, btn)));
    if (status !== 'concluida') { som('fim'); confete(); }
  }

  desenhar();
}

export function mostrarAvaliacao(alvo, r) {
  const a = r.avaliacao;
  alvo.replaceChildren(
    r.aviso ? h('p', { class: 'aviso-suave' }, icone('info'), h('span', {}, r.aviso)) : null,
    h('div', { class: 'folha avaliacao' + (a.demonstrado ? ' avaliacao--ok' : '') },
      h('p', { class: 'bilhete' }, a.demonstrado ? 'Demonstrado!' : 'Corrigido'),
      h('p', {}, a.comentario),
      a.elementos?.length ? h('ul', { class: 'lista-check' }, a.elementos.map(e => h('li', { class: e.ok ? 'ok' : 'falta' }, icone(e.ok ? 'check' : 'x'), ' ', e.nome))) : null,
      (a.achados || []).length ? h('div', {}, h('h3', {}, 'Pontos para ajustar'), (a.achados || []).map(c => h('div', { class: 'correcao' },
        h('span', { class: 'riscado', lang: 'en' }, c.trecho), h('span', { class: 'nova', lang: 'en' }, c.sugestao), h('small', {}, c.explicacao, c.confianca === 'baixa' ? ' (não tenho certeza do que você quis dizer)' : '')))) : null,
      a.versaoMelhorada ? h('details', {}, h('summary', {}, 'Ver seu texto com ajustes'), h('p', { lang: 'en', class: 'pautado' }, a.versaoMelhorada)) : null,
      r.exemplo ? h('details', {}, h('summary', {}, 'Ver um exemplo de resposta'), h('p', { lang: 'en' }, r.exemplo)) : null,
      a.modo === 'regras' ? h('p', { class: 'ajuda' }, 'Correção automática básica: confere a estrutura e os erros mais comuns. Com o tutor de IA ativo, a correção é mais completa.') : null,
      r.evento === 'retido' ? h('p', { class: 'chip chip-ok' }, icone('seal-check'), ' Missão mantida: você usou de novo, dias depois, sem ajuda') : null,
      r.evento === 'foco_superado' ? h('p', { class: 'chip chip-ok' }, icone('seal-check'), ' Dificuldade superada nesta situação') : null,
      r.evento === 'voltou_pratica' ? h('p', { class: 'ajuda' }, 'Ainda não firmou, e tudo bem. A missão volta para a prática com outro caminho.') : null));
}
