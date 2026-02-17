"""Tests for the FastAPI app endpoints."""

from __future__ import annotations

import io
import sys
from types import SimpleNamespace
from unittest.mock import MagicMock

import numpy as np
import pytest
from PIL import Image

# If torch/transformers are not installed, provide stub modules so that
# importing the app module (which imports the adapter) does not fail.
try:
    import torch as _torch_check  # noqa: F401
except ImportError:
    _torch_mock = MagicMock()
    _torch_mock.device = type("device", (), {"__init__": lambda self, x: None})
    sys.modules["torch"] = _torch_mock
    sys.modules["transformers"] = MagicMock()

import app as app_module  # noqa: E402
from app import app  # noqa: E402

from httpx import ASGITransport, AsyncClient  # noqa: E402


def _make_png_bytes(width: int = 64, height: int = 64) -> bytes:
    """Create a minimal valid PNG in memory."""
    img = Image.new("RGB", (width, height), color=(128, 128, 128))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


class _MockModel:
    """Fake model returning a vertical gradient."""

    def predict(self, image: Image.Image) -> np.ndarray:
        w, h = image.size
        gradient = np.linspace(0.0, 1.0, num=h, dtype=np.float32)
        return np.tile(gradient[:, np.newaxis], (1, w))


@pytest.fixture(autouse=True)
def _patch_model(monkeypatch):
    """Replace the real model with a mock for all tests in this module."""
    monkeypatch.setattr(app_module, "_model", _MockModel())


@pytest.mark.anyio
async def test_health():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


@pytest.mark.anyio
async def test_depth_returns_png():
    png = _make_png_bytes()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post(
            "/api/depth",
            files={"file": ("test.png", png, "image/png")},
        )
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "image/png"


@pytest.mark.anyio
async def test_depth_has_dimension_headers():
    png = _make_png_bytes(width=80, height=60)
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post(
            "/api/depth",
            files={"file": ("test.png", png, "image/png")},
        )
    assert resp.status_code == 200
    assert resp.headers["x-depth-width"] == "80"
    assert resp.headers["x-depth-height"] == "60"


@pytest.mark.anyio
async def test_depth_invalid_data_returns_400():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post(
            "/api/depth",
            files={"file": ("bad.png", b"not-an-image", "image/png")},
        )
    assert resp.status_code == 400
    assert "Invalid image data" in resp.json()["detail"]
