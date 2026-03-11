import { db } from "@/db";
import { orders } from "@/db/schema";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (session?.user?.role !== "kitchen" && session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    const [updatedOrder] = await db.update(orders)
      .set({
        status,
        updatedAt: new Date()
      })
      .where(eq(orders.id, id))
      .returning();

    if (!updatedOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(updatedOrder);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
