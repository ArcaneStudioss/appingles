# Voz do Tuiuiú

Gerada com OmniVoice (k2-fsa/OmniVoice), na CPU, pedido de voz `male, child, high pitch`, semente 7.

- Inglês: referência `tuiuiu-en-ref.mp3` (texto: "Hi! I'm Tuiuiu, your parrot friend. Let's learn English together!"). Aprovada pelo Gabriel (amostra "2 a").
- Português: voz própria, `tuiuiu-pt-ref.mp3` (texto: "Oi! Eu sou o Tuiuiú, a arara-azul do Inglou. Hoje a gente vai aprender a se apresentar em inglês. Vamos juntos?"). Aprovada pelo Gabriel ("a nova").
- `lote.py` grava uma lista de frases em mp3 (uma vez por frase, nome = sha1 do texto) para `public/assets/audio/tuiuiu/`; o app toca o mp3 se a frase estiver em `mapa.json` e, senão, usa a voz do aparelho.
- Receita: `pip install torch==2.8.0 torchaudio==2.8.0 --index-url https://download.pytorch.org/whl/cpu && pip install omnivoice`. Uns 40 s por frase curta com 2 núcleos.
- Para regravar com a mesma voz, converter a referência para wav e usar `create_voice_clone_prompt(ref_audio=..., ref_text=...)`.

## Voz atual (19/10/2026)
Tuiuiú = menino de uns 10 anos, gerado no VoiceStudio (voice design `male, child, moderate pitch`, semente 7) e clonado para as 474 frases com `voicestudio_lote.py` (API local em 127.0.0.1:3900). A Mia (menina de 14, `female, teenager, high pitch`, semente 23) está criada no VoiceStudio, mas o app ainda não usa a voz dela.
