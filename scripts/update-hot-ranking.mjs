#!/usr/bin/env node
// Refresh src/data/post-views.json and .hot-ranking-cache.txt from the public
// Umami share API. Runs in the scheduled hot-ranking-check workflow and can be
// run locally with --dry-run.
//
// Why this script exists: the previous shell version read
// content/posts/*.md without syncing the content repository, so it always
// produced an empty list. It also wrote JSON with jq's two-space indentation,
// which later failed the Biome check in CI. This version owns the whole
// pipeline in Node and writes tab-indented JSON on purpose.

import fs from "node:fs";
import path from "node:path";

const DRY_RUN = process.argv.includes("--dry-run");
const UMAMI_BASE = process.env.UMAMI_BASE || "https://umami.raana.icu";
const SHARE_ID = process.env.UMAMI_SHARE_ID || "aX4gXRBc1JEdp6wW";
const TIMEZONE = process.env.UMAMI_TIMEZONE || "Asia/Shanghai";

const ROOT = path.resolve(import.meta.dirname, "..");
const POSTS_DIR = path.join(ROOT, "content", "posts");
const OUT_FILE = path.join(ROOT, "src", "data", "post-views.json");
const CACHE_FILE = path.join(ROOT, ".hot-ranking-cache.txt");

function listPosts(dir) {
	if (!fs.existsSync(dir)) return [];
	const out = [];
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) out.push(...listPosts(full));
		else if (entry.isFile() && entry.name.endsWith(".md"))
			out.push(
				path.relative(POSTS_DIR, full).replace(/\.md$/, "").replace(/\\/g, "/"),
			);
	}
	return out.sort();
}

async function fetchJson(url, headers = {}, attempts = 3) {
	let lastError;
	for (let attempt = 1; attempt <= attempts; attempt += 1) {
		try {
			const response = await fetch(url, {
				headers,
				signal: AbortSignal.timeout(20_000),
			});
			if (!response.ok)
				throw new Error("HTTP " + response.status + " for " + url);
			return await response.json();
		} catch (error) {
			lastError = error;
			if (attempt < attempts)
				await new Promise((r) => setTimeout(r, attempt * 1_000));
		}
	}
	throw lastError;
}

function setOutput(name, value) {
	const file = process.env.GITHUB_OUTPUT;
	if (!file) return;
	fs.appendFileSync(file, name + "=" + value + "\n");
}

async function main() {
	const posts = listPosts(POSTS_DIR);
	if (posts.length === 0) {
		console.error(
			"No posts found under content/posts; aborting without touching post-views.json.",
		);
		process.exit(1);
	}

	let share;
	try {
		share = await fetchJson(UMAMI_BASE + "/api/share/" + SHARE_ID);
	} catch (error) {
		console.warn(
			"Umami share API unavailable, skipping this run:",
			error.message,
		);
		setOutput("changed", "false");
		return;
	}
	const websiteId = share && share.websiteId;
	const token = share && share.token;
	if (!websiteId || !token) {
		console.warn("Umami share payload is incomplete, skipping this run.");
		setOutput("changed", "false");
		return;
	}

	const endAt = Date.now();
	const rows = [];
	for (const slug of posts) {
		const encodedPath = encodeURIComponent("eq./posts/" + slug + "/");
		const encodedTimezone = encodeURIComponent(TIMEZONE);
		const url =
			UMAMI_BASE +
			"/api/websites/" +
			websiteId +
			"/stats?startAt=0&endAt=" +
			endAt +
			"&unit=hour&timezone=" +
			encodedTimezone +
			"&path=" +
			encodedPath;
		const stats = await fetchJson(url, {
			"x-umami-share-token": token,
			"x-umami-share-context": "true",
		});
		rows.push({ slug, views: Number(stats.pageviews) || 0 });
	}
	rows.sort((a, b) => b.views - a.views || a.slug.localeCompare(b.slug));

	const top5 = rows
		.slice(0, 5)
		.map((row) => row.slug)
		.join(",");
	const previousCache = fs.existsSync(CACHE_FILE)
		? fs.readFileSync(CACHE_FILE, "utf8").trim()
		: "";
	const changed = top5 !== previousCache;
	const json = JSON.stringify(rows, null, "\t") + "\n";

	console.log("Slugs:", posts.join(", "));
	console.log("Top 5:", top5 || "(empty)");
	console.log("Changed:", changed);

	if (DRY_RUN) {
		console.log(json);
		setOutput("changed", String(changed));
		setOutput("current", top5);
		return;
	}

	if (!changed) {
		console.log("Ranking unchanged; nothing to commit.");
		setOutput("changed", "false");
		return;
	}

	fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
	fs.writeFileSync(OUT_FILE, json, "utf8");
	fs.writeFileSync(CACHE_FILE, top5 + "\n", "utf8");
	setOutput("changed", "true");
	setOutput("current", top5);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
