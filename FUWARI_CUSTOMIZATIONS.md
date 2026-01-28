# 🛠️ 其他用户自定义修改指南

如果您 Fork 了本仓库并希望将其定制为您自己的博客，请务必修改以下关键文件。


| 功能模块 | 文件路径 | 代码位置/修改说明 |
| :--- | :--- | :--- |
| **全站基础信息** | `src/config.ts` | 🌟 **核心文件** (第 13-120 行)。修改 `siteConfig` (标题、作者)、`profileConfig` (头像、Bio)、`navBarConfig` (导航链接) 等。 |
| **Umami 统计代码** | `src/layouts/Layout.astro` | ⚠️ **硬编码** (约第 322 行)。搜索 `umami.micostar.cc`，替换为您自己的 Umami 脚本 URL 和 `data-website-id`。 |
| **背景图设置** | `src/config.ts` | `siteConfig.background.src` (约第 39 行)。当前配置为随机图 API (`img.micostar.cc/random`)，可改为静态图片 URL。 |
| **页脚 (Footer)** | `src/components/Footer.astro` | (约第 15-31 行) 修改 ICP备案号 (`鲁ICP备...`)、公网安备号、版权年份 (`startYear`) 以及 "Powered by" 链接。 |
| **访客信息卡片** | `src/components/widget/VisitorInfo.astro` | ⚠️ **硬编码** (约第 220-300 行)。包含经纬度 `BLOGGER_LAT/LON` 设置。**CDN 检测逻辑**位于 `checkCDN` 函数中 (通过 Header 判断)。CDN 图标资源位于 `public/cdn/` (支持 Cloudflare/EdgeOne/Vercel)，可在此处修改判断规则或添加新 CDN。 |
| **友情链接数据** | `src/content/friends/*.md` | 在 `src/content/friends/` 目录下添加/修改 `.md` 文件。首页说明文案在 `src/content/spec/friends.md`。 |
| **个人应用面板** | `src/config.ts` | (约第 58-100 行) 修改 `siteConfig.apps` 数组，配置您自己的自建服务链接与图标。 |
| **防盗链/域名** | `src/config.ts` + `src/layouts/Layout.astro` | ⚠️ **重要：需修改多处！** 详见下方 [防盗链域名配置详解](#防盗链域名配置详解)。 |
| **图床/图片回退** | `src/config.ts` | (约第 142 行) 修改 `imageFallbackConfig`。如果您没有双图床容灾需求，建议将 `enable` 设为 `false`。 |
| **赞赏/捐赠** | `src/pages/donate.astro` | (约第 30-50 行) 替换页面中的微信/支付宝收款码图片路径 (`/donate/wechat.jpg` 等)。 |
| **静态资源/图片** | `public/` | 替换 `public/favicon/` 下的站点图标，以及 `public/images/avatar.webp` (头像) 和 `public/xinghui.avif` (背景图)。 |
| **首页打字机文案** | `src/components/widget/Typewriter.svelte` | ⚠️ **硬编码**(约第 12 行 `const lines` 数组) 如果文案是硬编码的，请在此文件中搜索并替换显示的文本。 |
| **悬浮控制按钮** | `src/components/FloatingControls.svelte` | 右下角悬浮按钮组件，包含排序切换（发布/更新/浏览量）、背景预览、返回顶部功能。排序状态通过 `localStorage` 持久化，换页后自动恢复。 |
| **关于/隐私页面** | `src/pages/about-privacy.astro` | (正文区域) 修改页面内关于隐私政策的具体文本。 |
| **SEO 提交脚本** | `scripts/submit-indexnow.mjs` / `scripts/submit-indexnow-incremental.mjs` | 现改为读取环境变量：`INDEXNOW_KEY`、`INDEXNOW_HOST`（可选 `INDEXNOW_KEY_LOCATION`）。请保留 `public/{key}.txt` 的公开校验文件，并确保它与 `INDEXNOW_KEY` 匹配。 |
| **图片压缩工具** | `scripts/convert-images.ps1` |  PowerShell 脚本。可修改 `$TargetPath` 参数指定扫描目录，默认扫描 `public`。需安装 FFmpeg。 |

---

## 防盗链域名配置详解

> [!CAUTION]
> **必须完整修改以下所有位置**，否则非官网访问会弹出域名安全警告！

本站使用了多层域名保护机制，包括公开配置和加密配置：

### 1️⃣ 公开配置（`src/config.ts`）

**位置**：第 156-160 行

```typescript
export const antiLeechConfig: AntiLeechConfig = {
    enable: true,
    officialSites: [{ url: "https://www.micostar.cc", name: "主站" }],  // ← 修改此处
    // ...
};
```

将 `www.micostar.cc` 替换为您自己的域名。

---

### 2️⃣ 加密配置（`src/layouts/Layout.astro`）

Layout 中有 **两处使用 Base64 加密的域名验证代码**，用于防止简单绕过：

| 位置 | 代码特征 | 当前值 |
|-----|---------|-------|
| 约第 364 行 | `v:['d3d3Lm1pY29zdGFyLmNj']` | `www.micostar.cc` 的 Base64 编码 |
| 约第 500 行 | `v:['d3d3Lm1pY29zdGFyLmNj']` | 同上 |

#### 修改步骤

1. 在 `Layout.astro` 中搜索 `d3d3Lm1pY29zdGFyLmNj`
2. 将两处都替换为您生成的新 Base64 编码值（域名编码而来）

#### 常见域名的 Base64 对照表

| 域名 | Base64 编码 |
|-----|------------|
| `www.micostar.cc` | `d3d3Lm1pY29zdGFyLmNj` |
| `www.example.com` | `d3d3LmV4YW1wbGUuY29t` |
| `blog.example.com` | `YmxvZy5leGFtcGxlLmNvbQ==` |

---

### ✅ 验证修改是否成功

1. 本地运行 `npm run dev`
2. 使用不同域名访问（如 `localhost` 或其他测试域名）
3. 如果没有弹出域名安全警告，说明配置正确


