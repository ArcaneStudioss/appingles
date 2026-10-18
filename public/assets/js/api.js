// Chamadas à API: sempre JSON, mesma origem, com o cabeçalho anti-CSRF.
export class ErroApi extends Error { constructor(status, msg) { super(msg); this.status = status; } }

export async function api(caminho, { metodo = 'GET', corpo } = {}) {
  const opts = { method: metodo, credentials: 'same-origin', headers: {} };
  if (metodo !== 'GET') { opts.headers['X-Inglou'] = '1'; opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(corpo || {}); }
  let r;
  try { r = await fetch('/api/v1' + caminho, opts); }
  catch { throw new ErroApi(0, 'Sem conexão. Confira sua internet e tente de novo.'); }
  let dados = null;
  try { dados = await r.json(); } catch { dados = null; }
  if (!r.ok) {
    if (r.status === 401 && !caminho.startsWith('/auth/')) { location.hash = '#/entrar'; }
    throw new ErroApi(r.status, dados?.erro || 'Não deu certo. Tente de novo.');
  }
  return dados;
}
