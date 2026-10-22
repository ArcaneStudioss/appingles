import { api } from '../api.js?v=__V__';
// Componente de exercício. Padrão de jogo: escolhe ou escreve, toca em "Conferir",
// e uma folha de resposta sobe de baixo (azul quando acerta, coral suave quando é "quase").
// Teclado: 1 a 9 escolhem alternativas, Enter confere e continua. A correção vem do servidor.
import { h, icone, falar, falarPt, pararVoz, toast, ocupado, ouvirMicrofone, palavrasToque, acompanharFala } from '../ui.js?v=__V__';
import { lou, som, brilho, vibrar } from '../diversao.js?v=__V__';
import { companheirosAula } from '../companheiros.js?v=__V__';
import { fraseConhecida } from '../traducao.js?v=__V__';

const ehIngles = s => /^[\x20-\x7E’‘]+$/.test(s || '');
const ELOGIOS = ['Mandou bem!', 'Isso aí!', 'Perfeito!', 'Boa!', 'Certinho!'];
// Caixa de escuta: botão grande que pulsa, ondinhas enquanto o áudio toca e (na aula) a velocidade ajustável
// com "devagar" e "rápido". Nunca toca sozinho. Serve para as perguntas de escuta da aula e do teste de nível.
// simples: só o botão grande (sem velocidade, sem legenda). Usado no teste de nível, onde a tela já tem pouca coisa.
const VELS = [0.6, 0.75, 0.9, 1, 1.15, 1.3, 1.5];
export function caixaEscuta(texto, { velocidade = 1, vozFem = false, simples = false, ajustavel = false, devagar = false, dica = 'Toque no botão para ouvir. O áudio não toca sozinho.' } = {}) {
  let vez = 0, vi = devagar ? 2 : 3;
  const rotulo = simples || ajustavel ? null : h('span', { class: 'escuta__rotulo', 'aria-live': 'polite' }, 'Toque para ouvir');
  const caixa = h('div', { class: 'escuta-caixa escuta' + (simples ? ' escuta--simples' : '') });
  const fim = minha => { if (minha !== vez) return; caixa.classList.remove('is-tocando'); if (rotulo) rotulo.textContent = 'Toque para ouvir de novo'; };
  const tocar = v => {
    const minha = ++vez;
    pararVoz(); som('ouvir');
    caixa.classList.add('is-tocando'); if (rotulo) rotulo.textContent = 'Tocando...';
    if (!falar(texto, { velocidade: v, vozFem, aoFim: () => fim(minha) })) fim(minha);
    setTimeout(() => fim(minha), 30000);   // rede de segurança: se o navegador não avisar o fim, a tela não fica "tocando" para sempre
  };
  const atual = () => (ajustavel ? VELS[vi] : velocidade);
  const principal = h('button', { type: 'button', class: 'btn btn-ouvir-grande', 'aria-label': 'Ouvir o áudio', on: { click: () => tocar(atual()) } },
    h('span', { class: 'escuta__aneis', 'aria-hidden': 'true' }, h('i'), h('i')),
    icone('speaker-high'),
    h('span', { class: 'escuta__onda', 'aria-hidden': 'true' }, h('i'), h('i'), h('i'), h('i'), h('i')));
  let extra = null;
  if (ajustavel) {
    const nomeVel = () => (VELS[vi] === 1 ? 'normal' : VELS[vi] + '×');
    const rotuloVel = h('span', { class: 'vel__rotulo', 'aria-live': 'polite' }, nomeVel());
    const menos = h('button', { type: 'button', class: 'btn btn-sec btn-vel', 'aria-label': 'Falar mais devagar' }, h('span', { 'aria-hidden': 'true', class: 'vel__sinal' }, '−'), h('span', {}, 'devagar'));
    const mais = h('button', { type: 'button', class: 'btn btn-sec btn-vel', 'aria-label': 'Falar mais rápido' }, h('span', { 'aria-hidden': 'true', class: 'vel__sinal' }, '+'), h('span', {}, 'rápido'));
    const mudar = d => { vi = Math.max(0, Math.min(VELS.length - 1, vi + d)); rotuloVel.textContent = nomeVel(); menos.disabled = vi === 0; mais.disabled = vi === VELS.length - 1; tocar(VELS[vi]); };
    menos.addEventListener('click', () => mudar(-1)); mais.addEventListener('click', () => mudar(1));
    extra = h('div', { class: 'vel', role: 'group', 'aria-label': 'Velocidade do áudio' }, menos, rotuloVel, mais);
  } else if (!simples) {
    extra = h('button', { type: 'button', class: 'btn btn-sec btn-ouvir-devagar', 'aria-label': 'Ouvir mais devagar', on: { click: () => tocar(0.7) } }, h('span', { class: 'tartaruga', 'aria-hidden': 'true' }, 'devagar'));
  }
  caixa.append(h('div', { class: 'escuta__botoes' }, principal, ajustavel ? null : extra), ajustavel ? extra : null, rotulo, !simples && dica ? h('p', { class: 'ajuda' }, dica) : null);
  return caixa;
}

export function exercicio(ex, config) {
  const infantil = document.body.dataset.publico === 'crianca';
  const { responder, contestar, ja, devagar = false, aoProximo, rotuloProximo = 'Continuar', barraFixa = false, permitirTreino = false, pratica = false } = config;
  const t0 = performance.now();
  let usouDica = pratica, conferido = false, enviando = false, rec = null, pegarResposta = () => null;
  const raiz = h('article', { class: 'exercicio', dados: { tipo: ex.tipo } });
  const companhia = companheirosAula({ tipo: ex.tipo, fase: pratica ? 'tentar' : 'inicio' });
  raiz.addEventListener('inglou:traducao', () => { usouDica = true; });
  const area = h('div', { class: 'exercicio__area' });
  const vel = devagar ? 0.85 : 1;
  const btnConferir = h('button', { type: 'button', class: 'btn btn-bloco', disabled: true }, 'Conferir');
  const folha = h('section', { class: 'folha-resposta folha-resposta--companheiros retorno-exercicio', 'aria-live': 'polite', tabindex: '-1', hidden: true });
  const barra = h('div', { class: 'barra-acao' + (barraFixa ? ' barra-acao--fixa' : '') }, h('div', { class: 'barra-acao__in' }, btnConferir));
  const habilitar = (sim) => { btnConferir.disabled = !sim; };
  const dica = h('details', { class: 'ajuda-exercicio', on: { toggle: e => { if (e.currentTarget.open) { usouDica = true; companhia.reagir('dica', { texto: ex.dica }); } } } },
    h('summary', {}, icone('lightbulb'), 'Preciso de uma dica'),
    h('p', {}, ex.dica || 'Vá com calma. Releia o pedido e lembre do exemplo da aula.'),
    (ex.apoio || []).map(v => h('p', { class: 'apoio-palavra' }, h('span', {}, h('strong', { lang: 'en', 'data-traducao': v.pt }, v.en), ' = ', v.pt), h('button', { type: 'button', class: 'btn-icone', 'aria-label': 'Ouvir ' + v.en, on: { click: () => falar(v.en, { velocidade: 0.8 }) } }, icone('speaker-high')))));
  const verResposta = permitirTreino ? h('button', { type: 'button', class: 'btn btn-texto ajuda-resposta', on: { click: () => conferir(true) } }, icone('eye'), 'Ver resposta e aprender') : null;
  const ajuda = h('div', { class: 'ajudas-exercicio' }, dica, verResposta);
  const relatar=h('button',{type:'button',class:'btn btn-texto btn-peq',on:{click:async()=>{try{await api('/conteudo/relatar',{metodo:'POST',corpo:{tipo:'questao',referencia:config.referenciaRelato||ex.origemId||ex.id,motivo:'Questão sinalizada para conferir enunciado, resposta e explicação.'}});toast('Questão enviada para revisão.');}catch(e){toast(e.message,{tipo:'erro'});}}}},'Reportar problema nesta questão');

  if (ex.tipo === 'escuta' || ex.tipo === 'ditado') {
    area.append(caixaEscuta(ex.audio, { vozFem: ex.vozFem, dica: null, ajustavel: true, devagar }));
  }
  if (ex.tipo === 'leitura') area.append(h('blockquote', { class: 'texto-leitura', lang: 'en' }, palavrasToque(ex.texto)));
  const titulo = ex.enunciado || ex.pergunta || ({ lacuna: 'Complete a frase', ordenar: 'Monte a frase', ditado: 'Escreva o que você ouviu', traduzir: 'Escreva em inglês', fala: 'Fale em voz alta', pares: 'Toque nos pares que combinam', corrigir: 'Corrija a frase', detetive: 'Caça ao erro: toque na palavra errada' })[ex.tipo];
  const trechosTitulo = String(titulo || '').split(/([“"][^”"]+[”"])/g).map(t => /^[“"]/.test(t) && fraseConhecida(t.slice(1, -1)) ? h('span', { lang: 'en' }, t) : t);
  raiz.append(ex.imagem ? h('div', { class: 'exercicio__cena', 'aria-hidden': 'true' }, ex.imagem) : null,
    ex.guiado && infantil ? h('p', { class: 'rotulo-pequeno' }, ({ escolha: 'Escolha e descubra', lacuna: 'Encaixe a palavra', ordenar: 'Monte com bloquinhos', escuta: 'Ouvidos atentos', pares: 'Junte as duplas' })[ex.tipo]) : null,
    h('h2', { class: 'enunciado' }, trechosTitulo), ex.instrucao ? h('p', { class: 'instrucao' }, ex.instrucao) : null);
  if (ex.tipo === 'escuta' && ex.pergunta && ex.enunciado) raiz.append(h('p', {}, ex.pergunta));
  raiz.append(companhia.elemento);
  // debate: a outra pessoa fala primeiro e o aluno escolhe a melhor resposta
  if (ex.oponente) raiz.insertBefore(h('div', { class: 'oponente' }, h('span', { class: 'oponente__nome' }, ex.oponente.nome), h('p', { class: 'oponente__fala', lang: 'en' }, ex.oponente.fala), h('button', { type: 'button', class: 'btn-icone', 'aria-label': 'Ouvir ' + ex.oponente.nome, on: { click: () => falar(ex.oponente.fala) } }, icone('speaker-high'))), raiz.firstChild);

  async function conferir(revelar = false) {
    if (conferido || enviando || (!revelar && btnConferir.disabled)) return;
    const resposta = revelar ? '' : pegarResposta();
    if (!revelar && (resposta == null || resposta === '')) return;
    enviando = true;
    if (verResposta) verResposta.disabled = true;
    ocupado(btnConferir, true);
    area.querySelectorAll('input,textarea,.opcao,.peca,.par,.palavra-banco,.palavra-det').forEach(b => { b.disabled = true; });
    try {
      const r = await responder(resposta, { tempoMs: Math.round(performance.now() - t0), dica: usouDica || revelar, revelar, treinar: pratica });
      conferido = true;
      mostrar(r, resposta);
    } catch (e) {
      toast(e.message, { tipo: 'erro' });
      area.querySelectorAll('input,textarea,.opcao,.peca,.par:not(.ok),.palavra-banco,.palavra-det').forEach(b => { b.disabled = false; });
      if (ex.tipo === 'pares') btnConferir.hidden = false;
    } finally { enviando = false; ocupado(btnConferir, false); if (verResposta) verResposta.disabled = conferido; }
  }
  const aoConferir = () => conferir();
  btnConferir.addEventListener('click', aoConferir);

  function mostrar(r, resposta, silencioso = false) {
    conferido = true;
    ajuda.hidden = true;
    if (pular) pular.hidden = true;
    folha.hidden = false;
    folha.classList.add(r.correto ? 'retorno-exercicio--certo' : 'retorno-exercicio--aprender');
    raiz.classList.add(r.correto ? 'is-certo' : 'is-errado');
    barra.classList.add(r.correto ? 'barra-acao--certo' : 'barra-acao--quase');
    if (!silencioso && !r.ajuda) { som(r.correto ? 'acerto' : 'erro'); vibrar(r.correto ? 14 : [28, 40, 28]); if (r.correto) brilho(btnConferir); }
    if (ex.tipo === 'detetive') area.querySelectorAll('.palavra-det').forEach((b, i) => { if (!r.correto && String(i) !== String(resposta) && b.textContent.replace(/[.,!?;:]+$/, '') === (r.esperado || '').split(' → ')[0]) b.classList.add('certa'); });
    // marca a alternativa certa quando a escolhida estava errada
    area.querySelectorAll('.opcao').forEach(o => {
      if (o.lastElementChild?.textContent === r.esperado) o.classList.add('certa');
      if (o.lastElementChild?.textContent === resposta) { o.classList.add('escolhida'); o.setAttribute('aria-checked', 'true'); }
    });
    const corpo = [h('h3', { class: 'folha-resposta__titulo' }, r.ajuda ? (infantil ? 'Vamos aprender juntos!' : 'Veja a resposta e a explicação') : r.correto ? (pratica ? 'Você conseguiu!' : infantil ? ELOGIOS[Math.floor(Math.random() * ELOGIOS.length)] : 'Resposta correta!') : infantil ? 'Vamos aprender com esta!' : 'Vamos entender a resposta')];
    if (ex.tipo !== 'pares') {
      if (!r.correto && resposta && ex.tipo !== 'fala') corpo.push(h('p', { class: 'resposta-anterior' }, 'Você respondeu: ', h('span', {}, resposta)));
      corpo.push(h('div', { class: 'resposta-modelo' }, h('p', { class: 'rotulo-pequeno' }, r.correto ? 'Resposta' : 'Resposta correta'),
        h('p', { class: 'resposta-modelo__texto', lang: r.audioResposta ? 'en' : null, 'data-traducao': r.traducao || null }, r.fraseCompleta || r.esperado),
        r.traducao ? h('p', { class: 'resposta-modelo__pt' }, 'Em português: ', r.traducao) : null));
    } else {
      corpo.push(h('ul', { class: 'resposta-pares' }, (r.pares || ex.pares).map(p => h('li', {}, h('strong', { lang: 'en', 'data-traducao': p.pt }, p.en), h('span', {}, p.pt), h('button', { type: 'button', class: 'btn-icone', 'aria-label': 'Ouvir ' + p.en, on: { click: () => falar(p.en, { velocidade: 0.8 }) } }, icone('speaker-high'))))));
    }
    if (r.quase && ex.tipo !== 'pares') corpo.push(h('p', {}, 'Você acertou a ideia! Veja também como se escreve acima.'));
    if (r.explica) corpo.push(h('div', { class: 'explicacao-resposta' }, h('h4', {}, 'Por quê?'), h('p', { class: 'explica' }, r.explica)));
    if (!r.correto) {
      for (const a of (r.achados || []).filter(a => a.explicacao !== r.explica)) corpo.push(h('p', { class: 'explica' }, icone('lightbulb'), ` ${a.nome}: ${a.explicacao}`));
      if (contestar && ['lacuna', 'traduzir', 'ditado', 'ordenar'].includes(ex.tipo) && resposta) {
        const b = h('button', { type: 'button', class: 'btn btn-texto btn-peq', on: { click: async () => { ocupado(b, true); try { const m = await contestar(); b.replaceWith(h('p', { class: 'ajuda' }, m)); } catch (e) { toast(e.message); ocupado(b, false); } } } }, 'Acho que a minha também está certa');
        corpo.push(b);
      }
    }
    if (r.textoAudio && r.textoAudio !== r.fraseCompleta) corpo.push(h('p', { class: 'transcricao', lang: 'en' }, r.textoAudio));
    corpo.push(h('div', { class: 'linha-acoes retorno-exercicio__acoes' },
      r.audioResposta ? h('button', { type: 'button', class: 'btn btn-sec btn-peq', on: { click: () => falar(r.audioResposta, { velocidade: 0.8 }) } }, icone('speaker-high'), 'Ouvir resposta') : null,
      r.explica ? h('button', { type: 'button', class: 'btn btn-texto btn-peq', on: { click: () => falarPt(r.explica, null, { personagem: 'mia', emocao: r.correto ? 'feliz' : 'acolhedor' }) } }, icone('speaker-high'), 'Ler explicação') : null,
      !r.correto && permitirTreino ? h('button', { type: 'button', class: 'btn btn-sec btn-peq', on: { click: () => {
        document.removeEventListener('keydown', teclas);
        try { rec?.stop(); } catch {}
        const novo = exercicio(ex, { ...config, ja: null, pratica: true });
        raiz.replaceWith(novo);
        novo.querySelector('h2')?.setAttribute('tabindex', '-1'); novo.querySelector('h2')?.focus();
      } } }, icone('arrow-counter-clockwise'), 'Tentar de novo') : null));
    if (!silencioso && r.recompensa) corpo.push(h('p', { class: 'exercicio-recompensa' }, r.recompensa.xp ? `+${r.recompensa.xp} XP` : null, r.recompensa.moedas ? ` · +${r.recompensa.moedas} moeda${r.recompensa.moedas === 1 ? '' : 's'}` : null, r.recompensa.figurinhas ? ' · Nova figurinha na coleção!' : null));
    // Resultados vêm do servidor. Revelar a resposta é estudo, nunca uma comemoração de acerto.
    const combo = r.correto && !r.ajuda && !pratica && [3, 5, 8, 10].includes(r.sequencia);
    companhia.reagir(r.ajuda ? 'aprender' : r.quase ? 'quase' : r.correto ? pratica ? 'superacao' : combo ? 'combo' : 'acerto' : 'apoio', { silencioso });
    if (combo && !silencioso) som('combo');
    if(config.relatar!==false)corpo.push(relatar);
    folha.replaceChildren(companhia.elemento, h('div', { class: 'folha-resposta__texto' }, corpo));
    btnConferir.hidden = false;
    btnConferir.textContent = rotuloProximo;
    btnConferir.disabled = false;
    btnConferir.onclick = () => aoProximo?.();
    btnConferir.removeEventListener('click', aoConferir);
    if (!silencioso) requestAnimationFrame(() => { folha.focus({ preventScroll: true }); folha.scrollIntoView({ block: 'start', behavior: 'instant' }); });
  }

  // ---- por tipo
  if (['escolha', 'escuta', 'leitura'].includes(ex.tipo)) {
    let escolhida = null;
    const grupo = h('div', { class: 'opcoes', role: 'radiogroup', 'aria-label': 'Alternativas' });
    ex.opcoes.forEach((o, i) => grupo.append(h('button', { type: 'button', class: 'opcao', style: `--k:${i}`, role: 'radio', 'aria-checked': 'false', lang: ehIngles(o) ? 'en' : null, on: { click: e => {
      grupo.querySelectorAll('.opcao').forEach(b => { b.classList.remove('escolhida'); b.setAttribute('aria-checked', 'false'); });
      e.currentTarget.classList.add('escolhida'); e.currentTarget.setAttribute('aria-checked', 'true');
      escolhida = o; habilitar(true); som('toque'); vibrar(8);
    } } }, h('span', { class: 'opcao__tecla', 'aria-hidden': 'true' }, String(i + 1)), h('span', {}, o))));
    pegarResposta = () => escolhida;
    area.append(grupo);
  } else if (ex.tipo === 'lacuna') {
    const partes = ex.frase.split('___');
    const campos = [];
    const linha = h('p', { class: 'frase-lacuna', lang: 'en' });
    partes.forEach((p, i) => {
      linha.append(p);
      if (i < partes.length - 1) { const c = h('input', { type: 'text', class: 'lacuna', 'aria-label': `Lacuna ${i + 1}`, autocapitalize: 'off', spellcheck: 'false', maxlength: 60, size: 8 }); c.addEventListener('input', () => habilitar(campos.every(x => x.value.trim()))); campos.push(c); linha.append(c); }
    });
    pegarResposta = () => campos.map(c => c.value.trim()).join(' ').trim();
    area.append(linha);
    if (ex.bancoPalavras?.length && campos.length === 1) area.append(h('div', { class: 'banco-palavras', role: 'group', 'aria-label': 'Palavras para completar o espaço' }, ex.bancoPalavras.map(p => h('button', { type: 'button', class: 'peca palavra-banco', lang: 'en', on: { click: () => { if (conferido || enviando) return; campos[0].value = p; habilitar(true); som('toque'); } } }, p))), h('p', { class: 'ajuda' }, 'Você pode tocar em uma palavra ou escrever no espaço.'));
    if (!ex.guiado) setTimeout(() => campos[0]?.focus({ preventScroll: true }), 60);
  } else if (ex.tipo === 'ordenar') {
    const montada = h('div', { class: 'montagem', lang: 'en', 'aria-label': 'Sua frase', 'aria-live': 'polite' });
    const banco = h('div', { class: 'banco', lang: 'en' });
    const atualizar = () => habilitar(banco.children.length === 0);
    ex.palavras.forEach(p => {
      const peca = h('button', { type: 'button', class: 'peca' }, p);
      peca.addEventListener('click', () => { if (conferido || enviando) return; (peca.parentElement === banco ? montada : banco).append(peca); som('toque'); atualizar(); });
      banco.append(peca);
    });
    pegarResposta = () => [...montada.children].map(b => b.textContent).join(' ') + (ex.sufixo || '');
    area.append(montada, banco);
  } else if (ex.tipo === 'ditado' || ex.tipo === 'traduzir' || ex.tipo === 'corrigir') {
    if (ex.tipo === 'corrigir') area.append(h('p', { class: 'ajuda' }, 'Isto você escreveu. Corrija e confira:'), h('p', { class: 'errado-caixa riscado', lang: 'en' }, ex.errado));
    if (ex.tipo === 'traduzir') area.append(h('div', { class: 'frase-pt' }, lou('pensando', { tamanho: 52, rotulo: '' }), h('p', { class: 'balao-pt' }, ex.pt)));
    const campo = h('textarea', { class: 'resposta-livre', rows: 3, lang: 'en', autocapitalize: 'sentences', spellcheck: 'false', maxlength: 300, placeholder: 'Escreva em inglês', 'aria-label': 'Sua resposta em inglês' });
    if (ex.tipo === 'corrigir') campo.value = ex.errado;   // a pessoa edita a própria frase
    campo.addEventListener('input', () => habilitar(!!campo.value.trim() && (ex.tipo !== 'corrigir' || campo.value.trim() !== ex.errado)));
    campo.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); conferido ? btnConferir.click() : conferir(); } });
    pegarResposta = () => campo.value.trim();
    area.append(campo);
    setTimeout(() => campo.focus({ preventScroll: true }), 60);
  } else if (ex.tipo === 'fala') {
    // fala em voz alta: reconhecimento de voz do aparelho quando existir; sempre dá para escrever o que disse.
    // A frase ganha azul à medida que o navegador reconhece as palavras, sem alterar a correção.
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const leitura = acompanharFala(ex.frase);
    let ouvido = '';
    const eco = h('p', { class: 'fala-eco', 'aria-live': 'polite' }, '');
    const campo = h('input', { type: 'text', class: 'resposta-livre', lang: 'en', autocapitalize: 'off', spellcheck: 'false', maxlength: 200, placeholder: SR ? 'Ou escreva o que você disse' : 'Escreva o que você disse', 'aria-label': 'O que você disse, escrito' });
    campo.addEventListener('input', () => { ouvido = ''; leitura.atualizar(''); eco.textContent = ''; habilitar(!!campo.value.trim()); });
    const btnFalar = SR ? h('button', { type: 'button', class: 'btn btn-ouvir-grande btn-falar', 'aria-pressed': 'false', 'aria-label': 'Falar no microfone' }, icone('microphone')) : null;
    const parar = () => { try { rec?.stop(); } catch {} btnFalar?.setAttribute('aria-pressed', 'false'); };
    btnFalar?.addEventListener('click', () => {
      if (btnFalar.getAttribute('aria-pressed') === 'true') { parar(); return; }
      try {
        pararVoz(); ouvido = ''; campo.value = ''; leitura.atualizar(''); habilitar(false);
        eco.textContent = 'Estou ouvindo... pode falar a frase inteira, sem pressa.';
        btnFalar.setAttribute('aria-pressed', 'true');
        rec = ouvirMicrofone({
          alvo: ex.frase,
          aoTexto: t => { ouvido = t; const p = leitura.atualizar(t); habilitar(!!t); eco.textContent = p.reconhecidas ? `Reconheci ${p.reconhecidas} de ${p.total} palavras. Pode continuar.` : 'Estou ouvindo...'; },
          aoFim: () => { btnFalar.setAttribute('aria-pressed', 'false'); rec = null; eco.textContent = ouvido ? 'Ouvi você! Toque em Conferir, ou fale de novo se quiser.' : 'Não consegui ouvir. Tente de novo mais perto do microfone, ou escreva abaixo.'; },
        });
      } catch { toast('O microfone não abriu. Escreva abaixo o que você disse.'); parar(); }
    });
    area.append(
      h('div', { class: 'frase-fala' }, h('p', { class: 'frase-fala__en', lang: 'en' }, leitura.elemento), ex.pt ? h('p', { class: 'ajuda' }, ex.pt) : null),
      h('div', { class: 'escuta-caixa' },
        h('button', { type: 'button', class: 'btn btn-sec', 'aria-label': 'Ouvir como se fala', on: { click: () => falar(ex.audio || ex.frase, { velocidade: vel }) } }, icone('speaker-high'), 'Ouvir'),
        btnFalar),
      eco, campo,
      h('p', { class: 'ajuda' }, SR ? 'Toque no microfone e fale a frase. As palavras reconhecidas ficam azuis. Se preferir, escreva o que disse.' : 'Seu aparelho não tem reconhecimento de voz. Fale em voz alta e escreva o que disse.'));
    pegarResposta = () => (ouvido || campo.value).trim();
  } else if (ex.tipo === 'detetive') {
    // caça ao erro: a frase vira palavras tocáveis; a resposta enviada é a posição da palavra
    let alvo = null;
    const frase = h('p', { class: 'frase-det', lang: 'en', role: 'group', 'aria-label': 'Frase com uma palavra errada' });
    ex.tokens.forEach((t, i) => frase.append(h('button', { type: 'button', class: 'palavra-det', on: { click: e => {
      frase.querySelectorAll('.palavra-det').forEach(b => b.classList.remove('escolhida'));
      e.currentTarget.classList.add('escolhida'); alvo = String(i); habilitar(true); som('toque');
    } } }, t), ' '));
    pegarResposta = () => alvo;
    area.append(frase, h('p', { class: 'ajuda' }, 'Só uma palavra está errada. Toque nela e confira.'));
  } else if (ex.tipo === 'pares') {
    // combina inglês x português; o resultado vai ao servidor como "erros:N"
    let erros = 0, sel = null, feitos = 0;
    const retornoPar = h('p', { class: 'retorno-par', 'aria-live': 'polite' });
    const embaralha = l => l.map(v => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
    const colEn = h('div', { class: 'pares__col' }), colPt = h('div', { class: 'pares__col' });
    const clicar = (btn) => {
      if (conferido || enviando || btn.classList.contains('ok')) return;
      som('toque');
      if (!sel || sel.dataset.lado === btn.dataset.lado) { sel?.classList.remove('sel'); sel = btn; btn.classList.add('sel'); if (btn.dataset.lado === 'en') falar(btn.textContent); return; }
      const certo = sel.dataset.i === btn.dataset.i;
      const emIngles = sel.dataset.lado === 'en' ? sel : btn;
      const par = ex.pares[Number(emIngles.dataset.i)];
      retornoPar.replaceChildren(certo ? 'Isso! ' : 'Vamos lembrar: ', h('strong', { lang: 'en', 'data-traducao': par.pt }, par.en), ' = ', par.pt, certo ? '.' : '. Tente juntar essas duas.');
      companhia.reagir(certo ? 'acerto' : 'apoio', { texto: certo ? 'Essa dupla combina! Vamos encontrar as outras.' : 'Vamos com calma. Veja o significado mostrado e procure a dupla que combina.' });
      if (certo) { for (const b of [sel, btn]) { b.classList.remove('sel'); b.classList.add('ok'); b.disabled = true; } feitos++; som('acerto'); if (feitos === ex.pares.length) { habilitar(true); conferir(); } }
      else { erros++; usouDica = true; for (const b of [sel, btn]) { b.classList.add('nao'); setTimeout(() => b.classList.remove('nao', 'sel'), 450); } }
      sel = null;
    };
    for (const [i, p] of embaralha(ex.pares.map((p, i) => [i, p]))) colEn.append(h('button', { type: 'button', class: 'par', lang: 'en', dados: { i, lado: 'en' }, on: { click: e => clicar(e.currentTarget) } }, p.en));
    for (const [i, p] of embaralha(ex.pares.map((p, i) => [i, p]))) colPt.append(h('button', { type: 'button', class: 'par', dados: { i, lado: 'pt' }, on: { click: e => clicar(e.currentTarget) } }, p.pt));
    pegarResposta = () => 'erros:' + Math.min(99, erros);
    area.append(h('div', { class: 'pares-cabecalho', 'aria-hidden': 'true' }, h('span', {}, 'Inglês'), h('span', {}, 'Português')), h('div', { class: 'pares' }, colEn, colPt), retornoPar);
    btnConferir.hidden = true;
  }

  // atalhos de teclado (só para o exercício visível)
  const teclas = e => {
    if (!raiz.isConnected) { document.removeEventListener('keydown', teclas); return; }
    if (e.target.matches('input,textarea') || e.target.closest('.palavra-traduzivel,.traducao-balao,summary,button:not(.opcao)')) return;
    const n = Number(e.key);
    const ops = area.querySelectorAll('.opcao:not([disabled])');
    if (n >= 1 && n <= ops.length) { ops[n - 1].click(); e.preventDefault(); }
    else if (e.key === 'Enter' && !btnConferir.disabled) { btnConferir.click(); e.preventDefault(); }
  };
  document.addEventListener('keydown', teclas);

  // "não consigo ouvir / falar agora": quem está num lugar sem som ou sem poder falar pula este exercício sem castigo.
  // Nada é enviado ao servidor: não conta como acerto nem como erro, não vira cartão de revisão e não mexe no diagnóstico.
  const motivoPular = ex.tipo === 'escuta' || ex.tipo === 'ditado' ? 'Não consigo ouvir agora' : ex.tipo === 'fala' ? 'Não consigo falar agora' : null;
  let pular = null;
  if (motivoPular && aoProximo && !ja) {
    pular = h('button', { type: 'button', class: 'btn btn-texto btn-pular', on: { click: () => {
      if (conferido) return;
      conferido = true;
      try { rec?.stop(); } catch {}
      area.querySelectorAll('input,textarea,.opcao,.peca,.par,button').forEach(b => { b.disabled = true; });
      raiz.classList.add('is-pulado'); ajuda.hidden = true; folha.hidden = false;
      btnConferir.hidden = true;
      companhia.reagir('pausa');
      folha.replaceChildren(companhia.elemento, h('div', { class: 'folha-resposta__texto' }, h('p', { class: 'folha-resposta__titulo' }, 'Tudo bem!'), h('p', {}, 'A gente pula este por agora. Não conta como erro.')));
      pular.disabled = true;
      pular.replaceWith(h('button', { type: 'button', class: 'btn', on: { click: aoProximo } }, 'Continuar'));
    } } }, icone(ex.tipo === 'fala' ? 'microphone' : 'speaker-x'), motivoPular);
    raiz.append(area, ajuda, pular, folha, barra);
  } else raiz.append(area, ajuda, folha, barra);
  if (ja) {
    area.querySelectorAll('input,textarea,.opcao,.peca,.par,.palavra-det').forEach(b => { b.disabled = true; });
    btnConferir.hidden = false;
    btnConferir.removeEventListener('click', aoConferir);
    mostrar(ja, ja.resposta, true);
  }
  return raiz;
}
