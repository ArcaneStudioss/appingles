# Qualidade das lições

As 36 missões têm uma orientação editorial em `src/conteudo/guias.js`: foco de
comunicação, exemplo traduzido e explicação curta do padrão. Ela acompanha a
explicação e o lembrete das aulas de aplicação. A base A1 continua mostrando só
as duas expressões do dia, sem acrescentar conceitos àquela etapa.

## Progressão e revisão

- A seleção dá prioridade ao último erro do aluno antes de apresentar novidade.
- A dificuldade máxima é um filtro: vagas não são preenchidas com questões acima
  do alvo. No A1, tradução e ditado continuam reservados à etapa final.
- A retomada de missões anteriores entra mesmo em aulas cheias. O corte preserva
  uma questão de prática, escuta e revisão antes de eliminar blocos inteiros.
- Os limites de 10 perguntas, ou 7 quando há áudio, também valem depois da
  personalização por IA. Fala conta como áudio.
- Exercícios da IA precisam de explicação, alternativas distintas após
  normalização e enunciados não duplicados. A instrução de geração restringe o
  conteúdo às estruturas e ao vocabulário ensinados. A validação estrutural não
  garante, sozinha, a qualidade semântica de toda resposta gerada.

## Explicação e produção

A correção aparece também após acertos. Escolhas antes sem explicação receberam
orientações específicas; lacunas múltiplas mostram a frase completa corretamente.
Traduções exibem uma resposta possível e variantes naturais cadastradas. A
transcrição de áudio fica salva com a resposta para continuar disponível ao
retomar a aula.

A tarefa final oferece um roteiro pelos critérios de avaliação. O modelo completo
fica dentro de “Ver dicas”, que marca uso de ajuda. No reteste, dicas e modelo
não são enviados. Os critérios são explicitados no enunciado passado ao avaliador.

A primeira missão do zero agora cobra instruções curtas que de fato ensina, sem
exigir agradecimento ou soletração não preparados. Os mínimos de palavras das
outras tarefas iniciais foram reduzidos para permitir respostas curtas que
cumpram todos os critérios. Os critérios continuam necessários para demonstração.

## Compatibilidade e verificação

Não há migração de banco. Lições já salvas conservam conteúdo e critérios; aulas
novas usam as mudanças. A interface de feedback e o roteiro se aplicam às lições
carregadas quando os campos necessários estão presentes. Missões concluídas não
são reabertas.

Os testes percorrem todas as missões, níveis e partes, verificam limites, IDs,
correção, explicações e ocultação de gabaritos, além dos fluxos completos pela API.
O navegador é verificado em largura de celular para orientação, tarefa, dicas e
feedback de acerto. Esta revisão não substitui avaliação com alunos reais.
