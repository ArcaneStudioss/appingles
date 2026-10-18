# Inglou

Plataforma de estudo de inglês que funciona como um professor particular digital: o objetivo do aluno (ex.: "entrevista de emprego daqui a 3 meses") monta o curso, e o que trava nas conversas vira a aula do dia seguinte. Proposta completa, jornada, lógica de personalização, planos e custos de IA: **[docs/PROPOSTA.md](docs/PROPOSTA.md)**.

## Rodar

Requisitos: Node 22.13 ou mais novo (usa o SQLite nativo `node:sqlite`). Uma única dependência: `@anthropic-ai/sdk`.

```bash
npm ci
npm run dev          # http://localhost:8080 (pagamento simulado, para testar a assinatura)
npm test             # 36 testes: segurança, motor de personalização e o ciclo completo
```

Sem `ANTHROPIC_API_KEY` o app funciona inteiro no **modo de prática**: conversa por roteiro do cenário, correção por regras (14 erros típicos de brasileiros), tutor que responde pelos pontos do catálogo. Com a chave, entram a conversa livre, a correção detalhada, os exercícios escritos com a situação do aluno e o processamento de materiais. Para testar os caminhos com IA sem gastar: `IA_FAKE=1` (só fora de produção).

Variáveis: ver `.env.example`.

## Interface: "o álbum do Tuiuiú" (18/10/2026)
O app é um álbum de figurinhas: cada missão é uma página, cada aula feita cola uma figurinha, a tarefa final vira a figurinha brilhante. Cada atividade tem sempre a mesma cor e ícone (aula azul, revisar sol, conversar menta, álbum lilás, meu texto turquesa, dúvidas coral). Interruptor Dia/Noite sempre à vista; o Tuiuiú lê em voz alta (português) o que está no balão dele; revisão com carinhas; a lição mostra a etapa (Entender, Praticar, Ouvir, Sua vez) e o Tuiuiú anda no trilho de progresso. O app usa só `assets/css/app.css` (a página pública continua com `base.css` + `landing.css`).

## Sequência e Rádio Tuiuiú (18/10/2026)
- **Sequência de dias** (`src/motor/sequencia.js`): calculada de `dias_estudo`, sem castigo. Hoje sem estudo não quebra; a cada 7 dias seguidos ganha 1 escudo (até 2) que salva um dia perdido; o recorde fica. Prêmios viram figurinhas especiais aos 3, 7, 14, 30, 60, 100, 200 e 365 dias.
- **Rádio Tuiuiú** (`src/motor/podcast.js`, tela `#/podcast`): um episódio por dia com os tropeços dos últimos 21 dias (focos + respostas erradas). O Tuiuiú explica em português, a Mia fala inglês, com pausas de "repita". A frase errada aparece riscada e nunca é falada. Sem IA, o roteiro sai do catálogo; com IA, `ia.podcast` escreve (limite `podcast` por mês). Treino no fim, corrigido no servidor. Ouvir até o fim conta como dia de estudo. Áudio pela voz do aparelho (sem custo).

## Meu jeito de aprender e treino focado (18/10/2026)
Personalização por **desempenho, não por rótulo** (a ideia de "estilos de aprendizagem" visual/auditivo não tem apoio forte na pesquisa; o que funciona é medir o que a pessoa acerta em cada modo e treinar o fraco). `#/aprender`: retrato por modo (**ler** = reconhecer, **escrever** = produzir, **ouvir** = áudio) com acertos, tempo, uso de dica e confiança dos dados; "o que eu percebi" (cada conclusão diz em que se baseia); dificuldades em ordem (erro recente pesa mais, meia-vida de 14 dias); erros só dele (os que a IA achou e o catálogo não cobre, viram cartão e exercício "corrija a frase"); preferência declarada (pesa pouco, +15% no modo escolhido). `#/treino`: 6 a 10 perguntas por dia, 100% nas dificuldades, com mais do modo mais fraco, ditados derivados das mesmas frases, e frases novas da IA sobre a área e os erros reais do aluno (cota `treino`). Motor em `src/motor/aprendizagem.js`. Tabela `treinos` e coluna `perfis.estilos` (migração 5, só acréscimo).

## Estudo sob medida (18/10/2026)
Para quem tem uma prova, entrevista ou viagem: `#/sobmedida`. O aluno descreve o que cai (e, se quiser, cola o material e põe a data); o app separa em **assuntos** em ordem, calcula quantos por dia até a data, e cada assunto vira uma mini-aula (explicação, exemplos, palavras, dicas, 5 exercícios) criada na primeira abertura. No fim, **mini simulado** sem consulta (as perguntas saem do que o aluno já abriu; o resultado vem por assunto, com aviso de que não prevê a nota real). Os erros viram cartões de revisão e entram na Rádio Tuiuiú. Motor em `src/motor/estudo.js`; com IA, `ia.planejarEstudo` e `ia.estudarAssunto` (cota `estudo`); sem IA usa o catálogo de dificuldades e o texto colado, e avisa o que não cobre em vez de inventar. Tabela `estudos` (migração 4). Entra no export e na exclusão de dados.

## Mascote
**Tuiuiú é uma arara-azul-grande** (orgulho do Brasil; azul-cobalto, anel e bochechas amarelos, bico curvo). A **Mia**, que dá voz ao inglês na Rádio Tuiuiú, é uma **arara-vermelha**. Desenho em `public/assets/js/diversao.js` (função `lou`, 5 humores, cores por variável `--arara-*` que acompanham Dia/Noite). Ícones do app e favicon: arara sobre fundo amarelo (`public/assets/img/`, `public/favicon.svg`).

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
