/**
 * Generates embeddings using Hugging Face Text Embedding Inference (TEI)
 * TEI exposes an OpenAI-compatible /v1/embeddings endpoint.
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const url = process.env.EMBEDDING_SERVICE_URL || "http://localhost:8001";
  const model = process.env.EMBEDDING_MODEL_ID || "intfloat/multilingual-e5-small";

  try {
    const response = await fetch(`${url}/v1/embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, input: texts }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`TEI embedding failed (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    // TEI returns: { data: [{ embedding: number[], index: number }, ...] }
    return data.data
      .sort((a: { index: number }, b: { index: number }) => a.index - b.index)
      .map((d: { embedding: number[] }) => d.embedding);
  } catch (error) {
    console.error("Error generating embeddings:", error);
    throw error;
  }
}
