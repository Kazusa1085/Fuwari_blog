import { getSortedPosts } from "./content-utils";
import { umamiConfig } from "../config";

type StatsData = {
	totalPosts: number;
	totalWords: number;
	totalMinutes: number;
	avgWords: number;
	postsByYear: { year: number; count: number }[];
	popularPosts: { title: string; slug: string; views: number }[];
	longestPosts: { title: string; slug: string; words: number }[];
	allPostViews: { slug: string; views: number }[];
};

let cached: StatsData | null = null;

export async function getWritingStats(): Promise<StatsData> {
	if (cached) return cached;

	const allPosts = await getSortedPosts();
	const rendered = await Promise.all(allPosts.map(p => p.render()));
	const postsWithWords = allPosts.map((p, i) => ({
		title: p.data.title,
		slug: p.slug,
		words: rendered[i].remarkPluginFrontmatter?.words || rendered[i].remarkPluginFrontmatter?.totalCharCount || 0,
		minutes: rendered[i].remarkPluginFrontmatter?.minutes || 0,
		year: new Date(p.data.published).getUTCFullYear(),
	}));

	const totalPosts = postsWithWords.length;
	const totalWords = postsWithWords.reduce((s, p) => s + p.words, 0);
	const totalMinutes = postsWithWords.reduce((s, p) => s + p.minutes, 0);
	const avgWords = totalPosts > 0 ? Math.round(totalWords / totalPosts) : 0;

	const yearMap = new Map<number, number>();
	for (const p of postsWithWords) {
		yearMap.set(p.year, (yearMap.get(p.year) || 0) + 1);
	}
	const postsByYear = [...yearMap.entries()].sort((a, b) => b[0] - a[0]).map(([year, count]) => ({ year, count }));

	let allPostViews: StatsData["allPostViews"] = [];
	let popularPosts: StatsData["popularPosts"] = [];
	if (umamiConfig.enable && umamiConfig.shareId) {
		try {
			const shareRes = await fetch(`${umamiConfig.baseUrl}/api/share/${umamiConfig.shareId}`, { signal: AbortSignal.timeout(5000) });
			if (shareRes.ok) {
				const { websiteId, token } = await shareRes.json();
				const headers = { 'x-umami-share-token': token };
				const endAt = Date.now();
				allPostViews = await Promise.all(
					allPosts.map(async (p) => {
						try {
							const url = `${umamiConfig.baseUrl}/api/websites/${websiteId}/stats?startAt=0&endAt=${endAt}&path=${encodeURIComponent('/posts/' + p.slug + '/')}&compare=false`;
							const r = await fetch(url, { headers, signal: AbortSignal.timeout(5000) });
							if (r.ok) { const d = await r.json(); return { slug: p.slug, views: d.pageviews || 0 }; }
						} catch {}
						return { slug: p.slug, views: 0 };
					})
				);
				const slugMap = new Map(allPosts.map(p => [p.slug, p.data.title]));
				popularPosts = [...allPostViews]
					.sort((a, b) => b.views - a.views)
					.slice(0, 5)
					.map(({ slug, views }) => ({ title: slugMap.get(slug)!, slug, views }));
			}
		} catch (e) {
			console.warn('[WritingStats] Umami API error:', e);
		}
	}

	const longestPosts = [...postsWithWords].sort((a, b) => b.words - a.words).slice(0, 5);

	cached = { totalPosts, totalWords, totalMinutes, avgWords, postsByYear, popularPosts, longestPosts, allPostViews };
	return cached;
}
