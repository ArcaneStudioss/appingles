# Inglou

Plataforma de estudo de inglês que funciona como um professor particular digital: o objetivo do aluno (ex.: "entrevista de emprego daqui a 3 meses") monta o curso, e o que trava nas conversas vira a aula do dia seguinte. Proposta completa, jornada, lógica de personalização, planos e custos de IA: **[docs/PROPOSTA.md](docs/PROPOSTA.md)**.

## Rodar

Requisitos: Node 22.13 ou mais novo (usa o SQLite nativo `node:sqlite`). Uma única dependência: `@anthropic-ai/sdk`.

```bash
npm ci
npm run dev          # http://localhost:8080 (pagamento simulado, para testar a assinatura)
npm test             # 28 testes: segurança, motor de personalização e o ciclo completo
```

Sem `ANTHROPIC_API_KEY` o app funciona inteiro no **modo de prática**: conversa por roteiro do cenário, correção por regras (14 erros típicos de brasileiros), tutor que responde pelos pontos do catálogo. Com a chave, entram a conversa livre, a correção detalhada, os exercícios escritos com a situação do aluno e o processamento de materiais. Para testar os caminhos com IA sem gastar: `IA_FAKE=1` (só fora de produção).

Variáveis: ver `.env.example`.

## Interface: "o álbum do Lou" (18/10/2026)
O app é um álbum de figurinhas: cada missão é uma página, cada aula feita cola uma figurinha, a tarefa final vira a figurinha brilhante. Cada atividade tem sempre a mesma cor e ícone (aula azul, revisar sol, conversar menta, álbum lilás, meu texto turquesa, dúvidas coral). Interruptor Dia/Noite sempre à vista; o Lou lê em voz alta (português) o que está no balão dele; revisão com carinhas; a lição mostra a etapa (Entender, Praticar, Ouvir, Sua vez) e o Lou anda no trilho de progresso. O app usa só `assets/css/app.css` (a página pública continua com `base.css` + `landing.css`).

## Estrutura

```
server.js              servidor HTTP (sem framework), backup diário automático
src/http.js            cabeçalhos de segurança, CSP, lista branca de arquivos, cookies, corpo com limite
src/api.js             rotas /api/v1 (todas filtram por user_id da sessão)
src/db.js              SQLite + migrações
src/auth.js            scrypt, política de senha, sessões, limitadores
src/ia.js              tutor com IA (modelo por tarefa, JSON validado, modo simulado)
src/assinatura.js      teste de 30 dias, planos, limites de IA
src/backup-lib.js      biblioteca de backup da Arcane (cifrado, R2/B2, retenção 7/4/6)
src/conteudo/          missões, dificuldades, cenários, nivelamento, objetivos
src/motor/             plano, lição do dia, hipóteses, correção, repetição espaçada, modos sem IA
public/                página pública + app (/app/) em módulos JS, sem build
scripts/               backup manual e restauração
tests/                 seguranca, motor, ciclo
```

## Segurança (playbooks/seguranca.md da Arcane)
Nível C (backend com login e dados pessoais). Verificado em 18/10/2026:
- `templates/seguranca/auditar-codigo.sh .`: **0 falhas**, 4 atenções justificadas: HTML fixo e rede de segurança do `alert` no `arcane-ui.js` do kit; `VACUUM INTO` da biblioteca de backup (caminho gerado pelo servidor, aspas escapadas); a CSP fica em `src/http.js`, não no `server.js` (coberta pelo teste 12).
- `npm test`: traversal e byte nulo, lixo no corpo sem erro 500, SQL injection, 413, senha fraca e hash no banco, IDOR entre alunos, força bruta com IP forjado, limite geral, CSRF, cookie `__Host-` HttpOnly/Secure/SameSite, sem CORS, cabeçalhos e CSP sem `unsafe-inline`, mensagens sem vazamento, clique duplo, gabarito que não vai ao navegador, logout e exclusão de conta.
- **Não verificado ainda:** `auditar-site.sh` no ar (depende do deploy), 2FA e recuperação de senha por e-mail (não implementados no MVP).

## Backup (playbooks/backup.md da Arcane)
- [x] Tipo B (app com SQLite): backup diário automático, consistente (`VACUUM INTO`), verificado (`integrity_check`), cifrado (AES-256-GCM), retenção 7/4/6.
- [ ] Cópia **fora do servidor**: configurar `BACKUP_S3_*` (Cloudflare R2 ou Backblaze B2) e rodar um backup manual para conferir que chegou.
- [ ] Chave de recuperação guardada fora do servidor (onde: ______). Mostrar com `node scripts/backup.js --mostrar-chave`.
- [x] Restauração testada em pasta nova em 18/10/2026 (todas as tabelas conferidas e login funcionando no banco restaurado).
- Manual: `DATA_DIR=/dados npm run backup` · restaurar: `node scripts/restaurar.js arquivo.arcanebak --chave <CHAVE> --destino ./restaurado`.

## Deploy
`Dockerfile` + `docker-compose.yml` (Traefik, volume `/dados`). Passo a passo e o que confirmar antes em [docs/DEPLOY.md](docs/DEPLOY.md). Referências de CSS/JS levam `?v=<hash>` calculado na subida (cache da Cloudflare).

## Créditos de terceiros
Ícones Phosphor (MIT), fontes Fredoka, Nunito e Caveat (SIL Open Font License), servidas pelo próprio app (sem Google Fonts, por privacidade).
