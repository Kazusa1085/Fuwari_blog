import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { readSitemapEntries, readSitemapUrls, submitUrls } from "./indexnow-lib.mjs";

const SUBMITTED_URLS_FILE = join(process.cwd(), ".indexnow-submitted.json");
const dryRun = process.env.INDEXNOW_DRY_RUN === "true";

function emptyState() {
	return { urls: [], lastSubmitted: null, totalSubmissions: 0 };
}

function getSubmittedUrls() {
	if (!existsSync(SUBMITTED_URLS_FILE)) return emptyState();
	try {
		return JSON.parse(readFileSync(SUBMITTED_URLS_FILE, "utf8"));
	} catch (error) {
		console.warn("Could not read " + SUBMITTED_URLS_FILE + "; starting fresh:", error.message);
		return emptyState();
	}
}

function saveSubmittedUrls(data) {
	if (dryRun) {
		console.log("[dry-run] state not written");
		return;
	}
	writeFileSync(SUBMITTED_URLS_FILE, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function showStatus() {
	const data = getSubmittedUrls();
	console.log("IndexNow status:");
	console.log("  submitted URLs: " + (data.urls ? data.urls.length : 0));
	console.log("  urls with lastmod: " + Object.keys(data.lastmod || {}).length);
	console.log("  last submitted: " + (data.lastSubmitted || "never"));
	console.log("  total runs: " + (data.totalSubmissions || 0));
}

function clearStatus() {
	if (existsSync(SUBMITTED_URLS_FILE)) {
		writeFileSync(SUBMITTED_URLS_FILE, JSON.stringify(emptyState(), null, 2) + "\n");
		console.log("Cleared " + SUBMITTED_URLS_FILE);
	} else {
		console.log("No submission state file found");
	}
}

async function submitIncremental() {
	const entries = readSitemapEntries();
	const data = getSubmittedUrls();
	const submitted = new Set(data.urls || []);
	const previousLastmod = data.lastmod || {};
	const changed = entries.filter((entry) => {
		if (!submitted.has(entry.url)) return true;
		// A changed post keeps its URL but gets a newer <lastmod>; IndexNow
		// should be notified again in that case.
		return Boolean(entry.lastmod) && entry.lastmod !== previousLastmod[entry.url];
	});

	if (changed.length === 0) {
		console.log("No new or updated URLs to submit");
		console.log("  total pages: " + entries.length);
		console.log("  already submitted: " + submitted.size);
		return;
	}

	console.log("Submitting " + changed.length + " new/updated URL(s)");
	const result = await submitUrls(changed.map((entry) => entry.url), { dryRun });
	saveSubmittedUrls({
		urls: entries.map((entry) => entry.url),
		lastmod: Object.fromEntries(entries.map((entry) => [entry.url, entry.lastmod || ""])),
		lastSubmitted: new Date().toISOString(),
		totalSubmissions: (data.totalSubmissions || 0) + 1,
		lastSubmissionDetails: {
			newUrlsCount: changed.length,
			totalUrlsCount: entries.length,
			timestamp: new Date().toISOString(),
			status: result.statuses.join(","),
			newUrls: changed.map((entry) => entry.url),
		},
	});
}

async function forceSubmitAll() {
	const entries = readSitemapEntries();
	const urls = entries.map((entry) => entry.url);
	console.log("Force-submitting " + urls.length + " URL(s)");
	const result = await submitUrls(urls, { dryRun });
	saveSubmittedUrls({
		urls,
		lastmod: Object.fromEntries(entries.map((entry) => [entry.url, entry.lastmod || ""])),
		lastSubmitted: new Date().toISOString(),
		totalSubmissions: 1,
		lastSubmissionDetails: {
			newUrlsCount: urls.length,
			totalUrlsCount: urls.length,
			timestamp: new Date().toISOString(),
			status: result.statuses.join(","),
			forcedSubmission: true,
		},
	});
}

function fail(error) {
	console.error("IndexNow submission failed:", error.message);
	process.exit(1);
}

const command = process.argv[2];
switch (command) {
	case "--force":
	case "-f":
		forceSubmitAll().catch(fail);
		break;
	case "--status":
	case "-s":
		showStatus();
		break;
	case "--clear":
	case "-c":
		clearStatus();
		break;
	case "--help":
	case "-h":
		console.log("IndexNow incremental submission tool");
		console.log("  pnpm submit-indexnow-inc           incremental (new URLs only)");
		console.log("  pnpm submit-indexnow-force         force submit all URLs");
		console.log("  pnpm indexnow-status               show state");
		console.log("  pnpm indexnow-clear                clear state");
		console.log("  INDEXNOW_DRY_RUN=true ...          validate without network/state writes");
		break;
	default:
		submitIncremental().catch(fail);
		break;
}
