# Vozes oficiais

Toda fala em português ou inglês usa exclusivamente estas vozes ElevenLabs:

| Personagem | Português | Inglês |
| --- | --- | --- |
| Mia | MeTEa1BhTRHHItBKl2mJ | WshF5zVOQJVpRBKVUjvc |
| Tuiuiú | 5sXm87IvJC4SNxe0UIfp | 1TtJKrO3NEEEDoWRDALC |

Mia é uma adolescente negra brasileira de 16 anos, com voz animada. Tuiuiú é uma arara com voz fina, infantil e animada. Por padrão, Mia fala inglês e Tuiuiú explica em português; nas preferências, o aluno pode escolher um dos dois para cada idioma. A rádio mantém os personagens do roteiro.

Configure ELEVENLABS_API_KEY no ambiente do servidor ou no arquivo .env privado, conforme .env.example. A chave secreta começa com sk_; o identificador da chave não autentica requisições. Nunca coloque a chave no JavaScript público ou no Git. Docker Compose lê .env; a imagem não o incorpora.

O servidor escolhe o identificador da voz, valida o idioma e gera MP3 sob demanda com eleven_flash_v2_5. Os arquivos ficam separados por usuário em DATA_DIR/vozes, com permissões restritas, cache de 30 dias e limites diários de caracteres configuráveis. Pedidos repetidos usam cache; falhas devolvem a reserva de consumo. A exportação inclui consumo; apagar dados também limpa o cache de voz.

O cliente divide textos longos sem descartar palavras, reproduz os trechos em sequência e permite cancelar a preparação ou parar a fala. Navegar interrompe o áudio. Se houver falha, apresenta mensagem e permite tentar novamente. Não usa síntese do navegador nem gravações antigas como alternativa. A chave deve estar configurada também no ambiente de produção.
