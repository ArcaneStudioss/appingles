# Login com Supabase Auth

O app mantém seus dados de estudo e turmas no SQLite. Supabase Auth cuida da identidade, das senhas e dos códigos enviados por e-mail. Não é necessário migrar o banco de aulas para o Supabase nem fornecer sua senha de PostgreSQL.

## Preparar o projeto

1. Use um projeto Supabase dedicado ao Inglou. Em **Project Settings → API Keys**, obtenha a **Project URL**, a chave **Publishable** (a antiga `anon` também funciona) e uma chave **Secret** (ou a antiga `service_role`). A chave Secret permite excluir a identidade ao excluir a conta e fica apenas no servidor.
2. Em **Authentication → Providers → Email**, habilite e-mail/senha. Mantenha confirmação de e-mail ligada e configure uma senha mínima de 10 caracteres.
3. Configure **Custom SMTP** para o envio real. O serviço padrão do Supabase tem restrições de destinatários e de quantidade e não substitui um serviço de e-mail para os alunos.
4. Em **Authentication → Email Templates**, configure **Confirm signup** e **Magic Link** para exibir o código `{{ .Token }}`. O app pede o código na mesma janela em que o usuário começou. Um texto de exemplo: `<h2>Seu código do Inglou</h2><p>Digite este código na tela do app:</p><p><strong>{{ .Token }}</strong></p><p>Se você não pediu este acesso, ignore esta mensagem.</p>`. Não use apenas um link de confirmação: o app não recebe tokens por URL. Migração e recuperação usam o envio de código do Magic Link, com finalidade separada e validada pelo servidor.
5. Configure **Site URL** como `https://inglou.arcanestudios.io`. Cadastros, senhas, perfil e códigos são enviados somente à API do próprio app; não há SDK Supabase no navegador nem JWT em localStorage.

## Configurar a VPS

Em **ambos** os projetos Docker (`inglou` e `inglou-b`), preserve as variáveis atuais e acrescente:

```env
AUTH_PROVIDER=supabase
SUPABASE_URL=https://SEU_PROJETO.supabase.co
SUPABASE_PUBLISHABLE_KEY=SUA_CHAVE_PUBLICAVEL
SUPABASE_SECRET_KEY=SUA_CHAVE_SECRET_DO_SERVIDOR
AUTH_SESSION_KEY=CHAVE_HEXADECIMAL_ALEATORIA_COM_64_CARACTERES
```

Gere `AUTH_SESSION_KEY` uma vez em um terminal privado com `node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('hex'))"`. Copie o **mesmo valor** para as duas réplicas e guarde-o com os demais segredos. Não use a senha do banco, não publique `.env` e não coloque a Secret no código público. Trocar essa chave invalida os tokens cifrados das sessões existentes.

Os arquivos `docs/vps/docker-compose.yml` e `docker-compose-b.yml` já repassam essas variáveis. Aplique a configuração recriando A, espere ficar saudável e então recrie B. Só reiniciar não incorpora variáveis novas. As duas cópias precisam usar o mesmo projeto, as mesmas chaves e o mesmo volume de dados. O Dockerfile já inclui os módulos necessários por `npm ci`.

Até concluir a configuração, mantenha `AUTH_PROVIDER=local`. Ativar `supabase` sem todas as chaves bloqueia o acesso externo com erro temporário; não há retorno silencioso à senha local em caso de falha do provedor. Contas já migradas continuam exigindo o provedor mesmo se a variável for revertida para `local`.

Execute `node scripts/verificar-auth.js --conexao` dentro do container para validar as configurações e testar as duas chaves. Ele não exibe credenciais, não imprime usuários e não envia e-mails. Depois teste o cadastro pela interface com um e-mail seu, recebimento do código, logout, login e recuperação de senha.

## Contas existentes

A migração é gradual, sem substituir IDs de alunos ou professores. Quem já está conectado continua estudando. No próximo login com a senha antiga correta, o app pede um código enviado ao e-mail. Depois da confirmação, transfere a autenticação, mantém a mesma senha, remove seu hash local e encerra as sessões locais antigas. Progresso, assinatura, idade, região e turmas permanecem no mesmo usuário.

Quem esqueceu a senha pode confirmar o e-mail pela recuperação e escolher outra. Possuir um e-mail digitado, um UUID ou metadados do Supabase não basta para assumir uma conta. Vínculos existentes não são substituídos por outro UUID. Usuários externos sem cadastro no app confirmam o e-mail e preenchem nome, idade, perfil, região opcional e consentimento antes de acessar dados.

O app exige código de confirmação no primeiro cadastro mesmo se a confirmação for desligada no projeto. Não importa papéis, idade ou consentimento de `user_metadata`: esses dados são validados e mantidos no app.

## Sessões e recuperação

- O navegador recebe cookies **HttpOnly**, **SameSite=Lax** e **Secure** em HTTPS. O cookie temporário de confirmação vale por 15 minutos e é restrito ao caminho de autenticação.
- JWT e refresh tokens ficam cifrados com AES-256-GCM no servidor, vinculados ao hash da sessão. O Supabase valida o JWT; tokens são renovados antes de expirar. Falha de rede não libera acesso nem apaga o histórico.
- Fluxos temporários são cifrados, expiram em 15 minutos e são removidos por uma limpeza periódica a cada minuto. Códigos são verificados pelo Supabase. Há limite de cinco verificações por fluxo e limites compartilhados no SQLite para tentativas e envio de e-mail nas duas réplicas.
- Recuperação não revela se o e-mail existe e não abre uma sessão completa antes de salvar a nova senha. Alterar ou recuperar senha encerra as outras sessões do app e do provedor.
- Excluir conta exige a senha atual e apaga primeiro a identidade no Supabase; somente depois remove os dados locais. Se o provedor não confirmar a exclusão, o histórico local é preservado para nova tentativa.
- Dados de identidade e sessão não aparecem no painel do professor, na exportação de estudos ou nas respostas públicas. A política de privacidade descreve o envio de e-mail/senha ao Supabase.

## Validação sem projeto real

`npm test` inclui cenários com provedor simulado: confirmação, limites de códigos, migração sem perda de histórico, isolamento de navegadores, recuperação, renovação concorrente, indisponibilidade, mudança de senha e exclusão. Essas verificações não substituem o teste real de SMTP e das chaves no projeto de produção.

Referências oficiais: [Auth](https://supabase.com/docs/guides/auth), [senhas e recuperação](https://supabase.com/docs/guides/auth/passwords), [templates de e-mail](https://supabase.com/docs/guides/auth/auth-email-templates), [validação de JWT](https://supabase.com/docs/reference/javascript/auth-getclaims), [encerramento de sessões](https://supabase.com/docs/guides/auth/signout).
