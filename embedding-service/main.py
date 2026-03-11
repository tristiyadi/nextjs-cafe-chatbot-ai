from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from FlagEmbedding import FlagModel
import uvicorn
import os
import torch

app = FastAPI(title="Minimalist Embedding Service")

# Load model on startup
# Using intfloat/multilingual-e5-small as a minimalist alternative to BGE-M3
model_name = os.getenv("MODEL_NAME", "intfloat/multilingual-e5-small")

# Auto-detect FP16: use it only if CUDA is available
use_fp16 = torch.cuda.is_available()
print(f"Loading model {model_name} (fp16={use_fp16})...")
model = FlagModel(model_name, use_fp16=use_fp16)
print("Model loaded successfully.")

class EmbedRequest(BaseModel):
    texts: list[str]

class EmbedResponse(BaseModel):
    vectors: list[list[float]]

@app.post("/embed", response_model=EmbedResponse)
async def embed_texts(request: EmbedRequest):
    try:
        # Generate embeddings
        # E5 model uses different logic for dense vectors depending on version, 
        # but encode() is the standard FlagModel interface.
        vectors = model.encode(request.texts).tolist()
        return EmbedResponse(vectors=vectors)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "ok", "model": model_name, "cuda": torch.cuda.is_available()}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
