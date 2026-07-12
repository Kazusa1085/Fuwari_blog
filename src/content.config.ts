import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const postsCollection = defineCollection({
	loader: glob({ pattern: "**/[^_]*.md", base: "./content/posts" }),
	schema: z.object({
		title: z.string(),
		published: z.date(),
		updated: z.date().optional(),
		draft: z.boolean().optional().default(false),
		description: z.string().optional().default(""),
		image: z.string().optional().default(""),
		tags: z.array(z.string()).optional().default([]),
		lang: z.string().optional().default(""),
		pinned: z.boolean().optional().default(false),

		/* 性能优化：预渲染所有内容（包括折叠区），适用于长文章 */
		prerenderAll: z.boolean().optional().default(false),

		/* For internal use */
		prevTitle: z.string().default(""),
		prevSlug: z.string().default(""),
		nextTitle: z.string().default(""),
		nextSlug: z.string().default(""),
	}),
});

const specCollection = defineCollection({
	loader: glob({ pattern: "**/[^_]*.md", base: "./src/content/spec" }),
	schema: z.object({
		title: z.string().optional(),
		published: z.date().optional(),
		updated: z.date().optional(),
		draft: z.boolean().optional().default(false),
	}),
});

const friendsCollection = defineCollection({
	// _order.json 仅用于存储排序信息，不是一条 friend 数据，通过 [^_]* 排除
	loader: glob({ pattern: "**/[^_]*.json", base: "./content/friends" }),
	schema: z.object({
		name: z.string(),
		url: z.string(),
		avatar: z.string(),
		introduction: z.string(),
		friendsPage: z.string(),
	}),
});

const projectsCollection = defineCollection({
	// 与 friends 相同的独立 JSON 管理方式，_order.json 仅用于排序，通过 [^_]* 排除
	loader: glob({ pattern: "**/[^_]*.json", base: "./content/projects" }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		image: z.string().optional().default(""),
		category: z.enum(["web", "mobile", "desktop", "embedded", "other"]),
		techStack: z.array(z.string()).optional().default([]),
		status: z.enum(["completed", "in-progress", "planned"]),
		sourceCode: z.string().optional(),
		visitUrl: z.string().optional(),
		startDate: z.string().optional(),
		endDate: z.string().optional(),
		featured: z.boolean().optional().default(false),
		tags: z.array(z.string()).optional().default([]),
		// 没有配图时是否显示图片区域（渐变+标题占位），默认 true；本地没有素材时可设为 false 直接隐藏
		showImage: z.boolean().optional().default(true),
	}),
});

export const collections = {
	posts: postsCollection,
	spec: specCollection,
	friends: friendsCollection,
	projects: projectsCollection,
};