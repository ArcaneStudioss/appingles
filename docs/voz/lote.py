import sys, json, hashlib, os, subprocess, torch, numpy as np, soundfile as sf
from omnivoice import OmniVoice
parte, de, fil = int(sys.argv[1]), int(sys.argv[2]), int(sys.argv[3])   # parte, total de partes, threads
torch.set_num_threads(fil); torch.manual_seed(7)
m = OmniVoice.from_pretrained("k2-fsa/OmniVoice", device_map="cpu", dtype=torch.float32)
REF_TXT = "Hi! I'm Tuiuiu, your parrot friend. Let's learn English together!"
prompt = m.create_voice_clone_prompt(ref_audio="crianca2_a.wav", ref_text=REF_TXT)
frases = json.load(open("../frases.json"))
os.makedirs("saida", exist_ok=True)
for i, t in enumerate(frases):
    if i % de != parte: continue
    h = hashlib.sha1(t.encode()).hexdigest()[:12]; mp3 = f"saida/{h}.mp3"
    if os.path.exists(mp3): continue
    a = m.generate(text=t, voice_clone_prompt=prompt, num_step=32)[0]
    idx = np.where(np.abs(a) > 0.01)[0]
    if len(idx): a = a[max(0, idx[0] - 300):idx[-1] + 1200]
    sf.write(f"saida/{h}.wav", a, 24000)
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", f"saida/{h}.wav", "-ac", "1", "-b:a", "48k", mp3]); os.remove(f"saida/{h}.wav")
    print(i, h, round(len(a) / 24000, 2), t, flush=True)
