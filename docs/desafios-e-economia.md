# Desafios, coleção, moedas e XP

Regras atualizadas em 22/10/2026. Implementação em `src/social.js`, migração 12 em `src/db.js` e interface em `telas/social.js`.

## Participar

Amizades usam códigos aleatórios e aceite. Não há busca pública por e-mail, idade ou nome. O amigo vê apelido, coleção e placares compartilhados; não vê respostas ou estudo privado. Há bloqueio e limites de convite.

O desafio dura 2, 7 ou 30 dias e começa depois do aceite do convidado e da confirmação do criador. Escolha pontuação por exercícios (até 20 por dia UTC) ou por constância (dias com ao menos um exercício elegível). Somente eventos posteriores ao início e anteriores ao término contam. A poção não altera placares.

- **Amistoso:** disponível para todas as idades. Ninguém reserva, perde ou transfere figurinhas.
- **Troca opcional:** ambos precisam ter idade adulta informada. Cada um escolhe uma cópia repetida do outro; uma outra cópia do mesmo modelo e raridade deve continuar livre na coleção. Conquistas pessoais não participam. As duas cópias são reservadas após a escolha recíproca. O vencedor recebe a cópia combinada; empate não transfere nada.

Convites expiram em 72 horas. Antes do início, podem ser recusados ou cancelados. Depois, a rodada segue até o prazo. Apuração, atualização e transferência acontecem uma única vez na mesma transação. Ao excluir uma conta, as reservas do outro participante são liberadas. Desafios antigos que não atendem às novas proteções são cancelados na próxima consulta, sem retirar figurinhas.

## Metas cooperativas

Até dez amigos podem combinar exercícios ou sequência de dias. O criador inicia com quem aceitou. Os dias da sequência são blocos de 24 horas a partir do início, iguais para todos; cada participante cumpre a quantidade diária. O recorde da rodada fica mesmo se a sequência recomeçar. Cumprir a meta concede uma épica a cada participante. Não há figurinha em disputa. Encerrar uma rodada não retira prêmios já entregues.

## Coleção

Cada cópia tem ID, proprietário e raridade. As conquistas originais e os carimbos culturais permanecem no histórico pessoal. Os filtros mostram todas as cópias, repetidas ou reservadas. Raridades: comum, rara, épica e lendária; valores relativos de coleção 1, 3, 8 e 25, sem conversão em dinheiro.

Boas-vindas, marcos de prática, conquistas e metas cooperativas continuam concedendo cópias. A cada cinco exercícios elegíveis há uma figurinha; marcos de 25 e 100 geram rara e épica. A idade não é enviada no perfil social público.

## Recompensas

Primeira tentativa correta e independente de uma questão no dia UTC: 10 XP e uma moeda. Dicas, tradução durante a questão e resposta revelada contam como ajuda. Errar e tentar novamente é prática; repetir não multiplica a recompensa. Nivelamento e cartões com nota própria não pontuam. Uma questão do banco mantém sua identidade quando usada em uma turma, evitando contar novamente o mesmo item.

Uma sessão guiada concluída concede 25 XP uma vez no dia, mesmo se a pessoa apagar só suas respostas e refizer a prática. A mesma proteção vale para recarregamentos e requisições simultâneas. Lições, capítulos, treinos, atividades e assuntos têm seus próprios bônus de conclusão. XP mede participação, não nível de inglês ou domínio demonstrado.

Para impedir renovação artificial de recompensas, o servidor guarda um registro mínimo de item e dia, sem a resposta, mesmo ao apagar somente respostas. Apagar todos os dados ou excluir a conta apaga também esses registros, a carteira e o histórico econômico. A exportação inclui os dados da própria conta.

## Loja

| Item | Preço em moedas | Regra |
| --- | --- | --- |
| Caixa | 15 | Uma cópia; 65% comum, 25% rara, 9% épica, 1% lendária |
| Poção | 20 | XP em dobro por 30 minutos após ativar; sem acúmulo, sem multiplicar moedas ou pontos |
| Praça brasileira | 25 | Fundo permanente; não altera o aprendizado |
| Pôr do sol | 25 | Fundo permanente; não altera o aprendizado |

A compra guarda o item. Abrir, ativar ou equipar são ações posteriores. Dentro da raridade sorteada, a caixa prioriza os seis modelos de prática ainda não possuídos; quando todos estão na coleção, pode repetir. Isso não muda as probabilidades de raridade. Preço e chances aparecem antes da compra e abertura.

Os fundos são comprados uma única vez. Usar novamente o fundo ativo restaura o original. O servidor valida propriedade, saldo, inventário e identificador do pedido. Compra, débito e entrega são atômicos; a repetição do mesmo pedido devolve o recibo anterior. Não há compra de moedas com dinheiro real.
