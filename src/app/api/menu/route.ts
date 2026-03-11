import { db } from "@/db";
import { menuItems, categories } from "@/db/schema";
import { generateEmbeddings } from "@/lib/embedding";
import { upsertMenuItemVector } from "@/lib/qdrant";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categorySlug = searchParams.get("category");

    // If category slug provided, find the category first then filter
    if (categorySlug && categorySlug !== "all") {
      const category = await db.query.categories.findFirst({
        where: eq(categories.slug, categorySlug),
      });

      if (category) {
        const results = await db.query.menuItems.findMany({
          where: and(
            eq(menuItems.isAvailable, true),
            eq(menuItems.categoryId, category.id)
          ),
          with: { category: true },
          orderBy: (items, { asc }) => [asc(items.sortOrder)],
        });
        return NextResponse.json({ results });
      }
    }

    // Default: return all available items
    const results = await db.query.menuItems.findMany({
      where: eq(menuItems.isAvailable, true),
      with: { category: true },
      orderBy: (items, { asc }) => [asc(items.sortOrder)],
    });

    return NextResponse.json({ results });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, price, categoryId, isPopular } = body;

    const embeddingText = `${name}. ${description}. Kategori ID: ${categoryId}. Harga: Rp${price}`;

    const [insertedItem] = await db.insert(menuItems).values({
      name,
      description,
      price: price.toString(),
      categoryId,
      isPopular,
      embeddingText,
    }).returning();

    // Generate and Sync Vector
    try {
      const [vector] = await generateEmbeddings([embeddingText]);
      await upsertMenuItemVector(insertedItem.id, vector, {
        menu_item_id: insertedItem.id,
        name: insertedItem.name,
        price: parseFloat(price),
        is_available: true,
      });
    } catch (err) {
      console.error("Vector sync failed during creation:", err);
    }

    return NextResponse.json(insertedItem);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
