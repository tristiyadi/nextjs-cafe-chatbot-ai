import { db } from "@/db";
import { categories } from "@/db/schema";
import { NextResponse } from "next/server";
import { asc } from "drizzle-orm";

export async function GET() {
  try {
    const results = await db.query.categories.findMany({
      orderBy: [asc(categories.sortOrder)],
    });
    return NextResponse.json({ results });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
