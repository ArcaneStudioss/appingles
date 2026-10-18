"""Passo 2: grava todas as frases do app com a voz escolhida.
Uso:  python gravar.py candidatas/NOME.wav
Retoma de onde parou (pula o que já gravou). Cada áudio é conferido pelo reconhecedor; se sair defeituoso, tenta de novo com outra semente.
Saída: saida/*.mp3, saida/mapa.json e saida/revisar.txt (frases que não passaram na conferência, para você ouvir)."""
import json, os, sys, torch
from comum import *

if len(sys.argv) < 2:
    sys.exit("Diga qual voz usar: python gravar.py candidatas/NOME.wav")
REF = sys.argv[1]
TENTATIVAS, LIMITE = 6, 0.8
frases = json.load(open("frases.json", encoding="utf-8"))
os.makedirs("saida", exist_ok=True)
mapa_arq = "saida/mapa.json"
mapa = json.load(open(mapa_arq, encoding="utf-8")) if os.path.exists(mapa_arq) else {}

m = carregar_modelo()
prompt = m.create_voice_clone_prompt(ref_audio=REF, ref_text=REF_TEXTO)
for i, frase in enumerate(frases, 1):
    nome = nome_arquivo(frase)
    if frase in mapa and os.path.exists(f"saida/{nome}.mp3"):
        continue
    melhor, melhor_pct = None, -1
    for t in range(TENTATIVAS):
        torch.manual_seed(7 + t * 13)
        a = aparar(m.generate(text=frase, language="English", voice_clone_prompt=prompt, num_step=32)[0])
        pct = acerto(frase, ouvir(a)) if len(a) / SR > 0.3 else 0
        if pct > melhor_pct: melhor, melhor_pct = a, pct
        if pct >= LIMITE: break
    salvar_mp3(melhor, f"saida/{nome}.mp3")
    mapa[frase] = f"{nome}.mp3"
    json.dump(mapa, open(mapa_arq, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    if melhor_pct < LIMITE:
        open("saida/revisar.txt", "a", encoding="utf-8").write(f"{melhor_pct:.0%}\t{nome}.mp3\t{frase}\n")
    print(f"[{i}/{len(frases)}] {'ok ' if melhor_pct >= LIMITE else 'REVISAR'} {frase}", flush=True)
print("\nTerminou. Copie o conteúdo da pasta saida/ para public/assets/audio/tuiuiu/ (veja o LEIA-ME).")
