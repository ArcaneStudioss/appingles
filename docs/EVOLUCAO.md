# Evolução do Inglou — 22/10/2026

Base examinada: `main`, commit `902edff`. A branch padrão antiga não contém as integrações mais recentes.

| Área | Comportamento encontrado | Trabalho desta entrega |
| --- | --- | --- |
| Contas | Supabase com senha, confirmação, recuperação, Google/PKCE e migração dos IDs locais | Preservar os fluxos; permitir ensinar e estudar na mesma conta |
| Aprendizagem | Trilha por objetivo, público, primeira prática guiada, dicas e revisão | Sessão de 5/10/20 minutos com retomada, apoio persistido e conclusão real |
| Evidências | Tarefa independente e um reteste após três dias | Novos retestes espaçados e comparações dentro da mesma missão |
| Cultura | Catálogo com fontes, contexto e capítulos de prática | Passaporte de missões e revisão editorial |
| Economia | Extratos transacionais, inventário, probabilidades e XP | Coleção com repetidas, proteção das conquistas e personalização |
| Social | Convites, reservas e transferência em duelos | Desafio amistoso, constância, limite diário e troca opcional de repetidas entre adultos |
| Professores | Material próprio, questões, prévia e reutilização | Rascunhos, publicação, encerramento e novas versões sem alterar respostas anteriores |
| Vozes | Quatro vozes oficiais, cache por conta e limites de caracteres | Cache de conteúdo público do catálogo e preparação antecipada sem misturar textos pessoais |
| Administração | Sem fila editorial | Relatos, revisão e métricas agregadas sem respostas privadas |

Credenciais não estão disponíveis neste ambiente. As integrações externas são verificadas com provedores simulados; ativação e validação ao vivo exigem a configuração documentada. Não há pagamento real implementado. Preços comerciais existentes são preservados.

Autorizações de menores continuam sendo declarações registradas pelo cadastro. Professor e responsável não são equivalentes; a área de turma não recebe acesso ao estudo privado. A declaração não deve ser anunciada como verificação de identidade de um responsável.

## Regras implementadas

- Sessão curta é uma prática diária: explica poucas palavras, permite apoio e registra respostas. Não certifica fluência. O início absoluto prioriza reconhecimento; uma resposta revelada ou feita com apoio não é independente. Tentar novamente é prática e não repete recompensas.
- A chave do XP de conclusão usa identidade da conta e dia, não o ID descartável da sessão. O registro mínimo de recebimento de exercícios não contém respostas e permanece ao apagar somente as respostas, impedindo renovar recompensas artificialmente. Apagar todos os dados ou excluir a conta também apaga esses registros.
- O cronograma considera minutos disponíveis. A tarefa final continua necessária para demonstrar uma missão. Comparações mostram amostras da mesma missão e rubrica; contextos e modos de avaliação ainda podem variar.
- O passaporte aproveita quatro capítulos culturais de cada público. Carimbo é conclusão de prática; as conquistas pessoais não são transferíveis. O catálogo existente mantém suas fontes. Relatos são revistos por uma pessoa autorizada; não há publicação automática de sugestões.
- Atividade antiga permanece publicada com o mesmo ID. Nova publicação é imutável; revisar cria outro ID e outra versão. Rascunhos são invisíveis ao aluno. Encerrar impede novos envios e mantém a consulta às respostas anteriores.
- Desafios amistosos não reservam nem transferem itens. Troca exige duas contas com idade adulta informada e pelo menos uma outra cópia livre de cada modelo/raridade. Convites antigos incompatíveis com as novas proteções são cancelados e as reservas liberadas na próxima consulta. Pontos consideram a janela real do desafio, com teto de 20 por dia UTC; constância conta dias com exercícios elegíveis.
- As raridades continuam 65/25/9/1%, a caixa custa 15 moedas e a poção 20. A seleção de modelo prioriza os faltantes da raridade sorteada, sem mudar sua probabilidade. Os fundos Praça brasileira e Pôr do sol custam 25 moedas virtuais, são permanentes e não mudam recompensas. Usar novamente o fundo ativo restaura o original.

## Operação

1. `npm ci` instala as dependências; `npm test` valida API e motores.
2. Para interface: `npx playwright install --with-deps chromium webkit` e `npm run test:browser`. O script usa contas e banco temporários. Capturas ficam no diretório temporário `inglou-browser-artifacts`, ajustável com `BROWSER_ARTIFACTS`.
3. Migração 12 é aditiva e executada sob bloqueio SQLite. Testes verificam preservação do histórico e subida concorrente. Faça o backup habitual antes de atualizar a instância real.
4. Configure `INGLOU_ADMIN_IDS` no servidor com IDs conhecidos de contas autorizadas. Vazio não autoriza ninguém. A decisão não depende de campos enviados pelo navegador, nem apenas de um e-mail que alguém digitou.
5. Supabase, Google e envio de e-mails seguem [a configuração existente](autenticacao-supabase.md). Não foram substituídos por fluxos simulados no produto.
6. As vozes continuam restritas aos quatro IDs oficiais. A documentação [Models](https://elevenlabs.io/docs/overview/models.md) e [Text to speech](https://elevenlabs.io/docs/api-reference/text-to-speech/convert.md) foi consultada em 22/10/2026: `eleven_v4`, idiomas, configurações de voz e continuidade por `previous_text`/`next_text`. Os modelos configurados foram preservados.
7. `npm run vozes:preparar` não chama o provedor. Para gerar, configure `VOZ_PREPARAR_USUARIO` como administrador existente e use `npm run vozes:preparar -- --gerar`. O lote inicial é limitado e inclui as quatro combinações de personagem/idioma. Os limites diários continuam valendo. Somente texto fixo reconhecido pelo servidor usa o cache público; contextos personalizados nunca entram nele.

## Limites da validação

O ambiente não disponibiliza credenciais para chamadas reais a Supabase, Google ou ElevenLabs. Os testes existentes verificam suas integrações com provedores simulados, inclusive as quatro combinações de voz e a migração segura de contas. As melhorias não configuram o provedor externo nem o envio de e-mails em produção.

A interface é exercitada em Chromium e WebKit, em 1280×900 e 390×844. Reconhecimento real pelo microfone, qualidade vocal percebida, áudio com o botão de silencioso e outros comportamentos de hardware ainda exigem verificação em aparelhos físicos. O recurso visual de palavras azuis permanece acompanhamento de transcrição, não avaliação acústica de pronúncia.

Pagamentos reais, preços institucionais, acessórios para personagens, cadastro verificado de responsáveis e edição automática de gabaritos a partir de relatos não foram anunciados como prontos. A fila permite triagem de questões; revisões culturais têm publicação com fontes e histórico. Métricas de voz mostram consumo, falhas e tempo de preparo, sem textos pessoais. Custos monetários dependem dos contratos e modelos efetivamente configurados.

## Registro de verificação desta entrega

- `npm test`: 140 testes passaram, incluindo migração, Google/Supabase simulados, isolamento entre contas, quatro combinações de voz, cache privado/público, recompensas, loja, rascunhos e versões.
- `npm run test:browser`: quatro cenários passaram — Chromium e WebKit, em computador e celular. Incluem primeira sessão, pedido de apoio, retomada, conclusão, rascunho/edição/publicação de aula, nova versão, passaporte, desafios, loja e administração. O acompanhamento azul foi exercitado com transcrições sintéticas, incluindo contração, palavra repetida, revisão e reinício.
- A revisão visual conferiu a tela Hoje no WebKit de celular. A sessão aparece primeiro; a missão completa fica em uma seção expansível.
- O ambiente precisou de bibliotecas locais para iniciar WebKit; o navegador executou as páginas de verdade. Não foi usado iPhone físico.
- `npm run vozes:preparar`: somente dimensionamento do lote, sem chamadas pagas.
- `git diff --check`: sem erros de whitespace.
