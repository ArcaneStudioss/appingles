# Vozes oficiais

Toda fala em português ou inglês usa exclusivamente estas vozes ElevenLabs:

| Personagem | Português | Inglês |
| --- | --- | --- |
| Mia | MeTEa1BhTRHHItBKl2mJ | WshF5zVOQJVpRBKVUjvc |
| Tuiuiú | 5sXm87IvJC4SNxe0UIfp | 1TtJKrO3NEEEDoWRDALC |

Mia é uma adolescente negra brasileira de 16 anos, com voz animada. Tuiuiú é uma arara com voz fina, infantil e animada. Por padrão, Mia fala inglês e Tuiuiú explica em português; nas preferências, o aluno pode escolher um dos dois para cada idioma. A rádio mantém os personagens do roteiro.

Configure ELEVENLABS_API_KEY no ambiente do servidor ou no arquivo .env privado, conforme .env.example. A chave secreta começa com sk_; o identificador da chave não autentica requisições. Nunca coloque a chave no JavaScript público ou no Git. Docker Compose lê .env; a imagem não o incorpora.

O servidor escolhe o identificador da voz e valida o idioma. Frases, parágrafos e falas com direção emocional usam Eleven v4 por padrão (`ELEVENLABS_MODEL_TEXTO`); palavras isoladas usam Flash v2.5 (`ELEVENLABS_MODEL`). A escolha do modelo não troca os quatro IDs. A qualidade depende também da voz original; não há garantia de que toda geração terá exatamente a emoção desejada. O modelo expressivo pode consumir mais créditos que Flash.

No Safari do iPhone, sessões `transient` e `ambient` podem ficar sem som quando o aparelho está no silencioso, mesmo com MP3 válido e sem erro na página. Durante a fala, o player usa `navigator.audioSession.type = 'playback'`, quando a API está disponível. Ao concluir, cancelar ou falhar, suspende o contexto e restaura o tipo anterior. A restauração de uma fala antiga não altera a sessão de outra que acabou de começar. A reprodução continua por Web Audio, sem elemento HTML de áudio, metadados de música ou aviso de personagem falando. Referência: [AudioSession.type](https://developer.mozilla.org/en-US/docs/Web/API/AudioSession/type).

Eleven v4 interpreta o sentido e a pontuação quando `emocao` é `contexto` (padrão). Não adicionamos alegria automaticamente às leituras. Para direção explícita, a API aceita `feliz`, `triste`, `animado`, `calmo`, `acolhedor` e `curioso`, convertidos no servidor em audio tags permitidas. O texto exibido ao aluno permanece igual. Os balões do Tuiuiú usam o humor do personagem: festa animada, conquista feliz, dúvida curiosa e correção acolhedora. Uma resposta errada não recebe voz triste de reprovação.

No v4 usamos apenas estabilidade 0,5 e similaridade 0,75; ele não aceita os controles `style` e `speed` dos modelos anteriores. A velocidade solicitada vira direção de leitura lenta ou rápida, de forma aproximada; não é uma garantia matemática de duração. Com modelos anteriores, velocidade é gerada no provedor, limitada à faixa suportada, preservando o timbre. Tags emocionais não são enviadas a modelos antigos, que poderiam lê-las como palavras.

O cliente junta parágrafos da mesma fala, preserva o texto e divide leituras longas preferindo fim de frase. Envia até 500 caracteres anteriores/seguintes para orientar a continuidade da entonação. Esses textos de contexto também são enviados à ElevenLabs. Prepara somente um trecho adiante enquanto o atual toca, para reduzir pausas de rede. Há cancelamento na preparação e durante a fala.

A reprodução usa Web Audio, sem elemento HTML de mídia ou metadados de música. Em navegadores compatíveis, a sessão é declarada como áudio transitório. Navegar, fechar a janela de origem, ocultar o app ou sair da página interrompe as falas; voltar não retoma automaticamente. O indicador de volume/áudio do sistema depende do celular e não pode ser eliminado pelo site. Não há alternativa com voz do aparelho.

Os MP3 ficam separados por usuário em DATA_DIR/vozes, com permissões restritas, cache de 30 dias e limites diários de caracteres configuráveis. O cache inclui voz, idioma, modelo, contexto, emoção, velocidade e ajustes; gravações antigas não são reutilizadas com as novas configurações. Repetições usam cache; falhas devolvem a reserva. Exportar dados inclui consumo e apagar dados limpa o cache. A chave precisa estar configurada também em produção.

Referências oficiais: [síntese e continuidade](https://elevenlabs.io/docs/overview/capabilities/text-to-speech), [direção emocional](https://elevenlabs.io/docs/help-center/product/core-capabilities/text-to-speech/how-do-audio-tags-work-with-eleven-v3-and-v4), [configurações de voz](https://elevenlabs.io/docs/eleven-creative/playground/text-to-speech), [parâmetros da API](https://elevenlabs.io/docs/api-reference/text-to-speech/convert).
