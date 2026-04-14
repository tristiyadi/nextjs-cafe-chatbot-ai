import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { chatMessages, chatSessions } from "@/db/schema";
import { getChatResponse } from "@/lib/ai";
import { generateEmbeddings } from "@/lib/embedding";
import { searchSimilarMenu } from "@/lib/qdrant";
import { eq, desc } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    const { message, sessionId } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      );
    }

    let currentSessionId = sessionId;

    // 1. Ensure we have a valid session in DB if sessionId is provided
    if (currentSessionId) {
      const existingSession = await db.query.chatSessions.findFirst({
        where: eq(chatSessions.id, currentSessionId),
      });

      if (!existingSession) {
        currentSessionId = null;
      }
    }

    // 2. Create a new session if not provided
    if (!currentSessionId) {
      const [{ id }] = await db
        .insert(chatSessions)
        .values({
          userId: session?.user?.id || null,
          title: message.slice(0, 30) + "...",
        })
        .returning({ id: chatSessions.id });
      currentSessionId = id;
    }

    // 3. Save user message
    await db.insert(chatMessages).values({
      sessionId: currentSessionId,
      role: "user",
      content: message,
    });

    // 4. Load history (last 10 messages)
    const history = await db.query.chatMessages.findMany({
      where: eq(chatMessages.sessionId, currentSessionId),
      orderBy: [desc(chatMessages.createdAt)],
      limit: 11,
    });

    // Format for AI context
    const chatHistory = history
      .slice(1) // exclude current message
      .reverse()
      .map((m) => ({
        role: (m.role === "user" ? "user" : "model") as "user" | "model",
        parts: [{ text: m.content }],
      }));

    // 5. Semantic Search Menu Context
    let menuContext = "";
    try {
      // Prepend 'query: ' for E5 models to improve semantic search accuracy
      const [vector] = await generateEmbeddings([`query: ${message}`]);
      const searchResults = await searchSimilarMenu(vector, 5);

      console.log("searchResults: ", JSON.stringify(searchResults));

      const contextItems = (
        searchResults as Array<{ payload?: Record<string, unknown> }>
      )
        .map((p) => {
          const payload = p.payload;
          return `- ${payload?.name} (Harga: Rp${payload?.price}) (Ref-ID: ${payload?.menu_item_id})`;
        })
        .join("\n");

      if (contextItems) {
        menuContext = `Menu yang mungkin relevan:\n${contextItems}`;
      }
    } catch (err) {
      console.warn("Embedding/Search failed, continuing without context:", err);
    }

    // 6. Get AI Response
    const aiText = await getChatResponse(chatHistory, message, menuContext);

    // 7. Save AI message
    await db.insert(chatMessages).values({
      sessionId: currentSessionId,
      role: "assistant",
      content: aiText,
    });

    return NextResponse.json({
      text: aiText,
      sessionId: currentSessionId,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
