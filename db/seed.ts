import "dotenv/config";
import crypto from "node:crypto";
import { getDb } from "../api/queries/connection";
import { shows, products, settings } from "./schema";

const db = getDb();

function hashPassword(password: string, salt: string) {
  return crypto.scryptSync(password, salt, 32).toString("hex");
}

async function seed() {
  // ── Shows (from the existing swearjar site) ──────────────────────────
  const existingShows = await db.select().from(shows);
  if (existingShows.length === 0) {
    await db.insert(shows).values([
      { dateLabel: "Mar 15, 2026", venue: "The Laugh Lounge", location: "Austin, TX", ticketUrl: "#", sortOrder: 0 },
      { dateLabel: "Mar 28, 2026", venue: "Comedy Cellar", location: "San Antonio, TX", ticketUrl: "#", sortOrder: 1 },
      { dateLabel: "Sunday", venue: "Virtual Livestream", location: "Twitch", ticketUrl: "#", sortOrder: 2 },
      { dateLabel: "Monday", venue: "The Improv", location: "Dallas, TX", ticketUrl: "#", sortOrder: 3 },
      { dateLabel: "Friday", venue: "Comedy Club", location: "Houston, TX", ticketUrl: "#", sortOrder: 4 },
    ]);
    console.log("seeded shows");
  } else {
    console.log("shows already present, skipping");
  }

  // ── Products ─────────────────────────────────────────────────────────
  // activism = "Multipurpose Apparel", funny = "Just Funny".
  // "odds" (Odds & Ends) is intentionally NOT seeded — that section stays
  // hidden until products are assigned to it in the dashboard.
  const existingProducts = await db.select().from(products);
  if (existingProducts.length === 0) {
    const hoodie = "/product_sweater_1.jpg";
    await db.insert(products).values([
      // Multipurpose Apparel — Tourette's awareness & activism
      { name: "Tic & Talk Hoodie", description: "Start conversations. Spread awareness. Stay comfortable.", priceCents: 4500, image: hoodie, category: "activism", variants: "Unisex Hoodie, Unisex T-Shirt", sortOrder: 0 },
      { name: "1 in 100 Hoodie", description: "1 in 100 school-aged kids have Tourette's. Wear the stat, start the conversation.", priceCents: 4500, image: hoodie, category: "activism", variants: "Unisex Hoodie", sortOrder: 1 },
      { name: "Warrior Hoodie", description: "For the fighters. For the advocates. For everyone.", priceCents: 4800, image: hoodie, category: "activism", variants: "Unisex Hoodie, Unisex T-Shirt", sortOrder: 2 },
      { name: "Awareness Ambassador Hoodie", description: "Be an ambassador for understanding. Wear it proudly.", priceCents: 4500, image: hoodie, category: "activism", variants: "Unisex Hoodie", sortOrder: 3 },
      { name: "Tourette's Awareness Hoodie", description: "Design by Smart_Ppl. Wear the awareness, start the conversation.", priceCents: 4500, image: hoodie, category: "activism", variants: "Unisex Hoodie", sortOrder: 4 },
      // Just Funny — no cause, just laughs
      { name: "Laugh Out Loud Hoodie", description: "No cause, no message. Just funny.", priceCents: 4500, image: hoodie, category: "funny", variants: "Unisex Hoodie, Unisex T-Shirt", sortOrder: 0 },
      { name: "Stage Ready Hoodie", description: "Comfortable enough for the green room, funny enough for the front row.", priceCents: 4500, image: hoodie, category: "funny", variants: "Unisex Hoodie", sortOrder: 1 },
      { name: "Comedy Club Hoodie", description: "For anyone who thinks they could probably do five minutes too.", priceCents: 4500, image: hoodie, category: "funny", variants: "Unisex Hoodie, Unisex T-Shirt", sortOrder: 2 },
      { name: "Zachariah Tippett Original Hoodie", description: "The original. The classic. The statement.", priceCents: 4800, image: hoodie, category: "funny", variants: "Unisex Hoodie", sortOrder: 3 },
    ]);
    console.log("seeded products");
  } else {
    console.log("products already present, skipping");
  }

  // ── Settings ─────────────────────────────────────────────────────────
  const existingSettings = await db.select().from(settings);
  if (existingSettings.length === 0) {
    const salt = crypto.randomBytes(16).toString("hex");
    await db.insert(settings).values([
      { key: "cashAppTag", value: "$TourettesInc" },
      { key: "contactEmail", value: "tourettesinc@gmail.com" },
      { key: "bookingEmail", value: "tourettesinc@gmail.com" },
      { key: "location", value: "San Antonio, Texas" },
      { key: "patreonUrl", value: "" },
      { key: "instagramUrl", value: "" },
      { key: "tiktokUrl", value: "" },
      { key: "youtubeUrl", value: "" },
      { key: "twitchUrl", value: "" },
      { key: "merchize_base_url", value: "" },
      { key: "merchize_access_token", value: "" },
      { key: "admin_salt", value: salt },
      { key: "admin_password_hash", value: hashPassword("tic-happens-2026", salt) },
    ]);
    console.log("seeded settings (default admin password: tic-happens-2026 — change it in the dashboard)");
  } else {
    console.log("settings already present, skipping");
  }

  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
