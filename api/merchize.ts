import { getSetting } from "./adminAuth";

/* ── MERCHIZE CLIENT ────────────────────────────────────────────────────
   Ported from the proven swearjar integration (api/merchize.js), with
   credentials moved from env vars into the settings table so they're
   editable from the admin dashboard.

   Confirmed-working shapes for this account:
     GET  {base}/product/products                 (X-API-Key)
     GET  {base}/product/products/{id}/variants   (per-size SKUs)
     POST {base}/order/external/orders            (fulfillment)
     GET  {base}/order/external/orders/tracking?external_number=x
          → read-only; used as a credential check.
   X-API-Key is tried first, Bearer second — a mismatched paste costs a
   retry, not a failure.
── */

type AuthAttempt = { label: string; headers: (key: string) => Record<string, string> };

const AUTH_ATTEMPTS: AuthAttempt[] = [
  { label: "api-key", headers: (key) => ({ "X-API-Key": key }) },
  { label: "bearer", headers: (key) => ({ Authorization: `Bearer ${key}` }) },
];

async function creds() {
  const base = (await getSetting("merchize_base_url")).replace(/\/$/, "");
  const key = await getSetting("merchize_access_token");
  return { base, key, configured: Boolean(base && key) };
}

export type MerchizeProduct = {
  id: string;
  title: string;
  image: string;
  labels: string[];
  sizes: string[];
  skus: Record<string, string>;
};

function firstString(obj: any, keys: string[]): string {
  for (const k of keys) {
    const v = obj?.[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

function looksLikeProduct(x: any): boolean {
  if (!x || typeof x !== "object" || Array.isArray(x)) return false;
  const named = ["title", "name", "product_name"].some((k) => typeof x[k] === "string" && x[k].trim());
  if (!named) return false;
  return ["_id", "id", "product_id", "slug", "variants", "sku", "images"].some((k) => x[k] !== undefined);
}

// Merchize wraps payloads differently per endpoint — find the array
// rather than assuming where it sits.
function productArray(body: any): any[] | null {
  if (Array.isArray(body)) return body;
  for (const key of ["data", "products", "items", "results", "records"]) {
    const v = body?.[key];
    if (Array.isArray(v)) return v;
    if (v && typeof v === "object") {
      for (const inner of ["data", "products", "items", "results", "records"]) {
        if (Array.isArray(v[inner])) return v[inner];
      }
    }
  }
  const queue = [body];
  const seen = new Set<any>();
  let budget = 500;
  while (queue.length && budget-- > 0) {
    const node = queue.shift();
    if (!node || typeof node !== "object" || seen.has(node)) continue;
    seen.add(node);
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) {
        if (value.some(looksLikeProduct)) return value;
        for (const entry of value) if (entry && typeof entry === "object") queue.push(entry);
      } else if (value && typeof value === "object") {
        queue.push(value);
      }
    }
  }
  return null;
}

// Everything a product could be filed under — collection, tag, type,
// category — flattened so category filtering doesn't depend on which
// field this account uses.
function labelsOf(raw: any): string[] {
  const out: string[] = [];
  const push = (v: any) => {
    if (typeof v === "string" && v.trim()) out.push(v.trim());
    else if (v && typeof v === "object") {
      const name = firstString(v, ["name", "title", "slug", "label"]);
      if (name) out.push(name);
    }
  };
  for (const key of [
    "collection", "collections", "tag", "tags", "type", "product_type",
    "category", "categories", "folder", "group", "brand", "store",
  ]) {
    const v = raw?.[key];
    if (Array.isArray(v)) v.forEach(push);
    else push(v);
  }
  return [...new Set(out)];
}

function shapeProduct(raw: any): MerchizeProduct {
  const images = Array.isArray(raw?.images) ? raw.images : [];
  const image =
    firstString(raw, ["image", "thumbnail", "mockup", "preview"]) ||
    (typeof images[0] === "string" ? images[0] : firstString(images[0] || {}, ["url", "src"]));
  const variants: any[] = Array.isArray(raw?.variants) ? raw.variants : Array.isArray(raw?.variant) ? raw.variant : [];
  const skus: Record<string, string> = {};
  for (const v of variants) {
    const sku = firstString(v, ["sku", "SKU", "variant_sku", "code"]);
    let size = firstString(v, ["size", "Size", "title", "name", "option1"]);
    const attrs = v?.attributes || v?.options || v?.properties;
    if (Array.isArray(attrs)) {
      for (const a of attrs) {
        if (/size/i.test(firstString(a, ["name", "key", "label", "type"]))) {
          size = firstString(a, ["value", "option", "val"]) || size;
        }
      }
    }
    if (sku && size) skus[size.toUpperCase()] = sku;
  }
  return {
    id: firstString(raw, ["_id", "id", "product_id", "slug"]),
    title: firstString(raw, ["title", "name", "product_name"]),
    image,
    labels: labelsOf(raw),
    sizes: Object.keys(skus),
    skus,
  };
}

async function fetchVariantSkus(base: string, key: string, id: string): Promise<Record<string, string>> {
  const url = `${base}/product/products/${id}/variants`;
  for (const attempt of AUTH_ATTEMPTS) {
    try {
      const res = await fetch(url, { headers: attempt.headers(key) });
      if (!res.ok) continue;
      const body: any = await res.json();
      const list = body?.data?.variants || body?.variants || [];
      const skus: Record<string, string> = {};
      for (const v of list) {
        const sku = firstString(v, ["sku", "SKU", "variant_sku", "code"]);
        const size = firstString(v, ["title", "size", "Size", "name"]).toUpperCase();
        if (sku && size) skus[size] = sku;
      }
      return skus;
    } catch {
      // try next auth style
    }
  }
  return {};
}

const PRODUCT_ENDPOINTS = [
  { path: "/product/products", method: "GET" },
  { path: "/product/external/products", method: "" },
  { path: "/catalog/external/products", method: "GET" },
  { path: "/products", method: "GET" },
  { path: "/product/search", method: "POST" },
];

export type CatalogResult =
  | { ok: true; products: MerchizeProduct[]; total: number; labels: string[]; endpoint: string }
  | { ok: false; reason: string };

export async function listMerchizeProducts(label = ""): Promise<CatalogResult> {
  const { base, key, configured } = await creds();
  if (!configured) return { ok: false, reason: "not_configured" };

  for (const candidate of PRODUCT_ENDPOINTS) {
    for (const attempt of AUTH_ATTEMPTS) {
      const url = `${base}${candidate.path}${candidate.method === "GET" ? "?limit=100" : ""}`;
      try {
        const res = await fetch(url, {
          method: candidate.method,
          headers: {
            ...(candidate.method === "POST" ? { "Content-Type": "application/json" } : {}),
            ...attempt.headers(key),
          },
          ...(candidate.method === "POST" ? { body: JSON.stringify({ limit: 100 }) } : {}),
        });
        const text = await res.text();
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) continue; // try other auth style
          break; // not an auth problem — try next endpoint
        }
        let body: any;
        try {
          body = JSON.parse(text);
        } catch {
          break;
        }
        const array = productArray(body);
        if (!array) break;

        const all = array.map(shapeProduct).filter((p) => p.id && p.title);
        const wanted = label
          ? all.filter((p) => p.labels.some((l) => l.toLowerCase() === label.toLowerCase()))
          : all;

        // The listing doesn't carry per-size SKUs on this account — fetch
        // them per product from the /variants sub-resource.
        for (const p of wanted) {
          if (Object.keys(p.skus).length) continue;
          p.skus = await fetchVariantSkus(base, key, p.id);
          p.sizes = Object.keys(p.skus);
        }

        return {
          ok: true,
          products: wanted,
          total: all.length,
          labels: [...new Set(all.flatMap((p) => p.labels))].sort(),
          endpoint: candidate.path,
        };
      } catch {
        return { ok: false, reason: "network" };
      }
    }
  }
  return { ok: false, reason: "no_endpoint" };
}

/* Proves credentials authenticate without creating anything — a made-up
   order number answering "not found" still proves base URL + key are good. */
export type ConnectionTest =
  | { ok: true; auth: string; base: string }
  | { ok: false; reason: string };

export async function testMerchizeConnection(): Promise<ConnectionTest> {
  const { base, key, configured } = await creds();
  if (!configured) return { ok: false, reason: "not_configured" };

  const url = `${base}/order/external/orders/tracking?external_number=connection-test`;
  for (const attempt of AUTH_ATTEMPTS) {
    try {
      const res = await fetch(url, { headers: attempt.headers(key) });
      if (res.ok) return { ok: true, auth: attempt.label, base };
      if (res.status !== 401 && res.status !== 403) {
        return { ok: false, reason: `http_${res.status}` };
      }
    } catch {
      return { ok: false, reason: "network" };
    }
  }
  return { ok: false, reason: "auth_rejected" };
}
