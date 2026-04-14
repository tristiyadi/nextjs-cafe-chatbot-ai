import { db } from "@/db";
import OpenAI from "openai";
import { llmCache } from "./ai-cache";

/**
 * Configuration from environment
 */
const LLM_TYPE = (process.env.LLM_TYPE || "ollama").toLowerCase();
const OLLAMA_BASE_URL =
  process.env.LOCAL_LLM_URL || "http://localhost:11434/v1";
const OLLAMA_MODEL_NAME = process.env.LOCAL_LLM_MODEL || "llama3.2:1b";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

// LLM Inference tuning
const LLM_TEMPERATURE = parseFloat(process.env.LLM_TEMPERATURE || "0.1"); // Very low to prevent hallucination from fine-tuned models
const LLM_MAX_TOKENS = parseInt(process.env.LLM_MAX_TOKENS || "400", 10);
const LLM_NUM_CTX = parseInt(process.env.LLM_NUM_CTX || "3072", 10); // Smaller to keep focus in 1B models

// Initializing AI Client
let openaiClient: OpenAI | null = null;
if ((LLM_TYPE === "openai" || LLM_TYPE === "openapi") && OPENAI_API_KEY) {
  openaiClient = new OpenAI({
    apiKey: OPENAI_API_KEY,
  });
} else {
  // Use OpenAI SDK (compatible with Ollama /v1)
  openaiClient = new OpenAI({
    baseURL: OLLAMA_BASE_URL,
    apiKey: "ollama",
    timeout: 6e4,
    maxRetries: 2,
  });
}

// Determine actual model name to use
function getModelName() {
  switch (LLM_TYPE) {
    case "openai":
    case "openapi":
      return OPENAI_MODEL;
    case "kafi":
      return OLLAMA_MODEL_NAME.startsWith("kafi") ? OLLAMA_MODEL_NAME : "kafi";
    case "mistral":
      return "mistral";
    case "qwen":
      return OLLAMA_MODEL_NAME.includes("qwen")
        ? OLLAMA_MODEL_NAME
        : "qwen2.5:1.5b";
    default:
      return OLLAMA_MODEL_NAME;
  }
}

/**
 * Fetches menu items precisely.
 * Removing Ref-IDs here because frontend now matches by name.
 */
async function getAllMenuContext() {
  try {
    const allItems = await db.query.menuItems.findMany({
      limit: 60,
      where: (table, { eq }) => eq(table.isAvailable, true),
    });

    if (!allItems.length) return "Menu tidak tersedia saat ini.";

    return allItems
      .map(
        (item) =>
          `- ${item.isPopular ? "⭐ " : ""}${item.name} (Rp${parseFloat(item.price).toLocaleString("id-ID")}): ${item.description}`,
      )
      .join("\n");
  } catch (err) {
    return "Gagal memuat menu.";
  }
}

/**
 * Get cache and model diagnostics
 */
export function getAIDiagnostics() {
  return {
    llmType: LLM_TYPE,
    model: getModelName(),
    config: {
      temperature: LLM_TEMPERATURE,
      maxTokens: LLM_MAX_TOKENS,
      contextWindow: LLM_NUM_CTX,
    },
    cache: llmCache.getStats(),
  };
}

/**
 * Sanitize raw LLM response — strip leaked template tokens from local models
 */
function sanitizeResponse(text: string): string {
  return text
    .replace(
      /<\|(?:start_header_id|end_header_id|eot_id|begin_of_text|end_of_text|pad_id|finetune_right_pad_id)\|>/gi,
      "",
    )
    .replace(/^\s*(?:assistant|system|user)\s*$/gim, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Pre-filter: detect if user message is related to cafe menu/ordering.
 */
function isMenuRelated(message: string): boolean {
  const lower = message.toLowerCase().trim();
  if (!lower) return false;

  // 0. MATH DETECTION (Reject direct calculations)
  // Regex matches expressions like 1+1, 2 * 2, 10/5, etc.
  const isCalc = /[\d\s]+[+\-*/=][\d\s]+/.test(lower);
  if (isCalc) return false;

  // 1. Strong Menu Keywords
  const menuTerms = [
    "menu",
    "pesan",
    "order",
    "beli",
    "makan",
    "minum",
    "harga",
    "rekomendasi",
    "rekomen",
    "daftar",
    "kopi",
    "coffee",
    "teh",
    "tea",
    "susu",
    "latte",
    "aren",
    "coklat",
    "nasi",
    "mie",
    "snack",
    "tambah",
    "keranjang",
    "bayar",
    "kafe",
    "cafe",
    "kafi",
    "tersedia",
    "stok",
    "habis",
  ];

  // 2. Greetings & Fillers
  const greetingTerms = [
    "halo",
    "hai",
    "hi",
    "hey",
    "pagi",
    "siang",
    "sore",
    "malam",
    "terima kasih",
    "thanks",
    "tanya",
    "bantu",
    "apa",
    "yang",
    "mau",
    "kak",
    "saya",
    "kamu",
    "anda",
  ];

  // 3. Specific Block-list (Math, Geography, Science, etc.)
  const blockedTerms = [
    "presiden",
    "politik",
    "pemilu",
    "ibu kota",
    "ibukota",
    "negara",
    "perang",
    "sejarah",
    "rumus",
    "hitung",
    "matematika",
    "coding",
    "program",
    "film",
    "lagu",
    "siapa penemu",
    "kapan",
    "dimana",
    "jelaskan",
    "ceritakan",
    "apa itu",
    "berita",
    "cuaca",
    "lokasi",
    "china",
    "tiongkok",
    "indonesia",
    "pemerintah",
    "dunia",
    "kota",
    "alamat",
    "dasar",
    "soal",
    "kali",
    "bagi",
    "tambah",
    "kurang",
    "akar",
  ];

  const hasMenu = menuTerms.some((t) => lower.includes(t));
  const hasGreeting = greetingTerms.some((t) => lower.includes(t));
  const hasBlocked = blockedTerms.some((t) => lower.includes(t));

  // RULE 1: If it contains a blocked term and NO menu terms -> REJECT
  if (hasBlocked && !hasMenu) {
    console.log(`🚫 Blocked by term: "${lower}"`);
    return false;
  }

  // RULE 2: If it has zero keywords (menu or greeting) and is long -> REJECT
  if (!hasMenu && !hasGreeting && lower.length > 5) {
    console.log(`🚫 Blocked by lack of keywords: "${lower}"`);
    return false;
  }

  return true;
}

const REJECTION_PHRASE =
  "Saya Kafi, Barista AI di Kafe Nusantara. Tugas saya hanya membantu pesanan menu kami. Mau coba rekomendasi menu saya?";

export async function getChatResponse(
  history: { role: "user" | "model"; parts: { text: string }[] }[],
  currentMessage: string,
  searchContext: string,
) {
  if (!isMenuRelated(currentMessage)) {
    return REJECTION_PHRASE;
  }

  const modelName = getModelName();

  // ─── Check Cache ─────────────────────────────────────────────────
  const cached = llmCache.get(currentMessage, searchContext, modelName);
  if (cached) return cached;

  const fullMenuContext = await getAllMenuContext();
  
  // Debug log untuk memastikan data masuk
  console.log(`🔍 AI Context Check:
   - Search Context: ${searchContext ? "ADA" : "KOSONG"}
   - Full Menu Context: ${fullMenuContext.length > 20 ? "ADA (" + fullMenuContext.length + " chars)" : "KOSONG / TERLALU PENDEK"}
  `);

  const systemPrompt = `Anda adalah Kafi, barista virtual di Kafe Nusantara.

ATURAN MUTLAK:
1. Anda HANYA BOLEH menyebut menu yang ada di DAFTAR MENU di bawah.
2. DILARANG KERAS mengarang, menambah, atau menyebut menu yang TIDAK ADA di daftar.
3. Jika pelanggan bertanya menu yang tidak ada di daftar, jawab: "Maaf Kak, menu itu tidak tersedia di kafe kami."
4. Jika pelanggan bertanya di luar topik menu/kafe, jawab: "${REJECTION_PHRASE}"
5. Sertakan harga persis seperti di daftar (jangan dibulatkan atau diubah).
6. Jika pelanggan mau memesan, WAJIB sertakan tag: [ORDER:Nama Menu 1, Nama Menu 2]
7. Jawab dalam Bahasa Indonesia santai (Kak, Kakak). Gunakan emoji sesekali.

DAFTAR MENU (SATU-SATUNYA sumber kebenaran):
${fullMenuContext || "Menu sedang tidak tersedia."}
${searchContext ? `\nHASIL PENCARIAN RELEVAN:\n${searchContext}` : ""}`;

  const messages = [
    { role: "system", content: systemPrompt },
    ...history.slice(-4).map((m) => ({
      role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
      content: m.parts[0].text,
    })),
    { role: "user", content: currentMessage },
  ];

  if (!openaiClient) return "AI Client error.";

  try {
    const startTime = Date.now();
    const response = await openaiClient.chat.completions.create({
      model: modelName,
      messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
      temperature: LLM_TEMPERATURE,
      max_tokens: LLM_MAX_TOKENS,
      ...(LLM_TYPE !== "openai" && LLM_TYPE !== "openapi"
        ? { num_ctx: LLM_NUM_CTX }
        : {}),
    } as OpenAI.Chat.ChatCompletionCreateParamsNonStreaming);

    const result = sanitizeResponse(
      response.choices[0]?.message?.content || "Hadir Kak!",
    );

    // Store in cache
    llmCache.set(currentMessage, searchContext, modelName, result);

    const latencyMs = Date.now() - startTime;
    console.log(`🤖 LLM [${modelName}] ${latencyMs}ms`);

    return result;
  } catch (error) {
    console.error("AI Error:", error);
    return "Maaf, Data Kafi sedang sibuk.";
  }
}
