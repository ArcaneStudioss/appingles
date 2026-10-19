"""Grava as frases de frases.json com a voz do Tuiuiú pela API local do VoiceStudio (http://127.0.0.1:3900).
Uso:  python voicestudio_lote.py PERFIL_ID [saida]
Retoma de onde parou. Saída: <saida>/<sha1>.mp3 + <saida>/mapa.json; depois rode docs/voz/pc/aplicar.py (ele lê pc/saida)."""
import hashlib, json, os, shutil, subprocess, sys, time, wave

API = "http://127.0.0.1:3900"
perfil = sys.argv[1]
saida = sys.argv[2] if len(sys.argv) > 2 else os.path.join("pc", "saida")
os.makedirs(saida, exist_ok=True)
frases = json.load(open(os.path.join("pc", "frases.json"), encoding="utf-8"))
mapa_arq = os.path.join(saida, "mapa.json")
mapa = json.load(open(mapa_arq, encoding="utf-8")) if os.path.exists(mapa_arq) else {}
ffmpeg = shutil.which("ffmpeg")
if not ffmpeg:
    import imageio_ffmpeg  # pip install imageio-ffmpeg
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()


def duracao(caminho):
    """Duração em segundos do WAV que o VoiceStudio devolveu (None se não for um WAV válido, ex.: mensagem de erro)."""
    try:
        with wave.open(caminho) as w:
            return w.getnframes() / w.getframerate()
    except Exception:
        return None


def gerar(frase, semente):
    bruto = os.path.join(saida, "_tmp.bin")
    subprocess.run(["curl", "-s", "-m", "300", "-X", "POST", f"{API}/generate", "-F", f"text={frase}", "-F", f"profile_id={perfil}",
                    "-F", "language=English", "-F", f"seed={semente}", "-F", "effect_preset=raw", "-o", bruto], check=True)
    return bruto


falhas = []
for i, frase in enumerate(frases, 1):
    nome = hashlib.sha1(frase.encode()).hexdigest()[:12]
    destino = os.path.join(saida, nome + ".mp3")
    if frase in mapa and os.path.exists(destino):
        continue
    if not frase.strip():
        continue
    ok = False
    for t in range(4):
        bruto = gerar(frase, 7 + t * 13)
        d = duracao(bruto)
        if d is None or d < min(0.25 + 0.045 * len(frase), 1.2) or d > 2 + 0.2 * len(frase):
            continue  # erro da API, áudio mudo ou longo demais: tenta outra semente
        r = subprocess.run([ffmpeg, "-loglevel", "error", "-y", "-i", bruto, "-ac", "1", "-b:a", "48k", destino])
        if r.returncode == 0:
            ok = True
            break
    if ok:
        mapa[frase] = nome + ".mp3"
        json.dump(mapa, open(mapa_arq, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    else:
        falhas.append(frase)
    print(f"[{i}/{len(frases)}] {'ok ' if ok else 'FALHOU'} {frase}", flush=True)
if os.path.exists(os.path.join(saida, "_tmp.bin")):
    os.remove(os.path.join(saida, "_tmp.bin"))
if falhas:
    open(os.path.join(saida, "revisar.txt"), "w", encoding="utf-8").write("\n".join(falhas))
print(f"\nTerminou: {len(mapa)} ok, {len(falhas)} para revisar.")
