"""Funções comuns: modelo de voz, reconhecimento de fala (para conferir cada áudio) e gravação do mp3."""
import hashlib, os, re, shutil, subprocess
import numpy as np, soundfile as sf, torch, torchaudio

REF_TEXTO = "Hi! I'm Tuiuiu, your parrot friend. Let's learn English together!"
SR = 24000


def dispositivo():
    return "cuda" if torch.cuda.is_available() else "cpu"


def carregar_modelo():
    from omnivoice import OmniVoice
    dev = dispositivo()
    print(f"Usando {dev.upper()}" + (" (bem mais rápido)" if dev == "cuda" else " (pode demorar horas; se tiver placa NVIDIA, instale o torch com CUDA)"))
    return OmniVoice.from_pretrained("k2-fsa/OmniVoice", device_map=dev, dtype=torch.float16 if dev == "cuda" else torch.float32)


_asr = None
def ouvir(audio):
    """Transcreve o áudio (numpy, 24 kHz) com o Whisper pequeno. Serve para pegar áudio que saiu zumbido ou mudo."""
    global _asr
    if _asr is None:
        from faster_whisper import WhisperModel
        _asr = WhisperModel("base.en", device="cpu", compute_type="int8")
    x = torchaudio.functional.resample(torch.tensor(audio, dtype=torch.float32), SR, 16000).numpy()
    seg, _ = _asr.transcribe(x, language="en", beam_size=1)
    return " ".join(s.text for s in seg).strip()


def palavras(t):
    t = t.lower().replace("&", " and ")
    return re.sub(r"[^a-z0-9' ]", " ", t).split()


def acerto(esperado, ouvido):
    """Fração das palavras esperadas que o reconhecedor ouviu (0 a 1)."""
    alvo, o = palavras(esperado), set(palavras(ouvido))
    return sum(p in o for p in alvo) / len(alvo) if alvo else 0.0


def aparar(a):
    idx = np.where(np.abs(a) > 0.01)[0]
    return a[max(0, idx[0] - 300):idx[-1] + 1200] if len(idx) else a


def salvar_mp3(audio, caminho_mp3):
    wav = caminho_mp3[:-4] + ".wav"
    sf.write(wav, audio, SR)
    if shutil.which("ffmpeg"):
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", wav, "-ac", "1", "-b:a", "48k", caminho_mp3], check=True)
        os.remove(wav)
    else:
        sf.write(caminho_mp3, audio, SR, format="MP3")
        os.remove(wav)


def nome_arquivo(frase):
    return hashlib.sha1(frase.encode()).hexdigest()[:12]
