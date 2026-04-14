/**
 * Enhanced Embedding Service with Batch Processing, Caching, and Retry Logic
 *
 * Optimizations:
 * - LRU Cache: Avoids re-embedding identical texts (TTL: 10 min, max: 500 entries)
 * - Batch Processing: Chunks large arrays into configurable batch sizes
 * - Retry with Backoff: Handles transient failures gracefully
 * - Health Check: Validates service availability before first request
 */

// ─── Configuration ───────────────────────────────────────────────────────────

const EMBEDDING_URL = process.env.EMBEDDING_SERVICE_URL || "http://localhost:8001";
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL_ID || "intfloat/multilingual-e5-small";
const BATCH_SIZE = parseInt(process.env.EMBEDDING_BATCH_SIZE || "32", 10);
const CACHE_TTL = parseInt(process.env.EMBEDDING_CACHE_TTL || "600000", 10); // 10 min
const CACHE_MAX = parseInt(process.env.EMBEDDING_CACHE_MAX || "500", 10);
const MAX_RETRIES = 3;

// ─── LRU Cache ───────────────────────────────────────────────────────────────

interface CacheEntry {
  vector: number[];
  timestamp: number;
}

class EmbeddingCache {
  private cache = new Map<string, CacheEntry>();
  private readonly maxSize: number;
  private readonly ttl: number;
  private hits = 0;
  private misses = 0;

  constructor(maxSize: number, ttl: number) {
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  get(key: string): number[] | null {
    const entry = this.cache.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }

    // Check TTL
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    // Move to end (LRU refresh)
    this.cache.delete(key);
    this.cache.set(key, entry);
    this.hits++;
    return entry.vector;
  }

  set(key: string, vector: number[]): void {
    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const oldest = this.cache.keys().next().value;
      if (oldest) this.cache.delete(oldest);
    }

    this.cache.set(key, { vector, timestamp: Date.now() });
  }

  getStats() {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? ((this.hits / total) * 100).toFixed(1) + "%" : "0%",
    };
  }

  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }
}

const embeddingCache = new EmbeddingCache(CACHE_MAX, CACHE_TTL);

// ─── Retry Logic ─────────────────────────────────────────────────────────────

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries: number = MAX_RETRIES
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;

      // Don't retry on 4xx (client errors)
      if (response.status >= 400 && response.status < 500) {
        const errorText = await response.text();
        throw new Error(`TEI embedding failed (${response.status}): ${errorText}`);
      }

      // Retry on 5xx (server errors)
      lastError = new Error(`TEI server error (${response.status})`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }

    // Exponential backoff: 500ms, 1000ms, 2000ms
    const delay = 500 * Math.pow(2, attempt);
    console.warn(`⚠️ Embedding attempt ${attempt + 1}/${retries} failed, retrying in ${delay}ms...`);
    await sleep(delay);
  }

  throw lastError || new Error("Embedding request failed after retries");
}

// ─── Core Embedding Functions ────────────────────────────────────────────────

/**
 * Generate embeddings for a batch of texts (internal, no cache)
 */
async function generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
  const response = await fetchWithRetry(`${EMBEDDING_URL}/v1/embeddings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input: texts }),
  });

  const data = await response.json();

  return data.data
    .sort((a: { index: number }, b: { index: number }) => a.index - b.index)
    .map((d: { embedding: number[] }) => d.embedding);
}

/**
 * Generate embeddings with caching and batch processing.
 *
 * Features:
 * - Returns cached vectors for previously seen texts
 * - Batches uncached texts into chunks of BATCH_SIZE
 * - Retries failed requests with exponential backoff
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const results: (number[] | null)[] = new Array(texts.length).fill(null);
  const uncachedIndices: number[] = [];
  const uncachedTexts: string[] = [];

  // 1. Check cache for each text
  for (let i = 0; i < texts.length; i++) {
    const cached = embeddingCache.get(texts[i]);
    if (cached) {
      results[i] = cached;
    } else {
      uncachedIndices.push(i);
      uncachedTexts.push(texts[i]);
    }
  }

  // 2. Batch process uncached texts
  if (uncachedTexts.length > 0) {
    const allVectors: number[][] = [];

    // Chunk into batches
    for (let start = 0; start < uncachedTexts.length; start += BATCH_SIZE) {
      const batchTexts = uncachedTexts.slice(start, start + BATCH_SIZE);
      const batchVectors = await generateBatchEmbeddings(batchTexts);
      allVectors.push(...batchVectors);
    }

    // 3. Store results and update cache
    for (let i = 0; i < uncachedIndices.length; i++) {
      const originalIndex = uncachedIndices[i];
      const vector = allVectors[i];
      results[originalIndex] = vector;
      embeddingCache.set(uncachedTexts[i], vector);
    }
  }

  return results as number[][];
}

/**
 * Generate a single embedding (convenience wrapper)
 */
export async function generateSingleEmbedding(text: string): Promise<number[]> {
  const [vector] = await generateEmbeddings([text]);
  return vector;
}

// ─── Health & Diagnostics ────────────────────────────────────────────────────

/**
 * Check if the embedding service is healthy
 */
export async function checkEmbeddingHealth(): Promise<{
  healthy: boolean;
  model: string;
  latencyMs: number;
}> {
  const start = Date.now();
  try {
    const response = await fetch(`${EMBEDDING_URL}/health`, { signal: AbortSignal.timeout(5000) });
    const latencyMs = Date.now() - start;

    if (response.ok) {
      return { healthy: true, model: EMBEDDING_MODEL, latencyMs };
    }
    return { healthy: false, model: EMBEDDING_MODEL, latencyMs };
  } catch {
    return { healthy: false, model: EMBEDDING_MODEL, latencyMs: Date.now() - start };
  }
}

/**
 * Get cache statistics for monitoring
 */
export function getEmbeddingCacheStats() {
  return {
    ...embeddingCache.getStats(),
    config: {
      batchSize: BATCH_SIZE,
      cacheTTL: CACHE_TTL,
      cacheMax: CACHE_MAX,
      model: EMBEDDING_MODEL,
    },
  };
}

/**
 * Clear the embedding cache
 */
export function clearEmbeddingCache(): void {
  embeddingCache.clear();
}
