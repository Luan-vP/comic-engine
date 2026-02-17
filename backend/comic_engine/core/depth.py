"""Core use case for depth estimation."""

from __future__ import annotations

import numpy as np
from PIL import Image

from comic_engine.core.ports import DepthModelPort


def estimate_depth(image: Image.Image, model: DepthModelPort) -> np.ndarray:
    """Estimate a normalised depth map from an image.

    Args:
        image: RGB PIL Image.
        model: Any object satisfying :class:`DepthModelPort`.

    Returns:
        2-D float32 array of shape (height, width) with values in [0, 1].
        Convention: 0 = far, 1 = near.
    """
    raw = model.predict(image)

    min_val = raw.min()
    max_val = raw.max()

    if min_val == max_val:
        return np.zeros_like(raw, dtype=np.float32)

    normalised = (raw - min_val) / (max_val - min_val)
    return normalised.astype(np.float32)
