#!/usr/bin/env python3
"""Albums photos du site : optimise les images d'un événement et régénère photos.html.

Ajouter un album :   python tools/build_photos.py add meta.json
Régénérer la page :  python tools/build_photos.py build

meta.json : {"id": "halloween-2026", "year": "2026-2027", "title": "...", "date": "2026-10-09",
             "date_label": "Vendredi 9 octobre 2026", "source": "C:/dossier/photos",
             "cover": "fichier.jpg", "photos": [{"src": "fichier.jpg", "alt": "description"}]}
Les images sont redimensionnées, les métadonnées (EXIF, position GPS) supprimées.
"""
import html
import json
import sys
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
ALBUMS = ROOT / "photos" / "albums.json"
FULL_MAX, THUMB = 1600, 480


def load():
    return json.loads(ALBUMS.read_text(encoding="utf-8")) if ALBUMS.exists() else {"albums": []}


def add(meta_path):
    meta = json.loads(Path(meta_path).read_text(encoding="utf-8"))
    out = ROOT / "photos" / meta["year"] / meta["id"]
    (out / "thumbs").mkdir(parents=True, exist_ok=True)
    photos = []
    for n, p in enumerate(meta["photos"], 1):
        im = ImageOps.exif_transpose(Image.open(Path(meta["source"]) / p["src"])).convert("RGB")
        name = f"{meta['id']}-{n:02d}.jpg"
        full = im.copy()
        full.thumbnail((FULL_MAX, FULL_MAX))
        full.save(out / name, "JPEG", quality=82, optimize=True, progressive=True)
        ImageOps.fit(im, (THUMB, THUMB), Image.LANCZOS, centering=(0.5, 0.45)).save(
            out / "thumbs" / name, "JPEG", quality=78, optimize=True)
        photos.append({"file": name, "alt": p["alt"], "src": p["src"]})
    cover = next(x["file"] for x in photos if x["src"] == meta["cover"])
    album = {k: meta[k] for k in ("id", "year", "title", "date", "date_label")}
    album.update(cover=cover, photos=[{"file": x["file"], "alt": x["alt"]} for x in photos])
    data = load()
    data["albums"] = [a for a in data["albums"] if a["id"] != album["id"]] + [album]
    ALBUMS.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{len(photos)} photos traitées dans {out.relative_to(ROOT)}")


def e(text):
    return html.escape(text, quote=True)


def path(a, *parts):
    return "/".join(("photos", a["year"], a["id"]) + parts)


def build():
    albums = sorted(load()["albums"], key=lambda a: a["date"], reverse=True)
    years = sorted({a["year"] for a in albums}, reverse=True)
    index, sections = [], []
    for y in years:
        cards = []
        for a in (x for x in albums if x["year"] == y):
            n = len(a["photos"])
            cards.append(
                f'          <a class="album-card" href="#{a["id"]}">\n'
                f'            <img src="{path(a, "thumbs", a["cover"])}" alt="" width="{THUMB}" height="{THUMB}" loading="lazy">\n'
                f'            <span class="album-card-body"><strong>{e(a["title"])}</strong>'
                f'<span>{e(a["date_label"])}</span><span>{n} photo{"s" if n > 1 else ""}</span></span>\n'
                f'          </a>')
        index.append(f'        <h2>Année scolaire {e(y)}</h2>\n        <div class="album-grid">\n' + "\n".join(cards) + "\n        </div>")
    for a in albums:
        n = len(a["photos"])
        links = "\n".join(
            f'          <a class="photo-link" href="{path(a, p["file"])}" data-caption="{e(p["alt"])}">'
            f'<img src="{path(a, "thumbs", p["file"])}" alt="{e(p["alt"])}" width="{THUMB}" height="{THUMB}" loading="lazy"></a>'
            for p in a["photos"])
        sections.append(
            f'      <article class="album" id="{a["id"]}">\n'
            f'        <a class="album-back" href="#">← Tous les albums</a>\n'
            f'        <h2>{e(a["title"])}</h2>\n'
            f'        <p class="album-meta">{e(a["date_label"])} - {n} photo{"s" if n > 1 else ""}</p>\n'
            f'        <div class="photo-grid">\n{links}\n        </div>\n'
            f'      </article>')
    page = TEMPLATE.replace("@@INDEX@@", "\n".join(index)).replace("@@ALBUMS@@", "\n".join(sections))
    (ROOT / "photos.html").write_text(page, encoding="utf-8")
    print(f"photos.html : {len(albums)} album(s), {sum(len(a['photos']) for a in albums)} photos")


TEMPLATE = """<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Photos des événements - APE École Jacques Prévert</title>
<meta name="description" content="Les photos des événements de l'APE de l'école Jacques Prévert à Quimper : ventes de gâteaux, kermesse et autres moments.">
<link rel="canonical" href="https://ape-jacquesprevert.fr/photos.html">
<link rel="icon" type="image/svg+xml" href="favicon.svg">
<link rel="stylesheet" href="style.css">
<link rel="stylesheet" href="photos.css">
</head>
<body>

<header class="site-header">
  <div class="header-inner">
    <a href="index.html" class="logo">
      <img src="images/logo.png" alt="APE École Jacques Prévert" class="logo-img">
      <span>APE École Jacques Prévert - Quimper</span>
    </a>
    <nav class="main-nav" style="display:flex; position:static; background:none; border:none; padding:0;">
      <a href="index.html">← Retour au site</a>
    </nav>
  </div>
</header>

<main>
  <section class="section photos-page">
    <div class="section-inner">
      <h1>Photos des événements</h1>
      <p>Retrouvez les photos de nos événements, classées par année scolaire. Touchez un album pour l'ouvrir.</p>

      <div id="albums-index">
@@INDEX@@
      </div>

@@ALBUMS@@
    </div>
  </section>
</main>

<dialog id="lightbox" aria-label="Photo en grand">
  <button type="button" class="lb-close" aria-label="Fermer">×</button>
  <button type="button" class="lb-nav lb-prev" aria-label="Photo précédente">‹</button>
  <figure>
    <img id="lbImage" alt="">
    <figcaption id="lbCaption"></figcaption>
  </figure>
  <button type="button" class="lb-nav lb-next" aria-label="Photo suivante">›</button>
</dialog>

<footer class="site-footer">
  <p>© 2026 APE École Jacques Prévert - Quimper - Association loi 1901</p>
  <p><a href="mentions-legales.html">Mentions légales et confidentialité</a></p>
</footer>

<script src="photos.js"></script>
</body>
</html>
"""

if __name__ == "__main__":
    if len(sys.argv) == 3 and sys.argv[1] == "add":
        add(sys.argv[2])
        build()
    elif len(sys.argv) == 2 and sys.argv[1] == "build":
        build()
    else:
        sys.exit(__doc__)
