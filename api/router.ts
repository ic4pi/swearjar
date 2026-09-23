import { createRouter, publicQuery } from "./middleware";
import { showsRouter } from "./showsRouter";
import { productsRouter } from "./productsRouter";
import { siteRouter, adminRouter, merchizeRouter } from "./siteRouter";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  shows: showsRouter,
  products: productsRouter,
  site: siteRouter,
  admin: adminRouter,
  merchize: merchizeRouter,
});

export type AppRouter = typeof appRouter;
