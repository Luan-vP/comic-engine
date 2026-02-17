"""Shared test fixtures for the comic-engine backend."""

from __future__ import annotations

import numpy as np
import pytest
from PIL import Image


class MockDepthModel:
    """Fake depth model that returns a vertical gradient (0 top, 1 bottom)."""

    def predict(self, image: Image.Image) -> np.ndarray:
        w, h = image.size
        gradient = np.linspace(0.0, 1.0, num=h, dtype=np.float32)
        return np.tile(gradient[:, np.newaxis], (1, w))


@pytest.fixture()
def mock_model() -> MockDepthModel:
    return MockDepthModel()


@pytest.fixture()
def test_image() -> Image.Image:
    return Image.new("RGB", (64, 64), color=(128, 128, 128))


@pytest.fixture()
def sample_depth_array() -> np.ndarray:
    return np.linspace(0.0, 1.0, num=16, dtype=np.float32).reshape(4, 4)
