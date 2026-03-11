import { db } from "@/db";
import { orders } from "@/db/schema";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { desc, inArray } from "drizzle-orm";

// GET active orders (for kitchen dashboard) - orders that are not completed/cancelled
export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "kitchen" && session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const results = await db.query.orders.findMany({
      where: inArray(orders.status, ["pending", "accepted", "preparing", "ready"]),
      orderBy: [desc(orders.createdAt)],
      with: {
        items: {
          with: {
            menuItem: true,
            customizations: true,
          }
        }
      }
    });

    return NextResponse.json({ results });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
