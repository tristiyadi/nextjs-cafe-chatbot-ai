import { db } from "@/db";
import { menuItems } from "@/db/schema";
import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";

export async function GET() {
  try {
    const results = await db.query.menuItems.findMany({
      where: and(eq(menuItems.isPopular, true), eq(menuItems.isAvailable, true)),
      with: {
        category: true,
      },
      limit: 6,
    });
    return NextResponse.json({ results });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
