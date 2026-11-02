# Álbum Brasil: figurinhas e lições temáticas

Data: 19/10/2026. Estado: rascunho para aprovação do Gabriel. Nada deste documento foi implementado.

## Intenção e porquê

O Inglou tem um álbum de figurinhas, mas hoje elas são só ícones. O Gabriel quer que as figurinhas abordem temas sociais e culturais do **Brasil**: animais ameaçados de extinção, a população negra, indígenas, e a classe trabalhadora. O tom é tranquilo: a pessoa acha a figurinha fofa e bonita, e por trás dela há um problema real, contado com honestidade em uma legenda curta.

Cada figurinha tem que ter a ver com uma lição. Por isso cada figurinha é o prêmio de uma **missão temática** que ensina inglês usando o próprio assunto dela. A pessoa aprende e se conscientiza ao mesmo tempo.

## Objetivos

1. Dez figurinhas com foto realista e fiel à espécie ou à pessoa, em formato de adesivo redondo, com nome, estado de ameaça e legenda em inglês. Tocar na legenda alterna entre inglês e português.
2. Dez missões temáticas no mesmo formato das missões atuais (vocabulário, explicação, exemplos, 8 exercícios, tarefa final, reteste). Concluir a tarefa final desbloqueia a figurinha.
3. As missões do Brasil entram **misturadas em todos os planos** de estudo, não como trilha separada.
4. Tocar numa palavra de qualquer exercício mostra a tradução, permite ouvir, e permite marcar como dúvida para revisar depois (Parte B).
5. Quatro figurinhas de folclore (Curupira, Iara, Saci, Boitatá) com suas missões, quando as imagens puderem ser geradas (Parte C).

## Não objetivos

- Não é um curso de ciências nem de história. O inglês continua sendo o assunto; o tema é o contexto.
- Não há castigo, contagem regressiva nem "perder" figurinha. As regras atuais do álbum e da sequência não mudam.
- Não dramatizar. A legenda diz o problema e a causa em uma frase, sem imagens chocantes e sem culpar a pessoa que estuda.

## Anti-objetivos (seria um fracasso mesmo funcionando)

- Estereótipo ou exotização de povos indígenas, quilombolas e pessoas negras. Mostrar sempre trabalho, terra, saber e dignidade, nunca fantasia nem miséria.
- Dado errado ou exagerado em legenda. Toda afirmação precisa ter fonte conferida antes de publicar (ver "Conferir antes de publicar").
- Imagem que "parece" a espécie mas erra um detalhe (cor, formato, habitat).

## Parte A: dez figurinhas e dez missões

Imagens já geradas e aprovadas pelo Gabriel (estilo adesivo redondo, opção B). Estão nos arquivos `arara.png`, `mico.png`, `onca.png`, `peixeboi.png`, `tartaruga.png`, `lobo.png`, `catadora.png`, `pescador.png`, `quilombola.png`, `indigena.png`, em `docs/superpowers/specs/album-brasil-assets/`. Todas têm 1024×1024 e cerca de 1,8 MB cada.

| id da missão | figurinha | estado mostrado | foco de inglês (nível) |
|---|---|---|---|
| `brasil-arara` | Arara-azul-grande | Vulnerável | descrever: *is/are*, cores, *big* (A1) |
| `brasil-mico` | Mico-leão-dourado | Em perigo | onde vive: *lives in*, *there is/are* (A1) |
| `brasil-onca` | Onça-pintada | Vulnerável no Brasil | *needs*, *can*, comida e espaço (A2) |
| `brasil-peixeboi` | Peixe-boi-marinho | Em perigo no Brasil | o que come e o que o machuca (A2) |
| `brasil-tartaruga` | Tartaruga-de-pente | Criticamente em perigo | *plastic*, *beach*, *protect* (A2) |
| `brasil-lobo` | Lobo-guará | Vulnerável no Brasil | comparar: *long legs*, *fast* (A2) |
| `brasil-catadora` | Catadora de recicláveis | Trabalho essencial | profissões, *-s* da 3ª pessoa (A1) |
| `brasil-pescador` | Pescador artesanal | Trabalho essencial | rotina: *wakes up*, *catches* (A1) |
| `brasil-quilombola` | Mulher quilombola | Terra e história | de onde é, o que planta (A2) |
| `brasil-indigena` | Mulher indígena | Guardiã da floresta | o que faz e cuida, *her/their* (A2) |

Nível, foco e ordem acima são **decisão minha** (o Gabriel não escolheu); ajuste livre pelo construtor se o conteúdo pedir.

### Missões

Novo arquivo `src/conteudo/missoes-brasil.js`, mesmo formato de `missoes-extra.js` e carregado por `src/conteudo/missoes.js` do mesmo jeito (`require(...).MISSOES_BRASIL.forEach(m => M.push(m))`). Cada missão traz:
- `vocab` de 6 itens, `explicacao` curta, 4 `exemplos`, 8 `exercicios` de tipos variados, `tarefa` com `elementos` verificáveis, `reteste` com 2 situações, e uma `conversa` se existir cenário adequado.
- O texto de ensino em português, os exemplos em inglês simples. Frases curtas, sem vocabulário raro.
- Um campo novo `figurinha: { arquivo, nome, estado, legendaEn, legendaPt }`. As legendas rascunho estão no painel `album-brasil-10.html` do brainstorm e abaixo.

### Legendas (rascunho, em inglês e português)

Estão em `docs/superpowers/specs/album-brasil-assets/album-brasil-10.html`. O construtor deve copiá-las de lá. Conferir antes de publicar.

### Desbloqueio

Ao concluir a tarefa final (status `demonstrado` da missão), chamar `conquistar(uid, 'fig-' + idCurto)` em `src/api.js` (a função `conquistar` já existe, perto da linha 209) e devolver o código em `novasConquistas`, como já acontece com as figurinhas de sequência. Adicionar os nomes em `CONQ` em `public/assets/js/telas/hoje.js`. A tela `progresso.js` já lista "Figurinhas especiais"; ali a figurinha com foto aparece no lugar do ícone de medalha.

### Mistura nos planos

Em `src/motor/plano.js`, depois de montar a lista de missões de qualquer objetivo, **intercalar** as missões do Brasil: uma a cada 3 missões regulares, até no máximo 10. Regras:
- Entram na conta de tempo como as outras (`licoesPorMissao` + 1 de reteste).
- **Não são essenciais.** Se o prazo for curto, são cortadas antes das essenciais, mas pelo menos **uma** fica sempre (a primeira da fila), para a pessoa conhecer o álbum.
- No objetivo `zero` entram só as de nível A1 (arara, mico, catadora, pescador).
- A ordem das dez é a da tabela acima, mas o construtor pode trocar se pedagogicamente fizer mais sentido.
- Quem já tem plano ativo: a próxima geração de plano passa a incluí-las. Não refazer planos existentes à força.

### Visual das figurinhas

- Formato adesivo redondo: foto no círculo com borda branca, faixa com o nome, chip do estado, legenda. Referência: `album-brasil-10.html`.
- Converter as imagens para WebP em cerca de 600 px (de 1,8 MB para algumas dezenas de KB) e guardar em `public/assets/figurinhas/`. O app é para celular.
- Respeitar o tema Dia/Noite e "menos movimento", como o resto da interface. Contraste AA nos chips e na legenda.
- Legenda em inglês com `lang="en"`. Toque alterna para português e de volta; botão com área de toque grande e texto de apoio "Toque para traduzir".
- Cada imagem precisa de `alt` descritivo (ex.: "Arara-azul-grande pousada num galho").

## Parte B: tradução por palavra e marcar dúvida

Pedido do Gabriel: em qualquer exercício, tocar numa palavra mostra a tradução; dá para marcar como dúvida e rever depois.

- Em `public/assets/js/telas/exercicio.js`, as palavras em inglês viram elementos tocáveis (enunciado, frase da lacuna, `pt`/`frase` de `fala` e `ditado` depois de conferir, opções de escolha, peças do `ordenar` já são botões e **não** devem ganhar o novo toque para não atrapalhar o jogo).
- O toque abre um balãozinho: palavra, tradução, botão **Ouvir** (usa `falar` de `ui.js`) e botão **Marcar como dúvida**.
- "Marcar como dúvida" cria um cartão de revisão pelo mecanismo que já existe (`criarCartao` em `src/api.js`, linha 186) com `tipo: 'duvida'`, `frente` = palavra, `verso` = tradução, `exemplo` = a frase do exercício. Ele aparece em **Revisar** com o rótulo "Dúvida" (ver `TIPO` em `revisar.js`). Se a palavra já tem cartão, não duplicar.
- Registrar no banco que a pessoa tocou na palavra e marcou, para a Rádio Tuiuiú e o treino focado poderem usar depois (os `focos` atuais). Primeira versão: só o cartão; o resto fica fora do escopo.
- **Fonte da tradução: ainda não decidida.** Duas opções para o Gabriel:
  - Dicionário próprio, feito a partir do conteúdo do app (`vocab`, `exemplos`, exercícios). Grátis, rápido, funciona sem internet, mas só cobre o que o app ensina.
  - IA pelo contexto da frase. Cobre qualquer palavra, mas gasta a cota mensal de IA e precisa de internet.
  - Recomendação: dicionário próprio, e a palavra que não estiver nele mostra "Ainda não tenho essa palavra" com o botão de marcar dúvida mesmo assim.

## Parte C: folclore (adiada)

Curupira, Iara, Saci e Boitatá, cada um com missão própria (floresta, rio, brincadeira e fogo/queimadas). As imagens não foram geradas porque os créditos de IA do Figma acabaram; renovam em 20/10/2026 às 00:00 UTC (21h do dia 19 em Brasília). Os prompts usados estão na conversa; o construtor deve reusá-los e conferir fidelidade ao folclore (Curupira com pés virados para trás e cabelo de fogo; Iara sereia de rio; Saci de uma perna só com carapuça vermelha; Boitatá cobra de fogo). Só depois disso entram na lista e na mistura dos planos.

## Conferir antes de publicar

- Estados de ameaça: conferir contra a Lista Vermelha da IUCN e a lista oficial brasileira (ICMBio/MMA) no dia da publicação, porque mudam. Os valores acima vêm de memória do assistente e **não foram conferidos**.
- Afirmações das legendas (ex.: quilombos aguardando título de terra, pesca artesanal em mar mais sujo) precisam de fonte oficial antes de ir ao ar.
- As imagens são geradas por IA. Rotular como "ilustração" no app se o Gabriel preferir, para não passar por fotografia documental. **Decisão do Gabriel.**
- Rever as imagens de pessoas com alguém da comunidade correspondente, se possível. A imagem da catadora traz placas e um crachá com texto gerado pela IA; o crachá é ilegível e deve ser recortado ou aceito.

## Deixado ao construtor

- Conteúdo exato dos exercícios, dos vocabulários e das tarefas finais.
- Detalhes de layout de cada tela dentro das regras do app.
- Estrutura dos testes, seguindo `tests/` e o padrão atual.

## Escolhas feitas pelo assistente (para o Gabriel conferir)

1. Intercalar uma missão do Brasil a cada 3 regulares e sempre manter pelo menos uma, mesmo em prazo curto.
2. Só as de nível A1 no objetivo "Começar do zero".
3. Legendas em inglês nas figurinhas, tradução ao toque.
4. Dicionário próprio como fonte de tradução (recomendada, **aguardando resposta**).
5. WebP a ~600 px em `public/assets/figurinhas/`.
6. Nomes dos códigos de conquista `fig-arara`, `fig-mico` etc.
