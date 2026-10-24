"""Serveur web de ClipNova : ouvre http://<ip-du-pc>:8000 depuis ton téléphone."""
import shutil

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

import clipnova

app = FastAPI(title="ClipNova")
app.mount("/files", StaticFiles(directory=clipnova.WORK), name="files")


@app.get("/")
def home():
    return FileResponse(clipnova.BASE / "static" / "index.html")


@app.post("/api/jobs")
def create_job(url: str = Form(""), file: UploadFile | None = File(None), lang: str = Form("fr"),
               min_d: float = Form(20), max_d: float = Form(60), count: int = Form(10),
               model: str = Form("small"), color: str = Form("00E5FF")):
    if not url.strip() and not file:
        raise HTTPException(400, "Donne un lien ou une vidéo.")
    job_id, folder = clipnova.new_job()
    upload = None
    if file and file.filename:
        upload = folder / ("source" + (clipnova.Path(file.filename).suffix or ".mp4"))
        with upload.open("wb") as f:
            shutil.copyfileobj(file.file, f)
    opts = {"lang": lang if lang != "auto" else None, "min": min_d, "max": max(max_d, min_d + 5),
            "count": max(1, min(count, 30)), "model": model, "color": color}
    clipnova.start_job(job_id, None if upload else url.strip(), upload, opts)
    return {"id": job_id}


@app.get("/api/jobs/{job_id}")
def job_status(job_id: str):
    if job_id not in clipnova.JOBS:
        raise HTTPException(404, "Tâche inconnue.")
    return clipnova.JOBS[job_id]
