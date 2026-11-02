# Auditoria de segurança e plano de otimização (02/11/2026)

## 1. Segurança de dados

**Resultado geral: base sólida.** Nenhum problema crítico. `npm audit`: 0 vulnerabilidades (uma única dependência).

### O que já está bem
- Senhas com scrypt + sal, comparação em tempo constante, hash falso para não revelar quem tem conta.
- Sessão: token aleatório de 256 bits, só o hash vai ao banco; cookie `HttpOnly`, `SameSite=Lax`, `__Host-` e `Secure` atrás de HTTPS.
- CSRF: cabeçalho próprio `X-Inglou`, origem igual ao host e corpo JSON. Sem CORS.
- CSP estrita (`script-src 'self'`, `style-src 'self'`, sem inline), `frame-ancestors 'none'`, HSTS, nosniff, COOP/CORP.
- Arquivos públicos por lista branca; `..`, `\0`, controles e barra invertida recusados.
- Limitadores de tentativa compartilhados no SQLite (a chave vai em hash, sem e-mail nem IP em texto).
- Gabarito nunca vai ao navegador; correção no servidor.
- Backup diário cifrado com cópia externa; exportar e excluir dados da conta (LGPD).
- Docker roda como usuário `node`, `npm ci --omit=dev --ignore-scripts`.
- Front sem `innerHTML` com dados do usuário (o `h()` usa `textContent` e o CSSOM).

### Corrigido nesta rodada
| # | Problema | Gravidade | Correção |
|---|----------|-----------|----------|
| 1 | O SVG dos personagens gravava `style="..."` como atributo, e a CSP o bloqueava (erro no console a cada personagem; o ponto de giro da piscada saía errado). | Baixa (funcional) | `diversao.js` usa `style.setProperty` (CSSOM). |
| 2 | Um cookie com `%` malformado fazia `decodeURIComponent` lançar e a requisição virava erro 500. | Baixa | `lerCookies` ignora o cookie inválido (`src/http.js`). |

### Para você decidir (não mexi)
1. **IP do cliente (`ip()`)** usa o último valor de `X-Forwarded-For`. Está certo com exatamente um proxy confiável na frente. Se o app for exposto direto, o cliente forja o cabeçalho e escapa dos limitadores. Confirme o proxy do deploy.
2. **HSTS** sem `includeSubDomains`/`preload`. Só vale ativar quando todos os subdomínios de `arcanestudios.io` forem HTTPS.
3. **`.claude/settings.json` está versionado** e habilita um marketplace de plugins de terceiros (`JaimeJunr/claude-code-frontend-skills`). Quem abrir o repositório recebe plugins de fora. Sugiro tirar do repositório e deixar só no ambiente local.
4. `mia/mapa.json` dá 404 (ainda não existem as gravações da Mia). Inofensivo, mas polui o console. Ou gere as gravações, ou pule o `fetch` quando a pasta não existir.
5. Os testes `ciclo` e `seguranca` falham **só no Windows**, na limpeza da pasta temporária (EPERM no `rmSync`, o SQLite ainda está aberto). Nenhuma asserção falha (57 de 59 passam). Vale fechar o banco antes do `rmSync`.

## 2. Interface e personagens (feito)
- Novo `public/assets/js/mascote.js`, carregado pelo `app.js`, sem mexer nas telas:
  - os olhos do Tuiuiú e da Mia **seguem o dedo ou o mouse**;
  - de tempos em tempos olham para o lado sozinhos;
  - **tocar neles** faz uma reação aleatória (pulo, balanço ou giro) com som suave e, às vezes, brilhinhos;
  - 5 toques seguidos deixam o personagem **tonto**, com um brilho de recompensa;
  - sem interação por 40 s, **cochilam** (olhos fechados, flutuar lento) e acordam ao primeiro movimento;
  - **entrada** suave dos personagens (mola curta).
- Tudo desliga com "reduzir movimento" e respeita o interruptor de som.
- CSS (`app.css`, bloco no fim): foco visível mais limpo, leve elevação em cartões clicáveis, brilho sutil nos botões.
- Não conferi as telas depois do login (precisa de conta). Passe os olhos no Hoje, na Lição e no Álbum antes de publicar.

## 3. Plano de otimização (para o app não ficar pesado)
Medi o que existe: `public/` = 8,4 MB, dos quais **7,6 MB são 527 mp3** do Tuiuiú. JS 352 KB (27 módulos sem bundle), CSS 140 KB, fontes 124 KB. O servidor **não comprime** nada.

### Fase 1: rápido e de baixo risco (1 dia)
1. **Compressão no servidor** (brotli/gzip com `node:zlib`) para html, css, js, json e svg, em cache de memória por arquivo e versão. Esperado: CSS 140 → ~22 KB, JS 352 → ~85 KB.
2. **Áudio sob demanda**: o app já usa `mapa.json`. Garantir que nenhum mp3 é baixado antes do toque em "Ouvir" (`preload="none"`) e pré-carregar só a próxima frase da lição.
3. **Cache**: o `max-age` de 1 ano com `?v=` já está certo. Adicionar `ETag` para os arquivos sem `?v=` (hoje 5 min).
4. **Fontes**: conferir se Caveat (51 KB) é usada. Se for só num título, trocar por Fredoka e economizar 51 KB.

### Fase 2: carga inicial (2 a 3 dias)
5. **Carregar as telas sob demanda** com `import()` dinâmico por rota. Hoje o `app.js` importa as 17 telas de uma vez; só a de Hoje e a de entrada precisam vir antes. Meta: JS inicial abaixo de 60 KB (sem compressão).
6. **Dividir o `app.css`** (103 KB): núcleo + telas (lição, podcast, turmas, professor) em arquivos próprios, carregados com a rota. O professor e a Rádio quase nunca abrem na primeira visita.
7. **Sprite de ícones** (35 KB): gerar só com os ícones usados (hoje inclui o conjunto inteiro?). Conferir com um script que cruza `#i-...` do código com o sprite.
8. **Service worker** (o app já é PWA instalável): cache dos arquivos estáticos e dos mp3 já ouvidos, para abrir offline e rápido.

### Fase 3: servidor e dados (conforme crescer)
9. **`api.js` tem 104 KB num arquivo só.** Dividir por domínio (conta, lição, turmas, estudo) ajuda a manutenção e a inicialização.
10. **SQLite**: `PRAGMA optimize` na subida e um `EXPLAIN QUERY PLAN` nas consultas de Hoje, Treino e Revisar (as mais chamadas). Conferir índices em `tentativas(user_id, em)` e `cartoes(user_id, vence)`.
11. **Cota de IA**: já existe. Acrescentar cache de respostas idênticas (explicações e frases do treino) para reduzir o custo e a latência.
12. **Áudio**: se os mp3 forem 128 kbps, reencodar em 48 a 64 kbps mono (voz). Ganho estimado de 50 a 60% (7,6 → ~3 MB), sem perda audível em voz falada.

### Animações (orçamento de desempenho)
- Animar só `transform` e `opacity` (já é a regra do projeto). Evitar `box-shadow` animado em listas longas (a `chama` e a `onda` hoje animam sombra).
- Pausar animações infinitas fora da tela (`IntersectionObserver` ou `content-visibility:auto` nos cartões do álbum).
- Meta de medição: Lighthouse mobile com LCP < 2,0 s e TBT < 100 ms numa rede 4G lenta; repetir depois de cada fase.
