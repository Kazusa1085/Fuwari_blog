import sitemap from "@astrojs/sitemap";
import svelte from "@astrojs/svelte";
import tailwindcss from "@tailwindcss/vite";
import swup from "@swup/astro";
import icon from "astro-icon";
import { defineConfig, fontProviders } from "astro/config";
import { unified } from "@astrojs/markdown-remark";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeComponents from "rehype-components";/* Render the custom directive content */
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import remarkDirective from "remark-directive";/* Handle directives */
import remarkGithubAdmonitionsToDirectives from "remark-github-admonitions-to-directives";
import remarkMath from "remark-math";
import remarkSectionize from "remark-sectionize";
import { imageFallbackConfig, siteConfig } from "./src/config.ts";
import { AdmonitionComponent } from "./src/plugins/rehype-component-admonition.mjs";
import { GithubCardComponent } from "./src/plugins/rehype-component-github-card.mjs";
import { LinkCardComponent } from "./src/plugins/rehype-component-link-card.mjs";
import rehypeImageFallback from "./src/plugins/rehype-image-fallback.mjs";
import rehypeImageAttrs from "./src/plugins/rehype-image-attrs.mjs";
import { parseDirectiveNode } from "./src/plugins/remark-directive-rehype.js";
import { remarkExcerpt } from "./src/plugins/remark-excerpt.js";
import { remarkReadingTime } from "./src/plugins/remark-reading-time.mjs";
import rehypeHeadingShift from "./src/plugins/rehype-heading-shift.mjs";
import rehypeExternalLinks from 'rehype-external-links';
import expressiveCode from "astro-expressive-code";
import { pluginCollapsibleSections } from "@expressive-code/plugin-collapsible-sections";
import { pluginLineNumbers } from "@expressive-code/plugin-line-numbers";
import { expressiveCodeConfig } from "./src/config.ts";
import { pluginLanguageBadge } from "./src/plugins/expressive-code/language-badge.js";
import { pluginCustomCopyButton } from "./src/plugins/expressive-code/custom-copy-button.js";
import fs from "node:fs";
import path from "node:path";

// Content lives outside the Git repository; read post frontmatter so the
// sitemap can carry a truthful <lastmod> instead of no timestamp at all.
const contentPostsDir = path.join(process.cwd(), "content", "posts");
const postLastmod = new Map();
let latestPostDate;
function collectPostLastmods(dir) {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			collectPostLastmods(full);
			continue;
		}
		if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
		const text = fs.readFileSync(full, "utf8");
		const frontmatter = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
		if (!frontmatter) continue;
		if (/^draft:\s*true\s*$/m.test(frontmatter[1])) continue;
		const dateMatch =
			frontmatter[1].match(/^updated:\s*(\d{4}-\d{2}-\d{2})/m) ||
			frontmatter[1].match(/^published:\s*(\d{4}-\d{2}-\d{2})/m);
		if (!dateMatch) continue;
		const date = new Date(dateMatch[1] + "T00:00:00Z");
		if (Number.isNaN(date.getTime())) continue;
		const slug = path.relative(contentPostsDir, full).replace(/\.md$/, "").replace(/\\/g, "/");
		postLastmod.set("/posts/" + slug + "/", date.toISOString());
		if (!latestPostDate || date.toISOString() > latestPostDate)
			latestPostDate = date.toISOString();
	}
}
try {
	if (fs.existsSync(contentPostsDir)) collectPostLastmods(contentPostsDir);
} catch (error) {
	console.warn("[sitemap] failed to read content/post dates:", error.message);
}

// https://astro.build/config
export default defineConfig({
    site: "https://blog.raana.icu",
    base: "/",
    // Astro Fonts API (stable since v6): downloads and self-hosts only the
    // weights/subsets we use, emits optimized @font-face rules with fallback
    // metrics, and lets <Font /> preload the above-the-fold family.
    fonts: [
        {
            provider: fontProviders.fontsource(),
            name: "Roboto",
            cssVariable: "--font-roboto",
            weights: [400, 500, 700],
            styles: ["normal"],
            subsets: ["latin"],
            fallbacks: ["sans-serif"],
        },
        {
            provider: fontProviders.fontsource(),
            name: "JetBrains Mono",
            cssVariable: "--font-jetbrains-mono",
            weights: ["100 800"],
            styles: ["normal"],
            subsets: ["latin"],
            fallbacks: ["monospace"],
        },
    ],
    trailingSlash: "always",
    integrations: [swup({
        theme: false,
        animationClass: "transition-swup-", // see https://swup.js.org/options/#animationselector
        // the default value `transition-` cause transition delay
        // when the Tailwind class `transition-all` is used
        containers: ["main", "#toc"],
        smoothScrolling: true,
        cache: true,
        preload: true,
        accessibility: true,
        updateHead: true,
        updateBodyClass: false,
        globalInstance: true,
    }), icon({
        include: {
            "material-symbols": ["*"],
            "fa6-brands": ["*"],
            "fa6-regular": ["*"],
            "fa6-solid": ["*"],
            "simple-icons": ["*"],
        },
    }), svelte(), sitemap({
        // /about/ only exists as a static meta-refresh fallback; the CDN
        // redirects handle it, so it must not appear in the sitemap.
        filter: (page) => {
            const pathname = new URL(page).pathname;
            return pathname !== "/about" && pathname !== "/about/";
        },
        // Add lastmod from the real post dates (updated || published).
        serialize(item) {
            const pathname = new URL(item.url).pathname;
            const date =
                postLastmod.get(pathname) ??
                (pathname === "/" ||
                pathname === "/archive/" ||
                pathname === "/hot/" ||
                pathname === "/friends/" ||
                pathname === "/apps/" ||
                pathname === "/works/" ||
                pathname.startsWith("/archive/tag/")
                    ? latestPostDate
                    : undefined);
            if (date) item.lastmod = date;
            return item;
        },
        changefreq: 'weekly',
        priority: 0.7,
        customPages: [],
    }),
    expressiveCode({
        themes: [expressiveCodeConfig.theme, expressiveCodeConfig.theme],
        plugins: [
            pluginCollapsibleSections(),
            pluginLineNumbers(),
            pluginLanguageBadge(),
            pluginCustomCopyButton()
        ],
        defaultProps: {
            wrap: true,
            overridesByLang: {
                'shellsession': {
                    showLineNumbers: false,
                },
            },
        },
        styleOverrides: {
            codeBackground: "var(--codeblock-bg)",
            borderRadius: "0.25rem",
            borderColor: "none",
            codeFontSize: "0.875rem",
            codeFontFamily: "'JetBrains Mono Variable', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
            codeLineHeight: "1.5rem",
            frames: {
                editorBackground: "var(--codeblock-bg)",
                terminalBackground: "var(--codeblock-bg)",
                terminalTitlebarBackground: "var(--codeblock-topbar-bg)",
                editorTabBarBackground: "var(--codeblock-topbar-bg)",
                editorActiveTabBackground: "none",
                editorActiveTabIndicatorBottomColor: "var(--primary)",
                editorActiveTabIndicatorTopColor: "none",
                editorTabBarBorderBottomColor: "var(--codeblock-topbar-bg)",
                terminalTitlebarBorderBottomColor: "none"
            },
            textMarkers: {
                delHue: 0,
                insHue: 180,
                markHue: 250
            }
        },
        frames: {
            showCopyToClipboardButton: false,
        }
    }),
    ],
    // Astro 7 默认使用新的 Rust Markdown 处理器 Sätteri，不再内置 remark/rehype 管线。
    // 本项目大量依赖自定义 remark/rehype 插件，因此显式切回 unified() 处理器以保持原有行为不变。
    // 需要安装 @astrojs/markdown-remark（已加入 package.json）。
    // 参见: https://docs.astro.build/en/guides/upgrade-to/v7/#new-default-markdown-processor-sätteri
    compressHTML: true, // 保留 Astro 6.x 的空白压缩行为（v7 默认改为 'jsx' 规则，可能吞掉行内元素间的空格）
    markdown: {
        processor: unified({
            remarkPlugins: [
                remarkMath,
                remarkReadingTime,
                remarkExcerpt,
                remarkGithubAdmonitionsToDirectives,
                remarkDirective,
                remarkSectionize,
                parseDirectiveNode,
            ],
            rehypePlugins: [
                rehypeHeadingShift, // 必须放在最前面，将 h1 降级为 h2，避免多个 h1 的 SEO 问题
                rehypeKatex,
                rehypeSlug,
                [rehypeImageFallback, imageFallbackConfig],
                rehypeImageAttrs,
                [
                    rehypeComponents,
                    {
                        components: {
                            github: GithubCardComponent,
                            link: LinkCardComponent,
                            note: (x, y) => AdmonitionComponent(x, y, "note"),
                            tip: (x, y) => AdmonitionComponent(x, y, "tip"),
                            important: (x, y) => AdmonitionComponent(x, y, "important"),
                            caution: (x, y) => AdmonitionComponent(x, y, "caution"),
                            warning: (x, y) => AdmonitionComponent(x, y, "warning"),
                        },
                    },
                ],
                [
                    rehypeExternalLinks,
                    {
                        target: '_blank',
                    },
                ],
                [
                    rehypeAutolinkHeadings,
                    {
                        behavior: "append",
                        properties: {
                            className: ["anchor"],
                        },
                        content: {
                            type: "element",
                            tagName: "span",
                            properties: {
                                className: ["anchor-icon"],
                                "data-pagefind-ignore": true,
                            },
                            children: [
                                {
                                    type: "text",
                                    value: "#",
                                },
                            ],
                        },
                    },
                ],
            ],
        }),
    },
    vite: {
        plugins: [tailwindcss()],
        build: {
            // Vite 8 将默认 CSS 压缩器从 esbuild 换成了 lightningcss，
            // 其解析器对本项目大量使用的 `&` 嵌套选择器（main.css/markdown.css/
            // scrollbar.css 及各组件 <style> 块）报 "Unexpected token Delim('&')"。
            // 显式指回 esbuild 以保持原有 CSS 写法不变。
            // 参见: https://github.com/vitejs/vite/issues/21911
            cssMinify: "esbuild",
            rollupOptions: {
                onwarn(warning, warn) {
                    // temporarily suppress this warning
                    if (
                        warning.message.includes("is dynamically imported by") &&
                        warning.message.includes("but also statically imported by")
                    ) {
                        return;
                    }
                    warn(warning);
                },
            },
        },
    },
});
