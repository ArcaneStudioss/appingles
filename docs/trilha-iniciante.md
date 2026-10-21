# Aprender desde o primeiro dia

A trilha inicial funciona para crianças, adolescentes e adultos. A idade muda os exemplos e o tom; o inglês básico continua acessível para todos.

## Caminho inicial

1. Idade e perfil de aluno ou professor no cadastro. Contas existentes completam esses dados uma vez. Quem é menor de idade confirma a autorização do responsável.
2. Quem escolhe começar do zero entra direto na primeira aula, sem teste e sem perguntas sobre carreira ou prazo.
3. A primeira aula ensina Hello, Bye e Thank you: uma expressão por tela, com significado e áudio lento opcional.
4. Até cinco atividades por aula: combinar até três pares, reconhecer significados e ouvir. Completar e montar frases entram depois. Ditado e escrita livre não são exigidos no primeiro contato.
5. Toda resposta mostra o resultado e uma explicação. Há dicas, tradução ao toque, consulta da resposta e nova tentativa de prática.

## Ajuda e progresso

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

A biblioteca inicial tem nove capítulos, de A1 a B1, com vocabulário, leitura, tradução de apoio e 45 questões. O professor pode usar esses capítulos como modelo ou escrever outros conteúdos e níveis.

Uma aula da turma pode incluir explicação, palavras, texto em inglês, tradução e questões. O professor filtra o banco por tema, público, nível e tipo; confere a prévia e publica para a turma. O aluno consulta o material durante a prática e revê as explicações no fim. Uma aula pode ser copiada para outra turma sem copiar as respostas dos alunos.

## Código e validação

- Contexto de idade: `src/motor/publico.js`.
- Sequência inicial: `src/motor/licao-guiada.js`.
- Dicas e explicações: `src/motor/apoio.js`.
- Biblioteca: `src/conteudo/biblioteca.js`, `src/biblioteca.js`.
- Tradução ao toque: `public/assets/js/traducao.js`.
- Professor e aluno: `src/turmas.js`, `src/motor/turmas.js` e telas `professor.js` e `turmas.js`.
- Testes: `npm test`, incluindo idade, nivelamento, correção, assinatura, biblioteca, privacidade e reutilização de aulas.
