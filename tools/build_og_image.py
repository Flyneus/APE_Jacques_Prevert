#!/usr/bin/env python3
"""Image de partage du site (1200 x 630 px) : aperçu des liens sur WhatsApp, Facebook, mails...

Régénérer :  python tools/build_og_image.py   ->  images/og-image.jpg
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parent.parent
W, H = 1200, 630
BG, TAUPE, ORANGE, GREEN = (255, 255, 255), (42, 32, 26), (222, 108, 31), (20, 184, 139)
FONTS = Path("C:/Windows/Fonts")


def font(names, size):
    for n in names:
        p = FONTS / n
        if p.exists():
            return ImageFont.truetype(str(p), size)
    return ImageFont.load_default()


def main():
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)

    # photo à droite, coins arrondis
    photo = ImageOps.fit(Image.open(ROOT / "images" / "photo-defile-drapeaux.jpg").convert("RGB"),
                         (460, 630), Image.LANCZOS, centering=(0.5, 0.45))
    mask = Image.new("L", photo.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, photo.size[0], photo.size[1]), radius=0, fill=255)
    img.paste(photo, (W - 460, 0), mask)
    d.rectangle((W - 470, 0, W - 460, H), fill=GREEN)

    # logo
    logo = Image.open(ROOT / "images" / "logo.png").convert("RGBA")
    lw = 300
    logo = logo.resize((lw, round(logo.size[1] * lw / logo.size[0])), Image.LANCZOS)
    img.paste(logo, (70, 62), logo)

    title = font(["ARLRDBD.TTF", "segoeuib.ttf", "arialbd.ttf"], 62)
    sub = font(["segoeuisb.ttf", "seguisb.ttf", "segoeui.ttf", "arial.ttf"], 36)
    small = font(["ARLRDBD.TTF", "segoeuib.ttf", "arialbd.ttf"], 34)

    d.text((70, 250), "APE École", font=title, fill=TAUPE)
    d.text((70, 326), "Jacques Prévert", font=title, fill=TAUPE)
    d.rectangle((72, 420, 232, 428), fill=ORANGE)
    d.text((70, 452), "Association des parents d'élèves", font=sub, fill=TAUPE)
    d.text((70, 508), "Quimper", font=small, fill=ORANGE)

    out = ROOT / "images" / "og-image.jpg"
    img.save(out, "JPEG", quality=88, optimize=True, progressive=True)
    print(f"{out.relative_to(ROOT)} : {out.stat().st_size // 1024} Ko")


if __name__ == "__main__":
    main()
