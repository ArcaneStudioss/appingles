# Inglou · proposta original do produto (MVP)

> Documento histórico. O público e os recursos evoluíram. Consulte [README](../README.md) e [Evolução](EVOLUCAO.md) para o comportamento atual, integrações e limites. As estimativas de custo abaixo não são uma cotação atual.

> "Seu inglês, sua vida, seu plano. Cada aula nasce do que você precisa aprender."
> Nome e identidade (azul e branco) definidos pelo Gabriel em 18/10/2026. Antes de lançar: checar marca no INPI e o domínio.

## 1. Proposta

Um professor particular digital para brasileiros que precisam do inglês para algo concreto. O aluno diz **o que vem pela frente** ("tenho uma entrevista de emprego daqui a 3 meses") e o curso inteiro se organiza em volta disso. A diferença para Duolingo e afins não é "ter IA" (todos têm), e sim:

1. **Um objetivo real organiza o curso.** Entrevista vira missões: se apresentar, contar a trajetória, entender as perguntas, explicar um projeto, perguntar no fim. Cada lição, cartão e conversa serve a essas missões.
2. **Mapa das dificuldades, como hipótese.** Além de "errou", o motor procura padrões: entende lendo mas não ouvindo; reconhece com alternativas mas não produz sozinho; sabe mas demora; repete o mesmo erro em situações diferentes. Cada hipótese mostra a base, a confiança e pode ser descartada pelo aluno.
3. **A conversa de hoje vira a aula de amanhã.** Conversar → o que travou vira foco da próxima lição → prática com outra abordagem se a primeira não funcionou → revisão espaçada → dias depois, teste numa situação nova sem dicas.
4. **Material da própria vida.** Cola a descrição da vaga e recebe vocabulário do nível, exercícios, diálogo e perguntas de simulação.
5. **Progresso que dá para provar.** O painel separa **feito** (lições, minutos) de **demonstrado** (tarefa feita sozinho, com data e texto) e **mantido** (usou de novo, dias depois, em outra situação).
6. **Pensado para quem fala português.** Explicações em português, catálogo de 14 tropeços típicos de brasileiros (sempre confirmados nas respostas da pessoa), sotaque não é erro.

Público do lançamento: brasileiros adultos que precisam de inglês no **trabalho e em entrevistas** (situações concretas, resultado fácil de perceber). Também atende viagem, atendimento a clientes, estudos e conversação.

## 2. Jornada do aluno

1. **Página pública** → "Começar 30 dias grátis" (sem cartão).
2. **Cadastro** (nome, e-mail, senha, aceite da política).
3. **Objetivo em 4 telas:** para que precisa do inglês; a situação em palavras próprias e o prazo; área e interesses; minutos por dia e dias por semana.
4. **Teste de nível** (~12 min): 25 perguntas de gramática, vocabulário, leitura e escuta + escrita e fala opcionais. Resultado: nível estimado (A1 a C1) com aviso de incerteza, nível por habilidade, ponto forte, ponto de atenção e pistas de dificuldade.
5. **Plano:** meta realista para o prazo ("até 18/01 você vai poder dizer: consigo me apresentar..."), trilha de missões por semana, avisos francos (prazo curto prioriza o essencial).
6. **Dia a dia:** tela Hoje com a lição do dia (10 a 20 min), revisões pendentes e um próximo passo. Lição começa explicando **por que** é aquela aula.
7. **Conversas** de simulação; o que travou vira a próxima aula.
8. **Revisão** de cartões (repetição espaçada, áudio, erros do próprio aluno).
9. **Progresso:** feito x demonstrado, habilidades, hipóteses, antes e agora, próximas metas.
10. **Fim do teste:** sem cobrança automática; a conta vai para o acesso livre e os dados ficam.

## 3. Telas do MVP

Página pública, entrar/criar conta, objetivo (4 passos), teste de nível, resultado, plano (trilha), **Hoje**, lição (um passo por tela), revisão, conversar (cenários + chat), tirar dúvidas, seu material, progresso, conta (objetivo, teste de nível, lembretes, assinatura, dados, preferências, senha), política de privacidade, termos, 404.

## 4. Lógica de personalização (o que o motor faz)

| Sinal | De onde vem | O que muda |
|---|---|---|
| Objetivo + prazo + tempo | Perfil | Quais missões, em que ordem, quantas cabem (prazo curto = essenciais) |
| Nível estimado | Teste + acertos recentes | Dificuldade dos exercícios (1 a 3), quantas partes por missão, áudio mais devagar |
| Erros com padrão conhecido | Conversa, escrita, material, nivelamento | Vira **foco** da próxima lição + cartão de erro + teste em 3 dias |
| Foco que não firmou | Teste em outra situação falhou | Volta com **outra abordagem** (regra → comparação com o português → exemplos → escuta) |
| Escuta < leitura | Hipótese | Mais escuta, áudio mais lento, texto liberado depois de responder |
| Reconhece > produz | Hipótese | Troca alternativas por frases para montar e completar |
| Sabe, mas demora | Hipótese | Rodada de respostas rápidas com o que já domina |
| Esquece após dias | Hipótese (revisões) | Intervalos menores e uso em frases próprias |
| Missão demonstrada há 3+ dias | Competências | Teste em situação nova, sem dicas; passa = "mantido" |
| Área e situação do aluno | Perfil | Com IA: 3 exercícios por lição escritos com a situação real dele; tarefas pedem exemplos da área |

Regras de honestidade: a IA diz quando não tem certeza; nenhuma meta promete fluência em prazo; resposta "diferente mas certa" pode ser contestada pelo aluno e não conta como erro; hipótese pode ser descartada.

## 5. Planos sugeridos

| | Teste | Mensal | Anual |
|---|---|---|---|
| Preço | grátis, 30 dias, **sem cartão** | **R$ 29,90/mês** | **R$ 238,80/ano** (R$ 19,90/mês, 33% off) |
| Conteúdo | tudo | tudo | tudo |
| Conversas com IA (mensagens/mês) | 150 | 400 | 400 |
| Correções detalhadas com IA | 30 | 60 | 60 |
| Perguntas ao tutor | 60 | 150 | 150 |
| Materiais processados com IA | 5 | 10 | 10 |
| Lições com exercícios da sua situação | 30 | 31 | 31 |

- Passou do limite: segue no modo sem IA até o mês virar. **Nunca cobra extra.**
- Fim do teste sem assinar: acesso livre (revisões, progresso, dados). Nada é cobrado.
- Assinou durante o teste: o pago começa quando o teste acaba.
- Cancelamento em 1 clique, sem multa, acesso até o fim do período. Arrependimento: 7 dias (CDC).

### Custos de IA (estimativa, preços da API de 06/10/2026, câmbio de referência US$ 1 = R$ 5,50; conferir)
Aluno **intenso** num mês: ~200 mensagens de conversa, 25 correções, 30 dúvidas, 4 materiais, 22 lições personalizadas ≈ 720 mil tokens de entrada (60% em cache) e 156 mil de saída. Aluno **típico** ≈ 40% disso.

| Configuração | Intenso | Típico |
|---|---|---|
| Tudo no Claude Opus 5.5 (padrão do código hoje) | ~R$ 25 | ~R$ 10 |
| Tudo no Claude Sonnet 5.5 | ~R$ 13 | ~R$ 5 |
| **Misto (recomendado):** conversa e tutor no Haiku 5.5; correção, material e lição no Sonnet 5.5 | ~R$ 4,30 | ~R$ 1,70 |

Receita líquida por aluno (depois de taxa do Asaas e ~6% de imposto): ~R$ 26,70 no mensal e ~R$ 18,10/mês no anual. **Com tudo no Opus, o anual dá prejuízo no aluno intenso.** A configuração mista deixa margem confortável e é só trocar variáveis (`IA_MODELO_CONVERSA`, `IA_MODELO_TUTOR`, `IA_MODELO_AVALIACAO`, `IA_MODELO_MATERIAL`). Decisão do Gabriel; antes de decidir, vale um teste de qualidade com 20 conversas reais em cada modelo.

## 6. Arquitetura (preparada para evoluir)

- `src/conteudo/`: missões, dificuldades, cenários, nivelamento, objetivos (dados, fácil de ampliar sem mexer no motor).
- `src/motor/`: plano, lição, modelo do aluno (hipóteses), correção, repetição espaçada, conversa e material sem IA. Funções puras e testadas.
- `src/ia.js`: tutor com IA (opcional), um modelo por tarefa, saídas com JSON validado, texto do aluno sempre tratado como dado.
- `src/api.js` + `src/http.js` + `server.js`: API e servidor sem framework, padrão de segurança da Arcane.
- `public/`: app sem etapa de build (módulos JS), celular primeiro.
- Próximos passos naturais: pagamento real (Asaas), e-mail (recuperar senha, lembrete), gravação de áudio para comparar a fala ao longo do tempo, mais missões por objetivo, painel administrativo e métricas de produto.
