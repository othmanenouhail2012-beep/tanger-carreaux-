"""Serveur web de ClipNova : ouvre http://<ip-du-pc>:8000 depuis ton téléphone."""
import json
import io
import shutil
import zipfile

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles

import clipnova

app = FastAPI(title="ClipNova")
app.mount("/files", StaticFiles(directory=clipnova.WORK), name="files")
app.mount("/static", StaticFiles(directory=clipnova.BASE / "static"), name="static")


@app.get("/")
def home():
    return FileResponse(clipnova.BASE / "static" / "index.html")


@app.get("/clips")
def clips_page():
    return FileResponse(clipnova.BASE / "static" / "clips.html")


@app.post("/api/jobs")
def create_job(url: str = Form(""), file: UploadFile | None = File(None), lang: str = Form("fr"),
               min_d: float = Form(20), max_d: float = Form(60), count: int = Form(10),
               model: str = Form("small"), color: str = Form("FFE500"), subs: bool = Form(True),
               ai: bool = Form(True), keywords: str = Form(""), t_from: float = Form(0), t_to: float = Form(0),
               rights: bool = Form(False)):
    if not url.strip() and not (file and file.filename):
        raise HTTPException(400, "Donne un lien ou une vidéo.")
    if not rights:
        raise HTTPException(400, "Coche « Je possède les droits de cette vidéo » pour continuer.")
    if min_d >= max_d:
        raise HTTPException(400, "La durée min doit être plus petite que la durée max.")
    job_id, folder = clipnova.new_job()
    upload = None
    if file and file.filename:
        upload = folder / ("source" + (clipnova.Path(file.filename).suffix or ".mp4"))
        with upload.open("wb") as f:
            shutil.copyfileobj(file.file, f)
    opts = {"lang": lang if lang != "auto" else None, "min": min_d, "max": max_d,
            "count": max(1, min(count, 30)), "model": model, "color": color, "subs": subs,
            "ai": ai, "keywords": keywords, "t_from": t_from, "t_to": t_to}
    clipnova.JOBS[job_id]["name"] = (file.filename if upload else url.strip())[:120]
    clipnova.start_job(job_id, None if upload else url.strip(), upload, opts)
    return {"id": job_id}


@app.get("/api/info")
def video_info(url: str):
    """Titre, durée et miniature d'un lien, pour la page de réglages."""
    try:
        out = clipnova.run(["yt-dlp", "--skip-download", "--no-warnings", "--print",
                            "%(title)s\n%(duration)s\n%(thumbnail)s", url]).splitlines()
    except RuntimeError as e:
        raise HTTPException(400, "Lien illisible : vidéo privée, supprimée ou site non pris en charge.") from e
    dur = float(out[1]) if len(out) > 1 and out[1] not in ("", "NA") else 0
    return {"title": out[0] if out else "", "duration": dur, "thumbnail": out[2] if len(out) > 2 else ""}


@app.get("/api/projects")
def projects():
    return sorted(({"id": j, **{k: v for k, v in clipnova.snapshot(j).items() if k != "clips"},
                    "count": len(clipnova.JOBS[j]["raw"]),
                    "thumb": clipnova.snapshot(j)["clips"][0]["file"] if clipnova.JOBS[j]["raw"] else ""}
                   for j in clipnova.JOBS), key=lambda x: -x["created"])


def get_job(job_id: str) -> dict:
    if job_id not in clipnova.JOBS:
        raise HTTPException(404, "Tâche inconnue (le serveur a peut-être redémarré).")
    return clipnova.JOBS[job_id]


@app.get("/api/jobs/{job_id}")
def job_status(job_id: str):
    get_job(job_id)
    return clipnova.snapshot(job_id)


@app.post("/api/jobs/{job_id}/clips/{n}")
def edit_clip(job_id: str, n: int, style: str = Form("{}"), music: UploadFile | None = File(None)):
    job = get_job(job_id)
    if not 1 <= n <= len(job["raw"]):
        raise HTTPException(404, "Clip inconnu.")
    if job["raw"][n - 1].get("busy"):
        raise HTTPException(409, "Ce clip est déjà en cours de montage.")
    allowed = clipnova.DEFAULT_STYLE.keys() | {"music_on"}
    data = {k: v for k, v in json.loads(style).items() if k in allowed}
    track = None
    if music and music.filename:
        track = clipnova.WORK / job_id / ("music" + (clipnova.Path(music.filename).suffix or ".mp3"))
        with track.open("wb") as f:
            shutil.copyfileobj(music.file, f)
    clipnova.edit_clip(job_id, n, data, track)
    return {"ok": True}


@app.get("/api/jobs/{job_id}/zip")
def download_all(job_id: str):
    """Tous les clips dans un seul fichier ZIP."""
    job = get_job(job_id)
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_STORED) as z:
        for c in job["raw"]:
            z.write(clipnova.WORK / job_id / c["name"], c["name"])
    buf.seek(0)
    return StreamingResponse(buf, media_type="application/zip",
                             headers={"Content-Disposition": f'attachment; filename="clipnova-{job_id}.zip"'})
