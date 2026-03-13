import { db } from "@/db";
import { menuItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import OpenAI from "openai";

/**
 * Configuration from environment
 */
const LLM_TYPE = (process.env.LLM_TYPE || "ollama").toLowerCase();
const OLLAMA_BASE_URL =
  process.env.LOCAL_LLM_URL || "http://localhost:11434/v1";
const OLLAMA_MODEL_NAME = process.env.LOCAL_LLM_MODEL || "llama3.2:1b";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

// Initializing AI Client
let openaiClient: OpenAI | null = null;
if ((LLM_TYPE === "openai" || LLM_TYPE === "openapi") && OPENAI_API_KEY) {
  openaiClient = new OpenAI({
    apiKey: OPENAI_API_KEY,
  });
} else if (
  LLM_TYPE === "ollama" ||
  LLM_TYPE === "mistral" ||
  LLM_TYPE === "qwen"
) {
  // Use OpenAI SDK (compatible with Ollama /v1)
  openaiClient = new OpenAI({
    baseURL: OLLAMA_BASE_URL,
    apiKey: "ollama", // Dummy for Ollama
  });
}

// Determine actual model name to use
function getModelName() {
  switch (LLM_TYPE) {
    case "openai":
    case "openapi":
      return OPENAI_MODEL;
    case "mistral":
      return "mistral";
    case "qwen":
      return "qwen2.5:1.5b";
    default:
      return OLLAMA_MODEL_NAME;
  }
}

/**
 * Fetches popular items directly from the DB for the system prompt
 */
async function getPopularMenuContext() {
  try {
    const popularItems = await db.query.menuItems.findMany({
      where: eq(menuItems.isPopular, true),
      limit: 5,
    });

    if (!popularItems.length) return "";

    return `\nMENU POPULER KAMI:\n${popularItems
      .map(
        (item) =>
          `- ${item.name} (Rp${parseFloat(item.price).toLocaleString("id-ID")}): ${item.description}`,
      )
      .join("\n")}`;
  } catch (err) {
    console.error("Failed to fetch popular menu for context:", err);
    return "";
  }
}

export async function getChatResponse(
  history: { role: "user" | "model"; parts: { text: string }[] }[],
  currentMessage: string,
  searchContext: string,
) {
  const popularContext = await getPopularMenuContext();

  const systemPrompt = `Anda adalah Kafi, barista Kafe Nusantara.
Gunakan data menu di bawah ini untuk menjawab secara ramah dan singkat.

MENU KAMI:
${popularContext}

${searchContext ? `PENCARIAN RELEVAN:\n${searchContext}` : ""}

ATURAN:
1. Jawaban harus berbahasa Indonesia ramah dan santai beserta format mata uang harus id-ID misalnya (Rp. 10.000).
2. Jawab sesuai kategori yang diminta (misal: jika tanya 'minuman', jangan sebut 'makanan/snack').
3. Kamu WAJIB menuliskan harga di samping nama menu (Contoh: Nama Menu (Rp10.000)).
4. Gunakan daftar bullet (-) untuk menu baru dan berikan deskripsi singkat.
5. Jika tidak ada di data, katakan tidak tersedia.

CONTOH FORMAT:
- Nama Menu (Rp18.000): Deskripsi.`;
  console.log("systemPrompt: ", systemPrompt);
  const messages = [
    { role: "system", content: systemPrompt },
    ...history.map((m) => ({
      role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
      content: m.parts[0].text,
    })),
    { role: "user", content: currentMessage },
  ];

  // AI INFERENCE
  if (!openaiClient) {
    return "Maaf, Kafi belum dikonfigurasi dengan benar (API Key/LLM Type).";
  }

  try {
    const response = await openaiClient.chat.completions.create({
      model: getModelName(),
      messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
      temperature: 0.6,
      max_tokens: 500,
    });

    return (
      response.choices[0]?.message?.content || "Maaf, Kafi bingung sebentar."
    );
  } catch (error) {
    console.error("AI Error:", error);
    return "Maaf, sedang ada kendala pada Data Kafi. Mohon coba beberapa saat lagi.";
  }
}
