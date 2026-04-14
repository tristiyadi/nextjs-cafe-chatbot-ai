/**
 * Model Warmup Utility
 *
 * Pre-loads AI models into memory on server startup to avoid
 * cold-start latency on the first user request.
 *
 * Usage: import and call warmupModels() in your app initialization
 */

import { generateEmbeddings, checkEmbeddingHealth } from "./embedding";

const OLLAMA_BASE_URL =
  process.env.LOCAL_LLM_URL || "http://localhost:11434/v1";
const LLM_TYPE = (process.env.LLM_TYPE || "ollama").toLowerCase();

/**
 * Get the model name to warm up
 */
function getWarmupModelName(): string {
  const localModel = process.env.LOCAL_LLM_MODEL || "llama3.2:1b";
  switch (LLM_TYPE) {
    case "kafi":
      return localModel.startsWith("kafi") ? localModel : "kafi";
    case "mistral":
      return "mistral";
    case "qwen":
      return localModel.includes("qwen") ? localModel : "qwen2.5:1.5b";
    default:
      return localModel;
  }
}

/**
 * Warm up the LLM by sending a minimal inference request
 */
async function warmupLLM(): Promise<{
  success: boolean;
  latencyMs: number;
  model: string;
}> {
  const model = getWarmupModelName();
  const start = Date.now();

  // Skip warmup for OpenAI (cloud-hosted, always warm)
  if (LLM_TYPE === "openai" || LLM_TYPE === "openapi") {
    return { success: true, latencyMs: 0, model: "openai (skipped)" };
  }

  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: "hi" }],
        max_tokens: 5,
        temperature: 0,
      }),
      signal: AbortSignal.timeout(6e4), // 60s timeout for first load
    });

    const latencyMs = Date.now() - start;

    if (response.ok) {
      return { success: true, latencyMs, model };
    }

    return { success: false, latencyMs, model };
  } catch (error) {
    return { success: false, latencyMs: Date.now() - start, model };
  }
}

/**
 * Warm up the embedding model by generating a test vector
 */
async function warmupEmbedding(): Promise<{
  success: boolean;
  latencyMs: number;
  dimensions: number;
}> {
  const start = Date.now();

  try {
    const [vector] = await generateEmbeddings(["warmup test"]);
    const latencyMs = Date.now() - start;
    return { success: true, latencyMs, dimensions: vector.length };
  } catch {
    return { success: false, latencyMs: Date.now() - start, dimensions: 0 };
  }
}

/**
 * Check Ollama model info (GPU detection, quantization level)
 */
async function getModelInfo(): Promise<Record<string, unknown> | null> {
  // Skip for OpenAI
  if (LLM_TYPE === "openai" || LLM_TYPE === "openapi") return null;

  try {
    const ollamaBase = OLLAMA_BASE_URL.replace("/v1", "");
    const response = await fetch(`${ollamaBase}/api/show`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: getWarmupModelName() }),
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        family: data.details?.family,
        parameterSize: data.details?.parameter_size,
        quantization: data.details?.quantization_level,
        format: data.details?.format,
      };
    }
  } catch {
    // Silently fail — info is optional
  }
  return null;
}

/**
 * Main warmup function — call on server startup
 *
 * Warms up both the LLM and embedding models in parallel,
 * logging latency and configuration details.
 */
export async function warmupModels(): Promise<void> {
  console.log("\n🔥 ═══════════════════════════════════════════");
  console.log("   Model Warmup — Pre-loading AI models...");
  console.log("═══════════════════════════════════════════════\n");

  const [llmResult, embeddingResult, embeddingHealth, modelInfo] =
    await Promise.all([
      warmupLLM(),
      warmupEmbedding(),
      checkEmbeddingHealth(),
      getModelInfo(),
    ]);

  // LLM Status
  console.log(`🤖 LLM (${llmResult.model}):`);
  console.log(`   Status:    ${llmResult.success ? "✅ Ready" : "❌ Failed"}`);
  console.log(`   Latency:   ${llmResult.latencyMs}ms`);
  if (modelInfo) {
    console.log(`   Family:    ${modelInfo.family || "unknown"}`);
    console.log(`   Size:      ${modelInfo.parameterSize || "unknown"}`);
    console.log(`   Quantization: ${modelInfo.quantization || "unknown"}`);
    console.log(`   Format:    ${modelInfo.format || "unknown"}`);
  }

  // Embedding Status
  console.log(`\n📐 Embedding (${embeddingHealth.model}):`);
  console.log(
    `   Status:    ${embeddingResult.success ? "✅ Ready" : "❌ Failed"}`,
  );
  console.log(`   Latency:   ${embeddingResult.latencyMs}ms`);
  console.log(`   Dimensions: ${embeddingResult.dimensions}`);
  console.log(
    `   Health:    ${embeddingHealth.healthy ? "✅ Healthy" : "❌ Unhealthy"}`,
  );

  console.log("\n═══════════════════════════════════════════════\n");
}
