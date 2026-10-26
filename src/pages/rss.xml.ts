import { getCollection, render } from "astro:content";
import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { siteConfig } from "../config";

// Render each post through the exact same Astro pipeline as the site (instead
// of a second markdown-it instance), so RSS readers see the same headings,
// math, directives and code blocks as the HTML page.
export async function GET(context: APIContext) {
	const posts = (await getCollection("posts")).filter((post) =>
		import.meta.env.PROD ? post.data.draft !== true : true,
	);
	posts.sort((a, b) => b.data.published.valueOf() - a.data.published.valueOf());

	const container = await AstroContainer.create();
	const items = [];
	for (const post of posts) {
		const { Content } = await render(post);
		const content = await container.renderToString(Content);
		items.push({
			title: post.data.title,
			description: post.data.description || "",
			pubDate: post.data.published,
			link: "/posts/" + post.id + "/",
			categories: post.data.tags,
			content,
		});
	}

	return rss({
		title: siteConfig.title + " - " + (siteConfig.subtitle || "技术博客"),
		description: siteConfig.subtitle || "No description",
		site: context.site,
		items,
		customData:
			"<language>" + siteConfig.lang.replace("_", "-") + "</language>",
	});
}
