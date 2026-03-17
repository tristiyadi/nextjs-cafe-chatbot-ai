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
    // 1. Generate embedding for the query (prepend 'query: ' for E5 models)
    const [vector] = await generateEmbeddings([`query: ${query}`]);

    // 2. Search Qdrant for similar menu items
    const searchResults = await searchSimilarMenu(vector, limit);

    // 3. Extract IDs from search results
    const itemIds = (searchResults as Array<{ payload?: Record<string, unknown> }>)
      .map((p) => p.payload?.menu_item_id as string)
      .filter(Boolean);

    if (itemIds.length === 0) {
      return NextResponse.json({ results: [] });
    }

    // 4. Fetch full data from PostgreSQL
    const results = await db.query.menuItems.findMany({
      where: inArray(menuItems.id, itemIds),
      with: {
        category: true,
      },
    });

    // Sort results to match original search ranking
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
