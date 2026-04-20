import sys, json, base64
from io import BytesIO

import torch, clip
from PIL import Image, UnidentifiedImageError


# -----------------------------
# Setup
# -----------------------------

device = "cuda" if torch.cuda.is_available() else "cpu" #if the gpu is available and cuda is installed, use it, otherwise use the cpu.
model, preprocess = clip.load("ViT-B/32", device=device) #choose the clip model to use, ViT-B/32 in this case. The preprocess function is used to prepare images for the model.
model.eval() # Set the model to evaluation mode. This is important because it disables certain layers like dropout and batch normalization that behave differently during training and inference.

classifier = [
    "objects", "landmarks", "people", "person", "nature",
    "food", "animals", "pets", "vehicles",
    "clothing", "sports", "technology",
    "venue", "city", "artwork", "pub", "nightclub", "drink"
] # This is a list of high-level categories that we want to classify images into. We will use CLIP to determine which of these categories best matches the content of an image.


















with open("words.json", "r", encoding="utf-8") as f: #read the words.json file and load it as a Python dictionary. This file contains subcategories for each of the main categories in the classifier list.
    subcats = json.load(f) # 

# Build ONE big list of tags (main + all subcategory words)
all_tags = set(classifier) # We start with a set of the main categories to ensure uniqueness. A set is an unordered collection of unique elements.
for words in subcats.values(): # We iterate over the values of the subcats dictionary, which are lists of subcategory words. For each list of words, we update the all_tags set with those words. The update method adds all elements from the given iterable (in this case, the list of subcategory words) to the set, ensuring that there are no duplicates.
    all_tags.update(words) # After this loop, all_tags will contain all the main categories from the classifier list as well as all the subcategory words from the words.json file, with no duplicates.
all_tags = list(all_tags) # Finally, we convert the set back to a list. This is because we will need to index into this list later when we want to retrieve the category names corresponding to the highest scoring tags for an image.
'''
to summarize, all tags is a list that contains all the main categories from the classifier list and all the subcategory words from the words.json file,
with duplicates removed. This list will be used to compute text embeddings for all possible tags that we want to classify images into.
'''





























# -----------------------------
# Precompute text embeddings ONCE
# -----------------------------
@torch.inference_mode() # This is a decorator that tells PyTorch that the function it decorates will not modify any model parameters and does not require gradients. This can lead to performance optimizations because PyTorch can skip certain computations related to gradient tracking.
def build_text_features(labels): # This function takes a list of labels (tags) and computes their text embeddings using the CLIP model. The embeddings are normalized to have unit length.
    tokens = clip.tokenize(labels).to(device) # The clip.tokenize function converts the list of labels into a format that can be processed by the CLIP model. It returns a tensor of token indices. We then move this tensor to the same device as the model (either GPU or CPU) using the .to(device) method.
    txt_feat = model.encode_text(tokens) # The encode_text method of the CLIP model takes the tokenized labels and computes their text embeddings. The output is a tensor where each row corresponds to the embedding of a label.
    '''
    to further explain, the encode_text method processes the tokenized labels through the CLIP model's text encoder, 
    which is typically a transformer-based architecture. The output is a high-dimensional vector (embedding)
    for each label that captures its semantic meaning in a way that can be compared to image embeddings produced by the model's image encoder.
    By normalizing these embeddings to have unit length, we can later compute cosine similarity scores between image and text embeddings 
    to determine how well an image matches each label.

    in simpler terms, this function takes a list of category names (labels), converts them into a format suitable for the CLIP model,
and then uses the model to generate a vector representation (embedding) for each category. These embeddings are normalized so that we can easily compare them to image embeddings later on.
    '''



    txt_feat = txt_feat / txt_feat.norm(dim=-1, keepdim=True) 
    '''
    # This line normalizes the text embeddings to have unit length. The norm function computes the L2 norm (Euclidean length) of each embedding vector along the last dimension (dim=-1). The keepdim=True argument ensures that the output has the same number of dimensions as the input, which allows for proper broadcasting when we divide the original embeddings by their norms. After this operation, each text embedding will have a length of 1, which is important for computing cosine similarity scores later on when we compare these text embeddings to image embeddings.

    '''
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
