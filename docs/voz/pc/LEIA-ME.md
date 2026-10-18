# Gravar a voz do Tuiuiú no seu PC

O modelo de voz roda melhor no seu computador (principalmente se tiver placa de vídeo NVIDIA). O pacote **confere cada áudio com reconhecimento de fala**: se uma frase sair zumbido, muda ou errada, ele grava de novo sozinho. Na nuvem isso foi o que deu problema (vozes que saíam só com ruído).

## Antes de tudo (uma vez)

1. **Python 3.10, 3.11 ou 3.12** (python.org). Marque "Add Python to PATH".
2. **ffmpeg** (opcional, mas recomendado): no Windows, `winget install ffmpeg`.
3. Abra o terminal na pasta `docs/voz/pc` e rode:

```
python -m venv venv
venv\Scripts\activate          (Mac/Linux: source venv/bin/activate)
pip install -r requirements.txt
```

Se tiver **placa NVIDIA**, instale o torch com CUDA antes do `requirements.txt` (muda de horas para minutos):
`pip install torch torchaudio --index-url https://download.pytorch.org/whl/cu124`

A primeira execução baixa os modelos (alguns GB). É normal.

## Passo 1: escolher a voz de uns 11 anos

```
python escolher_voz.py
```

Ele testa várias descrições de voz de criança/pré-adolescente e **guarda só as que saíram falando certo**, na pasta `candidatas/` (um `.mp3` para ouvir e um `.wav` que o próximo passo usa). Escolha a que mais parece um menino de 11 anos. Quer mais opções de uma descrição específica? `python escolher_voz.py "male, child, high pitch" 7 23 99`.

## Passo 2: gravar as 474 frases

```
python gravar.py candidatas/NOME-ESCOLHIDO.wav
```

- Dá para parar (Ctrl+C) e rodar de novo: ele **continua de onde parou**.
- Frases que não passaram na conferência ficam listadas em `saida/revisar.txt`. Ouça essas (poucas, em geral) e, se alguma estiver ruim, apague o `.mp3` dela na pasta `saida/` e rode o passo 2 de novo.

## Passo 3: colocar no app

```
python aplicar.py
git add -A
git commit -m "Nova voz do Tuiuiú (11 anos)"
git push
```

`aplicar.py` troca as vozes antigas pelas novas (as duas não podem ficar misturadas). Depois do push, é só reiniciar o app na VPS (um projeto de cada vez, como sempre).

## Se algo der errado

- `pip install` reclama de versão: use Python 3.11.
- "CUDA out of memory": feche outros programas ou rode sem CUDA (vai mais devagar).
- Qualquer erro: copie a última linha vermelha e mande para mim.
