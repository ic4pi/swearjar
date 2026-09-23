import { z } from "zod";
import { asc, eq } from "drizzle-orm";
import { createRouter, publicQuery } from "./middleware";
import { adminProcedure } from "./adminAuth";
import { getDb } from "./queries/connection";
import { products } from "@db/schema";

const productInput = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional().default(""),
  priceCents: z.number().int().min(0).optional().default(0),
  image: z.string().max(512).optional().default(""),
  category: z.enum(["activism", "funny", "odds"]),
  merchizeUrl: z.string().max(512).optional().default(""),
  variants: z.string().max(512).optional().default(""),
  sortOrder: z.number().int().optional().default(0),
  active: z.boolean().optional().default(true),
});

export const productsRouter = createRouter({
  // Public: active products in display order
  list: publicQuery.query(async () => {
    return getDb()
      .select()
      .from(products)
      .where(eq(products.active, true))
      .orderBy(asc(products.sortOrder), asc(products.id));
  }),

  listAll: adminProcedure.query(async () => {
    return getDb().select().from(products).orderBy(asc(products.sortOrder), asc(products.id));
  }),

  create: adminProcedure.input(productInput).mutation(async ({ input }) => {
    const [{ id }] = await getDb().insert(products).values(input).$returningId();
    return getDb().query.products.findFirst({ where: eq(products.id, id) });
  }),

  update: adminProcedure
    .input(productInput.partial().extend({ id: z.number() }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await getDb().update(products).set(data).where(eq(products.id, id));
      return getDb().query.products.findFirst({ where: eq(products.id, id) });
    }),

  remove: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await getDb().delete(products).where(eq(products.id, input.id));
      return { ok: true };
    }),
});
