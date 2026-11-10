# Aprender desde o primeiro dia

A trilha inicial funciona para crianças, adolescentes e adultos. A idade muda os exemplos e o tom; o inglês básico continua acessível para todos.

## Caminho inicial

1. Idade e perfil de aluno ou professor no cadastro. Contas existentes completam esses dados uma vez. Quem é menor de idade confirma a autorização do responsável.
2. Quem escolhe começar do zero entra direto na primeira aula, sem teste e sem perguntas sobre carreira ou prazo.
3. A primeira missão ensina Hello, Bye e Thank you na mesma aula: até três expressões por aula (o vocabulário é dividido em grupos parecidos, 6 = 3+3), uma por tela, com desenho, significado e áudio lento opcional.
4. Até sete atividades curtas por aula: reconhecer (só a primeira expressão vem com o modelo na tela; as outras são lembradas), ouvir sem o texto e dizer em inglês. Montar frases entra a partir da segunda aula. Ditado e escrita livre não são exigidos no primeiro contato.
5. Cada missão A1 tem `ceil(vocabulário/3) + 4` aulas: as de vocabulário, duas oficinas de frase (frases diferentes; a segunda retoma a primeira de memória, com lacuna e montagem sem apoio) e duas aulas de aplicação (a última com a tarefa). Antes eram 9 a 10 aulas por missão, com a mesma frase em dias seguidos.
6. Quem conclui a aula do dia pode adiantar a próxima parte ("Fazer mais uma aula"), até 3 aulas por dia (`POST /licao/proxima`). Para o iniciante, a aula da trilha é o destaque da tela Hoje até ser feita; a sessão rápida vem depois.
7. Toda resposta mostra o resultado e uma explicação. Há dicas, tradução ao toque, consulta da resposta e nova tentativa de prática.

## Ajuda e progresso

- Cada expressão da trilha do zero mostra "Leia assim" (leitura aproximada em português, `src/conteudo/pronuncia-zero.js`), que continua visível mesmo se o áudio falhar.
- `#/sons` (Mais > Sons do inglês, e link na primeira aula): alfabeto e oito sons difíceis para quem fala português, com palavras para ouvir (`src/conteudo/sons-ingles.js`, entram no cache público de voz).

- O balão de tradução aparece acima da palavra ao tocar ou usar o teclado. Fecha ao tocar fora, rolar ou pressionar Escape.
- O dicionário usa traduções conhecidas; não inventa sentidos para palavras ausentes. Mostra o contexto traduzido quando disponível.
- A explicação fica no conteúdo da página, sem ser cortada pela barra fixa do celular.
- Pedir ajuda faz parte da aprendizagem. Repetir uma questão não duplica registros nem transforma a primeira tentativa em acerto.
- É possível seguir depois de praticar as partes da missão inicial com ajuda. O selo de uso independente continua exigindo uma produção sem ajuda.
- Quando há muitos erros recentes na missão, a próxima aula usa reconhecimento e mais apoio antes de avançar.

## Públicos

- Crianças, até 12 anos: linguagem concreta, jogos, histórias, animais, escola e descobertas.
- Adolescentes, de 13 a 17: música, projetos, amizades e tecnologia, sem linguagem infantil.
- Adultos, a partir de 18: cotidiano, estudo, viagens e trabalho, com instruções objetivas mesmo no A1.

O nivelamento preserva a dificuldade das estruturas e adapta os textos e situações. Uma criança com inglês avançado pode alcançar a mesma estimativa que um adulto. As conversas e o tutor também consideram o público.

## Biblioteca e turmas

A biblioteca tem 15 capítulos, de A1 a B1, com vocabulário, leitura, tradução de apoio e 75 questões. Seis capítulos trabalham a proposta Do Brasil pro mundo: nomes regionais, conversas na internet e ditados com equivalência de contexto. O professor pode usar esses capítulos como modelo ou escrever outros conteúdos e níveis. As 24 fichas culturais, seus critérios e fontes são descritos em [brasil-pro-mundo.md](brasil-pro-mundo.md).

Uma aula da turma pode incluir explicação, palavras, texto em inglês, tradução e questões. O professor filtra o banco por tema, público, nível e tipo; confere a prévia e publica para a turma. O aluno consulta o material durante a prática e revê as explicações no fim. Uma aula pode ser copiada para outra turma sem copiar as respostas dos alunos.

## Código e validação

- Contexto de idade: `src/motor/publico.js`.
- Sequência inicial: `src/motor/licao-guiada.js`.
- Dicas e explicações: `src/motor/apoio.js`.
- Biblioteca: `src/conteudo/biblioteca.js`, `src/biblioteca.js`.
- Tradução ao toque: `public/assets/js/traducao.js`.
- Professor e aluno: `src/turmas.js`, `src/motor/turmas.js` e telas `professor.js` e `turmas.js`.
- Testes: `npm test`, incluindo idade, nivelamento, correção, assinatura, biblioteca, privacidade e reutilização de aulas.

## Reforço antes da aplicação

No A1, cada par de expressões é praticado em duas aulas. Antes da aplicação,
quatro oficinas acrescentam vinte atividades sobre duas frases curtas, repetidas
em aulas consecutivas. A primeira tentativa mostra modelo, significado e
explicação; depois o apoio é retirado aos poucos. As doze missões do zero têm
frases divididas em pedaços com tradução, incluindo os elementos gramaticais.

O modelo aparece junto à questão e pode ser ouvido devagar. A resposta com
modelo é registrada pelo servidor como prática com ajuda, inclusive na sessão
curta. Ela não eleva a dificuldade adaptativa nem o domínio independente.
Alternativas da base usam somente o par apresentado ou palavras já ensinadas.

Lições salvas continuam disponíveis. O plano usa a duração atual ao avançar,
mesmo quando uma versão antiga guardou apenas três partes. Missões já
demonstradas preservam seu estado. A duração da sessão curta é calculada com
o vocabulário completo da missão, não com o recorte exibido naquele dia.

## Ritmo e apoio (revisão de 09/11/2026)

- Na aula de palavras, o modelo escrito aparece só no primeiro contato (reconhecer) e ao montar. Na escuta ele não aparece mais: mostrava a resposta e o ouvido não era treinado. A dica e "Ver resposta e aprender" continuam a um toque.
- Quem acertou as seis últimas atividades de aula segue sem o modelo na tela (`embalado` em `src/motor/licao-iniciante.js` e `src/motor/oficina-frases.js`); na oficina, só o primeiro exercício mantém o modelo. Um erro devolve o apoio completo na aula seguinte.
- No fim de uma aula guiada com tudo certo de primeira, a tela oferece o atalho para `#/nivel`.
- Limite conhecido: o ajuste automático de nível (`src/motor/ajuste-nivel.js`) conta exercício com modelo como "com dica". Com o apoio completo, o aluno do A1 não chega aos 88% com até 25% de dica; sem o modelo (ritmo acima), passa a ser possível.
