"""Fabrique ClipNova_Colab.ipynb : lance ClipNova sur Google Colab (gratuit) et donne un lien
à ouvrir sur iPad ou téléphone. À relancer après chaque modification du code :
    python make_notebook.py
"""
import base64
import json
from pathlib import Path

BASE = Path(__file__).parent
FILES = ["clipnova.py", "server.py", "requirements.txt",
         "static/index.html", "static/clips.html", "static/style.css"]

bundle = {f: base64.b64encode((BASE / f).read_bytes()).decode() for f in FILES}


def md(text):
    return {"cell_type": "markdown", "metadata": {}, "source": text.strip().splitlines(keepends=True)}


def code(text):
    return {"cell_type": "code", "metadata": {}, "execution_count": None, "outputs": [],
            "source": text.strip().splitlines(keepends=True)}


cells = [
    md("""
# ClipNova sur Google Colab

Ce carnet lance l'application ClipNova complète (sous-titres automatiques, meilleurs moments, export MP4)
sur un ordinateur gratuit de Google. Tu l'utilises ensuite depuis ton iPad ou ton téléphone.

**Mode d'emploi :** touche **Exécution → Tout exécuter** (ou ▶ sur chaque cellule, dans l'ordre).
Attends 2 à 3 minutes. À la fin, un lien `https://….trycloudflare.com` s'affiche : ouvre-le.

**Garde cet onglet Colab ouvert** pendant que tu utilises ClipNova. Si tu le fermes, l'application s'arrête.
"""),
    code("""
# 1) Installation (2 minutes environ)
!pip -q install fastapi uvicorn python-multipart yt-dlp faster-whisper "opencv-python-headless>=4.9,<5"
!which ffmpeg || (apt-get -qq update && apt-get -qq install -y ffmpeg)
!wget -q -O /usr/local/bin/cloudflared https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 && chmod +x /usr/local/bin/cloudflared
print("✅ Installation terminée")
"""),
    code("# 2) Fichiers de l'application\nimport base64, pathlib\nFILES = " + json.dumps(bundle) + """
app = pathlib.Path("/content/clipnova")
for name, data in FILES.items():
    f = app / name
    f.parent.mkdir(parents=True, exist_ok=True)
    f.write_bytes(base64.b64decode(data))
print("✅ ClipNova copié dans", app)
"""),
    code("""
# 3) Démarrage + lien à ouvrir sur ton iPad
import re, subprocess, time
subprocess.run("pkill -f 'uvicorn server:app'; pkill -f cloudflared", shell=True)
server = subprocess.Popen(["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"],
                          cwd="/content/clipnova", stdout=open("/content/server.log", "w"), stderr=subprocess.STDOUT)
tunnel = subprocess.Popen(["cloudflared", "tunnel", "--no-autoupdate", "--url", "http://localhost:8000"],
                          stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
url = None
for _ in range(120):
    line = tunnel.stdout.readline()
    m = re.search(r"https://[a-z0-9-]+\\.trycloudflare\\.com", line)
    if m:
        url = m.group(0)
        break
import urllib.request
for _ in range(60):  # attend que l'application réponde avant de donner le lien
    try:
        urllib.request.urlopen("http://localhost:8000/", timeout=2)
        break
    except Exception:
        time.sleep(1)
if url:
    from IPython.display import HTML, display
    display(HTML(f'<h2>👉 <a href="{url}" target="_blank">{url}</a></h2>'
                 '<p>Ouvre ce lien sur ton iPad. Garde cet onglet Colab ouvert.</p>'))
else:
    print("❌ Le lien n'a pas pu être créé. Relance cette cellule.")
"""),
    md("""
## Bon à savoir
- **Première vidéo plus lente** : le modèle de sous-titres se télécharge une fois (≈ 500 Mo pour « Normale »).
- **Vidéos de plus de 100 Mo** : le lien ne les accepte pas. Raccourcis la vidéo avant, ou choisis une qualité plus basse.
- **Liens YouTube** : YouTube bloque souvent les serveurs de Google. Si le lien ne marche pas, importe le fichier.
- **Darija / arabe** : choisis la langue « Arabe / Darija » et la précision « Haute ».
- En cas de problème, regarde le journal : exécute `!tail -n 30 /content/server.log`.
"""),
]

nb = {"nbformat": 4, "nbformat_minor": 5, "cells": cells,
      "metadata": {"colab": {"name": "ClipNova_Colab.ipynb"}, "kernelspec": {"name": "python3", "display_name": "Python 3"}}}
(BASE / "ClipNova_Colab.ipynb").write_text(json.dumps(nb, ensure_ascii=False, indent=1), encoding="utf-8")
print("ClipNova_Colab.ipynb créé")
