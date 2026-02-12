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
    images = json.loads(sys.stdin.read())
    labels = set()

    for img in images:
        try:
            img_bytes = base64.b64decode(img["data"])
            results = classify_image_bytes(img_bytes)
            for r in results:
                labels.add(r["prediction"])
        except (KeyError, base64.binascii.Error, UnidentifiedImageError):
            # skip bad images instead of crashing everything
            continue

    print(json.dumps(list(labels)))

if __name__ == "__main__":
    main()
