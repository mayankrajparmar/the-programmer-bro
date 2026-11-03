"""
Works out the GPT-2 numbers used in lesson 10 (The Transformer, step by step).

It runs the real GPT-2 (the 124-million-parameter "small" model, MIT licence) from the
ONNX copy in Transformer Explainer's repository, which reports every attention head:

    git clone --depth 1 https://github.com/poloclub/transformer-explainer /tmp/tx
    python3 scripts/lessons/gpt2-attention.py /tmp/tx

(The model is about 660 MB, split into 63 parts in static/model-v2/.) Running the model and
its tokenizer is in gpt2_runtime.py, shared with lesson 12; run it from the repository root
after npm install. Needs numpy, onnx and onnxruntime.

It prints and saves to src/features/learn/diagrams/gpt2-attention.json:
- GPT-2's size, read from the model's own weights, and the order of the parts inside
  each block, read from its graph;
- the attention head that best links "it" to "suitcase" and "she" to "Riya" in two
  sentences, with that head's full attention from the pronoun to every earlier token;
- how many of the 144 heads give the first token the biggest share from "it";
- GPT-2's top next tokens after "... because it was too".
"""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import numpy as np  # noqa: E402
import onnx  # noqa: E402
from gpt2_runtime import GPT2, ROOT, encode, load_model  # noqa: E402

OUT = ROOT / "src/features/learn/diagrams/gpt2-attention.json"

SENTENCES = {
    "it": "Yesterday Riya couldn't lift the suitcase because it was too heavy.",
    "she": "Yesterday Riya couldn't lift the suitcase because she was too tired.",
}
PROMPT = "Yesterday Riya couldn't lift the suitcase because it was too"
TOP_NEXT = 5


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


def block_order(model_path: Path) -> list[str]:
    """The order of the parts inside GPT-2's first block, read from the model's graph."""
    graph = onnx.load(str(model_path), load_external_data=False).graph
    kinds = {"ln": "normalise", "attn": "attention", "Add": "add", "mlp": "feed-forward"}
    order: list[str] = []
    last = None
    for node in graph.node:
        if "/h.0/" not in node.name:
            continue
        part = node.name.split("/h.0/")[1].split("/")[0]  # ln_1, attn, Add, ln_2, mlp, Add_1
        if part != last:
            order.append(kinds[part.split("_")[0]])
            last = part
    return order


def main(folder: str) -> None:
    model_path = load_model(Path(folder))
    shape = size(model_path)
    gpt2 = GPT2(model_path)
    session = gpt2.session
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


    data = {
        "model": shape,
        "blockOrder": block_order(model_path),
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
            "tokens": gpt2.top_next(prompt["ids"], TOP_NEXT),
        },
    }

    print(f"GPT-2: {shape}")
    print("Inside each block:", " -> ".join(data["blockOrder"]))
    print(f"Best head: layer {data['head']['layer']}, head {data['head']['head']} (counting from 1)")
    for pronoun, sentence in data["sentences"].items():
        print(f"  from '{pronoun}':", list(zip(sentence["tokens"], sentence["percent"])))
    print(f"Heads where 'it' gives the first token the biggest share: {first_token_top} of {len(heads)}")
    print("Next token after the prompt:", [(t["text"], t["percent"]) for t in data["next"]["tokens"]])
    OUT.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "/tmp/tx")
