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
- **UI/UX**: Dark/Light theme toggle, Page transition animations (Swup), TOC, Sticky posts, **Post sorting** (by published/updated/views with pagination persistence).
- **Content**: Markdown support with math formulae (KaTeX), syntax highlighting (Expressive Code), Mermaid diagrams.
- **Performance/Safety**: Image fallback (Dual CDN), Anti-leech protection, **Real-time CDN Detection** (Cloudflare/EdgeOne/Vercel).
- **SEO/Analytics**: IndexNow integration, Sitemap, RSS, Umami & Google Analytics integration.

---

## Directory Structure & Configuration

### Key Directories
| Directory | Description |
| :--- | :--- |
| `src/config.ts` | **Main Configuration** (Site, Nav, Profile, Feature toggles) |
| `src/content/posts/` | Blog Posts (Markdown) |
| `src/content/spec/` | Special Pages (e.g., About) |
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
