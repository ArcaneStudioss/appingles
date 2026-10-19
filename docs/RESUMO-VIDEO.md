# Inglou: resumo para o vídeo

## Em uma frase
Inglou é um professor particular de inglês digital para brasileiros: você diz o que vem pela frente (uma entrevista, uma viagem, uma prova) e o curso inteiro se monta em volta disso. O que trava nas conversas de hoje vira a aula de amanhã.

Slogan: **"Seu inglês, sua vida, seu plano."**

## Para quem
Brasileiros adultos que precisam do inglês para algo concreto, principalmente trabalho e entrevistas. Também atende viagem, atendimento a clientes, estudos e quem quer começar do zero.

## O problema
Apps de inglês ensinam o mesmo caminho para todo mundo, e quem tem uma entrevista marcada para daqui a 3 meses perde tempo com o que não precisa.

## O que o Inglou faz diferente
1. **Um objetivo real organiza o curso.** Entrevista vira missões: se apresentar, contar a trajetória, entender as perguntas, explicar um projeto.
2. **Mapa das dificuldades.** O app procura padrões nos erros (entende lendo mas não ouvindo, sabe mas demora) e mostra a base de cada conclusão. O aluno pode descartá-la.
3. **A conversa de hoje vira a aula de amanhã.** O que travou vira foco da próxima lição, com outra abordagem se a primeira não funcionou.
4. **Material da própria vida.** Cola a descrição da vaga e recebe vocabulário, exercícios e perguntas de simulação.
5. **Progresso que dá para provar.** O painel separa o que foi *feito*, o que foi *demonstrado* e o que foi *mantido* dias depois.
6. **Feito para quem fala português.** Explicações em português e 14 tropeços típicos de brasileiros. Sotaque não é erro.

## A jornada do aluno
Página pública, 30 dias grátis sem cartão, cadastro, objetivo em 4 telas, teste de nível de uns 12 minutos (A1 a C1), plano com meta realista, e o dia a dia: lição de 10 a 20 minutos, revisão espaçada e conversas de simulação. Quem nunca estudou escolhe "Começar do zero" e segue uma trilha de 12 missões.

## O álbum do Tuiuiú (a cara do app)
O app é um álbum de figurinhas: cada missão é uma página, cada aula feita cola uma figurinha, a tarefa final vira a figurinha brilhante.
- **Tuiuiú**: arara-azul-grande, o mascote. Explica em português e lê em voz alta. A voz dele é de um menino de uns 10 anos.
- **Mia**: arara-vermelha, a amiga que fala inglês. Voz de menina de 14 anos.
- Cada atividade tem sempre a mesma cor e ícone. Há modo Dia e Noite.
- **Sequência de dias** sem castigo: dia perdido não quebra a sequência, e a cada 7 dias seguidos vem um escudo.
- **Rádio Tuiuiú**: um episódio por dia com os tropeços dos últimos 21 dias.
- **Treino focado** (6 a 10 perguntas por dia nas dificuldades) e **Estudo sob medida** (prova ou entrevista com data: o app divide em assuntos por dia e fecha com mini simulado).

## Planos
| | Teste | Mensal | Anual |
|---|---|---|---|
| Preço | grátis por 30 dias | R$ 29,90/mês | R$ 238,80/ano (R$ 19,90/mês) |

Passou do limite de IA, o app segue sem IA até o mês virar. Nunca cobra extra. Acabou o teste sem assinar, nada é cobrado.

## Por baixo do capô
- Node 22 sem framework, SQLite nativo, uma única dependência (SDK da Anthropic).
- Funciona inteiro sem IA (conversa por roteiro, correção por regras). Com IA entram conversa livre, correção detalhada e exercícios da situação do aluno.
- Segurança: senha com scrypt, proteção contra CSRF e força bruta, dados de cada aluno isolados, exportação e exclusão de dados. Backup diário cifrado.
- Deploy por Docker, em VPS.

## Estado do projeto
Pronto: app completo, trilha do zero, Rádio, treino, estudo sob medida, 36 testes automatizados.
Em andamento: vozes gravadas do Tuiuiú (474 frases em inglês).
Falta: cópia de backup fora do servidor, 2FA e recuperação de senha por e-mail, checar a marca no INPI e o domínio, e o deploy.

## Sugestão de roteiro do vídeo (60 a 90 s)
1. **Gancho:** "Entrevista em inglês daqui a 3 meses. E agora?"
2. **Problema:** cursos iguais para todos.
3. **Solução:** você conta seu objetivo e o Inglou monta o curso.
4. **Demonstração:** teste de nível, lição do dia, álbum de figurinhas, Tuiuiú falando.
5. **Diferencial:** "A conversa de hoje vira a aula de amanhã."
6. **Fechamento:** 30 dias grátis, sem cartão. Logo e slogan.
