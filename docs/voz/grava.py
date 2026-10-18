import sys, json, hashlib, os, subprocess, torch, numpy as np, soundfile as sf
from omnivoice import OmniVoice
lang, lista, parte, de, fil = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), int(sys.argv[5])
SAIDA = "/home/user/appingles/public/assets/audio/tuiuiu"
REF = {"en": ("ref-en.wav", "Hi! I'm Tuiuiu, your parrot friend. Let's learn English together!"),
       "pt": ("ref-pt.wav", "Oi! Eu sou o Tuiuiú, a arara-azul do Inglou. Hoje a gente vai aprender a se apresentar em inglês. Vamos juntos?")}
torch.set_num_threads(fil); torch.manual_seed(7)
m = OmniVoice.from_pretrained("k2-fsa/OmniVoice", device_map="cpu", dtype=torch.float32)
prompt = m.create_voice_clone_prompt(ref_audio=REF[lang][0], ref_text=REF[lang][1])
frases = json.load(open(lista))
os.makedirs("tmp", exist_ok=True); os.makedirs("novos", exist_ok=True)
for i, t in enumerate(frases):
    if i % de != parte: continue
    h = hashlib.sha1((("pt:" if lang == "pt" else "") + t).encode()).hexdigest()[:12]
    if os.path.exists(f"{SAIDA}/{h}.mp3") or os.path.exists(f"novos/{h}.mp3"): continue
    a = m.generate(text=t, voice_clone_prompt=prompt, num_step=32)[0]
    idx = np.where(np.abs(a) > 0.01)[0]
    if len(idx): a = a[max(0, idx[0] - 300):idx[-1] + 1200]
    sf.write(f"tmp/{h}.wav", a, 24000)
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", f"tmp/{h}.wav", "-ac", "1", "-b:a", "48k", f"novos/{h}.mp3"]); os.remove(f"tmp/{h}.wav")
    json.dump({"texto": t, "arq": h + ".mp3", "lang": lang}, open(f"novos/{h}.json", "w"))
    print(lang, i, h, round(len(a) / 24000, 2), t[:60], flush=True)
