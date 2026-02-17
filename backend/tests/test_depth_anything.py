"""Tests for the DepthAnythingV2 adapter."""

from __future__ import annotations

from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import numpy as np
import pytest
from PIL import Image

torch = pytest.importorskip("torch")

from comic_engine.adapters.depth_anything import DepthAnythingV2Adapter  # noqa: E402
from comic_engine.core.ports import DepthModelPort  # noqa: E402


def test_adapter_satisfies_protocol():
    adapter = DepthAnythingV2Adapter()
    assert isinstance(adapter, DepthModelPort)


def test_detect_device_returns_torch_device():
    device = DepthAnythingV2Adapter._detect_device()
    assert isinstance(device, torch.device)


@patch(
    "comic_engine.adapters.depth_anything.AutoModelForDepthEstimation",
)
@patch(
    "comic_engine.adapters.depth_anything.AutoImageProcessor",
)
def test_predict_returns_array(mock_processor_cls, mock_model_cls):
    width, height = 32, 24

    # Processor: return a namespace whose .to() yields a real dict of tensors
    processor_instance = MagicMock()
    processor_instance.side_effect = lambda **kwargs: SimpleNamespace(
        to=lambda device: {"pixel_values": torch.randn(1, 3, height, width)},
    )
    mock_processor_cls.from_pretrained.return_value = processor_instance

    # Model: return a real depth tensor so torch.nn.functional.interpolate works
    depth_tensor = torch.randn(1, height, width)
    model_instance = MagicMock()
    model_instance.return_value = SimpleNamespace(predicted_depth=depth_tensor)
    model_instance.eval.return_value = None
    model_instance.to.return_value = model_instance
    mock_model_cls.from_pretrained.return_value = model_instance

    adapter = DepthAnythingV2Adapter()
    image = Image.new("RGB", (width, height))
    result = adapter.predict(image)

    assert isinstance(result, np.ndarray)
    assert result.shape == (height, width)
    mock_processor_cls.from_pretrained.assert_called_once()
    mock_model_cls.from_pretrained.assert_called_once()
