"""Image encoding / decoding utilities."""

from __future__ import annotations

import io

import numpy as np
from PIL import Image


def decode_upload(file_bytes: bytes) -> Image.Image:
    """Decode uploaded bytes into an RGB PIL Image.

    Args:
        file_bytes: Raw image file bytes (PNG, JPEG, etc.).

    Returns:
        PIL Image in RGB mode.

    Raises:
        ValueError: If the bytes cannot be decoded as an image.
    """
    try:
        img = Image.open(io.BytesIO(file_bytes))
        img.load()  # force full decode to catch truncated data
    except Exception as exc:
        raise ValueError("Invalid image data") from exc

    return img.convert("RGB")


def depth_to_png(depth_array: np.ndarray) -> bytes:
    """Encode a [0, 1] depth map as a grayscale PNG.

    Args:
        depth_array: 2-D float32 array with values in [0, 1].

    Returns:
        PNG-encoded bytes.
    """
    uint8 = (depth_array * 255).clip(0, 255).astype(np.uint8)
    img = Image.fromarray(uint8, mode="L")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()
