// Conversa: o centro do produto. O que trava aqui vira a aula de amanhã.
import { api } from '../api.js?v=__V__';
import { h, icone, falar, toast, ocupado, confirmar, janela, temMicrofone, ouvirMicrofone, dataBR } from '../ui.js?v=__V__';
import { nomeConquista } from './hoje.js?v=__V__';
import { lou, louFala } from '../diversao.js?v=__V__';


export async function telaConversar(el, { ir }) {
  const [{ cenarios, ia }, { conversas }] = await Promise.all([api('/conversas/cenarios'), api('/conversas')]);
  const pre = new URLSearchParams(location.hash.split('?')[1] || '').get('c');
  const iniciar = async (id, btn) => {
    ocupado(btn, true);
    try { const c = await api('/conversas', { metodo: 'POST', corpo: { cenario: id } }); ir('#/conversa/' + c.id); }
    catch (e) { toast(e.message, { tipo: 'erro' }); ocupado(btn, false); }
  };
  el.append(
    h('header', { class: 'cabeca' }, h('h1', {}, 'Conversar'), h('p', { class: 'ajuda' }, 'Escreva (ou fale) como numa conversa de verdade. O que travar vira a sua próxima aula.')),
    ia ? null : h('p', { class: 'aviso-suave' }, icone('info'), h('span', {}, 'Modo de prática: o tutor segue um roteiro do cenário e aponta os erros mais comuns. Com a IA ligada, a conversa fica livre e a correção, completa.')),
    h('ul', { class: 'cenarios' }, cenarios.map(c => {
      const b = h('button', { type: 'button', class: 'cenario folha' + (c.recomendado || c.id === pre ? ' cenario--rec' : ''), on: { click: () => iniciar(c.id, b) } },
        lou(c.recomendado ? 'feliz' : 'oi', { tamanho: 52, rotulo: '' }), h('span', { class: 'cenario__txt' }, h('strong', {}, c.titulo), c.recomendado ? h('small', { class: 'bilhete pequeno' }, 'combina com a sua missão atual') : null), icone('arrow-right'));
      return h('li', {}, b);
    })),
    conversas.length ? h('section', {}, h('h2', {}, 'Conversas anteriores'), h('ul', { class: 'lista-simples' }, conversas.slice(0, 15).map(c => h('li', {}, h('a', { href: '#/conversa/' + c.id }, c.titulo), h('small', {}, ` ${dataBR(c.iniciada_em)}${c.terminada_em ? '' : ' · em aberto'}`))))) : null);
}

export async function telaConversa(el, { param, ir }) {
  const { conversa } = await api('/conversas/' + encodeURIComponent(param));
  let terminada = !!conversa.terminada_em;
  let usouAjuda = false, avisoMostrado = null;
  const lista = h('ol', { class: 'chat', 'aria-live': 'polite' });
  const balao = (m) => {
    const li = h('li', { class: 'msg msg--' + m.papel },
      m.papel === 'tutor' ? h('span', { class: 'msg__avatar' }, lou('oi', { tamanho: 40, rotulo: '' })) : null,
      h('div', { class: 'msg__balao', lang: 'en' }, m.texto,
        m.papel === 'tutor' ? h('button', { type: 'button', class: 'btn-icone', 'aria-label': 'Ouvir', on: { click: () => falar(m.texto) } }, icone('speaker-high')) : null));
    return li;
  };
  const notas = (correcoes) => (correcoes || []).length ? h('li', { class: 'msg-notas' }, correcoes.map(c => h('div', { class: 'correcao' },
    h('span', { class: 'riscado', lang: 'en' }, c.trecho), h('span', { class: 'nova', lang: 'en' }, c.sugestao), h('small', {}, c.explicacao, c.confianca === 'baixa' ? ' (talvez: não tenho certeza do que você quis dizer)' : '')))) : null;
  // reconstrói: as correções de cada resposta do tutor se referem à fala anterior do aluno
  const msgs = conversa.mensagens;
  msgs.forEach((m, k) => {
    lista.append(balao(m));
    if (m.papel === 'aluno' && msgs[k + 1]?.correcoes) { const n = notas(msgs[k + 1].correcoes); if (n) lista.append(n); }
  });

  const campo = h('textarea', { id: 'msg', rows: 2, maxlength: 1500, lang: 'en', spellcheck: 'false', placeholder: 'Type in English...', 'aria-label': 'Sua mensagem em inglês' });
  const enviar = h('button', { type: 'submit', class: 'btn', 'aria-label': 'Enviar' }, icone('arrow-right'));
  const ajuda = h('button', { type: 'button', class: 'btn btn-texto btn-peq', on: { click: () => {
    usouAjuda = true;
    janela({ titulo: 'Frases que ajudam', corpo: h('div', {}, h('p', { class: 'ajuda' }, 'Use como ponto de partida. Mensagens com ajuda contam como prática, não como demonstrado.'), h('ul', { class: 'exemplos' }, conversa.ajuda.map(a => h('li', {}, h('button', { type: 'button', class: 'btn-icone', 'aria-label': 'Usar', on: { click: () => { campo.value = (campo.value ? campo.value + ' ' : '') + a.replace(/\.\.\./g, '').trim() + ' '; document.querySelector('dialog.janela .janela__x')?.click(); campo.focus(); } } }, icone('plus')), h('span', { lang: 'en' }, a))))) });
  } } }, icone('lightbulb'), 'Me ajuda');
  let mic = null;
  if (temMicrofone()) {
    let rec = null, base = '';
    mic = h('button', { type: 'button', class: 'btn btn-texto btn-peq', 'aria-pressed': 'false', on: { click: () => {
      if (rec) { rec.stop(); return; }
      base = campo.value ? campo.value.trim() + ' ' : '';
      mic.setAttribute('aria-pressed', 'true');
      rec = ouvirMicrofone({ aoTexto: t => { campo.value = base + t; }, aoFim: () => { rec = null; mic.setAttribute('aria-pressed', 'false'); } });
    } } }, icone('microphone'), 'Falar');
  }
  const form = h('form', { class: 'chat-form', on: { submit: async e => {
    e.preventDefault();
    const texto = campo.value.trim();
    if (!texto || terminada) return;
    lista.append(balao({ papel: 'aluno', texto }));
    const digitando = h('li', { class: 'msg msg--tutor' }, h('div', { class: 'msg__balao digitando' }, h('span'), h('span'), h('span')));
    lista.append(digitando);
    campo.value = ''; ocupado(enviar, true);
    digitando.scrollIntoView({ block: 'end' });
    try {
      const r = await api(`/conversas/${conversa.id}/mensagem`, { metodo: 'POST', corpo: { texto, ajuda: usouAjuda } });
      usouAjuda = false;
      digitando.remove();
      const n = notas(r.correcoes); if (n) lista.append(n);
      lista.append(balao({ papel: 'tutor', texto: r.resposta }));
      falar(r.resposta);
      if (r.aviso && r.aviso !== avisoMostrado) { toast(r.aviso); avisoMostrado = r.aviso; }
      for (const c of r.conquistas || []) toast('Conquista: ' + nomeConquista(c), { tipo: 'ok' });
      if (r.encerrar) { terminada = true; await encerrar(); }
    } catch (err) { digitando.remove(); campo.value = texto; toast(err.message, { tipo: 'erro' }); }
    finally { ocupado(enviar, false); campo.focus(); lista.lastElementChild?.scrollIntoView({ block: 'end' }); }
  } } }, h('div', { class: 'chat-form__linha' }, campo, enviar), h('div', { class: 'linha-acoes' }, ajuda, mic,
    h('button', { type: 'button', class: 'btn btn-texto btn-peq', on: { click: async () => { if (await confirmar({ titulo: 'Encerrar a conversa?', texto: 'Mostramos o resumo e o que vira aula amanhã.', ok: 'Encerrar' })) { terminada = true; encerrar(); } } } }, icone('flag-checkered'), 'Encerrar')));
  campo.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); form.requestSubmit(); } });

  async function encerrar() {
    const r = await api(`/conversas/${conversa.id}/encerrar`, { metodo: 'POST' });
    form.hidden = true;
    for (const c of r.conquistas || []) toast('Conquista: ' + nomeConquista(c), { tipo: 'ok' });
    el.append(h('section', { class: 'folha com-margem resumo-conversa' },
      h('p', { class: 'bilhete' }, 'Resumo da conversa'),
      h('p', {}, `${r.falas} ${r.falas === 1 ? 'fala sua' : 'falas suas'}, ${r.semAjuda} sem ajuda.`),
      r.pontos.length ? h('div', {}, h('h3', {}, 'O que apareceu'), h('ul', {}, r.pontos.map(p => h('li', {}, h('strong', {}, p.nome), ': ', p.exemplos.slice(0, 2).map(x => `“${x.trecho}” → “${x.sugestao}”`).join('; '))))) : null,
      h('p', {}, r.proximo),
      h('div', { class: 'linha-acoes' }, h('a', { class: 'btn', href: '#/hoje' }, 'Voltar para hoje'), h('a', { class: 'btn btn-sec', href: '#/conversar' }, 'Outra conversa'))));
  }

  el.append(
    h('header', { class: 'cabeca cabeca--chat' }, h('a', { class: 'btn btn-texto btn-peq', href: '#/conversar', 'aria-label': 'Voltar' }, icone('caret-left')), h('h1', {}, conversa.titulo),
      h('button', { type: 'button', class: 'btn btn-texto btn-peq', on: { click: async () => { if (await confirmar({ titulo: 'Apagar esta conversa?', texto: 'Some do seu histórico. Os cartões e focos já criados a partir dela continuam (você pode apagar na revisão).', ok: 'Apagar', perigo: true })) { await api('/conversas/' + conversa.id, { metodo: 'DELETE' }); ir('#/conversar'); } } } }, icone('trash'), h('span', { class: 'oculto' }, 'Apagar conversa'))),
    lista, terminada ? null : form);
  if (terminada) encerrar();
  else { campo.focus({ preventScroll: true }); if (msgs.length === 1) falar(msgs[0].texto); }
  lista.lastElementChild?.scrollIntoView({ block: 'end' });
}
