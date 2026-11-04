"""
Shows what a base model does with questions and instructions, for lesson 12 (From base
model to assistant). GPT-2 is a base model: it was only pre-trained, never fine-tuned to
follow instructions or chat.

    git clone --depth 1 https://github.com/poloclub/transformer-explainer /tmp/tx
    python3 scripts/lessons/base-model.py /tmp/tx

For each prompt it records GPT-2's five most likely next tokens and what it writes when it
always picks the single most likely token (greedy decoding: no randomness, so every run
gives the same text). Writes src/features/learn/diagrams/base-model.json. Running GPT-2 is
in gpt2_runtime.py, shared with lesson 10.
"""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from gpt2_runtime import GPT2, ROOT, decode, encode, load_model  # noqa: E402

OUT = ROOT / "src/features/learn/diagrams/base-model.json"

PROMPTS = {
    "question": "What is the capital of India?",
    "instruction": "Write a short poem about the monsoon.",
    "pattern": (
        "Q: What is the capital of France?\nA: Paris\n"
        "Q: What is the capital of Japan?\nA: Tokyo\n"
        "Q: What is the capital of India?\nA:"
    ),
}
TOKENS = 20
TOP = 5


def main(folder: str) -> None:
    gpt2 = GPT2(load_model(Path(folder)))
    results = {}
    for name, prompt in PROMPTS.items():
        ids = encode([prompt])[0]["ids"]
        written = gpt2.greedy(ids, TOKENS)
        results[name] = {
            "prompt": prompt,
            "top": gpt2.top_next(ids, TOP),
            "continuation": "".join(decode(written)),
        }
        print(f"{name}: {prompt!r}")
        print("  most likely next:", [(t["text"], t["percent"]) for t in results[name]["top"]])
        print("  greedy:", repr(results[name]["continuation"]))
    OUT.write_text(json.dumps({"tokens": TOKENS, "prompts": results}, indent=2, ensure_ascii=False) + "\n")
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "/tmp/tx")
