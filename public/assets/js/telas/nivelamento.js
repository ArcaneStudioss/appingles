// Teste de nivelamento: uma pergunta por tela, "não sei" sem culpa, escrita e fala opcionais, resultado com incerteza.
import { api } from '../api.js?v=__V__';
import { h, ocupado, icone, pararVoz, temVoz, temMicrofone, ouvirMicrofone, toast, confirmar, reduzirMovimento } from '../ui.js?v=__V__';
import { lou, louFala, som, confete, botaoSom, vibrar } from '../diversao.js?v=__V__';
import { caixaEscuta } from './exercicio.js?v=__V__';

const NOMES = { gramatica: 'Gramática', vocabulario: 'Vocabulário', leitura: 'Leitura', escuta: 'Escuta', escrita: 'Escrita', fala: 'Fala' };
const NIVEIS = ['A1', 'A2', 'B1', 'B2', 'C1'];
const DESCR = { A1: 'Primeiros passos: frases bem simples do dia a dia.', A2: 'Básico: se comunica em situações simples e conhecidas.', B1: 'Intermediário: se vira na maioria das situações e conta experiências.', B2: 'Intermediário avançado: discute assuntos com certa naturalidade.', C1: 'Avançado: usa o inglês com flexibilidade no trabalho e nos estudos.' };

export async function telaNivelamento(el, { estado, ir, carregarEu }) {
  const { itens, abertas, anterior } = await api('/nivelamento');
  const respostas = {};
  let i = -1, escrita = '', fala = '', inicioItem = 0;
  const caixa = h('div', { class: 'nivelamento' });
  const palco = h('div', { class: 'nivelamento__palco' });
  let teclaAtual = null;

  // topo da pergunta: sair (só quem está refazendo), trilho com o Tuiuiú andando e o botão de sons
  const trilho = h('div', { class: 'trilho', role: 'progressbar', 'aria-label': 'Progresso do teste', 'aria-valuemin': 0, 'aria-valuemax': itens.length }, h('span', { class: 'trilho__cheio' }), h('span', { class: 'trilho__lou' }, lou('feliz', { tamanho: 38, rotulo: '' })));
  const topo = h('div', { class: 'licao-topo nivelamento__topo', hidden: true },
    anterior ? h('button', { type: 'button', class: 'btn btn-texto btn-peq', 'aria-label': 'Sair do teste', on: { click: async () => { if (await confirmar({ titulo: 'Sair do teste?', texto: 'As respostas deste teste não ficam salvas. Seu resultado anterior continua valendo.', ok: 'Sair', cancelar: 'Continuar o teste' })) ir('#/hoje'); } } }, icone('x')) : null,
    trilho, botaoSom());
  caixa.append(topo, palco);
  el.append(caixa);
  const teclas = e => {
    if (!caixa.isConnected) { document.removeEventListener('keydown', teclas); return; }
    if (e.target.matches?.('input,textarea') || e.ctrlKey || e.metaKey || e.altKey) return;
    const n = Number(e.key);
    if (teclaAtual && n >= 1 && n <= 9) { teclaAtual(n - 1); e.preventDefault(); }
  };
  document.addEventListener('keydown', teclas);
  const mostrar = (...nos) => { teclaAtual = null; pararVoz(); topo.hidden = true; palco.replaceChildren(...nos); };

  // quem escolheu "Começar do zero" no perfil não precisa de teste: o caminho sem teste vira o botão principal
  const doZero = estado?.eu?.perfil?.objetivo === 'zero' && !anterior;

  function intro() {
    const botaoTeste = h('button', { type: 'button', class: doZero ? 'btn btn-texto btn-bloco' : 'btn btn-bloco', on: { click: () => { i = 0; som('comecar'); pergunta(); } } }, doZero ? 'Já sei um pouco: fazer o teste' : 'Começar', doZero ? null : icone('arrow-right'));
    const botaoZero = h('button', { type: 'button', class: doZero ? 'btn btn-bloco' : 'btn btn-texto btn-bloco', on: { click: () => nuncaEstudei(doZero) } }, icone('smiley'), doZero ? 'Começar do zero, sem teste' : 'Nunca estudei inglês: começar do zero');
    mostrar(
      louFala('pensando', h('p', {}, anterior ? 'Refazendo o teste? Ótimo para ver a evolução.' : doZero ? 'Você disse que está começando. Então nada de teste: vamos direto ao primeiro passo!' : 'Antes de montar o plano, quero tirar um retrato de agora. Sem pressão!')),
      h('h1', {}, doZero ? 'Vamos começar?' : 'Teste de nível'),
      doZero ? h('ul', { class: 'lista-check' },
        h('li', {}, 'Começamos pelos sons e cumprimentos, bem devagar, com muito áudio.'),
        h('li', {}, 'Lições de uns 10 minutos, com explicação em português.'),
        h('li', {}, 'Se ficar fácil demais, o app percebe e ajusta o ritmo.'))
      : h('ul', { class: 'lista-check' },
        h('li', {}, `${itens.length} perguntas rápidas de gramática, vocabulário, leitura e escuta (uns 8 minutos).`),
        h('li', {}, 'Escrita e fala no fim, se você quiser.'),
        h('li', {}, 'Não sabe? Toque em "Não sei". Chutar só deixa o plano pior para você.'),
        h('li', {}, 'O resultado é uma estimativa para montar o plano, não um certificado.')),
      doZero ? null : h('div', { class: 'folha teste-audio' },
        h('p', {}, 'As perguntas de escuta usam a voz do Tuiuiú. Teste o som:'),
        caixaEscuta('Hello! Can you hear me well?', { velocidade: 0.95, simples: true }),
        temVoz() ? null : h('p', { class: 'ajuda' }, 'Se não ouvir nada, confira o volume. Em alguns aparelhos a voz em inglês precisa ser instalada nas configurações.')),
      ...(doZero ? [botaoZero, botaoTeste] : [botaoTeste, anterior ? null : botaoZero]));
  }

  function atualizarTrilho() {
    trilho.setAttribute('aria-valuenow', i);
    trilho.style.setProperty('--p', (i / itens.length).toFixed(3));
  }

  function pergunta(direcao = 'frente') {
    if (i >= itens.length) { i = itens.length; atualizarTrilho(); return abertaEscrita(); }
    const it = itens[i];
    pararVoz();
    inicioItem = performance.now();
    let travado = false;
    const sair = () => {
      cartao.classList.add('pergunta--saindo');
      setTimeout(() => { if (caixa.isConnected) { i++; pergunta('frente'); } }, reduzirMovimento() ? 0 : 170);
    };
    const responder = (resposta, naoSei = false, botao = null) => {
      if (travado) return; travado = true;
      respostas[it.id] = { resposta, naoSei, tempoMs: Math.round(performance.now() - inicioItem) };
      som(naoSei ? 'tirar' : 'toque'); vibrar(8); pararVoz();
      botao?.classList.add('escolhida'); botao?.setAttribute('aria-checked', 'true');
      cartao.classList.add('is-respondida');
      setTimeout(() => { if (caixa.isConnected) { som('avancar'); sair(); } }, reduzirMovimento() ? 0 : 360);
    };
    const corpo = [];
    if (it.tipo === 'leitura') corpo.push(h('blockquote', { class: 'texto-leitura', lang: 'en' }, it.texto), h('p', { class: 'enunciado' }, it.pergunta));
    else if (it.tipo === 'escuta') corpo.push(caixaEscuta(it.audio, { velocidade: it.velocidade, simples: true }), h('p', { class: 'enunciado' }, it.pergunta));
    else corpo.push(h('p', { class: 'enunciado', lang: it.enunciado && /[a-z]/i.test(it.enunciado) && !/[ãçé]/.test(it.enunciado) ? 'en' : 'pt-BR' }, it.enunciado));
    const botoes = it.opcoes.map((o, k) => h('button', { type: 'button', class: 'opcao', role: 'radio', 'aria-checked': 'false', style: `--k:${k}`, lang: it.tipo === 'escolha' && /^[A-Za-z]/.test(o) && !/[ãçéáíóú]/.test(o) ? 'en' : null, on: { click: e => responder(o, false, e.currentTarget) } }, h('span', { class: 'opcao__tecla', 'aria-hidden': 'true' }, String(k + 1)), h('span', {}, o)));
    const cartao = h('div', { class: `pergunta pergunta--${direcao}` },
      h('p', { class: 'pergunta__numero' }, `${i + 1} de ${itens.length}`),
      h('div', { class: 'pergunta__corpo' }, corpo),
      h('div', { class: 'opcoes', role: 'radiogroup', 'aria-label': 'Alternativas' }, botoes),
      h('div', { class: 'linha-acoes pergunta__rodape' },
        h('button', { type: 'button', class: 'btn btn-texto', on: { click: () => responder('', true, null) } }, 'Não sei'),
        i > 0 ? h('button', { type: 'button', class: 'btn btn-texto', on: { click: () => { if (travado) return; travado = true; som('voltar'); i--; pergunta('tras'); } } }, icone('caret-left'), 'Voltar') : null));
    mostrar(cartao);
    topo.hidden = false;
    atualizarTrilho();
    teclaAtual = k => botoes[k]?.click();
    if (it.tipo !== 'escuta') botoes[0]?.focus({ preventScroll: true });   // com áudio, o foco fica no botão de ouvir
  }

  function abertaEscrita() {
    const t = h('textarea', { id: 'n-escrita', rows: 5, maxlength: 2000, lang: 'en', spellcheck: 'false', placeholder: 'Hi, my name is...' });
    t.value = escrita;
    mostrar(
      h('p', { class: 'chip chip-neutro' }, 'Escrita (opcional)'),
      h('h2', {}, abertas.escrita.enunciado),
      h('div', { class: 'campo' }, h('label', { for: 'n-escrita', class: 'oculto' }, 'Seu texto'), t, h('small', {}, 'Sem tradutor, por favor: erros nos ajudam a te conhecer.')),
      h('div', { class: 'linha-acoes' },
        h('button', { type: 'button', class: 'btn btn-sec', on: { click: () => { escrita = ''; abertaFala(); } } }, 'Pular'),
        h('button', { type: 'button', class: 'btn', on: { click: () => { escrita = t.value; abertaFala(); } } }, 'Continuar', icone('arrow-right'))));
  }

  function abertaFala() {
    if (!temMicrofone()) return enviar();
    const saida = h('p', { class: 'ajuda', 'aria-live': 'polite' }, fala ? 'Gravado. Pode regravar se quiser.' : '');
    let rec = null;
    const gravar = h('button', { type: 'button', class: 'btn btn-sec', on: { click: () => {
      if (rec) { rec.stop(); return; }
      gravar.lastChild.textContent = 'Parar'; fala = ''; saida.textContent = 'Estou ouvindo... leia com calma, a frase inteira.';
      rec = ouvirMicrofone({ alvo: abertas.fala.alvo, aoTexto: t => { fala = t; }, aoFim: () => { rec = null; gravar.lastChild.textContent = 'Gravar de novo'; saida.textContent = fala ? 'Gravado! Pode regravar se quiser.' : 'Não consegui ouvir. Tente de novo mais perto do microfone, ou pule.'; } });
    } } }, icone('microphone'), h('span', {}, 'Gravar'));
    mostrar(
      h('p', { class: 'chip chip-neutro' }, 'Fala (opcional)'),
      h('h2', {}, 'Leia em voz alta'),
      h('blockquote', { class: 'texto-leitura', lang: 'en' }, abertas.fala.alvo + '.'),
      gravar, saida,
      h('p', { class: 'ajuda' }, 'O reconhecimento de voz é feito pelo seu navegador (no Chrome, pelo serviço do Google). Não guardamos o áudio, só o texto reconhecido. Sotaque não é erro: medimos se dá para entender.'),
      h('div', { class: 'linha-acoes' },
        h('button', { type: 'button', class: 'btn btn-sec', on: { click: () => { fala = ''; enviar(); } } }, 'Pular'),
        h('button', { type: 'button', class: 'btn', on: { click: enviar } }, 'Ver meu resultado')));
  }

  async function nuncaEstudei(jaEscolheu = false) {
    if (!jaEscolheu && !await confirmar({ titulo: 'Começar do zero?', texto: 'Pulamos o teste e começamos pelos sons e cumprimentos, bem devagar. Se ficar fácil demais, o app ajusta.', ok: 'Começar do zero', cancelar: 'Voltar' })) return;
    mostrar(h('div', { class: 'folha vazio' }, h('p', { class: 'bilhete' }, 'Montando seu plano...')));
    try {
      const r = await api('/nivelamento', { metodo: 'POST', corpo: { nunca: true } });
      await carregarEu();
      resultado(r.resultado, r.plano);
    } catch (e) { toast(e.message, { tipo: 'erro' }); intro(); }
  }

  async function enviar() {
    mostrar(h('div', { class: 'folha vazio' }, h('p', { class: 'bilhete' }, 'Corrigindo...'), h('p', {}, 'Montando seu diagnóstico e o seu plano.')));
    try {
      const r = await api('/nivelamento', { metodo: 'POST', corpo: { respostas, escrita, fala } });
      await carregarEu();
      resultado(r.resultado, r.plano);
    } catch (e) {
      toast(e.message, { tipo: 'erro' });
      mostrar(h('div', { class: 'folha vazio' }, h('p', {}, e.message), h('button', { class: 'btn', on: { click: enviar } }, 'Tentar de novo')));
    }
  }

  function resultado(r, plano) {
    som('fim'); confete();
    const hab = Object.entries(r.porHabilidade);
    mostrar(
      louFala('feliz', h('p', {}, 'Pronto! Aqui está o retrato de hoje.')),
      h('div', { class: 'folha resultado-nivel' },
        h('p', { class: 'chip' }, 'Nível estimado'),
        h('p', { class: 'nivel-grande' }, r.nivel),
        h('p', {}, DESCR[r.nivel]),
        h('p', { class: 'ajuda' }, r.aviso, r.confianca === 'baixa' && !r.nuncaEstudou ? ' Como você respondeu poucas perguntas, a confiança é baixa.' : '')),
      hab.length ? h('h2', {}, 'Por habilidade') : null,
      hab.length ? h('ul', { class: 'barras' }, hab.map(([k, v]) => h('li', {},
        h('span', { class: 'barras-rotulo' }, NOMES[k], v.estimativaFraca ? h('small', {}, ' (estimativa simples)') : null),
        h('span', { class: 'barras-trilho', 'aria-hidden': 'true' }, h('span', { style: `transform:scaleX(${((NIVEIS.indexOf(v.nivel) + 1) / 5).toFixed(2)})` })),
        h('strong', {}, v.nivel)))) : null,
      h('div', { class: 'folha com-margem' }, r.resumo.map(t => h('p', {}, t)),
        r.pistas.length ? h('p', {}, 'Pistas para observar (ainda são hipóteses, vamos confirmar com as próximas atividades): ', r.pistas.map(p => p.nome.toLowerCase()).join('; '), '.') : null),
      h('button', { type: 'button', class: 'btn btn-bloco', on: { click: () => ir('#/plano') } }, plano ? 'Ver meu plano' : 'Continuar', icone('arrow-right')));
  }

  intro();
}
