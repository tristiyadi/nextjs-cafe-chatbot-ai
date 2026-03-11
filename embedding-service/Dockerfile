# Embedding service for BGE-M3 model
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for build
RUN apt-get update && apt-get install -y \
    build-essential \
    git \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download model during build to speed up container startup
# use_fp16=False for CPU compatibility
RUN python -c "from FlagEmbedding import FlagModel; FlagModel('intfloat/multilingual-e5-small', use_fp16=False)"

COPY . .

EXPOSE 8001

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
