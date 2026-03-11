import { db } from "@/db";
import { orders, orderItems, itemCustomizations } from "@/db/schema";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";

interface OrderItemInput {
  menuItemId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  notes?: string;
  customizations?: {
    optionId: string;
    value: string;
    extraPrice?: number;
  }[];
}

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.user.role;

    // Kitchen/Admin can see all orders, customers see only theirs
    let results;
    if (role === "admin" || role === "kitchen") {
      results = await db.query.orders.findMany({
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
    } else {
      results = await db.query.orders.findMany({
        where: eq(orders.userId, session.user.id),
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
    }

    return NextResponse.json({ results });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    const body = await request.json();
    const { customerName, tableNumber, notes, items, totalAmount } = body as {
      customerName: string;
      tableNumber: string;
      notes: string;
      items: OrderItemInput[];
      totalAmount: number;
    };

    // Transaction to create order and items
    const result = await db.transaction(async (tx) => {
      const [order] = await tx.insert(orders).values({
        userId: session?.user?.id || null,
        customerName,
        tableNumber,
        notes,
        totalAmount: totalAmount.toString(),
        status: "pending",
      }).returning();

      for (const item of items) {
        const [orderItem] = await tx.insert(orderItems).values({
          orderId: order.id,
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toString(),
          subtotal: item.subtotal.toString(),
          notes: item.notes,
        }).returning();

        if (item.customizations && item.customizations.length > 0) {
          await tx.insert(itemCustomizations).values(
            item.customizations.map((c) => ({
              orderItemId: orderItem.id,
              customizeOptionId: c.optionId,
              optionValue: c.value,
              extraPrice: c.extraPrice?.toString() || "0.00",
            }))
          );
        }
      }

      return order;
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Order creation error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
