# Planos, cotas e Stripe Checkout

Preços e capacidade confirmados pelo proprietário em 22/10/2026. O catálogo em `src/catalogo-planos.js` é a fonte da página pública, metadados e tela da conta. Checkout e webhook estão implementados. A cobrança só fica disponível com `PAGAMENTO_MODO=stripe` e as credenciais privadas configuradas nas duas réplicas. Os oito preços existentes foram conferidos por API: ativos, recorrentes, BRL e produção. Não foram criados nem reajustados produtos ou preços. Família permanece R$ 27,90/mês ou R$ 249,90/ano.

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

## Integração Stripe

`src/stripe-precos.js` contém os oito IDs recebidos; variáveis `STRIPE_PRICE_<CATEGORIA>_<MENSAL|ANUAL>` permitem escolher os preços de outro ambiente. São IDs não secretos. Cada checkout confere valor em centavos, BRL, produto ativo, recorrência, ambiente e quantidade. Família e Turma usam **quantity=1**: uma assinatura com contas individuais, e não cinco ou vinte cobranças. O responsável ocupa uma das vagas. IA e novos áudios têm franquias compartilhadas; as lições e revisões mantêm progresso individual. O preço por pessoa é menor por ser uma contratação em grupo, sem prometer cinco franquias individuais de IA.

### Variáveis privadas

- `STRIPE_SECRET_KEY`: chave restrita ou secreta do mesmo ambiente dos preços.
- `STRIPE_WEBHOOK_SECRET`: segredo do endpoint, não uma chave da API.
- `STRIPE_PORTAL_CONFIGURATION`: configuração própria do portal, com faturas, atualização de cartão e cancelamento ao fim do período; troca de plano desabilitada.
- `PAGAMENTO_MODO=stripe` e `SITE_URL=https://inglou.arcanestudios.io`.

Nenhuma chave Stripe publicável é necessária: o navegador é redirecionado ao checkout hospedado. Nunca salvar chaves em arquivos públicos, commits ou logs. Substituir credenciais expostas no chat por novas credenciais nas variáveis privadas. Atualizar A, aguardar saúde, depois B. O Compose precisa encaminhar as variáveis; preencher apenas o painel sem recriar o serviço não modifica o processo Node.

A chave restrita precisa de: leitura de Prices e Products; criação/leitura de Customers e Checkout Sessions; leitura/atualização de Subscriptions; leitura de Invoices, Invoice Payments, PaymentIntents, Charges e Disputes; criação de sessões do Billing Portal. A configuração administrativa inicial exige escrita em configurações do portal e no webhook, permissões que podem ser removidas depois. Não é necessário permitir criação de cobranças ou reembolsos pela API do aplicativo.

### Webhook

Endpoint: `POST https://inglou.arcanestudios.io/api/v1/stripe/webhook`. No Stripe Workbench, selecionar a própria conta, ambiente correspondente e formato **Snapshot**. A versão usada pelo SDK é `2026-09-30.endive` (Stripe Node 23.0.1). Assinar estes eventos:

```text
checkout.session.completed
customer.subscription.created
customer.subscription.updated
customer.subscription.deleted
invoice.paid
invoice.payment_failed
charge.refunded
charge.dispute.created
charge.dispute.closed
```

O endpoint usa corpo bruto com limite de 256 KiB, tolerância padrão de assinatura do SDK e verificação do ambiente. É a única exceção ao CSRF de navegador. Não depende da sessão do aluno. O segredo informado é configurado somente no servidor. A entrega real de um evento pelo Stripe confirma também que o segredo pertence ao destino correto; uma requisição assinada por nós verifica o código, mas não prova essa correspondência.

### Segurança e ciclo da cobrança

A migração 14 acrescenta vínculos por IDs, tentativas de checkout, eventos processados e travas entre réplicas. Nunca há vinculação por coincidência de e-mail. Um checkout tem cliente vinculado à conta autenticada e metadata da assinatura; somente maiores de idade podem contratar. Menores podem entrar em um grupo pago pelo responsável. Código de grupo não compartilha textos, materiais ou conversas privadas.

Cliques repetidos reutilizam o checkout aberto e sua chave idempotente, persistida antes da chamada externa. Se a resposta se perde, a repetição usa os mesmos parâmetros. Uma tentativa aberta para outro plano precisa expirar antes de uma nova seleção, evitando duas assinaturas. Uma assinatura ativa, em teste com cartão ou com cobrança pendente também bloqueia segunda contratação. Falhas do SDK retornam mensagem neutra; mensagens originais de autenticação podem conter segredos e não são propagadas.

Abrir a página de sucesso **não libera acesso**. Os eventos consultam o estado atual da assinatura e da fatura no Stripe, protegidos por uma trava persistente. Eventos antigos não reaplicam snapshots antigos; duplicatas têm ID único. Falhas transitórias retornam erro para o Stripe repetir. A fatura paga e os pagamentos associados são verificados antes de estender o acesso. Inadimplência não estende o período quitado. Cancelar mantém o acesso até o fim do período; o cancelamento é feito também no Stripe.

Na compra durante o teste sem cartão, o restante do teste é mantido com `trial_end` no Stripe; quando faltam menos de 48 horas, concede-se uma pequena extensão para atender ao mínimo da plataforma. O cartão só é coletado ao escolher contratar. A assinatura contratada passa a ter os benefícios do plano durante esse restante do teste, com cobrança posterior informada no Checkout.

Reembolso integral da fatura atual ou disputa ainda não ganha pausa o acesso pago. Reembolso parcial conserva o acesso. Uma disputa ganha ou uma renovação posterior quitada é reavaliada pela situação atual da fatura. O aplicativo não executa reembolsos nem contesta disputas: essas ações continuam no painel Stripe. Excluir uma conta com cobrança em andamento fica bloqueado até seu encerramento; um checkout aberto é expirado antes da exclusão. Isso evita apagar o vínculo enquanto ainda há renovação no Stripe.

### Limitações e validação

Testes locais cobrem assinaturas inválidas, ambiente, corpo bruto, CSRF, preços divergentes, menores, duplicatas, ordem dos eventos, indisponibilidade, idempotência, disputa, reembolso, vagas e privacidade. A interface é verificada em Chromium e WebKit. Esses testes usam fixtures, não pagamento real nem iPhone físico.

Ainda é necessário acompanhar uma compra real autorizada e sua renovação no Stripe; não foi usado cartão real nesta implementação. Trocas entre planos pagos durante uma assinatura existente não estão disponíveis: cancelar e aguardar o fim do período antes de contratar outra. O portal não permite alterar produtos ou quantidade, evitando contornar limites de vagas. Checkout inicialmente aceita cartão; Pix recorrente, parcelamento, cupons e prorrata não foram implementados. Preços de teste devem ser configurados com chave e webhook de teste; IDs de produção são recusados com chave de teste.

Referências: [Checkout para assinaturas](https://docs.stripe.com/payments/checkout/build-subscriptions), [webhooks assinados](https://docs.stripe.com/webhooks), [objeto Subscription](https://docs.stripe.com/api/subscriptions/object), [Invoice Payments](https://docs.stripe.com/api/invoice-payment).
