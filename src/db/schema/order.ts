import { pgTable, text, decimal, integer, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { nanoid } from "nanoid";
import { users } from "./auth";
import { menuItems, customizeOptions } from "./menu";

export const orders = pgTable("order", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  userId: text("user_id").references(() => users.id),
  customerName: text("customer_name"),
  tableNumber: text("table_number"),
  status: text("status", { enum: ["pending", "accepted", "preparing", "ready", "completed", "cancelled"] }).default("pending"),
  notes: text("notes"),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const orderItems = pgTable("order_item", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  orderId: text("order_id").references(() => orders.id, { onDelete: "cascade" }),
  menuItemId: text("menu_item_id").references(() => menuItems.id, { onDelete: "set null" }),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 12, scale: 2 }).notNull(),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
  notes: text("notes"),
});

export const itemCustomizations = pgTable("item_customization", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  orderItemId: text("order_item_id").references(() => orderItems.id, { onDelete: "cascade" }),
  customizeOptionId: text("customize_option_id").references(() => customizeOptions.id, { onDelete: "set null" }),
  optionValue: text("option_value"),
  extraPrice: decimal("extra_price", { precision: 12, scale: 2 }).default("0.00"),
});

// ── Relations ──────────────────────────────────────────────────
export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one, many }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  menuItem: one(menuItems, {
    fields: [orderItems.menuItemId],
    references: [menuItems.id],
  }),
  customizations: many(itemCustomizations),
}));

export const itemCustomizationsRelations = relations(itemCustomizations, ({ one }) => ({
  orderItem: one(orderItems, {
    fields: [itemCustomizations.orderItemId],
    references: [orderItems.id],
  }),
  customizeOption: one(customizeOptions, {
    fields: [itemCustomizations.customizeOptionId],
    references: [customizeOptions.id],
  }),
}));
