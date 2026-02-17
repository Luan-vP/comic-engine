"""Tests for image utility functions."""

from __future__ import annotations

import io

import numpy as np
import pytest
from PIL import Image

from comic_engine.core.image_utils import decode_upload, depth_to_png


def _image_to_png_bytes(img: Image.Image) -> bytes:
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


class TestDecodeUpload:
    def test_valid_png(self):
        img = Image.new("RGB", (32, 32), color=(255, 0, 0))
        raw = _image_to_png_bytes(img)

        result = decode_upload(raw)

        assert result.mode == "RGB"
        assert result.size == (32, 32)

    def test_converts_rgba_to_rgb(self):
        img = Image.new("RGBA", (16, 16), color=(0, 255, 0, 128))
        raw = _image_to_png_bytes(img)

        result = decode_upload(raw)

        assert result.mode == "RGB"

    def test_invalid_bytes_raises_value_error(self):
        with pytest.raises(ValueError, match="Invalid image data"):
            decode_upload(b"not-an-image")


class TestDepthToPng:
    def test_returns_valid_png(self, sample_depth_array):
        png_bytes = depth_to_png(sample_depth_array)

        img = Image.open(io.BytesIO(png_bytes))
        assert img.format == "PNG"
        assert img.mode == "L"
        assert img.size == (sample_depth_array.shape[1], sample_depth_array.shape[0])

    def test_roundtrip_approximate(self, sample_depth_array):
        png_bytes = depth_to_png(sample_depth_array)
        img = Image.open(io.BytesIO(png_bytes))
        recovered = np.array(img, dtype=np.float32) / 255.0

        np.testing.assert_allclose(recovered, sample_depth_array, atol=1 / 255 + 1e-6)
