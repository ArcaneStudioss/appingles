# Planos, cotas e conexão futura com o Stripe

Preços e capacidade confirmados pelo proprietário em 22/10/2026. O catálogo em `src/catalogo-planos.js` é a fonte da página pública, metadados e tela da conta. A cobrança permanece desligada. Nenhum produto do Stripe foi criado, alterado ou cobrado nesta entrega.

| Plano | Mensal | Anual | Pessoas no total | Gerações de IA/mês | Novos caracteres de voz/mês |
|---|---:|---:|---:|---:|---:|
| Grátis | R$ 0 | R$ 0 | 1 | 0 | 0 |
| Basic | R$ 9,90 | R$ 79,90 | 1 | 0 | 1.000 |
| Completo | R$ 19,90 | R$ 149,90 | 1 | até 60 | 2.500 |
| Família | R$ 27,90 | R$ 249,90 | 5 | até 120 compartilhadas | 4.000 compartilhados |
| Turma | R$ 99,90 | R$ 899,90 | 20 | até 400 compartilhadas | 12.000 compartilhados |

O responsável ocupa uma vaga. Basic permite lições, biblioteca, revisão e prática com correção por regras; não envia pedidos à IA paga. Completo permite até 2 materiais/mês; Família até 4; Turma até 12. Esses materiais também entram nas cotas gerais de geração e processamento, não são extras. O teste de 30 dias tem até 15 gerações, 1 material e 500 caracteres de novos áudios por mês. Acabando o teste, a conta retorna ao Grátis com revisões e histórico.

Pedidos que chegam à geração reservam cota antes da chamada externa, inclusive quando o provedor falha sem confirmar utilização. As cotas renovam mensalmente, também no anual; não acumulam. Cache de áudio preparado não consome uma geração nova. Cotas financeiras podem encerrar novas gerações antes do máximo de operações, pois um material longo custa mais que uma resposta curta. A página pública e a conta explicam essa diferença. Conteúdo e prática sem IA continuam nos planos pagos. Textos, conversas e materiais pessoais não são compartilhados com o responsável. O painel do responsável mostra somente nomes e ocupação das vagas; entrar exige código e uma conta autenticada. Professores usam as permissões pedagógicas existentes, separadas da assinatura.

## Proteções financeiras

A migração 13 adiciona membros, convites e contadores. Reservas de custo são transacionais no SQLite compartilhado pelas duas réplicas. O teto de IA por mês e assinatura é US$ 0,08 no teste, US$ 0 no Basic, US$ 0,45 no Completo, US$ 0,65 no Família e US$ 2 no Turma. Esse é um teto de orçamento, não um valor cobrado do aluno. É usado o custo conservador dos modelos configurados, com margem para cache e estrutura do pedido; modelos sem preço conhecido ficam bloqueados. Respostas bem-sucedidas ajustam a reserva pela utilização registrada pelo provedor; erros sem utilização confirmada conservam a reserva para evitar gastar duas vezes em uma tentativa possivelmente faturada. Não há troca automática para outro modelo nem retry automático de chamadas pagas.

Há um teto global inicial de US$ 10/mês para IA (`IA_ORCAMENTO_GLOBAL_USD`) e US$ 5/mês para voz (`VOZ_ORCAMENTO_GLOBAL_USD`), configuráveis somente no servidor. Ao atingir um teto global, novas gerações pausam; o conteúdo existente permanece. A contagem global é agregada e não é apagada ao excluir uma conta, impedindo que recriação de contas renove o orçamento global. Os valores iniciais são deliberadamente pequenos: acompanhe consumo e receita antes de ampliá-los. Preparação manual de voz por script é uma operação administrativa separada, fora do fluxo HTTP; não execute lotes pagos sem dimensionar o orçamento.

Fontes consultadas em 22/10/2026:
- [Anthropic](https://platform.claude.com/docs/en/about-claude/pricing): Haiku 5.5 US$ 0,10/0,50, Sonnet 5.5 US$ 2/10 e Opus 5.5 US$ 4/20 por milhão de tokens de entrada/saída. A reserva de entrada usa até duas vezes o preço-base, conservador para cache. Prompts acima de 100.000 bytes são recusados para evitar a faixa longa.
- [ElevenLabs](https://elevenlabs.io/pricing/api): v4 até US$ 0,08 por mil caracteres; Flash/Turbo até US$ 0,04. O teto global de caracteres usa US$ 0,08/1.000 de forma conservadora. Contrato, franquia ou cobrança mínima podem mudar o custo efetivo.
- [Stripe Brasil](https://stripe.com/br/pricing): referência pública de 3,99% + R$ 0,39 para cartões nacionais, mais 0,7% do volume do Billing. Cartões internacionais e serviços adicionais podem custar mais.

### Cenário de margem, não promessa de lucro

Usando dólar de planejamento a R$ 7 (hipótese de segurança, não cotação atual), cartão nacional e anual pago em uma transação, os tetos mensais de IA + voz são aproximadamente R$ 0,56 no Basic, R$ 4,55 no Completo, R$ 6,79 no Família e R$ 20,72 no Turma. Depois de tarifas de 4,69% e amortização de R$ 0,39/ano, sobram aproximadamente R$ 5,75, R$ 7,32, R$ 13,03 e R$ 50,72 por mês, respectivamente, antes de hospedagem, impostos, suporte, reembolsos, disputas, franquias mínimas e demais custos fixos. Não é possível garantir ausência de prejuízo sem conhecer esses custos e o volume de assinantes.

## O que falta do Stripe

Reaproveitar os quatro produtos já existentes e seus oito preços recorrentes, em BRL, sem recriá-los. Precisamos dos identificadores `price_...` correspondentes a:

```env
STRIPE_PRICE_BASIC_MENSAL=price_...
STRIPE_PRICE_BASIC_ANUAL=price_...
STRIPE_PRICE_COMPLETO_MENSAL=price_...
STRIPE_PRICE_COMPLETO_ANUAL=price_...
STRIPE_PRICE_FAMILIA_MENSAL=price_...
STRIPE_PRICE_FAMILIA_ANUAL=price_...
STRIPE_PRICE_TURMA_MENSAL=price_...
STRIPE_PRICE_TURMA_ANUAL=price_...
```

Também será necessária `STRIPE_SECRET_KEY`, salva somente nas variáveis privadas da Hostinger. Começar no modo de teste; depois usar produtos, preços e chaves do mesmo ambiente de produção. O Grátis não precisa de preço recorrente no Stripe. Para checkout hospedado no servidor, não é necessário fornecer uma chave publicável do Stripe nesta fase.

A integração Stripe Checkout/Billing ainda precisa ser implementada e validada: preços conferidos no servidor, checkout idempotente, vinculação ao usuário autenticado, webhook assinado, eventos duplicados e fora de ordem, renovação, inadimplência, cancelamento, reembolso/disputa e portal do cliente. A assinatura não pode ser liberada apenas porque o navegador abriu a página de sucesso. A conta Stripe deve estar habilitada para receber pagamentos e ter dados de repasse preenchidos.

Depois de existir o endpoint de webhook, cadastrar no Stripe e salvar `STRIPE_WEBHOOK_SECRET=whsec_...` no servidor. Não cadastrar uma URL de webhook ainda: não há endpoint Stripe operacional nesta entrega. Os eventos exatos e a URL serão fornecidos junto da integração. Não enviar `sk_...` ou `whsec_...` no chat. As variáveis acima documentam o contrato da próxima integração; preenchê-las agora, isoladamente, não habilita pagamentos.

Referências: [Checkout para assinaturas](https://docs.stripe.com/payments/checkout/build-subscriptions) e [webhooks assinados](https://docs.stripe.com/webhooks).
