"""
The tiny handwriting network shared by lessons 9 and 11: 64 inputs (one per pixel of an
8 x 8 digit), one hidden layer of ReLU neurons and 10 outputs, trained with plain
mini-batch gradient descent and backpropagation in NumPy.

The data is the handwritten digits set that ships with scikit-learn: 1,797 images from the
UCI "Optical Recognition of Handwritten Digits" dataset (E. Alpaydin and C. Kaynak,
CC BY 4.0). Nothing is downloaded. Everything takes a seeded random generator, so runs
are repeatable.
"""

from dataclasses import dataclass, field

import numpy as np
from sklearn.datasets import load_digits


@dataclass
class Digits:
    images: np.ndarray  # (1797, 8, 8), integers 0..16
    labels: np.ndarray  # (1797,), 0..9
    inputs: np.ndarray  # (1797, 64), scaled to 0..1


def load() -> Digits:
    digits = load_digits()
    return Digits(digits.images.astype(int), digits.target, digits.data / 16.0)


def split(rng: np.random.Generator, count: int, test_share: float = 0.2):
    """A random test set (kept aside, never trained on) and the rest for training."""
    order = rng.permutation(count)
    n_test = round(count * test_share)
    return order[:n_test], order[n_test:]


@dataclass
class Network:
    w1: np.ndarray
    b1: np.ndarray
    w2: np.ndarray
    b2: np.ndarray

    @classmethod
    def random(cls, rng: np.random.Generator, hidden: int = 16) -> "Network":
        """Small random starting weights; biases start at 0."""
        w1 = rng.normal(0, np.sqrt(2 / 64), (64, hidden))
        w2 = rng.normal(0, np.sqrt(2 / hidden), (hidden, 10))
        return cls(w1, np.zeros(hidden), w2, np.zeros(10))

    @property
    def parameters(self) -> int:
        return self.w1.size + self.b1.size + self.w2.size + self.b2.size

    def forward(self, x: np.ndarray):
        hidden = np.maximum(0, x @ self.w1 + self.b1)  # ReLU: negative totals become 0
        scores = hidden @ self.w2 + self.b2
        scores = scores - scores.max(axis=1, keepdims=True)
        chances = np.exp(scores) / np.exp(scores).sum(axis=1, keepdims=True)
        return hidden, chances

    def chances(self, x: np.ndarray) -> np.ndarray:
        return self.forward(x)[1]

    def accuracy(self, x: np.ndarray, y: np.ndarray) -> float:
        return float((self.chances(x).argmax(axis=1) == y).mean())

    def loss(self, x: np.ndarray, y: np.ndarray) -> float:
        """Cross-entropy: the average of -ln(the chance given to the right answer)."""
        right = self.chances(x)[np.arange(len(y)), y]
        return float(-np.log(np.maximum(right, 1e-12)).mean())

    def step(self, x: np.ndarray, y: np.ndarray, learning_rate: float) -> None:
        """One round of nudging: backpropagation, then every weight moves downhill."""
        hidden, chances = self.forward(x)
        d_scores = chances.copy()
        d_scores[np.arange(len(y)), y] -= 1
        d_scores /= len(y)
        d_w2 = hidden.T @ d_scores
        d_b2 = d_scores.sum(axis=0)
        d_hidden = (d_scores @ self.w2.T) * (hidden > 0)
        d_w1 = x.T @ d_hidden
        d_b1 = d_hidden.sum(axis=0)
        self.w1 -= learning_rate * d_w1
        self.b1 -= learning_rate * d_b1
        self.w2 -= learning_rate * d_w2
        self.b2 -= learning_rate * d_b2


@dataclass
class History:
    """Measured before training (index 0) and after each pass through the training images."""

    test_accuracy: list[float] = field(default_factory=list)
    train_accuracy: list[float] = field(default_factory=list)
    test_loss: list[float] = field(default_factory=list)
    train_loss: list[float] = field(default_factory=list)
    updates: int = 0


def train(
    net: Network,
    data: Digits,
    train_rows: np.ndarray,
    test_rows: np.ndarray,
    rng: np.random.Generator,
    *,
    passes: int,
    batch: int = 32,
    learning_rate: float = 0.1,
) -> History:
    history = History()
    x, y = data.inputs, data.labels

    def measure() -> None:
        history.test_accuracy.append(net.accuracy(x[test_rows], y[test_rows]))
        history.train_accuracy.append(net.accuracy(x[train_rows], y[train_rows]))
        history.test_loss.append(net.loss(x[test_rows], y[test_rows]))
        history.train_loss.append(net.loss(x[train_rows], y[train_rows]))

    measure()
    for _ in range(passes):
        shuffled = rng.permutation(train_rows)
        for start in range(0, len(shuffled), batch):
            rows = shuffled[start : start + batch]
            with np.errstate(over="ignore", invalid="ignore"):
                net.step(x[rows], y[rows], learning_rate)
            history.updates += 1
        measure()
    return history
