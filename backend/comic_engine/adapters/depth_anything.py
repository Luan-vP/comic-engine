"""Outbound adapter: HuggingFace Depth Anything V2 model."""

from __future__ import annotations

import logging
import os

import numpy as np
import torch
from PIL import Image
from transformers import AutoImageProcessor, AutoModelForDepthEstimation

logger = logging.getLogger(__name__)


class DepthAnythingV2Adapter:
    """Outbound adapter: HuggingFace Depth Anything V2 model."""

    MODEL_ID = "depth-anything/Depth-Anything-V2-Small-hf"

    def __init__(self):
        self._processor = None
        self._model = None
        self._device = None

    @staticmethod
    def _detect_device() -> torch.device:
        if torch.backends.mps.is_available():
            return torch.device("mps")
        if torch.cuda.is_available():
            return torch.device("cuda")
        return torch.device("cpu")

    def _load(self):
        if self._model is not None:
            return

        cache_dir = os.environ.get(
            "HF_HOME",
            os.path.join(os.path.dirname(__file__), "..", "..", "models"),
        )
        self._device = self._detect_device()
        logger.info("Loading %s on %s", self.MODEL_ID, self._device)

        self._processor = AutoImageProcessor.from_pretrained(
            self.MODEL_ID, cache_dir=cache_dir
        )
        self._model = AutoModelForDepthEstimation.from_pretrained(
            self.MODEL_ID, cache_dir=cache_dir
        )
        self._model.to(self._device)
        self._model.eval()

    def predict(self, image: Image.Image) -> np.ndarray:
        self._load()
        inputs = self._processor(images=image, return_tensors="pt").to(self._device)
        with torch.no_grad():
            outputs = self._model(**inputs)

        predicted_depth = outputs.predicted_depth
        # Interpolate to original image size
        prediction = torch.nn.functional.interpolate(
            predicted_depth.unsqueeze(1),
            size=image.size[::-1],  # (height, width)
            mode="bicubic",
            align_corners=False,
        ).squeeze()

        return prediction.cpu().numpy()
