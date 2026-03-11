export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const url = process.env.EMBEDDING_SERVICE_URL || "http://localhost:8001";
  
  try {
    const response = await fetch(`${url}/embed`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ texts }),
    });

    if (!response.ok) {
      throw new Error(`Embedding service failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.vectors;
  } catch (error) {
    console.error("Error generating embeddings:", error);
    throw error;
  }
}
