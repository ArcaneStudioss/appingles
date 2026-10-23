# Correções de ajuda, retomada e franquias — 22/10/2026

## Sessão

Uma falha de rede ao pedir apoio não mantém a fila de ajuda permanentemente rejeitada. O aluno pode pedir ajuda novamente ou conferir a resposta sem recarregar a página. A intenção de usar apoio acompanha a resposta enviada ao servidor, mesmo se a consulta de ajuda falhou; ela não vira uma tentativa independente por causa de um erro de rede.

Se todas as questões já foram respondidas, mas a conclusão ainda não foi salva, reabrir a sessão mostra a tela de conclusão. Não retorna à introdução nem exige refazer as respostas. O botão de salvar permanece explícito; conclusão automática não foi adicionada nesta correção.

## Franquia e custo de IA

- Chamada rejeitada, interrompida, recusada pelo provedor, cortada ou com JSON inválido devolve a reserva financeira individual e a quantidade de gerações da tentativa.
- As cotas específicas de atividade (tutor, material, conversa, avaliação, estudo, aula, rádio e treino) também são devolvidas quando a geração falha. Em treino com chamadas paralelas, a atividade só é devolvida se nenhum conjunto aproveitável foi produzido.
- Custo confirmado pelo provedor permanece no orçamento global, mesmo quando não houve entrega útil ao aluno. Uma rejeição HTTP 4xx, exceto timeout 408, sem resposta de consumo libera a reserva global. Em timeout, falha de rede ou erro sem confirmação de consumo, a reserva global conservadora é mantida. Esses custos incertos exigem conciliação administrativa; não são descontados da franquia do aluno.
- A liquidação da mesma reserva é idempotente no processo que a criou. As reservas e os ajustes de contadores continuam transacionais no SQLite compartilhado. Não existe alteração de preços ou aumento das franquias.
- O limite individual retorna HTTP 429; indisponibilidade por orçamento global retorna 503 e informa que o limite pertence ao Inglou. Os caminhos que oferecem prática básica propagam esse aviso, em vez de atribuir o problema à franquia do aluno.

Reservas históricas de tentativas anteriores à correção não são recalculadas: os registros antigos não permitem identificar com segurança quais falharam ou tiveram custo real. Nenhuma assinatura, cobrança ou progresso existente é substituído.

## Validação

- `npm test`: testes de liquidação, custos confirmados e incertos, idempotência, limites pessoais/globais e API real com provedor simulado. Não fazem chamadas pagas.
- `npm run test:feedback`: Chromium/WebKit, incluindo falha de rede na ajuda, nova tentativa, correção com apoio registrado e retomada após todas as respostas sem salvar a conclusão.
- `npm run test:browser`: fluxos completos de estudo, turmas, personagens, áudio/transcrição, loja e navegação em desktop/celular.

Navegadores móveis foram emulados. Não houve teste em iPhone físico.
