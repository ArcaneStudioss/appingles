"""Passo 3: coloca as gravações novas no app (substitui as vozes antigas).
Rode de dentro da pasta docs/voz/pc:  python aplicar.py
Depois:  git add -A && git commit -m "Nova voz do Tuiuiú" && git push"""
import json, os, shutil

DEST = os.path.join("..", "..", "..", "public", "assets", "audio", "tuiuiu")
novo = json.load(open("saida/mapa.json", encoding="utf-8"))
validos = set(novo.values())
for f in os.listdir(DEST):
    if f.endswith(".mp3") and f not in validos:
        os.remove(os.path.join(DEST, f))
for f in validos:
    shutil.copy(os.path.join("saida", f), os.path.join(DEST, f))
json.dump(novo, open(os.path.join(DEST, "mapa.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print(f"{len(validos)} áudios no app. Agora: git add -A, git commit e git push.")
