// Lição do dia: um passo por tela. Começa explicando o PORQUÊ da aula de hoje.
import { api } from '../api.js?v=__V__';
import { h, icone, falar, falarPt, botaoOuvir, ocupado, toast, confirmar, temMicrofone, ouvirMicrofone, janela } from '../ui.js?v=__V__';
import { exercicio } from './exercicio.js?v=__V__';
import { nomeConquista } from './hoje.js?v=__V__';
import { lou, louFala, som, confete, botaoSom, pontosFlutuantes, contar, vibrar } from '../diversao.js?v=__V__';
import { companheirosAula } from '../companheiros.js?v=__V__';

// cada tipo de passo tem cor e ícone fixos: a pessoa enxerga a estrutura da aula (entender, praticar, ouvir, sua vez)
const ETAPAS = {
  intro: ['azul', 'play', 'Aula de hoje'], foco: ['coral', 'target', 'Foco de hoje'], explicacao: ['azul', 'book-open-text', 'Entender'], lembrete: ['sol', 'repeat', 'Relembrar'],
  exercicios: ['lilas', 'pencil-simple', 'Praticar'], escuta: ['turquesa', 'headphones', 'Ouvir'], retomada: ['sol', 'arrow-counter-clockwise', 'Lembra disso?'], rapidas: ['coral', 'clock', 'Rapidinho'],
  producao: ['menta', 'note-pencil', 'Sua vez'], reteste: ['menta', 'seal-check', 'Desafio'],
};
const etapaDe = b => ETAPAS[b?.tipo === 'producao' && b.reteste ? 'reteste' : b?.tipo] || ETAPAS.exercicios;
export function etapa(chave, texto) {
  const [cor, ic, rot] = typeof chave === 'string' ? ETAPAS[chave] : etapaDe(chave);
  return h('p', { class: `etapa c-${cor}` }, h('span', { class: 'bolha' }, icone(ic)), texto || rot);
}

const ABORDAGEM = { regra: 'A regra direta', contraste: 'Comparando com o português', exemplos: 'Pelos exemplos', escuta: 'Ouvindo' };

export async function telaLicao(el, { ir }) {
  const infantil = document.body.dataset.publico === 'crianca';
  const { licao, respondidos, status } = await api('/licao');
  // monta a sequência de passos
  const passos = [{ tipo: 'intro' }];
  licao.blocos.forEach((b, bi) => {
    if (b.tipo === 'explicacao' && b.guiada) b.vocab.forEach((v, vi) => passos.push({ tipo: 'palavra', v, vi, b, bi }));
    else if (['foco', 'explicacao', 'lembrete'].includes(b.tipo)) passos.push({ tipo: 'bloco', b, bi });
    if (!licao.guiada && ['exercicios', 'escuta', 'retomada', 'rapidas'].includes(b.tipo)) passos.push({ tipo: 'abre', b, bi });
    for (const ex of b.exercicios || []) passos.push({ tipo: 'ex', ex, b, bi });
    if (b.tipo === 'producao') passos.push({ tipo: 'producao', b, bi });
  });
  passos.push({ tipo: 'fim' });
  let i = 0;
  const inicio = Date.now();
  // combo: acertos seguidos. Nunca pune: errar só zera o contador, sem som feio nem perda de pontos
  let combo = 0, melhorCombo = 0;
  const chipCombo = h('span', { class: 'combo', hidden: true, 'aria-live': 'polite' }, icone('flame'), h('b', {}, '0'), h('span', { class: 'oculto' }, ' acertos seguidos'));
  function marcarCombo(certo, xp = 0) {
    combo = certo ? combo + 1 : 0;
    melhorCombo = Math.max(melhorCombo, combo);
    chipCombo.hidden = combo < 2;
    // o Tuiuiú da barra reage: pula quando acerta, balança quando erra
    const mascote = topo.querySelector('.trilho__lou');
    mascote.classList.remove('trilho__lou--pula', 'trilho__lou--ops'); void mascote.offsetWidth; mascote.classList.add(certo ? 'trilho__lou--pula' : 'trilho__lou--ops');
    if (certo && xp) pontosFlutuantes(mascote, `+${xp} XP`);
    chipCombo.querySelector('b').textContent = String(combo);
    chipCombo.classList.remove('combo--pula'); void chipCombo.offsetWidth; chipCombo.classList.add('combo--pula');
  }
  // retoma de onde parou
  if (status !== 'concluida' && Object.keys(respondidos).length) { const prox = passos.findIndex(p => p.tipo === 'ex' && !respondidos[p.ex.id]); if (prox > 1) i = Math.max(1, prox); }

  const topo = h('div', { class: 'licao-topo' },
    h('button', { type: 'button', class: 'btn btn-texto btn-peq', 'aria-label': 'Sair da lição', on: { click: async () => { if (i === 0 || await confirmar({ titulo: 'Sair da lição?', texto: 'Seu progresso fica salvo e você continua de onde parou.', ok: 'Sair', cancelar: 'Continuar a lição' })) ir('#/hoje'); } } }, icone('x')),
    h('div', { class: 'trilho', role: 'progressbar', 'aria-label': 'Progresso da aula', 'aria-valuemin': 0, 'aria-valuemax': passos.length - 1 }, h('span', { class: 'trilho__cheio' }), h('span', { class: 'trilho__lou' }, lou('feliz', { tamanho: 38, rotulo: '' }))),
    chipCombo,
    botaoSom());
  const palco = h('div', { class: 'licao-palco' });
  const contador = h('p', { class: 'licao-contador', 'aria-live': 'polite' });
  const palavras = licao.blocos.filter(b => b.tipo === 'explicacao').flatMap(b => b.vocab || []);
  const apoio = h('div', { class: 'licao-apoio' }, contador,
    palavras.length ? h('button', { type: 'button', class: 'btn btn-texto btn-peq', on: { click: () => janela({ titulo: 'Palavras desta aula', corpo: h('div', {}, h('p', {}, 'Olhe o significado e ouça de novo quando precisar.'), exemplos(palavras)) }) } }, icone('book-open-text'), 'Rever palavras') : null);
  el.append(topo, apoio, palco);

  const avancar = () => { i = Math.min(passos.length - 1, i + 1); desenhar(); };
  const barraBotao = (rotulo, acao = avancar) => h('div', { class: 'barra-acao barra-acao--fixa' }, h('div', { class: 'barra-acao__in' }, h('button', { type: 'button', class: 'btn btn-bloco', on: { click: acao } }, rotulo)));
  function desenhar() {
    const barra = topo.querySelector('.trilho');
    barra.setAttribute('aria-valuenow', i);
    barra.style.setProperty('--p', (i / (passos.length - 1)).toFixed(3));
    const p = passos[i];
    contador.textContent = p.tipo === 'palavra' ? `Aprender: palavra ${p.vi + 1} de ${p.b.vocab.length}` : p.tipo === 'ex' ? `Atividade ${passos.slice(0, i + 1).filter(x => x.tipo === 'ex').length} de ${passos.filter(x => x.tipo === 'ex').length}` : p.tipo === 'fim' ? 'Você chegou ao fim!' : 'Um passo de cada vez';
    const tela = h('div', { class: 'passo' });
    palco.replaceChildren(tela);
    if (p.tipo === 'intro') desenharIntro(tela);
    else if (p.tipo === 'palavra') desenharPalavra(tela, p);
    else if (p.tipo === 'bloco') desenharBloco(tela, p.b);
    else if (p.tipo === 'abre') {
      const [cor, ic] = etapaDe(p.b);
      tela.append(h('div', { class: `abre c-${cor}` }, h('span', { class: 'bolha' }, icone(ic)), h('p', { class: 'rotulo-pequeno' }, p.b.titulo),
        h('h2', {}, p.b.tipo === 'escuta' ? 'Agora, ouvindo' : p.b.tipo === 'retomada' ? 'Lembra disso?' : p.b.tipo === 'rapidas' ? 'Rápido, sem pensar muito' : 'Hora de praticar'),
        p.b.texto ? h('p', {}, p.b.texto) : null, p.b.tipo === 'escuta' && p.b.devagar ? h('p', { class: 'ajuda' }, 'O áudio começa um pouco mais devagar. Depois de responder, você pode ver o texto.') : null), barraBotao('Vamos'));
    }
    else if (p.tipo === 'ex') {
      tela.append(etapa(p.b, p.b.tipo !== 'exercicios' || p.ex.tag ? p.b.titulo : null));
      tela.append(exercicio(p.ex, {
        ja: respondidos[p.ex.id],
        devagar: !!p.b.devagar,
        responder: async (resposta, meta) => { const r = await api('/licao/responder', { metodo: 'POST', corpo: { itemId: p.ex.id, resposta, ...meta } }); if (!r.pratica) { respondidos[p.ex.id] = { ...r, resposta }; if (!r.repetida) marcarCombo(r.correto && !r.ajuda, r.recompensa?.xp || 0); } return { ...r, sequencia: !r.pratica && !r.repetida ? combo : 0 }; },
        contestar: async () => (await api('/licao/contestar', { metodo: 'POST', corpo: { itemId: p.ex.id } })).mensagem,
        aoProximo: avancar,
        barraFixa: true,
        permitirTreino: true,
      }));
    } else if (p.tipo === 'producao') desenharProducao(tela, p.b, p.bi);
    else desenharFim(tela);
    tela.querySelector('h1,h2')?.setAttribute('tabindex', '-1');
    if (p.tipo !== 'ex') tela.querySelector('h1,h2')?.focus({ preventScroll: true });
    scrollTo(0, 0);
  }

  function desenharIntro(tela) {
    tela.append(
      etapa('intro'),
      h('h1', {}, licao.missao ? licao.missao.titulo : 'Manter e ampliar'),
      licao.missao ? h('p', { class: 'ajuda' }, `Parte ${licao.missao.parte} de ${licao.missao.total}. ${licao.missao.podeFazer}`) : null,
      licao.guiada ? companheirosAula({ texto: licao.reforco ? 'Vamos rever com mais apoio, sem pressa. Eu explico e o Tuiuiú pratica com você.' : infantil ? `Hoje são ${palavras.length} palavras e ${passos.filter(p => p.tipo === 'ex').length} atividades curtinhas. Eu e o Tuiuiú vamos com você!` : `${palavras.length} expressões úteis e ${passos.filter(p => p.tipo === 'ex').length} atividades curtas. Eu ajudo com as explicações e o Tuiuiú acompanha a prática.` }).elemento : louFala('oi', h('p', { class: 'bilhete pequeno' }, 'Por que esta aula'), h('ul', { class: 'por-que' }, licao.porque.map(t => h('li', {}, t)))),
      licao.guiada ? h('ol', { class: 'como-aprender' }, h('li', {}, icone('speaker-high'), h('span', {}, 'Veja, ouça e descubra o significado.')), h('li', {}, icone('hand-waving'), h('span', {}, 'Toque nas respostas. Pode pedir uma dica.')), h('li', {}, icone('smiley'), h('span', {}, 'Errou? Veja a explicação e tente de novo.'))) : null,
      barraBotao(status === 'concluida' ? 'Rever a aula' : 'Vamos aprender'));
  }

  function desenharPalavra(tela, { v, b }) {
    const exemplo = b.exemplos?.find(e => e.en === v.ex);
    tela.append(etapa('explicacao', 'Vamos aprender'),
      companheirosAula({ texto: infantil ? 'Vamos descobrir uma palavra! Ouça o som, veja o significado e repita com a gente.' : 'Associe o som ao significado. Ouça a palavra e observe como ela aparece no exemplo.' }).elemento,
      h('section', { class: 'palavra-nova' },
        v.imagem ? h('span', { class: 'palavra-nova__imagem', 'aria-hidden': 'true' }, v.imagem) : lou('oi', { tamanho: 90, rotulo: '' }),
        h('p', { class: 'rotulo-pequeno' }, 'Em inglês'),
        h('h1', { lang: 'en', 'data-traducao': v.pt }, v.en),
        h('p', { class: 'palavra-nova__significado' }, v.pt),
        h('div', { class: 'linha-acoes' },
          h('button', { type: 'button', class: 'btn', on: { click: () => falar(v.en, { velocidade: 0.9 }) } }, icone('speaker-high'), 'Ouvir palavra'),
          h('button', { type: 'button', class: 'btn btn-sec', on: { click: () => falar(v.en, { velocidade: 0.65 }) } }, icone('speaker-high'), 'Mais devagar')),
        h('p', { class: 'ajuda' }, 'Toque na palavra para ver a tradução. Repita em voz alta se quiser.'),
        v.ex && v.ex.replace(/[.!?]/g, '').toLowerCase() !== v.en.toLowerCase() ? h('div', { class: 'palavra-nova__exemplo' }, h('p', { class: 'rotulo-pequeno' }, 'Veja um exemplo'), h('p', { lang: 'en', 'data-traducao': exemplo?.pt || null }, v.ex), exemplo ? h('p', {}, exemplo.pt) : null, h('button', { type: 'button', class: 'btn btn-texto btn-peq', on: { click: () => falar(v.ex, { velocidade: 0.8 }) } }, icone('speaker-high'), 'Ouvir exemplo')) : null),
      h('details', { class: 'ajuda-exercicio' }, h('summary', {}, 'Entender melhor'), h('p', {}, b.texto), h('button', { type: 'button', class: 'btn btn-texto btn-peq', on: { click: () => falarPt(b.texto) } }, icone('speaker-high'), 'Ler para mim')),
      barraBotao('Continuar'));
  }

  function exemplos(lista) {
    return h('ul', { class: 'exemplos' }, lista.map(e => {
      const en = typeof e === 'string' ? e : e.en;
      return h('li', {}, h('button', { type: 'button', class: 'btn-icone', 'aria-label': 'Ouvir ' + en, on: { click: () => falar(en) } }, icone('speaker-high')), h('span', {}, h('span', { lang: 'en', 'data-traducao': typeof e === 'string' ? null : e.pt }, en), typeof e === 'string' ? null : h('small', {}, e.pt)));
    }));
  }

  function desenharBloco(tela, b) {
    if (b.tipo === 'foco') {
      const x = b.explicacao;
      tela.append(
        etapa('foco'),
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
        etapa('explicacao'),
        h('h2', {}, b.titulo),
        h('p', {}, b.texto),
        h('div', { class: 'folha pautado estrutura' }, h('p', { class: 'bilhete pequeno' }, 'Estrutura'), h('ol', {}, b.estrutura.map(s => h('li', { lang: 'en' }, s)))),
        h('h3', {}, 'Exemplos'), exemplos(b.exemplos),
        h('h3', {}, 'Palavras e expressões'),
        h('ul', { class: 'vocab' }, b.vocab.map(v => h('li', {}, h('button', { type: 'button', class: 'btn-icone', 'aria-label': 'Ouvir', on: { click: () => falar(v.ex) } }, icone('speaker-high')), h('span', {}, h('span', { class: 'marca', lang: 'en' }, v.en), ' ', h('small', {}, v.pt), h('em', { lang: 'en' }, v.ex))))),
        h('p', { class: 'ajuda' }, 'Essas expressões viram cartões de revisão quando você terminar a lição.'),
        barraBotao('Praticar'));
    } else {
      tela.append(etapa('lembrete'), h('h2', {}, b.titulo), h('div', { class: 'folha pautado estrutura' }, h('ol', {}, b.estrutura.map(s => h('li', { lang: 'en' }, s)))), barraBotao('Continuar'));
    }
  }

  function desenharProducao(tela, b, bi) {
    let usouAjuda = false;
    tela.addEventListener('inglou:traducao', () => { usouAjuda = true; });
    const t = h('textarea', { id: 'prod', rows: b.guiada ? 3 : 7, maxlength: 3000, lang: 'en', spellcheck: 'false', placeholder: 'Escreva em inglês. Pode olhar as dicas.' });
    const cont = h('small', { 'aria-live': 'polite' }, `0 palavras (mínimo ${b.tarefa.minPalavras})`);
    t.addEventListener('input', () => { const n = (t.value.match(/[A-Za-z']+/g) || []).length; cont.textContent = `${n} ${n === 1 ? 'palavra' : 'palavras'} (mínimo ${b.tarefa.minPalavras})`; });
    const retorno = h('div', { class: 'retorno-producao', 'aria-live': 'polite' });
    const btn = h('button', { type: 'submit', class: 'btn' }, 'Enviar para correção');
    const dicas = b.tarefa.dicas?.length ? h('details', { class: 'dicas', on: { toggle: e => { if (e.target.open) usouAjuda = true; } } }, h('summary', {}, icone('lightbulb'), ' Me dê uma pista'), h('ul', {}, b.tarefa.dicas.map(d => h('li', {}, d)))) : null;
    const modelo = b.tarefa.modelo ? h('details', { class: 'ajuda-exercicio', on: { toggle: e => { if (e.target.open) usouAjuda = true; } } }, h('summary', {}, icone('eye'), 'Ver um exemplo para me ajudar'), h('p', { lang: 'en' }, b.tarefa.modelo), h('button', { type: 'button', class: 'btn btn-texto btn-peq', on: { click: () => falar(b.tarefa.modelo, { velocidade: 0.8 }) } }, icone('speaker-high'), 'Ouvir exemplo')) : null;
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
      etapa(b, b.reteste ? 'Desafio em outra situação' : null),
      h('h2', {}, b.titulo),
      h('div', { class: 'folha com-margem situacao' }, h('p', {}, b.situacao), b.area ? h('p', { class: 'ajuda' }, `Se puder, use exemplos da sua área (${b.area}).`) : null,
        b.tarefa.elementos?.length ? h('p', { class: 'ajuda' }, 'Inclua: ' + b.tarefa.elementos.join(' · ')) : null),
      b.semDicas ? h('p', { class: 'ajuda' }, 'Sem dicas desta vez: é para ver o que você já consegue sozinho. Tudo bem errar.') : h('div', { class: 'ajudas-exercicio' }, dicas, modelo),
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
        ir(licao.guiada ? '#/hoje' : r.revisoesPendentes ? '#/revisar' : '#/hoje');
      } catch (e) { toast(e.message, { tipo: 'erro' }); ocupado(btn, false); }
    } } }, status === 'concluida' ? 'Voltar para o início' : 'Concluir aula');
    const pct = total ? Math.round(100 * certos / total) : 100;
    const minutos = Math.max(1, Math.round((Date.now() - inicio) / 60000));
    tela.classList.add('passo--fim');
    tela.append(
      companheirosAula({ fase: 'fim', silencioso: status === 'concluida' }).elemento,
      h('h2', { class: 'fim-titulo' }, infantil && pct >= 80 ? 'Figurinha colada!' : 'Aula concluída. Bom trabalho!'),
      h('p', { class: 'chip c-lilas' }, icone('book-open-text'), infantil ? 'Mais uma figurinha no seu álbum' : 'Mais uma etapa da sua aprendizagem'),
      licao.guiada ? h('p', { class: 'ajuda' }, 'Você praticou mais um pouquinho. Cada palavra aprendida conta!') : h('div', { class: 'placar' },
        h('div', { class: 'placar__item' }, h('span', {}, 'Acertos'), h('strong', {}, `${pct}%`)),
        melhorCombo >= 3 ? h('div', { class: 'placar__item placar__item--coral' }, h('span', {}, 'Melhor combo'), h('strong', {}, `x${melhorCombo}`)) : null,
        h('div', { class: 'placar__item placar__item--azul' }, h('span', {}, 'Tempo'), h('strong', {}, `${minutos} min`))),
      palavras.length ? h('section', { class: 'relembre-aula' }, h('h3', {}, infantil ? 'Olha o que você aprendeu!' : 'Vocabulário para usar no dia a dia'), exemplos(palavras)) : null,
      certos < total ? h('details', { class: 'ajuda-exercicio' }, h('summary', {}, 'Rever as respostas para aprender mais'), passos.filter(p => p.tipo === 'ex' && respondidos[p.ex.id] && !respondidos[p.ex.id].correto).map(p => { const r = respondidos[p.ex.id]; return h('div', { class: 'resumo-resposta' }, h('strong', {}, p.ex.enunciado || p.ex.pergunta || 'Prática de palavras'), h('p', { lang: r.audioResposta ? 'en' : null, 'data-traducao': r.traducao || null }, r.fraseCompleta || r.esperado), h('p', {}, r.explica)); })) : null,
      licao.guiada ? null : h('p', { class: 'ajuda' }, 'Lição concluída é prática. Aprendizado demonstrado é usar sozinho numa tarefa ou conversa.'),
      h('div', { class: 'barra-acao barra-acao--fixa' }, h('div', { class: 'barra-acao__in' }, btn)));
    for (const n of tela.querySelectorAll('[data-conta]')) contar(n, Number(n.dataset.conta), { sufixo: n.dataset.sufixo || '' });
    if (status !== 'concluida') { som('fim'); vibrar([30, 40, 30, 40, 60]); confete(); setTimeout(() => confete(document.body, 30), 450); }
  }

  desenhar();
}

export function mostrarAvaliacao(alvo, r) {
  const a = r.avaliacao;
  alvo.replaceChildren(
    companheirosAula({ fase: a.demonstrado ? 'superacao' : 'apoio', texto: a.demonstrado ? 'Você usou o inglês nesta situação. Vamos olhar juntos o que já funcionou bem.' : 'A Mia ajuda com os ajustes e o Tuiuiú incentiva mais uma tentativa. Confira a correção abaixo.' }).elemento,
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
