"""Passo 1: gera vozes candidatas do Tuiuiú (de criança) e guarda só as que o reconhecedor entendeu.
Ouça os mp3 da pasta candidatas/ e escolha uma. Depois rode:  python gravar.py candidatas/NOME.wav
Uso:  python escolher_voz.py            (testa todas as descrições)
      python escolher_voz.py "male, child, high pitch" 7 23    (uma descrição e as sementes que quiser)"""
import os, sys, torch
from comum import *

DESCRICOES = ["male, child, high pitch", "male, child", "male, child, low pitch", "male, teenager, high pitch"]
SEMENTES = [7, 23, 5, 99, 11, 42]
if len(sys.argv) > 2:
    DESCRICOES, SEMENTES = [sys.argv[1]], [int(s) for s in sys.argv[2:]]

m = carregar_modelo()
os.makedirs("candidatas", exist_ok=True)
for desc in DESCRICOES:
    for semente in SEMENTES:
        torch.manual_seed(semente)
        a = aparar(m.generate(text=REF_TEXTO, language="English", instruct=desc, num_step=32)[0])
        ouvido = ouvir(a)
        pct = acerto(REF_TEXTO, ouvido)
        nome = f"{desc.replace(', ', '-').replace(' ', '-')}-s{semente}"
        if pct >= 0.9 and 1.5 < len(a) / SR < 8:
            salvar_mp3(a, f"candidatas/{nome}.mp3"); sf.write(f"candidatas/{nome}.wav", a, SR)
            print(f"OK    {nome}  (o reconhecedor ouviu: {ouvido})", flush=True)
        else:
            print(f"falhou {nome}  (ouviu: '{ouvido}')", flush=True)
print("\nPronto. Ouça os arquivos da pasta candidatas/ e escolha a voz de uns 11 anos.")
