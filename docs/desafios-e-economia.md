# Desafios, figurinhas, moedas e XP

Implementação inicial: 22/10/2026. As rotas são `#/desafios`, `#/colecao` e `#/loja`. Os acessos ficam em Mais → Amigos e coleção; a tela Hoje também traz o cartão Desafios com amigos e o saldo de XP/moedas.

## Figurinhas

As conquistas pessoais e as páginas da trilha já existiam. Elas continuam registradas no álbum mesmo quando alguém perde um duelo. A nova coleção guarda cópias com proprietário e identificador únicos; só essas cópias são transferidas.

- Ao entrar na área social, a pessoa recebe uma figurinha de boas-vindas.
- Conquistas existentes viram cópias na coleção durante a migração. A conquista original é preservada.
- Cada cinco exercícios válidos gera uma figurinha. O marco de 25 pontos gera uma rara; o de 100, uma épica.
- Metas cooperativas cumpridas dão uma figurinha épica para cada participante.
- Conquistas de 100, 200 e 365 dias seguidos geram cópias lendárias. Marcos de 30/60 dias e retenção geram épicas; outras conquistas geram raras.
- É possível ter cópias repetidas. Cada cópia pode estar em apenas um duelo por vez.

Raridades e valor relativo de coleção: comum (1), rara (3), épica (8), lendária (25). Esse valor serve para comparar figurinhas na escolha do duelo; não é saldo de moedas ou preço de revenda.

## Amigos e duelos

A busca usa o código aleatório mostrado pela própria pessoa. Não existe busca pública por nome, idade ou e-mail. O perfil social mostra um apelido editável, inicialmente o primeiro nome. O destinatário precisa aceitar a amizade. Amigos veem coleção e placares dos desafios compartilhados, sem acesso às respostas, ao e-mail ou ao histórico privado de estudo. Há bloqueio de contatos e limites de convites.

1. O criador escolhe um amigo, a duração de 2, 7 ou 30 dias e uma figurinha da coleção dele.
2. O convidado vê a figurinha dele em disputa e escolhe uma do criador. Esse aceite reserva as duas cópias.
3. O criador vê ambas e confirma a troca em disputa. Só então o relógio começa.
4. Quem fizer mais exercícios válidos no período vence. O vencedor ganha a cópia que escolheu do adversário e conserva a própria.
5. Em empate, cada um mantém a sua. Convites podem ser recusados/cancelados antes do início; depois de iniciado, o duelo segue até o prazo.

Convites sem resposta expiram em 72 horas; reservas pendentes são liberadas. O resultado é apurado pelo servidor ao consultar ou agir na área social após o prazo. A operação de apuração e a transferência ocorrem na mesma transação e são idempotentes. A exclusão da conta ou de todos os dados remove seus duelos e libera a figurinha reservada do outro participante.

## Metas e sequências em grupo

Uma pessoa convida até nove amigos. Os convidados aceitam participar; o criador começa quando houver pelo menos duas pessoas. Quem ainda não aceitou fica fora da rodada, e o grupo não muda durante o período.

- **Exercícios:** somar um total escolhido pelo grupo dentro de 2, 7 ou 30 dias.
- **Sequência:** alcançar uma quantidade escolhida de dias consecutivos, com 1 a 20 exercícios por pessoa em cada dia. Um dia é um bloco de 24 horas contado a partir do início, igual para todos. Cada participante precisa cumprir a quantidade diária; um bloco perdido interrompe a sequência atual, preservando o recorde da rodada.

Ao cumprir a meta, todos recebem uma épica. O grupo não coloca figurinhas em disputa. Uma pessoa que já aceitou pode encerrar a rodada para todos, sem retirada de figurinhas. O encerramento exige confirmação na interface.

## Moedas e XP

As correções do servidor registram a recompensa. O navegador não escolhe o saldo, o placar ou a raridade.

- Um exercício correto na primeira tentativa, sem dica ou resposta revelada, dá **1 moeda e 10 XP**. A mesma questão conta uma vez por dia UTC; uma nova gravação, repetição ou reenvio não multiplica a recompensa.
- Lições, capítulos da biblioteca, treinos, aulas de turma e assuntos do estudo sob medida concluídos dão **25 XP adicionais**, uma vez por conclusão válida. Acertos não são exigidos para o bônus de concluir a aula. Lições/treinos sem nenhuma resposta registrada não rendem esse bônus.
- Nivelamento, notas atribuídas pelo próprio aluno nos cartões e exercícios pulados não geram moedas ou pontos de desafio.
- O XP indica atividade no app; o nível de XP a cada 100 pontos não substitui o nível de inglês A1–C1.
- O XP histórico de lições e capítulos já concluídos é importado sem multiplicador. Os placares de desafios consideram apenas registros posteriores ao início da rodada e anteriores ao fim.

Apagar apenas respostas preserva os registros de recompensa, sem guardar o texto respondido neles. Apagar todos os dados zera a economia e os relacionamentos do usuário. Exportar dados inclui sua carteira, XP, coleção e participações.

## Loja inicial

| Item | Preço | Uso |
| --- | --- | --- |
| Caixa de figurinhas | 15 moedas | Ao abrir, entrega uma figurinha sorteada no servidor. |
| Poção de XP | 20 moedas | Após ativar, dobra o XP futuro durante 30 minutos. |

A compra guarda o item no inventário. Ativar a poção ou abrir uma caixa são ações separadas. A poção não acumula com outra ativa, não altera moedas e não muda os placares por quantidade de exercícios.

Chances por caixa, mostradas antes de comprar e abrir: **65% comum, 25% rara, 9% épica e 1% lendária**. Cada caixa entrega uma cópia e pode repetir modelos. O sorteio usa `crypto.randomInt`, sem aceitar raridade ou modelo enviados pelo navegador.

Compras e consumo usam identificadores de pedido; repetir a mesma solicitação retorna o recibo anterior. Saldo, débito, inventário e entrega são verificados na mesma transação SQLite. Gastos concorrentes não permitem saldo negativo. Os preços e chances são definidos em `src/social.js`.

## Persistência e validação

A migração 11 acrescenta as tabelas sociais e os extratos de moeda/XP. Gatilhos de banco conectam correções, conquistas e conclusões à economia, inclusive nas duas réplicas do servidor. Identificadores de eventos e desafios são monotônicos; a identidade de emissão evita colisão de figurinhas se uma conta excluída tiver seu ID numérico reutilizado. As migrações conferem a versão novamente sob bloqueio para suportar subida simultânea.

Testes cobrem correções reais pela API, CSRF, isolamento entre contas, propriedade e reservas, aceite, empate e expiração, limites temporais, sequência cooperativa, idempotência, compras concorrentes, poção, sorteios por faixa, exclusão, migração e reabertura do banco. Os fluxos completos de interface foram conferidos em Chromium e WebKit, em computador e tela de celular.
