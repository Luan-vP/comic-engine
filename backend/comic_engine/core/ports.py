"""Abstract interfaces (ports) for the comic engine core domain.

These protocols define the contracts that adapters must fulfill,
keeping the core domain decoupled from specific ML frameworks.
"""

from __future__ import annotations

from typing import Protocol, runtime_checkable

import numpy as np
from PIL import Image


@runtime_checkable
class DepthModelPort(Protocol):
    """Port for depth estimation models.

    Any depth model adapter must implement this protocol.
    """

    def predict(self, image: Image.Image) -> np.ndarray:
        """Run depth prediction on an image.

        Args:
            image: RGB PIL Image to estimate depth for.

        Returns:
            2D numpy array of raw depth values (model-specific scale).
            Shape: (height, width). Higher values = closer to camera.
        """
        ...
