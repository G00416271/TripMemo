"""
clipChallenge.py

Reads a JSON payload from stdin with a "mode" field:

  Image mode:
    { "mode": "images", "images": [{ "name": "x.jpg", "data": "<base64>" }, ...] }
    Returns: [[...512 floats...], ...]  — one L2-normalised vector per image

  Text mode:
    { "mode": "text", "texts": ["a photo of the Eiffel Tower", ...] }
    Returns: [[...512 floats...], ...]  — one L2-normalised vector per prompt

Both use CLIP ViT-B/32. Vectors are L2-normalised so cosine similarity == dot product.
"""

import sys
import json
import base64
from io import BytesIO

import torch
import clip
from PIL import Image, UnidentifiedImageError

# ── Load model once ────────────────────────────────────────────────────────────
device = "cuda" if torch.cuda.is_available() else "cpu"
model, preprocess = clip.load("ViT-B/32", device=device)
model.eval()


@torch.inference_mode()
def embed_images(image_list: list) -> list[list[float]]:
    vectors = []
    for img in image_list:
        try:
            img_bytes = base64.b64decode(img["data"])
            pil_img   = Image.open(BytesIO(img_bytes)).convert("RGB")
            tensor    = preprocess(pil_img).unsqueeze(0).to(device)
            feat      = model.encode_image(tensor)
            feat      = feat / feat.norm(dim=-1, keepdim=True)
            vectors.append(feat[0].cpu().tolist())
        except (KeyError, base64.binascii.Error, UnidentifiedImageError, OSError) as e:
            sys.stderr.write(f"[clipChallenge] skipping {img.get('name', '?')}: {e}\n")
            vectors.append([0.0] * 512)
    return vectors


@torch.inference_mode()
def embed_texts(texts: list[str]) -> list[list[float]]:
    vectors = []
    for text in texts:
        try:
            tokens = clip.tokenize([text]).to(device)
            feat   = model.encode_text(tokens)
            feat   = feat / feat.norm(dim=-1, keepdim=True)
            vectors.append(feat[0].cpu().tolist())
        except Exception as e:
            sys.stderr.write(f"[clipChallenge] text embed failed for '{text}': {e}\n")
            vectors.append([0.0] * 512)
    return vectors


def main():
    raw = sys.stdin.read().strip()
    if not raw:
        print("[]")
        return

    payload = json.loads(raw)
    mode    = payload.get("mode", "images")

    if mode == "text":
        texts   = payload.get("texts", [])
        vectors = embed_texts(texts)
    else:
        images  = payload.get("images", [])
        vectors = embed_images(images)

    print(json.dumps(vectors))


if __name__ == "__main__":
    main()
