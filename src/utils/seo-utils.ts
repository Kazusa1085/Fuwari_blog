const META_DESCRIPTION_MIN_LENGTH = 150;
const META_DESCRIPTION_MAX_LENGTH = 160;

export interface MetaDescriptionOptions {
	description?: string;
	excerpt?: string;
	title?: string;
	siteName?: string;
	subtitle?: string;
	category?: string;
	tags?: string[];
}

function normalize(text: string): string {
	return text
		.replace(/\s+/g, " ")
		.replace(/。{2,}/g, "。")
		.replace(/\.。+/g, "。")
		.trim();
}

export function buildMetaDescription({
	description,
	excerpt,
	title,
	siteName,
	subtitle,
	category,
	tags,
}: MetaDescriptionOptions): string {
	const parts = [description, excerpt]
		.map((part) => part?.trim())
		.filter((part): part is string => Boolean(part));

	let text = normalize(parts.join("。"));

	const fallbackParts = [
		title ? `《${title}》` : "",
		siteName ?? "",
		subtitle ?? "",
		category ? `分类：${category}` : "",
		tags && tags.length > 0 ? `标签：${tags.join("、")}` : "",
	].filter(Boolean);

	for (const part of fallbackParts) {
		if (text.length >= META_DESCRIPTION_MIN_LENGTH) break;
		if (text.includes(part)) continue;
		text = normalize(`${text}。${part}`);
	}

	if (text.length < META_DESCRIPTION_MIN_LENGTH) {
		text = normalize(
			`${text}。持续分享技术教程、开发笔记、问题解决方案与日常折腾记录。`,
		);
	}

	if (text.length > META_DESCRIPTION_MAX_LENGTH) {
		text = `${text.slice(0, META_DESCRIPTION_MAX_LENGTH - 1).trim()}…`;
	}

	return text;
}
