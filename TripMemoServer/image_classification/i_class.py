import sys, json, base64
from io import BytesIO

import torch, clip
from PIL import Image, UnidentifiedImageError


# -----------------------------
# Setup
# -----------------------------
device = "cuda" if torch.cuda.is_available() else "cpu"
model, preprocess = clip.load("ViT-B/32", device=device)
model.eval()

classifier = [
    "objects", "landmarks", "people", "person", "nature",
    "food", "animals", "pets", "vehicles",
    "clothing", "sports", "technology",
    "venue", "city", "artwork", "pub", "nightclub", "drink"
]

with open("words.json", "r", encoding="utf-8") as f:
    subcats = json.load(f)

# Build ONE big list of tags (main + all subcategory words)
all_tags = set(classifier)
for words in subcats.values():
    all_tags.update(words)
all_tags = list(all_tags)


# -----------------------------
# Precompute text embeddings ONCE
# -----------------------------
@torch.inference_mode()
def build_text_features(labels):
    tokens = clip.tokenize(labels).to(device)
    txt_feat = model.encode_text(tokens)
    txt_feat = txt_feat / txt_feat.norm(dim=-1, keepdim=True)
    return txt_feat  # [N, D]

text_features = build_text_features(all_tags)


# -----------------------------
# Image encoding + scoring
# -----------------------------
@torch.inference_mode()
def encode_image(img_bytes):
    pil = Image.open(BytesIO(img_bytes)).convert("RGB")
    image_tensor = preprocess(pil).unsqueeze(0).to(device)
    img_feat = model.encode_image(image_tensor)
    img_feat = img_feat / img_feat.norm(dim=-1, keepdim=True)
    return img_feat  # [1, D]

@torch.inference_mode()
def top_tags_for_image(img_feat, top_n=5):
    scores = (img_feat @ text_features.T)[0]  # [N]
    k = min(top_n, scores.numel())
    idxs = scores.topk(k).indices.tolist()
    return [(all_tags[i], float(scores[i].item())) for i in idxs]


def main():
    raw = sys.stdin.read()
    if not raw.strip():
        print("[]")
        return

    images = json.loads(raw)

    # Track the best score each tag ever got across ALL images
    best_score_by_tag = {}

    for img in images:
        try:
            img_bytes = base64.b64decode(img["data"])
            img_feat = encode_image(img_bytes)

            for tag, score in top_tags_for_image(img_feat, top_n=5):
                prev = best_score_by_tag.get(tag)
                if prev is None or score > prev:
                    best_score_by_tag[tag] = score

        except (KeyError, base64.binascii.Error, UnidentifiedImageError, OSError):
            continue

    # Sort tags by best score (highest first)
    ranked = sorted(best_score_by_tag.items(), key=lambda x: x[1], reverse=True)
    tags_only = [tag for tag, _ in ranked]

    print(json.dumps(tags_only))


if __name__ == "__main__":
    main()
