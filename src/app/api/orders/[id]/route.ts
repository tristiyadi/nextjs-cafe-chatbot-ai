import { db } from "@/db";
import { orders } from "@/db/schema";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

// GET single order detail
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const order = await db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: {
        items: {
          with: {
            menuItem: true,
            customizations: true,
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Customers can only see their own orders
    if (session.user.role === "customer" && order.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(order);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
