"""
Works out the numbers used in lesson 11 (How models learn).

1. Gradient descent on one weight: learning the price of a samosa from four made-up
   receipts, with three learning rates.
2. The loss of lesson 9's handwriting network after each pass, from the same seeded run.
3. The same network trained with different learning rates.
4. Overfitting: the same network trained on far fewer images.

    python3 scripts/lessons/how-models-learn.py

Needs numpy and scikit-learn; the network is in tiny_network.py. Everything is seeded, so
every run prints the same numbers. Writes src/features/learn/diagrams/how-models-learn.json,
which the lesson's figures read and the unit tests check.
"""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import numpy as np  # noqa: E402
from tiny_network import Network, load, split, train  # noqa: E402

OUT = Path(__file__).resolve().parents[2] / "src/features/learn/diagrams/how-models-learn.json"

# Lesson 9's run: the same seed and settings, so the numbers match that lesson.
SEED = 9
PASSES = 20
LEARNING_RATE = 0.1

# Made-up receipts from a samosa stall: (samosas bought, bill in rupees).
RECEIPTS = [(1, 15), (2, 30), (3, 45), (5, 75)]
START = 5.0
STEPS = 8
SAMOSA_RATES = {"too small": 0.005, "about right": 0.04, "too big": 0.11}

NETWORK_RATES = [0.001, 0.01, 0.1, 1.0, 3.0]
FEW_IMAGES = [(30, 400), (100, 300)]  # (training images, passes)


def samosa_loss(price: float) -> float:
    """The average squared error of guessing bill = price x samosas."""
    return float(np.mean([(price * n - bill) ** 2 for n, bill in RECEIPTS]))


def samosa_slope(price: float) -> float:
    """How fast the loss changes as the price changes (the gradient)."""
    return float(np.mean([2 * (price * n - bill) * n for n, bill in RECEIPTS]))


def descend(rate: float) -> list[float]:
    prices = [START]
    for _ in range(STEPS):
        prices.append(prices[-1] - rate * samosa_slope(prices[-1]))
    return prices


def run(learning_rate: float = LEARNING_RATE, passes: int = PASSES, images: int | None = None):
    data = load()
    rng = np.random.default_rng(SEED)
    test, train_rows = split(rng, len(data.labels))
    net = Network.random(rng)
    if images is not None:
        train_rows = train_rows[:images]
    history = train(net, data, train_rows, test, rng, passes=passes, learning_rate=learning_rate)
    return history, len(train_rows), len(test)


def pct(value: float) -> float:
    return round(value * 100, 1)


def main() -> None:
    samosa = {
        name: {
            "rate": rate,
            "prices": [round(p, 2) for p in descend(rate)],
            "losses": [round(samosa_loss(p), 1) for p in descend(rate)],
        }
        for name, rate in SAMOSA_RATES.items()
    }

    base, train_images, test_images = run()
    rates = []
    for rate in NETWORK_RATES:
        history, _, _ = run(learning_rate=rate)
        rates.append({"rate": rate, "accuracy": pct(history.test_accuracy[-1]),
                      "loss": round(history.test_loss[-1], 2)})

    few = []
    for images, passes in FEW_IMAGES:
        history, _, _ = run(images=images, passes=passes)
        few.append({"images": images, "passes": passes,
                    "train": pct(history.train_accuracy[-1]), "test": pct(history.test_accuracy[-1])})
    few.append({"images": train_images, "passes": PASSES,
                "train": pct(base.train_accuracy[-1]), "test": pct(base.test_accuracy[-1])})

    data = {
        "samosa": {"receipts": RECEIPTS, "start": START, "steps": STEPS, "runs": samosa},
        "network": {
            "trainImages": train_images,
            "testImages": test_images,
            "passes": PASSES,
            "updates": base.updates,
            "learningRate": LEARNING_RATE,
            "testLoss": [round(v, 3) for v in base.test_loss],
            "trainLoss": [round(v, 3) for v in base.train_loss],
            "testAccuracy": [pct(v) for v in base.test_accuracy],
        },
        "learningRates": rates,
        "fewImages": few,
    }

    for name, result in samosa.items():
        print(f"Samosa, learning rate {result['rate']} ({name}):", result["prices"])
    print("Test loss after each pass:", data["network"]["testLoss"])
    print("Learning rates:", rates)
    print("Fewer images:", few)
    OUT.write_text(json.dumps(data, indent=2) + "\n")
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
