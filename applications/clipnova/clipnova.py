"""ClipNova — transforme une vidéo longue en clips verticaux sous-titrés.

100 % gratuit et local : yt-dlp (téléchargement), faster-whisper (transcription),
OpenCV (détection du visage) et ffmpeg (découpe, recadrage 9:16, sous-titres).
"""
import json
import re
import subprocess
import threading
import uuid
from pathlib import Path

import cv2

BASE = Path(__file__).parent
WORK = BASE / "work"
WORK.mkdir(exist_ok=True)

JOBS: dict[str, dict] = {}

# Mots qui rendent une accroche plus forte (français + anglais).
HOOK_WORDS = {
    "secret", "erreur", "jamais", "toujours", "personne", "incroyable", "vrai", "vérité",
    "pourquoi", "comment", "attention", "problème", "argent", "gratuit", "meilleur", "pire",
    "astuce", "choc", "important", "imaginez", "voici", "regardez", "simple", "rapide",
    "never", "always", "secret", "mistake", "why", "how", "truth", "money", "best", "worst",
}


def run(cmd: list[str]) -> str:
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        raise RuntimeError(res.stderr[-1500:])
    return res.stdout


def download(url: str, dest: Path) -> Path:
    run(["yt-dlp", "-f", "bv*[height<=1080]+ba/b[height<=1080]/b", "--merge-output-format", "mp4",
         "-o", str(dest / "source.%(ext)s"), url])
    return next(dest.glob("source.*"))


def duration(path: Path) -> float:
    out = run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "json", str(path)])
    return float(json.loads(out)["format"]["duration"])


def transcribe(path: Path, lang: str | None, model_size: str) -> list[dict]:
    from faster_whisper import WhisperModel

    model = WhisperModel(model_size, device="cpu", compute_type="int8")
    segments, _ = model.transcribe(str(path), language=lang or None, word_timestamps=True, vad_filter=True)
    words = []
    for seg in segments:
        for w in seg.words or []:
            words.append({"start": w.start, "end": w.end, "text": w.word.strip()})
    return words


def sentences(words: list[dict]) -> list[dict]:
    """Regroupe les mots en phrases pour ne jamais couper au milieu d'une phrase."""
    out, cur = [], []
    for i, w in enumerate(words):
        cur.append(w)
        gap = words[i + 1]["start"] - w["end"] if i + 1 < len(words) else 9
        if re.search(r"[.!?…]$", w["text"]) or gap > 0.9:
            out.append({"start": cur[0]["start"], "end": cur[-1]["end"], "words": cur,
                        "text": " ".join(x["text"] for x in cur)})
            cur = []
    if cur:
        out.append({"start": cur[0]["start"], "end": cur[-1]["end"], "words": cur,
                    "text": " ".join(x["text"] for x in cur)})
    return out


def score(sents: list[dict]) -> tuple[int, str]:
    """Note sur 100 : accroche, densité de parole, questions, chiffres, émotion."""
    first = sents[0]["text"].lower()
    text = " ".join(s["text"] for s in sents).lower()
    dur = sents[-1]["end"] - sents[0]["start"]
    n_words = len(text.split())
    hook = sum(w.strip(",.!?") in HOOK_WORDS for w in first.split())
    pts = 40
    pts += min(hook * 8, 20)
    pts += 8 if "?" in first else 0
    pts += 6 if re.search(r"\d", text) else 0
    pts += min(text.count("!") * 3, 9)
    wps = n_words / max(dur, 1)
    pts += 12 if 2.2 <= wps <= 3.8 else 4
    pts += 5 if re.search(r"[.!?]$", sents[-1]["text"]) else 0
    reasons = []
    if hook:
        reasons.append("accroche forte")
    if "?" in first:
        reasons.append("question au début")
    if 2.2 <= wps <= 3.8:
        reasons.append("bon rythme")
    return min(pts, 99), ", ".join(reasons) or "passage complet"


def find_clips(sents: list[dict], min_d: float, max_d: float, count: int) -> list[dict]:
    cands = []
    for i in range(len(sents)):
        for j in range(i, len(sents)):
            d = sents[j]["end"] - sents[i]["start"]
            if d > max_d:
                break
            if d >= min_d:
                s, why = score(sents[i:j + 1])
                cands.append({"start": sents[i]["start"], "end": sents[j]["end"], "score": s,
                              "why": why, "sents": sents[i:j + 1]})
    cands.sort(key=lambda c: -c["score"])
    chosen = []
    for c in cands:  # pas de chevauchement = pas de répétition
        if all(c["end"] <= o["start"] or c["start"] >= o["end"] for o in chosen):
            chosen.append(c)
        if len(chosen) >= count:
            break
    return sorted(chosen, key=lambda c: c["start"])


_face = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")


def face_center(path: Path, start: float, end: float) -> tuple[float, int, int]:
    """Position horizontale moyenne (0..1) du plus grand visage dans le passage."""
    cap = cv2.VideoCapture(str(path))
    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    xs = []
    for k in range(8):
        cap.set(cv2.CAP_PROP_POS_MSEC, (start + (end - start) * (k + 0.5) / 8) * 1000)
        ok, frame = cap.read()
        if not ok:
            continue
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = _face.detectMultiScale(gray, 1.2, 5, minSize=(h // 12, h // 12))
        if len(faces):
            x, _, fw, _ = max(faces, key=lambda f: f[2] * f[3])
            xs.append((x + fw / 2) / w)
    cap.release()
    xs.sort()
    return (xs[len(xs) // 2] if xs else 0.5), w, h


def ass_time(t: float) -> str:
    return f"{int(t // 3600)}:{int(t % 3600 // 60):02d}:{t % 60:05.2f}"


def write_subs(clip: dict, path: Path, color: str) -> None:
    """Sous-titres façon « shorts » : 3 mots à la fois, mot actif en couleur."""
    words = [w for s in clip["sents"] for w in s["words"]]
    lines = []
    for g in range(0, len(words), 3):
        group = words[g:g + 3]
        for k, w in enumerate(group):
            st = w["start"] - clip["start"]
            en = (group[k + 1]["start"] if k + 1 < len(group) else w["end"]) - clip["start"]
            txt = " ".join(("{\\c&H%s&}%s{\\c&HFFFFFF&}" % (color, x["text"].upper())) if x is w
                           else x["text"].upper() for x in group)
            lines.append(f"Dialogue: 0,{ass_time(max(st, 0))},{ass_time(en)},Main,,0,0,0,,{txt}")
    path.write_text(
        "[Script Info]\nScriptType: v4.00+\nPlayResX: 1080\nPlayResY: 1920\n\n"
        "[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, OutlineColour, BackColour, Bold, "
        "BorderStyle, Outline, Shadow, Alignment, MarginV\n"
        "Style: Main,DejaVu Sans,84,&H00FFFFFF,&H00000000,&H80000000,1,1,6,2,2,520\n\n"
        "[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n"
        + "\n".join(lines) + "\n", encoding="utf-8")


def render(src: Path, clip: dict, out: Path, color: str) -> None:
    cx, w, h = face_center(src, clip["start"], clip["end"])
    cw = min(w, int(h * 9 / 16)) // 2 * 2
    x = int(min(max(cx * w - cw / 2, 0), w - cw))
    subs = out.with_suffix(".ass")
    write_subs(clip, subs, color)
    vf = f"crop={cw}:{h}:{x}:0,scale=1080:1920,ass={subs.name}"
    subprocess.run(["ffmpeg", "-y", "-ss", f"{clip['start']:.2f}", "-to", f"{clip['end'] + 0.25:.2f}",
                    "-i", str(src.resolve()), "-vf", vf, "-c:v", "libx264", "-preset", "veryfast", "-crf", "21",
                    "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", out.name],
                   cwd=out.parent, capture_output=True, check=True)
    subs.unlink(missing_ok=True)


def process(job_id: str, url: str | None, upload: Path | None, opts: dict) -> None:
    job = JOBS[job_id]
    folder = WORK / job_id
    try:
        job["step"] = "Téléchargement de la vidéo…"
        src = download(url, folder) if url else upload
        job["step"] = "Transcription (peut prendre plusieurs minutes)…"
        words = transcribe(src, opts["lang"], opts["model"])
        if not words:
            raise RuntimeError("Aucune parole détectée dans la vidéo.")
        sents = sentences(words)
        job["step"] = "Recherche des meilleurs moments…"
        clips = find_clips(sents, opts["min"], opts["max"], opts["count"])
        if not clips:
            clips = find_clips(sents, 5, opts["max"], opts["count"])
        for n, c in enumerate(clips, 1):
            job["step"] = f"Création du clip {n}/{len(clips)}…"
            name = f"clip{n:02d}_{int(c['start'])}s.mp4"
            render(src, c, folder / name, opts["color"])
            job["clips"].append({"file": f"/files/{job_id}/{name}", "score": c["score"], "why": c["why"],
                                 "start": round(c["start"], 1), "end": round(c["end"], 1),
                                 "text": " ".join(s["text"] for s in c["sents"])})
        job["status"] = "done"
        job["step"] = f"Terminé : {len(clips)} clips."
    except Exception as e:  # noqa: BLE001 — l'erreur est affichée à l'utilisateur
        job["status"] = "error"
        job["step"] = str(e)


def new_job() -> tuple[str, Path]:
    job_id = uuid.uuid4().hex[:10]
    folder = WORK / job_id
    folder.mkdir()
    JOBS[job_id] = {"status": "running", "step": "En attente…", "clips": []}
    return job_id, folder


def start_job(job_id: str, url: str | None, upload: Path | None, opts: dict) -> None:
    threading.Thread(target=process, args=(job_id, url, upload, opts), daemon=True).start()
