// A tiny rehype plugin to add sane default attrs to <img> in Markdown HTML output
// - loading="lazy" for offscreen images by default
// - decoding="async" to avoid main-thread blocking
// - width/height + aspect-ratio when the author used the existing
//   #vwid=W&vhei=H fragment hint, which prevents CLS
// Safe and low-risk: only sets when not already present

import { visit } from "unist-util-visit";

function extractSize(src) {
	const match = /#([^#]*)$/.exec(src);
	if (!match) return null;
	const params = new URLSearchParams(match[1]);
	const width = Number(params.get("vwid"));
	const height = Number(params.get("vhei"));
	if (!Number.isFinite(width) || !Number.isFinite(height)) return null;
	if (width <= 0 || height <= 0) return null;
	return { width, height, cleanSrc: src.slice(0, src.lastIndexOf("#")) };
}

export default function rehypeImageAttrs() {
	return (tree) => {
		visit(tree, "element", (node) => {
			if (node.tagName !== "img") return;
			node.properties = node.properties || {};
			if (!("loading" in node.properties)) {
				node.properties.loading = "lazy";
			}
			if (!("decoding" in node.properties)) {
				node.properties.decoding = "async";
			}
			if (!("alt" in node.properties)) {
				node.properties.alt = "";
			}
			const src = node.properties.src;
			if (typeof src === "string") {
				const size = extractSize(src);
				if (size) {
					node.properties.src = size.cleanSrc;
					if (!("width" in node.properties)) node.properties.width = size.width;
					if (!("height" in node.properties))
						node.properties.height = size.height;
					const style =
						typeof node.properties.style === "string"
							? node.properties.style
							: "";
					if (!style.includes("aspect-ratio")) {
						const prefix =
							style === ""
								? ""
								: style.trimEnd().endsWith(";")
									? style
									: `${style};`;
						node.properties.style =
							prefix +
							"aspect-ratio:" +
							size.width +
							"/" +
							size.height +
							";height:auto;";
					}
				}
				if (src.startsWith("http://")) {
					console.warn("[rehype-image-attrs] insecure http:// image:", src);
				}
			}
			// Leave fetchpriority untouched to avoid hurting LCP images
		});
	};
}
