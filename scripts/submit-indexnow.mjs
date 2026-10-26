import { readSitemapUrls, submitUrls } from "./indexnow-lib.mjs";

async function main() {
	const urls = readSitemapUrls();
	const dryRun = process.env.INDEXNOW_DRY_RUN === "true";
	console.log("Preparing to submit " + urls.length + " URLs to IndexNow");
	const result = await submitUrls(urls, { dryRun });
	console.log(
		"Done: " + result.submitted + " URLs in " + result.chunks + " request(s), HTTP " + result.statuses.join(", "),
	);
}

main().catch((error) => {
	console.error("IndexNow submission failed:", error.message);
	process.exit(1);
});
