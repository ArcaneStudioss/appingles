# Acesso individual de cortesia

O catálogo continua com Grátis, Basic, Completo, Família e Turma. “Máximo” não é uma sexta oferta comercial; o acesso individual mais completo é o Completo.

Uma concessão administrativa pode registrar `cortesia: { categoria: 'completo', concedida_em: '<ISO>' }` no JSON de assinatura já existente, preservando os demais dados e acrescentando um evento ao histórico. O estado efetivo passa a `cortesia`, sem prazo comercial, cobrança ou renovação automática, com as franquias normais de Completo. A interface da conta identifica a cortesia. Isso não cria transação, cliente ou assinatura no Stripe e não promove a conta a administradora.

A concessão deve ser feita somente por operação administrativa autorizada, após backup e identificação exata da conta existente. Não há endpoint público para concedê-la. Para revogar, remova o campo `cortesia` e registre a revogação; os dados originais voltam a determinar o acesso. Uma assinatura de cobrança já existente deve ser tratada separadamente: conceder acesso não cancela cobranças.
