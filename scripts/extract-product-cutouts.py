"""Remove the generated near-white studio backdrop while preserving soft shadows."""
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]


def extract(name: str) -> None:
    source = ROOT / "public" / "assets" / f"{name}.png"
    output = ROOT / "public" / "assets" / f"{name}-cutout.webp"
    photo = ROOT / "public" / "assets" / f"{name}.webp"
    image = Image.open(source).convert("RGB")
    rgb = np.asarray(image, dtype=np.float32)
    height, width, _ = rgb.shape

    # ImageGen produced a very smooth backdrop. Bilinear interpolation between
    # its corner colors models that backdrop without touching the product.
    corner = 30
    top_left = rgb[:corner, :corner].mean((0, 1))
    top_right = rgb[:corner, -corner:].mean((0, 1))
    bottom_left = rgb[-corner:, :corner].mean((0, 1))
    bottom_right = rgb[-corner:, -corner:].mean((0, 1))
    x = np.linspace(0, 1, width, dtype=np.float32)[None, :, None]
    y = np.linspace(0, 1, height, dtype=np.float32)[:, None, None]
    top = top_left * (1 - x) + top_right * x
    bottom = bottom_left * (1 - x) + bottom_right * x
    backdrop = top * (1 - y) + bottom * y
    distance = np.sqrt(((rgb - backdrop) ** 2).sum(2))

    alpha = np.clip((distance - 4.0) / 15.0, 0, 1) * 255
    alpha = np.asarray(Image.fromarray(alpha.astype("uint8")).filter(ImageFilter.GaussianBlur(0.8)))
    rgba = np.dstack((rgb.astype("uint8"), alpha.astype("uint8")))
    Image.fromarray(rgba, "RGBA").save(output, "WEBP", quality=88, method=6)
    image.save(photo, "WEBP", quality=86, method=6)
    print(f"{output.name}: {width}x{height}, alpha {alpha.min()}..{alpha.max()}")


for asset in ("beauty-cleanser", "beauty-serum"):
    extract(asset)
