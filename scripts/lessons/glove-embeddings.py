"""
Rebuilds the GloVe numbers used in lesson 7 (Embeddings: meaning as numbers).

Downloads the 100-dimensional GloVe vectors (Stanford, Wikipedia 2014 + Gigaword 5,
400K words, public domain under the PDDL) from the gensim-data release on GitHub,
then prints the similarities, analogies and 2D map used in the lesson and writes the
small sample of vectors that the unit tests check them against.

    python3 scripts/lessons/glove-embeddings.py /tmp/glove

Needs numpy. The download is about 130 MB.
"""

import gzip
import json
import sys
import urllib.request
from pathlib import Path

import numpy as np

URL = (
    "https://github.com/RaRe-Technologies/gensim-data/releases/download/"
    "glove-wiki-gigaword-100/glove-wiki-gigaword-100.gz"
)
OUT = Path(__file__).resolve().parents[2] / "src/features/learn/diagrams/glove-sample.json"

GROUPS = {
    "Food": ["dosa", "idli", "biryani", "samosa"],
    "Sport": ["cricket", "hockey", "football", "kabaddi"],
    "Tech": ["laptop", "computer", "software", "smartphone"],
}
PAIRS = [
    ("dosa", "idli"), ("laptop", "computer"), ("cricket", "football"), ("dosa", "samosa"),
    ("dosa", "biryani"), ("dosa", "cricket"), ("cheap", "expensive"), ("cheap", "budget"),
    ("kabaddi", "cricket"), ("kabaddi", "kho-kho"), ("upi", "newsweek"),
]
ANALOGIES = [("man", "king", "woman"), ("india", "delhi", "japan")]
NEIGHBOURS = ["dosa", "kabaddi", "upi"]
NEWER_WORDS = ["covid", "chatgpt"]


def main(folder: str) -> None:
    path = Path(folder) / "glove-wiki-gigaword-100.gz"
    path.parent.mkdir(parents=True, exist_ok=True)
    if not path.exists():
        urllib.request.urlretrieve(URL, path)

    words, rows = [], []
    with gzip.open(path, "rt", encoding="utf8") as f:
        next(f)  # header: "400000 100"
        for line in f:
            parts = line.rstrip().split(" ")
            words.append(parts[0])
            rows.append(np.array(parts[1:], dtype=np.float32))
    vectors = np.vstack(rows)
    unit = vectors / np.linalg.norm(vectors, axis=1, keepdims=True)
    index = {word: i for i, word in enumerate(words)}

    print("First six numbers for 'dosa':", [round(float(x), 2) for x in vectors[index["dosa"]][:6]])
    for a, b in PAIRS:
        print(f"similarity({a}, {b}) = {float(unit[index[a]] @ unit[index[b]]):.2f}")
    for word in NEIGHBOURS:
        scores = unit @ unit[index[word]]
        print(f"closest to {word}:", [words[i] for i in np.argsort(-scores)[1:6]])
    for word in NEWER_WORDS:
        print(f"{word} is in GloVe: {word in index}")
    for a, b, c in ANALOGIES:
        target = unit[index[b]] - unit[index[a]] + unit[index[c]]
        scores = unit @ (target / np.linalg.norm(target))
        best = [words[i] for i in np.argsort(-scores) if words[i] not in (a, b, c)][:3]
        print(f"{b} - {a} + {c} is closest to: {best}")

    # The 2D map: PCA of the twelve words, food on the left and sport on top.
    map_words = [w for group in GROUPS.values() for w in group]
    x = np.vstack([unit[index[w]] for w in map_words])
    centred = x - x.mean(axis=0)
    _, s, vt = np.linalg.svd(centred, full_matrices=False)
    points = centred @ vt[:2].T
    if np.mean(points[:4, 0]) > 0:
        points[:, 0] *= -1
    if np.mean(points[4:8, 1]) < 0:
        points[:, 1] *= -1
    points = (points - points.min(axis=0)) / (points.max(axis=0) - points.min(axis=0)) * 100
    kept = float((s[:2] ** 2).sum() / (s**2).sum())
    print(f"2D map (keeps {kept:.0%} of the spread):")
    for word, (px, py) in zip(map_words, points):
        print(f"  {word:11} x={px:5.1f} y={py:5.1f}")

    sample = sorted(set(map_words) | {w for p in PAIRS for w in p} | {w for t in ANALOGIES for w in t}
                    | {"queen", "tokyo"})
    OUT.write_text(json.dumps({w: [round(float(v), 6) for v in vectors[index[w]]] for w in sample}))
    print(f"Wrote {len(sample)} vectors to {OUT}")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "/tmp/glove")
