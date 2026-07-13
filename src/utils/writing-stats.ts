import { render } from "astro:content";
import { getSortedPosts } from "./content-utils";

type StatsData = {
	totalPosts: number;
	totalWords: number;
	totalMinutes: number;
	avgWords: number;
	postsByYear: { year: number; count: number }[];
	popularPosts: { title: string; slug: string; views: number }[];
	longestPosts: { title: string; slug: string; words: number }[];
	allPostViews: { slug: string; views: number }[];
	updatedPosts: { title: string; slug: string; published?: string; updated?: string }[];
};

// Astro/Zod 把无时区的日期字符串解析为 UTC Date 对象，
// 用 UTC 方法提取原始值，还原 frontmatter 中的日期字符串
// （从 SideBar.astro 移过来，原来"二次更新文章"在左侧栏，现在挪到右侧栏）
function toLocalISOString(date: Date | undefined): string | undefined {
	if (!date) return undefined;
	const year = date.getUTCFullYear();
	const month = String(date.getUTCMonth() + 1).padStart(2, "0");
	const day = String(date.getUTCDate()).padStart(2, "0");
	const hours = String(date.getUTCHours()).padStart(2, "0");
	const minutes = String(date.getUTCMinutes()).padStart(2, "0");
	const seconds = String(date.getUTCSeconds()).padStart(2, "0");
	return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

let cached: StatsData | null = null;

export async function getWritingStats(): Promise<StatsData> {
	if (cached) return cached;

	const allPosts = await getSortedPosts();
	const rendered = await Promise.all(allPosts.map(p => render(p)));
	const postsWithWords = allPosts.map((p, i) => ({
		title: p.data.title,
		slug: p.id,
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
	try {
		const viewsData = await import("../data/post-views.json");
		const slugMap = new Map(allPosts.map(p => [p.id, p.data.title]));
		allPostViews = (viewsData.default || [])
			.map((v: { slug: string; views: number }) => ({ slug: v.slug, views: v.views ?? 0 }))
			// post-views.json 是独立的浏览量统计文件，不知道文章是否为草稿，
			// 这里过滤掉当前不在（非草稿）文章列表里的记录，避免草稿文章混进"热门文章"
			.filter((v: { slug: string; views: number }) => slugMap.has(v.slug));
		popularPosts = allPostViews
			.slice(0, 5)
			.map(({ slug, views }) => ({ title: slugMap.get(slug)!, slug, views }));
	} catch {}

	const longestPosts = [...postsWithWords].sort((a, b) => b.words - a.words).slice(0, 5);

	const updatedPosts = allPosts.map((p) => ({
		title: p.data.title,
		slug: p.id,
		published: toLocalISOString(p.data.published),
		updated: toLocalISOString(p.data.updated),
	}));

	cached = { totalPosts, totalWords, totalMinutes, avgWords, postsByYear, popularPosts, longestPosts, allPostViews, updatedPosts };
	return cached;
}