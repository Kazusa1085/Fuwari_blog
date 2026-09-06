/**
 * Vercel Routing Middleware — hardened Albireo-style PoW bot protection.
 *
 * Adapted for the Astro/Fuwari blog. The goal is to deter casual scrapers
 * and AI crawlers from reading the page content before they have produced
 * a valid proof-of-work solution.
 *
 * Notable security improvements over the original Albireo Vercel middleware:
 * - The solved cookie is HMAC-signed and bound to the client IP + User-Agent.
 * - Challenge tokens are also signed and bound to IP + User-Agent.
 * - The shared secret is read from an environment variable, never hardcoded.
 * - The challenge page escapes dynamic values to avoid an XSS via the path.
 * - Challenge / verify attempts rate-limited per client IP.
 * - Security headers (CSP, no-store, etc.) are set on challenge responses.
 *
 * Environment variables used:
 * - ALBIREO_SECRET        (required) random secret used to sign cookies
 * - ALBIREO_DIFFICULTY    (optional, default 4) number of leading zeroes
 * - ALBIREO_CHALLENGE_TTL (optional, default 300000ms)
 * - ALBIREO_SOLVED_TTL    (optional, default 86400000ms)
 */

import { ipAddress, next } from '@vercel/functions';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const DEFAULT_DIFFICULTY = 4;
const DEFAULT_CHALLENGE_TTL = 5 * 60 * 1000;
const DEFAULT_SOLVED_TTL = 24 * 60 * 60 * 1000;

const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};
const SECRET_KEY = env.ALBIREO_SECRET ?? '';
const DIFFICULTY = Number(env.ALBIREO_DIFFICULTY || DEFAULT_DIFFICULTY);
const CHALLENGE_TTL = Number(env.ALBIREO_CHALLENGE_TTL || DEFAULT_CHALLENGE_TTL);
const SOLVED_TTL = Number(env.ALBIREO_SOLVED_TTL || DEFAULT_SOLVED_TTL);
// Kill switch: set ALBIREO_ENABLED=false to turn off the PoW challenge entirely.
const ENABLED = (env.ALBIREO_ENABLED ?? 'true').toLowerCase() === 'true';

const CHALLENGE_COOKIE = 'albireo_challenge';
const SOLVED_COOKIE = 'albireo_solved';

const SEO_BOT_AGENTS = [
  'googlebot',
  'bingbot',
  'duckduckbot',
  'slurp',
  'yandexbot',
  'baiduspider',
];

const SUSPICIOUS_UA_PATTERNS = [
  'bot',
  'crawler',
  'spider',
  'scraper',
  'python-requests',
  'go-http-client',
  'curl',
  'wget',
  'libwww',
  'httpx',
  'headless',
];

const BOT_UA_SCORE = 10;
const MISSING_ACCEPT_SCORE = 5;
const MISSING_UA_SCORE = 10;
const SUSPICIOUS_SCORE_THRESHOLD = 10;

// Simple per-isolate rate limiter. This is a best-effort in-memory limiter;
// it is not a persistent global limiter on Vercel, but it still helps stop
// bursts from a single IP on a warm isolate.
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const CHALLENGE_RATE_LIMIT = 20;
const VERIFY_RATE_LIMIT = 20;
const buckets = new Map<string, { count: number; resetAt: number }>();

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function hmacSign(message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(SECRET_KEY),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return toHex(signature);
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function hmacVerify(message: string, signature: string): Promise<boolean> {
  const expected = await hmacSign(message);
  return timingSafeEqualHex(expected, signature);
}

function normalizeUA(ua: string): string {
  return ua.trim().toLowerCase();
}

function getClientKey(request: Request): string {
  const ip = ipAddress(request) || 'unknown';
  const ua = normalizeUA(request.headers.get('user-agent') || '');
  return `${ip}|${ua}`;
}

async function hashClientKey(request: Request): Promise<string> {
  const key = getClientKey(request);
  // Include the secret in the hash so client-key hashes are not globally
  // correlatable across deployments with different secrets.
  return toHex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${SECRET_KEY}|${key}`)));
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeJsString(value: string): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

function safeRedirect(path: string): string {
  try {
    if (path.startsWith('/') && !path.startsWith('//') && !path.includes('\n') && !path.includes('\r')) {
      return path;
    }
  } catch {
    // fall through
  }
  return '/';
}

// `value` is base64url-encoded by cookie serialization in some browsers.
function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const pad = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  return atob(normalized + pad);
}

function encodeBase64Url(value: string): string {
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function safeDecodeURIComponent(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

async function rateLimit(key: string, limit: number): Promise<boolean> {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

// ---------------------------------------------------------------------------
// Token generation / verification
// ---------------------------------------------------------------------------

async function createChallengeToken(request: Request, challenge: string): Promise<string> {
  const clientHash = await hashClientKey(request);
  const payload = `${challenge}.${Date.now()}.${clientHash}`;
  const sig = await hmacSign(payload);
  return encodeBase64Url(`${payload}.${sig}`);
}

async function verifyChallengeToken(
  tokenB64: string,
  request: Request,
): Promise<{ challenge: string; issuedAt: number } | null> {
  try {
    const raw = decodeBase64Url(tokenB64);
    const [challenge, issuedAtStr, clientHash, sig] = raw.split('.');
    if (!challenge || !issuedAtStr || !clientHash || !sig) return null;

    const payload = `${challenge}.${issuedAtStr}.${clientHash}`;
    if (!(await hmacVerify(payload, sig))) return null;

    const currentClientHash = await hashClientKey(request);
    if (currentClientHash !== clientHash) return null;

    const issuedAt = Number(issuedAtStr);
    if (!Number.isFinite(issuedAt) || Date.now() - issuedAt > CHALLENGE_TTL) return null;

    return { challenge, issuedAt };
  } catch {
    return null;
  }
}

async function createSolvedToken(request: Request): Promise<string> {
  const clientHash = await hashClientKey(request);
  const payload = `${Date.now()}.${clientHash}`;
  const sig = await hmacSign(payload);
  return encodeBase64Url(`${payload}.${sig}`);
}

async function verifySolvedToken(tokenB64: string, request: Request): Promise<boolean> {
  try {
    const raw = decodeBase64Url(tokenB64);
    const [issuedAtStr, clientHash, sig] = raw.split('.');
    if (!issuedAtStr || !clientHash || !sig) return false;

    const payload = `${issuedAtStr}.${clientHash}`;
    if (!(await hmacVerify(payload, sig))) return false;

    const currentClientHash = await hashClientKey(request);
    if (currentClientHash !== clientHash) return false;

    const issuedAt = Number(issuedAtStr);
    if (!Number.isFinite(issuedAt) || Date.now() - issuedAt > SOLVED_TTL) return false;

    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Proof-of-work verification
// ---------------------------------------------------------------------------

async function checkPoW(
  challenge: string,
  nonce: string,
  response: string,
  difficulty: number,
): Promise<boolean> {
  if (!/^[0-9a-f]{64}$/.test(response)) return false;
  if (!/^\d+$/.test(nonce)) return false;

  const message = `${challenge}${nonce}`;
  const hash = toHex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(message)));
  const expectedPrefix = '0'.repeat(difficulty);
  if (!hash.startsWith(expectedPrefix)) return false;
  return timingSafeEqualHex(hash, response);
}

// ---------------------------------------------------------------------------
// Suspicion scoring
// ---------------------------------------------------------------------------

function suspicionScore(request: Request): number {
  const ua = normalizeUA(request.headers.get('user-agent') || '');
  const accept = request.headers.get('accept') || '';

  let score = 0;
  if (!ua) score += MISSING_UA_SCORE;
  if (!accept) score += MISSING_ACCEPT_SCORE;
  if (SUSPICIOUS_UA_PATTERNS.some((pattern) => ua.includes(pattern))) score += BOT_UA_SCORE;
  return score;
}

function isSeoBot(ua: string): boolean {
  const normalized = normalizeUA(ua);
  return SEO_BOT_AGENTS.some((agent) => normalized.includes(agent));
}

function isPublicMetadataPath(pathname: string): boolean {
  return pathname === '/robots.txt' || /^\/sitemap(?:\..*)?$/i.test(pathname) || /^\/sitemap-\d+\.xml$/i.test(pathname);
}

// ---------------------------------------------------------------------------
// Response helpers
// ---------------------------------------------------------------------------

function withSecurityHeaders(response: Response, noStore = true): Response {
  if (noStore) {
    response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  }
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-Frame-Options', 'DENY');
  return response;
}

function challengePageHtml(challenge: string, originalPath: string, preview = false): string {
  const jsChallenge = escapeJsString(challenge);
  const jsOriginalPath = escapeJsString(originalPath);
  const previewFlag = preview ? 'true' : 'false';
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="referrer" content="no-referrer">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline' blob:; worker-src blob:; child-src blob:; connect-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'self'; frame-ancestors 'none'">
<title>正在确认您是真人</title>
<style>
:root {
  --hue: 345;
  --primary: oklch(0.75 0.14 var(--hue));
  --primary-soft: oklch(0.75 0.14 var(--hue) / 0.16);
  --page-bg: oklch(0.16 0.014 var(--hue));
  --card-bg: oklch(0.23 0.015 var(--hue));
  --card-bg-glass: oklch(0.23 0.015 var(--hue) / 0.78);
  --card-border: oklch(1 0 0 / 0.08);
  --text-main: oklch(1 0 0 / 0.85);
  --text-muted: oklch(1 0 0 / 0.45);
  --radius: 1rem;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { min-height: 100%; }
body {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 20px;
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, "PingFang SC", "Noto Sans CJK TC", sans-serif;
  color: var(--text-main);
  background:
    radial-gradient(1200px 600px at 20% -10%, oklch(0.75 0.14 var(--hue) / 0.12), transparent 60%),
    radial-gradient(900px 500px at 90% 110%, oklch(0.75 0.14 var(--hue) / 0.08), transparent 55%),
    var(--page-bg);
}
.card {
  width: min(420px, 100%);
  padding: 40px 32px 32px;
  border-radius: var(--radius);
  border: 1px solid var(--card-border);
  background: var(--card-bg-glass);
  -webkit-backdrop-filter: blur(16px);
  backdrop-filter: blur(16px);
  text-align: center;
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.28);
  animation: fade-up 0.45s ease-out both;
}
@keyframes fade-up {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
h1 { font-size: 1.3rem; font-weight: 700; letter-spacing: 0.02em; }
.subtitle {
  margin-top: 8px;
  color: var(--text-muted);
  font-size: 0.9rem;
  line-height: 1.7;
}
.progress {
  height: 6px;
  margin: 28px 0 14px;
  border-radius: 999px;
  background: oklch(1 0 0 / 0.07);
  overflow: hidden;
}
.progress-bar {
  width: 40%;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--primary), oklch(0.8 0.12 calc(var(--hue) + 20)));
  animation: loading 1.5s ease-in-out infinite;
}
@keyframes loading {
  0% { transform: translateX(-120%); }
  100% { transform: translateX(320%); }
}
.status {
  min-height: 1.4rem;
  font-size: 0.85rem;
  color: var(--text-muted);
  transition: color 0.3s;
}
.footnote {
  margin-top: 20px;
  font-size: 0.72rem;
  color: oklch(1 0 0 / 0.3);
}
</style>
</head>
<body>
<div class="card">
  <h1>正在确认您是真人</h1>
  <p class="subtitle">这需要几秒钟，完成后会自动跳转回刚才的页面。</p>
  <div class="progress"><div class="progress-bar"></div></div>
  <div class="status" id="status">准备中…</div>
  <div class="footnote">反爬虫验证程序</div>
</div>
<script>
const CHALLENGE = ${jsChallenge};
const ORIGINAL_PATH = ${jsOriginalPath};
const DIFFICULTY = ${DIFFICULTY};
const PREVIEW = ${previewFlag};
const statusEl = document.getElementById('status');
const setStatus = (text) => { statusEl.textContent = text; };

const WORKER_CODE = \`
async function sha256Hex(buffer) {
  const hash = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
}
self.onmessage = async (e) => {
  const { challenge, difficulty, startNonce, step } = e.data;
  const prefix = '0'.repeat(difficulty);
  let nonce = startNonce;
  while (true) {
    const msg = challenge + nonce;
    const hash = await sha256Hex(new TextEncoder().encode(msg));
    if (hash.startsWith(prefix)) {
      self.postMessage({ found: true, nonce, hash });
      break;
    }
    nonce += step;
  }
};
\`;

function startVerification() {
  setStatus('正在计算…');
  const workers = [];
  const width = Math.max(1, (navigator.hardwareConcurrency || 4) - 1);
  let done = false;

  const finish = (nonce, hash) => {
    if (done) return;
    done = true;
    workers.forEach((w) => w.terminate());
    setStatus('验证中…');
    const fd = new FormData();
    fd.append('nonce', nonce);
    fd.append('response', hash);
    fd.append('verify', 'true');
    fd.append('original_path', ORIGINAL_PATH);
    fetch(window.location.href, { method: 'POST', body: fd }).then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        setStatus('验证成功，正在跳转…');
        setTimeout(() => { window.location.href = data.redirect; }, 350);
      } else {
        setStatus('验证失败，请刷新页面再试一次');
      }
    }).catch(() => {
      setStatus('与服务器连接失败，请刷新页面再试一次');
    });
  };

  for (let i = 0; i < width; i += 1) {
    const worker = new Worker(URL.createObjectURL(new Blob([WORKER_CODE], { type: 'text/javascript' })));
    workers.push(worker);
    worker.onmessage = (e) => { if (e.data.found) finish(e.data.nonce, e.data.hash); };
    worker.postMessage({ challenge: CHALLENGE, difficulty: DIFFICULTY, startNonce: i, step: width });
  }
}

if (PREVIEW) {
  setStatus('预览模式');
} else {
  startVerification();
}
</script>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Middleware entry
// ---------------------------------------------------------------------------

function isStaticAsset(pathname: string): boolean {
  return /\.(?:css|js|mjs|png|jpe?g|gif|webp|svg|ico|woff2?|ttf|otf|map|txt|wasm)$/i.test(pathname);
}

function isChallengeAsset(pathname: string): boolean {
  return pathname.startsWith('/albireo-dist/');
}

function stripPreviewParam(value: string): string {
  try {
    const u = new URL(value, 'https://local');
    u.searchParams.delete('__albireo_preview');
    return `${u.pathname}${u.search}${u.hash}`;
  } catch {
    return '/';
  }
}

export default async function middleware(request: Request): Promise<Response> {
  if (!ENABLED) {
    return next();
  }

  if (!SECRET_KEY) {
    return withSecurityHeaders(
      new Response('ALBIREO_SECRET environment variable is not configured', { status: 503 }),
    );
  }

  const url = new URL(request.url);
  const pathname = url.pathname;
  const ua = request.headers.get('user-agent') || '';
  const isPreview = url.searchParams.has('__albireo_preview');

  // Never intercept the challenge's own static assets or Vercel internals.
  if (isChallengeAsset(pathname) || pathname.startsWith('/_vercel/')) {
    return next();
  }

  // Allow metadata that search engines need, and don't require JS to fetch it.
  if (isPublicMetadataPath(pathname)) {
    return next();
  }

  // Static assets are not worth challenging; they are usually shared across
  // pages and rarely contain article text on their own.
  if (isStaticAsset(pathname)) {
    return next();
  }

  // Pass through requests that already carry a valid signed solved cookie.
  const cookieHeader = request.headers.get('cookie') || '';
  const solvedCookie = cookieHeader.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${SOLVED_COOKIE}=`));
  if (solvedCookie && !isPreview) {
    const value = safeDecodeURIComponent(solvedCookie.slice(`${SOLVED_COOKIE}=`.length));
    if (await verifySolvedToken(value, request)) {
      return next();
    }
  }

  // SEO bots are allowlisted by UA. This is a pragmatic trade-off for
  // search-engine visibility; if you want stricter control you can remove it
  // and rely on search engine verification/registration instead.
  // The preview query bypasses this so the challenge page can be inspected
  // even with a solved cookie or an SEO bot UA.
  if (isSeoBot(ua) && !isPreview) {
    return next();
  }

  // Handle proof-of-work submission.
  if (request.method === 'POST') {
    const ip = ipAddress(request) || 'unknown';
    if (!(await rateLimit(`verify:${ip}`, VERIFY_RATE_LIMIT))) {
      return withSecurityHeaders(new Response('Too many requests', { status: 429 }));
    }

    try {
      const fd = await request.formData();
      if (!fd.has('verify')) return withSecurityHeaders(new Response('Bad Request', { status: 400 }));

      const nonce = String(fd.get('nonce') || '');
      const response = String(fd.get('response') || '');
      const originalPath = safeRedirect(stripPreviewParam(String(fd.get('original_path') || '/')));

      const challengeCookie = cookieHeader.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${CHALLENGE_COOKIE}=`));
      if (!challengeCookie) return withSecurityHeaders(new Response('Challenge expired', { status: 403 }));
      const token = safeDecodeURIComponent(challengeCookie.slice(`${CHALLENGE_COOKIE}=`.length));

      const verified = await verifyChallengeToken(token, request);
      if (!verified) return withSecurityHeaders(new Response('Challenge invalid or expired', { status: 403 }));

      if (!(await checkPoW(verified.challenge, nonce, response, DIFFICULTY))) {
        return withSecurityHeaders(new Response('Proof of work failed', { status: 403 }));
      }

      const solvedToken = await createSolvedToken(request);
      const res = new Response(JSON.stringify({ success: true, redirect: originalPath }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': `${SOLVED_COOKIE}=${encodeURIComponent(solvedToken)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${Math.floor(SOLVED_TTL / 1000)}`,
        },
      });
      return withSecurityHeaders(res);
    } catch {
      return withSecurityHeaders(new Response('Server error', { status: 500 }));
    }
  }

  // Fast rejection for obvious crawler request signatures.
  const score = suspicionScore(request);
  if (score >= SUSPICIOUS_SCORE_THRESHOLD) {
    return withSecurityHeaders(new Response('Forbidden', { status: 403 }));
  }

  // Issue a challenge.
  const ip = ipAddress(request) || 'unknown';
  if (!(await rateLimit(`challenge:${ip}`, CHALLENGE_RATE_LIMIT))) {
    return withSecurityHeaders(new Response('Too many requests', { status: 429 }));
  }

  const challenge = crypto.randomUUID().replace(/-/g, '');
  const originalPath = safeRedirect(stripPreviewParam(`${url.pathname}${url.search}${url.hash}`));
  const challengeToken = await createChallengeToken(request, challenge);
  const html = challengePageHtml(challenge, originalPath, isPreview);

  const res = new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Set-Cookie': `${CHALLENGE_COOKIE}=${encodeURIComponent(challengeToken)}; Path=/; HttpOnly; Secure; SameSite=Lax`,
    },
  });
  return withSecurityHeaders(res);
}

export const config = {
  matcher: [
    // Intercept every route, but let Vercel internals and challenge assets
    // through. Static assets are filtered inside the middleware logic as well.
    '/((?!_vercel/|albireo-dist/).*)',
  ],
};
