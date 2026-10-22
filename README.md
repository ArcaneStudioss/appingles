# Inglou

Plataforma de inglês por assinatura para crianças, adolescentes e adultos, com estudo individual e turmas de professores. A idade orienta os temas e a linguagem; o nível de inglês orienta a dificuldade. O objetivo do aluno monta o curso, e as dificuldades das atividades e conversas ajudam a escolher a próxima aula.

## Experiência por idade e papel

- Cadastro com idade e escolha entre aluno e professor. Contas existentes informam esses dados uma vez na entrada; alterações ficam em Conta. Faixas: crianças até 12 anos, adolescentes de 13 a 17, adultos a partir de 18. O cadastro de menores registra a confirmação de autorização do responsável.
- Região do Brasil opcional no cadastro e na conta: Norte, Nordeste, Centro-Oeste, Sudeste e Sul, além de não informar ou morar fora do Brasil. A escolha é salva por conta, destaca o vocabulário regional e orienta o contexto do tutor, sem restringir outros exemplos nem usar geolocalização.
- Navegação principal curta no celular e no computador: Hoje, Biblioteca, Progresso, Turmas e Mais. Professores têm Painel, Biblioteca, Conta e Mais. Os demais recursos ficam agrupados por finalidade em Mais, e turmas e aulas têm caminhos de volta visíveis. Cores, cartões, mascote e temas dia/noite mantêm a identidade do app.
- Contextos diferentes na trilha, biblioteca, nivelamento e conversas. A idade não limita o nível alcançado. O tutor com IA recebe a orientação de público, além do nível e do objetivo.
- Iniciantes começam com três expressões por vez e até cinco atividades em cerca de cinco minutos. Reconhecer vem antes de completar e escrever. Dicas, respostas explicadas, áudio e repetição funcionam sem IA.
- Toque nas palavras sublinhadas em inglês para abrir a tradução acima delas. O dicionário funciona localmente, complementado pelo vocabulário do catálogo; palavras ainda não cobertas não recebem traduções inventadas. O significado contextual da frase aparece quando disponível. Os botões de seleção de resposta mantêm sua função original.
- Biblioteca (`#/biblioteca`): 15 capítulos, cinco por público, de A1 a B1, com 75 questões de vocabulário, leitura e aplicação. Há texto, tradução de apoio, áudio, explicação e cartões de revisão. Professores podem acrescentar seus conteúdos, inclusive de outros níveis.
- Do Brasil pro mundo (`#/brasil`): 24 fichas com nomes regionais, gírias de internet e ditados; equivalentes, exemplos, contexto, registro, áudio e fontes. Busca por aliases (bergamota, mexerica, tangerina) e destaque das cinco regiões. Adolescentes começam pelos chats; crianças, pelos jeitos do Brasil. Seis capítulos da biblioteca praticam esses conteúdos em 30 questões. O tradutor entende expressões inteiras, como no cap. Critérios e fontes em [docs/brasil-pro-mundo.md](docs/brasil-pro-mundo.md).
- Área do professor (`#/professor`): criar turma com público e nível, filtrar questões por assunto, tipo e nível, usar capítulos como modelo, escrever interpretação de texto e vocabulário, acrescentar material de estudo, conferir a prévia e publicar a aula. É possível reutilizar uma aula em outra turma sem copiar respostas.
- Área do aluno (`#/turmas`): entrar por código, estudar o material do professor, responder uma questão por vez, consultar o conteúdo e rever respostas e explicações. A primeira tentativa fica registrada; novas tentativas de prática não duplicam notas nem progresso.

As migrações 7 e 8 apenas acrescentam colunas e a tabela `biblioteca_progressos`; preservam contas, assinaturas, turmas e histórico. O progresso novo e a região declarada entram na exportação e exclusão de dados. Os preços e o processamento de pagamentos permanecem sob o módulo de assinatura existente.

Proposta original, personalização e custos de IA: **[docs/PROPOSTA.md](docs/PROPOSTA.md)**.

## Rodar

Requisitos: Node 22.13 ou mais novo (usa o SQLite nativo `node:sqlite`). Uma única dependência: `@anthropic-ai/sdk`.

```bash
npm ci
npm run dev          # http://localhost:8080 (pagamento simulado, para testar a assinatura)
npm test             # 103 testes: login, Google, segurança, vozes, turmas e aprendizagem guiada
```

Sem `ANTHROPIC_API_KEY` o app funciona inteiro no **modo de prática**: conversa por roteiro do cenário, correção por regras (14 erros típicos de brasileiros), tutor que responde pelos pontos do catálogo. Com a chave, entram a conversa livre, a correção detalhada, os exercícios escritos com a situação do aluno e o processamento de materiais. Para testar os caminhos com IA sem gastar: `IA_FAKE=1` (só fora de produção).

Variáveis: ver `.env.example`.

## Interface: "o álbum do Tuiuiú" (18/10/2026)
O app é um álbum de figurinhas: cada missão é uma página, cada aula feita cola uma figurinha, a tarefa final vira a figurinha brilhante. Cada atividade tem sempre a mesma cor e ícone (aula azul, revisar sol, conversar menta, álbum lilás, meu texto turquesa, dúvidas coral). Interruptor Dia/Noite sempre à vista; o Tuiuiú lê em voz alta (português) o que está no balão dele; revisão com carinhas; a lição mostra a etapa (Entender, Praticar, Ouvir, Sua vez) e o Tuiuiú anda no trilho de progresso. O app usa só `assets/css/app.css` (a página pública continua com `base.css` + `landing.css`).

## Navegação no celular e no computador (21/10/2026)
A navegação do aluno tem Hoje, Biblioteca, Progresso (Álbum para crianças), Turmas e **Mais**. No perfil professor, aparecem Painel, Biblioteca, Conta e Mais. A janela Mais agrupa os outros recursos em Praticar inglês, Personalizar estudos e Ensino e conta. A tela Hoje prioriza a aula do dia e as atividades da turma; outras formas de praticar e a trilha ficam em seções expansíveis. Quem escolhe "Começar do zero" segue direto para uma aula curta, sem teste de nível.

## Atividades de jogo e trilha de debate (19/10/2026)
- **Caça ao erro** (`detetive`): a frase vira palavras tocáveis e o aluno acha a errada. Uma por missão antiga (`src/conteudo/detetives.js`); só os tokens vão ao navegador, o índice do erro fica no servidor.
- **Combo**: acertos seguidos acendem uma chama no topo da lição (sons e frases em 3, 5, 8 e 10; errar só zera, sem punição) e o placar final mostra o melhor combo.
- **Oponente do debate**: numa escolha, `oponente: { nome, fala }` faz a outra pessoa falar primeiro; o aluno escolhe a melhor resposta. Argumentos viram quebra-cabeça com `ordenar` em blocos de frase.
- **Objetivo "Debater e argumentar"** (`src/conteudo/trilha-debate.js`, B1 a C1): opinião com motivo e exemplo, discordar com educação, argumento completo, palavras precisas (outweigh, drawback, trade-off, falsos amigos), mediar e resumir, defender e rebater com cautela. Cada missão tem cenário de conversa próprio e duas dificuldades novas no catálogo (`debate-expressoes`, `conectores-contraste`) com detectores para "according to me", "in the other hand", "discuss about", "although..., but" e "despite of".


## Sequência e Rádio Tuiuiú (18/10/2026)
- **Sequência de dias** (`src/motor/sequencia.js`): calculada de `dias_estudo`, sem castigo. Hoje sem estudo não quebra; a cada 7 dias seguidos ganha 1 escudo (até 2) que salva um dia perdido; o recorde fica. Prêmios viram figurinhas especiais aos 3, 7, 14, 30, 60, 100, 200 e 365 dias.
- **Rádio Tuiuiú** (`src/motor/podcast.js`, tela `#/podcast`): um episódio por dia com os tropeços dos últimos 21 dias (focos + respostas erradas). O Tuiuiú explica em português, a Mia fala inglês, com pausas de "repita". A frase errada aparece riscada e nunca é falada. Sem IA, o roteiro sai do catálogo; com IA, `ia.podcast` escreve (limite `podcast` por mês). Treino no fim, corrigido no servidor. Ouvir até o fim conta como dia de estudo. Áudio exclusivamente pelas quatro vozes oficiais da Mia e do Tuiuiú, com síntese ElevenLabs no servidor e cache privado. Configuração em [docs/vozes-personagens.md](docs/vozes-personagens.md).

## Meu jeito de aprender e treino focado (18/10/2026)
Personalização por **desempenho, não por rótulo** (a ideia de "estilos de aprendizagem" visual/auditivo não tem apoio forte na pesquisa; o que funciona é medir o que a pessoa acerta em cada modo e treinar o fraco). `#/aprender`: retrato por modo (**ler** = reconhecer, **escrever** = produzir, **ouvir** = áudio) com acertos, tempo, uso de dica e confiança dos dados; "o que eu percebi" (cada conclusão diz em que se baseia); dificuldades em ordem (erro recente pesa mais, meia-vida de 14 dias); erros só dele (os que a IA achou e o catálogo não cobre, viram cartão e exercício "corrija a frase"); preferência declarada (pesa pouco, +15% no modo escolhido). `#/treino`: 6 a 10 perguntas por dia, 100% nas dificuldades, com mais do modo mais fraco, ditados derivados das mesmas frases, e frases novas da IA sobre a área e os erros reais do aluno (cota `treino`). Motor em `src/motor/aprendizagem.js`. Tabela `treinos` e coluna `perfis.estilos` (migração 5, só acréscimo).

## Estudo sob medida (18/10/2026)
Para quem tem uma prova, entrevista ou viagem: `#/sobmedida`. O aluno descreve o que cai (e, se quiser, cola o material e põe a data); o app separa em **assuntos** em ordem, calcula quantos por dia até a data, e cada assunto vira uma mini-aula (explicação, exemplos, palavras, dicas, 5 exercícios) criada na primeira abertura. No fim, **mini simulado** sem consulta (as perguntas saem do que o aluno já abriu; o resultado vem por assunto, com aviso de que não prevê a nota real). Os erros viram cartões de revisão e entram na Rádio Tuiuiú. Motor em `src/motor/estudo.js`; com IA, `ia.planejarEstudo` e `ia.estudarAssunto` (cota `estudo`); sem IA usa o catálogo de dificuldades e o texto colado, e avisa o que não cobre em vez de inventar. Tabela `estudos` (migração 4). Entra no export e na exclusão de dados.

## Turmas do professor (19/10/2026)
Qualquer conta pode **criar uma turma** (vira professor dela) e **entrar em turmas** por código. O aluno acessa `#/turmas` pela barra principal; o professor acessa `#/professor` pelo Painel ou por Mais > Área do professor. Ao criar a turma, recebe um código de 6 caracteres (sem 0/O/1/I/L) e um link (`#/turmas?codigo=...`: quem abre sem conta cria uma e volta para a tela de entrada). Painel da turma (`#/turma/ID`): código com copiar/trocar, atividades, alunos (respondidas, acerto, atividades feitas, última) e **dificuldades da turma** (erros por ponto de gramática ou habilidade). Nova atividade (`#/turma/ID/nova`): material de estudo, questões filtradas por tema, nível, público e tipo, capítulos prontos como modelo e perguntas próprias (escolha, vocabulário, leitura, lacuna e tradução), com prévia e prazo opcional. Resultado por pergunta e por aluno em `#/turma/ID/aN`; a aula pode ser reutilizada em outra turma. O aluno vê um cartão em Hoje com as atividades pendentes e faz a atividade como a lição (a correção é no servidor; o gabarito aparece após responder ou pedir ajuda). As respostas também alimentam o plano pessoal do aluno.
- **Privacidade:** o professor vê nome, acertos, tempo e conclusão só nas atividades da turma; nunca o que o aluno digitou, conversas, textos, cartões nem o resto do estudo. O aluno entra ciente disso, pode sair quando quiser (as respostas dele na turma são apagadas) e a exportação de dados inclui a participação em turmas.
- **Código:** `src/turmas.js` (rotas), `src/motor/turmas.js` (código, validação das perguntas, métricas), telas `telas/turmas.js` (aluno) e `telas/professor.js`. Migração 6 (só acréscimo): `turmas`, `turma_alunos`, `atividades`, `atividade_respostas`. Testes em `tests/turmas.test.js`.
- **Ainda não tem:** convite por e-mail (o app não envia e-mail), perguntas de escuta/fala escritas pelo professor, e a edição de atividades já publicadas.

## Mascote
**Tuiuiú é uma arara-azul-grande** (orgulho do Brasil; azul-cobalto, anel e bochechas amarelos, bico curvo). A **Mia**, que dá voz ao inglês na Rádio Tuiuiú, é a **tutora e dona do Tuiuiú**: uma adolescente negra de tranças (miçangas rosa e amarelas, camisa azul, jeans e tênis). Mesmos 5 humores do Tuiuiú. Desenho em `public/assets/js/diversao.js` (função `lou` para o Tuiuiú, com cores por variável `--arara-*` que acompanham Dia/Noite; `lou(humor, { mia: true })` desenha a Mia, com cores fixas). Ícones do app e favicon: arara sobre fundo amarelo (`public/assets/img/`, `public/favicon.svg`).

Mia e Tuiuiú acompanham as atividades em `public/assets/js/companheiros.js`: instruções próprias para cada tipo de questão, dicas, incentivo ao errar, toca aqui nos acertos, palmas após conseguir numa nova tentativa e dança ao concluir. Braços, cabeça e asa têm movimentos separados; a fala anima somente o personagem da atividade atual. As mensagens são adequadas à faixa etária, respeitam movimento reduzido e só são lidas ao tocar em Ouvir, com a voz oficial de quem fala. A resposta e a explicação continuam visíveis; a comemoração de combo acontece no próprio retorno, sem um painel sobre a questão. Exercícios de lições, biblioteca, treinos e turmas usam o mesmo componente.

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


## Acesso à conta com Supabase Auth
O servidor pode usar Supabase Auth para cadastro com confirmação por código, login por senha, recuperação por e-mail e migração das contas locais sem trocar seus IDs ou perder estudos e turmas. JWT e refresh token ficam cifrados no servidor; o navegador recebe apenas cookies HttpOnly. A interface apresenta uma etapa por vez, com mostrar senha, reenviar código e redefinição de senha. O provedor é ativado por configuração depois de preparar o projeto e o envio de e-mails; o modo local continua disponível para a transição. Configuração e limites em [docs/autenticacao-supabase.md](docs/autenticacao-supabase.md).

Para criar a credencial do Google Cloud e ativar o provedor Google, siga [o passo a passo de OAuth](docs/google-oauth-passo-a-passo.md).
