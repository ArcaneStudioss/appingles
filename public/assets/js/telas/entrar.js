import { api } from '../api.js?v=__V__';
import { h, ocupado, icone } from '../ui.js?v=__V__';
import { lou, louFala } from '../diversao.js?v=__V__';
import { camposPublico } from './publico.js?v=__V__';


export async function telaEntrar(el, { estado, ir, carregarEu }) {
  const est = await api('/auth/estado').catch(() => ({ logado: false }));
  if (est.logado) { await carregarEu(); return ir('#/hoje'); }
  let modo = new URLSearchParams(location.hash.split('?')[1] || '').get('modo') === 'cadastro' ? 'cadastro' : 'entrar';
  const caixa = h('div', { class: 'entrar folha' });
  el.append(h('div', { class: 'entrar-envoltorio' },
    lou('oi', { tamanho: 120 }),
    h('h1', { class: 'entrar-bilhete' }, 'Seu espaço para aprender inglês'),
    h('p', { class: 'ajuda centro' }, 'Para crianças, adolescentes, adultos e professores. Conteúdo para seu nível e sua fase da vida.'),
    caixa,
    h('p', { class: 'ajuda centro' }, '30 dias grátis, sem cartão. ', h('a', { href: '/' }, 'Conhecer o Inglou'))));

  function desenhar() {
    caixa.replaceChildren();
    const msg = h('p', { class: 'erro-campo', 'aria-live': 'polite' });
    const abas = h('div', { class: 'abas', role: 'tablist' },
      h('button', { type: 'button', role: 'tab', 'aria-selected': String(modo === 'entrar'), class: 'aba', on: { click: () => { modo = 'entrar'; desenhar(); } } }, 'Entrar'),
      h('button', { type: 'button', role: 'tab', 'aria-selected': String(modo === 'cadastro'), class: 'aba', on: { click: () => { modo = 'cadastro'; desenhar(); } } }, 'Criar conta'));
    const nome = h('input', { id: 'e-nome', name: 'name', type: 'text', autocomplete: 'name', maxlength: 80, required: true });
    const email = h('input', { id: 'e-email', name: 'email', type: 'email', autocomplete: 'email', maxlength: 160, required: true, inputmode: 'email' });
    const senha = h('input', { id: 'e-senha', name: 'password', type: 'password', autocomplete: { cadastro: 'new-password', entrar: 'current-password' }[modo], maxlength: 200, required: true, minlength: modo === 'cadastro' ? 10 : null });
    const verSenha = h('button', { type: 'button', class: 'btn btn-texto btn-peq', 'aria-pressed': 'false', on: { click: () => { const v = senha.type === 'password'; senha.type = v ? 'text' : 'password'; verSenha.setAttribute('aria-pressed', String(v)); verSenha.lastChild.textContent = v ? 'Esconder' : 'Mostrar'; } } }, icone('eye'), h('span', {}, 'Mostrar'));
    const consent = h('input', { type: 'checkbox', id: 'e-consent' });
    const publico = modo === 'cadastro' ? camposPublico() : null;
    const btn = h('button', { type: 'submit', class: 'btn btn-bloco' }, modo === 'cadastro' ? 'Criar conta e começar' : 'Entrar');
    const form = h('form', { novalidate: true, on: { submit: async e => {
      e.preventDefault(); msg.textContent = '';
      if (modo === 'cadastro' && !consent.checked) { msg.textContent = 'Marque que você leu a política de privacidade.'; return; }
      ocupado(btn, true);
      try {
        if (modo === 'cadastro') await api('/auth/cadastro', { metodo: 'POST', corpo: { nome: nome.value, email: email.value, senha: senha.value, consentimento: consent.checked, ...publico.ler() } });
        else await api('/auth/entrar', { metodo: 'POST', corpo: { email: email.value, senha: senha.value } });
        await carregarEu();
        ir(estado.eu?.perfil?.papel === 'professor' ? '#/professor' : estado.eu?.passo === 'app' ? '#/hoje' : estado.eu?.passo === 'nivelamento' ? '#/nivelamento' : '#/perfil');
      } catch (err) { msg.textContent = err.message; }
      finally { ocupado(btn, false); }
    } } },
      modo === 'cadastro' ? h('div', { class: 'campo' }, h('label', { for: 'e-nome' }, 'Como quer ser chamado'), nome) : null,
      publico?.elemento,
      h('div', { class: 'campo' }, h('label', { for: 'e-email' }, 'E-mail'), email),
      h('div', { class: 'campo' }, h('div', { class: 'linha-rotulo' }, h('label', { for: 'e-senha' }, 'Senha'), verSenha), senha,
        modo === 'cadastro' ? h('small', {}, 'Pelo menos 10 caracteres. Uma frase curta sua funciona bem.') : null),
      modo === 'cadastro' ? h('div', { class: 'consentimento' }, consent, h('label', { for: 'e-consent' }, 'Li e concordo com a ', h('a', { href: '/politica-de-privacidade/', target: '_blank', rel: 'noopener' }, 'política de privacidade'), '. Meus dados de estudo são usados só para personalizar minhas aulas.')) : null,
      msg, btn);
    caixa.append(abas, form);
  }
  desenhar();
}
