# Revisão da interface em celulares — 22/10/2026

A revisão verifica o conteúdo dentro dos cartões, não apenas a largura total da página. Um cartão pode cortar texto mesmo quando a página não apresenta rolagem horizontal.

| Problema encontrado | Ajuste |
|---|---|
| Biblioteca, professor, loja e materiais ultrapassavam a largura em celulares pequenos | Coluna principal com tamanho mínimo zero, campos e ações limitados ao espaço disponível e botões com quebra de linha entre palavras |
| Vocabulário da sessão juntava palavra, tradução, exemplo e botão na mesma linha | Agrupamento de palavra, significado e exemplo, com reprodução numa linha própria |
| Título de material disputava espaço com a data e a navegação | Título ocupa uma linha completa abaixo da navegação |
| Tradução ao toque fazia as palavras da conversa virarem itens de uma única linha flexível | Texto da mensagem agrupado dentro do balão; botão de áudio mantém espaço próprio |
| Pontuação terminava sozinha na linha seguinte e controles em linha aumentavam a altura do texto | Pontuação final permanece junto da palavra; traduções conservam a altura natural da linha |
| Falas da Mia e do Tuiuiú ficavam em colunas estreitas | Personagens acima do balão em telas pequenas, mensagem com fonte de 16 px e espaço integral do cartão |
| Controles da rádio eram cortados dentro da capa | Reprodução em uma linha e velocidade em outra, com personagens adaptados à largura |
| Janela podia esconder ações em telas baixas | Corpo rolável entre cabeçalho e ações; campos e botões permanecem dentro da janela |
| Caixa de conversa cobria mensagens em paisagem | Caixa segue o fluxo do documento em telas baixas |
| Treino sem dados caía no erro genérico | Estado inicial com explicação e próximo passo para a aula de hoje |

O azul, os personagens, a reprodução com as vozes oficiais e o progresso foram preservados. O gesto de ampliar continua disponível. Botões de ação mantêm áreas de toque de pelo menos 44 px no modo de toque; palavras traduzíveis são controles dentro do texto e preservam a leitura da frase.

## Validação

- Chromium e WebKit com toque, nas larguras de 320, 360, 390 e 430 px.
- Janelas e tradução em 320 × 568 e 568 × 320, incluindo cabeçalho, botão de fechar e ações visíveis.
- Texto ampliado para 125% na janela de planos.
- Página pública, termos, privacidade, login, cadastro e recuperação de senha. Autenticação externa usa configuração simulada, sem enviar e-mail.
- Telas principais de estudo, biblioteca, cultura, conversa, progresso, materiais, rádio, conta, turmas, professor, desafios, coleção e loja.
- Dez tipos de exercício do banco e das aulas guiadas, antes e depois do feedback.
- Apresentações por idade, navegação de professor e banco de questões expandido.
- Preservação do texto e da pontuação após ativar a tradução ao toque.
- Testes existentes de servidor e fluxos completos de estudo, retomada, turmas, loja e seleção de planos.

Executar `npm test`, `npm run test:browser` e `npm run test:mobile`. A auditoria móvel grava `report.json` e capturas em `/tmp/inglou-mobile-artifacts`, com caminho configurável por `AUDIT_OUT`. Ela falha ao encontrar cortes, palavras divididas entre linhas, falhas de renderização ou controles de diálogo fora da tela. `AUDIT_ENGINES=chromium` ou `webkit` permite conferir um navegador por vez.

Esses testes não representam uso em um iPhone físico. Teclado do sistema, ajustes próprios de tamanho de texto e comportamento de aparelhos específicos ainda exigem verificação no dispositivo.
