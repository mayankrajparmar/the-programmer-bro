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

Needs numpy and scikit-learn.
"""

import json
from pathlib import Path

import numpy as np
from sklearn.datasets import load_digits

OUT = Path(__file__).resolve().parents[2] / "src/features/learn/diagrams/digit-network.json"

SEED = 9
HIDDEN = 16
PASSES = 20
BATCH = 32
LEARNING_RATE = 0.1
TEST_SHARE = 0.2
EXAMPLE_DIGIT = 3


def main() -> None:
    digits = load_digits()
    images = digits.images.astype(int)  # (1797, 8, 8), 0..16
    labels = digits.target
    x_all = digits.data / 16.0  # 64 numbers per image, scaled to 0..1

    rng = np.random.default_rng(SEED)
    order = rng.permutation(len(labels))
    n_test = round(len(labels) * TEST_SHARE)
    test, train = order[:n_test], order[n_test:]

    # Small random starting weights; biases start at 0.
    w1 = rng.normal(0, np.sqrt(2 / 64), (64, HIDDEN))
    b1 = np.zeros(HIDDEN)
    w2 = rng.normal(0, np.sqrt(2 / HIDDEN), (HIDDEN, 10))
    b2 = np.zeros(10)
    parameters = w1.size + b1.size + w2.size + b2.size

    def forward(x):
        hidden = np.maximum(0, x @ w1 + b1)  # ReLU: negative totals become 0
        scores = hidden @ w2 + b2
        scores = scores - scores.max(axis=1, keepdims=True)
        chances = np.exp(scores) / np.exp(scores).sum(axis=1, keepdims=True)
        return hidden, chances

    def accuracy(rows):
        _, chances = forward(x_all[rows])
        return float((chances.argmax(axis=1) == labels[rows]).mean())

    # The example image: the first test image of EXAMPLE_DIGIT.
    example = next(i for i in test if labels[i] == EXAMPLE_DIGIT)
    before = forward(x_all[[example]])[1][0]

    curve = [accuracy(test)]
    updates = 0
    for _ in range(PASSES):
        shuffled = rng.permutation(train)
        for start in range(0, len(shuffled), BATCH):
            rows = shuffled[start : start + BATCH]
            x, y = x_all[rows], labels[rows]
            hidden, chances = forward(x)
            # Backpropagation: how much each weight contributed to the error.
            d_scores = chances.copy()
            d_scores[np.arange(len(rows)), y] -= 1
            d_scores /= len(rows)
            d_w2 = hidden.T @ d_scores
            d_b2 = d_scores.sum(axis=0)
            d_hidden = (d_scores @ w2.T) * (hidden > 0)
            d_w1 = x.T @ d_hidden
            d_b1 = d_hidden.sum(axis=0)
            w1 -= LEARNING_RATE * d_w1
            b1 -= LEARNING_RATE * d_b1
            w2 -= LEARNING_RATE * d_w2
            b2 -= LEARNING_RATE * d_b2
            updates += 1
        curve.append(accuracy(test))

    after = forward(x_all[[example]])[1][0]
    _, test_chances = forward(x_all[test])
    wrong = int((test_chances.argmax(axis=1) != labels[test]).sum())

    percent = lambda values: [round(float(v) * 100, 1) for v in values]
    print(f"{len(labels)} images: {len(train)} for training, {len(test)} for testing")
    print(f"Network 64 -> {HIDDEN} -> 10 has {parameters} weights and biases")
    print(f"Test accuracy before training: {curve[0]:.1%}; after {PASSES} passes: {curve[-1]:.1%}")
    print(f"Wrong on {wrong} of {len(test)} test images; {updates} rounds of nudging")
    print("Accuracy after each pass:", [f"{a:.0%}" for a in curve])
    print(f"Example (a {EXAMPLE_DIGIT}) before:", percent(before))
    print(f"Example (a {EXAMPLE_DIGIT}) after: ", percent(after))

    OUT.write_text(
        json.dumps(
            {
                "images": len(labels),
                "trainImages": len(train),
                "testImages": len(test),
                "inputs": 64,
                "hidden": HIDDEN,
                "outputs": 10,
                "parameters": parameters,
                "passes": PASSES,
                "batch": BATCH,
                "updates": updates,
                "accuracy": [round(a * 100, 1) for a in curve],
                "wrong": wrong,
                "example": {
                    "digit": EXAMPLE_DIGIT,
                    "pixels": images[example].tolist(),
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
