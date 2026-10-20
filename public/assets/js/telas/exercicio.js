// Componente de exercício. Padrão de jogo: escolhe ou escreve, toca em "Conferir",
// e uma folha de resposta sobe de baixo (azul quando acerta, coral suave quando é "quase").
// Teclado: 1 a 9 escolhem alternativas, Enter confere e continua. A correção vem do servidor.
import { h, icone, falar, pararVoz, toast, ocupado, ouvirMicrofone } from '../ui.js?v=__V__';
import { lou, som, brilho, vibrar } from '../diversao.js?v=__V__';

const ehIngles = s => /^[\x20-\x7E’‘]+$/.test(s || '');
const ELOGIOS = ['Mandou bem!', 'Isso aí!', 'Perfeito!', 'Boa!', 'Certinho!'];
const QUASE = ['Quase!', 'Foi por pouco.', 'Bora ajustar.'];

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

export function exercicio(ex, { responder, contestar, ja, devagar = false, aoProximo, rotuloProximo = 'Continuar', barraFixa = false }) {
  const t0 = performance.now();
  let usouDica = false, conferido = false, rec = null, pegarResposta = () => null;
  const raiz = h('article', { class: 'exercicio', dados: { tipo: ex.tipo } });
  const area = h('div', { class: 'exercicio__area' });
  const vel = devagar ? 0.85 : 1;
  const btnConferir = h('button', { type: 'button', class: 'btn btn-bloco', disabled: true }, 'Conferir');
  const folha = h('div', { class: 'folha-resposta', 'aria-live': 'polite' });
  const barra = h('div', { class: 'barra-acao' + (barraFixa ? ' barra-acao--fixa' : '') }, h('div', { class: 'barra-acao__in' }, folha, btnConferir));
  const habilitar = (sim) => { btnConferir.disabled = !sim; };

  if (ex.tipo === 'escuta' || ex.tipo === 'ditado') {
    area.append(caixaEscuta(ex.audio, { vozFem: ex.vozFem, dica: null, ajustavel: true, devagar }));
  }
  if (ex.tipo === 'leitura') area.append(h('blockquote', { class: 'texto-leitura', lang: 'en' }, ex.texto));
  const titulo = ex.enunciado || ex.pergunta || ({ lacuna: 'Complete a frase', ordenar: 'Monte a frase', ditado: 'Escreva o que você ouviu', traduzir: 'Escreva em inglês', fala: 'Fale em voz alta', pares: 'Toque nos pares que combinam', corrigir: 'Corrija a frase', detetive: 'Caça ao erro: toque na palavra errada' })[ex.tipo];
  raiz.append(h('h2', { class: 'enunciado', lang: ehIngles(titulo) ? 'en' : null }, titulo));
  if (ex.tipo === 'escuta' && ex.pergunta && ex.enunciado) raiz.append(h('p', {}, ex.pergunta));
  // debate: a outra pessoa fala primeiro e o aluno escolhe a melhor resposta
  if (ex.oponente) raiz.insertBefore(h('div', { class: 'oponente' }, h('span', { class: 'oponente__nome' }, ex.oponente.nome), h('p', { class: 'oponente__fala', lang: 'en' }, ex.oponente.fala), h('button', { type: 'button', class: 'btn-icone', 'aria-label': 'Ouvir ' + ex.oponente.nome, on: { click: () => falar(ex.oponente.fala) } }, icone('speaker-high'))), raiz.firstChild);

  async function conferir() {
    if (conferido || btnConferir.disabled) return;
    const resposta = pegarResposta();
    if (resposta == null || resposta === '') return;
    ocupado(btnConferir, true);
    area.querySelectorAll('input,textarea,.opcao,.peca,.par,.palavra-det').forEach(b => { b.disabled = true; });
    try {
      const r = await responder(resposta, { tempoMs: Math.round(performance.now() - t0), dica: usouDica });
      conferido = true;
      mostrar(r, resposta);
    } catch (e) {
      toast(e.message, { tipo: 'erro' });
      area.querySelectorAll('input,textarea,.opcao,.peca,.par,.palavra-det').forEach(b => { b.disabled = false; });
    } finally { ocupado(btnConferir, false); }
  }
  btnConferir.addEventListener('click', conferir);

  function mostrar(r, resposta, silencioso = false) {
    conferido = true;
    raiz.classList.add(r.correto ? 'is-certo' : 'is-errado');
    barra.classList.add(r.correto ? 'barra-acao--certo' : 'barra-acao--quase');
    if (!silencioso) {
      som(r.correto ? 'acerto' : 'erro'); vibrar(r.correto ? 14 : [28, 40, 28]);
      if (r.correto) brilho(area.querySelector('.opcao.escolhida,.palavra-det.escolhida,.lacuna,.montagem') || btnConferir);
    }
    // marca a alternativa certa quando a escolhida estava errada
    if (!r.correto) area.querySelectorAll('.opcao').forEach(o => { if (o.lastElementChild?.textContent === r.esperado) o.classList.add('certa'); });
    if (ex.tipo === 'detetive') area.querySelectorAll('.palavra-det').forEach((b, i) => { if (!r.correto && String(i) !== String(resposta) && b.textContent.replace(/[.,!?;:]+$/, '') === (r.esperado || '').split(' → ')[0]) b.classList.add('certa'); });
    const corpo = [];
    if (r.correto) {
      corpo.push(h('p', { class: 'folha-resposta__titulo' }, ELOGIOS[Math.floor(Math.random() * ELOGIOS.length)]));
      if (r.quase && ex.tipo !== 'pares') corpo.push(h('p', {}, 'Só confira a grafia: ', h('strong', { lang: 'en' }, r.esperado)));
      if (r.quase && ex.tipo === 'pares') corpo.push(h('p', {}, 'Um tropeço só. Conta como acerto.'));
    } else {
      corpo.push(h('p', { class: 'folha-resposta__titulo' }, QUASE[Math.floor(Math.random() * QUASE.length)]));
      if (ex.tipo !== 'pares') corpo.push(h('div', { class: 'correcao' },
        resposta && !/^erros:/.test(resposta) && ex.tipo !== 'fala' ? h('span', { class: 'riscado', lang: 'en' }, resposta) : null,
        h('span', { class: 'nova', lang: 'en' }, r.esperado)));
      else corpo.push(h('p', {}, 'Esses pares voltam na revisão para fixar.'));
      if (r.explica) corpo.push(h('p', { class: 'explica' }, r.explica));
      for (const a of (r.achados || []).filter(a => a.explicacao !== r.explica)) corpo.push(h('p', { class: 'explica' }, icone('lightbulb'), ` ${a.nome}: ${a.explicacao}`));
      if (contestar && ['lacuna', 'traduzir', 'ditado', 'ordenar'].includes(ex.tipo) && resposta) {
        const b = h('button', { type: 'button', class: 'btn btn-texto btn-peq', on: { click: async () => { ocupado(b, true); try { const m = await contestar(); b.replaceWith(h('p', { class: 'ajuda' }, m)); } catch (e) { toast(e.message); ocupado(b, false); } } } }, 'Acho que a minha também está certa');
        corpo.push(b);
      }
    }
    if (r.textoAudio) {
      const ver = h('button', { type: 'button', class: 'btn btn-texto btn-peq', on: { click: () => ver.replaceWith(h('p', { class: 'transcricao', lang: 'en' }, r.textoAudio)) } }, icone('eye'), 'Ver o texto do áudio');
      corpo.push(ver);
    }
    folha.replaceChildren(h('div', { class: 'folha-resposta__lou' }, lou(r.correto ? 'feliz' : 'ops', { tamanho: 56, rotulo: '' })), h('div', { class: 'folha-resposta__texto' }, corpo));
    btnConferir.hidden = false;
    btnConferir.textContent = rotuloProximo;
    btnConferir.disabled = false;
    btnConferir.onclick = () => aoProximo?.();
    btnConferir.removeEventListener('click', conferir);
    btnConferir.focus({ preventScroll: true });
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
    area.append(linha, ex.dica ? h('button', { type: 'button', class: 'btn btn-texto btn-peq dica', on: { click: e => { usouDica = true; e.currentTarget.replaceWith(h('span', { class: 'bilhete pequeno' }, 'dica: ' + ex.dica)); } } }, icone('lightbulb'), 'Dica') : null);
    setTimeout(() => campos[0]?.focus({ preventScroll: true }), 60);
  } else if (ex.tipo === 'ordenar') {
    const montada = h('div', { class: 'montagem', lang: 'en', 'aria-label': 'Sua frase', 'aria-live': 'polite' });
    const banco = h('div', { class: 'banco', lang: 'en' });
    const atualizar = () => habilitar(banco.children.length === 0);
    ex.palavras.forEach(p => {
      const peca = h('button', { type: 'button', class: 'peca' }, p);
      peca.addEventListener('click', () => { (peca.parentElement === banco ? montada : banco).append(peca); som('toque'); atualizar(); });
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
    // O que o aparelho "ouviu" não aparece na tela (ver o texto errado desanima e sotaque não é erro): só dizemos se ouvimos algo.
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    let ouvido = '';
    const eco = h('p', { class: 'fala-eco', 'aria-live': 'polite' }, '');
    const campo = h('input', { type: 'text', class: 'resposta-livre', lang: 'en', autocapitalize: 'off', spellcheck: 'false', maxlength: 200, placeholder: SR ? 'Ou escreva o que você disse' : 'Escreva o que você disse', 'aria-label': 'O que você disse, escrito' });
    campo.addEventListener('input', () => { ouvido = ''; eco.textContent = ''; habilitar(!!campo.value.trim()); });
    const btnFalar = SR ? h('button', { type: 'button', class: 'btn btn-ouvir-grande btn-falar', 'aria-pressed': 'false', 'aria-label': 'Falar no microfone' }, icone('microphone')) : null;
    const parar = () => { try { rec?.stop(); } catch {} btnFalar?.setAttribute('aria-pressed', 'false'); };
    btnFalar?.addEventListener('click', () => {
      if (btnFalar.getAttribute('aria-pressed') === 'true') { parar(); return; }
      try {
        ouvido = ''; campo.value = ''; habilitar(false);
        eco.textContent = 'Estou ouvindo... pode falar a frase inteira, sem pressa.';
        btnFalar.setAttribute('aria-pressed', 'true');
        rec = ouvirMicrofone({
          alvo: ex.frase,
          aoTexto: t => { ouvido = t; if (t) { habilitar(true); eco.textContent = 'Estou ouvindo...'; } },
          aoFim: () => { btnFalar.setAttribute('aria-pressed', 'false'); rec = null; eco.textContent = ouvido ? 'Ouvi você! Toque em Conferir, ou fale de novo se quiser.' : 'Não consegui ouvir. Tente de novo mais perto do microfone, ou escreva abaixo.'; },
        });
      } catch { toast('O microfone não abriu. Escreva abaixo o que você disse.'); parar(); }
    });
    area.append(
      h('div', { class: 'frase-fala' }, h('p', { class: 'frase-fala__en', lang: 'en' }, ex.frase), ex.pt ? h('p', { class: 'ajuda' }, ex.pt) : null),
      h('div', { class: 'escuta-caixa' },
        h('button', { type: 'button', class: 'btn btn-sec', 'aria-label': 'Ouvir como se fala', on: { click: () => falar(ex.audio || ex.frase, { velocidade: vel }) } }, icone('speaker-high'), 'Ouvir'),
        btnFalar),
      eco, campo,
      h('p', { class: 'ajuda' }, SR ? 'Toque no microfone e fale a frase. Se preferir, escreva o que disse.' : 'Seu aparelho não tem reconhecimento de voz. Fale em voz alta e escreva o que disse.'));
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
    const embaralha = l => l.map(v => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
    const colEn = h('div', { class: 'pares__col' }), colPt = h('div', { class: 'pares__col' });
    const clicar = (btn) => {
      if (btn.classList.contains('ok')) return;
      som('toque');
      if (!sel || sel.dataset.lado === btn.dataset.lado) { sel?.classList.remove('sel'); sel = btn; btn.classList.add('sel'); if (btn.dataset.lado === 'en') falar(btn.textContent); return; }
      const certo = sel.dataset.i === btn.dataset.i;
      if (certo) { for (const b of [sel, btn]) { b.classList.remove('sel'); b.classList.add('ok'); b.disabled = true; } feitos++; som('acerto'); if (feitos === ex.pares.length) { habilitar(true); conferir(); } }
      else { erros++; for (const b of [sel, btn]) { b.classList.add('nao'); setTimeout(() => b.classList.remove('nao', 'sel'), 450); } }
      sel = null;
    };
    for (const [i, p] of embaralha(ex.pares.map((p, i) => [i, p]))) colEn.append(h('button', { type: 'button', class: 'par', lang: 'en', dados: { i, lado: 'en' }, on: { click: e => clicar(e.currentTarget) } }, p.en));
    for (const [i, p] of embaralha(ex.pares.map((p, i) => [i, p]))) colPt.append(h('button', { type: 'button', class: 'par', dados: { i, lado: 'pt' }, on: { click: e => clicar(e.currentTarget) } }, p.pt));
    pegarResposta = () => 'erros:' + Math.min(99, erros);
    area.append(h('div', { class: 'pares' }, colEn, colPt));
    btnConferir.hidden = true;
  }

  // atalhos de teclado (só para o exercício visível)
  const teclas = e => {
    if (!raiz.isConnected) { document.removeEventListener('keydown', teclas); return; }
    if (e.target.matches('input,textarea')) return;
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
      raiz.classList.add('is-pulado');
      btnConferir.hidden = true;
      folha.replaceChildren(h('div', { class: 'folha-resposta__texto' }, h('p', { class: 'folha-resposta__titulo' }, 'Tudo bem!'), h('p', {}, 'A gente pula este por agora. Não conta como erro.')));
      pular.disabled = true;
      setTimeout(() => aoProximo(), 650);
    } } }, icone(ex.tipo === 'fala' ? 'microphone' : 'speaker-x'), motivoPular);
    raiz.append(area, pular, barra);
  } else raiz.append(area, barra);
  if (ja) {
    area.querySelectorAll('input,textarea,.opcao,.peca,.par,.palavra-det').forEach(b => { b.disabled = true; });
    btnConferir.hidden = false;
    btnConferir.removeEventListener('click', conferir);
    mostrar(ja, ja.resposta, true);
  }
  return raiz;
}
