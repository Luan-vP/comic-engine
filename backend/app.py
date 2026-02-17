"""FastAPI inbound adapter for the Comic Engine API."""

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

from comic_engine.adapters.depth_anything import DepthAnythingV2Adapter
from comic_engine.core.depth import estimate_depth
from comic_engine.core.image_utils import decode_upload, depth_to_png

app = FastAPI(title="Comic Engine API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_model = DepthAnythingV2Adapter()


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.post("/api/depth")
async def depth(file: UploadFile = File(...)):
    raw = await file.read()
    try:
        image = decode_upload(raw)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    depth_map = estimate_depth(image, _model)
    png_bytes = depth_to_png(depth_map)

    return Response(
        content=png_bytes,
        media_type="image/png",
        headers={
            "X-Depth-Width": str(depth_map.shape[1]),
            "X-Depth-Height": str(depth_map.shape[0]),
        },
    )
