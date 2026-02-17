"""Tests for the depth estimation use case."""

from __future__ import annotations

import numpy as np
from PIL import Image

from comic_engine.core.depth import estimate_depth


class TestEstimateDepth:
    def test_output_dtype_and_range(self, test_image, mock_model):
        result = estimate_depth(test_image, mock_model)

        assert result.dtype == np.float32
        assert result.min() >= 0.0
        assert result.max() <= 1.0

    def test_output_shape_matches_image(self, test_image, mock_model):
        result = estimate_depth(test_image, mock_model)
        w, h = test_image.size

        assert result.shape == (h, w)

    def test_uniform_output_does_not_crash(self, test_image):
        """When the model returns a constant depth, normalisation should return zeros."""

        class UniformModel:
            def predict(self, image: Image.Image) -> np.ndarray:
                w, h = image.size
                return np.full((h, w), 5.0, dtype=np.float32)

        result = estimate_depth(test_image, UniformModel())

        assert result.shape == (test_image.size[1], test_image.size[0])
        assert np.all(result == 0.0)

    def test_normalisation_with_known_values(self):
        """Verify exact normalisation arithmetic."""

        class KnownModel:
            def predict(self, image: Image.Image) -> np.ndarray:
                return np.array([[2.0, 4.0], [6.0, 8.0]], dtype=np.float32)

        img = Image.new("RGB", (2, 2))
        result = estimate_depth(img, KnownModel())

        expected = np.array([[0.0, 1 / 3], [2 / 3, 1.0]], dtype=np.float32)
        np.testing.assert_allclose(result, expected, atol=1e-6)
