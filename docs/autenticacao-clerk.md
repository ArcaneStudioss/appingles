# Login com Clerk

O Clerk cuida de identidade, senha, código por e-mail e Google, no navegador, **somente na página `/entrar/`**. Depois de entrar, o servidor troca o token do Clerk uma única vez por uma sessão própria do Inglou (cookie HttpOnly, só o hash no SQLite). A área de estudo (`/app/`) mantém a política de segurança estrita e nunca recebe o SDK do Clerk nem o token. Progresso, assinatura, idade, região e turmas continuam no SQLite, com os mesmos IDs.

## Configurar o painel do Clerk

1. **E-mail**: cadastro com e-mail obrigatório e verificação por **código**; login por senha e por código de e-mail. Link de verificação desligado.
2. **Google**: ligado para cadastro e login. Em produção use credenciais próprias (Google Cloud → OAuth Client ID, tipo Web) e cadastre no Google a URI de redirecionamento exibida no Clerk para a instância de produção.
3. **Domínios**: a instância de produção precisa do domínio verificado (registros DNS pedidos pelo Clerk). A chave `pk_live_...` só funciona no domínio da instância; em `localhost` use as chaves de **teste** (`pk_test_...`/`sk_test_...`).
4. Instância dedicada: se outros sites da Arcane usam a mesma instância, as mesmas identidades poderão entrar no Inglou (o servidor só aceita tokens emitidos para a origem do `SITE_URL`, mas a base de usuários seria compartilhada). Prefira uma instância só do Inglou.

## Variáveis (as duas réplicas, `inglou` e `inglou-b`)

```env
AUTH_PROVIDER=clerk
CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
SITE_URL=https://inglou.arcanestudios.io
```

`SITE_URL` é obrigatório: é a origem aceita no token (`azp`). A chave Secret fica só no servidor (`.env` ignorado pelo Git ou segredos da VPS), nunca em código, documentação ou mensagens. Sem as chaves ou o `SITE_URL`, o acesso responde 503 e **não** volta para a senha local. Recrie os containers (A, depois B): reiniciar não incorpora variáveis novas.

## Como o acesso funciona

- `/app/#/entrar` mostra “Entrar” e “Criar conta”, que levam a `/entrar/`.
- Em `/entrar/` o Clerk faz o login; a página envia o token a `POST /api/v1/auth/clerk`. O servidor verifica assinatura, validade e origem do token, busca o usuário no Clerk e exige **e-mail principal verificado** e conta não bloqueada.
- Identidade já vinculada → sessão aberta. Sem vínculo e e-mail novo → a página pede nome, idade, perfil, região opcional e consentimento (menores confirmam a autorização do responsável) e só então cria a conta.
- **Conta antiga com o mesmo e-mail (senha local)**: como o Clerk só entrega token com e-mail principal verificado (código ou Google), o app vincula a conta sem pedir a senha antiga, mantendo ID, histórico, assinatura e turmas. A senha antiga deixa de valer e as sessões antigas são encerradas. Contas do Supabase com o mesmo e-mail verificado também são vinculadas. Uma conta já vinculada a um usuário do Clerk nunca é reassumida por outro.
- A sessão do Clerk de origem é conferida a cada 5 minutos; se for revogada no Clerk, o acesso no Inglou termina. Se o Clerk estiver fora do ar na hora da conferência, o app falha fechado (503).
- **Sair** revoga a sessão no Clerk. **Gerenciar conta** (`/entrar/?modo=perfil`) abre o perfil do Clerk para e-mail, senha e Google. **Excluir conta** (`/entrar/?modo=excluir`) apaga os dados do app e o usuário no Clerk.
- Com `AUTH_PROVIDER=clerk`, `/auth/cadastro` e `/auth/entrar` locais respondem 410.

## Política de segurança da página de acesso

Somente `/entrar/` recebe uma política mais ampla (script do domínio da Frontend API do Clerk e `challenges.cloudflare.com`, `img.clerk.com`, `style-src 'unsafe-inline'` e `worker-src blob:`, exigidos pelos componentes do Clerk). Confira no [guia de CSP do Clerk](https://clerk.com/docs/guides/secure/best-practices/csp-headers) se a lista mudou.

## O que foi e o que não foi verificado

`npm test` cobre este fluxo com um Clerk simulado (`tests/auth-clerk.test.js`): e-mail não verificado, origem errada, vínculo de conta antiga, sessão revogada, saída e exclusão. **Não foram testados com o Clerk real**: o carregamento do script e da política de segurança, o botão do Google, o recebimento do código por e-mail, a revogação de sessão e a exclusão do usuário. Teste na VPS ou com chaves de teste em um domínio permitido, usando um e-mail seu.

## Limites conhecidos

- A confirmação de “Excluir conta” é um token recém-emitido do Clerk mais o clique de confirmação, não uma nova verificação de senha.
- O Supabase continua no código para contas já migradas; `AUTH_PROVIDER=supabase` segue funcionando.
