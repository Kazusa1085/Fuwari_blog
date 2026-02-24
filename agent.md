# Fuwari Project Context for AI Agents

> **File Purpose**: This document consolidates project context for AI agents (Claude, Gemini, etc.) to quickly understand the Fuwari project structure, technology stack, and workflows.

## Project Overview

**Fuwari** is a static blog template built on **Astro**, using **Svelte** and **Tailwind CSS** to achieve high customization, high performance, and beautiful visual effects.

## Core Architecture

### Technology Stack
| Category | Technology |
| :--- | :--- |
| **Framework** | Astro 5.x |
| **Styling** | Tailwind CSS 3.x + Stylus |
| **Interactivity** | Svelte 5.x + Astro |
| **Content** | Astro Content Collections (Markdown) |
| **Package Manager** | pnpm 9.x |
| **Linting/Formatting** | Biome |
| **Type Checking** | TypeScript (Strict Mode) |

### Key Features
- **UI/UX**: Dark/Light theme toggle, Page transition animations (Swup), TOC, Sticky posts, **Post sorting** (by published/updated/views with cross-page navigation; labels: 文章创作时间/文章更新时间/浏览量排序), **Flat navbar links** (all links visible on `lg+`, no dropdown groups), **Reading progress indicator**, **Hot posts page** (`/hot/`) with build-time pageviews sorting.
- **Privacy/Consent**: Cookie consent popup (bottom-right, animated scale-in/out) with bilingual (zh+en) text, dynamic GA/AdSense loading only after consent, Umami always-on (cookie-free), "always remember" checkbox, reset control on privacy page (`/about-privacy/`).
- **Content**: Markdown support with math formulae (KaTeX), syntax highlighting (Expressive Code), Mermaid diagrams.
- **Performance/Safety**: Image fallback (Dual CDN), Anti-leech protection, **Real-time CDN Detection** (Cloudflare/EdgeOne/Vercel).
- **SEO/Analytics**: IndexNow integration, Sitemap, RSS, Umami (pageviews via `/stats` endpoint, always-on, cookie-free) & Google Analytics + AdSense (consent-gated, dynamically injected after user accepts), Canonical URLs, Open Graph & Twitter Card meta tags, JSON-LD structured data.
- **Cookie Consent** (`src/layouts/Layout.astro`): Bottom-right animated popup (scale-in on load, keyframe shrink-out on dismiss). `localStorage` key `cookie-consent` stores `accepted`/`rejected`/`always-accepted`/`always-rejected`. GA (`G-68S9RLWRP0`) and AdSense (`ca-pub-2234222684256085`) scripts are dynamically injected only when accepted. Umami is unconditional. Reset UI available at `/about-privacy/`.

---

## Directory Structure & Configuration

### Key Directories
| Directory | Description |
| :--- | :--- |
| `src/config.ts` | **Main Configuration** (Site, Nav, Profile, Feature toggles) |
| `src/content/posts/` | Blog Posts (Markdown) |
| `src/content/spec/` | Special Pages (e.g., About) |
| `src/content/friends/` | Friend Links (JSON + `_order.json` for sorting) |
| `src/content/config.ts` | Content Collections Schema |
| `src/components/` | UI Components (Astro + Svelte) |
| `src/layouts/` | Page Layouts |
| `src/pages/` | Routing Pages & API Endpoints |
| `src/plugins/` | Custom Remark/Rehype Plugins |
| `src/styles/` | Global Styles |
| `src/utils/` | Utility Functions |
| `public/` | Static Assets |
| `scripts/` | Tool scripts (Migration, IndexNow submission) |

### Key Configuration Files
| File | Description |
| :--- | :--- |
| `astro.config.mjs` | Astro Project Config |
| `src/config.ts` | User Configuration Entry Point |
| `src/content/config.ts` | Content Collections Schema |
| `tailwind.config.cjs` | Tailwind CSS Config |

### Content Collections Schema
| Collection | Description | Key Fields |
| :--- | :--- | :--- |
| `posts` | Blog Posts | `title`, `published`, `updated`, `draft`, `description`, `image`, `tags`, `lang`, `pinned` |
| `spec` | Special Pages | `title`, `published`, `updated`, `draft` |
| `assets` | Asset Data | `title`, `description` |
| `friends` | Friend Links | `name`, `url`, `avatar`, `introduction`, `friendsPage` |

---

## Development Workflow

### Prerequisites
- Node.js 18+ (LTS)
- pnpm 9+

### Common Commands
| Command | Description |
| :--- | :--- |
| `pnpm install` | Install dependencies |
| `pnpm dev` | Start dev server (`localhost:4321`) |
| `pnpm build` | Build production version to `./dist/` |
| `pnpm preview` | Preview production build |
| `pnpm new-post <filename>` | Create new post from template |
| `pnpm lint` | Biome code check |
| `pnpm format` | Biome code format |
| `pnpm type-check` | TypeScript type check |

### Creating Content
Posts are located in `src/content/posts/`.
**Frontmatter Example:**
```yaml
---
title: "Post Title"           # Required
published: 2023-01-01         # Required (YYYY-MM-DD)
updated: 2023-01-02           # Optional
draft: false                  # Optional
description: "Summary"        # Optional
image: "./cover.jpg"          # Optional
tags: ["Tag1", "Tag2"]        # Optional
category: "Category"          # Optional
pinned: false                 # Optional: Pin to top
prerenderAll: false           # Optional: Pre-render content (for long posts)
lang: zh_CN                   # Optional
---
```

---

## Friend Links Automation

### Data Structure
Each friend link is a JSON file in `src/content/friends/`:
```json
{
  "name": "Site Name",
  "url": "https://example.com",
  "avatar": "https://example.com/avatar.png",
  "introduction": "Short description",
  "friendsPage": "https://example.com/friends/"
}
```

### Sorting
- `src/content/friends/_order.json`: Array of friend IDs controlling display order (earliest added first).
- `src/pages/friends.astro`: Reads `_order.json` for sorting; entries not in the array appear last.
- The `_` prefix ensures Astro ignores it as a collection entry.

### GitHub Actions Auto-Merge (`friends-auto-merge.yml`)
| Step | Description |
| :--- | :--- |
| **Verify Changed Files** | Whitelist check: only `src/content/friends/<name>.json` allowed; `_order.json` modification blocked |
| **Validate JSON Content** | Schema validation (required fields, URL format, XSS check, no extra fields, 2KB size limit) |
| **Check Backlink** | Fetches `friendsPage` URL, checks for `href` containing `www.micostar.cc` |
| **Build Check** | Runs `pnpm build` to verify no build errors |
| **Auto Merge** | Squash merge with welcome message |
| **Update Order** | Appends new friend ID to `_order.json` and pushes to main |
| **Comment on PR** | Posts backlink check results and success/failure details |

- **Trigger**: `pull_request_target` with `types: [opened, synchronize]`.
- **Security**: Checkout base first for file verification, then PR head for content validation. `pnpm install --frozen-lockfile` prevents lockfile tampering.

---

## IndexNow Integration
Fuwari integrates IndexNow to automatically submit URLs to search engines (Bing, Yandex, etc.).

### Commands
- `pnpm submit-indexnow`: Submit all URLs (no build).
- `pnpm submit-indexnow-inc`: **Incremental submit** (new URLs only).
- `pnpm submit-indexnow-force`: Force submit all URLs.
- `pnpm indexnow-status`: Check submission status.

### Implementation
- **Scripts**: `scripts/submit-indexnow*.mjs`
- **API**: `src/pages/api/indexnow.ts`
- **State**: `.indexnow-submitted.json` (Do not commit)

---

## Integrations & Plugins

### Markdown & Content (Remark/Rehype)
- **Math**: `remark-math` + `rehype-katex`
- **Code**: Expressive Code (GitHub Dark theme) with custom plugins:
    - Collapsible sections
    - Line numbers
    - Custom copy button
- **Content**:
    - `remark-reading-time` (Reading time)
    - `rehype-slug` & `rehype-autolink-headings` (Anchors)
    - Custom components: GitHub Cards, Admonitions

### Mermaid Diagrams
Implemented in `src/pages/posts/[...slug].astro`.
- **Features**: Async loading, theme synchronization, Swup compatibility, Details tag support.

### Image Handling
- **Image Fallback**: Custom rehype plugin `rehype-image-fallback`.
    - Automatically switches to backup CDN if main CDN fails.
    - Configured in `src/config.ts` (`imageFallbackConfig`).
- **Anti-Leech**: Configured via `antiLeechConfig`.

---

## Deployment
- **Output**: `./dist/`
- **Vercel Config**: `vercel.json` included (Security headers, caching, URL rewrites).
- **Environment**: Requires Node 18+.

## Development Conventions
- **Styling**: Use Tailwind CSS utilities. Custom styles in `src/styles/`.
- **Logic**: Use Svelte for interactivity, Astro for static content.
- **Path Aliases**:
    - `@components/*` -> `src/components/*`
    - `@utils/*` -> `src/utils/*`
    - `@assets/*` -> `src/assets/*`
    - `@/*` -> `src/*`

---

## Navigation Architecture

### Navbar Layout
The navbar displays all links flat on `lg+` screens (no dropdown groups). Title is on the left, links are centered (`flex-grow justify-center`), controls are on the right. On smaller screens, links collapse into a hamburger menu.

| File | Role |
| :--- | :--- |
| `src/types/config.ts` | Defines `NavBarLink`, `NavBarGroup`, `NavBarConfig` types |
| `src/config.ts` | Configures nav links as flat array (Stats, Status, Monitor listed individually) |
| `src/components/Navbar.astro` | Renders links centered on `lg+`, hamburger menu on `<lg` |
| `src/components/widget/NavMenuPanel.astro` | Mobile hamburger menu |

- **Desktop (`lg+`)**: Links use `flex-grow justify-center` for centered layout. Hamburger button hidden via `lg:!hidden`.
- **Mobile (`<lg`)**: Links hidden, hamburger menu shown. Spacer (`flex-grow lg:hidden`) keeps title and controls apart.
- **Swup**: Mobile toggle JS re-binds on `swup:contentReplaced` event. Uses `data-bound` attribute to prevent duplicate event listener binding.

### Post Sorting & Hot Pages
Sorting is handled via `FloatingControls.svelte` with three modes: published, updated, views.

| Mode | Label | Behavior |
| :--- | :--- | :--- |
| `published` | 文章创作时间 | Default on `/`. If saved mode is `views` (came from `/hot/`), resets to `published`. |
| `updated` | 文章更新时间 | Client-side DOM sort (current page only) |
| `views` | 浏览量排序 | Navigates to `/hot/` (build-time sorted by pageviews) |

- **`/hot/` pages** (`src/pages/hot/[...page].astro`): Static pages sorted by Umami pageviews descending (pinned posts first). Uses `getWritingStats().allPostViews` for sort data.
- **Cross-page toast**: `sessionStorage` stores toast message before navigation; `onMount` reads and displays it on the target page.
- **Umami data**: `src/utils/writing-stats.ts` fetches per-post pageviews via `/stats?path=` endpoint (not `/metrics` which returns visitors). Exports `allPostViews: { slug, views }[]`.
- **Auto-redeploy**: GitHub Actions workflow (`.github/workflows/hot-ranking-check.yml`) runs daily at UTC 16:00 (Beijing 0:00). Fetches Umami pageviews for all posts, compares top 5 ranking against `.hot-ranking-cache.txt`. If changed, updates cache and pushes a commit to trigger redeployment.

### Reading Progress
Shared state in `src/stores/readingProgress.ts` drives multiple display components.

| Component | Location | Visibility |
| :--- | :--- | :--- |
| `ReadingProgressCard.svelte` | Right-side TOC panel (above TOC list) in `MainGridLayout.astro` | Desktop (`2xl+`), post pages only |
| `ReadingProgressMobile.svelte` | `Layout.astro` (fixed top bar) | Mobile & Tablet (`<2xl`), post pages only, appears after sidebar scrolls out |

- **TOC panel layout** (`MainGridLayout.astro`): `toc-inner-wrapper` uses `flex flex-col`; `ReadingProgressCard` sits above `#toc` which has `flex-1 overflow-y-scroll`.
- **CSS mask** (`src/styles/main.css`): Fade gradient applied to `#toc-inner-wrapper #toc` (not the wrapper itself) to avoid affecting the progress card.

---

## SEO Architecture

### Meta Tags (`src/layouts/Layout.astro`)
- **Canonical URL**: `<link rel="canonical" href={Astro.url} />` on all pages.
- **Open Graph**: `og:site_name`, `og:url`, `og:title`, `og:description`, `og:type` (article/website).
- **og:image / twitter:image**: Only rendered on post pages when the post has a cover image (`banner` prop). The original `banner` value is saved as `ogImage` before being overridden by `siteConfig.banner.src`, then resolved to a full URL via `new URL(banner, Astro.site)`.
- **Twitter Card**: `summary_large_image` card type with title, description, URL.

### JSON-LD Structured Data (`src/pages/posts/[...slug].astro`)
- Each post page includes a `BlogPosting` JSON-LD script with: `headline`, `description`, `keywords`, `author`, `datePublished`, `inLanguage`, and `image` (when post has a cover image, resolved via `new URL(entry.data.image, Astro.site)`).

### Heading Hierarchy
- **rehype-heading-shift** plugin (`src/plugins/rehype-heading-shift.mjs`): Shifts all Markdown headings down one level (h1→h2, h2→h3, etc.) to ensure only one `<h1>` per page (the post title rendered by the template).
- **Note**: This plugin only processes Markdown-generated headings. Raw HTML `<h1>` tags in Markdown files are NOT shifted — avoid using `<h1>` in post content.

### Image Alt Attributes
- **Post cover images**: `ImageWrapper` in `[...slug].astro` receives `alt={entry.data.title}`.
- **Post cards**: `PostCard.astro` passes `alt={title}` to `ImageWrapper`.
- **Banner**: `MainGridLayout.astro` passes `alt` with site title to `ImageWrapper`.
- **Content images**: All `<img>` tags in Markdown posts must include meaningful `alt` attributes. Empty `alt=""` or missing `alt` will trigger SEO warnings.

### Sitemap & robots.txt
- **Sitemap**: Auto-generated by `@astrojs/sitemap` → `sitemap-index.xml` (entry point) + `sitemap-0.xml`.
- **robots.txt**: Generated by `src/pages/robots.txt.ts`, references `sitemap-index.xml`.
- **Submit**: Use `sitemap-index.xml` when submitting to search engines.
