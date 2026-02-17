FROM python:3.12-slim

WORKDIR /app

# Install uv for fast dependency resolution
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

COPY pyproject.toml .
COPY comic_engine/ comic_engine/
COPY app.py .
COPY models/.gitkeep models/.gitkeep

RUN uv pip install --system --no-cache .

ENV HF_HOME=/app/models

EXPOSE 8000

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
