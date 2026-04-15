import sys, json, base64
from io import BytesIO
<<<<<<< HEAD
import torch, clip
from PIL import Image

device = "cuda" if torch.cuda.is_available() else "cpu"
model, preprocess = clip.load("ViT-B/32", device=device)
model.eval()

classifier = [
    "objects", "landmarks", "people", "person", "nature",
    "food", "animals", "pets", "vehicles",
    "clothing", "sports", "technology",
    "venue", "city", "artwork", "pub", "nightclub"
]
text = clip.tokenize(classifier).to(device)

def classify_image_bytes(img_bytes, threshold=15, top_k=2):
    image = Image.open(BytesIO(img_bytes)).convert("RGB")
    image = preprocess(image).unsqueeze(0).to(device)

    with torch.no_grad():
        img_feat = model.encode_image(image)
        txt_feat = model.encode_text(text)

        img_feat = img_feat / img_feat.norm(dim=-1, keepdim=True)
        txt_feat = txt_feat / txt_feat.norm(dim=-1, keepdim=True)

        scores = (img_feat @ txt_feat.T)[0]
        top_idx = scores.topk(top_k).indices

        results = []
        for idx in top_idx:
            score = scores[idx].item() * 100
            if score > threshold:
                results.append({"prediction": classifier[idx], "score": f"{score:.2f}%"})
        return results

def main():
    raw = sys.stdin.read()
    images = json.loads(raw)

    labels = set()  # avoid duplicates

    for img in images:
        img_bytes = base64.b64decode(img["data"])
        results = classify_image_bytes(img_bytes)

        for r in results:
            labels.add(r["prediction"])

    # print simple array
    print(json.dumps(list(labels)))


if __name__ == "__main__":
    main()
=======
import torch
import clip
from PIL import Image, UnidentifiedImageError, ImageDraw
from ultralytics import YOLO
import re
import pytesseract

# -----------------------------
# Config
# -----------------------------
# pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

device = "cuda" if torch.cuda.is_available() else "cpu"
yolo = YOLO("yolov8s")
clip_model, preprocess = clip.load("ViT-B/32", device=device)
clip_model.eval()

# Load precomputed text features
data = torch.load("image_classification/clip_text_features.pt", map_location=device)
all_tags = data["labels"]
text_features = data["features"].to(device)

# -----------------------------
# OCR helpers
# -----------------------------
def clean_text(s: str) -> str:
    s = s.strip()
    s = re.sub(r"\s+", " ", s)
    return s

@torch.inference_mode()
def run_ocr(pil_img: Image.Image, min_conf: int = 70):
    scale = 1.5
    big = pil_img.resize((int(pil_img.width * scale), int(pil_img.height * scale)))
    gray = big.convert("L")
    config = "--oem 3 --psm 11"
    data = pytesseract.image_to_data(
        gray, lang="eng", config=config, output_type=pytesseract.Output.DICT
    )
    words = []
    for txt, conf in zip(data["text"], data["conf"]):
        txt = clean_text(txt)
        try:
            conf = int(float(conf))
        except:
            conf = -1
        if conf < min_conf:
            continue
        if not re.fullmatch(r"[A-Za-z0-9&'\-]{2,}", txt):
            continue
        words.append(txt)

    words = list(dict.fromkeys(words))
    summary = words[:4]
    if len(words) > 4:
        summary.append("...")
    return words, summary

# -----------------------------
# CLIP helpers
# -----------------------------
@torch.inference_mode()
def embed_crop(pil_img: Image.Image):
    x = preprocess(pil_img).unsqueeze(0).to(device)
    feat = clip_model.encode_image(x)
    feat = feat / feat.norm(dim=-1, keepdim=True)
    return feat

@torch.inference_mode()
def top_tags_for_feat(img_feat, top_n=5):
    scores = (img_feat @ text_features.T)[0]
    k = min(top_n, scores.numel())
    idxs = scores.topk(k).indices.tolist()
    return [{"tag": all_tags[i], "score": float(scores[i].item())} for i in idxs]

# -----------------------------
# Per-image processing
# -----------------------------
def process_image(pil_img: Image.Image, top_n_tags: int = 5, min_conf: float = 0.25):
    ocr_text, ocr_summary = run_ocr(pil_img)

    full_feat = embed_crop(pil_img)
    full_tags = [t["tag"] for t in top_tags_for_feat(full_feat, top_n=top_n_tags)]

    results = yolo.predict(source=pil_img, verbose=False)
    r = results[0]

    detections = []
    for i, box in enumerate(r.boxes):
        conf = float(box.conf.item())
        if conf < min_conf:
            continue

        cls_id = int(box.cls.item())
        yolo_label = r.names[cls_id]
        x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())

        crop = pil_img.crop((x1, y1, x2, y2))
        feat = embed_crop(crop)
        tags = [t["tag"] for t in top_tags_for_feat(feat, top_n=top_n_tags)]

        detections.append({
            "yolo_label": yolo_label,
            "yolo_confidence": round(conf, 3),
            "box_xyxy": [x1, y1, x2, y2],
            "clip_tags": tags
        })

    return {
        "full_image_tags": full_tags,
        "ocr_text": ocr_text,
        "ocr_summary": ocr_summary,
        "objects": detections
    }

# -----------------------------
# Stdin/stdout bridge (same as old script)
# -----------------------------
def main():
    raw = sys.stdin.read()
    if not raw.strip():
        print("[]")
        return

    images = json.loads(raw)
    results = []

    for img in images:
        try:
            img_bytes = base64.b64decode(img["data"])
            pil_img = Image.open(BytesIO(img_bytes)).convert("RGB")
            result = process_image(pil_img)
            result["name"] = img.get("name", "unknown")
            results.append(result)
        except (KeyError, base64.binascii.Error, UnidentifiedImageError, OSError) as e:
            results.append({"name": img.get("name", "unknown"), "error": str(e)})

    print(json.dumps(results))

if __name__ == "__main__":
    main()
>>>>>>> a3d131e9dae7b66805de600fa84219f8789bad0f
