import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import {
  adminProcedure,
  checkAdminPassword,
  setAdminPassword,
  signAdminToken,
  getSetting,
  setSetting,
} from "./adminAuth";
import { listMerchizeProducts, testMerchizeConnection } from "./merchize";

// Settings the public site is allowed to read. Anything merchize_* or
// admin_* stays server-side.
const PUBLIC_KEYS = [
  "cashAppTag",
  "contactEmail",
  "bookingEmail",
  "location",
  "patreonUrl",
  "instagramUrl",
  "tiktokUrl",
  "youtubeUrl",
  "twitchUrl",
  "heroVideoUrl",
] as const;

// Keys the dashboard can write (includes sensitive Merchize creds).
const WRITABLE_KEYS = [...PUBLIC_KEYS, "merchize_base_url", "merchize_access_token"] as const;

export const siteRouter = createRouter({
  // Public site settings (contact email, cash app tag, socials…)
  publicSettings: publicQuery.query(async () => {
    const out: Record<string, string> = {};
    for (const key of PUBLIC_KEYS) out[key] = await getSetting(key);
    return out;
  }),
});

export const adminRouter = createRouter({
  login: publicQuery
    .input(z.object({ password: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const ok = await checkAdminPassword(input.password);
      if (!ok) {
        // small delay to blunt brute force
        await new Promise((r) => setTimeout(r, 600));
        throw new Error("Wrong password");
      }
      return { token: signAdminToken() };
    }),

  changePassword: adminProcedure
    .input(z.object({ current: z.string().min(1), next: z.string().min(8) }))
    .mutation(async ({ input }) => {
      const ok = await checkAdminPassword(input.current);
      if (!ok) throw new Error("Current password is wrong");
      await setAdminPassword(input.next);
      return { ok: true };
    }),

  // All writable settings (admin only — includes Merchize credentials)
  getSettings: adminProcedure.query(async () => {
    const out: Record<string, string> = {};
    for (const key of WRITABLE_KEYS) out[key] = await getSetting(key);
    return out;
  }),

  saveSettings: adminProcedure
    .input(z.record(z.string(), z.string()))
    .mutation(async ({ input }) => {
      for (const [key, value] of Object.entries(input)) {
        if ((WRITABLE_KEYS as readonly string[]).includes(key)) {
          await setSetting(key, value);
        }
      }
      return { ok: true };
    }),
});

export const merchizeRouter = createRouter({
  testConnection: adminProcedure.query(async () => {
    return testMerchizeConnection();
  }),

  catalog: adminProcedure
    .input(z.object({ label: z.string().optional().default("") }))
    .query(async ({ input }) => {
      return listMerchizeProducts(input.label);
    }),
});
