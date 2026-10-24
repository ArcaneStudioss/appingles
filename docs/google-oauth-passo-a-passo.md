# Criar o login com Google do Inglou

O código do app já está preparado para o Google pelo Supabase. A credencial OAuth é criada no Google Cloud e salva no painel do Supabase. Guarde o Client Secret em local privado.

## 1. Criar ou escolher o projeto no Google Cloud

Abra <https://console.cloud.google.com/> com a conta que vai administrar o Inglou. No seletor de projeto, no topo, escolha um projeto existente ou clique em **Novo projeto**, dê um nome como **Inglou** e selecione-o depois de criar.

## 2. Configurar a tela de consentimento

Abra **Google Auth Platform**. Se aparecer **Começar / Get started**, clique e preencha:

- **Nome do aplicativo:** Inglou.
- **E-mail de suporte:** um e-mail seu que possa atender os usuários.
- **Público / Audience:** Externo, para permitir contas Google de alunos e professores fora da sua organização.
- **Informações de contato:** seu e-mail de administração.

Aceite os termos apresentados e conclua. Em **Branding**, informe a página inicial `https://inglou.arcanestudios.io`, a política `https://inglou.arcanestudios.io/politica-de-privacidade/` e os termos `https://inglou.arcanestudios.io/termos/`, se esses campos forem solicitados. Em domínios autorizados, use `arcanestudios.io`; siga a verificação de propriedade se o Google a solicitar.

Para este login, use apenas os escopos básicos de identidade: `openid`, e-mail e perfil. Não é necessário pedir acesso a Gmail, Drive ou Calendar.

## 3. Criar a credencial OAuth

Vá a **Clients / Clientes → Create client / Criar cliente** em <https://console.cloud.google.com/auth/clients>. Em painéis antigos, o caminho equivalente é **APIs e serviços → Credenciais → Criar credenciais → ID do cliente OAuth**.

1. Em tipo de aplicativo, escolha **Aplicativo da Web / Web application**.
2. Em nome, escreva **Inglou Web**.
3. Em **Origens JavaScript autorizadas**, acrescente:

   ```text
   https://inglou.arcanestudios.io
   ```

4. Em **URIs de redirecionamento autorizadas**, acrescente a URL do Supabase:

   ```text
   https://zopcgkbmxcogqjojjccv.supabase.co/auth/v1/callback
   ```

5. Clique em **Criar**. Copie o **Client ID / ID do cliente** e o **Client Secret / Chave secreta do cliente**. O ID geralmente termina em `.apps.googleusercontent.com`.

## 4. Colar a credencial no Supabase

No projeto do Inglou, abra **Authentication → Sign In / Providers**. Na lista de provedores, role até **Google**, logo depois de GitLab, e abra-o.

1. Ative **Enable Sign in with Google**.
2. Cole o **Client ID** no campo **Client IDs**.
3. Cole o **Client Secret** no campo de segredo.
4. Mantenha **Skip nonce checks** desligado, se essa opção aparecer.
5. Confira se a **Callback URL** exibida é exatamente a URL cadastrada no passo 3 e salve.

## 5. Cadastrar o retorno do aplicativo

No Supabase, vá a **Authentication → URL Configuration**:

- **Site URL:** `https://inglou.arcanestudios.io`.
- **Redirect URLs → Add URL:** `https://inglou.arcanestudios.io/api/v1/auth/google/retorno`.

Salve. O retorno `/auth/v1/callback` pertence ao Supabase e é cadastrado no Google Cloud. O retorno `/api/v1/auth/google/retorno` pertence ao Inglou e é cadastrado no Supabase.

## 6. Liberar usuários e ativar na VPS

Se a configuração estiver em **Testing / Teste** no Google Cloud, abra **Audience / Público → Test users / Usuários de teste** e inclua os e-mails que vão testar o login. Quando estiver pronto para os demais usuários, use a opção de publicar o aplicativo e conclua as exigências exibidas pelo Google.

Nas variáveis privadas de **ambas** as cópias da VPS (`inglou` e `inglou-b`), mantenha as chaves Supabase e a mesma `AUTH_SESSION_KEY` já configuradas e acrescente:

```env
AUTH_PROVIDER=supabase
AUTH_GOOGLE_ENABLED=1
SITE_URL=https://inglou.arcanestudios.io
```

Recrie a cópia A, espere ficar saudável e então recrie B. Apenas reiniciar um container existente não incorpora variáveis novas. O **Client Secret do Google fica no painel do Supabase**; o app usa as chaves Supabase e não precisa dele no código ou no `.env` da VPS.

## 7. Testar

Execute `node scripts/verificar-auth.js --conexao` dentro do container. O diagnóstico deve informar que as chaves foram aceitas e que o Google está habilitado no app e no projeto.

Abra o Inglou e use **Continuar com Google**. Uma conta nova preenche idade, perfil, região opcional e consentimento. Uma conta local antiga confirma a senha original para preservar progresso e turmas. Se aparecer `redirect_uri_mismatch`, compare a URI cadastrada no Google Cloud com a Callback URL exibida pelo Supabase, incluindo o identificador do projeto.

O envio de códigos de confirmação para ações sensíveis continua dependendo do SMTP. Veja [a configuração completa do Auth](autenticacao-supabase.md).

Referências: [Google OAuth Web](https://developers.google.com/identity/protocols/oauth2/web-server), [Google pelo Supabase](https://supabase.com/docs/guides/auth/social-login/auth-google).
