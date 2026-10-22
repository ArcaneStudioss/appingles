import { api } from '../api.js?v=__V__';
import { h, ocupado, icone } from '../ui.js?v=__V__';
import { lou } from '../diversao.js?v=__V__';
import { camposPublico } from './publico.js?v=__V__';

export async function telaEntrar(el, { estado, ir, carregarEu }) {
  const est = await api('/auth/estado');
  if (est.logado) { await carregarEu(); return ir(estado.eu?.perfil?.papel === 'professor' ? '#/professor' : '#/hoje'); }
  const config = est.autenticacao || { disponivel: true };
  let modo = new URLSearchParams(location.hash.split('?')[1] || '').get('modo') === 'cadastro' ? 'cadastro' : 'entrar';
  let etapa = 'inicio', finalidade = '', emailDigitado = '', emailFluxo = '', senhaMigracao = '', aviso = '', proximoEnvio = 0, timer;
  if (new URLSearchParams(location.hash.split('?')[1] || '').get('google') === 'erro') {
    aviso = 'Não foi possível concluir com Google. Tente novamente neste navegador ou entre com seu e-mail.';
    history.replaceState(null, '', '/app/#/entrar');
  }
  if (config.provedor === 'supabase' && config.disponivel) {
    const fluxo = await api('/auth/fluxo');
    if (fluxo.etapa) { etapa = fluxo.etapa; finalidade = fluxo.finalidade; emailFluxo = fluxo.email; }
  }
  const caixa = h('section', { class: 'entrar folha auth-cartao', 'aria-label': 'Acesso à conta' });
  el.append(h('div', { class: 'entrar-envoltorio' },
    lou('oi', { tamanho: 88 }),
    h('h1', { class: 'entrar-bilhete' }, 'Seu inglês continua aqui'),
    h('p', { class: 'ajuda centro' }, 'Entre para continuar seus estudos ou crie seu espaço para aprender.'), caixa,
    h('p', { class: 'ajuda centro' }, '30 dias grátis, sem cartão. ', h('a', { href: '/' }, 'Conhecer o Inglou'))));
  addEventListener('hashchange', () => clearInterval(timer), { once: true });
  const campo = (id, rotulo, input, ajuda) => h('div', { class: 'campo' }, h('label', { for: id }, rotulo), input, ajuda ? h('small', {}, ajuda) : null);
  function senhaCampo(id, rotulo, nova = false) {
    const input = h('input', { id, name: nova ? 'new-password' : 'password', type: 'password', autocomplete: nova ? 'new-password' : 'current-password', maxlength: 200, required: true, minlength: nova ? 10 : null });
    const ver = h('button', { type: 'button', class: 'btn btn-texto btn-peq', 'aria-label': 'Mostrar ' + rotulo.toLowerCase(), 'aria-pressed': 'false', on: { click: () => {
      const mostrar = input.type === 'password'; input.type = mostrar ? 'text' : 'password';
      ver.setAttribute('aria-pressed', String(mostrar)); ver.setAttribute('aria-label', (mostrar ? 'Esconder ' : 'Mostrar ') + rotulo.toLowerCase()); ver.lastChild.textContent = mostrar ? 'Esconder' : 'Mostrar';
    } } }, icone('eye'), h('span', {}, 'Mostrar'));
    return { input, elemento: h('div', { class: 'campo' }, h('div', { class: 'linha-rotulo' }, h('label', { for: id }, rotulo), ver), input,
      nova ? h('small', {}, 'Use pelo menos 10 caracteres. Uma frase sua é fácil de lembrar.') : null) };
  }
  async function concluir(r) {
    if (r.ok && (!r.etapa || r.etapa === 'concluido')) {
      senhaMigracao = ''; await carregarEu();
      return ir(estado.eu?.perfil?.papel === 'professor' ? '#/professor' : estado.eu?.passo === 'app' ? '#/hoje' : estado.eu?.passo === 'nivelamento' ? '#/nivelamento' : '#/perfil');
    }
    etapa = r.etapa || 'inicio'; finalidade = r.finalidade || finalidade; emailFluxo = r.email || emailFluxo; aviso = r.mensagem || '';
    if (etapa === 'codigo') proximoEnvio = Date.now() + 60000;
    desenhar(); caixa.querySelector('h2')?.focus();
  }
  function desenhar() {
    clearInterval(timer); caixa.replaceChildren();
    const inicio = etapa === 'inicio', cadastro = inicio && modo === 'cadastro', completar = etapa === 'completar';
    const titulo = inicio ? cadastro ? 'Crie sua conta' : 'Entre na sua conta' : ({ recuperar: 'Esqueceu a senha?', codigo: 'Confira seu e-mail', 'nova-senha': 'Escolha sua nova senha', completar: 'Vamos preparar seu espaço', vincular: 'Seus estudos continuam aqui' })[etapa];
    caixa.append(h('h2', { class: 'auth-titulo', tabindex: '-1' }, titulo));
    if (inicio) caixa.append(h('div', { class: 'abas', role: 'tablist', 'aria-label': 'Entrar ou criar conta' }, ['entrar', 'cadastro'].map(m =>
      h('button', { type: 'button', role: 'tab', 'aria-selected': String(modo === m), class: 'aba', on: { click: () => { modo = m; aviso = ''; desenhar(); } } }, m === 'entrar' ? 'Entrar' : 'Criar conta'))));
    if (!config.disponivel) caixa.append(h('p', { class: 'aviso-suave', role: 'status' }, 'O acesso está temporariamente indisponível. Tente novamente mais tarde.'));
    if (inicio && config.google) {
      const google = h('button', { type: 'button', class: 'btn btn-sec btn-bloco auth-google', on: { click: async () => {
        ocupado(google, true); msg.textContent = '';
        try { const r = await api('/auth/google', { metodo: 'POST' }); location.assign(r.url); }
        catch (err) { msg.textContent = err.message; msg.focus(); ocupado(google, false); }
      } } }, h('img', { src: '/assets/icones/google.svg', alt: '', width: 20, height: 20 }), 'Continuar com Google');
      caixa.append(google, h('p', { class: 'auth-ou', 'aria-hidden': 'true' }, 'ou use seu e-mail'));
    }
    if (etapa === 'recuperar') caixa.append(h('p', { class: 'ajuda' }, 'Informe o e-mail da sua conta. Se ela existir, enviaremos um código para você escolher outra senha.'));
    if (etapa === 'codigo') caixa.append(h('p', { class: 'ajuda' }, finalidade === 'migrar' ? 'Confirme seu e-mail para proteger sua conta. Seus estudos e suas turmas continuam no mesmo lugar.' : 'Digite o código recebido no e-mail. Confira também a pasta de spam.'), h('p', { class: 'auth-email' }, emailFluxo));
    if (etapa === 'nova-senha') caixa.append(h('p', { class: 'ajuda' }, 'E-mail confirmado. Sua nova senha vai valer em todos os aparelhos; os outros acessos serão encerrados.'));
    if (completar) caixa.append(h('p', { class: 'ajuda' }, 'Seu e-mail já foi confirmado. Falta contar como quer usar o Inglou.'), h('p', { class: 'auth-email' }, emailFluxo));
    if (etapa === 'vincular') caixa.append(h('p', { class: 'ajuda' }, 'Encontramos uma conta do Inglou com este e-mail. Confirme sua senha atual para adicionar o Google e manter seus estudos, assinatura e turmas.'), h('p', { class: 'auth-email' }, emailFluxo));
    const msg = h('p', { class: 'erro-campo', role: 'alert', tabindex: '-1' });
    const email = h('input', { id: 'e-email', name: 'email', type: 'email', autocomplete: 'email', autocapitalize: 'none', spellcheck: false, inputmode: 'email', required: true, maxlength: 160, value: emailDigitado, on: { input: () => { emailDigitado = email.value; } } });
    const nome = h('input', { id: 'e-nome', name: 'name', type: 'text', autocomplete: 'name', maxlength: 80, required: true });
    const senha = senhaCampo('e-senha', etapa === 'nova-senha' ? 'Nova senha' : ['codigo', 'vincular'].includes(etapa) ? 'Senha atual do Inglou' : 'Senha', cadastro || etapa === 'nova-senha');
    const repetir = senhaCampo('e-confirmar-senha', 'Repita a nova senha', true);
    const codigo = h('input', { id: 'e-codigo', class: 'auth-codigo', type: 'text', inputmode: 'numeric', autocomplete: 'one-time-code', minlength: 6, maxlength: 10, required: true, pattern: '[0-9]{6,10}' });
    const publico = cadastro || completar ? camposPublico() : null;
    const consent = h('input', { type: 'checkbox', id: 'e-consent' });
    const textoBotao = inicio ? cadastro ? 'Criar conta e começar' : 'Entrar' : ({ recuperar: 'Enviar código', codigo: 'Confirmar código', 'nova-senha': 'Salvar nova senha e entrar', completar: 'Concluir cadastro', vincular: 'Confirmar e continuar com Google' })[etapa];
    const btn = h('button', { type: 'submit', class: 'btn btn-bloco', disabled: !config.disponivel }, textoBotao);
    const form = h('form', { novalidate: true, on: { input: () => { msg.textContent = ''; }, submit: async e => {
      e.preventDefault(); msg.textContent = ''; aviso = ''; ocupado(btn, true);
      try {
        let r;
        if (cadastro || completar) {
          if (!consent.checked) throw new Error('Marque que você leu a política de privacidade.');
          const dados = { nome: nome.value, consentimento: true, ...publico.ler() };
          r = await api(completar ? '/auth/completar' : '/auth/cadastro', { metodo: 'POST', corpo: completar ? dados : { ...dados, email: email.value, senha: senha.input.value } });
        } else if (inicio) {
          senhaMigracao = senha.input.value;
          r = await api('/auth/entrar', { metodo: 'POST', corpo: { email: email.value, senha: senha.input.value } });
        } else if (etapa === 'recuperar') r = await api('/auth/recuperar', { metodo: 'POST', corpo: { email: email.value } });
        else if (etapa === 'codigo') r = await api('/auth/verificar', { metodo: 'POST', corpo: { codigo: codigo.value.replace(/[\s-]/g, ''), ...(finalidade === 'migrar' ? { senha: senhaMigracao || senha.input.value } : {}) } });
        else if (etapa === 'vincular') r = await api('/auth/google/vincular', { metodo: 'POST', corpo: { senha: senha.input.value } });
        else if (etapa === 'nova-senha') {
          if (senha.input.value !== repetir.input.value) throw new Error('As duas senhas precisam ser iguais.');
          r = await api('/auth/redefinir', { metodo: 'POST', corpo: { nova: senha.input.value } });
        }
        await concluir(r);
      } catch (err) { msg.textContent = err.message; msg.focus(); }
      finally { ocupado(btn, false); }
    } } });
    if (cadastro || completar) form.append(campo('e-nome', 'Como quer ser chamado', nome), publico.elemento);
    if (inicio || etapa === 'recuperar') form.append(campo('e-email', 'E-mail', email));
    if (inicio || ['nova-senha', 'vincular'].includes(etapa) || (etapa === 'codigo' && finalidade === 'migrar' && !senhaMigracao)) form.append(senha.elemento);
    if (etapa === 'nova-senha') form.append(repetir.elemento);
    if (etapa === 'codigo') form.append(campo('e-codigo', 'Código do e-mail', codigo));
    if (cadastro || completar) form.append(h('div', { class: 'consentimento' }, consent, h('label', { for: 'e-consent' }, 'Li e concordo com a ', h('a', { href: '/politica-de-privacidade/', target: '_blank', rel: 'noopener' }, 'política de privacidade'), '. Meus dados de estudo são usados para personalizar minhas aulas.')));
    if (aviso) form.append(h('p', { class: 'aviso-suave', role: 'status' }, aviso));
    form.append(msg, btn); caixa.append(form);
    if (inicio && !cadastro && config.recuperacao) caixa.append(h('button', { type: 'button', class: 'btn btn-texto auth-voltar', on: { click: () => { etapa = 'recuperar'; senhaMigracao = ''; desenhar(); caixa.querySelector('#e-email')?.focus(); } } }, 'Esqueci minha senha'));
    if (etapa === 'vincular') caixa.append(h('button', { type: 'button', class: 'btn btn-texto auth-voltar', on: { click: async () => {
      try { await api('/auth/cancelar', { metodo: 'POST' }); emailDigitado = emailFluxo; etapa = 'recuperar'; aviso = ''; desenhar(); }
      catch (err) { msg.textContent = err.message; }
    } } }, 'Esqueci minha senha'));
    if (etapa === 'codigo') {
      const reenviar = h('button', { type: 'button', class: 'btn btn-texto auth-voltar', on: { click: async () => {
        ocupado(reenviar, true); msg.textContent = '';
        try { const r = await api('/auth/reenviar', { metodo: 'POST' }); proximoEnvio = Date.now() + 60000; aviso = r.mensagem; desenhar(); }
        catch (err) { msg.textContent = err.message; ocupado(reenviar, false); }
      } } }, 'Reenviar código');
      const atualizar = () => { const segundos = Math.max(0, Math.ceil((proximoEnvio - Date.now()) / 1000)); reenviar.disabled = segundos > 0; reenviar.textContent = segundos ? `Reenviar código em ${segundos}s` : 'Reenviar código'; };
      atualizar(); timer = setInterval(atualizar, 1000); caixa.append(reenviar);
    }
    if (!inicio) caixa.append(h('button', { type: 'button', class: 'btn btn-texto auth-voltar', on: { click: async () => {
      try { await api('/auth/cancelar', { metodo: 'POST' }); etapa = 'inicio'; modo = 'entrar'; senhaMigracao = ''; aviso = ''; desenhar(); }
      catch (err) { msg.textContent = err.message; }
    } } }, 'Voltar para entrar'));
  }
  desenhar();
}
