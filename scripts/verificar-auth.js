'use strict';
// Diagnóstico privado: imprime apenas presença das configurações e status, nunca chaves ou usuários.
const path = require('node:path');
try { process.loadEnvFile(path.join(__dirname, '..', '.env')); } catch (e) { if (e.code !== 'ENOENT') throw e; }
const { criarSupabase } = require('../src/auth-supabase');
const { createClient } = require('@supabase/supabase-js');
(async () => {
  const nomes = ['SUPABASE_URL', 'SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_SECRET_KEY', 'AUTH_SESSION_KEY'];
  for (const nome of nomes) console.log(`${nome}: ${process.env[nome] ? 'presente' : 'ausente'}`);
  const env = { ...process.env, AUTH_PROVIDER: 'supabase' }, s = criarSupabase({ env });
  console.log('Provedor ativo no app:', process.env.AUTH_PROVIDER === 'supabase' ? 'Supabase' : 'local');
  console.log('Configuração válida:', s.disponivel ? 'sim' : 'não');
  if (!s.disponivel) { process.exitCode = 1; return; }
  if (!process.argv.includes('--conexao')) return;
  const requisicao = (input, opts = {}) => fetch(input, { ...opts, signal: AbortSignal.timeout(12000) });
  const r = await requisicao(new URL('/auth/v1/settings', env.SUPABASE_URL), { headers: { apikey: env.SUPABASE_PUBLISHABLE_KEY } });
  console.log('Chave pública aceita:', r.ok ? 'sim' : 'não');
  const c = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: requisicao } });
  const { error } = await c.auth.admin.listUsers({ page: 1, perPage: 1 });
  console.log('Chave de servidor aceita:', error ? 'não' : 'sim');
  console.log('Envio de e-mail: testar pelo cadastro; este diagnóstico não envia mensagens.');
  if (!r.ok || error) process.exitCode = 1;
})().catch(() => { console.error('Falha de conexão com a autenticação. Nenhuma credencial foi exibida.'); process.exitCode = 1; });
