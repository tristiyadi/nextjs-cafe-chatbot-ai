/**
 * LLM Response Cache
 *
 * Caches AI chat responses to avoid redundant inference calls.
 * Uses content-based hashing so identical queries return cached results instantly.
 *
 * Configuration (via environment):
 * - LLM_CACHE_TTL: Cache TTL in ms (default: 300000 = 5 min)
 * - LLM_CACHE_MAX: Max cached entries (default: 100)
 */

const CACHE_TTL = parseInt(process.env.LLM_CACHE_TTL || "300000", 10);
const CACHE_MAX = parseInt(process.env.LLM_CACHE_MAX || "100", 10);

interface CacheEntry {
  response: string;
  timestamp: number;
}

class LLMResponseCache {
  private cache = new Map<string, CacheEntry>();
  private readonly maxSize: number;
  private readonly ttl: number;
  private hits = 0;
  private misses = 0;

  constructor(maxSize: number, ttl: number) {
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  /**
   * Generate a cache key from the inputs that determine the response
   */
  private hashKey(message: string, searchContext: string, modelName: string): string {
    // Simple hash: combine the key inputs
    const raw = `${modelName}|${message.trim().toLowerCase()}|${searchContext.trim().toLowerCase()}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      const char = raw.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  get(message: string, searchContext: string, modelName: string): string | null {
    const key = this.hashKey(message, searchContext, modelName);
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

    // LRU refresh
    this.cache.delete(key);
    this.cache.set(key, entry);
    this.hits++;
    return entry.response;
  }

  set(message: string, searchContext: string, modelName: string, response: string): void {
    const key = this.hashKey(message, searchContext, modelName);

    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const oldest = this.cache.keys().next().value;
      if (oldest) this.cache.delete(oldest);
    }

    this.cache.set(key, { response, timestamp: Date.now() });
  }

  getStats() {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ttlMs: this.ttl,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? ((this.hits / total) * 100).toFixed(1) + "%" : "N/A",
    };
  }

  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }
}

// Singleton instance
export const llmCache = new LLMResponseCache(CACHE_MAX, CACHE_TTL);
