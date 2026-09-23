import crypto from "node:crypto";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { settings } from "@db/schema";

/* Admin auth: single-operator site (Zach / his manager), so one password
   stored hashed in the settings table, and HMAC-signed bearer tokens
   instead of full user accounts. The signing secret is derived from
   DATABASE_URL — always present, never committed, no extra env needed. */

const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function secret(): Buffer {
  return crypto
    .createHash("sha256")
    .update(process.env.DATABASE_URL || "zt-fallback-secret")
    .digest();
}

export function signAdminToken(): string {
  const exp = Date.now() + TOKEN_TTL_MS;
  const sig = crypto
    .createHmac("sha256", secret())
    .update(`admin.${exp}`)
    .digest("base64url");
  return `${exp}.${sig}`;
}

export function verifyAdminToken(token: string): boolean {
  const [expStr, sig] = token.split(".");
  const exp = Number(expStr);
  if (!exp || !sig || Date.now() > exp) return false;
  const expected = crypto
    .createHmac("sha256", secret())
    .update(`admin.${exp}`)
    .digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 32).toString("hex");
}

export async function getSetting(key: string): Promise<string> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(settings)
    .where(eq(settings.key, key))
    .limit(1);
  return row?.value ?? "";
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = getDb();
  await db
    .insert(settings)
    .values({ key, value })
    .onDuplicateKeyUpdate({ set: { value } });
}

export async function checkAdminPassword(password: string): Promise<boolean> {
  const salt = await getSetting("admin_salt");
  const hash = await getSetting("admin_password_hash");
  if (!salt || !hash) return false;
  const candidate = hashPassword(password, salt);
  const a = Buffer.from(candidate);
  const b = Buffer.from(hash);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function setAdminPassword(password: string): Promise<void> {
  const salt = crypto.randomBytes(16).toString("hex");
  await setSetting("admin_salt", salt);
  await setSetting("admin_password_hash", hashPassword(password, salt));
}

/** Procedure that requires a valid admin bearer token. */
export const adminProcedure = publicQuery.use(({ ctx, next }) => {
  const auth = ctx.req.headers.get("authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  if (!token || !verifyAdminToken(token)) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Bad or expired admin token" });
  }
  return next();
});
