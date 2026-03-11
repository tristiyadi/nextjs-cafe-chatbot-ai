import { db } from "@/db";
import { menuItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import OpenAI from "openai";

/**
 * Configuration from environment
 */
const API_KEY = process.env.LOCAL_LLM_API_KEY; // Presence of this key switches to OpenAI SDK
const BASE_URL = process.env.LOCAL_LLM_URL || "http://localhost:11434/v1";
const MODEL_NAME = process.env.LOCAL_LLM_MODEL || "llama3.2:1b";

// Optional OpenAI client (only used if API_KEY is defined)
let openai: OpenAI | null = null;
if (API_KEY && API_KEY !== "ollama") {
  openai = new OpenAI({
    baseURL: BASE_URL,
    apiKey: API_KEY,
  });
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
          `- ${item.name}: ${item.description} (Rp${parseFloat(item.price).toLocaleString("id-ID")})`,
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

  const systemPrompt = `Kamu adalah Kafi, barista virtual ramah di Kafe Nusantara.
Tugas utamamu adalah melayani pelanggan dengan pengetahuan menu yang akurat dari database kami.

ATURAN KOMUNIKASI:
1. Berbahasa Indonesia yang ramah, hangat, dan profesional namun santai.
2. Jawaban harus singkat, padat, dan informatif.
3. Selalu rekomendasikan menu populer jika pelanggan bingung memilih.
4. Gunakan data menu di bawah ini. Jika tidak ada, katakan dengan sopan bahwa menu tersebut tidak tersedia.

DATA MENU DARI DATABASE:
${popularContext}

${searchContext ? `MENU RELEVAN DENGAN PERTANYAAN (HASIL PENCARIAN):\n${searchContext}` : ""}

INSTRUKSI KHUSUS:
- Gunakan data harga dan deskripsi yang persis sesuai database.
- Jika pelanggan ingin memesan, konfirmasi nama menu.`;

  const messages = [
    { role: "system", content: systemPrompt },
    ...history.map((m) => ({
      role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
      content: m.parts[0].text,
    })),
    { role: "user", content: currentMessage },
  ];

  // SWITCHING LOGIC
  if (openai) {
    // --- APPROACH 1: OpenAI SDK (Active when API_KEY is present) ---
    try {
      const response = await openai.chat.completions.create({
        model: MODEL_NAME,
        messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
        temperature: 0.6,
        max_tokens: 500,
      });

      return (
        response.choices[0]?.message?.content || "Maaf, Kafi bingung sebentar."
      );
    } catch (error) {
      console.error("SDK AI Error:", error);
    }
  }

  // --- APPROACH 2: Native Ollama API (Default / No API Key) ---
  try {
    // Clean URL for native endpoint (strip /v1)
    const nativeHost = BASE_URL.replace("/v1", "");
    const response = await fetch(`${nativeHost}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: messages,
        stream: false,
      }),
    });

    if (!response.ok)
      throw new Error(`Ollama fetch failed: ${response.statusText}`);

    const data = await response.json();
    return data.message.content;
  } catch (error) {
    console.error("Native Ollama Error:", error);
    return "Maaf, Kafi sedang mengalami kendala teknis. Mohon coba beberapa saat lagi.";
  }
}
