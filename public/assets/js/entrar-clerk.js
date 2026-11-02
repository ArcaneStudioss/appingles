'use strict';
// Página /entrar/: único lugar que carrega o Clerk. Depois de entrar, o token do Clerk é trocado por uma
// sessão do próprio Inglou (cookie HttpOnly); a área de estudo em /app/ nunca recebe o SDK nem o token.
(async () => {
  const raiz = document.getElementById('clerk-raiz');
  const modo = ['perfil', 'excluir', 'cadastro'].includes(new URLSearchParams(location.search).get('modo')) ? new URLSearchParams(location.search).get('modo') : 'entrar';
  const h = (tag, attrs = {}, ...filhos) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) { if (v === false || v == null) continue; if (k === 'on') for (const [e, f] of Object.entries(v)) el.addEventListener(e, f); else el.setAttribute(k, v === true ? '' : v); }
    for (const f of filhos.flat()) if (f != null) el.append(f);
    return el;
  };
  const api = async (rota, corpo) => {
    const r = await fetch('/api/v1' + rota, { method: corpo ? 'POST' : 'GET', credentials: 'same-origin', headers: { 'X-Inglou': '1', ...(corpo ? { 'Content-Type': 'application/json' } : {}) }, body: corpo ? JSON.stringify(corpo) : undefined });
    let d = {}; try { d = await r.json(); } catch {}
    if (!r.ok) throw new Error(d.erro || 'Não foi possível continuar. Tente novamente.');
    return d;
  };
  const tela = (titulo, ...conteudo) => { raiz.replaceChildren(h('h1', { class: 'auth-titulo', tabindex: '-1' }, titulo), ...conteudo); raiz.querySelector('h1').focus(); };
  const voltar = h('p', { class: 'ajuda centro' }, h('a', { href: '/app/#/hoje' }, 'Voltar para o Inglou'));
  const falha = (msg) => tela('Não foi possível continuar', h('p', { class: 'erro-campo', role: 'alert' }, msg), h('p', {}, h('a', { class: 'btn btn-bloco', href: '/entrar/' }, 'Tentar novamente')));

  try {
    const estado = (await api('/auth/estado')).autenticacao || {};
    if (estado.provedor !== 'clerk' || !estado.clerk) return falha(estado.provedor === 'clerk' ? 'O acesso está temporariamente indisponível. Tente novamente mais tarde.' : 'Esta forma de acesso não está ativa.');
    const { chavePublica, frontendApi } = estado.clerk;
    await new Promise((ok, erro) => {
      const s = h('script', { async: true, crossorigin: 'anonymous', 'data-clerk-publishable-key': chavePublica, src: `https://${frontendApi}/npm/@clerk/clerk-js@5/dist/clerk.browser.js` });
      s.addEventListener('load', ok); s.addEventListener('error', () => erro(new Error('Não conseguimos carregar o acesso agora. Verifique sua conexão e tente novamente.')));
      document.head.append(s);
    });
    const clerk = window.Clerk; await clerk.load();
    const base = { signInUrl: '/entrar/', signUpUrl: '/entrar/?modo=cadastro', signInForceRedirectUrl: '/entrar/', signUpForceRedirectUrl: '/entrar/' };
    const token = () => clerk.session.getToken({ skipCache: true });
    const sair = () => clerk.signOut().then(() => location.assign('/entrar/'));

    function formularioPerfil() {
      const nome = h('input', { id: 'c-nome', type: 'text', autocomplete: 'name', maxlength: 80, required: true, value: clerk.user?.firstName || '' });
      const idade = h('input', { id: 'c-idade', type: 'number', inputmode: 'numeric', min: 1, max: 120, step: 1, required: true });
      const papel = h('select', { id: 'c-papel' }, h('option', { value: 'aluno' }, 'Aluno(a): estudar e participar de turmas'), h('option', { value: 'professor' }, 'Professor(a): criar aulas e acompanhar turmas'), h('option', { value: 'ambos' }, 'Os dois'));
      const regiao = h('select', { id: 'c-regiao' }, h('option', { value: '' }, 'Prefiro não informar'), ...[['norte', 'Norte'], ['nordeste', 'Nordeste'], ['centro-oeste', 'Centro-Oeste'], ['sudeste', 'Sudeste'], ['sul', 'Sul'], ['fora', 'Moro fora do Brasil']].map(([v, r]) => h('option', { value: v }, r)));
      const resp = h('input', { type: 'checkbox', id: 'c-resp' }), consent = h('input', { type: 'checkbox', id: 'c-consent' });
      const menor = h('div', { class: 'consentimento', hidden: true }, resp, h('label', { for: 'c-resp' }, 'O responsável autorizou o estudo nesta conta.'));
      idade.addEventListener('input', () => { const n = Number(idade.value); menor.hidden = !(idade.value !== '' && n >= 1 && n < 18); });
      const msg = h('p', { class: 'erro-campo', role: 'alert' }), btn = h('button', { type: 'submit', class: 'btn btn-bloco' }, 'Concluir cadastro');
      const campo = (id, r, el) => h('div', { class: 'campo' }, h('label', { for: id }, r), el);
      const form = h('form', { novalidate: true, on: { submit: async e => {
        e.preventDefault(); msg.textContent = '';
        const n = Number(idade.value);
        if (!consent.checked) return void (msg.textContent = 'Marque que você leu a política de privacidade.');
        if (!idade.value || !Number.isInteger(n) || n < 1 || n > 120) return void (msg.textContent = 'Informe uma idade válida, em anos.');
        if (n < 18 && !resp.checked) return void (msg.textContent = 'Confirme a autorização do responsável.');
        btn.disabled = true;
        try { await concluir({ nome: nome.value, idade: n, papel: papel.value, regiao: regiao.value || null, responsavel: resp.checked, consentimento: true }); }
        catch (err) { msg.textContent = err.message; btn.disabled = false; }
      } } },
      campo('c-nome', 'Como quer ser chamado', nome), campo('c-idade', 'Idade de quem vai estudar', idade), menor, campo('c-papel', 'Como vai usar a plataforma?', papel), campo('c-regiao', 'Região (opcional)', regiao),
      h('div', { class: 'consentimento' }, consent, h('label', { for: 'c-consent' }, 'Li e concordo com a ', h('a', { href: '/politica-de-privacidade/', target: '_blank', rel: 'noopener' }, 'política de privacidade'), '.')), msg, btn);
      return form;
    }
    function formularioSenha(email) {
      const senha = h('input', { id: 'c-senha', type: 'password', autocomplete: 'current-password', maxlength: 200, required: true });
      const msg = h('p', { class: 'erro-campo', role: 'alert' }), btn = h('button', { type: 'submit', class: 'btn btn-bloco' }, 'Confirmar e continuar');
      return h('form', { novalidate: true, on: { submit: async e => {
        e.preventDefault(); msg.textContent = ''; btn.disabled = true;
        try { await concluir({ senha: senha.value }); } catch (err) { msg.textContent = err.message; btn.disabled = false; }
      } } }, h('p', { class: 'ajuda' }, `Já existe uma conta do Inglou com ${email}. Confirme a senha que você usava antes para manter seus estudos, assinatura e turmas.`),
      h('div', { class: 'campo' }, h('label', { for: 'c-senha' }, 'Senha atual do Inglou'), senha), msg, btn);
    }
    async function concluir(extra = {}) {
      const r = await api('/auth/clerk', { token: await token(), ...extra });
      if (r.etapa === 'completar') return tela('Vamos preparar seu espaço', h('p', { class: 'ajuda' }, 'Seu e-mail já foi confirmado: ' + r.email + '. Falta contar como quer usar o Inglou.'), formularioPerfil());
      if (r.etapa === 'vincular') return tela('Seus estudos continuam aqui', formularioSenha(r.email));
      location.replace('/app/#/entrar');
    }

    if (modo === 'perfil') {
      if (!clerk.user) return location.replace('/entrar/');
      const caixa = h('div'); tela('Sua conta', caixa, voltar); clerk.mountUserProfile(caixa); return;
    }
    if (modo === 'excluir') {
      if (!clerk.user) return location.replace('/entrar/');
      const msg = h('p', { class: 'erro-campo', role: 'alert' });
      const btn = h('button', { type: 'button', class: 'btn btn-bloco btn-perigo', on: { click: async () => {
        msg.textContent = ''; btn.disabled = true;
        try { await api('/conta/excluir', { token: await token(), confirmar: true }); await clerk.signOut().catch(() => {}); location.replace('/'); }
        catch (err) { msg.textContent = err.message; btn.disabled = false; }
      } } }, 'Excluir minha conta');
      return tela('Excluir conta', h('p', { class: 'ajuda' }, 'Apaga a conta e todos os seus dados de estudo, de vez. Se quiser, exporte seus dados antes.'), msg, btn, voltar);
    }
    if (clerk.session && clerk.user) { tela('Entrando…', h('p', { class: 'ajuda', role: 'status' }, 'Só um instante.')); try { return await concluir(); } catch (err) { return tela('Não foi possível continuar', h('p', { class: 'erro-campo', role: 'alert' }, err.message), h('button', { type: 'button', class: 'btn btn-bloco', on: { click: sair } }, 'Entrar com outra conta')); } }
    const caixa = h('div', { class: 'clerk-montagem' });
    tela(modo === 'cadastro' ? 'Crie sua conta' : 'Entre na sua conta', caixa, h('p', { class: 'ajuda centro' }, '30 dias grátis, sem cartão. ', h('a', { href: '/' }, 'Conhecer o Inglou')));
    let trocando = false;
    clerk.addListener(({ session }) => { if (session && !trocando) { trocando = true; concluir().catch(err => falha(err.message)); } });
    if (modo === 'cadastro') clerk.mountSignUp(caixa, base); else clerk.mountSignIn(caixa, base);
  } catch (err) { falha(err.message); }
})();
