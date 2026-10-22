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

## Correção do painel de resposta e do áudio — 22/10/2026

- O retorno de acerto/erro usa uma reação curta de Mia e Tuiuiú em linha. Resposta, explicação, recompensa real e controles de ouvir continuam acessíveis. Os controles preservam área de toque de 44 px.
- Telas em foco reservam rodapé adicional somente quando existe uma barra fixa. A sessão comum não deixa uma reserva de 13 rem sem controles; avançar uma questão volta ao topo.
- Consultar uma palavra mostra imediatamente seu sentido geral quando ele existe no catálogo local. “Ver outros sentidos nesta frase” consulta a IA sob demanda; palavras ausentes consultam automaticamente. Há cache por palavra e contexto, compartilhamento de consultas simultâneas, tempo limite e nova tentativa. Sentido geral não é apresentado como tradução contextual garantida.
- Botões de fala indicam preparação. O player espera suspensões anteriores e retoma o contexto de áudio antes da reprodução, evitando uma fonte iniciada em contexto suspenso ao trocar de fala no Safari. Falha na geração devolve a franquia mensal de áudio, além da reserva diária.
- Reações curtas são conteúdo fixo elegível para cache compartilhado; materiais pessoais continuam separados.

Validação: `npm run test:feedback` cobre acerto/erro com recompensas, rodapé comum/fixo, avanço de sessão, dicionário com rede lenta, cache, consultas simultâneas e controles de áudio. Usa Chromium e WebKit em 320, 390 e 430 px. `npm run test:browser` cobre os fluxos pedagógicos em desktop e celular. A auditoria `test:mobile` também foi executada nas larguras de 320 e 390 px. Não houve teste em iPhone físico.

Em produção, as quatro combinações oficiais de personagem e idioma responderam com MP3 válido à chamada de síntese. Franquias de novos áudios continuam se aplicando; cache existente não consome uma nova geração.
