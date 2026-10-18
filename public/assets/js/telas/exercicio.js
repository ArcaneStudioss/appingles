// Componente de exercício (lição, material, respostas rápidas). A correção vem do servidor.
import { h, icone, falar, toast, ocupado } from '../ui.js?v=__V__';

const ehIngles = s => /^[\x20-\x7E’‘]+$/.test(s || '');

export function exercicio(ex, { responder, contestar, ja, devagar = false, aoProximo, rotuloProximo = 'Continuar' }) {
  const t0 = performance.now();
  let usouDica = false;
  const raiz = h('article', { class: 'exercicio', dados: { tipo: ex.tipo } });
  const area = h('div', { class: 'exercicio__area' });
  const retorno = h('div', { class: 'exercicio__retorno', 'aria-live': 'polite' });
  const proximo = h('button', { type: 'button', class: 'btn btn-bloco', hidden: true, on: { click: () => aoProximo?.() } }, rotuloProximo, icone('arrow-right'));
  const vel = devagar ? 0.85 : 1;

  if (ex.tipo === 'escuta' || ex.tipo === 'ditado') {
    setTimeout(() => falar(ex.audio, { velocidade: vel }), 300);
    area.append(h('div', { class: 'escuta-caixa' },
      h('button', { type: 'button', class: 'btn btn-ouvir-grande', on: { click: () => falar(ex.audio, { velocidade: vel }) } }, icone('speaker-high'), 'Ouvir'),
      h('button', { type: 'button', class: 'btn btn-texto btn-peq', on: { click: () => falar(ex.audio, { velocidade: 0.7 }) } }, 'Mais devagar')));
  }
  if (ex.tipo === 'leitura') area.append(h('blockquote', { class: 'texto-leitura', lang: 'en' }, ex.texto));
  const titulo = ex.enunciado || ex.pergunta || ({ lacuna: 'Complete a frase', ordenar: 'Monte a frase', ditado: 'Escreva o que você ouviu', traduzir: 'Como se diz em inglês?' })[ex.tipo];
  raiz.append(h('p', { class: 'enunciado', lang: ehIngles(titulo) ? 'en' : null }, titulo));
  if (ex.tipo === 'escuta' && ex.pergunta && ex.enunciado) raiz.append(h('p', {}, ex.pergunta));

  async function enviar(resposta, botao) {
    ocupado(botao, true);
    area.querySelectorAll('button,input,textarea').forEach(b => { if (!b.classList.contains('btn-ouvir-grande') && !b.classList.contains('btn-texto')) b.disabled = true; });
    try {
      const r = await responder(resposta, { tempoMs: Math.round(performance.now() - t0), dica: usouDica });
      mostrar(r, resposta);
    } catch (e) {
      toast(e.message, { tipo: 'erro' });
      area.querySelectorAll('button,input,textarea').forEach(b => { b.disabled = false; });
    } finally { ocupado(botao, false); }
  }

  function mostrar(r, resposta) {
    raiz.classList.add(r.correto ? 'is-certo' : 'is-errado');
    retorno.replaceChildren();
    if (r.correto) {
      retorno.append(h('p', { class: 'certo' }, icone('check'), r.quase ? ' Certo! Só confira a grafia:' : ' Isso!'), r.quase ? h('p', { class: 'correcao' }, h('span', { class: 'nova', lang: 'en' }, r.esperado)) : null);
    } else {
      retorno.append(h('div', { class: 'correcao' },
        resposta ? h('span', { class: 'riscado', lang: 'en' }, resposta) : h('span', { class: 'ajuda' }, '(sem resposta)'),
        h('span', { class: 'nova', lang: 'en' }, r.esperado)));
      if (r.explica) retorno.append(h('p', { class: 'explica' }, r.explica));
      for (const a of (r.achados || []).filter(a => a.explicacao !== r.explica)) retorno.append(h('p', { class: 'explica' }, icone('lightbulb'), ` ${a.nome}: ${a.explicacao}`));
      if (contestar && ['lacuna', 'traduzir', 'ditado', 'ordenar'].includes(ex.tipo) && resposta) {
        const b = h('button', { type: 'button', class: 'btn btn-texto btn-peq', on: { click: async () => { ocupado(b, true); try { const m = await contestar(); b.replaceWith(h('p', { class: 'ajuda' }, m)); } catch (e) { toast(e.message); ocupado(b, false); } } } }, 'Acho que a minha também está certa');
        retorno.append(b);
      }
    }
    if (r.textoAudio) {
      const ver = h('button', { type: 'button', class: 'btn btn-texto btn-peq', on: { click: () => ver.replaceWith(h('p', { class: 'transcricao', lang: 'en' }, r.textoAudio)) } }, icone('eye'), 'Ver o texto do áudio');
      retorno.append(ver);
    }
    proximo.hidden = false;
    proximo.focus({ preventScroll: true });
    proximo.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  // ---- por tipo
  if (['escolha', 'escuta', 'leitura'].includes(ex.tipo)) {
    const grupo = h('div', { class: 'opcoes', role: 'group', 'aria-label': 'Alternativas' });
    for (const o of ex.opcoes) grupo.append(h('button', { type: 'button', class: 'opcao', lang: ehIngles(o) ? 'en' : null, on: { click: e => { e.currentTarget.classList.add('escolhida'); enviar(o, e.currentTarget); } } }, o));
    area.append(grupo);
  } else if (ex.tipo === 'lacuna') {
    const partes = ex.frase.split('___');
    const campos = [];
    const linha = h('p', { class: 'frase-lacuna', lang: 'en' });
    partes.forEach((p, i) => {
      linha.append(p);
      if (i < partes.length - 1) { const c = h('input', { type: 'text', class: 'lacuna', 'aria-label': `Lacuna ${i + 1}`, autocapitalize: 'off', spellcheck: 'false', maxlength: 60, size: 8 }); campos.push(c); linha.append(c); }
    });
    const btn = h('button', { type: 'submit', class: 'btn' }, 'Conferir');
    const form = h('form', { class: 'form-exercicio', on: { submit: e => { e.preventDefault(); const v = campos.map(c => c.value.trim()).join(' ').trim(); if (!v) { campos[0].focus(); return; } enviar(v, btn); } } }, linha,
      h('div', { class: 'linha-acoes' }, ex.dica ? h('button', { type: 'button', class: 'btn btn-texto btn-peq', on: { click: e => { usouDica = true; e.currentTarget.replaceWith(h('span', { class: 'bilhete pequeno' }, 'dica: ' + ex.dica)); } } }, icone('lightbulb'), 'Dica') : null, btn));
    area.append(form);
    setTimeout(() => campos[0]?.focus({ preventScroll: true }), 50);
  } else if (ex.tipo === 'ordenar') {
    const montada = h('div', { class: 'montagem', lang: 'en', 'aria-label': 'Sua frase', 'aria-live': 'polite' });
    const banco = h('div', { class: 'banco', lang: 'en' });
    const btn = h('button', { type: 'button', class: 'btn', disabled: true }, 'Conferir');
    const atualizar = () => { btn.disabled = banco.querySelectorAll('button:not([hidden])').length > 0; };
    ex.palavras.forEach((p, i) => {
      const peca = h('button', { type: 'button', class: 'peca' }, p);
      peca.addEventListener('click', () => {
        if (peca.parentElement === banco) montada.append(peca); else banco.append(peca);
        atualizar();
      });
      banco.append(peca); peca.dataset.i = i;
    });
    btn.addEventListener('click', () => enviar([...montada.children].map(b => b.textContent).join(' ') + (ex.sufixo || ''), btn));
    area.append(montada, banco, h('div', { class: 'linha-acoes' }, h('button', { type: 'button', class: 'btn btn-texto btn-peq', on: { click: () => { [...montada.children].forEach(c => banco.append(c)); atualizar(); } } }, icone('arrow-counter-clockwise'), 'Recomeçar'), btn));
  } else if (ex.tipo === 'ditado' || ex.tipo === 'traduzir') {
    if (ex.tipo === 'traduzir') area.append(h('p', { class: 'frase-pt' }, ex.pt));
    const campo = h('input', { type: 'text', class: 'resposta-livre', lang: 'en', autocapitalize: 'sentences', spellcheck: 'false', maxlength: 300, 'aria-label': 'Sua resposta em inglês' });
    const btn = h('button', { type: 'submit', class: 'btn' }, 'Conferir');
    area.append(h('form', { class: 'form-exercicio', on: { submit: e => { e.preventDefault(); if (!campo.value.trim()) { campo.focus(); return; } enviar(campo.value.trim(), btn); } } }, campo, h('div', { class: 'linha-acoes' }, btn)));
    setTimeout(() => campo.focus({ preventScroll: true }), 50);
  }

  raiz.append(area, retorno, proximo);
  if (ja) { area.querySelectorAll('button,input,textarea').forEach(b => { if (!b.classList.contains('btn-ouvir-grande')) b.disabled = true; }); mostrar(ja, ja.resposta); }
  return raiz;
}
