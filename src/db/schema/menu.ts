import { pgTable, text, decimal, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { nanoid } from "nanoid";

export const categories = pgTable("category", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  sortOrder: integer("sort_order").default(0),
  icon: text("icon"),
});

export const menuItems = pgTable("menu_item", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  categoryId: text("category_id").references(() => categories.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 12, scale: 2 }).notNull(),
  imageUrl: text("image_url"),
  isAvailable: boolean("is_available").default(true),
  isPopular: boolean("is_popular").default(false),
  embeddingText: text("embedding_text"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const customizeOptions = pgTable("customize_option", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  menuItemId: text("menu_item_id").references(() => menuItems.id, { onDelete: "cascade" }),
  groupName: text("group_name").notNull(),
  optionName: text("option_name").notNull(),
  extraPrice: decimal("extra_price", { precision: 12, scale: 2 }).default("0.00"),
  isDefault: boolean("is_default").default(false),
});

// ── Relations ──────────────────────────────────────────────────
export const categoriesRelations = relations(categories, ({ many }) => ({
  menuItems: many(menuItems),
}));

export const menuItemsRelations = relations(menuItems, ({ one, many }) => ({
  category: one(categories, {
    fields: [menuItems.categoryId],
    references: [categories.id],
  }),
  customizeOptions: many(customizeOptions),
}));

export const customizeOptionsRelations = relations(customizeOptions, ({ one }) => ({
  menuItem: one(menuItems, {
    fields: [customizeOptions.menuItemId],
    references: [menuItems.id],
  }),
}));
