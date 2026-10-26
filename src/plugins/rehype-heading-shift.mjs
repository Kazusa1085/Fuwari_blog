/**
 * rehype-heading-shift
 *
 * 这个插件用于将 Markdown 内容中的标题级别降低一级。
 *
 * 问题背景：
 * - 文章页面模板已经使用 <h1> 渲染文章标题
 * - 如果 Markdown 内容中也使用了 # 一级标题，会导致页面存在多个 <h1>
 * - 多个 <h1> 会影响 SEO，搜索引擎建议每个页面只有一个 <h1>
 *
 * 解决方案：
 * - 只将 Markdown 中的 h1 降为 h2，保证页面唯一 h1 是文章标题
 * - h2–h6 保持原级别，避免出现 h1 → h3/h4 的层级跳跃
 */

import { visit } from "unist-util-visit";

const headingMap = {
	h1: "h2",
};

export default function rehypeHeadingShift() {
	return (tree) => {
		visit(tree, "element", (node) => {
			if (headingMap[node.tagName]) {
				node.tagName = headingMap[node.tagName];
			}
		});
	};
}
