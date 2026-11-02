"""
Works out the GPT-2 numbers used in lesson 10 (The Transformer, step by step).

It runs the real GPT-2 (the 124-million-parameter "small" model, MIT licence) from the
ONNX copy in Transformer Explainer's repository, which reports every attention head:

    git clone --depth 1 https://github.com/poloclub/transformer-explainer /tmp/tx
    python3 scripts/lessons/gpt2-attention.py /tmp/tx

(The model is about 660 MB, split into 63 parts in static/model-v2/.) Tokens come from
GPT-2's tokenizer, r50k_base, via the gpt-tokenizer dev dependency, so run it from the
repository root after npm install. Needs numpy, onnx and onnxruntime.

It prints and saves to src/features/learn/diagrams/gpt2-attention.json:
- GPT-2's size, read from the model's own weights;
- the attention head that best links "it" to "suitcase" and "she" to "Riya" in two
  sentences, with that head's full attention from the pronoun to every earlier token;
- how many of the 144 heads give the first token the biggest share from "it";
- GPT-2's top next tokens after "... because it was too".
"""

import json
import subprocess
import sys
from pathlib import Path

import numpy as np
import onnx
import onnxruntime as ort

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "src/features/learn/diagrams/gpt2-attention.json"

SENTENCES = {
    "it": "Yesterday Riya couldn't lift the suitcase because it was too heavy.",
    "she": "Yesterday Riya couldn't lift the suitcase because she was too tired.",
}
PROMPT = "Yesterday Riya couldn't lift the suitcase because it was too"
TOP_NEXT = 5


def encode(texts: list[str]) -> list[dict]:
    """Token IDs and pieces from GPT-2's tokenizer (r50k_base), via gpt-tokenizer."""
    script = (
        "import * as r from 'gpt-tokenizer/encoding/r50k_base';"
        "const texts = JSON.parse(process.argv[1]);"
        "console.log(JSON.stringify(texts.map((t) => {"
        "  const ids = r.encode(t); return { ids, pieces: ids.map((id) => r.decode([id])) };"
        "})));"
    )
    out = subprocess.run(
        ["node", "--input-type=module", "-e", script, json.dumps(texts)],
        cwd=ROOT, check=True, capture_output=True, text=True,
    )
    return json.loads(out.stdout)


def load_model(folder: Path) -> Path:
    parts = folder / "static/model-v2"
    model = folder / "gpt2.onnx"
    if not model.exists():
        with model.open("wb") as joined:
            for i in range(len(list(parts.glob("gpt2.onnx.part*")))):
                joined.write((parts / f"gpt2.onnx.part{i}").read_bytes())
    return model


def size(model_path: Path) -> dict:
    """GPT-2's shape and parameter count, read from its stored weights."""
    graph = onnx.load(str(model_path), load_external_data=False).graph
    shapes = {t.name: list(t.dims) for t in graph.initializer}
    vocab, width = shapes["model.transformer.wte.weight"]
    context = shapes["model.transformer.wpe.weight"][0]
    layers = len({name.split(".")[3] for name in shapes if ".h." in name})
    mlp = shapes["model.transformer.h.0.mlp.c_fc.bias"][0]
    learned = 0
    for name, dims in shapes.items():
        if name.endswith("attn.bias") and len(dims) == 4:
            continue  # the causal mask: fixed, not learned
        if dims == [width, vocab]:
            continue  # a stored copy of the token embeddings, used again for the output
        learned += int(np.prod(dims))
    return {"vocab": vocab, "context": context, "width": width, "layers": layers, "mlp": mlp,
            "parameters": learned}


def main(folder: str) -> None:
    model_path = load_model(Path(folder))
    shape = size(model_path)
    session = ort.InferenceSession(str(model_path))
    heads = [o.name for o in session.get_outputs() if o.name.endswith("_attn_softmax")]
    shape["heads"] = len(heads) // shape["layers"]

    encoded = dict(zip(SENTENCES, encode(list(SENTENCES.values()))))
    prompt = encode([PROMPT])[0]
    rows = {}
    for pronoun, tokens in encoded.items():
        pieces = tokens["pieces"]
        at = pieces.index(f" {pronoun}")
        results = session.run(heads, {"input": np.array([tokens["ids"]], dtype=np.int64)})
        for name, attention in zip(heads, results):
            attention = np.asarray(attention).reshape(len(pieces), len(pieces))
            rows.setdefault(name, {})[pronoun] = (attention[at][: at + 1], pieces[: at + 1])

    def share(row, pieces, words):
        return float(sum(row[i] for i, piece in enumerate(pieces) if piece in words))

    def score(name):
        it_row, it_pieces = rows[name]["it"]
        she_row, she_pieces = rows[name]["she"]
        return share(it_row, it_pieces, {" suitcase"}) + share(she_row, she_pieces, {" R", "iya"})

    best = max(heads, key=score)
    _, block, _, _, head, *_ = best.split("_")  # block_<b>_attn_head_<h>_attn_softmax
    first_token_top = sum(int(np.argmax(rows[name]["it"][0]) == 0) for name in heads)

    logits = session.run(["linear_output"], {"input": np.array([prompt["ids"]], dtype=np.int64)})[0]
    last = np.asarray(logits).reshape(-1, shape["vocab"])[-1]  # scores for the next token
    chances = np.exp(last - last.max())
    chances /= chances.sum()
    top = np.argsort(-chances)[:TOP_NEXT]
    pieces = encode_ids([int(i) for i in top])

    data = {
        "model": shape,
        "head": {"layer": int(block) + 1, "head": int(head) + 1},
        "sentences": {
            pronoun: {
                "text": SENTENCES[pronoun],
                "tokens": rows[best][pronoun][1],
                "percent": [round(float(v) * 100, 1) for v in rows[best][pronoun][0]],
            }
            for pronoun in SENTENCES
        },
        "firstTokenTop": first_token_top,
        "next": {
            "prompt": PROMPT,
            "tokens": [{"text": p, "percent": round(float(chances[i]) * 100, 1)} for p, i in zip(pieces, top)],
        },
    }

    print(f"GPT-2: {shape}")
    print(f"Best head: layer {data['head']['layer']}, head {data['head']['head']} (counting from 1)")
    for pronoun, sentence in data["sentences"].items():
        print(f"  from '{pronoun}':", list(zip(sentence["tokens"], sentence["percent"])))
    print(f"Heads where 'it' gives the first token the biggest share: {first_token_top} of {len(heads)}")
    print("Next token after the prompt:", [(t["text"], t["percent"]) for t in data["next"]["tokens"]])
    OUT.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")
    print(f"Wrote {OUT}")


def encode_ids(ids: list[int]) -> list[str]:
    script = (
        "import * as r from 'gpt-tokenizer/encoding/r50k_base';"
        "console.log(JSON.stringify(JSON.parse(process.argv[1]).map((id) => r.decode([id]))));"
    )
    out = subprocess.run(
        ["node", "--input-type=module", "-e", script, json.dumps(ids)],
        cwd=ROOT, check=True, capture_output=True, text=True,
    )
    return json.loads(out.stdout)


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "/tmp/tx")
