/**
 * Shared helpers for the IndexNow scripts.
 *
 * Fixes several issues found in the audit:
 * - validate INDEXNOW_KEY / INDEXNOW_HOST and the public key file instead of
 *   trusting env alone (the key file content must equal the key)
 * - read every dist/sitemap-*.xml shard instead of hard-coding sitemap-0.xml
 * - decode XML entities (&amp; etc.) in <loc>
 * - batch requests (IndexNow accepts up to 10,000 URLs per call)
 * - time out / retry network calls and support INDEXNOW_DRY_RUN=true for tests
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const KEY_RE = /^[A-Za-z0-9-]{8,128}$/;
const MAX_URLS_PER_REQUEST = 9000;

export function getIndexNowConfig() {
	const key = (process.env.INDEXNOW_KEY || "").trim();
	const host = (process.env.INDEXNOW_HOST || "").trim();
	if (!key || !host) throw new Error("Missing INDEXNOW_KEY or INDEXNOW_HOST");
	if (!KEY_RE.test(key))
		throw new Error("INDEXNOW_KEY must be 8-128 characters of [A-Za-z0-9-]");
	if (/^https?:\/\//i.test(host) || host.includes("/") || /\s/.test(host))
		throw new Error("INDEXNOW_HOST must be a bare hostname (no protocol or path)");

	const keyLocation =
		(process.env.INDEXNOW_KEY_LOCATION || "").trim() ||
		"https://" + host + "/" + key + ".txt";
	const keyFile = join(process.cwd(), "public", key + ".txt");
	if (!existsSync(keyFile))
		throw new Error("IndexNow key file is missing: public/" + key + ".txt");
	const fileContent = readFileSync(keyFile, "utf8").trim();
	if (fileContent !== key)
		throw new Error(
			"public/" + key + ".txt must contain exactly the key (no spaces/newline)",
		);

	return { key, host, keyLocation };
}

export function readSitemapUrls() {
	const distDir = join(process.cwd(), "dist");
	if (!existsSync(distDir))
		throw new Error("dist/ not found; run pnpm build first");
	const files = readdirSync(distDir).filter((name) =>
		/^sitemap-\d+\.xml$/.test(name),
	);
	if (files.length === 0)
		throw new Error("no sitemap-N.xml files found in dist/");

	const urls = new Set();
	for (const file of files) {
		const xml = readFileSync(join(distDir, file), "utf8");
		for (const match of xml.matchAll(/<loc>([\s\S]*?)<\/loc>/g)) {
			const decoded = match[1]
				.trim()
				.replace(/&amp;/g, "&")
				.replace(/&lt;/g, "<")
				.replace(/&gt;/g, ">")
				.replace(/&quot;/g, '"')
				.replace(/&#39;/g, "'");
			if (decoded) urls.add(decoded);
		}
	}
	return [...urls];
}

export async function submitUrls(urls, { dryRun = false } = {}) {
	if (urls.length === 0) throw new Error("no URLs to submit");
	const { key, host, keyLocation } = getIndexNowConfig();
	const chunks = [];
	for (let i = 0; i < urls.length; i += MAX_URLS_PER_REQUEST)
		chunks.push(urls.slice(i, i + MAX_URLS_PER_REQUEST));

	const statuses = [];
	for (const chunk of chunks) {
		if (dryRun) {
			console.log("[dry-run] would submit " + chunk.length + " URLs");
			statuses.push(200);
			continue;
		}
		const payload = { host, key, keyLocation, urlList: chunk };
		let lastError;
		for (let attempt = 1; attempt <= 2; attempt += 1) {
			try {
				const response = await fetch("https://api.indexnow.org/IndexNow", {
					method: "POST",
					headers: {
						"Content-Type": "application/json; charset=utf-8",
						"User-Agent": "Micostar-Blog-IndexNow/1.0",
					},
					body: JSON.stringify(payload),
					signal: AbortSignal.timeout(20000),
				});
				const body = await response.text().catch(() => "");
				if (response.ok) {
					statuses.push(response.status);
					lastError = undefined;
					break;
				}
				lastError = new Error(
					"HTTP " + response.status + (body ? ": " + body.slice(0, 200) : ""),
				);
			} catch (error) {
				lastError = error;
			}
			if (attempt === 2) {
				throw new Error("IndexNow request failed: " + lastError.message);
			}
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}
	}
	return { submitted: urls.length, chunks: chunks.length, statuses };
}
