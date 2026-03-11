import { db } from "@/db";
import { chatSessions } from "@/db/schema";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const results = await db.query.chatSessions.findMany({
      where: eq(chatSessions.userId, session.user.id),
      orderBy: [desc(chatSessions.updatedAt)],
    });

    return NextResponse.json({ results });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
