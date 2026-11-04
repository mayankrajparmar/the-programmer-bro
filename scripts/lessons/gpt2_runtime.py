"""
Running the real GPT-2 for the lessons (10 and 12).

GPT-2 is the 124-million-parameter "small" model (MIT licence), from the ONNX copy in
Transformer Explainer's repository, which also reports every attention head:

    git clone --depth 1 https://github.com/poloclub/transformer-explainer /tmp/tx

Tokens come from GPT-2's own tokenizer, r50k_base, via the gpt-tokenizer dev dependency,
so run the scripts from the repository root after npm install. Needs numpy, onnx and
onnxruntime.
"""

import json
import subprocess
from pathlib import Path

import numpy as np
import onnxruntime as ort

ROOT = Path(__file__).resolve().parents[2]
VOCAB = 50257


def load_model(folder: Path) -> Path:
    """Joins the model's 63 parts into one file (once), and returns its path."""
    parts = folder / "static/model-v2"
    model = folder / "gpt2.onnx"
    if not model.exists():
        with model.open("wb") as joined:
            for i in range(len(list(parts.glob("gpt2.onnx.part*")))):
                joined.write((parts / f"gpt2.onnx.part{i}").read_bytes())
    return model


def _node(script: str, argument) -> object:
    out = subprocess.run(
        ["node", "--input-type=module", "-e", script, json.dumps(argument)],
        cwd=ROOT, check=True, capture_output=True, text=True,
    )
    return json.loads(out.stdout)


def encode(texts: list[str]) -> list[dict]:
    """Token IDs and pieces for each text, from GPT-2's tokenizer (r50k_base)."""
    script = (
        "import * as r from 'gpt-tokenizer/encoding/r50k_base';"
        "const texts = JSON.parse(process.argv[1]);"
        "console.log(JSON.stringify(texts.map((t) => {"
        "  const ids = r.encode(t); return { ids, pieces: ids.map((id) => r.decode([id])) };"
        "})));"
    )
    return _node(script, texts)  # type: ignore[return-value]


def decode(ids: list[int]) -> list[str]:
    """The text of each token ID."""
    script = (
        "import * as r from 'gpt-tokenizer/encoding/r50k_base';"
        "console.log(JSON.stringify(JSON.parse(process.argv[1]).map((id) => r.decode([id]))));"
    )
    return _node(script, ids)  # type: ignore[return-value]


class GPT2:
    def __init__(self, model_path: Path):
        self.session = ort.InferenceSession(str(model_path))

    def next_chances(self, ids: list[int]) -> np.ndarray:
        """GPT-2's chances for every token in its vocabulary, coming after these tokens."""
        logits = self.session.run(["linear_output"], {"input": np.array([ids], dtype=np.int64)})[0]
        last = np.asarray(logits).reshape(-1, VOCAB)[-1]
        chances = np.exp(last - last.max())
        return chances / chances.sum()

    def top_next(self, ids: list[int], count: int) -> list[dict]:
        """The most likely next tokens, as {"text", "percent"}."""
        chances = self.next_chances(ids)
        top = [int(i) for i in np.argsort(-chances)[:count]]
        return [{"text": text, "percent": round(float(chances[i]) * 100, 1)}
                for text, i in zip(decode(top), top)]

    def greedy(self, ids: list[int], count: int) -> list[int]:
        """Adds the single most likely token, again and again: no randomness at all."""
        ids = list(ids)
        for _ in range(count):
            ids.append(int(np.argmax(self.next_chances(ids))))
        return ids[-count:]
