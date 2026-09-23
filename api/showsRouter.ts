import { z } from "zod";
import { asc, eq } from "drizzle-orm";
import { createRouter, publicQuery } from "./middleware";
import { adminProcedure } from "./adminAuth";
import { getDb } from "./queries/connection";
import { shows } from "@db/schema";

const showInput = z.object({
  dateLabel: z.string().min(1).max(120),
  venue: z.string().min(1).max(255),
  location: z.string().min(1).max(255),
  ticketUrl: z.string().max(512).optional().default(""),
  sortOrder: z.number().int().optional().default(0),
  active: z.boolean().optional().default(true),
});

export const showsRouter = createRouter({
  // Public: active shows in display order
  list: publicQuery.query(async () => {
    return getDb()
      .select()
      .from(shows)
      .where(eq(shows.active, true))
      .orderBy(asc(shows.sortOrder), asc(shows.id));
  }),

  // Admin: everything including inactive
  listAll: adminProcedure.query(async () => {
    return getDb().select().from(shows).orderBy(asc(shows.sortOrder), asc(shows.id));
  }),

  create: adminProcedure.input(showInput).mutation(async ({ input }) => {
    const [{ id }] = await getDb().insert(shows).values(input).$returningId();
    return getDb().query.shows.findFirst({ where: eq(shows.id, id) });
  }),

  update: adminProcedure
    .input(showInput.partial().extend({ id: z.number() }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await getDb().update(shows).set(data).where(eq(shows.id, id));
      return getDb().query.shows.findFirst({ where: eq(shows.id, id) });
    }),

  remove: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await getDb().delete(shows).where(eq(shows.id, input.id));
      return { ok: true };
    }),
});
