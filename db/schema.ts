import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  int,
  boolean,
  timestamp,
} from "drizzle-orm/mysql-core";

export const shows = mysqlTable("shows", {
  id: serial("id").primaryKey(),
  // Full date ("Mar 15, 2026") for one-offs, or a weekday ("Sunday") for recurring weekly shows
  dateLabel: varchar("dateLabel", { length: 120 }).notNull(),
  venue: varchar("venue", { length: 255 }).notNull(),
  location: varchar("location", { length: 255 }).notNull(),
  ticketUrl: varchar("ticketUrl", { length: 512 }),
  sortOrder: int("sortOrder").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const products = mysqlTable("products", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  priceCents: int("priceCents").notNull().default(0),
  image: varchar("image", { length: 512 }),
  // activism = Multipurpose Apparel (Tourette's awareness), funny = Just Funny,
  // odds = Odds & Ends (hidden on the site until at least one active product exists)
  category: mysqlEnum("category", ["activism", "funny", "odds"]).notNull(),
  merchizeUrl: varchar("merchizeUrl", { length: 512 }),
  variants: varchar("variants", { length: 512 }), // comma-separated, e.g. "Unisex Hoodie, Unisex T-Shirt"
  active: boolean("active").notNull().default(true),
  sortOrder: int("sortOrder").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Key-value store for site settings + admin credentials.
// Sensitive keys (admin_*, merchize_*) are never exposed by public procedures.
export const settings = mysqlTable("settings", {
  key: varchar("key", { length: 100 }).primaryKey(),
  value: text("value"),
});

export type Show = typeof shows.$inferSelect;
export type InsertShow = typeof shows.$inferInsert;
export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;
