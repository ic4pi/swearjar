const crypto = require('crypto');

/* ── ADMIN SESSION ──────────────────────────────────────────────────────
   Shared by every endpoint the dashboard talks to, so there is one
   definition of "is this request signed in" rather than a copy per file
   that can drift out of step with the others.

   The password lives ONLY in the ADMIN_PASSWORD environment variable, set
   in the Vercel dashboard. It is never written into this repository and
   never sent to the browser. The browser holds a signed, expiring token
   instead — so the password crosses the wire exactly once, at login.
── */

const SESSION_HOURS = 12;

function adminSecret() {
  return process.env.ADMIN_PASSWORD || '';
}

// Constant-time compare. Hash both sides first so differing lengths don't
// throw and don't leak length through timing.
function sameSecret(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

function sign(payload) {
  return crypto.createHmac('sha256', adminSecret()).update(payload).digest('base64url');
}

function issueToken() {
  const expires = Date.now() + SESSION_HOURS * 3600 * 1000;
  const payload = String(expires);
  return `${Buffer.from(payload).toString('base64url')}.${sign(payload)}`;
}

function tokenValid(token) {
  if (typeof token !== 'string' || !token.includes('.')) return false;
  const [encoded, mac] = token.split('.');
  let payload;
  try {
    payload = Buffer.from(encoded, 'base64url').toString();
  } catch (_) {
    return false;
  }
  const expected = sign(payload);
  // Same length by construction (both base64url HMAC-SHA256), but compare
  // through hashes anyway so a malformed mac can't throw.
  if (!sameSecret(mac, expected)) return false;
  const expires = Number(payload);
  return Number.isFinite(expires) && Date.now() < expires;
}

function authed(req) {
  const header = (req.headers && req.headers.authorization) || '';
  return tokenValid(header.replace(/^Bearer\s+/i, ''));
}

module.exports = { SESSION_HOURS, adminSecret, sameSecret, sign, issueToken, tokenValid, authed };
