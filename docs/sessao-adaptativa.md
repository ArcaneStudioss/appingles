# Sessão que acompanha o aluno (11/2026)

A sessão curta de Hoje (5, 10 ou 20 minutos) passou a ser montada a partir do histórico de respostas de cada pessoa. Código em `src/motor/sessao-adaptativa.js`; testes em `tests/sessao-adaptativa.test.js` e `tests/sessao-segunda-chance.test.js`.

## O que muda conforme o aluno

| Sinal (últimas respostas) | O que a sessão faz |
| --- | --- |
| Menos de 6 respostas | Modo "conhecendo": mistura os tipos e avisa que ainda está aprendendo sobre a pessoa |
| Acerto recente abaixo de 55% (dica vale 0,7) | Começa pela questão mais leve, tira tradução e ditado, ordena por dificuldade e liga o banco de palavras |
| Acerto de 88% ou mais, com até 25% de dica | Entram questões mais puxadas (no A1: tradução e escuta) |
| Modo mais fraco (ler, escrever, ouvir) medido com 6+ respostas | Questões desse modo ganham prioridade |
| Escuta abaixo de 60% | Áudio começa mais devagar em todas as telas de exercício (sessão, aula, treino, biblioteca) |
| Escrita abaixo de 50% ou ritmo de apoio | Lacunas de um espaço mostram palavras para tocar; escrever continua valendo |
| Erro antigo ainda não corrigido | Volta como "Relembrar" (uma por dificuldade), intercalado e nunca na abertura |
| Dificuldade do catálogo em aberto | Se sobrar vaga de "Relembrar", entra uma questão dessa dificuldade |
| Questão já acertada sem ajuda | Vai para o fim da fila |

Cada decisão vira uma frase em "Ajustada para você", na abertura da sessão.

## Segunda chance

Errou (ou pediu para ver a resposta)? A mesma questão volta no fim da sessão, uma vez por questão, até 1, 2 ou 3 vezes por sessão (5, 10 ou 20 minutos). A nova tentativa fica registrada no mesmo item, mas como prática com apoio: ela não infla o domínio independente. Na conclusão, a questão recuperada conta para o avanço de prática da missão e aparece separada no placar.

## Honestidade das medidas

- Escolher no banco de palavras é registrado como reconhecimento, não como escrita.
- A pista automática (quando a questão não tem dica própria) diz só a estrutura: número de letras ou de palavras e o caminho. Nunca o conteúdo da resposta.
- Em Progresso, "Como estou te acompanhando" compara o acerto sem ajuda das duas últimas semanas com as duas anteriores (só com 8 respostas ou mais em cada janela) e lista os ajustes ligados agora.
