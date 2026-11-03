"""
Trains the tiny neural network used in lesson 9 (Neural networks without the scary maths).

The data is the handwritten digits set that ships with scikit-learn: 1,797 images, each
8 x 8 pixels with values from 0 to 16, from the UCI "Optical Recognition of Handwritten
Digits" dataset (E. Alpaydin and C. Kaynak, CC BY 4.0). Nothing is downloaded.

The network has 64 inputs (one per pixel), one hidden layer of 16 neurons using ReLU, and
10 outputs (one per digit), trained with plain mini-batch gradient descent. Everything is
seeded, so the numbers come out the same every run. It prints what the lesson quotes and
writes src/features/learn/diagrams/digit-network.json for the figure and the unit tests.

    python3 scripts/lessons/digit-network.py

Needs numpy and scikit-learn. The network itself is in tiny_network.py, shared with lesson 11.
"""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import numpy as np  # noqa: E402
from tiny_network import Network, load, split, train  # noqa: E402

OUT = Path(__file__).resolve().parents[2] / "src/features/learn/diagrams/digit-network.json"

SEED = 9
HIDDEN = 16
PASSES = 20
BATCH = 32
LEARNING_RATE = 0.1
TEST_SHARE = 0.2
EXAMPLE_DIGIT = 3


def main() -> None:
    data = load()
    rng = np.random.default_rng(SEED)
    test, train_rows = split(rng, len(data.labels), TEST_SHARE)
    net = Network.random(rng, HIDDEN)

    # The example image: the first test image of EXAMPLE_DIGIT.
    example = next(i for i in test if data.labels[i] == EXAMPLE_DIGIT)
    before = net.chances(data.inputs[[example]])[0]
    history = train(net, data, train_rows, test, rng, passes=PASSES, batch=BATCH,
                    learning_rate=LEARNING_RATE)
    curve = history.test_accuracy
    after = net.chances(data.inputs[[example]])[0]
    test_chances = net.chances(data.inputs[test])
    wrong = int((test_chances.argmax(axis=1) != data.labels[test]).sum())

    percent = lambda values: [round(float(v) * 100, 1) for v in values]
    print(f"{len(data.labels)} images: {len(train_rows)} for training, {len(test)} for testing")
    print(f"Network 64 -> {HIDDEN} -> 10 has {net.parameters} weights and biases")
    print(f"Test accuracy before training: {curve[0]:.1%}; after {PASSES} passes: {curve[-1]:.1%}")
    print(f"Wrong on {wrong} of {len(test)} test images; {history.updates} rounds of nudging")
    print("Accuracy after each pass:", [f"{a:.0%}" for a in curve])
    print(f"Example (a {EXAMPLE_DIGIT}) before:", percent(before))
    print(f"Example (a {EXAMPLE_DIGIT}) after: ", percent(after))

    OUT.write_text(
        json.dumps(
            {
                "images": len(data.labels),
                "trainImages": len(train_rows),
                "testImages": len(test),
                "inputs": 64,
                "hidden": HIDDEN,
                "outputs": 10,
                "parameters": net.parameters,
                "passes": PASSES,
                "batch": BATCH,
                "updates": history.updates,
                "accuracy": [round(a * 100, 1) for a in curve],
                "wrong": wrong,
                "example": {
                    "digit": EXAMPLE_DIGIT,
                    "pixels": data.images[example].tolist(),
                    "before": percent(before),
                    "after": percent(after),
                },
            },
            indent=2,
        )
        + "\n"
    )
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
