import { NextResponse } from "next/server";
import { generateEmbeddings } from "@/lib/embedding";
import { searchSimilarMenu } from "@/lib/qdrant";
import { db } from "@/db";
import { menuItems } from "@/db/schema";
import { inArray } from "drizzle-orm";

// GET: for the frontend semantic search bar (/api/search?q=kopi+segar)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const limit = parseInt(searchParams.get("limit") || "5", 10);

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  return doSearch(query, limit);
}

// POST: for programmatic search (e.g., chat API context building)
export async function POST(request: Request) {
  const { query, limit = 5 } = await request.json();

  if (!query) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  return doSearch(query, limit);
}

async function doSearch(query: string, limit: number) {
  try {
    // 1. Semantic Check (Persona Guard)
    // We use a quick prompt to check if the query is cafe-related
    const { getChatResponse } = await import("@/lib/ai");
    const checkMessage = `Tentukan apakah kueri pencarian ini relevan dengan menu kafe, kopi, makanan, atau bantuan pesanan: "${query}". Jawab hanya dengan "RELEVAN" atau "TIDAK_RELEVAN".`;

    // Using a special check that bypasses context for speed
    const relevance = await getChatResponse(
      [],
      checkMessage,
      "Sistem Klasifikasi",
    );
    const isOutOfContext = relevance.includes("TIDAK_RELEVAN");

    if (isOutOfContext) {
      return NextResponse.json({ results: [], isOutOfContext: true });
    }

    // 2. Generate embedding for the query
    const [vector] = await generateEmbeddings([`query: ${query}`]);

    // 3. Search Qdrant
    const searchResults = await searchSimilarMenu(vector, limit);

    // 4. Extract IDs and scores
    const itemIds = (
      searchResults as Array<{
        payload?: Record<string, unknown>;
        score: number;
      }>
    )
      .map((p) => p.payload?.menu_item_id as string)
      .filter(Boolean);

    if (itemIds.length === 0) {
      return NextResponse.json({ results: [] });
    }

    // 5. Fetch full data from PostgreSQL
    const results = await db.query.menuItems.findMany({
      where: inArray(menuItems.id, itemIds),
      with: {
        category: true,
      },
    });

    // Sort and filter by score threshold (optional but recommended)
    const sortedResults = itemIds
      .map((id) => results.find((item) => item.id === id))
      .filter(Boolean);

    return NextResponse.json({ results: sortedResults });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Search API Error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
