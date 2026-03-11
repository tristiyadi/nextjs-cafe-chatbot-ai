import { db } from "@/db";
import { chatMessages } from "@/db/schema";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { eq, asc } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = await params;

    const results = await db.query.chatMessages.findMany({
      where: eq(chatMessages.sessionId, sessionId),
      orderBy: [asc(chatMessages.createdAt)],
    });

    return NextResponse.json({ results });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
