import { getImage } from "astro:assets";
import { getCollection } from "astro:content";
import { siteConfig } from "@/config";
import { getSortedPosts } from "@/utils/content-utils";
import rss from "@astrojs/rss";
import type { RSSFeedItem } from "@astrojs/rss";
import type { APIContext, ImageMetadata } from "astro";
import MarkdownIt from "markdown-it";
import { parse as htmlParser } from "node-html-parser";
import sanitizeHtml from "sanitize-html";

const markdownParser = new MarkdownIt();

// get dynamic import of images as a map collection
// 内容分离：posts 已经搬到顶层 content/ 目录，这里同时保留 /src/content/**
// （给 spec 用，虽然目前没有图片）和 /content/**（posts 的新位置）两个 glob
const imagesGlob = import.meta.glob<{ default: ImageMetadata }>([
	"/src/content/**/*.{jpeg,jpg,png,gif,webp}",
	"/content/**/*.{jpeg,jpg,png,gif,webp}",
]);

export async function GET(context: APIContext) {
	if (!context.site) {
		throw Error("site not set");
	}

	// Use the same ordering as site listing (pinned first, then by published desc)
	const posts = await getSortedPosts();
	const feed: RSSFeedItem[] = [];

	for (const post of posts) {
		// convert markdown to html string
		const body = markdownParser.render(post.body || "");
		// convert html string to DOM-like structure
		const html = htmlParser.parse(body);
		// hold all img tags in variable images
		const images = html.querySelectorAll("img");

		for (const img of images) {
			const src = img.getAttribute("src");
			if (!src) continue;

			// Handle content-relative images and convert them to built _astro paths
			if (src.startsWith("./") || src.startsWith("../")) {
				let importPath: string | null = null;

				if (src.startsWith("./")) {
					// Path relative to the post file directory
					const prefixRemoved = src.slice(2);
					importPath = `/content/posts/${prefixRemoved}`;
				} else {
					// Path like ../assets/images/xxx -> relative to /content/
					const cleaned = src.replace(/^\.\.\//, "");
					importPath = `/content/${cleaned}`;
				}

				const imageMod = await imagesGlob[importPath]?.()?.then(
					(res) => res.default,
				);
				if (imageMod) {
					const optimizedImg = await getImage({ src: imageMod });
					img.setAttribute("src", new URL(optimizedImg.src, context.site).href);
				}
			} else if (src.startsWith("/")) {
				// images starting with `/` are in public dir
				img.setAttribute("src", new URL(src, context.site).href);
			}
		}

		feed.push({
			title: post.data.title,
			description: post.data.description,
			pubDate: post.data.published,
			link: `/posts/${post.id}/`,
			// sanitize the new html string with corrected image paths
			content: sanitizeHtml(html.toString(), {
				allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img"]),
			}),
		});
	}

	return rss({
		title: `${siteConfig.title} - ${siteConfig.subtitle || "技术博客"}`,
		description: siteConfig.subtitle || "No description",
		site: context.site,
		items: feed,
		customData: `<language>${siteConfig.lang}</language>`,
	});
}
