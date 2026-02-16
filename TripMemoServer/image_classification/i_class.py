import sys, json, base64
from io import BytesIO
import torch, clip
from PIL import Image, UnidentifiedImageError

device = "cuda" if torch.cuda.is_available() else "cpu"
model, preprocess = clip.load("ViT-B/32", device=device)
model.eval()

classifier = [
    "objects", "landmarks", "people", "person", "nature",
    "food", "animals", "pets", "vehicles",
    "clothing", "sports", "technology",
    "venue", "city", "artwork", "pub", "nightclub", "drink"
]

# Load subcategory words once
with open("words.json", "r", encoding="utf-8") as f:
    subcats = json.load(f)

def clip_rank(image_tensor, labels, threshold=15, top_k=None):
    """
    If top_k is an int: only consider the top_k best scores (then apply threshold).
    If top_k is None: consider ALL labels and return all that pass threshold.
    """
    if not labels:
        return []

    tokens = clip.tokenize(labels).to(device)

    with torch.no_grad():
        img_feat = model.encode_image(image_tensor)
        txt_feat = model.encode_text(tokens)

        img_feat = img_feat / img_feat.norm(dim=-1, keepdim=True)
        txt_feat = txt_feat / txt_feat.norm(dim=-1, keepdim=True)

        scores = (img_feat @ txt_feat.T)[0]  # shape: [len(labels)]

        results = []

        # LIMITED MODE (top_k)
        if top_k is not None:
            k = min(top_k, len(labels))
            top_idx = scores.topk(k).indices
            for idx in top_idx:
                score = scores[idx].item() * 100
                if score > threshold:
                    results.append({
                        "prediction": labels[idx],
                        "score": f"{score:.2f}%"
                    })
            return results

        # UNLIMITED MODE (all labels)
        for idx, s in enumerate(scores):
            score = s.item() * 100
            if score > threshold:
                results.append({
                    "prediction": labels[idx],
                    "score": f"{score:.2f}%"
                })

        # optional: sort best to worst
        results.sort(key=lambda r: float(r["score"][:-1]), reverse=True)
        return results


def analyze_image_bytes_two_pass(img_bytes, threshold=15):
    pil = Image.open(BytesIO(img_bytes)).convert("RGB")
    image_tensor = preprocess(pil).unsqueeze(0).to(device)

    # PASS 1: hard limit top 3 classifiers
    main_results = clip_rank(image_tensor, classifier, threshold=threshold, top_k=3)

    # PASS 2: no limit on subcategories
    sub_results = {}
    for r in main_results:
        main_label = r["prediction"]
        words = subcats.get(main_label, [])
        if not words:
            continue

        sub_results[main_label] = clip_rank(
            image_tensor,
            words,
            threshold=threshold,
            top_k=20  
        )

    return main_results, sub_results

def main():
    images = json.loads(sys.stdin.read())
    labels = set()
    sublabels = set()

    for img in images:
        try:
            img_bytes = base64.b64decode(img["data"])
            main_results, sub_results = analyze_image_bytes_two_pass(img_bytes, threshold=15)

            for r in main_results:
                labels.add(r["prediction"])

            # collect subcategory predictions too
            for main_label, results in sub_results.items():
                for r in results:
                    sublabels.add(f"{main_label}:{r['prediction']}")

        except (KeyError, base64.binascii.Error, UnidentifiedImageError):
            continue

    # output both if you want
    print(json.dumps({
        "main": sorted(labels),
        "sub": sorted(sublabels)
    }))

if __name__ == "__main__":
    main()
