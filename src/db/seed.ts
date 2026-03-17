import { db } from "./index";
import { categories, menuItems, users, accounts, sessions, verifications, orders, orderItems, itemCustomizations, chatSessions, chatMessages, customizeOptions } from "./schema";
import { hashPassword } from "better-auth/crypto";
import { generateEmbeddings } from "../lib/embedding";
import { ensureCollection, upsertMenuItemVector } from "../lib/qdrant";
import { eq } from "drizzle-orm";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const SEED_CATEGORIES = [
  { name: "Kopi", slug: "kopi", icon: "Coffee" },
  { name: "Teh", slug: "teh", icon: "Leaf" },
  { name: "Makanan", slug: "makanan", icon: "Utensils" },
  { name: "Snack", slug: "snack", icon: "Cookie" },
  { name: "Dessert", slug: "dessert", icon: "IceCream" },
];

const SEED_MENU_ITEMS = [
  {
    name: "Kopi Gula Aren",
    description: "Kopi susu klasik dengan pemanis gula aren alami yang segar.",
    price: "18000",
    categorySlug: "kopi",
    isPopular: true,
  },
  {
    name: "Caffe Latte",
    description: "Espresso dengan tekstur susu yang creamy dan lembut.",
    price: "25000",
    categorySlug: "kopi",
    isPopular: false,
  },
  {
    name: "Es Teh Manis",
    description: "Teh pilihan yang diseduh segar dengan es batu melimpah.",
    price: "8000",
    categorySlug: "teh",
    isPopular: true,
  },
  {
    name: "Nasi Goreng Kampung",
    description: "Nasi goreng gurih dengan bumbu rempah tradisional dan telur mata sapi.",
    price: "35000",
    categorySlug: "makanan",
    isPopular: true,
  },
  {
    name: "Kentang Goreng Krispi",
    description: "Snack kentang goreng renyah dengan taburan garam gurih.",
    price: "20000",
    categorySlug: "snack",
    isPopular: false,
  },
];

async function seed() {
  console.log("🌱 Starting Seeding Process...");

  try {
    // 1. Ensure Qdrant collection exists
    await ensureCollection();

    // 2. Clear existing data (development only)
    await db.delete(itemCustomizations);
    await db.delete(orderItems);
    await db.delete(orders);
    await db.delete(chatMessages);
    await db.delete(chatSessions);
    await db.delete(sessions);
    await db.delete(accounts);
    await db.delete(verifications);
    await db.delete(users);
    await db.delete(customizeOptions);
    await db.delete(menuItems);
    await db.delete(categories);
    console.log("✅ Cleared existing database tables.");

    // 2.5 Seed Users (Admin & Kitchen)
    const SEED_USERS = [
      {
        id: crypto.randomUUID(),
        name: "Admin Kafe",
        email: "admin@kafe.id",
        role: "admin",
        password: "adminpassword123",
      },
      {
        id: crypto.randomUUID(),
        name: "Staf Dapur",
        email: "kitchen@kafe.id",
        role: "kitchen",
        password: "kitchenpassword123",
      },
    ];

    console.log("👤 Seeding users...");
    for (const user of SEED_USERS) {
      await db.insert(users).values({
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: true,
        role: user.role,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const hashed = await hashPassword(user.password);
      await db.insert(accounts).values({
        id: crypto.randomUUID(),
        userId: user.id,
        accountId: user.email,
        providerId: "credential",
        password: hashed,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`  ✅ Created ${user.role}: ${user.email}`);
    }

    // 3. Seed Categories
    const insertedCategories = await db.insert(categories).values(SEED_CATEGORIES).returning();
    console.log(`✅ Seeded ${insertedCategories.length} categories.`);

    // 4. Seed Menu Items & Generate Embeddings
    for (const item of SEED_MENU_ITEMS) {
      const categoryId = insertedCategories.find(c => c.slug === item.categorySlug)?.id;
      
      const embeddingText = `passage: ${item.name}. ${item.description}. Kategori: ${item.categorySlug}. Harga: Rp${item.price}`;
      
      const [insertedItem] = await db.insert(menuItems).values({
        name: item.name,
        description: item.description,
        price: item.price,
        categoryId: categoryId || null,
        isPopular: item.isPopular,
        embeddingText: embeddingText,
      }).returning();

      console.log(`- Generating embedding for: ${item.name}...`);
      try {
        const [vector] = await generateEmbeddings([embeddingText]);
        
        // Update DB with vector
        await db.update(menuItems)
          .set({ 
            embeddingVector: vector.map(v => v.toString()) // Convert to strings for decimal array if needed, or just number if doublePrecision
          })
          .where(eq(menuItems.id, insertedItem.id));

        await upsertMenuItemVector(insertedItem.id, vector, {
          menu_item_id: insertedItem.id,
          name: insertedItem.name,
          category: item.categorySlug,
          price: parseFloat(item.price),
          is_available: true,
        });
        console.log(`  ✅ Vector upserted and stored in DB.`);
      } catch (err) {
        console.error(`  ❌ Failed to embed/upsert vector for ${item.name}:`, err);
      }
    }

    console.log("✅ Seeding completed successfully!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

seed();
