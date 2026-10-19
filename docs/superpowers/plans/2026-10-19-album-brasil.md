# Álbum Brasil Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dez missões temáticas do Brasil, cada uma com uma figurinha de foto como prêmio, misturadas em todos os planos, mais tradução por palavra nos exercícios com "marcar como dúvida".

**Architecture:** Conteúdo novo em `src/conteudo/` (figurinhas e missões, no formato que `missoes.js` já carrega). O plano (`src/motor/plano.js`) intercala as missões. Ao demonstrar a missão, `src/api.js` grava a conquista `fig-<id>`. O cliente (módulos ES sem build) ganha um componente de figurinha e um módulo de palavras tocáveis. "Dúvida" reaproveita a tabela `cartoes` com `tipo = 'duvida'`.

**Tech Stack:** Node >= 22.13 (`node:test`, `node:sqlite`), JS puro no cliente, CSS em `public/assets/css/app.css`, sem dependências novas.

**Spec:** `docs/superpowers/specs/2026-10-19-album-brasil-design.md` (partes A e B; a parte C, folclore, fica fora deste plano).

## Global Constraints

- Sem dependências novas e sem etapa de build. Cliente: módulos ES com `?v=__V__` nos imports, como os arquivos atuais.
- Nenhum travessão longo (— ou –) em texto visível; `tests/motor.test.js` falha se houver.
- Missão no formato de `src/conteudo/missoes-extra.js`: `id, titulo, podeFazer, nivel, tags, vocab(6), explicacao, exemplos(>=4), exercicios(>=8), tarefa, reteste(>=2), conversa`. `tags` só entre as de `DIFICULDADES`; `conversa` só entre as chaves de `CENARIOS`; todo exercício com resposta errada possível tem `explica`; `tarefa.modelo` passa em `avaliarProducao`.
- Missões do Brasil: nível A1 ou A2, ids `brasil-<curto>`, ensino em português, exemplos em inglês simples.
- Intercalar uma missão do Brasil a cada 3 regulares; nunca essenciais; sempre fica pelo menos uma; no objetivo `zero` só as A1.
- Conquista da figurinha: `fig-<id curto>` (ex.: `fig-arara`), gravada com `conquistar(uid, codigo)` quando o evento é `demonstrado`.
- Imagens em `public/assets/figurinhas/`, JPEG de 640 px de lado maior (o ambiente não tem WebP; é adaptação do "WebP" da spec, trocável depois sem mudar o código além da extensão em `figurinhas.js`).
- Estados e legendas são rascunho até serem conferidos (IUCN e ICMBio); cada figurinha tem `conferido: false`.
- Respeitar tema Dia/Noite, "menos movimento" e contraste AA. Área de toque de pelo menos 44 px.
- Conteúdo respeitoso: povos e comunidades aparecem em trabalho, terra e saber, nunca como fantasia nem miséria.
- Branch `feat/album-brasil`. Commits só quando o Gabriel pedir; os passos de commit abaixo são para quando ele pedir.

## Review Focus

1. Plano do objetivo `zero` com prazo curto: tem pelo menos uma missão do Brasil e nenhuma é A2.
2. Missão demonstrada e depois mantida (`retido`): a figurinha não é concedida duas vezes nem repete aviso.
3. Palavra com maiúscula, pontuação, plural, `-ing`, `-ed` e contração (`Macaws,`, `Don't`, `lives`) acha a tradução; palavra desconhecida ainda pode ser marcada; marcar duas vezes não duplica cartão nem dá erro.
4. Com o balão de palavra aberto, as teclas 1 a 9 e Enter do exercício não confirmam nem escolhem nada por engano; peças de `ordenar`, opções e `pares` não ficam tocáveis.
5. Plano antigo salvo sem missões do Brasil continua abrindo; figurinha cuja imagem não carrega mostra o texto alternativo e o layout não quebra.

---

### Task 1: Catálogo de figurinhas e imagens

**Files:**
- Create: `src/conteudo/figurinhas.js`, `scripts/preparar-figurinhas.ps1`, `public/assets/figurinhas/*.jpg` (10 arquivos), `tests/brasil.test.js`
- Source das imagens: `docs/superpowers/specs/album-brasil-assets/*.png` (1024 px) e legendas em `album-brasil-10.html` da mesma pasta

**Interfaces:**
- Produces:
  - `FIGURINHAS: Array<{ id: string, missao: string, arquivo: string, nome: string, estado: string, grupo: 'animal'|'gente', tom: 'aviso'|'perigo'|'orgulho', alt: string, legendaEn: string, legendaPt: string, conferido: boolean }>` na ordem da tabela da spec (arara, mico, onca, peixeboi, tartaruga, lobo, catadora, pescador, quilombola, indigena). `missao` é `'brasil-' + id`; `arquivo` é `id + '.jpg'`.
  - `POR_MISSAO: Record<string, figurinha>` e `codigoConquista(f): string` que devolve `'fig-' + f.id`.

- [ ] **Step 1: Escrever o teste** em `tests/brasil.test.js` (`node:test`): `FIGURINHAS` tem 10 itens com ids únicos; `POR_MISSAO['brasil-arara'].id === 'arara'`; `codigoConquista(POR_MISSAO['brasil-mico']) === 'fig-mico'`; para cada figurinha, `fs.existsSync('public/assets/figurinhas/' + arquivo)` e o arquivo tem menos de 150 KB; `legendaEn`, `legendaPt` e `alt` não vazios; `tom` é um dos três valores; nenhum campo de texto contém `—` ou `–`.
- [ ] **Step 2: Rodar e ver falhar:** `node --disable-warning=ExperimentalWarning --test tests/brasil.test.js`. Esperado: FAIL, módulo não existe.
- [ ] **Step 3: Criar `scripts/preparar-figurinhas.ps1`** com parâmetros `-Origem` e `-Destino`: usa `System.Drawing` para reduzir cada PNG para 640 px no maior lado e salvar JPEG qualidade 80, mantendo o nome base. Rodar: `powershell -File scripts/preparar-figurinhas.ps1 -Origem docs/superpowers/specs/album-brasil-assets -Destino public/assets/figurinhas`. Se algum arquivo passar de 150 KB, baixar a qualidade para 72.
- [ ] **Step 4: Implementar `src/conteudo/figurinhas.js`** com os dados da tabela da spec; textos de `legendaEn`/`legendaPt`/`estado`/`nome` copiados de `album-brasil-10.html`; `alt` descritivo (ex.: "Arara-azul-grande pousada num galho, com plumagem azul e anel amarelo no olho"); `tom`: `aviso` para vulnerável, `perigo` para em perigo e criticamente em perigo, `orgulho` para as quatro de gente; `grupo` conforme a spec.
- [ ] **Step 5: Rodar e ver passar** o mesmo comando. Esperado: PASS.
- [ ] **Step 6: Commit (quando o Gabriel pedir):** `git add src/conteudo/figurinhas.js scripts/preparar-figurinhas.ps1 public/assets/figurinhas tests/brasil.test.js && git commit -m "feat: catálogo e imagens das figurinhas do Brasil"`.

---

### Task 2: Carregador e as missões de arara, mico-leão e onça

**Files:**
- Create: `src/conteudo/missoes-brasil.js`
- Modify: `src/conteudo/missoes.js:870` (acrescentar a linha de carga ao lado das de `MISSOES_EXTRA` e `MISSOES_COTIDIANO`)
- Test: `tests/brasil.test.js`

**Interfaces:**
- Consumes: `FIGURINHAS`, `POR_MISSAO` (Task 1).
- Produces: `MISSOES_BRASIL: Mission[]` exportado por `src/conteudo/missoes-brasil.js`; cada missão tem também `figurinha: string` (o id da figurinha). As Tasks 3 e 4 acrescentam itens ao mesmo array, na ordem da tabela da spec.

Missões desta task (focos da spec; os exercícios e o texto exato ficam com o implementador):
- `brasil-arara` (A1): descrever com *is/are*, cores e *big*; tag `artigo-profissao` não se aplica, usar `tags: []`; `conversa: 'zero-conhecer'`.
- `brasil-mico` (A1): *lives in*, *there is/are*, `tags: ['preposicoes']`; `conversa: 'zero-conhecer'`.
- `brasil-onca` (A2): *needs*, *can*, comida e espaço, `tags: ['terceira-pessoa']`; `conversa: 'small-talk'`.
- Cada tarefa final pede 3 a 4 frases sobre o animal e inclui uma frase sobre por que está em perigo; `elementos` verificam por regex o nome do animal, um verbo do foco e a causa.

- [ ] **Step 1: Escrever o teste** em `tests/brasil.test.js`: para cada missão de `MISSOES_BRASIL` presente, `POR_ID[m.id] === m`; `m.figurinha` existe em `FIGURINHAS` e `POR_MISSAO[m.id].id === m.figurinha`; `vocab.length === 6`; `exemplos.length >= 4`; `exercicios.length >= 8` com pelo menos 4 tipos diferentes e pelo menos um `escuta` ou `ditado`; `nivel` em `['A1','A2']`; ids de exercício começam por `m.id + '-'`. Outro teste: `MISSOES_BRASIL` não tem ids repetidos.
- [ ] **Step 2: Rodar `node --disable-warning=ExperimentalWarning --test tests/brasil.test.js`**; esperado FAIL.
- [ ] **Step 3: Criar `missoes-brasil.js`** exportando `{ MISSOES_BRASIL }` com as 3 missões, e carregar em `missoes.js` com `require('./missoes-brasil').MISSOES_BRASIL.forEach(m => M.push(m));` antes do bloco que injeta `EXPLICACOES_ZERO`.
- [ ] **Step 4: Rodar `npm test`**; esperado: todos passam, incluindo "conteúdo é consistente" e "nenhum tracinho longo" de `tests/motor.test.js`. Corrigir o conteúdo, não os testes.
- [ ] **Step 5: Commit (quando pedirem):** `git add src/conteudo tests/brasil.test.js && git commit -m "feat: missões Brasil 1 a 3 (arara, mico-leão, onça)"`.

---

### Task 3: Missões de peixe-boi, tartaruga e lobo-guará

**Files:**
- Modify: `src/conteudo/missoes-brasil.js`
- Test: `tests/brasil.test.js` (os testes da Task 2 passam a cobrir as novas missões)

**Interfaces:**
- Consumes: formato e testes da Task 2.
- Produces: `brasil-peixeboi`, `brasil-tartaruga`, `brasil-lobo` em `MISSOES_BRASIL`.

Focos (A2): `brasil-peixeboi` o que come e o que o machuca (`tags: ['incontaveis']`, `conversa: 'small-talk'`); `brasil-tartaruga` *plastic, beach, protect*, plural (`tags: ['people-plural']`, `conversa: 'small-talk'`); `brasil-lobo` comparar com *long legs, fast, bigger than* (`tags: ['terceira-pessoa']`, `conversa: 'small-talk'`). A tarefa final inclui a causa do perigo em uma frase.

- [ ] **Step 1: Estender o teste** com `assert.equal(MISSOES_BRASIL.length, 6)` e a ordem `['brasil-arara','brasil-mico','brasil-onca','brasil-peixeboi','brasil-tartaruga','brasil-lobo']` (o teste final de 10 vem na Task 4).
- [ ] **Step 2: Rodar o arquivo de teste**; esperado FAIL no tamanho.
- [ ] **Step 3: Acrescentar as 3 missões** ao array.
- [ ] **Step 4: Rodar `npm test`**; esperado PASS.
- [ ] **Step 5: Commit (quando pedirem):** `git commit -am "feat: missões Brasil 4 a 6 (peixe-boi, tartaruga, lobo-guará)"`.

---

### Task 4: Missões de catadora, pescador, quilombola e indígena

**Files:**
- Modify: `src/conteudo/missoes-brasil.js`
- Test: `tests/brasil.test.js`

**Interfaces:**
- Produces: `brasil-catadora`, `brasil-pescador` (A1) e `brasil-quilombola`, `brasil-indigena` (A2) em `MISSOES_BRASIL`, completando 10 missões.

Focos: `brasil-catadora` profissões e *-s* da 3ª pessoa (`tags: ['terceira-pessoa','artigo-profissao']`, `conversa: 'zero-rotina-zero'`); `brasil-pescador` rotina (*wakes up, catches, sells*) (`tags: ['terceira-pessoa']`, `conversa: 'zero-rotina-zero'`); `brasil-quilombola` de onde é e o que planta (`tags: ['preposicoes']`, `conversa: 'small-talk'`); `brasil-indigena` o que faz e cuida, *her/their* (`tags: ['terceira-pessoa']`, `conversa: 'small-talk'`). Tom de dignidade: a tarefa final pede para descrever o trabalho da pessoa e dizer por que ele importa; nunca fala de pobreza nem de "ajudar coitados". Conteúdo factual sobre terra, título ou direitos só em termos gerais, como na legenda da figurinha.

- [ ] **Step 1: Estender o teste:** `MISSOES_BRASIL.map(m => m.id)` igual à lista completa das 10, na ordem da tabela da spec; e `MISSOES_BRASIL.length === FIGURINHAS.length`.
- [ ] **Step 2: Rodar o arquivo de teste**; esperado FAIL.
- [ ] **Step 3: Acrescentar as 4 missões.**
- [ ] **Step 4: Rodar `npm test`**; esperado PASS.
- [ ] **Step 5: Commit (quando pedirem):** `git commit -am "feat: missões Brasil 7 a 10 (catadora, pescador, quilombola, indígena)"`.

---

### Task 5: Mistura nos planos

**Files:**
- Modify: `src/motor/plano.js` (`montarPlano`, linha 30 em diante; exportar a nova função)
- Test: `tests/brasil.test.js`

**Interfaces:**
- Consumes: `MISSOES_BRASIL` (Tasks 2 a 4), `POR_ID`.
- Produces:
  - `intercalar(regulares: string[], brasil: string[], cada = 3): string[]` em `plano.js`: devolve os `regulares` com um id de `brasil` inserido depois de cada `cada` regulares, na ordem de `brasil`, e o restante de `brasil` ao fim se sobrar.
  - Cada missão em `plano.missoes` ganha `brasil: boolean`.

Regras em `montarPlano`: `brasil = MISSOES_BRASIL.filter(m => perfil.objetivo !== 'zero' || m.nivel === 'A1').map(m => m.id)`; `ids = intercalar(obj.missoes.filter(id => POR_ID[id]), brasil)`; as do Brasil nunca entram em `essenciais`; no corte por prazo entram em `resto`, e depois do corte, se nenhuma missão do Brasil sobrou, acrescenta a primeira de `brasil` (mesmo estourando levemente o prazo) e acrescenta a mesma ressalva em `avisos` só se ela foi acrescentada à força (texto simples, sem travessão).

- [ ] **Step 1: Escrever os testes** em `tests/brasil.test.js`:
  - `intercalar(['a','b','c','d','e','f','g'], ['X','Y'])` deep-equals `['a','b','c','X','d','e','f','Y','g']`; com `regulares` vazio devolve `brasil`.
  - `montarPlano({ objetivo: 'trabalho', dias_semana: 5, minutos_dia: 15, prazo: null }, 'A2', '2026-10-19')` tem `missoes.filter(m => m.brasil).length === 10` e nenhum `essencial` entre elas.
  - Mesmo perfil com `prazo: '2026-11-02'`: continua com pelo menos 1 missão `brasil` e todas as essenciais.
  - `objetivo: 'zero'`: só ids de missões A1 do Brasil (`POR_ID[id].nivel === 'A1'`) e pelo menos 1, também com prazo curto.
- [ ] **Step 2: Rodar o arquivo de teste**; esperado FAIL.
- [ ] **Step 3: Implementar** `intercalar` e a integração em `montarPlano` conforme as regras acima.
- [ ] **Step 4: Rodar `npm test`**. Se `tests/motor.test.js` ("plano: prazo curto prioriza essenciais") ou outro teste compara contagens exatas de missões, ajustar a asserção para contar só `!m.brasil`, mantendo a intenção do teste.
- [ ] **Step 5: Commit (quando pedirem):** `git add src/motor/plano.js tests && git commit -m "feat: missões do Brasil intercaladas em todos os planos"`.

---

### Task 6: Desbloqueio da figurinha e catálogo na API

**Files:**
- Modify: `src/api.js` (bloco do evento `demonstrado`, perto da linha 599; nova rota perto de `/progresso`)
- Test: `tests/ciclo.test.js`

**Interfaces:**
- Consumes: `POR_MISSAO`, `codigoConquista`, `FIGURINHAS` (Task 1); `conquistar(uid, codigo)` existente.
- Produces: rota `GET /figurinhas` devolvendo `{ figurinhas: Array<figurinha de FIGURINHAS (sem `conferido`) & { conquistada: boolean, em: string|null }> }` na ordem do catálogo; ao demonstrar uma missão do Brasil, o código `fig-<id>` entra em `conquistas` e na lista `conquistas` devolvida pela rota que avalia a tarefa.

- [ ] **Step 1: Escrever os testes** em `tests/ciclo.test.js`, com o mesmo harness de `before/after`:
  - Novo usuário: `GET /figurinhas` devolve 10 itens, todos `conquistada === false`, e nenhum traz `conferido`.
  - Seguindo o teste "tarefa feita sem ajuda vira demonstrado" (linha 85), forçar a missão atual do plano para `brasil-arara` (atualizar `planos.dados` no banco com a missão como primeira não iniciada) e enviar a tarefa com o `tarefa.modelo` da missão: a resposta traz `evento === 'demonstrado'` e `conquistas` contém `'fig-arara'`; `GET /figurinhas` marca arara como `conquistada: true` com `em` preenchido.
  - Repetir o reteste (`retido`) da mesma missão: `conquistas` não traz `'fig-arara'` de novo, e `SELECT COUNT(*) FROM conquistas WHERE codigo = 'fig-arara'` continua 1.
- [ ] **Step 2: Rodar `node --disable-warning=ExperimentalWarning --test tests/ciclo.test.js`**; esperado FAIL.
- [ ] **Step 3: Implementar** no bloco após `primeira-demonstracao`: se `res.evento === 'demonstrado'` e `POR_MISSAO[bloco.missao]`, chamar `conquistar` com o código e fazer push em `conq`. Rota `GET /figurinhas` lendo `conquistas` do usuário com `codigo LIKE 'fig-%'`.
- [ ] **Step 4: Rodar `npm test`**; esperado PASS.
- [ ] **Step 5: Commit (quando pedirem):** `git add src/api.js tests/ciclo.test.js && git commit -m "feat: figurinha do Brasil concedida ao demonstrar a missão"`.

---

### Task 7: Álbum de figurinhas com foto no app

**Files:**
- Create: `public/assets/js/figurinha.js`
- Modify: `public/assets/js/telas/progresso.js:19` (nova seção), `public/assets/js/telas/hoje.js:11` (`nomeConquista`), `public/assets/css/app.css`
- Test: `tests/frontend.test.js` (já valida sintaxe e imports de todos os módulos)

**Interfaces:**
- Consumes: `GET /figurinhas` (Task 6), `h`, `icone` de `ui.js`.
- Produces: `figurinhaBrasil(f, { conquistada: boolean }): HTMLElement` em `figurinha.js`. Conquistada: foto redonda com borda branca e anel na cor do `tom`, faixa com o nome, chip com `estado`, legenda em inglês (`lang="en"`) num botão que alterna para `legendaPt` e volta, com a dica "Toque para traduzir" / "Toque para voltar ao inglês". Não conquistada: silhueta (mesmo tamanho, sem foto) com o nome e "Complete a missão para colar". `nomeConquista('fig-arara')` devolve `'Figurinha do Brasil: veja em Progresso'` (qualquer código que comece com `fig-`).

- [ ] **Step 1: Escrever o teste** em `tests/frontend.test.js`: ler `hoje.js` e conferir por regex que o tratamento de `nomeConquista` cobre o prefixo `fig-` (a lógica é dado, não DOM); e que `figurinha.js` existe (o teste de imports já cobre o resto).
- [ ] **Step 2: Rodar `node --disable-warning=ExperimentalWarning --test tests/frontend.test.js`**; esperado FAIL no novo teste.
- [ ] **Step 3: Implementar** `figurinha.js` (botão da legenda com área de toque grande, `aria-live="polite"` na legenda, imagem com `alt` e `loading="lazy"`, `width`/`height` fixos para não pular layout, `onerror` esconde a imagem e deixa o `alt` visível), a seção "Figurinhas do Brasil" em `progresso.js` (grid responsivo; dados de `api('/figurinhas')`; contador "X de 10"), o prefixo em `nomeConquista` e o CSS `.fig-brasil*` em `app.css` usando as variáveis de cor existentes, com variante para tema Noite e sem animação sob `prefers-reduced-motion`.
- [ ] **Step 4: Rodar `npm test`**; esperado PASS.
- [ ] **Step 5: Verificar no navegador:** `npm run dev`, abrir `#/progresso` no navegador do app, conferir figurinha conquistada (forçar com um `INSERT` em `conquistas` no banco de dev), a silhueta das demais, o toque que traduz, tema Noite e largura de celular (375 px). Esperado: sem barra de rolagem horizontal, legenda legível, foto carrega.
- [ ] **Step 6: Commit (quando pedirem):** `git add public tests && git commit -m "feat: figurinhas com foto no progresso"`.

---

### Task 8: Dicionário e rotas de palavra (servidor)

**Files:**
- Create: `src/conteudo/palavras-comuns.js`, `src/motor/dicionario.js`
- Modify: `src/api.js` (duas rotas perto de `/cartoes`, linha 650)
- Test: `tests/brasil.test.js`, `tests/ciclo.test.js`

**Interfaces:**
- Consumes: `MISSOES` (campos `vocab` e `exemplos`), `criarCartao(uid, c, h)` existente.
- Produces:
  - `PALAVRAS_COMUNS: Array<{ en: string, pt: string }>` com cerca de 150 palavras funcionais e muito comuns (artigos, pronomes, preposições, verbos *be/have/do/can/need/live*, números 1 a 10, cores).
  - `traduzir(palavra: string): { palavra: string, pt: string, exemplo: string|null } | null` em `dicionario.js`: normaliza (minúsculas, sem pontuação nas pontas, aspas curvas viram retas), tenta a forma exata e depois formas reduzidas (`-s`, `-es`, `-ies`→`y`, `-ed`, `-ing`, `'s`); cobre `vocab` de todas as missões (item de uma palavra e também as frases inteiras) e `PALAVRAS_COMUNS`; `exemplo` vem do `ex` do `vocab` quando existe.
  - `GET /palavras/traduzir?p=<palavra>` → `{ palavra, traducao: string|null, exemplo: string|null, marcada: boolean }` (`marcada` é se já há cartão `tipo = 'duvida'` com essa frente para o usuário).
  - `POST /palavras/duvida` com `{ palavra, traducao?, exemplo? }` → `{ ok: true, jaExistia: boolean }`; cria cartão `tipo: 'duvida'`, `origem: 'exercicio'`, `frente` = palavra normalizada, `verso` = tradução ou "Ainda sem tradução: pergunte ao tutor em Dúvidas.", `exemplo` = frase do exercício (até 300 caracteres); `vence_em` = hoje do usuário. Mesma palavra duas vezes não duplica e responde 200.

- [ ] **Step 1: Escrever os testes** em `tests/brasil.test.js`: `traduzir('macaw')` (depois que `vocab` de arara a contiver) e `traduzir('Macaws,')` retornam o mesmo `pt`; `traduzir('lives')` acha `live`; `traduzir("Don't")` acha algo, pois `don't` está em `PALAVRAS_COMUNS`; `traduzir('xylophonist')` é `null`; `traduzir('')` é `null`. Em `tests/ciclo.test.js`: `GET /palavras/traduzir?p=macaw` devolve `marcada: false`; `POST /palavras/duvida` `{ palavra: 'macaw', exemplo: 'The macaw is blue.' }` devolve `jaExistia: false`; o mesmo POST de novo devolve `jaExistia: true`; `GET /cartoes` tem exatamente 1 cartão com `tipo === 'duvida'` e frente `macaw`; `GET /palavras/traduzir?p=macaw` agora devolve `marcada: true`; POST de palavra sem tradução (`xylophonist`) cria cartão com o verso de aviso; POST sem `palavra` devolve 400.
- [ ] **Step 2: Rodar os dois arquivos de teste**; esperado FAIL.
- [ ] **Step 3: Implementar** `palavras-comuns.js`, `dicionario.js` (índice construído uma vez, no carregamento) e as duas rotas com `V.str` para validar tamanhos, no padrão de `POST /cartoes`.
- [ ] **Step 4: Rodar `npm test`**; esperado PASS.
- [ ] **Step 5: Commit (quando pedirem):** `git add src tests && git commit -m "feat: tradução por palavra e cartão de dúvida no servidor"`.

---

### Task 9: Palavras tocáveis nos exercícios

**Files:**
- Create: `public/assets/js/palavras.js`
- Modify: `public/assets/js/telas/exercicio.js` (lacuna, leitura, fala, corrigir, transcrição; teclado), `public/assets/js/telas/revisar.js:7` (`TIPO`), `public/assets/css/app.css`
- Test: `tests/frontend.test.js`

**Interfaces:**
- Consumes: `GET /palavras/traduzir`, `POST /palavras/duvida` (Task 8), `falar`, `toast`, `h`, `icone` de `ui.js`.
- Produces: `palavrasTocaveis(raiz: HTMLElement, { exemplo: string }): void` em `palavras.js`: troca as palavras inglesas dos nós de texto de `raiz` por `<button class="palavra">`; ignora nós dentro de `input, textarea, button, .peca, .par, .opcao`. O toque abre um balão (`.balao-palavra`, `role="dialog"`, `aria-label` com a palavra) com a palavra, a tradução (ou "Ainda não tenho essa palavra"), botão **Ouvir** (`falar(palavra)`) e botão **Marcar como dúvida**; depois de marcar, o botão vira "Marcada" desativado e aparece `toast('Vai voltar nas suas revisões.', { tipo: 'ok' })`; se `marcada` já vinha `true`, o botão já nasce "Marcada". Fecha com Esc, com toque fora e ao trocar de exercício; devolve o foco à palavra. `TIPO` em `revisar.js` ganha `duvida: 'Dúvida'`.

Onde aplicar em `exercicio.js`: `.frase-lacuna`, `.texto-leitura`, `.frase-fala__en`, `.errado-caixa`, `.transcricao` (depois de "Ver o texto do áudio"). Não aplicar em `escolha`, `ordenar`, `pares`, `traduzir` (a frase é em português).

- [ ] **Step 1: Escrever o teste** em `tests/frontend.test.js`: `palavras.js` existe; `revisar.js` contém `duvida: 'Dúvida'`; `exercicio.js` importa `palavrasTocaveis` de `'../palavras.js?v=__V__'` e o handler de `keydown` ignora eventos cujo alvo está dentro de `.balao-palavra` (verificar por regex a presença de `.balao-palavra` no `teclas`).
- [ ] **Step 2: Rodar `node --disable-warning=ExperimentalWarning --test tests/frontend.test.js`**; esperado FAIL.
- [ ] **Step 3: Implementar** `palavras.js` (percorrer nós de texto com `TreeWalker`, regex de palavra `/[A-Za-z][A-Za-z’'-]*/g`, uma única instância de balão por vez), a chamada em `exercicio.js` nos pontos acima, o ajuste do `teclas` (`if (e.target.closest?.('.balao-palavra')) return;`), o `TIPO` e o CSS `.palavra` (sublinhado pontilhado discreto, área de toque confortável) e `.balao-palavra` (cores do tema, tema Noite, sem animação sob "menos movimento").
- [ ] **Step 4: Rodar `npm test`**; esperado PASS.
- [ ] **Step 5: Verificar no navegador:** `npm run dev`; numa lição com lacuna e com fala: tocar numa palavra mostra o balão com tradução; "Ouvir" fala; "Marcar como dúvida" mostra o aviso; em `#/revisar` o cartão aparece com o rótulo "Dúvida" e a frase do exercício como exemplo; tocar na mesma palavra de novo mostra "Marcada". Num exercício de `ordenar` e de `escolha`, tocar nas peças e opções continua funcionando como antes. Esperado: nenhuma mudança de comportamento nesses dois tipos; teclas 1 a 9 e Enter não agem com o balão aberto.
- [ ] **Step 6: Commit (quando pedirem):** `git add public tests && git commit -m "feat: tocar na palavra traduz e marca dúvida nos exercícios"`.

---

### Task 10: Documentação e conferência final

**Files:**
- Modify: `README.md` (seção nova "Álbum Brasil (19/10/2026)" no estilo das seções existentes)
- Test: suíte completa

- [ ] **Step 1: Escrever a seção do README** descrevendo: as 10 missões e figurinhas, a mistura nos planos (1 a cada 3, nunca essenciais, sempre pelo menos 1, só A1 no zero), `GET /figurinhas`, a conquista `fig-<id>`, a tradução por palavra (dicionário próprio de `vocab` e `palavras-comuns.js`), as rotas `/palavras/*` e o cartão `tipo = 'duvida'`, e a lista "conferir antes de publicar" da spec.
- [ ] **Step 2: Rodar `npm test`**; esperado: todos os testes passam.
- [ ] **Step 3: Passar pelo checklist "conferir antes de publicar"** com o Gabriel: estados de ameaça (IUCN e ICMBio), fontes das afirmações das legendas, rótulo "ilustração" nas imagens (decisão dele), crachá ilegível da catadora. Sem confirmar, `conferido` fica `false` e o conteúdo não é publicado.
- [ ] **Step 4: Commit (quando pedirem):** `git add README.md && git commit -m "docs: Álbum Brasil"`.

---

## Fora deste plano

Folclore (Curupira, Iara, Saci, Boitatá): precisa gerar as 4 imagens (créditos do Figma voltam em 20/10/2026 00:00 UTC) e vira um plano próprio depois que as imagens existirem.

## Self-review

- **Cobertura da spec:** figurinhas e imagens (Task 1); 10 missões (2 a 4); desbloqueio e progresso (6, 7); mistura (5); tradução e dúvida (8, 9); conferência e README (10). Folclore explicitamente fora.
- **Consistência de nomes:** `FIGURINHAS`, `POR_MISSAO`, `codigoConquista`, `MISSOES_BRASIL`, `intercalar`, `figurinhaBrasil`, `traduzir`, `palavrasTocaveis`, `GET /figurinhas`, `GET /palavras/traduzir`, `POST /palavras/duvida` aparecem iguais onde são usados.
- **Proporção:** o plano passa de 2 000 palavras porque cada task precisa dos nomes exatos; sem corpos de função, só assinaturas e asserções.
